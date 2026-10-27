"use client";
import { useState } from 'react';
import { Plus, Settings2, ShieldCheck } from 'lucide-react';
import { Alert, Badge, Button, Modal, PageHeader } from '@/components/admin/ui';
import { useMe, useNotice, fmtDate, fmtMoney } from '@/components/admin/ops-kit';
import { DataList, type ListColumn } from '@/components/admin/list/DataList';
import { PolicyForm } from '@/components/admin/facilities/forms';
import { RowActions, StatePill, useFacilityLookups } from '@/components/admin/facilities/shared';
import { ParameterManager } from '@/components/admin/parameters/ParameterManager';

type Row = {
    id: string; buildingId: string | null; unitId: string | null; targetLabel: string; policyType: string; policyTypeLabel: string; coverage: string | null;
    insurer: string; policyNo: string; startDate: string; endDate: string; daysLeft: number; state: string; stateLabel: string;
    premium: number | null; currency: string; documentUrl: string | null; notes: string | null; isArchived: boolean; updatedAt: string;
};

export default function PoliciesPage() {
    const { can } = useMe();
    const notice = useNotice();
    const lookups = useFacilityLookups();
    const [editing, setEditing] = useState<Row | 'new' | null>(null);
    const [settings, setSettings] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const l = lookups.data?.lookups;
    const changed = () => { setReloadKey((k) => k + 1); lookups.reload(); };
    const warn = l?.expiryWarningDays;

    const columns: ListColumn<Row>[] = [
        { key: 'targetLabel', label: 'Bina / bölüm', sortable: true, className: 'min-w-[12rem]' },
        { key: 'policyType', label: 'Tür', sortable: true, render: (r) => r.policyTypeLabel },
        { key: 'insurer', label: 'Sigorta şirketi', sortable: true },
        { key: 'policyNo', label: 'Poliçe no', sortable: true, render: (r) => (r.documentUrl ? <a href={r.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{r.policyNo}</a> : r.policyNo) },
        { key: 'startDate', label: 'Başlangıç', sortable: true, render: (r) => fmtDate(r.startDate) },
        { key: 'endDate', label: 'Bitiş', sortable: true, render: (r) => fmtDate(r.endDate) },
        { key: 'daysLeft', label: 'Kalan gün', sortable: true, align: 'right', render: (r) => (r.daysLeft < 0 ? <Badge tone="danger">{-r.daysLeft} gün geçti</Badge> : <Badge tone={r.daysLeft <= 14 ? 'danger' : r.state === 'EXPIRING' ? 'warning' : 'neutral'}>{r.daysLeft} gün</Badge>) },
        { key: 'state', label: 'Durum', sortable: true, render: (r) => <StatePill state={r.state} label={r.stateLabel} /> },
        { key: 'premium', label: 'Prim', sortable: true, align: 'right', render: (r) => (r.premium === null ? '—' : fmtMoney(r.premium, r.currency)) },
        { key: 'coverage', label: 'Kapsam', className: 'min-w-[12rem] text-gray-400', render: (r) => r.coverage ?? '—' },
    ];

    return (
        <div className="space-y-5">
            <PageHeader icon={ShieldCheck} title="Tüm Poliçeler"
                description={warn ? `Bitişine ${warn.value} gün veya daha az kalan poliçeler "Bitişe yaklaşıyor" olarak işaretlenir${warn.isDefault ? ' (varsayılan süre; Ayarlar’dan değiştirilebilir)' : ''}.` : undefined}
                actions={<>
                    {can('view', 'parameters') && <Button icon={Settings2} onClick={() => setSettings(true)}>Ayarlar</Button>}
                    {can('create', 'facilities') && <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Poliçe Ekle</Button>}
                </>} />
            {l && l.policyTypes.length === 0 && <Alert tone="warning">Poliçe türü tanımlı değil. Kurumunuzun kullandığı türleri Ayarlar → Poliçe türleri bölümünden ekleyin; poliçe girerken bu listeden seçilir.</Alert>}
            <DataList<Row> endpoint="/api/admin/facility-units/policies" label="Poliçeler" columns={columns} searchPlaceholder="Poliçe no, şirket, bina/bölüm"
                filters={[
                    { key: 'buildingId', label: 'Bina', type: 'select', options: (l?.buildings ?? []).map((b) => ({ value: b.id, label: b.name })) },
                    { key: 'policyType', label: 'Tür', type: 'select', options: l?.policyTypes ?? [] },
                    { key: 'state', label: 'Durum', type: 'select', options: [{ value: 'ACTIVE', label: 'Yürürlükte' }, { value: 'EXPIRING', label: 'Bitişe yaklaşıyor' }, { value: 'EXPIRED', label: 'Süresi doldu' }, { value: 'UPCOMING', label: 'Başlamadı' }] },
                    { key: 'year', label: 'Bitiş yılı', type: 'year' },
                ]}
                canExport={can('export', 'facilities')} reloadKey={reloadKey}
                empty={{ title: 'Henüz poliçe yok', description: 'Bina veya bağımsız bölüm için poliçe ekleyin; bitiş tarihi yaklaşınca panelde uyarı görünür.' }}
                rowActions={(r) => <RowActions kind="policies" row={r} label={`Poliçe ${r.policyNo}`} canEdit={can('update', 'facilities')} canArchive={can('delete', 'facilities')} onEdit={() => setEditing(r)} onChanged={changed} notify={notice} />} />
            {editing && l && <PolicyForm row={editing === 'new' ? undefined : editing} lookups={l} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); notice.success(m); changed(); }} />}
            <Modal open={settings} onClose={() => setSettings(false)} title="Ayarlar" size="lg">
                <div className="space-y-8">
                    <section aria-labelledby="pt-h"><h3 id="pt-h" className="mb-2 text-sm font-semibold text-white">Poliçe türleri</h3><ParameterManager category="POLICY_TYPE" canManage={can('manage', 'parameters')} onChanged={lookups.reload} notify={notice} /></section>
                    <section aria-labelledby="al-h"><h3 id="al-h" className="mb-2 text-sm font-semibold text-white">Uyarı süresi</h3><ParameterManager category="ALERTS" canManage={can('manage', 'parameters')} onChanged={changed} notify={notice} /></section>
                    <section aria-labelledby="dt-h"><h3 id="dt-h" className="mb-2 text-sm font-semibold text-white">Belge şablonları</h3><ParameterManager category="DOCUMENT_TEMPLATES" canManage={can('manage', 'parameters')} notify={notice} /></section>
                </div>
            </Modal>
            {notice.node}
        </div>
    );
}
