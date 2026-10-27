"use client";
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { Badge, PageHeader } from '@/components/admin/ui';
import { useMe, fmtDate, fmtMoney } from '@/components/admin/ops-kit';
import { DataList, type ListColumn } from '@/components/admin/list/DataList';
import { useFacilityLookups, fmtArea } from '@/components/admin/facilities/shared';

type Row = { id: string; entrepreneurId: string | null; firmName: string; firmHref: string | null; units: string; unitCount: number; totalArea: number; contracts: string | null; monthlyRent: number | null; withoutContract: number; nearestEnd: string | null };

export default function LeasedPage() {
    const { can } = useMe();
    const lookups = useFacilityLookups();
    const rent = can('view', 'rent');
    const columns: ListColumn<Row>[] = [
        { key: 'firmName', label: 'Firma', sortable: true, render: (r) => (r.firmHref ? <Link href={r.firmHref} className="font-medium text-white hover:underline">{r.firmName}</Link> : r.firmName) },
        { key: 'units', label: 'Bölümler', className: 'min-w-[14rem] text-gray-300' },
        { key: 'unitCount', label: 'Bölüm', sortable: true, align: 'right' },
        { key: 'totalArea', label: 'Toplam alan', sortable: true, align: 'right', render: (r) => fmtArea(r.totalArea) },
        { key: 'nearestEnd', label: 'En yakın bitiş', sortable: true, render: (r) => (r.nearestEnd ? fmtDate(r.nearestEnd) : 'Açık uçlu') },
        ...(rent ? [
            { key: 'contracts', label: 'Kira sözleşmeleri', render: (r: Row) => <span className="inline-flex flex-wrap gap-1.5">{r.contracts ?? ''}{r.withoutContract > 0 && <Link href="/admin/alan-yonetimi/eslestirme?state=ACTIVE"><Badge tone="warning">{r.withoutContract} bölüm bağlanmamış</Badge></Link>}</span> },
            { key: 'monthlyRent', label: 'Aylık kira toplamı', sortable: true, align: 'right' as const, render: (r: Row) => (r.monthlyRent === null ? '—' : fmtMoney(r.monthlyRent)) },
        ] : []),
    ];
    return (
        <div className="space-y-5">
            <PageHeader icon={KeyRound} title="Kiralanan Alan Bilgileri" description="Bugün aktif tahsisi olan firmalar, kullandıkları bölümler ve toplam alan. Kira tutarları kira görme yetkisiyle görünür (KDV hariç)." />
            <DataList<Row> endpoint="/api/admin/facility-units/leased" label="Kiralanan alanlar" columns={columns} searchPlaceholder="Firma, bölüm veya sözleşme no" archiveToggle={false}
                filters={[{ key: 'buildingId', label: 'Bina', type: 'select', options: (lookups.data?.lookups.buildings ?? []).map((b) => ({ value: b.id, label: b.name })) }]}
                canExport={can('export', 'facilities')}
                empty={{ title: 'Aktif kiralanan alan yok', description: 'Firma - Bölüm Eşleştirme ekranından tahsis ekleyin.' }} />
        </div>
    );
}
