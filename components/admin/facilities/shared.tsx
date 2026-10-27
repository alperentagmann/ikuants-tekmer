"use client";
import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil } from 'lucide-react';
import { Badge, Button } from '@/components/admin/ui';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { api, useApi } from '@/components/admin/ops-kit';

export type Opt = { value: string; label: string };
export type Lookups = {
    buildings: { id: string; name: string }[];
    floors: { id: string; name: string; buildingId: string }[];
    units: { id: string; code: string; unitType: string; area: number; floorId: string; buildingId: string; label: string }[];
    entrepreneurs: { id: string; name: string }[];
    organizations: { id: string; name: string }[];
    rentContracts: { id: string; contractNo: string; spaceName: string; entrepreneurId: string; status: string; unitId: string | null }[] | null;
    policyTypes: Opt[];
    unitTypes: Opt[];
    unitStatuses: Opt[];
    expiryWarningDays: { value: number; isDefault: boolean };
};

export function useFacilityLookups() {
    return useApi<{ lookups: Lookups }>('/api/admin/facility-units/lookups');
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
export const STATUS_TONE: Record<string, Tone> = {
    AVAILABLE: 'success', OCCUPIED: 'info', MAINTENANCE: 'warning', RESERVED: 'primary',
    ACTIVE: 'success', UPCOMING: 'neutral', ENDED: 'neutral', CANCELLED: 'neutral', EXPIRING: 'warning', EXPIRED: 'danger',
};
export const StatePill = ({ state, label }: { state: string; label: string }) => <Badge tone={STATUS_TONE[state] ?? 'neutral'}>{label}</Badge>;

export const fmtArea = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n)} m²`);
export const fmtPct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n)}`);

/** Düzenle + arşivle / geri al. Kalıcı silme yok. */
export function RowActions({ kind, row, label, canEdit, canArchive, onEdit, onChanged, notify }: {
    kind: string; row: { id: string; isArchived?: boolean }; label: string; canEdit: boolean; canArchive: boolean;
    onEdit?: () => void; onChanged: () => void; notify: { success: (m: string) => void; error: (m: string) => void };
}) {
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const toggle = async () => {
        setBusy(true);
        try {
            await api(`/api/admin/facility-units/${kind}/${row.id}`, { method: 'PATCH', json: { archived: !row.isArchived } });
            notify.success(row.isArchived ? `${label} geri alındı.` : `${label} arşivlendi.`);
            onChanged();
        } catch (e) {
            notify.error((e as Error).message);
        } finally {
            setBusy(false);
            setConfirm(false);
        }
    };
    return (
        <div className="inline-flex items-center gap-1">
            {canEdit && !row.isArchived && onEdit && <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit} aria-label={`${label} düzenle`}>Düzenle</Button>}
            {canArchive && (row.isArchived
                ? <Button size="sm" variant="ghost" icon={ArchiveRestore} onClick={toggle} loading={busy} aria-label={`${label} geri al`}>Geri al</Button>
                : <Button size="sm" variant="ghost" icon={Archive} onClick={() => setConfirm(true)} aria-label={`${label} arşivle`}>Arşivle</Button>)}
            <ConfirmDialog isOpen={confirm} title={`${label} arşivlensin mi?`} description="Kayıt silinmez; Arşivdekileri göster ile bulunup geri alınabilir." confirmText="Arşivle" isDestructive={false} onConfirm={toggle} onCancel={() => setConfirm(false)} />
        </div>
    );
}
