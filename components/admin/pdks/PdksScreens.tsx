"use client";
import { useState } from 'react';
import { Ban, CreditCard, Eye, FileUp, Plus, Power, PowerOff, Pencil, Plug, RotateCcw, Upload, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, EmptyState, Modal, Toggle } from '@/components/admin/ui';
import { api, useApi, useForm, LInput, LSelect, LTextArea, LoadingRows, ErrorState, Stat, TableShell, th, td, fmtDate } from '@/components/admin/ops-kit';
import { DataList, type ListColumn, type ListFilter } from '@/components/admin/list/DataList';
import { ParameterManager } from '@/components/admin/parameters/ParameterManager';

type Opt = { value: string; label: string };
export type PdksLookups = { entrepreneurs: { id: string; name: string }[]; persons: { id: string; label: string }[]; buildings: { id: string; name: string }[]; cards: { id: string; label: string }[]; holderTypes: Opt[]; cardStatuses: Opt[] };
type Notify = { success: (m: string) => void; error: (m: string) => void };

const dt = (d: string | null) => (d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' }) : '—');
const nowLocal = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

/** Firma*, Yıl*, Ay* — spesifikasyon gereği zorunlu kapsam filtreleri. */
export function scopeFilters(l: PdksLookups | undefined): ListFilter[] {
    return [
        { key: 'scope', label: 'Firma', type: 'select', required: true, options: [{ value: 'ALL', label: 'Tümü' }, { value: 'STAFF', label: 'TEKMER personeli' }, { value: 'VISITOR', label: 'Ziyaretçiler' }, { value: 'UNKNOWN', label: 'Tanımsız kartlar' }, ...(l?.entrepreneurs ?? []).map((e) => ({ value: e.id, label: e.name }))] },
        { key: 'year', label: 'Yıl', type: 'year', required: true },
        { key: 'month', label: 'Ay', type: 'month', required: true },
    ];
}
const thisMonth = () => ({ year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1) });

// ─── Anlık durum ─────────────────────────────────────────────────────────────

type OnSite = { onSite: { total: number; staff: number; members: number; visitors: number; other: number; entriesToday: number; people: { cardUid: string; holderName: string; holderTypeLabel: string; entrepreneurName: string | null; since: string }[] }; daily: { day: string; count: number }[] };

export function LiveTab() {
    const d = useApi<OnSite>('/api/admin/pdks/onsite');
    if (d.error) return <Card padded={false}><ErrorState error={d.error} onRetry={d.reload} /></Card>;
    if (!d.data) return <Card padded={false}><LoadingRows rows={3} /></Card>;
    const o = d.data.onSite;
    const max = Math.max(1, ...d.data.daily.map((x) => x.count));
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Stat label="Şu an yerleşkede" value={o.total} tone={o.total ? 'good' : 'default'} />
                <Stat label="TEKMER personeli" value={o.staff} />
                <Stat label="Girişim çalışanı" value={o.members} />
                <Stat label="Ziyaretçi" value={o.visitors} />
                <Stat label="Bugünkü giriş" value={o.entriesToday} />
            </div>
            <Card>
                <h2 className="mb-3 text-sm font-semibold text-white">Son 14 gün giriş sayısı</h2>
                <div className="flex h-32 items-end gap-1.5" role="img" aria-label="Son 14 gün günlük giriş sayısı grafiği">
                    {d.data.daily.map((x) => (
                        <div key={x.day} className="flex flex-1 flex-col items-center gap-1" title={`${x.day}: ${x.count} giriş`}>
                            <span className="text-[10px] tabular-nums text-gray-400">{x.count || ''}</span>
                            <div className="w-full rounded-t bg-primary/70" style={{ height: `${(x.count / max) * 100}%`, minHeight: x.count ? 4 : 1 }} />
                            <span className="text-[10px] text-gray-500">{x.day.slice(8)}</span>
                        </div>
                    ))}
                </div>
            </Card>
            <Card padded={false}>
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3"><h2 className="text-sm font-semibold text-white">Yerleşkedeki kişiler</h2><Button size="sm" variant="ghost" icon={RotateCcw} onClick={d.reload}>Yenile</Button></div>
                {o.people.length === 0 ? <div className="p-4"><EmptyState icon={UserCheck} title="Şu an yerleşkede kayıtlı kimse yok" description="Bugün giriş yapıp çıkış yapmamış kişiler burada görünür." /></div> : (
                    <TableShell>
                        <thead><tr className="border-b border-white/5"><th className={th}>Kişi</th><th className={th}>Tür</th><th className={th}>Firma</th><th className={th}>Giriş</th></tr></thead>
                        <tbody className="divide-y divide-white/5">{o.people.map((p) => <tr key={p.cardUid}><td className={td}>{p.holderName}</td><td className={td}>{p.holderTypeLabel}</td><td className={td}>{p.entrepreneurName ?? '—'}</td><td className={td}>{dt(p.since)}</td></tr>)}</tbody>
                    </TableShell>
                )}
            </Card>
        </div>
    );
}

