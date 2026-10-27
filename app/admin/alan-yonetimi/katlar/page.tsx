"use client";
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layers, Plus } from 'lucide-react';
import { Button, PageHeader } from '@/components/admin/ui';
import { useMe, useNotice } from '@/components/admin/ops-kit';
import { DataList, type ListColumn } from '@/components/admin/list/DataList';
import { FloorForm } from '@/components/admin/facilities/forms';
import { RowActions, useFacilityLookups, fmtArea, fmtPct } from '@/components/admin/facilities/shared';

type Row = { id: string; buildingId: string; buildingName: string; name: string; sortOrder: number; planImageUrl: string | null; notes: string | null; unitCount: number; occupancy: { rentableArea: number; byAreaPct: number | null }; isArchived: boolean; updatedAt: string };

function FloorsInner() {
    const { can } = useMe();
    const notice = useNotice();
    const lookups = useFacilityLookups();
    const buildingId = useSearchParams().get('buildingId') ?? '';
    const [editing, setEditing] = useState<Row | 'new' | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const changed = () => { setReloadKey((k) => k + 1); lookups.reload(); };
    const buildings = (lookups.data?.lookups.buildings ?? []).map((b) => ({ value: b.id, label: b.name }));

    const columns: ListColumn<Row>[] = [
        { key: 'buildingName', label: 'Bina', sortable: true },
        { key: 'name', label: 'Kat', sortable: true, render: (r) => <span className="font-medium text-white">{r.name}</span> },
        { key: 'sortOrder', label: 'Sıra', sortable: true, align: 'right' },
        { key: 'unitCount', label: 'Bölüm', sortable: true, align: 'right' },
        { key: 'rentableArea', label: 'Kiralanabilir bölüm alanı', sortable: true, align: 'right', render: (r) => fmtArea(r.occupancy.rentableArea) },
        { key: 'byAreaPct', label: 'Doluluk (m²)', sortable: true, align: 'right', render: (r) => fmtPct(r.occupancy.byAreaPct) },
        { key: 'planImageUrl', label: 'Kat planı', render: (r) => (r.planImageUrl ? <a href={r.planImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Planı aç</a> : <span className="text-gray-500">Yok</span>) },
    ];

    return (
        <div className="space-y-5">
            <PageHeader icon={Layers} title="Bina Kat Bilgileri" description="Binalara ait katlar ve kat planı görselleri."
                actions={can('create', 'facilities') && <Button variant="primary" icon={Plus} onClick={() => setEditing('new')} disabled={!buildings.length} title={buildings.length ? undefined : 'Önce bina ekleyin'}>Kat Ekle</Button>} />
            <DataList<Row> endpoint="/api/admin/facility-units/floors" label="Katlar" columns={columns} searchPlaceholder="Kat veya bina adı"
                filters={[{ key: 'buildingId', label: 'Bina', type: 'select', options: buildings }]} initialFilters={buildingId ? { buildingId } : {}}
                canExport={can('export', 'facilities')} reloadKey={reloadKey}
                empty={{ title: 'Henüz kat yok', description: buildings.length ? 'Binaya kat ekleyin.' : 'Önce Alan - Bina Detay ekranından bina ekleyin.' }}
                rowActions={(r) => <RowActions kind="floors" row={r} label={`${r.buildingName} ${r.name}`} canEdit={can('update', 'facilities')} canArchive={can('delete', 'facilities')} onEdit={() => setEditing(r)} onChanged={changed} notify={notice} />} />
            {editing && lookups.data && <FloorForm row={editing === 'new' ? undefined : editing} defaultBuildingId={buildingId} lookups={lookups.data.lookups} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); notice.success(m); changed(); }} />}
            {notice.node}
        </div>
    );
}

export default function FloorsPage() {
    return <Suspense><FloorsInner /></Suspense>;
}
