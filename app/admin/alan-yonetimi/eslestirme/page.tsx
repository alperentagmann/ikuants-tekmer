"use client";
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FilePlus2, Link2, Plus, Printer, Square, Users } from 'lucide-react';
import { Badge, Button, PageHeader } from '@/components/admin/ui';
import { api, useMe, useNotice, fmtDate, fmtMoney } from '@/components/admin/ops-kit';
import { DataList, type ListColumn } from '@/components/admin/list/DataList';
import { AssignmentForm } from '@/components/admin/facilities/forms';
import { RowActions, StatePill, useFacilityLookups, fmtArea } from '@/components/admin/facilities/shared';
import { RentContractForm } from '@/components/admin/rent/RentContractForm';

type Row = {
    id: string; unitId: string; unitCode: string; unitArea: number; floorName: string; buildingId: string; buildingName: string;
    entrepreneurId: string | null; organizationId: string | null; firmName: string; firmHref: string | null;
    startDate: string | null; endDate: string | null; status: string; state: string; stateLabel: string;
    rentContractId: string | null; contractNo: string | null; contractStatus: string | null; monthlyRent: number | null; totalMonthlyRent: number | null; currency: string | null; hasRentContract: boolean;
    suggestedContracts: { id: string; contractNo: string; spaceName: string }[];
    notes: string | null; isArchived: boolean; updatedAt: string;
};

