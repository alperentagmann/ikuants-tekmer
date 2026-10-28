"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { Alert, Badge, Button, EmptyState, Modal, Toggle } from '@/components/admin/ui';
import { api, useApi, useMe, LInput, LSelect, LoadingRows, ErrorState } from '@/components/admin/ops-kit';

type Member = {
    id: string; status: string; role: string; roleLabel: string; position: string | null; department: string | null; employmentType: string | null;
    isPrimaryContact: boolean; isFinanceContact: boolean; isAuthorizedSignatory: boolean; isRdStaff: boolean;
    person: { id: string; fullName: string; email: string | null; phone: string | null; title: string | null; tcNumberMasked: string | null };
};
type Data = { organizations: { id: string; name: string; legalName: string | null }[]; summary: { total: number; byRole: { role: string; label: string; count: number }[]; signatories: string[]; rdStaff: number }; members: Member[]; roles: Record<string, string> };

/** Firmanın personeli: gerçek kayıtlar (rehber + şirket üyeliği). Kişi ekleme yerinde yapılır ve rehbere de düşer. */
export function FirmPeoplePanel({ entrepreneurId, compact = false }: { entrepreneurId: string; compact?: boolean }) {
    const { can } = useMe();
    const q = useApi<Data>(`/api/admin/entrepreneurs/${entrepreneurId}/people`);
    const [adding, setAdding] = useState(false);
    const [showFormer, setShowFormer] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />;
    if (!q.data) return <LoadingRows rows={3} />;
    const d = q.data;
    const members = d.members.filter((m) => showFormer || m.status === 'ACTIVE');
    const end = async (m: Member) => {
        if (!window.confirm(`${m.person.fullName} firmadan ayrıldı olarak işaretlensin mi? (Kayıt silinmez.)`)) return;
        await api(`/api/admin/entrepreneurs/${entrepreneurId}/people`, { method: 'POST', json: { endMembershipId: m.id } }).then(() => { setMsg(`${m.person.fullName} ayrıldı olarak işaretlendi.`); q.reload(); }).catch((e) => setMsg((e as Error).message));
    };
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-400">
                    {d.summary.total ? <>{d.summary.total} aktif kişi{d.summary.byRole.length ? ` (${d.summary.byRole.map((r) => `${r.count} ${r.label.toLocaleLowerCase('tr-TR')}`).join(', ')})` : ''}{d.summary.rdStaff ? ` · ${d.summary.rdStaff} Ar-Ge personeli` : ''}</> : 'Kayıtlı personel yok'}
                    {d.summary.signatories.length > 0 && <> · İmza yetkilisi: {d.summary.signatories.join(', ')}</>}
                </p>
                <div className="flex items-center gap-2">
                    {!compact && <Toggle id={`former-${entrepreneurId}`} checked={showFormer} onChange={setShowFormer} label="Ayrılanları göster" />}
                    {can('update', 'persons') && <Button size="sm" variant="primary" icon={UserPlus} onClick={() => setAdding(true)}>Personel / kişi ekle</Button>}
                </div>
            </div>
            {msg && <Alert tone="info" onClose={() => setMsg(null)}>{msg}</Alert>}
            {members.length === 0 ? <EmptyState icon={Users} title="Personel kaydı yok" description="“Personel / kişi ekle” ile ekleyin; kişi kişi rehberine de kaydolur." /> : (
                <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
                    {members.slice(0, compact ? 6 : undefined).map((m) => (
                        <li key={m.id} className={`flex flex-wrap items-center gap-2 px-3 py-2 text-sm ${m.status !== 'ACTIVE' ? 'opacity-50' : ''}`}>
                            <Link href={`/admin/rehber?personId=${m.person.id}`} className="font-medium text-white hover:underline">{m.person.fullName}</Link>
                            <Badge>{m.roleLabel}</Badge>
                            {m.position && <span className="text-xs text-gray-400">{m.position}</span>}
                            {m.isAuthorizedSignatory && <Badge tone="info">İmza yetkilisi</Badge>}
                            {m.isFinanceContact && <Badge tone="warning">Finans</Badge>}
                            {m.isPrimaryContact && <Badge tone="success">Ana iletişim</Badge>}
                            {m.isRdStaff && <Badge tone="primary">Ar-Ge</Badge>}
                            {m.status !== 'ACTIVE' && <Badge>Ayrıldı</Badge>}
                            <span className="ml-auto text-xs text-gray-500">{[m.person.email, m.person.phone].filter(Boolean).join(' · ')}</span>
                            {m.status === 'ACTIVE' && can('update', 'persons') && <Button size="sm" variant="ghost" icon={UserMinus} onClick={() => end(m)} aria-label={`${m.person.fullName} ayrıldı`}>Ayrıldı</Button>}
                        </li>
                    ))}
                </ul>
            )}
            {compact && d.members.length > 6 && <p className="text-xs text-gray-500">+{d.members.length - 6} kişi daha · Detay sayfasında “Kurucular & Ekip” sekmesi</p>}
            {adding && <AddPersonModal entrepreneurId={entrepreneurId} roles={d.roles} onClose={() => setAdding(false)} onSaved={(name) => { setAdding(false); setMsg(`${name} eklendi ve kişi rehberine kaydedildi.`); q.reload(); }} />}
        </div>
    );
}

