'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, Field, Modal, Select, TextArea, TextInput } from '@/components/admin/ui';

type Placement = { id: string; targetType: string; targetId: string | null; title: string | null; description: string | null; isActive: boolean; targetLabel: string; targetName: string | null; href: string | null };
type Target = { value: string; label: string; needsTarget: boolean };

/** Shows the form on other pages: program pages, supports/spaces pages, a standalone link. */
export function PlacementsPanel({ formId, formSlug, isPublished }: { formId: string; formSlug: string; isPublished: boolean }) {
    const [items, setItems] = useState<Placement[] | null>(null);
    const [targets, setTargets] = useState<Target[]>([]);
    const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ targetType: 'STANDALONE', targetId: '', title: '', description: '' });
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const d = await api<{ placements: Placement[]; targets: Target[]; programs: { id: string; name: string }[] }>(`/api/admin/forms/${formId}/placements`);
            setItems(d.placements);
            setTargets(d.targets);
            setPrograms(d.programs);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Yerleşimler alınamadı');
            setItems([]);
        }
    }, [formId]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const create = async () => {
        setBusy(true);
        setError(null);
        try {
            await api(`/api/admin/forms/${formId}/placements`, { method: 'POST', json: form });
            setOpen(false);
            setForm({ targetType: 'STANDALONE', targetId: '', title: '', description: '' });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Eklenemedi');
        } finally {
            setBusy(false);
        }
    };
    const patch = async (id: string, body: Record<string, unknown>) => {
        try {
            await api(`/api/admin/forms/${formId}/placements`, { method: 'PATCH', json: { id, ...body } });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Güncellenemedi');
        }
    };
    const remove = async (id: string) => {
        if (!window.confirm('Bu yerleşim kaldırılsın mı? Form kendi sayfasında kalır.')) return;
        try {
            await api(`/api/admin/forms/${formId}/placements?id=${id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Kaldırılamadı');
        }
    };

    const selectedTarget = targets.find((t) => t.value === form.targetType);

    return (
        <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white"><LayoutTemplate className="h-4 w-4 text-primary" /> Başka sayfalara yerleştir</div>
                    <p className="text-xs text-gray-400">Formu program detay sayfası, destekler veya kullanım alanları sayfasında ya da paylaşılabilir bağımsız bir sayfada gösterin. Ana sayfaya eklemek için Ana Sayfa › Tasarım Stüdyosu › Form bölümünü kullanın.</p>
                </div>
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setOpen(true)}>Yerleşim ekle</Button>
            </div>
            {!isPublished && <div className="mb-3"><Alert tone="warning">Form yayında olmadığı için yerleşimler public sitede görünmez.</Alert></div>}
            {error && <div className="mb-3"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}
            {items && items.length === 0 ? (
                <EmptyState icon={LayoutTemplate} title="Ek yerleşim yok" description={`Bağımsız sayfa eklerseniz form /formlar/${formSlug} adresinde de yayınlanır.`} />
            ) : (
                <ul className="divide-y divide-white/5">
                    {(items || []).map((p) => (
                        <li key={p.id} className={`flex flex-wrap items-center justify-between gap-2 py-3 ${p.isActive ? '' : 'opacity-50'}`}>
                            <div className="min-w-0">
                                <Badge tone="primary">{p.targetLabel}</Badge>
                                {p.targetName && <span className="ml-2 text-sm text-gray-200">{p.targetName}</span>}
                                {p.title && <div className="mt-1 text-xs text-gray-400">Başlık: {p.title}</div>}
                            </div>
                            <div className="flex items-center gap-1.5">
                                {p.href && <a href={p.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white">{p.href} <ExternalLink className="h-3 w-3" /></a>}
                                <Button size="sm" variant="ghost" icon={p.isActive ? EyeOff : Eye} onClick={() => patch(p.id, { isActive: !p.isActive })}>{p.isActive ? 'Gizle' : 'Göster'}</Button>
                                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(p.id)}>Kaldır</Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal open={open} onClose={() => setOpen(false)} title="Yerleşim ekle" footer={<><Button onClick={() => setOpen(false)}>Vazgeç</Button><Button variant="primary" loading={busy} onClick={create}>Ekle</Button></>}>
                <div className="space-y-4">
                    <Field label="Nerede gösterilsin?" required>
                        <Select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value, targetId: '' })} options={targets.map((t) => ({ value: t.value, label: t.label }))} />
                    </Field>
                    {selectedTarget?.needsTarget && (
                        <Field label="Program" required>
                            <Select value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} placeholder="Program seçin" options={programs.map((p) => ({ value: p.id, label: p.name }))} />
                        </Field>
                    )}
                    <Field label="Başlık (opsiyonel)" hint="Boşsa form adı kullanılır."><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                    <Field label="Açıklama (opsiyonel)"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                </div>
            </Modal>
        </Card>
    );
}
