"use client";
import { useEffect, useMemo, useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { Alert, Button, Modal, Toggle } from '@/components/admin/ui';
import { api, useApi, useForm, LInput, LSelect, LTextArea, LoadingRows, ErrorState, fmtMoney, toDateInput } from '@/components/admin/ops-kit';

type Opt = { value: string; label: string };
type FormData = {
    prefill: Record<string, string>;
    lookups: { entrepreneurs: { id: string; name: string }[]; organizations: { id: string; name: string; legalName: string | null }[]; units: { id: string; label: string; area: number }[]; statuses: Opt[]; spaceTypes: Opt[] };
};

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/**
 * Kira sözleşmesi — tüm alanlar. `contractId` verilirse düzenleme (sürüm kontrollü), yoksa yeni kayıt.
 * `assignmentId` ile açılırsa sözleşme kaydedilince o bölüm tahsisine bağlanır.
 */
export function RentContractForm({ contractId, entrepreneurId, unitId, assignmentId, onClose, onSaved }: {
    contractId?: string; entrepreneurId?: string | null; unitId?: string | null; assignmentId?: string | null; onClose: () => void; onSaved: (id: string) => void;
}) {
    const qs = new URLSearchParams({ ...(entrepreneurId ? { entrepreneurId } : {}), ...(unitId ? { unitId } : {}), ...(assignmentId ? { assignmentId } : {}) }).toString();
    const form = useApi<FormData>(`/api/admin/rent/contract-form?${qs}`);
    const existing = useApi<{ contract: Record<string, unknown> & { updatedAt: string } }>(contractId ? `/api/admin/rent/contract-form/${contractId}` : null);
    const ready = form.data && (!contractId || existing.data);

    return (
        <Modal open onClose={onClose} size="xl" title={contractId ? 'Kira sözleşmesini düzenle' : 'Yeni kira sözleşmesi'}
            description="Tüm alanlar kayıtlı bilgiyle doldurulabilir. KDV ve toplam tutar otomatik hesaplanır.">
            {form.error ? <ErrorState error={form.error} onRetry={form.reload} /> : existing.error ? <ErrorState error={existing.error} onRetry={existing.reload} /> : !ready ? <LoadingRows rows={6} /> : (
                <Inner data={form.data!} contract={existing.data?.contract ?? null} contractId={contractId} assignmentId={assignmentId} onClose={onClose} onSaved={onSaved} />
            )}
        </Modal>
    );
}

function Inner({ data, contract, contractId, assignmentId, onClose, onSaved }: { data: FormData; contract: (Record<string, unknown> & { updatedAt: string }) | null; contractId?: string; assignmentId?: string | null; onClose: () => void; onSaved: (id: string) => void }) {
    const p = data.prefill;
    const c = contract;
    const f = useForm({
        entrepreneurId: s(c?.entrepreneurId ?? p.entrepreneurId), organizationId: s(c?.organizationId ?? p.organizationId), unitId: s(c?.unitId ?? p.unitId),
        spaceName: s(c?.spaceName ?? p.spaceName), roomDeskNo: s(c?.roomDeskNo ?? p.roomDeskNo), areaM2: s(c?.areaM2 ?? p.areaM2), spaceType: s(c?.spaceType ?? p.spaceType ?? 'OFFICE'),
        contractNo: s(c?.contractNo ?? p.contractNo), contractDate: toDateInput((c?.contractDate as string) ?? new Date()),
        startDate: c ? toDateInput(c.startDate as string) : s(p.startDate), endDate: c ? toDateInput(c.endDate as string) : s(p.endDate),
        commercialTitle: s(c?.commercialTitle ?? p.commercialTitle), contactPersonName: s(c?.contactPersonName), contactEmail: s(c?.contactEmail ?? p.contactEmail), contactPhone: s(c?.contactPhone ?? p.contactPhone),
        monthlyRent: s(c?.monthlyRent), currency: s(c?.currency ?? 'TRY'), vatRate: s(c?.vatRate), dueDay: s(c?.dueDay), depositAmount: s(c?.depositAmount ?? 0),
        freePeriodStart: toDateInput(c?.freePeriodStart as string), freePeriodEnd: toDateInput(c?.freePeriodEnd as string), waiverReason: s(c?.waiverReason),
        renewalNoticeDays: s(c?.renewalNoticeDays ?? 30), status: s(c?.status ?? 'ACTIVE'), contractDocUrl: s(c?.contractDocUrl), notes: s(c?.notes),
    });
    const [isWaived, setWaived] = useState(Boolean(c?.isWaived));
    const [autoRenew, setAutoRenew] = useState(Boolean(c?.autoRenew));
    const [problem, setProblem] = useState<string | null>(null);

    // Bölüm seçilince alan adı ve m² bölümden gelir (kullanıcı değiştirebilir)
    const units = data.lookups.units;
    useEffect(() => {
        const u = units.find((x) => x.id === f.values.unitId);
        if (!u || c?.unitId === f.values.unitId) return;
        f.setValues((v) => ({ ...v, spaceName: v.spaceName && v.spaceName !== p.spaceName ? v.spaceName : u.label, areaM2: String(u.area), roomDeskNo: v.roomDeskNo || u.label.split(' · ').pop() || '' }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f.values.unitId]);

    const totals = useMemo(() => {
        const net = Number(f.values.monthlyRent) || 0, vat = Number(f.values.vatRate) || 0;
        return { vat: Math.round(net * vat) / 100, total: Math.round(net * (100 + vat)) / 100 };
    }, [f.values.monthlyRent, f.values.vatRate]);

    const save = () => f.submit(async () => {
        setProblem(null);
        const body = { ...f.values, isWaived, autoRenew, ...(contractId ? { expectedUpdatedAt: c?.updatedAt } : { assignmentId }) };
        if (contractId) delete (body as Record<string, unknown>).entrepreneurId; // girişim değiştirilemez
        const r = contractId
            ? await api<{ contract: { id: string } }>(`/api/admin/rent/contract-form/${contractId}`, { method: 'PATCH', json: body })
            : await api<{ contract: { id: string } }>('/api/admin/rent/contract-form', { method: 'POST', json: body });
        onSaved(r.contract.id);
    }, (e) => setProblem((e.data as { fieldErrors?: Record<string, string> })?.fieldErrors?._conflict ? 'Bu sözleşme siz düzenlerken başka biri tarafından değiştirildi. Pencereyi kapatıp yeniden açın.' : e.message));

    const entOpts = data.lookups.entrepreneurs.map((e) => ({ value: e.id, label: e.name }));
    const orgOpts = data.lookups.organizations.map((o) => ({ value: o.id, label: o.legalName ? `${o.name} (${o.legalName})` : o.name }));
    const pickOrg = (id: string) => {
        f.set('organizationId', id);
        const o = data.lookups.organizations.find((x) => x.id === id);
        if (o && !f.values.commercialTitle) f.set('commercialTitle', o.legalName ?? o.name);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-6">
            {problem && <Alert tone="danger">{problem}</Alert>}
            <Section title="Taraflar">
                <LSelect label="Girişim" required disabled={Boolean(contractId)} placeholder="Girişim seçin" options={entOpts} {...f.bind('entrepreneurId')} hint={contractId ? 'Girişim sözleşmeden sonra değiştirilemez' : undefined} />
                <LSelect label="Şirket kaydı (rehber)" placeholder="Bağlı şirket yok" options={orgOpts} value={f.values.organizationId} onChange={(e) => pickOrg(e.target.value)} error={f.errors.organizationId} />
                <LInput label="Ticari unvan" {...f.bind('commercialTitle')} />
                <LInput label="Yetkili / iletişim kişisi" {...f.bind('contactPersonName')} />
                <LInput label="E-posta" type="email" hint="Kira hatırlatmaları bu adrese gider" {...f.bind('contactEmail')} />
                <LInput label="Telefon" {...f.bind('contactPhone')} />
            </Section>
            <Section title="Kiralanan alan">
                <LSelect label="Bağımsız bölüm" placeholder={units.length ? 'Bölüm seçin (önerilir)' : 'Önce Alan Yönetimi’nden bölüm tanımlayın'} options={units.map((u) => ({ value: u.id, label: u.label }))} {...f.bind('unitId')} />
                <LInput label="Alan adı" required hint="Bölüm seçilince otomatik dolar" {...f.bind('spaceName')} />
                <LInput label="Oda / masa no" {...f.bind('roomDeskNo')} />
                <LInput label="Alan (m²)" type="number" min="0" step="0.01" {...f.bind('areaM2')} />
                <LSelect label="Alan türü" options={data.lookups.spaceTypes} {...f.bind('spaceType')} />
            </Section>
            <Section title="Sözleşme">
                <LInput label="Sözleşme no" required {...f.bind('contractNo')} />
                <LInput label="Sözleşme tarihi" type="date" required {...f.bind('contractDate')} />
                <LSelect label="Durum" options={data.lookups.statuses} {...f.bind('status')} />
                <LInput label="Başlangıç" type="date" required {...f.bind('startDate')} />
                <LInput label="Bitiş" type="date" required {...f.bind('endDate')} />
                <LInput label="İmzalı sözleşme dosyası" placeholder="https://… veya /uploads/…" hint="Medya kütüphanesindeki dosyanın adresi" {...f.bind('contractDocUrl')} />
            </Section>
            <Section title="Bedel ve ödeme">
                <LInput label="Aylık kira (KDV hariç)" type="number" min="0" step="0.01" required {...f.bind('monthlyRent')} />
                <LInput label="KDV oranı (%)" type="number" min="0" max="100" step="0.01" required {...f.bind('vatRate')} hint={`KDV ${fmtMoney(totals.vat, f.values.currency || 'TRY')} · Toplam ${fmtMoney(totals.total, f.values.currency || 'TRY')}`} />
                <LInput label="Para birimi" maxLength={3} {...f.bind('currency')} />
                <LInput label="Ödeme günü (ayın)" type="number" min="1" max="31" required {...f.bind('dueDay')} />
                <LInput label="Depozito" type="number" min="0" step="0.01" {...f.bind('depositAmount')} />
                <div className="flex flex-col justify-end gap-3 pb-1">
                    <Toggle id="rc-waived" checked={isWaived} onChange={setWaived} label="Kira muaf" />
                    <Toggle id="rc-renew" checked={autoRenew} onChange={setAutoRenew} label="Otomatik yenileme" />
                </div>
                <LInput label="Ücretsiz dönem başlangıcı" type="date" {...f.bind('freePeriodStart')} />
                <LInput label="Ücretsiz dönem bitişi" type="date" {...f.bind('freePeriodEnd')} />
                <LInput label="Yenileme bildirimi (gün önce)" type="number" min="0" max="365" {...f.bind('renewalNoticeDays')} />
                {isWaived && <LInput label="Muafiyet gerekçesi" required className="sm:col-span-2 lg:col-span-3" {...f.bind('waiverReason')} />}
            </Section>
            <LTextArea label="Notlar" rows={3} {...f.bind('notes')} />
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
                {contractId && <a href={`/api/admin/rent/contracts/${contractId}/print`} target="_blank" rel="noopener noreferrer" className="mr-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><Printer className="h-4 w-4" aria-hidden /> Sözleşme çıktısı</a>}
                <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
                <Button type="submit" variant="primary" icon={FileText} loading={f.saving}>{contractId ? 'Kaydet' : 'Sözleşmeyi oluştur'}</Button>
            </div>
        </form>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        </fieldset>
    );
}