function AssignmentsInner() {
    const { can } = useMe();
    const notice = useNotice();
    const lookups = useFacilityLookups();
    const sp = useSearchParams();
    const [editing, setEditing] = useState<Row | 'new' | null>(null);
    const [contractFor, setContractFor] = useState<Row | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const rent = can('view', 'rent');
    const l = lookups.data?.lookups;
    const changed = () => { setReloadKey((k) => k + 1); lookups.reload(); };

    const patch = async (row: Row, body: Record<string, unknown>, msg: string) => {
        setBusy(row.id);
        try {
            await api(`/api/admin/facility-units/assignments/${row.id}`, { method: 'PATCH', json: body });
            notice.success(msg);
            changed();
        } catch (e) { notice.error((e as Error).message); } finally { setBusy(null); }
    };

    const contractCell = (r: Row) => {
        if (r.rentContractId) {
            return (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Link href={`/admin/finans/kiralar?contract=${r.rentContractId}`} className="text-primary hover:underline">{r.contractNo}</Link>
                    <a href={`/api/admin/rent/contracts/${r.rentContractId}/print`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white" aria-label={`${r.contractNo} çıktısı`} title="Sözleşme çıktısı"><Printer className="h-3.5 w-3.5" /></a>
                </span>
            );
        }
        return (
            <span className="inline-flex flex-wrap items-center gap-1.5">
                {r.suggestedContracts.slice(0, 2).map((c) => (
                    <Button key={c.id} size="sm" icon={Link2} loading={busy === r.id} disabled={!can('update', 'facilities')} onClick={() => patch(r, { rentContractId: c.id, expectedUpdatedAt: r.updatedAt }, `${c.contractNo} bağlandı.`)} title={c.spaceName}>{c.contractNo} bağla</Button>
                ))}
                {can('create', 'rent') && r.entrepreneurId && <Button size="sm" variant="ghost" icon={FilePlus2} onClick={() => setContractFor(r)}>Sözleşme oluştur</Button>}
                {!r.suggestedContracts.length && !r.entrepreneurId && <Badge tone="warning">Kurum tahsisi — sözleşme girişim kaydıyla bağlanır</Badge>}
            </span>
        );
    };

    const columns: ListColumn<Row>[] = [
        { key: 'firmName', label: 'Firma', sortable: true, render: (r) => (r.firmHref ? <Link href={r.firmHref} className="font-medium text-white hover:underline">{r.firmName}</Link> : r.firmName) },
        { key: 'buildingName', label: 'Bina', sortable: true },
        { key: 'floorName', label: 'Kat', sortable: true },
        { key: 'unitCode', label: 'Bölüm', sortable: true },
        { key: 'unitArea', label: 'm²', sortable: true, align: 'right', render: (r) => fmtArea(r.unitArea) },
        { key: 'startDate', label: 'Başlangıç', sortable: true, render: (r) => fmtDate(r.startDate) },
        { key: 'endDate', label: 'Bitiş', sortable: true, render: (r) => (r.endDate ? fmtDate(r.endDate) : 'Açık uçlu') },
        { key: 'state', label: 'Durum', sortable: true, render: (r) => <StatePill state={r.state} label={r.stateLabel} /> },
        ...(rent ? [
            { key: 'contractNo', label: 'Kira sözleşmesi', sortable: true, className: 'min-w-[14rem]', render: contractCell },
            { key: 'monthlyRent', label: 'Aylık kira', sortable: true, align: 'right' as const, render: (r: Row) => (r.monthlyRent === null ? '—' : <span title={r.totalMonthlyRent !== null ? `KDV dahil ${fmtMoney(r.totalMonthlyRent, r.currency ?? 'TRY')}` : undefined}>{fmtMoney(r.monthlyRent, r.currency ?? 'TRY')}</span>) },
        ] : []),
    ];

    return (
        <div className="space-y-5">
            <PageHeader icon={Users} title="Firma - Bağımsız Bölüm Eşleştirme"
                description="Hangi firmanın hangi bölümü hangi tarihler arasında kullandığı ve bağlı kira sözleşmesi. Ortak alan dışındaki bölümler aynı dönemde tek firmaya verilir."
                actions={can('create', 'facilities') && <Button variant="primary" icon={Plus} onClick={() => setEditing('new')} disabled={!l?.units.length} title={l?.units.length ? undefined : 'Önce bağımsız bölüm ekleyin'}>Eşleştir</Button>} />
            <DataList<Row> endpoint="/api/admin/facility-units/assignments" label="Eşleştirmeler" columns={columns} searchPlaceholder="Firma, bölüm, bina veya sözleşme no"
                filters={[
                    { key: 'buildingId', label: 'Bina', type: 'select', options: (l?.buildings ?? []).map((b) => ({ value: b.id, label: b.name })) },
                    { key: 'entrepreneurId', label: 'Girişim', type: 'select', options: (l?.entrepreneurs ?? []).map((e) => ({ value: e.id, label: e.name })) },
                    { key: 'state', label: 'Durum', type: 'select', options: [{ value: 'ACTIVE', label: 'Aktif' }, { value: 'UPCOMING', label: 'Başlamadı' }, { value: 'ENDED', label: 'Sona erdi' }] },
                    { key: 'year', label: 'Yıl', type: 'year' },
                ]}
                initialFilters={sp.get('state') ? { state: sp.get('state')! } : {}}
                canExport={can('export', 'facilities')} reloadKey={reloadKey}
                empty={{ title: 'Henüz eşleştirme yok', description: 'Girişimleri bağımsız bölümlerle eşleştirin; doluluk ve kira takibi otomatik çalışır.' }}
                rowActions={(r) => (
                    <div className="inline-flex items-center gap-1">
                        {can('update', 'facilities') && r.state === 'ACTIVE' && <Button size="sm" variant="ghost" icon={Square} loading={busy === r.id} onClick={() => patch(r, { end: true }, 'Tahsis bugün itibarıyla sonlandırıldı.')}>Sonlandır</Button>}
                        <RowActions kind="assignments" row={r} label={`${r.firmName} – ${r.unitCode}`} canEdit={can('update', 'facilities')} canArchive={can('delete', 'facilities')} onEdit={() => setEditing(r)} onChanged={changed} notify={notice} />
                    </div>
                )} />
            {editing && l && <AssignmentForm row={editing === 'new' ? undefined : editing} lookups={l} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); notice.success(m); changed(); }} />}
            {contractFor && <RentContractForm entrepreneurId={contractFor.entrepreneurId} unitId={contractFor.unitId} assignmentId={contractFor.id} onClose={() => setContractFor(null)} onSaved={() => { setContractFor(null); notice.success('Sözleşme oluşturuldu ve tahsise bağlandı.'); changed(); }} />}
            {notice.node}
        </div>
    );
}

export default function AssignmentsPage() {
    return <Suspense><AssignmentsInner /></Suspense>;
}
