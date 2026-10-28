"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, FileUp, Search, Trash2, Wand2 } from 'lucide-react';
import { Alert, Badge, Button, Card, Toggle } from '@/components/admin/ui';
import { api, useApi, LInput, LSelect, LTextArea, LoadingRows, ErrorState, fmtMoney, toDateInput } from '@/components/admin/ops-kit';

type Unit = { id: string; code: string; unitType: string; unitTypeLabel: string; area: number; maxTenants: number; status: string; building: string; floor: string; tenants: { name: string; label: string | null; endDate: string | null }[]; freeSlots: number | null };
type Org = { id: string; name: string; legalName: string | null; taxNumber: string | null; taxOffice: string | null; address: string | null };
type Ent = { id: string; name: string; email: string | null; phone: string | null; organization: Org | null };
type Lookups = { units: Unit[]; entrepreneurs: Ent[]; organizations: Org[] };
type Result = { entrepreneurId: string; organizationId: string | null; contractId: string | null; assignmentIds: string[] };

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const oneYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return toDateInput(d); };

/**
 * Firma yerleştirme — tek kayıt: firma + şirket + masa/ofis (masa no) + tarihler + sözleşme + ıslak imzalı tarama.
 * Kaydedince her şey birbirine bağlanır; sonradan sözleşmede yapılan tarih / fesih değişiklikleri tahsislere yansır.
 */
export function PlacementWizard({ defaultEntrepreneurId, onDone }: { defaultEntrepreneurId?: string; onDone?: (r: Result) => void }) {
    const q = useApi<{ lookups: Lookups }>('/api/admin/placement');
    if (q.error) return <Card padded={false}><ErrorState error={q.error} onRetry={q.reload} /></Card>;
    if (!q.data) return <Card padded={false}><LoadingRows rows={6} /></Card>;
    return <Inner l={q.data.lookups} defaultEntrepreneurId={defaultEntrepreneurId} onDone={onDone} />;
}

