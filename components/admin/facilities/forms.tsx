"use client";
import { useState } from 'react';
import { Alert, Button, Modal } from '@/components/admin/ui';
import { api, useForm, LInput, LSelect, LTextArea, toDateInput } from '@/components/admin/ops-kit';
import type { Lookups } from './shared';

type AnyRow = Record<string, any> & { id: string; updatedAt?: string };
type FormProps = { row?: AnyRow; lookups: Lookups; onClose: () => void; onSaved: (msg: string) => void };
type ApiErr = Error & { data?: { fieldErrors?: Record<string, string> } };

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const numOrEmpty = (v: string) => (v === '' ? '' : Number(v));

/** Ortak kaydet akışı: oluşturma / sürüm kontrollü düzenleme, alan hataları ve 409 çakışma uyarısı. */
function useSave(kind: string, label: string, row: AnyRow | undefined, onSaved: (msg: string) => void) {
    const [problem, setProblem] = useState<string | null>(null);
    const save = async (body: Record<string, unknown>) => {
        setProblem(null);
        if (row) await api(`/api/admin/facility-units/${kind}/${row.id}`, { method: 'PATCH', json: { ...body, expectedUpdatedAt: row.updatedAt } });
        else await api(`/api/admin/facility-units/${kind}`, { method: 'POST', json: body });
        onSaved(row ? `${label} güncellendi.` : `${label} eklendi.`);
    };
    const onError = (e: ApiErr) => {
        if (e.data?.fieldErrors?._conflict) setProblem('Bu kayıt siz düzenlerken başka biri tarafından değiştirildi. Pencereyi kapatıp listeyi yenileyin.');
        else if (!e.data?.fieldErrors || Object.keys(e.data.fieldErrors).length === 0) setProblem(e.message);
    };
    return { save, onError, problem };
}

function Shell({ title, saving, onClose, onSave, problem, children }: { title: string; saving: boolean; onClose: () => void; onSave: () => void; problem: string | null; children: React.ReactNode }) {
    return (
        <Modal open onClose={onClose} title={title} size="lg"
            footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button variant="primary" loading={saving} onClick={onSave}>Kaydet</Button></>}>
            {problem && <div className="mb-4"><Alert tone="warning">{problem}</Alert></div>}
            <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="grid gap-4 sm:grid-cols-2">
                {children}
                <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
            </form>
        </Modal>
    );
}

export function BuildingForm({ row, onClose, onSaved }: FormProps) {
    const f = useForm({ name: str(row?.name), address: str(row?.address), totalArea: str(row?.totalArea), leasableArea: str(row?.leasableArea), notes: str(row?.notes) });
    const s = useSave('buildings', 'Bina', row, onSaved);
    const save = () => f.submit(() => s.save({ ...f.values, totalArea: numOrEmpty(f.values.totalArea), leasableArea: numOrEmpty(f.values.leasableArea) }), s.onError);
    return (
        <Shell title={row ? 'Binayı düzenle' : 'Yeni bina / alan'} saving={f.saving} onClose={onClose} onSave={save} problem={s.problem}>
            <LInput label="Bina / alan adı" required {...f.bind('name')} />
            <LInput label="Adres" {...f.bind('address')} />
            <LInput label="Toplam alan (m²)" type="number" min="0" step="0.01" {...f.bind('totalArea')} />
            <LInput label="Kiralanabilir alan (m²)" type="number" min="0" step="0.01" {...f.bind('leasableArea')} />
            <LTextArea label="Not" className="sm:col-span-2" {...f.bind('notes')} />
        </Shell>
    );
}

export function FloorForm({ row, lookups, onClose, onSaved, defaultBuildingId }: FormProps & { defaultBuildingId?: string }) {
    const f = useForm({ buildingId: str(row?.buildingId ?? defaultBuildingId), name: str(row?.name), sortOrder: str(row?.sortOrder ?? 0), planImageUrl: str(row?.planImageUrl), notes: str(row?.notes) });
    const s = useSave('floors', 'Kat', row, onSaved);
    const save = () => f.submit(() => {
        const { buildingId, ...rest } = f.values;
        return s.save({ ...(row ? {} : { buildingId }), ...rest, sortOrder: Number(rest.sortOrder || 0) });
    }, s.onError);
    return (
        <Shell title={row ? 'Katı düzenle' : 'Yeni kat'} saving={f.saving} onClose={onClose} onSave={save} problem={s.problem}>
            <LSelect label="Bina" required disabled={Boolean(row)} hint={row ? 'Kat başka binaya taşınamaz' : undefined} placeholder="Bina seçin" options={lookups.buildings.map((b) => ({ value: b.id, label: b.name }))} {...f.bind('buildingId')} />
            <LInput label="Kat adı" required placeholder="ör. Zemin Kat" {...f.bind('name')} />
            <LInput label="Sıra" type="number" hint="Listede küçükten büyüğe" {...f.bind('sortOrder')} />
            <LInput label="Kat planı görseli" placeholder="https://… veya /uploads/…" hint="Medya kütüphanesindeki görselin adresi" {...f.bind('planImageUrl')} />
            <LTextArea label="Not" className="sm:col-span-2" {...f.bind('notes')} />
        </Shell>
    );
}

