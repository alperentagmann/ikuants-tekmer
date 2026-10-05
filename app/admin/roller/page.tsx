'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Plus, Save, Shield, Trash2, Users } from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Skeleton, TextArea, TextInput } from '@/components/admin/ui';
import { PermissionMatrix, type CatalogPermission } from '@/components/admin/users/PermissionMatrix';

interface Role {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isSystem: boolean;
    permissions: { permissionId: string; permission: { id: string; action: string; resource: string } }[];
    _count: { userRoles: number };
}

/**
 * Roles & permissions: edit what each role may do, create custom roles (e.g. "Muhasebe",
 * "Kurumsal İletişim"). Individual exceptions are set per user in Kullanıcılar › Yetkiler.
 */
export default function RolesPage() {
    const [roles, setRoles] = useState<Role[] | null>(null);
    const [catalog, setCatalog] = useState<CatalogPermission[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState<{ name: string; description: string; perms: Set<string> } | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '', copyFrom: '' });
    const [busy, setBusy] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    const load = useCallback(async (keepId?: string) => {
        try {
            const d = await api<{ roles: Role[]; permissions: CatalogPermission[] }>('/api/admin/roles');
            setRoles(d.roles);
            setCatalog(d.permissions);
            const pick = d.roles.find((r) => r.id === keepId) || d.roles.find((r) => r.slug !== 'super-admin') || d.roles[0];
            if (pick) {
                setSelectedId(pick.id);
                setDraft({ name: pick.name, description: pick.description || '', perms: new Set(pick.permissions.map((p) => p.permissionId)) });
            }
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Roller yüklenemedi' });
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(), 0);
        return () => clearTimeout(t);
    }, [load]);

    const selected = useMemo(() => roles?.find((r) => r.id === selectedId) || null, [roles, selectedId]);
    const dirty = useMemo(() => {
        if (!selected || !draft) return false;
        const orig = new Set(selected.permissions.map((p) => p.permissionId));
        return draft.name !== selected.name || draft.description !== (selected.description || '') || orig.size !== draft.perms.size || Array.from(draft.perms).some((id) => !orig.has(id));
    }, [selected, draft]);

    if (!roles) return <Skeleton rows={8} />;

    const choose = (r: Role) => {
        if (dirty && !window.confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam edilsin mi?')) return;
        setSelectedId(r.id);
        setDraft({ name: r.name, description: r.description || '', perms: new Set(r.permissions.map((p) => p.permissionId)) });
    };

    const run = async (key: string, fn: () => Promise<unknown>, ok: string, keepId?: string) => {
        setBusy(key);
        try {
            await fn();
            setNotice({ tone: 'success', text: ok });
            await load(keepId);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
        } finally {
            setBusy(null);
        }
    };

    const isSuper = selected?.slug === 'super-admin';

    return (
        <div className="space-y-5">
            <PageHeader
                title="Roller & Yetkiler"
                icon={Shield}
                description="Her rolün hangi modülde neler yapabileceğini belirleyin. Kişiye özel istisnalar Kullanıcılar › Yetkiler sekmesinden verilir. Tüm değişiklikler denetim kaydına yazılır."
                actions={<Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Yeni rol</Button>}
            />
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                <Card padded={false} className="h-fit">
                    <ul className="divide-y divide-white/5">
                        {roles.map((r) => (
                            <li key={r.id}>
                                <button type="button" onClick={() => choose(r)} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${r.id === selectedId ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
                                    {r.slug === 'super-admin' ? <Crown className="mt-0.5 h-4 w-4 text-amber-300" /> : <Shield className="mt-0.5 h-4 w-4 text-primary" />}
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-white">{r.name}</span>
                                        <span className="block text-[11px] text-gray-500">{r.slug === 'super-admin' ? 'Tam yetki' : `${r.permissions.length} izin`} · {r._count.userRoles} kullanıcı{r.isSystem ? '' : ' · özel'}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>

                {selected && draft ? (
                    <Card>
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                <Field label="Rol adı" htmlFor="role-name"><TextInput id="role-name" value={draft.name} disabled={isSuper} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
                                <Field label="Açıklama" htmlFor="role-desc"><TextInput id="role-desc" value={draft.description} disabled={isSuper} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Badge tone="neutral"><Users className="mr-1 inline h-3 w-3" />{selected._count.userRoles}</Badge>
                                {!selected.isSystem && <Button variant="danger" icon={Trash2} loading={busy === 'delete'} onClick={() => window.confirm(`"${selected.name}" rolü silinsin mi?`) && run('delete', () => api(`/api/admin/roles/${selected.id}`, { method: 'DELETE' }), 'Rol silindi.')}>Sil</Button>}
                                {!isSuper && <Button variant="primary" icon={Save} disabled={!dirty} loading={busy === 'save'} onClick={() => run('save', () => api(`/api/admin/roles/${selected.id}`, { method: 'PUT', json: { name: draft.name, description: draft.description, permissionIds: Array.from(draft.perms) } }), 'Rol kaydedildi.', selected.id)}>Kaydet</Button>}
                            </div>
                        </div>
                        {isSuper ? (
                            <Alert tone="warning" title="Süper Yönetici">Bu rol tüm modüllere tam erişir ve değiştirilemez. T.C. kimlik görüntüleme gibi hassas işlemler yine de açık izin gerektirir.</Alert>
                        ) : (
                            <PermissionMatrix mode="role" catalog={catalog} selected={draft.perms} onToggle={(id, on) => { const n = new Set(draft.perms); if (on) n.add(id); else n.delete(id); setDraft({ ...draft, perms: n }); }} />
                        )}
                    </Card>
                ) : (
                    <EmptyState icon={Shield} title="Rol seçin" description="Soldan bir rol seçerek izinlerini düzenleyin." />
                )}
            </div>

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Yeni rol"
                description="Örn: Muhasebe, Kurumsal İletişim, Tanıtım, Uzman. Mevcut bir rolün izinleriyle başlayabilirsiniz."
                footer={<><Button onClick={() => setCreateOpen(false)}>Vazgeç</Button><Button variant="primary" loading={busy === 'create'} disabled={newRole.name.trim().length < 2} onClick={() => { const base = roles.find((r) => r.id === newRole.copyFrom); run('create', async () => { await api('/api/admin/roles', { method: 'POST', json: { name: newRole.name, description: newRole.description, permissionIds: base ? base.permissions.map((p) => p.permissionId) : [] } }); setCreateOpen(false); setNewRole({ name: '', description: '', copyFrom: '' }); }, 'Rol oluşturuldu. İzinlerini düzenleyebilirsiniz.'); }}>Oluştur</Button></>}
            >
                <div className="space-y-3">
                    <Field label="Rol adı" htmlFor="nr-name" required><TextInput id="nr-name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} /></Field>
                    <Field label="Açıklama" htmlFor="nr-desc"><TextArea id="nr-desc" rows={2} value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} /></Field>
                    <Field label="İzinleri kopyala (opsiyonel)" htmlFor="nr-copy">
                        <select id="nr-copy" value={newRole.copyFrom} onChange={(e) => setNewRole({ ...newRole, copyFrom: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                            <option value="" className="bg-[#0f0f1a]">Boş başla</option>
                            {roles.filter((r) => r.slug !== 'super-admin').map((r) => <option key={r.id} value={r.id} className="bg-[#0f0f1a]">{r.name}</option>)}
                        </select>
                    </Field>
                </div>
            </Modal>
        </div>
    );
}