function Inner({ l, defaultEntrepreneurId, onDone }: { l: Lookups; defaultEntrepreneurId?: string; onDone?: (r: Result) => void }) {
    const [mode, setMode] = useState<'existing' | 'new'>(defaultEntrepreneurId || l.entrepreneurs.length ? 'existing' : 'new');
    const [entrepreneurId, setEntrepreneurId] = useState(defaultEntrepreneurId ?? '');
    const [newFirm, setNewFirm] = useState({ name: '', sector: '', email: '', phone: '' });
    const ent = l.entrepreneurs.find((e) => e.id === entrepreneurId) ?? null;
    const [company, setCompany] = useState({ organizationId: '', legalName: '', taxNumber: '', taxOffice: '', address: '' });
    const [companyTouched, setCompanyTouched] = useState(false);
    const effectiveCompany = companyTouched ? company : { organizationId: ent?.organization?.id ?? '', legalName: s(ent?.organization?.legalName ?? ''), taxNumber: s(ent?.organization?.taxNumber), taxOffice: s(ent?.organization?.taxOffice), address: s(ent?.organization?.address) };
    const setC = (k: keyof typeof company, v: string) => { setCompanyTouched(true); setCompany({ ...effectiveCompany, [k]: v }); };

    const [picked, setPicked] = useState<{ unitId: string; unitLabel: string }[]>([]);
    const [unitQuery, setUnitQuery] = useState('');
    const [onlyFree, setOnlyFree] = useState(true);
    const [dates, setDates] = useState({ startDate: toDateInput(new Date()), endDate: oneYear() });
    const [contractMode, setContractMode] = useState<'new' | 'none'>('new');
    const [contract, setContract] = useState({ contractNo: '', contractDate: toDateInput(new Date()), monthlyRent: '', vatRate: '', dueDay: '', depositAmount: '', currency: 'TRY', contactPersonName: '', contactEmail: '', contactPhone: '', notes: '' });
    const [waived, setWaived] = useState(false);
    const [waiverReason, setWaiverReason] = useState('');
    const [scan, setScan] = useState<{ mediaId: string; fileName: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [problem, setProblem] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [done, setDone] = useState<Result | null>(null);

    const units = useMemo(() => {
        const needle = unitQuery.trim().toLocaleLowerCase('tr-TR');
        return l.units.filter((u) => (!onlyFree || u.unitType === 'COMMON' || (u.freeSlots ?? 0) > 0) && (!needle || `${u.code} ${u.building} ${u.floor} ${u.unitTypeLabel}`.toLocaleLowerCase('tr-TR').includes(needle)));
    }, [l.units, unitQuery, onlyFree]);
    const groups = useMemo(() => {
        const m = new Map<string, Unit[]>();
        for (const u of units) m.set(`${u.building} · ${u.floor}`, [...(m.get(`${u.building} · ${u.floor}`) ?? []), u]);
        return [...m.entries()];
    }, [units]);
    const toggle = (u: Unit) => setPicked((p) => (p.some((x) => x.unitId === u.id) ? p.filter((x) => x.unitId !== u.id) : [...p, { unitId: u.id, unitLabel: '' }]));
    const pickedUnits = picked.map((p) => ({ ...p, unit: l.units.find((u) => u.id === p.unitId)! }));
    const totalArea = pickedUnits.reduce((sum, p) => sum + p.unit.area, 0);
    const net = Number(contract.monthlyRent) || 0, vat = Number(contract.vatRate) || 0;

    const upload = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true); setProblem(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/admin/placement/upload', { method: 'POST', body: fd });
            const j = await res.json();
            if (!res.ok || !j.success) throw new Error(j.message || 'Belge yüklenemedi');
            setScan({ mediaId: j.mediaId, fileName: j.fileName });
        } catch (e) { setProblem((e as Error).message); } finally { setUploading(false); }
    };

    const save = async () => {
        setSaving(true); setProblem(null); setFieldErrors({});
        try {
            const body = {
                ...(mode === 'existing' ? { entrepreneurId } : { newFirm }),
                organizationId: effectiveCompany.organizationId || null,
                company: { legalName: effectiveCompany.legalName, taxNumber: effectiveCompany.taxNumber, taxOffice: effectiveCompany.taxOffice, address: effectiveCompany.address },
                units: picked, ...dates,
                contract: contractMode === 'new' ? { ...contract, isWaived: waived, waiverReason, commercialTitle: effectiveCompany.legalName || undefined, contactEmail: contract.contactEmail || (mode === 'existing' ? ent?.email : newFirm.email) || '' } : null,
                signedMediaId: contractMode === 'new' ? scan?.mediaId ?? null : null,
            };
            const r = await api<{ result: Result }>('/api/admin/placement', { method: 'POST', json: body });
            setDone(r.result);
            onDone?.(r.result);
        } catch (e) {
            const err = e as Error & { data?: { fieldErrors?: Record<string, string> } };
            setProblem(err.message);
            setFieldErrors(err.data?.fieldErrors ?? {});
        } finally { setSaving(false); }
    };

    if (done) {
        return (
            <Card className="space-y-4">
                <div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden /><div><h2 className="text-base font-semibold text-white">Yerleştirme tamamlandı</h2><p className="text-sm text-gray-400">Firma, şirket, {done.assignmentIds.length} bölüm tahsisi{done.contractId ? ' ve sözleşme' : ''} birbirine bağlandı.</p></div></div>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/girisimciler/${done.entrepreneurId}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">Firma kartı</Link>
                    {done.contractId && <Link href={`/admin/finans/kiralar?contract=${done.contractId}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">Sözleşme</Link>}
                    {done.contractId && <a href={`/api/admin/rent/contracts/${done.contractId}/print`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">Sözleşme çıktısı</a>}
                    <Link href="/admin/alan-yonetimi/eslestirme" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">Tüm eşleştirmeler</Link>
                    <Button variant="primary" onClick={() => { setDone(null); setPicked([]); setScan(null); }}>Yeni yerleştirme</Button>
                </div>
            </Card>
        );
    }

    const fe = (k: string) => fieldErrors[k] || undefined;
    return (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5">
            {problem && <Alert tone="danger">{problem}</Alert>}

            <Card className="space-y-4">
                <Step n={1} title="Firma" />
                <div role="radiogroup" aria-label="Firma" className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                    {(['existing', 'new'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1.5 text-sm ${mode === m ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{m === 'existing' ? 'Kayıtlı firma' : 'Yeni firma'}</button>)}
                </div>
                {mode === 'existing' ? (
                    <LSelect label="Firma (girişim)" required placeholder="Firma seçin" options={l.entrepreneurs.map((e) => ({ value: e.id, label: e.name }))} value={entrepreneurId} onChange={(e) => { setEntrepreneurId(e.target.value); setCompanyTouched(false); }} error={fe('entrepreneurId')} />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <LInput label="Firma adı" required value={newFirm.name} onChange={(e) => setNewFirm({ ...newFirm, name: e.target.value })} error={fe('newFirm.name')} />
                        <LInput label="Sektör" required value={newFirm.sector} onChange={(e) => setNewFirm({ ...newFirm, sector: e.target.value })} error={fe('newFirm.sector')} />
                        <LInput label="E-posta" type="email" value={newFirm.email} onChange={(e) => setNewFirm({ ...newFirm, email: e.target.value })} />
                        <LInput label="Telefon" value={newFirm.phone} onChange={(e) => setNewFirm({ ...newFirm, phone: e.target.value })} />
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <LSelect label="Şirket kaydı (rehber)" placeholder="Yeni şirket kaydı oluştur" options={l.organizations.map((o) => ({ value: o.id, label: o.legalName ? `${o.name} (${o.legalName})` : o.name }))} value={effectiveCompany.organizationId}
                        onChange={(e) => { const o = l.organizations.find((x) => x.id === e.target.value); setCompanyTouched(true); setCompany({ organizationId: e.target.value, legalName: s(o?.legalName), taxNumber: s(o?.taxNumber), taxOffice: s(o?.taxOffice), address: s(o?.address) }); }} />
                    <LInput label="Ticari unvan" value={effectiveCompany.legalName} onChange={(e) => setC('legalName', e.target.value)} />
                    <LInput label="Vergi no" value={effectiveCompany.taxNumber} onChange={(e) => setC('taxNumber', e.target.value)} />
                    <LInput label="Vergi dairesi" value={effectiveCompany.taxOffice} onChange={(e) => setC('taxOffice', e.target.value)} />
                    <LInput label="Şirket adresi" className="sm:col-span-2 lg:col-span-4" value={effectiveCompany.address} onChange={(e) => setC('address', e.target.value)} />
                </div>
                <p className="text-xs text-gray-500">Şirket bilgileri rehberdeki şirket kaydına yazılır; boş bırakılan alan mevcut bilgiyi silmez.</p>
            </Card>

            <Card className="space-y-4">
                <Step n={2} title="Masa / ofis" hint={pickedUnits.length ? `${pickedUnits.length} bölüm · ${new Intl.NumberFormat('tr-TR').format(totalArea)} m²` : undefined} />
                <div className="flex flex-wrap items-end gap-3">
                    <div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" aria-hidden /><input aria-label="Bölüm ara" value={unitQuery} onChange={(e) => setUnitQuery(e.target.value)} placeholder="Kod, bina, kat" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white" /></div>
                    <Toggle id="pw-free" checked={onlyFree} onChange={setOnlyFree} label="Yalnız boş yeri olanlar" />
                    <Link href="/admin/alan-yonetimi/bolumler" className="text-xs text-primary hover:underline">Masa / ofis ekle</Link>
                </div>
                {fe('units') && <p className="text-xs text-rose-400">{fe('units')}</p>}
                {groups.length === 0 ? <p className="text-sm text-gray-500">{l.units.length ? 'Filtreye uyan bölüm yok.' : 'Henüz masa / ofis tanımlı değil. Bina, Kat & Ofisler’den ekleyin (toplu masa ekleme var).'}</p> : (
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                        {groups.map(([g, list]) => (
                            <fieldset key={g}>
                                <legend className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-400"><Building2 className="h-3.5 w-3.5" aria-hidden />{g}</legend>
                                <div className="flex flex-wrap gap-1.5">
                                    {list.map((u) => {
                                        const on = picked.some((p) => p.unitId === u.id);
                                        const full = u.unitType !== 'COMMON' && (u.freeSlots ?? 0) === 0;
                                        return (
                                            <button key={u.id} type="button" aria-pressed={on} disabled={full && !on} onClick={() => toggle(u)}
                                                title={`${u.unitTypeLabel} · ${u.area} m²${u.tenants.length ? ` · ${u.tenants.map((t) => t.name + (t.label ? ` (${t.label})` : '')).join(', ')}` : ''}`}
                                                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/25'}`}>
                                                <span className="font-semibold">{u.code}</span> <span className="text-gray-500">{u.unitTypeLabel}</span>
                                                <span className="block text-[10px] text-gray-500">{u.unitType === 'COMMON' ? 'Ortak alan' : `${u.maxTenants - (u.freeSlots ?? 0)}/${u.maxTenants} dolu`}{u.tenants.length ? ` · ${u.tenants[0].name}${u.tenants.length > 1 ? ` +${u.tenants.length - 1}` : ''}` : ''}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        ))}
                    </div>
                )}
                {pickedUnits.length > 0 && (
                    <ul className="space-y-2 border-t border-white/5 pt-3">
                        {pickedUnits.map((p, i) => (
                            <li key={p.unitId} className="flex flex-wrap items-end gap-3">
                                <span className="min-w-[10rem] text-sm text-white">{p.unit.code} <span className="text-xs text-gray-500">{p.unit.building} · {p.unit.floor} · {p.unit.unitTypeLabel}</span>{fe(`units.${i}`) && <span className="block text-xs text-rose-400">{fe(`units.${i}`)}</span>}</span>
                                <LInput label="Masa / yer no (isteğe bağlı)" className="w-48" placeholder={p.unit.maxTenants > 1 ? 'ör. Masa 2' : ''} value={p.unitLabel} onChange={(e) => setPicked((all) => all.map((x) => (x.unitId === p.unitId ? { ...x, unitLabel: e.target.value } : x)))} />
                                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => toggle(p.unit)} aria-label={`${p.unit.code} çıkar`}>Çıkar</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card className="space-y-4">
                <Step n={3} title="Tarihler ve sözleşme" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <LInput label="Başlangıç" type="date" required value={dates.startDate} onChange={(e) => setDates({ ...dates, startDate: e.target.value })} error={fe('startDate')} />
                    <LInput label="Bitiş" type="date" required value={dates.endDate} onChange={(e) => setDates({ ...dates, endDate: e.target.value })} error={fe('endDate')} />
                    <div className="flex items-end pb-1 sm:col-span-2"><Toggle id="pw-contract" checked={contractMode === 'new'} onChange={(v) => setContractMode(v ? 'new' : 'none')} label="Kira sözleşmesi oluştur (ıslak imzalı taramayla)" /></div>
                </div>
                {contractMode === 'new' && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <LInput label="Sözleşme no" required value={contract.contractNo} onChange={(e) => setContract({ ...contract, contractNo: e.target.value })} error={fe('contract.contractNo') || fe('contractNo')} />
                            <LInput label="Sözleşme (imza) tarihi" type="date" required value={contract.contractDate} onChange={(e) => setContract({ ...contract, contractDate: e.target.value })} />
                            <LInput label="Aylık kira (KDV hariç)" type="number" min="0" step="0.01" required value={contract.monthlyRent} onChange={(e) => setContract({ ...contract, monthlyRent: e.target.value })} error={fe('monthlyRent')} />
                            <LInput label="KDV oranı (%)" type="number" min="0" max="100" required value={contract.vatRate} onChange={(e) => setContract({ ...contract, vatRate: e.target.value })} error={fe('vatRate')} hint={net ? `Toplam ${fmtMoney(Math.round(net * (100 + vat)) / 100, contract.currency)}` : undefined} />
                            <LInput label="Ödeme günü" type="number" min="1" max="31" required value={contract.dueDay} onChange={(e) => setContract({ ...contract, dueDay: e.target.value })} error={fe('dueDay')} />
                            <LInput label="Depozito" type="number" min="0" step="0.01" value={contract.depositAmount} onChange={(e) => setContract({ ...contract, depositAmount: e.target.value })} />
                            <LInput label="Yetkili kişi" value={contract.contactPersonName} onChange={(e) => setContract({ ...contract, contactPersonName: e.target.value })} />
                            <LInput label="Kira e-postası" type="email" placeholder={mode === 'existing' ? ent?.email ?? '' : newFirm.email} value={contract.contactEmail} onChange={(e) => setContract({ ...contract, contactEmail: e.target.value })} error={fe('contactEmail')} />
                        </div>
                        <div className="flex flex-wrap items-end gap-4">
                            <Toggle id="pw-waived" checked={waived} onChange={setWaived} label="Kira muaf" />
                            {waived && <LInput label="Muafiyet gerekçesi" required className="min-w-[16rem] flex-1" value={waiverReason} onChange={(e) => setWaiverReason(e.target.value)} error={fe('waiverReason')} />}
                        </div>
                        <div className="rounded-xl border border-dashed border-white/15 p-4">
                            <p className="mb-2 text-sm font-medium text-white">Islak imzalı sözleşme taraması</p>
                            {scan ? (
                                <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden /> {scan.fileName} yüklendi <Button size="sm" variant="ghost" onClick={() => setScan(null)}>Kaldır</Button></p>
                            ) : (
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">
                                    <FileUp className="h-4 w-4" aria-hidden /> {uploading ? 'Yükleniyor…' : 'PDF / JPG / PNG seç'}
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} disabled={uploading} />
                                </label>
                            )}
                            <p className="mt-1 text-xs text-gray-500">İsteğe bağlı; sonradan sözleşme ekranından da yüklenebilir. Dosya yalnız yetkili kullanıcılara açıktır.</p>
                        </div>
                        <LTextArea label="Not" value={contract.notes} onChange={(e) => setContract({ ...contract, notes: e.target.value })} />
                    </>
                )}
            </Card>

            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d0d17]/95 p-3 backdrop-blur">
                <p className="text-sm text-gray-300">
                    {mode === 'existing' ? ent?.name ?? 'Firma seçilmedi' : newFirm.name || 'Yeni firma'} · {pickedUnits.length ? pickedUnits.map((p) => p.unit.code + (p.unitLabel ? ` (${p.unitLabel})` : '')).join(', ') : <Badge tone="warning">Bölüm seçilmedi</Badge>}
                    {contractMode === 'new' && net > 0 && <> · {fmtMoney(net, contract.currency)} + KDV</>}
                </p>
                <Button type="submit" variant="primary" icon={Wand2} loading={saving} disabled={!pickedUnits.length || (mode === 'existing' ? !entrepreneurId : !newFirm.name)}>Kaydet ve bağla</Button>
            </div>
        </form>
    );
}

function Step({ n, title, hint }: { n: number; title: string; hint?: string }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">{n}</span>{title}</h2>
            {hint && <span className="text-xs text-gray-400">{hint}</span>}
        </div>
    );
}