function AddPersonModal({ entrepreneurId, roles, onClose, onSaved }: { entrepreneurId: string; roles: Record<string, string>; onClose: () => void; onSaved: (name: string) => void }) {
    const [mode, setMode] = useState<'new' | 'existing'>('new');
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<{ id: string; fullName: string; email: string | null }[]>([]);
    const [personId, setPersonId] = useState('');
    const [p, setP] = useState({ firstName: '', lastName: '', email: '', phone: '', tcNumber: '' });
    const [m, setM] = useState({ role: 'EMPLOYEE', position: '', department: '', employmentType: '' });
    const [flags, setFlags] = useState({ isPrimaryContact: false, isFinanceContact: false, isAuthorizedSignatory: false, isRdStaff: false });
    const [saving, setSaving] = useState(false);
    const [problem, setProblem] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    useEffect(() => {
        if (mode !== 'existing' || search.trim().length < 2) { setResults([]); return; }
        const t = setTimeout(() => { api<{ items: { id: string; fullName: string; email: string | null }[] }>(`/api/admin/persons?search=${encodeURIComponent(search.trim())}&limit=10`).then((r) => setResults(r.items)).catch(() => setResults([])); }, 250);
        return () => clearTimeout(t);
    }, [search, mode]);
    const save = async () => {
        setSaving(true); setProblem(null); setErrors({});
        try {
            await api(`/api/admin/entrepreneurs/${entrepreneurId}/people`, { method: 'POST', json: { ...(mode === 'new' ? { newPerson: p } : { personId }), ...m, ...flags } });
            onSaved(mode === 'new' ? `${p.firstName} ${p.lastName}` : results.find((r) => r.id === personId)?.fullName ?? 'Kişi');
        } catch (e) {
            const err = e as Error & { data?: { fieldErrors?: Record<string, string> } };
            setErrors(Object.fromEntries(Object.entries(err.data?.fieldErrors ?? {}).map(([k, val]) => [k.replace('newPerson.', ''), val])));
            setProblem(err.message);
        } finally { setSaving(false); }
    };
    return (
        <Modal open onClose={onClose} size="lg" title="Personel / kişi ekle" description="Kişi kişi rehberine kaydolur ve firmanın şirket kaydına bağlanır. Aynı e-postalı kişi rehberde varsa yenisi açılmaz."
            footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button variant="primary" loading={saving} disabled={mode === 'existing' ? !personId : !p.firstName || !p.lastName} onClick={save}>Ekle</Button></>}>
            <div className="space-y-4">
                {problem && <Alert tone="danger">{problem}</Alert>}
                <div role="radiogroup" aria-label="Kişi" className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                    {(['new', 'existing'] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`rounded-md px-3 py-1.5 text-sm ${mode === k ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{k === 'new' ? 'Yeni kişi' : 'Rehberden seç'}</button>)}
                </div>
                {mode === 'new' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <LInput label="Ad" required value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} error={errors.firstName} />
                        <LInput label="Soyad" required value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} error={errors.lastName} />
                        <LInput label="E-posta" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} error={errors.email} />
                        <LInput label="Telefon" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
                        <LInput label="T.C. kimlik no (isteğe bağlı)" inputMode="numeric" maxLength={11} hint="Şifreli saklanır, maskeli gösterilir" value={p.tcNumber} onChange={(e) => setP({ ...p, tcNumber: e.target.value })} />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" aria-hidden /><input aria-label="Rehberde ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad, e-posta veya telefon (en az 2 harf)" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white" /></div>
                        <ul className="max-h-48 space-y-1 overflow-y-auto">{results.map((r) => <li key={r.id}><button type="button" onClick={() => setPersonId(r.id)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${personId === r.id ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-300 hover:border-white/25'}`}>{r.fullName}<span className="ml-2 text-xs text-gray-500">{r.email}</span></button></li>)}</ul>
                        {search.trim().length >= 2 && !results.length && <p className="text-xs text-gray-500">Rehberde bulunamadı. “Yeni kişi” ile ekleyin.</p>}
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    <LSelect label="Firmadaki rolü" options={Object.entries(roles).map(([value, label]) => ({ value, label }))} value={m.role} onChange={(e) => setM({ ...m, role: e.target.value })} />
                    <LInput label="Unvan / pozisyon" value={m.position} onChange={(e) => setM({ ...m, position: e.target.value })} />
                    <LInput label="Departman" value={m.department} onChange={(e) => setM({ ...m, department: e.target.value })} />
                    <LSelect label="Çalışma şekli" placeholder="Belirtilmedi" options={[{ value: 'FULL_TIME', label: 'Tam zamanlı' }, { value: 'PART_TIME', label: 'Yarı zamanlı' }, { value: 'INTERN', label: 'Stajyer' }, { value: 'CONSULTANT', label: 'Danışman' }, { value: 'CONTRACT', label: 'Sözleşmeli' }, { value: 'VOLUNTEER', label: 'Gönüllü' }]} value={m.employmentType} onChange={(e) => setM({ ...m, employmentType: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-4">
                    <Toggle id="fp-primary" checked={flags.isPrimaryContact} onChange={(v) => setFlags({ ...flags, isPrimaryContact: v })} label="Ana iletişim" />
                    <Toggle id="fp-finance" checked={flags.isFinanceContact} onChange={(v) => setFlags({ ...flags, isFinanceContact: v })} label="Finans yetkilisi" />
                    <Toggle id="fp-sign" checked={flags.isAuthorizedSignatory} onChange={(v) => setFlags({ ...flags, isAuthorizedSignatory: v })} label="İmza yetkilisi" />
                    <Toggle id="fp-rd" checked={flags.isRdStaff} onChange={(v) => setFlags({ ...flags, isRdStaff: v })} label="Ar-Ge personeli" />
                </div>
            </div>
        </Modal>
    );
}