export function UnitForm({ row, lookups, onClose, onSaved }: FormProps) {
    const [buildingId, setBuildingId] = useState(row ? lookups.floors.find((x) => x.id === row.floorId)?.buildingId ?? '' : '');
    const f = useForm({ floorId: str(row?.floorId), code: str(row?.code), unitType: str(row?.unitType || 'OFFICE'), area: str(row?.area), capacity: str(row?.capacity), status: str(row?.status || 'AVAILABLE'), notes: str(row?.notes) });
    const s = useSave('units', 'Bölüm', row, onSaved);
    const save = () => f.submit(() => s.save({ ...f.values, area: numOrEmpty(f.values.area), capacity: numOrEmpty(f.values.capacity) }), s.onError);
    return (
        <Shell title={row ? 'Bölümü düzenle' : 'Yeni bağımsız bölüm'} saving={f.saving} onClose={onClose} onSave={save} problem={s.problem}>
            <LSelect label="Bina" required placeholder="Bina seçin" options={lookups.buildings.map((b) => ({ value: b.id, label: b.name }))} value={buildingId} onChange={(e) => { setBuildingId(e.target.value); f.set('floorId', ''); }} />
            <LSelect label="Kat" required placeholder={buildingId ? 'Kat seçin' : 'Önce bina seçin'} options={lookups.floors.filter((x) => x.buildingId === buildingId).map((x) => ({ value: x.id, label: x.name }))} {...f.bind('floorId')} />
            <LInput label="Bölüm kodu" required placeholder="ör. B-204" hint="Bina içinde benzersiz" {...f.bind('code')} />
            <LSelect label="Tür" required options={lookups.unitTypes} {...f.bind('unitType')} />
            <LInput label="Alan (m²)" type="number" min="0" step="0.01" required {...f.bind('area')} />
            <LInput label="Kapasite (kişi)" type="number" min="0" {...f.bind('capacity')} />
            <LSelect label="Durum" options={lookups.unitStatuses} hint="Dolu durumu firma tahsisinden otomatik gelir" {...f.bind('status')} />
            <LTextArea label="Not" className="sm:col-span-2" {...f.bind('notes')} />
        </Shell>
    );
}

/** Firma–bölüm tahsisi (SpaceAssignment). Firma girişim veya rehberdeki kurum olabilir. */
export function AssignmentForm({ row, lookups, onClose, onSaved, defaultUnitId }: FormProps & { defaultUnitId?: string }) {
    const [firmKind, setFirmKind] = useState<'entrepreneur' | 'organization'>(row?.organizationId && !row?.entrepreneurId ? 'organization' : 'entrepreneur');
    const f = useForm({
        unitId: str(row?.unitId ?? defaultUnitId), entrepreneurId: str(row?.entrepreneurId), organizationId: str(row?.organizationId), rentContractId: str(row?.rentContractId),
        startDate: toDateInput(row?.startDate ?? new Date()), endDate: toDateInput(row?.endDate), notes: str(row?.notes),
    });
    const s = useSave('assignments', 'Tahsis', row, onSaved);
    const contracts = lookups.rentContracts;
    const save = () => f.submit(() => s.save({
        ...f.values,
        entrepreneurId: firmKind === 'entrepreneur' ? f.values.entrepreneurId : '',
        organizationId: firmKind === 'organization' ? f.values.organizationId : '',
        ...(contracts ? {} : { rentContractId: undefined }),
    }), s.onError);
    const contractOptions = (contracts ?? []).filter((c) => firmKind === 'entrepreneur' && c.entrepreneurId === f.values.entrepreneurId).map((c) => ({ value: c.id, label: `${c.contractNo} · ${c.spaceName}` }));
    return (
        <Shell title={row ? 'Tahsisi düzenle' : 'Firma – bölüm eşleştir'} saving={f.saving} onClose={onClose} onSave={save} problem={s.problem}>
            <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 block text-xs font-medium text-gray-400">Firma türü</legend>
                <div className="flex gap-4 text-sm text-gray-200">
                    <label className="flex items-center gap-2"><input type="radio" name="firmKind" checked={firmKind === 'entrepreneur'} onChange={() => setFirmKind('entrepreneur')} /> Girişim</label>
                    <label className="flex items-center gap-2"><input type="radio" name="firmKind" checked={firmKind === 'organization'} onChange={() => setFirmKind('organization')} /> Rehberdeki kurum</label>
                </div>
            </fieldset>
            {firmKind === 'entrepreneur'
                ? <LSelect label="Girişim" required placeholder="Girişim seçin" options={lookups.entrepreneurs.map((x) => ({ value: x.id, label: x.name }))} {...f.bind('entrepreneurId')} />
                : <LSelect label="Kurum" required placeholder="Kurum seçin" options={lookups.organizations.map((x) => ({ value: x.id, label: x.name }))} {...f.bind('organizationId')} error={f.errors.organizationId || f.errors.entrepreneurId} />}
            <LSelect label="Bağımsız bölüm" required placeholder="Bölüm seçin" options={lookups.units.map((u) => ({ value: u.id, label: u.label }))} {...f.bind('unitId')} />
            <LInput label="Başlangıç" type="date" required {...f.bind('startDate')} />
            <LInput label="Bitiş" type="date" hint="Boş bırakılırsa açık uçlu" {...f.bind('endDate')} />
            {contracts ? (
                <LSelect label="Kira sözleşmesi" className="sm:col-span-2" placeholder={contractOptions.length ? 'Sözleşme seçin' : 'Bu firmanın sözleşmesi yok — kaydettikten sonra listeden “Sözleşme oluştur”'} options={contractOptions} {...f.bind('rentContractId')} />
            ) : <p className="text-xs text-gray-500 sm:col-span-2">Kira sözleşmesi bağlamak için kira görme yetkisi gerekir.</p>}
            <LTextArea label="Not" className="sm:col-span-2" {...f.bind('notes')} />
        </Shell>
    );
}