// ─── PDKS Bilgileri (ham hareketler) ─────────────────────────────────────────

type EventRow = { id: string; cardUid: string; holderName: string; holderTypeLabel: string; entrepreneurName: string | null; direction: string; occurredAt: string; sourceLabel: string; deviceName: string | null; note: string | null; isArchived: boolean; voidReason: string | null };

export function EventsTab({ lookups, canManage, canExport, notify }: { lookups?: PdksLookups; canManage: boolean; canExport: boolean; notify: Notify }) {
    const [manual, setManual] = useState(false);
    const [csv, setCsv] = useState(false);
    const [voiding, setVoiding] = useState<EventRow | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const columns: ListColumn<EventRow>[] = [
        { key: 'occurredAt', label: 'Tarih-saat', sortable: true, render: (r) => dt(r.occurredAt) },
        { key: 'holderName', label: 'Kişi', sortable: true, render: (r) => <span className="font-medium text-white">{r.holderName}</span> },
        { key: 'holderTypeLabel', label: 'Tür' },
        { key: 'entrepreneurName', label: 'Firma', render: (r) => r.entrepreneurName ?? '—' },
        { key: 'direction', label: 'Yön', sortable: true, render: (r) => <Badge tone={r.direction === 'IN' ? 'success' : 'info'}>{r.direction === 'IN' ? 'Giriş' : 'Çıkış'}</Badge> },
        { key: 'sourceLabel', label: 'Kaynak', render: (r) => `${r.sourceLabel}${r.deviceName ? ` · ${r.deviceName}` : ''}` },
        { key: 'cardUid', label: 'Kart', className: 'font-mono text-xs text-gray-400' },
        { key: 'note', label: 'Not', render: (r) => (r.isArchived ? <Badge tone="danger">Geçersiz: {r.voidReason}</Badge> : r.note ?? '') },
    ];
    return (
        <div className="space-y-4">
            {canManage && <div className="flex flex-wrap gap-2"><Button variant="primary" icon={Plus} onClick={() => setManual(true)}>Yeni Ekle (manuel)</Button><Button icon={FileUp} onClick={() => setCsv(true)}>CSV içe aktar</Button></div>}
            <DataList<EventRow> endpoint="/api/admin/pdks/events" label="PDKS hareketleri" columns={columns} filters={[...scopeFilters(lookups), { key: 'direction', label: 'Yön', type: 'select', options: [{ value: 'IN', label: 'Giriş' }, { value: 'OUT', label: 'Çıkış' }] }, { key: 'source', label: 'Kaynak', type: 'select', options: [{ value: 'MANUAL', label: 'Manuel' }, { value: 'CSV', label: 'CSV' }, { value: 'DEVICE', label: 'Cihaz' }] }]}
                initialFilters={thisMonth()} searchPlaceholder="Kişi veya kart UID" canExport={canExport} reloadKey={reloadKey}
                empty={{ title: 'Bu dönemde hareket yok', description: 'Manuel ekleyin, CSV içe aktarın veya cihaz entegrasyonunu kurun.' }}
                rowActions={(r) => canManage && !r.isArchived ? <Button size="sm" variant="ghost" icon={Ban} onClick={() => setVoiding(r)} aria-label={`${r.holderName} hareketini geçersiz kıl`}>Geçersiz kıl</Button> : null} />
            {manual && <ManualEventForm lookups={lookups} onClose={() => setManual(false)} onSaved={() => { setManual(false); notify.success('Hareket kaydedildi.'); setReloadKey((k) => k + 1); }} />}
            {csv && <CsvImport onClose={() => setCsv(false)} onDone={() => setReloadKey((k) => k + 1)} />}
            {voiding && <VoidEvent row={voiding} onClose={() => setVoiding(null)} onDone={() => { setVoiding(null); notify.success('Hareket geçersiz kılındı.'); setReloadKey((k) => k + 1); }} />}
        </div>
    );
}

