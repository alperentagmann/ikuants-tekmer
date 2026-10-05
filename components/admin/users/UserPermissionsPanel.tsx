'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Crown, Save, ShieldCheck } from 'lucide-react';
import { api, Alert, Badge, Button, Skeleton } from '@/components/admin/ui';
import { PermissionMatrix, type CatalogPermission, type OverrideState } from './PermissionMatrix';

interface State {
    user: { id: string; name: string; isSuperAdmin: boolean };
    roles: { id: string; name: string; slug: string }[];
    rolePermissionIds: string[];
    overrides: { permissionId: string; state: OverrideState }[];
    catalog: CatalogPermission[];
    canManage: boolean;
}

/** Personal permissions of one admin: role defaults plus individual grants / denials. */
export function UserPermissionsPanel({ userId }: { userId: string }) {
    const [state, setState] = useState<State | null>(null);
    const [overrides, setOverrides] = useState<Map<string, OverrideState>>(new Map());
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const d = await api<State>(`/api/admin/users/${userId}/permissions`);
            setState(d);
            setOverrides(new Map(d.overrides.map((o) => [o.permissionId, o.state])));
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Yetkiler yüklenemedi' });
        }
    }, [userId]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    if (!state) return notice ? <Alert tone="danger">{notice.text}</Alert> : <Skeleton rows={6} />;

    if (state.user.isSuperAdmin) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <p>Süper Yönetici tüm modüllere erişir; kişisel yetki kısıtlaması uygulanmaz. T.C. kimlik görüntüleme gibi hassas işlemler yine de açık <code>persons:identity_view</code> izni gerektirir.</p>
            </div>
        );
    }

    const save = async () => {
        setSaving(true);
        try {
            const original = new Map(state.overrides.map((o) => [o.permissionId, o.state]));
            const changed = state.catalog.filter((p) => (overrides.get(p.id) || 'inherit') !== (original.get(p.id) || 'inherit')).map((p) => ({ permissionId: p.id, state: overrides.get(p.id) || 'inherit' }));
            await api(`/api/admin/users/${userId}/permissions`, { method: 'PUT', json: { overrides: changed } });
            setNotice({ tone: 'success', text: `${changed.length} yetki değişikliği kaydedildi.` });
            await load();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
        } finally {
            setSaving(false);
        }
    };

    const grants = Array.from(overrides.values()).filter((s) => s === 'grant').length;
    const denies = Array.from(overrides.values()).filter((s) => s === 'deny').length;

    return (
        <div className="space-y-4">
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                <ShieldCheck className="h-4 w-4 text-primary" /> Roller:
                {state.roles.length ? state.roles.map((r) => <Badge key={r.id} tone="primary">{r.name}</Badge>) : <span className="text-gray-500">Rol atanmamış</span>}
                <span className="ml-auto text-gray-500">{grants} ek yetki · {denies} engel</span>
            </div>
            {!state.canManage && <Alert tone="info">Görüntüleme modundasınız. Yetki değiştirmek için roles:manage izni gerekir.</Alert>}
            <PermissionMatrix mode="user" catalog={state.catalog} inherited={new Set(state.rolePermissionIds)} overrides={overrides} readOnly={!state.canManage} onChange={(id, s) => setOverrides((m) => new Map(m).set(id, s))} />
            {state.canManage && (
                <div className="flex justify-end">
                    <Button variant="primary" icon={Save} loading={saving} onClick={save}>Yetkileri kaydet</Button>
                </div>
            )}
        </div>
    );
}
