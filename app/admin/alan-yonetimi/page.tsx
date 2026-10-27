"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { Alert, Button, Card, PageHeader } from '@/components/admin/ui';
import { useApi, useMe, useNotice, ErrorState, LoadingRows, ProgressBar, Stat } from '@/components/admin/ops-kit';
import { DataList, type ListColumn } from '@/components/admin/list/DataList';
import { BuildingForm } from '@/components/admin/facilities/forms';
import { RowActions, useFacilityLookups, fmtArea, fmtPct } from '@/components/admin/facilities/shared';

type Occ = { rentableUnits: number; occupiedUnits: number; byCountPct: number | null; rentableArea: number; occupiedArea: number; byAreaPct: number | null };
type Row = { id: string; name: string; address: string | null; totalArea: number | null; leasableArea: number | null; floorCount: number; unitCount: number; occupancy: Occ; isArchived: boolean; updatedAt: string };
type Summary = { occupancy: Occ & { totalUnits: number; maintenance: number; reserved: number; available: number }; expiringPolicies: unknown[]; expiryWarningDays: { value: number; isDefault: boolean }; unlinkedActiveAssignments: number };

export default function BuildingsPage() {
    const { can } = useMe();
    const notice = useNotice();
    const lookups = useFacilityLookups();
    const summary = useApi<{ summary: Summary }>('/api/admin/facility-units/summary');
    const [editing, setEditing] = useState<Row | 'new' | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const changed = () => { setReloadKey((k) => k + 1); summary.reload(); lookups.reload(); };
    const s = summary.data?.summary;

    const columns: ListColumn<Row>[] = [
        { key: 'name', label: 'Bina / alan', sortable: true, render: (r) => <span className="font-medium text-white">{r.name}</span> },
        { key: 'address', label: 'Adres', sortable: true, render: (r) => r.address ?? '—', className: 'min-w-[12rem] text-gray-400' },
        { key: 'totalArea', label: 'Toplam', sortable: true, align: 'right', render: (r) => fmtArea(r.totalArea) },
        { key: 'leasableArea', label: 'Kiralanabilir', sortable: true, align: 'right', render: (r) => fmtArea(r.leasableArea) },
        { key: 'floorCount', label: 'Kat', sortable: true, align: 'right', render: (r) => <Link className="text-primary hover:underline" href={`/admin/alan-yonetimi/katlar?buildingId=${r.id}`}>{r.floorCount}</Link> },
        { key: 'unitCount', label: 'Bölüm', sortable: true, align: 'right', render: (r) => <Link className="text-primary hover:underline" href={`/admin/alan-yonetimi/bolumler?buildingId=${r.id}`}>{r.unitCount}</Link> },
        { key: 'byCountPct', label: 'Doluluk (bölüm)', sortable: true, align: 'right', render: (r) => `${fmtPct(r.occupancy.byCountPct)} · ${r.occupancy.occupiedUnits}/${r.occupancy.rentableUnits}` },
        { key: 'byAreaPct', label: 'Doluluk (m²)', sortable: true, align: 'right', render: (r) => fmtPct(r.occupancy.byAreaPct) },
    ];

    return (
        <div className="space-y-5">
            <PageHeader icon={Building2} title="Alan - Bina Detay"
                description="Kalıcı ofis tahsisi için bina, kat ve bağımsız bölümler. Toplantı odası rezervasyonu ve halka açık tesis kartları Alanlar & Rezervasyon ekranındadır."
                actions={can('create', 'facilities') && <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Bina Ekle</Button>} />

            {s && s.unlinkedActiveAssignments > 0 && can('view', 'rent') && (
                <Alert tone="warning" title={`${s.unlinkedActiveAssignments} aktif tahsiste kira sözleşmesi bağlı değil`}>
                    <Link className="underline" href="/admin/alan-yonetimi/eslestirme?state=ACTIVE">Firma - Bölüm Eşleştirme</Link> ekranından mevcut sözleşmeyi tek tıkla bağlayın veya yeni sözleşme oluşturun.
                </Alert>
            )}

            {summary.error ? <Card padded={false}><ErrorState error={summary.error} onRetry={summary.reload} /></Card> : !s ? <Card padded={false}><LoadingRows rows={2} /></Card> : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
                        <p className="text-xs text-gray-400">Doluluk (bölüm sayısı)</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums text-white sm:text-xl">{fmtPct(s.occupancy.byCountPct)}</p>
                        <ProgressBar value={s.occupancy.byCountPct ?? 0} />
                        <p className="mt-1 text-xs text-gray-500">{s.occupancy.occupiedUnits} / {s.occupancy.rentableUnits} bölüm · {s.occupancy.available} boş</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
                        <p className="text-xs text-gray-400">Doluluk (m²)</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums text-white sm:text-xl">{fmtPct(s.occupancy.byAreaPct)}</p>
                        <ProgressBar value={s.occupancy.byAreaPct ?? 0} />
                        <p className="mt-1 text-xs text-gray-500">{fmtArea(s.occupancy.occupiedArea)} / {fmtArea(s.occupancy.rentableArea)}</p>
                    </div>
                    <Stat label="Bakımda / rezerve" value={`${s.occupancy.maintenance} / ${s.occupancy.reserved}`} hint={`${s.occupancy.totalUnits} bölüm (ortak alanlar dahil)`} />
                    <Stat label={`Bitişi ${s.expiryWarningDays.value} gün içinde poliçe`} value={s.expiringPolicies.length} tone={s.expiringPolicies.length ? 'warn' : 'default'} hint={s.expiryWarningDays.isDefault ? 'Varsayılan süre; Poliçeler → Ayarlar' : undefined} />
                </div>
            )}
            <p className="text-xs text-gray-500">Doluluk hesabına ortak alanlar ve arşivlenmiş bölümler katılmaz. Bölüm sayısı ve m² ölçüleri birlikte gösterilir.</p>

            <DataList<Row> endpoint="/api/admin/facility-units/buildings" label="Binalar" columns={columns} searchPlaceholder="Bina adı veya adres"
                canExport={can('export', 'facilities')} reloadKey={reloadKey}
                empty={{ title: 'Henüz bina yok', description: 'Önce bina veya alan ekleyin; ardından kat ve bağımsız bölümleri tanımlayın.', action: can('create', 'facilities') ? <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Bina Ekle</Button> : undefined }}
                rowActions={(r) => <RowActions kind="buildings" row={r} label={r.name} canEdit={can('update', 'facilities')} canArchive={can('delete', 'facilities')} onEdit={() => setEditing(r)} onChanged={changed} notify={notice} />} />

            {editing && lookups.data && <BuildingForm row={editing === 'new' ? undefined : editing} lookups={lookups.data.lookups} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); notice.success(m); changed(); }} />}
            {notice.node}
        </div>
    );
}