function ManualEventForm({ lookups, onClose, onSaved }: { lookups?: PdksLookups; onClose: () => void; onSaved: () => void }) {
    const f = useForm({ cardId: '', direction: 'IN', occurredAt: nowLocal(), note: '' });
    const [problem, setProblem] = useState<string | null>(null);
    const save = () => f.submit(async () => {
        await api('/api/admin/pdks/events', { method: 'POST', json: { ...f.values, occurredAt: new Date(f.values.occurredAt).toISOString() } });
        onSaved();
    }, (e) => { if (!e.data?.fieldErrors) setProblem(e.message); });
    return (
        <Modal open onClose={onClose} title="Manuel giriş-çıkış kaydı" footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button variant="primary" loading={f.saving} onClick={save}>Kaydet</Button></>}>
            {problem && <div className="mb-3"><Alert tone="danger">{problem}</Alert></div>}
            <div className="grid gap-4 sm:grid-cols-2">
                <LSelect label="Kart / kişi" required className="sm:col-span-2" placeholder={lookups?.cards.length ? 'Kart seçin' : 'Önce Kartlar sekmesinden kart tanımlayın'} options={(lookups?.cards ?? []).map((c) => ({ value: c.id, label: c.label }))} {...f.bind('cardId')} />
                <LSelect label="Yön" required options={[{ value: 'IN', label: 'Giriş' }, { value: 'OUT', label: 'Çıkış' }]} {...f.bind('direction')} />
                <LInput label="Tarih-saat" type="datetime-local" required {...f.bind('occurredAt')} />
                <LTextArea label="Not" className="sm:col-span-2" placeholder="ör. kart unutuldu, güvenlik kaydından" {...f.bind('note')} />
            </div>
        </Modal>
    );
}

function CsvImport({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ rows: number; created: number; duplicates: number; errors: { line: number; reason: string }[] } | null>(null);
    const [problem, setProblem] = useState<string | null>(null);
    const pick = async (file: File | undefined) => { if (file) setText(await file.text()); };
    const run = async () => {
        setBusy(true); setProblem(null);
        try {
            const r = await api<{ result: NonNullable<typeof result> }>('/api/admin/pdks/import', { method: 'POST', json: { csv: text } });
            setResult(r.result);
            onDone();
        } catch (e) { setProblem((e as Error).message); } finally { setBusy(false); }
    };
    return (
        <Modal open onClose={onClose} size="lg" title="CSV içe aktar" description="Sütunlar: kart_uid ; yon (GİRİŞ/ÇIKIŞ) ; tarih_saat (YYYY-AA-GG SS:DD) ; isteğe bağlı cihaz ; olay_id. Aynı kişi + zaman + yön tekrarı atlanır."
            footer={<><Button variant="ghost" onClick={onClose}>Kapat</Button><Button variant="primary" icon={Upload} loading={busy} disabled={!text.trim()} onClick={run}>İçe aktar</Button></>}>
            <div className="space-y-3">
                <input type="file" accept=".csv,text/csv,text/plain" aria-label="CSV dosyası seç" onChange={(e) => pick(e.target.files?.[0])} className="text-sm text-gray-300" />
                <LTextArea label="veya içeriği yapıştırın" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'kart_uid;yon;tarih_saat\n04A1B2C3;GİRİŞ;2026-10-27 09:01'} />
                {problem && <Alert tone="danger">{problem}</Alert>}
                {result && (
                    <Alert tone={result.errors.length ? 'warning' : 'success'} title={`${result.rows} satır: ${result.created} eklendi, ${result.duplicates} mükerrer atlandı, ${result.errors.length} hatalı`}>
                        {result.errors.length > 0 && <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5">{result.errors.slice(0, 100).map((e) => <li key={e.line}>Satır {e.line}: {e.reason}</li>)}</ul>}
                    </Alert>
                )}
            </div>
        </Modal>
    );
}

function VoidEvent({ row, onClose, onDone }: { row: EventRow; onClose: () => void; onDone: () => void }) {
    const f = useForm({ reason: '' });
    const save = () => f.submit(async () => { await api(`/api/admin/pdks/events/${row.id}/void`, { method: 'POST', json: f.values }); onDone(); });
    return (
        <Modal open onClose={onClose} title="Hareketi geçersiz kıl" description={`${row.holderName} · ${dt(row.occurredAt)} · ${row.direction === 'IN' ? 'Giriş' : 'Çıkış'}. Kayıt silinmez; raporlardan çıkar ve gerekçesiyle saklanır.`}
            footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button variant="danger" loading={f.saving} onClick={save}>Geçersiz kıl</Button></>}>
            <LInput label="Gerekçe" required {...f.bind('reason')} />
        </Modal>
    );
}

