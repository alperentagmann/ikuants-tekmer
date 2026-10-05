'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageGalleryEditor, type GalleryImage } from '@/components/admin/ImageGalleryEditor';
import Link from 'next/link';
import { Building2, CalendarClock, KeySquare, Search, Plus, Pencil, Boxes, CheckCircle2, XCircle, Clock, Repeat, UserPlus, Archive, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, EmptyState, Drawer, Modal, Tabs, Field, TextInput, TextArea, Select, Toggle, KeyValue, inputClass, api, formatDate } from '@/components/admin/ui';
import { ExperienceEditor } from '@/components/admin/spaces/ExperienceEditor';
import { PricingMachinesEditor } from '@/components/admin/spaces/PricingMachinesEditor';
import { facilityPricing, isMachineType, pricingLabel, type FacilityPricing, type MachineInfo } from '@/lib/machines';

type Tab = 'alanlar' | 'rezervasyonlar' | 'tahsisler' | 'musaitlik';

interface Space {
    id: string; name: string; description: string; spaceType: string; isActive: boolean; spaceCode: string | null;
    capacity: number | null; floor: string | null; squareMeters: number | null; equipment: string | null; amenities: string | null;
    status: string; reservationEnabled: boolean; publicVisible: boolean; approvalRequired: boolean;
    bufferBeforeMinutes: number; bufferAfterMinutes: number; openTime: string | null; closeTime: string | null; workingDays: number[] | null;
    pendingReservations: number; assignmentCount: number;
    coverImageUrl: string | null; gallery: GalleryImage[];
    pricing?: FacilityPricing; machines?: MachineInfo[];
    experience: { isEnabled: boolean; isPublic: boolean; mode: string; hasAsset: boolean; hotspotCount: number } | null;
}
interface Reservation {
    id: string; title: string; status: string; startTime: string; endTime: string; attendeeCount: number; source: string;
    requesterName: string | null; requesterEmail: string | null; requesterPhone: string | null; requesterOrganization: string | null; purpose: string | null;
    meetingNotes: string | null; decisionNote: string | null; alternativeJson: string | null;
    resource: { id: string; name: string; capacity: number | null };
    user: { id: string; name: string } | null; person: { id: string; fullName: string } | null; organization: { id: string; name: string } | null;
}
interface Assignment {
    id: string; status: string; unitLabel: string | null; startDate: string | null; endDate: string | null; notes: string | null;
    facility: { id: string; title: string }; organization: { id: string; name: string } | null; entrepreneur: { id: string; name: string } | null;
    application: { id: string; applicationNumber: string } | null; rentContract: { id: string; contractNo: string; status: string } | null;
}

const RES_STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }> = {
    PENDING_APPROVAL: { label: 'Onay bekliyor', tone: 'warning' },
    CONFIRMED: { label: 'Onaylandı', tone: 'success' },
    CANCELLED: { label: 'İptal / Ret', tone: 'danger' },
    COMPLETED: { label: 'Tamamlandı', tone: 'neutral' },
};
const ASSIGN_STATUS: Record<string, { label: string; tone: 'info' | 'success' | 'neutral' | 'danger' }> = {
    PLANNED: { label: 'Planlandı', tone: 'info' },
    ACTIVE: { label: 'Aktif', tone: 'success' },
    ENDED: { label: 'Sona erdi', tone: 'neutral' },
    CANCELLED: { label: 'İptal', tone: 'danger' },
};
const SPACE_TYPE_LABEL: Record<string, string> = {
    STUDIO: 'Stüdyo', LAB: 'Laboratuvar', MEETING_ROOM: 'Toplantı odası', OPEN_MEETING_TABLE: 'Açık toplantı masası', SEMINAR_AREA: 'Seminer alanı',
    OFFICE: 'Ofis', SHARED_DESK: 'Ortak masa', WORK_AREA: 'Çalışma alanı', FEATURE: 'Bilgi kartı',
    MACHINE_LASER: 'Makine · lazer kesim', MACHINE_SMT: 'Makine · SMT dizgi', MACHINE_3D: 'Makine · 3D baskı',
};
const SPACE_STATUS = [{ value: 'AVAILABLE', label: 'Kullanılabilir' }, { value: 'MAINTENANCE', label: 'Bakımda' }, { value: 'CLOSED', label: 'Kapalı' }];
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const ist = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', ...opts });
const time = (iso: string) => ist(iso, { hour: '2-digit', minute: '2-digit' });
const unknown = <span className="text-gray-500">Bilgi girilmemiş</span>;

