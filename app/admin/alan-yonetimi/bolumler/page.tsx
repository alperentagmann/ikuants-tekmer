"use client";
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DoorOpen, Link2, Plus, Rows3, Wand2 } from 'lucide-react';
import { Button, PageHeader } from '@/components/admin/ui';
import { useMe, useNotice, fmtDate } from '@/components/admin/ops-kit';
import { DataList, type ListColumn } from '@/components/admin/list/DataList';
import Link from 'next/link';
import { AssignmentForm, BulkUnitsForm, UnitForm } from '@/components/admin/facilities/forms';
import { RowActions, StatePill, useFacilityLookups, fmtArea } from '@/components/admin/facilities/shared';

type Row = {
    id: string; code: string; unitType: string; unitTypeLabel: string; area: number; capacity: number | null; status: string; displayStatus: string; displayStatusLabel: string;
    maxTenants: number; tenants: number; freeSlots: number | null;
    floorId: string; floorName: string; buildingId: string; buildingName: string; currentFirm: { id: string; name: string; kind: string } | null; firmNames: string; firmCount: number; currentAssignmentEnd: string | null;
    notes: string | null; isArchived: boolean; updatedAt: string;
};

function UnitsInner() {
    const { can } = useMe();
    const notice = useNotice();
    const lookups = useFacilityLookups();
    const buildingId = useSearchParams().get('buildingId') ?? '';
    const [editing, setEditing] = useState<Row | 'new' | null>(null);
    const [assignTo, setAssignTo] = useState<string | null>(null);
    const [bulk, setBulk] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const changed = () => { setReloadKey((k) => k + 1); lookups.reload(); };
    const l = lookups.data?.lookups;

    const columns: ListColumn<Row>[] = [
        { key: 'buildingName', label: 'Bina', sortable: true },
        { key: 'floorName', label: 'Kat', sortable: true },
        { key: 'code', label: 'Kod', sortable: true, render: (r) => <span className="font-medium text-white">{r.code}</span> },
        { key: 'unitType', label: 'Tür', sortable: true, render: (r) => r.unitTypeLabel },
        { key: 'area', label: 'm²', sortable: true, align: 'right', render: (r) => fmtArea(r.area) },
        { key: 'capacity', label: 'Kapasite', sortable: true, align: 'right', render: (r) => r.capacity ?? '—' },
        { key: 'maxTenants', label: 'Firma kapasitesi', sortable: true, align: 'right', render: (r) => (r.unitType === 'COMMON' ? 'Sınırsız' : `${r.tenants}/${r.maxTenants}`) },
        { key: 'displayStatus', label: 'Durum', sortable: true, render: (r) => <StatePill state={r.displayStatus} label={r.displayStatusLabel} /> },
        { key: 'currentFirm', label: 'Firma', sortable: true, className: 'min-w-[10rem]', render: (r) => (r.firmNames || '—') },
        { key: 'currentAssignmentEnd', label: 'Tahsis bitişi', sortable: true, render: (r) => (r.currentFirm ? (r.currentAssignmentEnd ? fmtDate(r.currentAssignmentEnd) : 'Açık uçlu') : '—') },
    ];

    return (
        <div className="space-y-5">
            <PageHeader icon={DoorOpen} title="Bina Bağımsız Bölüm Yönetimi" description="Ofis, atölye, depo ve ortak alanlar. Dolu durumu firma tahsisinden otomatik hesaplanır."
                actions={can('create', 'facilities') && <>
                    <Link href="/admin/alan-yonetimi/yerlestir" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><Wand2 className="h-4 w-4" aria-hidden /> Firma Yerleştir</Link>
                    <Button icon={Rows3} onClick={() => setBulk(true)} disabled={!l?.floors.length}>Toplu Ekle (ör. 30 masa)</Button>
                    <Button variant="primary" icon={Plus} onClick={() => setEditing('new')} disabled={!l?.floors.length} title={l?.floors.length ? undefined : 'Önce kat ekleyin'}>Bölüm Ekle</Button>
                </>} />
            <DataList<Row> endpoint="/api/admin/facility-units/units" label="Bağımsız bölümler" columns={columns} searchPlaceholder="Kod, bina, kat veya firma"
                filters={[
                    { key: 'buildingId', label: 'Bina', type: 'select', options: (l?.buildings ?? []).map((b) => ({ value: b.id, label: b.name })), resets: ['floorId'] },
                    { key: 'floorId', label: 'Kat', type: 'select', options: (d) => (l?.floors ?? []).filter((f) => !d.buildingId || f.buildingId === d.buildingId).map((f) => ({ value: f.id, label: f.name })) },
                    { key: 'unitType', label: 'Tür', type: 'select', options: l?.unitTypes ?? [] },
                    { key: 'status', label: 'Durum', type: 'select', options: [{ value: 'HAS_ROOM', label: 'Boş yeri olanlar' }, { value: 'OCCUPIED', label: 'Dolu' }, { value: 'PARTIAL', label: 'Paylaşımlı — yer var' }, ...(l?.unitStatuses ?? [])] },
                ]}
                initialFilters={buildingId ? { buildingId } : {}}
                canExport={can('export', 'facilities')} reloadKey={reloadKey}
                empty={{ title: 'Henüz bağımsız bölüm yok', description: l?.floors.length ? 'Kata bağımsız bölüm ekleyin.' : 'Önce bina ve kat tanımlayın.' }}
                rowActions={(r) => (
                    <div className="inline-flex items-center gap-1">
                        {can('create', 'facilities') && !r.isArchived && r.displayStatus !== 'OCCUPIED' && <Button size="sm" variant="ghost" icon={Link2} onClick={() => setAssignTo(r.id)} aria-label={`Bölüm ${r.code} firmaya tahsis et`}>Tahsis et</Button>}
                        <RowActions kind="units" row={r} label={`Bölüm ${r.code}`} canEdit={can('update', 'facilities')} canArchive={can('delete', 'facilities')} onEdit={() => setEditing(r)} onChanged={changed} notify={notice} />
                    </div>
                )} />
            {editing && l && <UnitForm row={editing === 'new' ? undefined : editing} lookups={l} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); notice.success(m); changed(); }} />}
            {bulk && l && <BulkUnitsForm lookups={l} onClose={() => setBulk(false)} onSaved={(m) => { setBulk(false); notice.success(m); changed(); }} />}
            {assignTo && l && <AssignmentForm defaultUnitId={assignTo} lookups={l} onClose={() => setAssignTo(null)} onSaved={(m) => { setAssignTo(null); notice.success(m); changed(); }} />}
            {notice.node}
        </div>
    );
}

export default function UnitsPage() {
    return <Suspense><UnitsInner /></Suspense>;
}