export function PolicyForm({ row, lookups, onClose, onSaved }: FormProps) {
    const [target, setTarget] = useState<'building' | 'unit'>(row?.unitId ? 'unit' : 'building');
    const f = useForm({
        buildingId: str(row?.buildingId), unitId: str(row?.unitId), policyType: str(row?.policyType), coverage: str(row?.coverage), insurer: str(row?.insurer), policyNo: str(row?.policyNo),
        startDate: toDateInput(row?.startDate), endDate: toDateInput(row?.endDate), premium: str(row?.premium), currency: str(row?.currency || 'TRY'), documentUrl: str(row?.documentUrl), notes: str(row?.notes),
    });
    const s = useSave('policies', 'Poliçe', row, onSaved);
    const save = () => f.submit(() => s.save({ ...f.values, buildingId: target === 'building' ? f.values.buildingId : '', unitId: target === 'unit' ? f.values.unitId : '', premium: numOrEmpty(f.values.premium) }), s.onError);
    return (
        <Shell title={row ? 'Poliçeyi düzenle' : 'Yeni poliçe'} saving={f.saving} onClose={onClose} onSave={save} problem={s.problem}>
            <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 block text-xs font-medium text-gray-400">Poliçe kapsamındaki yer</legend>
                <div className="flex gap-4 text-sm text-gray-200">
                    <label className="flex items-center gap-2"><input type="radio" name="target" checked={target === 'building'} onChange={() => setTarget('building')} /> Bina</label>
                    <label className="flex items-center gap-2"><input type="radio" name="target" checked={target === 'unit'} onChange={() => setTarget('unit')} /> Bağımsız bölüm</label>
                </div>
            </fieldset>
            {target === 'building'
                ? <LSelect label="Bina" required placeholder="Bina seçin" options={lookups.buildings.map((b) => ({ value: b.id, label: b.name }))} {...f.bind('buildingId')} />
                : <LSelect label="Bağımsız bölüm" required placeholder="Bölüm seçin" options={lookups.units.map((u) => ({ value: u.id, label: u.label }))} {...f.bind('unitId')} error={f.errors.unitId || f.errors.buildingId} />}
            <LSelect label="Poliçe türü" required placeholder={lookups.policyTypes.length ? 'Tür seçin' : 'Önce Ayarlar → Poliçe türleri'} options={lookups.policyTypes} {...f.bind('policyType')} />
            <LInput label="Sigorta şirketi" required {...f.bind('insurer')} />
            <LInput label="Poliçe no" required {...f.bind('policyNo')} />
            <LInput label="Başlangıç" type="date" required {...f.bind('startDate')} />
            <LInput label="Bitiş" type="date" required {...f.bind('endDate')} />
            <LInput label="Prim" type="number" min="0" step="0.01" {...f.bind('premium')} />
            <LInput label="Para birimi" maxLength={3} {...f.bind('currency')} />
            <LInput label="Poliçe belgesi" className="sm:col-span-2" placeholder="https://… veya /uploads/…" {...f.bind('documentUrl')} />
            <LTextArea label="Kapsam" className="sm:col-span-2" {...f.bind('coverage')} />
            <LTextArea label="Not" className="sm:col-span-2" {...f.bind('notes')} />
        </Shell>
    );
}