export default function SpacesPage() {
    const [tab, setTab] = useState<Tab>('alanlar');
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [resStatus, setResStatus] = useState('PENDING_APPROVAL');
    const [resFacility, setResFacility] = useState('');
    const [resSearch, setResSearch] = useState('');
    const [resFrom, setResFrom] = useState('');
    const [resTo, setResTo] = useState('');

    const [editSpace, setEditSpace] = useState<(Partial<Space> & { id?: string }) | null>(null);
    const [spaceDrawerTab, setSpaceDrawerTab] = useState<'details' | 'photos' | 'experience'>('details');
    const [saving, setSaving] = useState(false);

    const [decision, setDecision] = useState<{ reservation: Reservation; action: 'reject' | 'cancel' | 'suggest_time' | 'suggest_space' } | null>(null);
    const [decisionNote, setDecisionNote] = useState('');
    const [decisionSuggestion, setDecisionSuggestion] = useState('');
    const [linkFor, setLinkFor] = useState<Reservation | null>(null);
    const [personSearch, setPersonSearch] = useState('');
    const [personResults, setPersonResults] = useState<{ id: string; fullName: string; email: string | null }[]>([]);

    const [createRes, setCreateRes] = useState(false);
    const [resForm, setResForm] = useState({ spaceId: '', title: '', date: '', startTime: '10:00', endTime: '11:00', attendeeCount: 1, purpose: '', confirm: true });

    const [assignForm, setAssignForm] = useState<{ open: boolean; facilityId: string; orgSearch: string; organizationId: string; entrepreneurId: string; unitLabel: string; startDate: string; notes: string }>({ open: false, facilityId: '', orgSearch: '', organizationId: '', entrepreneurId: '', unitLabel: '', startDate: '', notes: '' });
    const [orgResults, setOrgResults] = useState<{ id: string; name: string }[]>([]);
    const [entResults, setEntResults] = useState<{ id: string; name: string }[]>([]);
    const [contractFor, setContractFor] = useState<Assignment | null>(null);
    const [contracts, setContracts] = useState<{ id: string; contractNo: string; spaceName: string; status: string }[]>([]);

    const [check, setCheck] = useState({ spaceId: '', date: '', startTime: '14:00', endTime: '16:00', participantCount: 1 });
    const [checkResult, setCheckResult] = useState<{ isAvailable: boolean; reasons: string[]; capacity: number | null; alternativeSlots: string[]; alternativeSpaces: { id: string; title: string }[] } | null>(null);

    const loadSpaces = useCallback(async () => {
        const d = await api<{ spaces: Space[] }>('/api/admin/spaces');
        setSpaces(d.spaces);
    }, []);
    const loadReservations = useCallback(async () => {
        const p = new URLSearchParams();
        if (resStatus) p.set('status', resStatus);
        if (resFacility) p.set('facilityId', resFacility);
        if (resSearch) p.set('search', resSearch);
        if (resFrom) p.set('from', resFrom);
        if (resTo) p.set('to', resTo);
        const d = await api<{ reservations: Reservation[] }>(`/api/admin/spaces/reservations?${p.toString()}`);
        setReservations(d.reservations);
    }, [resStatus, resFacility, resSearch, resFrom, resTo]);
    const loadAssignments = useCallback(async () => {
        const d = await api<{ assignments: Assignment[] }>('/api/admin/space-assignments');
        setAssignments(d.assignments);
    }, []);

    useEffect(() => {
        const qp = new URLSearchParams(window.location.search);
        const t = qp.get('tab');
        const initialTab: Tab | null = t === 'rezervasyonlar' || t === 'requests' ? 'rezervasyonlar' : t === 'tahsisler' ? 'tahsisler' : t === 'musaitlik' ? 'musaitlik' : null;
        const timer = window.setTimeout(() => {
            if (initialTab) setTab(initialTab);
            Promise.all([loadSpaces(), loadAssignments()]).catch((e) => setError(e.message)).finally(() => setLoading(false));
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadSpaces, loadAssignments]);

    useEffect(() => {
        const t = setTimeout(() => loadReservations().catch((e) => setError(e.message)), 250);
        return () => clearTimeout(t);
    }, [loadReservations]);

    useEffect(() => {
        if (!linkFor || personSearch.trim().length < 2) return;
        const t = setTimeout(() => api<{ items: { id: string; fullName: string; email: string | null }[] }>(`/api/admin/persons?search=${encodeURIComponent(personSearch)}&limit=8`).then((d) => setPersonResults(d.items || [])).catch(() => setPersonResults([])), 250);
        return () => clearTimeout(t);
    }, [personSearch, linkFor]);

    useEffect(() => {
        if (!assignForm.open || assignForm.orgSearch.trim().length < 2) return;
        const q = encodeURIComponent(assignForm.orgSearch);
        const t = setTimeout(() => {
            api<{ items: { id: string; name: string }[] }>(`/api/admin/organizations?search=${q}&limit=6`).then((d) => setOrgResults(d.items || [])).catch(() => setOrgResults([]));
            api<{ items: { id: string; name: string }[] }>(`/api/admin/entrepreneurs?search=${q}&limit=6`).then((d) => setEntResults(d.items || [])).catch(() => setEntResults([]));
        }, 250);
        return () => clearTimeout(t);
    }, [assignForm.open, assignForm.orgSearch]);

    const pendingCount = useMemo(() => spaces.reduce((s, x) => s + x.pendingReservations, 0), [spaces]);
    const bookable = spaces.filter((s) => s.reservationEnabled && s.isActive);

    const act = async (fn: () => Promise<{ message?: string }>, after?: () => void) => {
        setError(null);
        try {
            const r = await fn();
            setNotice(r.message || 'İşlem tamamlandı.');
            after?.();
            await Promise.all([loadReservations(), loadSpaces(), loadAssignments()]);
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'İşlem başarısız');
            return false;
        }
    };

    const saveSpace = async () => {
        if (!editSpace) return;
        setSaving(true);
        const body = { ...editSpace };
        const ok = await act(() => editSpace.id ? api(`/api/admin/spaces/${editSpace.id}`, { method: 'PUT', json: body }) : api('/api/admin/spaces', { method: 'POST', json: body }));
        setSaving(false);
        if (ok && !editSpace.id) setEditSpace(null);
    };

    return (
        <div>
            <PageHeader
                title="Alanlar & Rezervasyonlar"
                icon={Building2}
                description="Fiziksel alanlar (Facility) tek kaynaktır; rezervasyon projeksiyonu otomatik ve işlemsel olarak senkronize edilir. Bilinmeyen kapasite, kat ve donanım bilgileri boş bırakılır."
                actions={
                    <>
                        <Button icon={CalendarClock} onClick={() => { setResForm({ ...resForm, spaceId: bookable[0]?.id || '' }); setCreateRes(true); }} data-intent="create-reservation">Rezervasyon Oluştur</Button>
                        <Button variant="primary" icon={Plus} onClick={() => { setSpaceDrawerTab('details'); setEditSpace({ name: '', description: '', spaceType: 'MEETING_ROOM', status: 'AVAILABLE', reservationEnabled: true, publicVisible: true, approvalRequired: true, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 }); }}>Yeni Alan</Button>
                    </>
                }
            />
            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert></div>}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}

            <Tabs<Tab>
                value={tab}
                onChange={setTab}
                tabs={[
                    { value: 'alanlar', label: 'Alanlar', icon: Building2, count: spaces.length },
                    { value: 'rezervasyonlar', label: 'Rezervasyonlar', icon: CalendarClock, count: pendingCount || null },
                    { value: 'tahsisler', label: 'Alan Tahsisleri', icon: KeySquare, count: assignments.filter((a) => a.status === 'ACTIVE' || a.status === 'PLANNED').length },
                    { value: 'musaitlik', label: 'Müsaitlik', icon: Search },
                ]}
            />

            {loading ? <Skeleton rows={6} /> : tab === 'alanlar' ? (
                spaces.length === 0 ? <EmptyState icon={Building2} title="Henüz alan yok." action={<Button variant="primary" icon={Plus} onClick={() => setEditSpace({ name: '', spaceType: 'MEETING_ROOM', status: 'AVAILABLE', reservationEnabled: true, publicVisible: true, approvalRequired: true })}>Alan Oluştur</Button>} /> : (
                    <Card padded={false} className="overflow-x-auto">
                        <table className="w-full min-w-[960px] text-left text-sm">
                            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                                <tr>{['Alan', 'Tür & tarife', 'Kapasite', 'Durum', 'Rezervasyon', '3D / 360°', 'Bekleyen', 'İşlemler'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {spaces.map((s) => (
                                    <tr key={s.id} className={!s.isActive ? 'opacity-50' : ''}>
                                        <td className="px-4 py-3"><button type="button" className="text-left font-medium text-white hover:text-primary" onClick={() => { setSpaceDrawerTab('details'); setEditSpace(s); }}>{s.name}</button><div className="font-mono text-[11px] text-gray-500">{s.spaceCode || s.spaceType}</div></td>
                                        <td className="px-4 py-3 text-xs">
                                            <div className="text-gray-300">{SPACE_TYPE_LABEL[s.spaceType] || s.spaceType}</div>
                                            {s.pricing && <Badge tone={s.pricing.model === 'FREE' ? 'success' : 'warning'}>{pricingLabel(s.pricing)}</Badge>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-300">{isMachineType(s.spaceType) ? `${s.machines?.length || 0} makine` : s.capacity !== null ? `${s.capacity} kişi` : unknown}{s.floor && <div className="text-[11px] text-gray-500">{s.floor}</div>}</td>
                                        <td className="px-4 py-3"><Badge tone={s.status === 'AVAILABLE' ? 'success' : 'warning'}>{SPACE_STATUS.find((x) => x.value === s.status)?.label || s.status}</Badge>{!s.isActive && <Badge>Pasif</Badge>}</td>
                                        <td className="px-4 py-3 text-xs text-gray-300">{s.reservationEnabled ? (s.publicVisible ? 'Açık · public' : 'Açık · yalnız admin') : <span className="text-gray-500">Kapalı (bilgi kartı)</span>}</td>
                                        <td className="px-4 py-3 text-xs">{s.experience?.hasAsset ? <Badge tone={s.experience.isPublic && s.experience.isEnabled ? 'success' : 'info'}>{s.experience.mode === 'PANORAMA' ? '360°' : '3D'} · {s.experience.isPublic && s.experience.isEnabled ? 'yayında' : 'gizli'}</Badge> : <span className="text-gray-500">Varlık yok</span>}</td>
                                        <td className="px-4 py-3 text-xs">{s.pendingReservations > 0 ? <button type="button" className="text-amber-300 underline" onClick={() => { setResFacility(s.id); setResStatus('PENDING_APPROVAL'); setTab('rezervasyonlar'); }}>{s.pendingReservations} talep</button> : '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                <Button size="sm" icon={Pencil} onClick={() => { setSpaceDrawerTab('details'); setEditSpace(s); }}>Düzenle</Button>
                                                <Button size="sm" icon={Boxes} onClick={() => { setSpaceDrawerTab('experience'); setEditSpace(s); }}>3D & Medya</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )
            ) : tab === 'rezervasyonlar' ? (
                <div className="space-y-4">
                    <Card padded={false}>
                        <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[1fr_180px_220px_150px_150px]">
                            <input aria-label="Ara" value={resSearch} onChange={(e) => setResSearch(e.target.value)} placeholder="Talep sahibi, kurum, e-posta..." className={inputClass} />
                            <Select aria-label="Durum" value={resStatus} onChange={(e) => setResStatus(e.target.value)} options={Object.entries(RES_STATUS).map(([value, v]) => ({ value, label: v.label }))} placeholder="Tüm durumlar" />
                            <Select aria-label="Alan" value={resFacility} onChange={(e) => setResFacility(e.target.value)} options={spaces.map((s) => ({ value: s.id, label: s.name }))} placeholder="Tüm alanlar" />
                            <input aria-label="Başlangıç" type="date" value={resFrom} onChange={(e) => setResFrom(e.target.value)} className={inputClass} />
                            <input aria-label="Bitiş" type="date" value={resTo} onChange={(e) => setResTo(e.target.value)} className={inputClass} />
                        </div>
                    </Card>
                    {reservations.length === 0 ? <EmptyState icon={CalendarClock} title="Bu filtrede rezervasyon yok." /> : (
                        <div className="space-y-3">
                            {reservations.map((r) => {
                                const st = RES_STATUS[r.status] || { label: r.status, tone: 'neutral' as const };
                                return (
                                    <Card key={r.id}>
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge tone={st.tone}>{st.label}</Badge>
                                                    <Badge>{r.source === 'PUBLIC' ? 'Public talep' : 'Admin'}</Badge>
                                                    <span className="text-sm font-medium text-white">{r.resource.name}</span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-200">{ist(r.startTime, { dateStyle: 'full' })} · {time(r.startTime)}–{time(r.endTime)} · {r.attendeeCount} kişi{r.resource.capacity !== null && r.attendeeCount > r.resource.capacity && <span className="ml-1 text-rose-300">(kapasite {r.resource.capacity})</span>}</p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {r.requesterName || r.user?.name || '—'}{r.requesterOrganization ? ` · ${r.requesterOrganization}` : ''}{r.requesterEmail ? ` · ${r.requesterEmail}` : ''}{r.requesterPhone ? ` · ${r.requesterPhone}` : ''}
                                                </p>
                                                {r.purpose && <p className="text-xs text-gray-400">Amaç: {r.purpose}</p>}
                                                {r.meetingNotes && <p className="text-xs text-gray-500">Not: {r.meetingNotes}</p>}
                                                {r.decisionNote && <p className="text-xs text-gray-500">Karar notu: {r.decisionNote}</p>}
                                                <p className="mt-1 text-xs">CRM: {r.person ? <Link className="text-primary hover:underline" href={`/admin/rehber?personId=${r.person.id}`}>{r.person.fullName}</Link> : <span className="text-gray-500">bağlı değil</span>}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 lg:justify-end">
                                                {r.status === 'PENDING_APPROVAL' && (
                                                    <>
                                                        <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => act(() => api('/api/admin/spaces/reservations', { method: 'POST', json: { action: 'approve', reservationId: r.id } }))}>Onayla</Button>
                                                        <Button size="sm" icon={XCircle} onClick={() => { setDecision({ reservation: r, action: 'reject' }); setDecisionNote(''); setDecisionSuggestion(''); }}>Reddet</Button>
                                                        <Button size="sm" icon={Clock} onClick={() => { setDecision({ reservation: r, action: 'suggest_time' }); setDecisionNote(''); setDecisionSuggestion(''); }}>Alternatif Zaman</Button>
                                                        <Button size="sm" icon={Repeat} onClick={() => { setDecision({ reservation: r, action: 'suggest_space' }); setDecisionNote(''); setDecisionSuggestion(''); }}>Alternatif Alan</Button>
                                                    </>
                                                )}
                                                {r.status === 'CONFIRMED' && <Button size="sm" icon={XCircle} onClick={() => { setDecision({ reservation: r, action: 'cancel' }); setDecisionNote(''); }}>İptal Et</Button>}
                                                {!r.person && r.requesterName && <Button size="sm" icon={UserPlus} onClick={() => { setLinkFor(r); setPersonSearch(r.requesterEmail || r.requesterName || ''); }}>Kişiye Bağla</Button>}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : tab === 'tahsisler' ? (
                <div className="space-y-4">
                    <div className="flex justify-between gap-2">
                        <p className="text-xs text-gray-400">Kalıcı / uzun süreli alan tahsisleri. TEKMER yer edinme başvurusu kabul edildiğinde tahsis süreci başvurudan başlatılır; sözleşme ayrıca bağlanır.</p>
                        <Button icon={Plus} onClick={() => setAssignForm({ open: true, facilityId: spaces[0]?.id || '', orgSearch: '', organizationId: '', entrepreneurId: '', unitLabel: '', startDate: '', notes: '' })}>Tahsis Ekle</Button>
                    </div>
                    {assignments.length === 0 ? <EmptyState icon={KeySquare} title="Henüz alan tahsisi yok." /> : (
                        <Card padded={false} className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                                    <tr>{['Alan', 'Tahsis edilen', 'Durum', 'Tarih', 'Kaynak', 'Sözleşme', 'İşlemler'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {assignments.map((a) => (
                                        <tr key={a.id}>
                                            <td className="px-4 py-3 text-gray-100">{a.facility.title}{a.unitLabel ? <span className="text-gray-500"> · {a.unitLabel}</span> : null}</td>
                                            <td className="px-4 py-3 text-xs">{a.organization ? <Link className="text-primary hover:underline" href={`/admin/rehber?organizationId=${a.organization.id}`}>{a.organization.name}</Link> : null}{a.entrepreneur ? <div><Link className="text-primary hover:underline" href={`/admin/girisimciler/${a.entrepreneur.id}`}>{a.entrepreneur.name}</Link></div> : null}</td>
                                            <td className="px-4 py-3"><Badge tone={ASSIGN_STATUS[a.status]?.tone || 'neutral'}>{ASSIGN_STATUS[a.status]?.label || a.status}</Badge></td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{formatDate(a.startDate)} – {formatDate(a.endDate)}</td>
                                            <td className="px-4 py-3 text-xs">{a.application ? <Link className="text-primary hover:underline" href={`/admin/basvurular/${a.application.id}`}>{a.application.applicationNumber}</Link> : 'Manuel'}</td>
                                            <td className="px-4 py-3 text-xs">{a.rentContract ? <Link className="text-primary hover:underline" href="/admin/finans/kiralar">{a.rentContract.contractNo}</Link> : <span className="text-gray-500">Sözleşme yok</span>}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {a.status === 'PLANNED' && <Button size="sm" variant="success" onClick={() => {
                                                        const start = a.startDate ? undefined : window.prompt('Başlangıç tarihi (YYYY-AA-GG)') || undefined;
                                                        act(() => api(`/api/admin/space-assignments/${a.id}`, { method: 'PATCH', json: { status: 'ACTIVE', startDate: start } }));
                                                    }}>Aktifleştir</Button>}
                                                    {a.status === 'ACTIVE' && <Button size="sm" onClick={() => act(() => api(`/api/admin/space-assignments/${a.id}`, { method: 'PATCH', json: { status: 'ENDED' } }))}>Sonlandır</Button>}
                                                    {a.status === 'PLANNED' && <Button size="sm" variant="ghost" onClick={() => act(() => api(`/api/admin/space-assignments/${a.id}`, { method: 'PATCH', json: { status: 'CANCELLED' } }))}>İptal</Button>}
                                                    {!a.rentContract && a.entrepreneur && <Button size="sm" onClick={async () => { setContractFor(a); const d = await api<{ items: { id: string; contractNo: string; spaceName: string; status: string }[] }>(`/api/admin/rent/contracts?entrepreneurId=${a.entrepreneur!.id}`).catch(() => ({ items: [] })); setContracts(d.items); }}>Sözleşme Bağla</Button>}
                                                    {!a.rentContract && a.entrepreneur && <Link href={`/admin/girisimciler/${a.entrepreneur.id}/finans-kira`} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"><ExternalLink className="h-3 w-3" />Sözleşme Oluştur</Link>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </div>
            ) : (
                <Card className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <Field label="Alan" htmlFor="c-space"><Select id="c-space" value={check.spaceId} onChange={(e) => setCheck({ ...check, spaceId: e.target.value })} placeholder="Seçin" options={bookable.map((s) => ({ value: s.id, label: s.name }))} /></Field>
                        <Field label="Tarih" htmlFor="c-date"><TextInput id="c-date" type="date" value={check.date} onChange={(e) => setCheck({ ...check, date: e.target.value })} /></Field>
                        <Field label="Başlangıç" htmlFor="c-s"><TextInput id="c-s" type="time" value={check.startTime} onChange={(e) => setCheck({ ...check, startTime: e.target.value })} /></Field>
                        <Field label="Bitiş" htmlFor="c-e"><TextInput id="c-e" type="time" value={check.endTime} onChange={(e) => setCheck({ ...check, endTime: e.target.value })} /></Field>
                        <Field label="Kişi" htmlFor="c-p"><TextInput id="c-p" type="number" min={1} value={check.participantCount} onChange={(e) => setCheck({ ...check, participantCount: Number(e.target.value) })} /></Field>
                    </div>
                    <Button variant="primary" icon={Search} disabled={!check.spaceId || !check.date} onClick={async () => { try { const d = await api<NonNullable<typeof checkResult>>('/api/admin/spaces/reservations', { method: 'POST', json: { action: 'check_availability', ...check } }); setCheckResult(d); } catch (e) { setError(e instanceof Error ? e.message : 'Kontrol edilemedi'); } }}>Müsaitliği Kontrol Et</Button>
                    {checkResult && (
                        <Alert tone={checkResult.isAvailable ? 'success' : 'warning'} title={checkResult.isAvailable ? 'Alan müsait' : 'Alan bu aralıkta uygun değil'}>
                            {checkResult.reasons.length > 0 && <ul className="list-disc pl-4">{checkResult.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                            {checkResult.capacity === null && <p>Kapasite bilgisi girilmemiş.</p>}
                            {checkResult.alternativeSlots.length > 0 && <p>Aynı gün uygun saatler: {checkResult.alternativeSlots.join(', ')}</p>}
                            {checkResult.alternativeSpaces.length > 0 && <p>Uygun diğer alanlar: {checkResult.alternativeSpaces.map((s) => s.title).join(', ')}</p>}
                        </Alert>
                    )}
                </Card>
            )}

            <Drawer
                open={Boolean(editSpace)}
                onClose={() => setEditSpace(null)}
                title={editSpace?.id ? editSpace.name || 'Alan' : 'Yeni alan'}
                footer={spaceDrawerTab !== 'experience' ? (
                    <div className="flex w-full justify-between gap-2">
                        {editSpace?.id && editSpace.isActive ? <Button variant="ghost" icon={Archive} onClick={() => act(() => api(`/api/admin/spaces/${editSpace.id}`, { method: 'DELETE' }), () => setEditSpace(null))}>Pasife Al</Button> : <span />}
                        <Button variant="primary" loading={saving} onClick={saveSpace}>Kaydet</Button>
                    </div>
                ) : undefined}
            >
                {editSpace && (
                    <>
                        {editSpace.id && <Tabs value={spaceDrawerTab} onChange={setSpaceDrawerTab} tabs={[{ value: 'details', label: 'Alan Bilgileri', icon: Building2 }, { value: 'photos', label: 'Fotoğraflar', icon: ImageIcon }, { value: 'experience', label: '3D / 360°', icon: Boxes }]} />}
                        {spaceDrawerTab === 'photos' && editSpace.id && (
                            <ImageGalleryEditor cover={editSpace.coverImageUrl || null} gallery={editSpace.gallery || []} onChange={({ cover, gallery }) => setEditSpace({ ...editSpace, coverImageUrl: cover, gallery })} />
                        )}
                        {spaceDrawerTab === 'photos' && editSpace.id ? null : spaceDrawerTab === 'experience' && editSpace.id ? (
                            <ExperienceEditor facilityId={editSpace.id} facilityName={editSpace.name || ''} onSaved={loadSpaces} />
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Alan adı" htmlFor="s-name" required className="sm:col-span-2"><TextInput id="s-name" value={editSpace.name || ''} onChange={(e) => setEditSpace({ ...editSpace, name: e.target.value })} /></Field>
                                <Field label="Tür" htmlFor="s-type"><Select id="s-type" value={editSpace.spaceType || 'MEETING_ROOM'} onChange={(e) => setEditSpace({ ...editSpace, spaceType: e.target.value })} options={[{ value: 'STUDIO', label: 'Stüdyo' }, { value: 'LAB', label: 'Laboratuvar' }, { value: 'MEETING_ROOM', label: 'Toplantı odası' }, { value: 'OPEN_MEETING_TABLE', label: 'Açık toplantı masası' }, { value: 'SEMINAR_AREA', label: 'Seminer alanı' }, { value: 'OFFICE', label: 'Ofis' }, { value: 'SHARED_DESK', label: 'Ortak masa' }, { value: 'WORK_AREA', label: 'Çalışma alanı (bilgi kartı)' }, { value: 'MACHINE_LASER', label: 'Makine — Lazer kesim' }, { value: 'MACHINE_SMT', label: 'Makine — Elektronik dizgi (SMT)' }, { value: 'MACHINE_3D', label: 'Makine — 3D baskı' }]} /></Field>
                                <Field label="Kod" htmlFor="s-code"><TextInput id="s-code" value={editSpace.spaceCode || ''} onChange={(e) => setEditSpace({ ...editSpace, spaceCode: e.target.value })} /></Field>
                                <Field label="Kapasite (kişi)" htmlFor="s-cap" hint="Bilinmiyorsa boş bırakın."><TextInput id="s-cap" type="number" min={1} value={editSpace.capacity ?? ''} onChange={(e) => setEditSpace({ ...editSpace, capacity: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                                <Field label="Konum / kat" htmlFor="s-floor"><TextInput id="s-floor" value={editSpace.floor || ''} onChange={(e) => setEditSpace({ ...editSpace, floor: e.target.value })} /></Field>
                                <Field label="Metrekare" htmlFor="s-m2"><TextInput id="s-m2" type="number" min={1} value={editSpace.squareMeters ?? ''} onChange={(e) => setEditSpace({ ...editSpace, squareMeters: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                                <Field label="Durum" htmlFor="s-status"><Select id="s-status" value={editSpace.status || 'AVAILABLE'} onChange={(e) => setEditSpace({ ...editSpace, status: e.target.value })} options={SPACE_STATUS} /></Field>
                                <Field label="Açıklama" htmlFor="s-desc" className="sm:col-span-2"><TextArea id="s-desc" value={editSpace.description || ''} onChange={(e) => setEditSpace({ ...editSpace, description: e.target.value })} /></Field>
                                <Field label="Donanım" htmlFor="s-eq" className="sm:col-span-2" hint="Yalnız alanda gerçekten bulunan donanım."><TextInput id="s-eq" value={editSpace.equipment || ''} onChange={(e) => setEditSpace({ ...editSpace, equipment: e.target.value })} /></Field>
                                <Field label="Olanaklar" htmlFor="s-am" className="sm:col-span-2"><TextInput id="s-am" value={editSpace.amenities || ''} onChange={(e) => setEditSpace({ ...editSpace, amenities: e.target.value })} /></Field>
                                <Field label="Açılış saati" htmlFor="s-open"><TextInput id="s-open" type="time" value={editSpace.openTime || ''} onChange={(e) => setEditSpace({ ...editSpace, openTime: e.target.value || null })} /></Field>
                                <Field label="Kapanış saati" htmlFor="s-close"><TextInput id="s-close" type="time" value={editSpace.closeTime || ''} onChange={(e) => setEditSpace({ ...editSpace, closeTime: e.target.value || null })} /></Field>
                                <Field label="Öncesi tampon (dk)" htmlFor="s-bb"><TextInput id="s-bb" type="number" min={0} value={editSpace.bufferBeforeMinutes ?? 0} onChange={(e) => setEditSpace({ ...editSpace, bufferBeforeMinutes: Number(e.target.value) })} /></Field>
                                <Field label="Sonrası tampon (dk)" htmlFor="s-ba"><TextInput id="s-ba" type="number" min={0} value={editSpace.bufferAfterMinutes ?? 0} onChange={(e) => setEditSpace({ ...editSpace, bufferAfterMinutes: Number(e.target.value) })} /></Field>
                                <div className="sm:col-span-2">
                                    <p className="mb-1 text-xs text-gray-400">Çalışma günleri (seçilmezse kısıt yok)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map((d, i) => {
                                            const day = i + 1;
                                            const sel = (editSpace.workingDays || []).includes(day);
                                            return <button key={d} type="button" onClick={() => setEditSpace({ ...editSpace, workingDays: sel ? (editSpace.workingDays || []).filter((x) => x !== day) : [...(editSpace.workingDays || []), day] })} className={`rounded-md border px-2.5 py-1 text-xs ${sel ? 'border-primary bg-primary/15 text-white' : 'border-white/10 text-gray-400'}`}>{d}</button>;
                                        })}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 sm:col-span-2">
                                    <Toggle id="s-res" checked={editSpace.reservationEnabled === true} onChange={(v) => setEditSpace({ ...editSpace, reservationEnabled: v })} label="Rezervasyona açık" />
                                    <Toggle id="s-pub" checked={editSpace.publicVisible !== false} onChange={(v) => setEditSpace({ ...editSpace, publicVisible: v })} label="Public sitede göster" />
                                    <Toggle id="s-appr" checked={editSpace.approvalRequired !== false} onChange={(v) => setEditSpace({ ...editSpace, approvalRequired: v })} label="Talepler onay gerektirir" />
                                </div>
                                <div className="sm:col-span-2">
                                    <PricingMachinesEditor
                                        spaceType={editSpace.spaceType || ''}
                                        pricing={editSpace.pricing || facilityPricing({ facilityType: editSpace.spaceType || '', featuresJson: null })}
                                        machines={editSpace.machines || []}
                                        onChange={(patch) => setEditSpace({ ...editSpace, ...patch })}
                                    />
                                </div>
                                {editSpace.id && <div className="sm:col-span-2"><KeyValue items={[{ label: 'Bekleyen talep', value: String(editSpace.pendingReservations ?? 0) }, { label: 'Tahsis kaydı', value: String(editSpace.assignmentCount ?? 0) }]} /></div>}
                            </div>
                        )}
                    </>
                )}
            </Drawer>

            <Modal
                open={Boolean(decision)}
                onClose={() => setDecision(null)}
                title={decision ? { reject: 'Talebi reddet', cancel: 'Rezervasyonu iptal et', suggest_time: 'Alternatif zaman öner', suggest_space: 'Alternatif alan öner' }[decision.action] : ''}
                description="Talep sahibine e-posta (sağlayıcı yoksa outbox) olarak iletilir."
                footer={<><Button onClick={() => setDecision(null)}>Vazgeç</Button><Button variant="primary" onClick={async () => { if (!decision) return; const ok = await act(() => api('/api/admin/spaces/reservations', { method: 'POST', json: { action: decision.action, reservationId: decision.reservation.id, note: decisionNote, suggestion: decisionSuggestion } })); if (ok) setDecision(null); }}>Gönder</Button></>}
            >
                {decision && (
                    <div className="space-y-3">
                        {decision.action.startsWith('suggest') && (
                            <Field label={decision.action === 'suggest_space' ? 'Önerilen alan' : 'Önerilen zaman'} htmlFor="d-sug" required>
                                {decision.action === 'suggest_space'
                                    ? <Select id="d-sug" value={decisionSuggestion} onChange={(e) => setDecisionSuggestion(e.target.value)} placeholder="Alan seçin" options={bookable.filter((s) => s.id !== decision.reservation.resource.id).map((s) => ({ value: s.name, label: `${s.name}${s.capacity !== null ? ` (${s.capacity} kişi)` : ''}` }))} />
                                    : <TextInput id="d-sug" value={decisionSuggestion} onChange={(e) => setDecisionSuggestion(e.target.value)} placeholder="Örn: Aynı gün 16:00–18:00" />}
                            </Field>
                        )}
                        <Field label={decision.action === 'reject' || decision.action === 'cancel' ? 'Gerekçe' : 'Not'} htmlFor="d-note" required={decision.action === 'reject' || decision.action === 'cancel'}><TextArea id="d-note" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} /></Field>
                    </div>
                )}
            </Modal>

            <Modal
                open={Boolean(linkFor)}
                onClose={() => setLinkFor(null)}
                title="Talep sahibini CRM'e bağla"
                description="Public talepler otomatik kişi kaydı oluşturmaz. Mevcut bir kişiyi seçin veya yeni kişi oluşturun."
                footer={<><Button onClick={() => setLinkFor(null)}>Vazgeç</Button><Button icon={UserPlus} onClick={async () => { if (!linkFor) return; const ok = await act(() => api('/api/admin/spaces/reservations', { method: 'POST', json: { action: 'link_requester', reservationId: linkFor.id, createPerson: true } })); if (ok) setLinkFor(null); }}>Yeni Kişi Oluştur</Button></>}
            >
                <Field label="Mevcut kişi ara" htmlFor="l-s"><TextInput id="l-s" value={personSearch} onChange={(e) => setPersonSearch(e.target.value)} /></Field>
                <ul className="mt-2 space-y-1">
                    {(personSearch.trim().length >= 2 ? personResults : []).map((p) => <li key={p.id}><button type="button" className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-gray-200 hover:border-primary" onClick={async () => { if (!linkFor) return; const ok = await act(() => api('/api/admin/spaces/reservations', { method: 'POST', json: { action: 'link_requester', reservationId: linkFor.id, personId: p.id } })); if (ok) setLinkFor(null); }}>{p.fullName}<span className="ml-2 text-xs text-gray-500">{p.email}</span></button></li>)}
                    {personSearch.length >= 2 && personResults.length === 0 && <li className="text-xs text-gray-500">Eşleşen kişi yok.</li>}
                </ul>
            </Modal>

            <Modal
                open={createRes}
                onClose={() => setCreateRes(false)}
                title="Rezervasyon oluştur"
                footer={<><Button onClick={() => setCreateRes(false)}>Vazgeç</Button><Button variant="primary" disabled={!resForm.spaceId || !resForm.date || !resForm.title} onClick={async () => { const ok = await act(() => api('/api/admin/spaces/reservations', { method: 'POST', json: { action: 'create', ...resForm, status: resForm.confirm ? 'CONFIRMED' : 'PENDING_APPROVAL' } })); if (ok) setCreateRes(false); }}>Oluştur</Button></>}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Alan" htmlFor="r-sp" required className="sm:col-span-2"><Select id="r-sp" value={resForm.spaceId} onChange={(e) => setResForm({ ...resForm, spaceId: e.target.value })} options={bookable.map((s) => ({ value: s.id, label: s.name }))} /></Field>
                    <Field label="Başlık" htmlFor="r-t" required className="sm:col-span-2"><TextInput id="r-t" value={resForm.title} onChange={(e) => setResForm({ ...resForm, title: e.target.value })} /></Field>
                    <Field label="Tarih" htmlFor="r-d" required><TextInput id="r-d" type="date" value={resForm.date} onChange={(e) => setResForm({ ...resForm, date: e.target.value })} /></Field>
                    <Field label="Kişi" htmlFor="r-p"><TextInput id="r-p" type="number" min={1} value={resForm.attendeeCount} onChange={(e) => setResForm({ ...resForm, attendeeCount: Number(e.target.value) })} /></Field>
                    <Field label="Başlangıç" htmlFor="r-s"><TextInput id="r-s" type="time" value={resForm.startTime} onChange={(e) => setResForm({ ...resForm, startTime: e.target.value })} /></Field>
                    <Field label="Bitiş" htmlFor="r-e"><TextInput id="r-e" type="time" value={resForm.endTime} onChange={(e) => setResForm({ ...resForm, endTime: e.target.value })} /></Field>
                    <Field label="Amaç" htmlFor="r-pu" className="sm:col-span-2"><TextInput id="r-pu" value={resForm.purpose} onChange={(e) => setResForm({ ...resForm, purpose: e.target.value })} /></Field>
                    <div className="sm:col-span-2"><Toggle id="r-c" checked={resForm.confirm} onChange={(v) => setResForm({ ...resForm, confirm: v })} label="Doğrudan onayla (onay yetkisi gerekir)" /></div>
                </div>
            </Modal>

            <Modal
                open={assignForm.open}
                onClose={() => setAssignForm({ ...assignForm, open: false })}
                title="Alan tahsisi ekle"
                footer={<><Button onClick={() => setAssignForm({ ...assignForm, open: false })}>Vazgeç</Button><Button variant="primary" disabled={!assignForm.facilityId || (!assignForm.organizationId && !assignForm.entrepreneurId)} onClick={async () => { const ok = await act(() => api('/api/admin/space-assignments', { method: 'POST', json: assignForm })); if (ok) setAssignForm({ ...assignForm, open: false }); }}>Tahsisi Planla</Button></>}
            >
                <div className="space-y-3">
                    <Field label="Alan" htmlFor="a-f" required><Select id="a-f" value={assignForm.facilityId} onChange={(e) => setAssignForm({ ...assignForm, facilityId: e.target.value })} options={spaces.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name }))} /></Field>
                    <Field label="Kurum veya girişim ara" htmlFor="a-q" required><TextInput id="a-q" value={assignForm.orgSearch} onChange={(e) => setAssignForm({ ...assignForm, orgSearch: e.target.value, organizationId: '', entrepreneurId: '' })} /></Field>
                    <div className="space-y-1">
                        {(assignForm.orgSearch.trim().length >= 2 ? orgResults : []).map((o) => <button key={o.id} type="button" onClick={() => setAssignForm({ ...assignForm, organizationId: o.id, entrepreneurId: '' })} className={`block w-full rounded-lg border px-3 py-1.5 text-left text-sm ${assignForm.organizationId === o.id ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-300'}`}>Kurum: {o.name}</button>)}
                        {(assignForm.orgSearch.trim().length >= 2 ? entResults : []).map((o) => <button key={o.id} type="button" onClick={() => setAssignForm({ ...assignForm, entrepreneurId: o.id, organizationId: '' })} className={`block w-full rounded-lg border px-3 py-1.5 text-left text-sm ${assignForm.entrepreneurId === o.id ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-300'}`}>Girişim: {o.name}</button>)}
                    </div>
                    <Field label="Masa / oda" htmlFor="a-u"><TextInput id="a-u" value={assignForm.unitLabel} onChange={(e) => setAssignForm({ ...assignForm, unitLabel: e.target.value })} /></Field>
                    <Field label="Planlanan başlangıç" htmlFor="a-s"><TextInput id="a-s" type="date" value={assignForm.startDate} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })} /></Field>
                    <Field label="Not" htmlFor="a-n"><TextArea id="a-n" value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} /></Field>
                </div>
            </Modal>

            <Modal open={Boolean(contractFor)} onClose={() => setContractFor(null)} title="Sözleşme bağla" description="Girişimin mevcut kira sözleşmelerinden birini bu tahsise bağlayın.">
                {contracts.length === 0 ? <p className="text-sm text-gray-400">Bu girişimin kira sözleşmesi yok. Önce sözleşme oluşturun.</p> : (
                    <ul className="space-y-1">
                        {contracts.map((c) => <li key={c.id}><button type="button" className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-gray-200 hover:border-primary" onClick={async () => { if (!contractFor) return; const ok = await act(() => api(`/api/admin/space-assignments/${contractFor.id}`, { method: 'PATCH', json: { rentContractId: c.id } })); if (ok) setContractFor(null); }}>{c.contractNo} · {c.spaceName} <span className="text-xs text-gray-500">({c.status})</span></button></li>)}
                    </ul>
                )}
            </Modal>
        </div>
    );
}