// ─── PDKS Detay (oturumlar) ve Toplam Raporu ─────────────────────────────────

type SessionRow = { id: string; day: string; holderName: string; holderTypeLabel: string; cardUid: string; inAt: string | null; outAt: string | null; minutes: number; duration: string; problem: string | null };

export function SessionsTab({ lookups, canExport }: { lookups?: PdksLookups; canExport: boolean }) {
    const columns: ListColumn<SessionRow>[] = [
        { key: 'day', label: 'Gün', sortable: true },
        { key: 'holderName', label: 'Kişi', sortable: true, render: (r) => <span className="font-medium text-white">{r.holderName}</span> },
        { key: 'holderTypeLabel', label: 'Tür' },
        { key: 'inAt', label: 'Giriş', sortable: true, render: (r) => dt(r.inAt) },
        { key: 'outAt', label: 'Çıkış', render: (r) => dt(r.outAt) },
        { key: 'minutes', label: 'Süre', sortable: true, align: 'right', render: (r) => (r.problem ? '—' : r.duration) },
        { key: 'problem', label: 'Uyarı', render: (r) => (r.problem ? <Badge tone="warning">{r.problem === 'NO_OUT' ? 'Çıkış kaydı yok' : 'Giriş kaydı yok'}</Badge> : '') },
    ];
    return (
        <DataList<SessionRow> endpoint="/api/admin/pdks/sessions" label="Giriş-çıkış eşleşmeleri" columns={columns} archiveToggle={false}
            filters={[...scopeFilters(lookups), { key: 'problem', label: 'Göster', type: 'select', placeholder: 'Tümü', options: [{ value: 'ONLY', label: 'Yalnız eşleşmeyenler' }] }]}
            initialFilters={thisMonth()} searchPlaceholder="Kişi veya kart UID" canExport={canExport}
            summary={(d) => (Number(d.warnings) > 0 ? <div className="border-b border-white/5 px-4 py-2"><Alert tone="warning">{String(d.warnings)} eşleşmeyen hareket var (çıkışsız giriş veya girişsiz çıkış). Bu satırlar süreye katılmaz; manuel kayıtla tamamlayın.</Alert></div> : null)}
            empty={{ title: 'Bu dönemde oturum yok' }} />
    );
}

type TotalRowView = { id: string; period: string; holderName: string; holderTypeLabel: string; hours: number; minutes: number; duration: string; sessions: number; warnings: number; overLimit: boolean; limitHours: number | null };

export function TotalsTab({ lookups, canExport }: { lookups?: PdksLookups; canExport: boolean }) {
    const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const columns: ListColumn<TotalRowView>[] = [
        { key: 'period', label: type === 'daily' ? 'Gün' : type === 'weekly' ? 'Hafta' : 'Ay', sortable: true },
        { key: 'holderName', label: 'Kişi', sortable: true, render: (r) => <span className="font-medium text-white">{r.holderName}</span> },
        { key: 'holderTypeLabel', label: 'Tür' },
        { key: 'minutes', label: 'Toplam süre', sortable: true, align: 'right', render: (r) => <span className={r.overLimit ? 'font-semibold text-rose-300' : ''}>{r.duration}</span> },
        { key: 'sessions', label: 'Oturum', sortable: true, align: 'right' },
        { key: 'warnings', label: 'Uyarı', sortable: true, align: 'right', render: (r) => (r.warnings ? <Badge tone="warning">{r.warnings}</Badge> : '0') },
        { key: 'overLimit', label: 'Sınır', render: (r) => (r.overLimit ? <Badge tone="danger">&gt; {r.limitHours} sa</Badge> : '') },
    ];
    return (
        <div className="space-y-3">
            <div role="radiogroup" aria-label="Rapor türü" className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={`rounded-md px-3 py-1.5 text-sm ${type === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}>{t === 'daily' ? 'Günlük' : t === 'weekly' ? 'Haftalık' : 'Aylık'}</button>
                ))}
            </div>
            <DataList<TotalRowView> key={type} endpoint="/api/admin/pdks/totals" extraParams={{ type }} label="PDKS toplam raporu" columns={columns} archiveToggle={false}
                filters={[...scopeFilters(lookups), { key: 'over', label: 'Göster', type: 'select', placeholder: 'Tümü', options: [{ value: 'ONLY', label: 'Yalnız sınırı aşanlar' }] }]}
                initialFilters={thisMonth()} searchPlaceholder="Kişi veya kart UID" canExport={canExport}
                rowClassName={(r) => (r.overLimit ? 'bg-rose-500/[0.07]' : '')}
                summary={(d) => { const l = d.limits as { daily: { value: number; isDefault: boolean }; weekly: { value: number; isDefault: boolean } }; return <p className="border-b border-white/5 px-4 py-2 text-xs text-gray-400">Sınırlar: günlük {l.daily.value} sa, haftalık {l.weekly.value} sa{l.daily.isDefault || l.weekly.isDefault ? ' (görev tanımındaki değerler; Ayarlar sekmesinden değiştirilebilir)' : ''}. Sınırı aşan: {String(d.overCount)} satır.</p>; }}
                empty={{ title: 'Bu dönemde çalışma süresi yok' }} />
        </div>
    );
}

// ─── Kartlar ─────────────────────────────────────────────────────────────────

type CardRow = { id: string; cardUid: string; label: string | null; holderType: string; holderTypeLabel: string; holderName: string; personId: string | null; personName: string | null; identityMasked: string | null; entrepreneurId: string | null; entrepreneurName: string | null; status: string; statusLabel: string; validFrom: string | null; validUntil: string | null; lastEventAt: string | null; lastDirection: string | null; onSite: boolean; notes: string | null; updatedAt: string; isArchived: boolean };

export function CardsTab({ lookups, canManage, canExport, canIdentity, notify, onChanged }: { lookups?: PdksLookups; canManage: boolean; canExport: boolean; canIdentity: boolean; notify: Notify; onChanged: () => void }) {
    const [editing, setEditing] = useState<CardRow | 'new' | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [showIds, setShowIds] = useState(false);
    const [revealed, setRevealed] = useState<Record<string, string>>({});
    const changed = () => { setReloadKey((k) => k + 1); onChanged(); };
    const reveal = async (r: CardRow) => {
        try {
            const d = await api<{ identity: string }>(`/api/admin/pdks/cards/${r.id}/identity`, { method: 'POST', json: {} });
            setRevealed((m) => ({ ...m, [r.id]: d.identity }));
        } catch (e) { notify.error((e as Error).message); }
    };
    const setStatus = async (r: CardRow, status: string) => {
        try {
            await api(`/api/admin/pdks/cards/${r.id}`, { method: 'PATCH', json: { status, expectedUpdatedAt: r.updatedAt } });
            notify.success(`Kart durumu: ${lookups?.cardStatuses.find((s) => s.value === status)?.label ?? status}`);
            changed();
        } catch (e) { notify.error((e as Error).message); }
    };
    const columns: ListColumn<CardRow>[] = [
        { key: 'holderName', label: 'Kart sahibi', sortable: true, render: (r) => <span className="font-medium text-white">{r.holderName}</span> },
        { key: 'holderType', label: 'Tür', sortable: true, render: (r) => r.holderTypeLabel },
        { key: 'entrepreneurName', label: 'Firma', sortable: true, render: (r) => r.entrepreneurName ?? '—' },
        { key: 'cardUid', label: 'Kart UID', sortable: true, className: 'font-mono text-xs' },
        { key: 'label', label: 'Etiket', sortable: true, render: (r) => r.label ?? '—' },
        { key: 'identity', label: 'Kimlik no', render: (r) => (r.identityMasked ? (revealed[r.id] ? <span className="font-mono">{revealed[r.id]}</span> : <span className="inline-flex items-center gap-1.5 font-mono">{r.identityMasked}{showIds && <Button size="sm" variant="ghost" icon={Eye} onClick={() => reveal(r)} aria-label={`${r.holderName} kimlik numarasını göster`}>Göster</Button>}</span>) : <span className="text-gray-500">Rehberde yok</span>) },
        { key: 'status', label: 'Durum', sortable: true, render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : r.status === 'RETURNED' ? 'neutral' : 'danger'}>{r.statusLabel}</Badge> },
        { key: 'lastEventAt', label: 'Son hareket', sortable: true, render: (r) => (r.lastEventAt ? <span className="inline-flex items-center gap-1.5">{dt(r.lastEventAt)}{r.onSite && <Badge tone="success">İçeride</Badge>}</span> : '—') },
    ];
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                {canManage && <Button variant="primary" icon={CreditCard} onClick={() => setEditing('new')}>Kart Tanımla</Button>}
                {canIdentity && <Toggle id="pdks-show-ids" checked={showIds} onChange={setShowIds} label="Kimlik numaralarını göster (KVKK)" />}
                {showIds && <span className="text-xs text-amber-300">Her açılış denetim kaydına yazılır.</span>}
            </div>
            <DataList<CardRow> endpoint="/api/admin/pdks/cards" label="RFID kartlar" columns={columns} searchPlaceholder="Ad, kart UID, etiket veya firma" canExport={canExport} reloadKey={reloadKey}
                filters={[
                    { key: 'holderType', label: 'Tür', type: 'select', options: lookups?.holderTypes ?? [] },
                    { key: 'status', label: 'Durum', type: 'select', options: lookups?.cardStatuses ?? [] },
                    { key: 'entrepreneurId', label: 'Firma', type: 'select', options: (lookups?.entrepreneurs ?? []).map((e) => ({ value: e.id, label: e.name })) },
                ]}
                empty={{ title: 'Henüz kart tanımlı değil', description: 'Personel, girişim çalışanı ve ziyaretçi kartlarını tanımlayın; girişler bu kartlarla eşleşir.' }}
                rowActions={(r) => canManage ? (
                    <div className="inline-flex items-center gap-1">
                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(r)} aria-label={`${r.holderName} kartını düzenle`}>Düzenle</Button>
                        {r.status === 'ACTIVE' ? <>
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r, 'LOST')}>Kayıp</Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r, 'RETURNED')}>İade al</Button>
                        </> : <Button size="sm" variant="ghost" onClick={() => setStatus(r, 'ACTIVE')}>Aktifleştir</Button>}
                    </div>
                ) : null} />
            {editing && lookups && <CardForm row={editing === 'new' ? undefined : editing} lookups={lookups} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); notify.success(m); changed(); }} />}
        </div>
    );
}

function CardForm({ row, lookups, onClose, onSaved }: { row?: CardRow; lookups: PdksLookups; onClose: () => void; onSaved: (m: string) => void }) {
    const f = useForm({ cardUid: row?.cardUid ?? '', label: row?.label ?? '', holderType: row?.holderType ?? 'MEMBER', personId: row?.personId ?? '', entrepreneurId: row?.entrepreneurId ?? '', holderName: row && !row.personId ? row.holderName : '', validFrom: row?.validFrom?.slice(0, 10) ?? '', validUntil: row?.validUntil?.slice(0, 10) ?? '', notes: row?.notes ?? '' });
    const [problem, setProblem] = useState<string | null>(null);
    const save = () => f.submit(async () => {
        if (row) await api(`/api/admin/pdks/cards/${row.id}`, { method: 'PATCH', json: { ...f.values, expectedUpdatedAt: row.updatedAt } });
        else await api('/api/admin/pdks/cards', { method: 'POST', json: f.values });
        onSaved(row ? 'Kart güncellendi.' : 'Kart tanımlandı.');
    }, (e) => setProblem(e.data?.fieldErrors && !e.data.fieldErrors._conflict ? null : e.message));
    return (
        <Modal open onClose={onClose} size="lg" title={row ? 'Kartı düzenle / yeniden ata' : 'RFID kart tanımla'} description="Kart okuyucunun okuduğu UID’yi girin (ör. 04A1B2C3). Ayırıcılar otomatik temizlenir."
            footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button variant="primary" loading={f.saving} onClick={save}>Kaydet</Button></>}>
            {problem && <div className="mb-3"><Alert tone="danger">{problem}</Alert></div>}
            <div className="grid gap-4 sm:grid-cols-2">
                <LInput label="Kart UID" required autoComplete="off" {...f.bind('cardUid')} />
                <LInput label="Kart üzerindeki numara / etiket" {...f.bind('label')} />
                <LSelect label="Kart sahibi türü" required options={lookups.holderTypes} {...f.bind('holderType')} />
                <LSelect label="Girişim" placeholder={f.values.holderType === 'MEMBER' ? 'Girişim seçin' : 'Yok'} required={f.values.holderType === 'MEMBER'} options={lookups.entrepreneurs.map((e) => ({ value: e.id, label: e.name }))} {...f.bind('entrepreneurId')} />
                <LSelect label="Rehberdeki kişi" placeholder="Rehberde kayıtlı değil" hint="Seçilirse ad ve maskeli kimlik no rehberden gelir" options={lookups.persons.map((p) => ({ value: p.id, label: p.label }))} {...f.bind('personId')} />
                <LInput label="Ad soyad" hint="Rehberden kişi seçilmediyse zorunlu" {...f.bind('holderName')} />
                <LInput label="Geçerlilik başlangıcı" type="date" {...f.bind('validFrom')} />
                <LInput label="Geçerlilik bitişi" type="date" {...f.bind('validUntil')} />
                <LTextArea label="Not" className="sm:col-span-2" {...f.bind('notes')} />
            </div>
        </Modal>
    );
}

// ─── Cihazlar & entegrasyon ──────────────────────────────────────────────────

type Devices = { devices: { id: string; code: string; name: string; buildingId: string | null; buildingName: string | null; location: string | null; direction: string; isActive: boolean; lastSeenAt: string | null; notes: string | null; eventCount: number }[]; integration: { activeKeys: number; lastUsedAt: string | null; status: 'NO_DEVICE' | 'NO_KEY' | 'WAITING' | 'RECEIVING' } };
const INTEGRATION_TEXT: Record<Devices['integration']['status'], { tone: 'warning' | 'info' | 'success'; title: string; text: string }> = {
    NO_DEVICE: { tone: 'warning', title: 'Kurulmadı — cihaz tanımlı değil', text: 'Önce aşağıdan kart okuyucu / turnike cihazını tanımlayın.' },
    NO_KEY: { tone: 'warning', title: 'Kurulmadı — API anahtarı yok', text: 'Entegrasyon Merkezi’nden “pdks:write” kapsamlı API anahtarı oluşturup cihaz yazılımına girin.' },
    WAITING: { tone: 'info', title: 'Hazır — cihazdan veri bekleniyor', text: 'Anahtar ve cihaz tanımlı; henüz cihazdan hareket gelmedi.' },
    RECEIVING: { tone: 'success', title: 'Çalışıyor — cihazdan veri alınıyor', text: 'Cihazlar hareket gönderiyor.' },
};

export function DevicesTab({ lookups, canManage, notify }: { lookups?: PdksLookups; canManage: boolean; notify: Notify }) {
    const d = useApi<Devices>('/api/admin/pdks/devices');
    const [editing, setEditing] = useState<Devices['devices'][number] | 'new' | null>(null);
    const toggle = async (id: string, isActive: boolean) => {
        try { await api(`/api/admin/pdks/devices/${id}`, { method: 'PATCH', json: { isActive } }); notify.success(isActive ? 'Cihaz etkinleştirildi.' : 'Cihaz pasife alındı.'); d.reload(); } catch (e) { notify.error((e as Error).message); }
    };
    if (d.error) return <Card padded={false}><ErrorState error={d.error} onRetry={d.reload} /></Card>;
    if (!d.data) return <Card padded={false}><LoadingRows rows={3} /></Card>;
    const st = INTEGRATION_TEXT[d.data.integration.status];
    return (
        <div className="space-y-4">
            <Alert tone={st.tone} title={`Cihaz entegrasyonu: ${st.title}`}>{st.text} {d.data.integration.lastUsedAt && `Son veri: ${dt(d.data.integration.lastUsedAt)}.`}</Alert>
            <Card>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><Plug className="h-4 w-4 text-primary" aria-hidden /> Cihaz bağlantısı nasıl kurulur</h2>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-300">
                    <li>Aşağıdan cihazı tanımlayın (cihaz kodu, cihazın gönderdiği kimlik olmalı).</li>
                    <li><Link href="/admin/entegrasyon-merkezi" className="text-primary hover:underline">Entegrasyon Merkezi</Link> → API anahtarı oluşturun, kapsam olarak <code className="rounded bg-white/10 px-1">pdks:write</code> seçin.</li>
                    <li>Cihazın / turnike yazılımının “HTTP push” ayarına adresi ve anahtarı girin:</li>
                </ol>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-gray-300">{`POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/pdks/events
Authorization: Bearer ik_…
{ "deviceCode": "TURNIKE-1",
  "events": [{ "cardUid": "04A1B2C3", "direction": "IN",
               "occurredAt": "2026-10-27T09:01:00+03:00", "eventId": "123" }] }`}</pre>
                <p className="mt-2 text-xs text-gray-500">Cihaz HTTP gönderemiyorsa üreticinin yazılımından alınan dökümü “PDKS Bilgileri → CSV içe aktar” ile yükleyin. Cihaz markası ve modeli bildirildiğinde üreticiye özel bağlantı eklenebilir.</p>
            </Card>
            <Card padded={false}>
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3"><h2 className="text-sm font-semibold text-white">Cihazlar</h2>{canManage && <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing('new')}>Cihaz Ekle</Button>}</div>
                {d.data.devices.length === 0 ? <div className="p-4"><EmptyState title="Cihaz tanımlı değil" /></div> : (
                    <TableShell>
                        <thead><tr className="border-b border-white/5"><th className={th}>Ad</th><th className={th}>Kod</th><th className={th}>Bina / konum</th><th className={th}>Yön</th><th className={th}>Son veri</th><th className={th}>Hareket</th><th className={th}>Durum</th>{canManage && <th className={th}><span className="sr-only">İşlem</span></th>}</tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {d.data.devices.map((x) => (
                                <tr key={x.id} className={x.isActive ? '' : 'opacity-60'}>
                                    <td className={td}>{x.name}</td><td className={`${td} font-mono text-xs`}>{x.code}</td><td className={td}>{[x.buildingName, x.location].filter(Boolean).join(' · ') || '—'}</td>
                                    <td className={td}>{x.direction === 'IN' ? 'Yalnız giriş' : x.direction === 'OUT' ? 'Yalnız çıkış' : 'Giriş + çıkış'}</td><td className={td}>{x.lastSeenAt ? dt(x.lastSeenAt) : 'Henüz yok'}</td><td className={td}>{x.eventCount}</td>
                                    <td className={td}><Badge tone={x.isActive ? 'success' : 'neutral'}>{x.isActive ? 'Aktif' : 'Pasif'}</Badge></td>
                                    {canManage && <td className={`${td} text-right whitespace-nowrap`}><Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(x)}>Düzenle</Button><Button size="sm" variant="ghost" icon={x.isActive ? PowerOff : Power} onClick={() => toggle(x.id, !x.isActive)}>{x.isActive ? 'Pasife al' : 'Etkinleştir'}</Button></td>}
                                </tr>
                            ))}
                        </tbody>
                    </TableShell>
                )}
            </Card>
            {editing && <DeviceForm row={editing === 'new' ? undefined : editing} lookups={lookups} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); notify.success('Cihaz kaydedildi.'); d.reload(); }} />}
        </div>
    );
}

function DeviceForm({ row, lookups, onClose, onSaved }: { row?: Devices['devices'][number]; lookups?: PdksLookups; onClose: () => void; onSaved: () => void }) {
    const f = useForm({ code: row?.code ?? '', name: row?.name ?? '', buildingId: row?.buildingId ?? '', location: row?.location ?? '', direction: row?.direction ?? 'BOTH', notes: row?.notes ?? '' });
    const save = () => f.submit(async () => {
        if (row) await api(`/api/admin/pdks/devices/${row.id}`, { method: 'PATCH', json: f.values });
        else await api('/api/admin/pdks/devices', { method: 'POST', json: f.values });
        onSaved();
    });
    return (
        <Modal open onClose={onClose} title={row ? 'Cihazı düzenle' : 'Kart okuyucu / turnike ekle'} footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button variant="primary" loading={f.saving} onClick={save}>Kaydet</Button></>}>
            <div className="grid gap-4 sm:grid-cols-2">
                <LInput label="Cihaz kodu" required hint="Cihazın gönderdiği kimlik" {...f.bind('code')} />
                <LInput label="Ad" required placeholder="ör. Ana giriş turnikesi" {...f.bind('name')} />
                <LSelect label="Bina" placeholder="Seçilmedi" options={(lookups?.buildings ?? []).map((b) => ({ value: b.id, label: b.name }))} {...f.bind('buildingId')} />
                <LInput label="Konum" {...f.bind('location')} />
                <LSelect label="Yön" options={[{ value: 'BOTH', label: 'Giriş + çıkış (yön olaydan gelir)' }, { value: 'IN', label: 'Yalnız giriş' }, { value: 'OUT', label: 'Yalnız çıkış' }]} {...f.bind('direction')} />
                <LTextArea label="Not" className="sm:col-span-2" placeholder="Marka, model, IP vb." {...f.bind('notes')} />
            </div>
        </Modal>
    );
}

export function SettingsTab({ canManage, notify }: { canManage: boolean; notify: Notify }) {
    return <Card><ParameterManager category="PDKS" canManage={canManage} notify={notify} /></Card>;
}

export { fmtDate };
