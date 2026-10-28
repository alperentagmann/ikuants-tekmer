"use client";
import { Suspense, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Map as MapIcon, Minus, Move, Plus, Search, Wand2, X } from 'lucide-react';
import { Alert, Badge, Button, Card, EmptyState, Modal, PageHeader, Select, Toggle } from '@/components/admin/ui';
import { api, useApi, useMe, useNotice, ErrorState, LoadingRows, ProgressBar, fmtDate } from '@/components/admin/ops-kit';
import { PlacementWizard } from '@/components/admin/facilities/PlacementWizard';
import { fmtArea, fmtPct } from '@/components/admin/facilities/shared';

type Unit = {
    id: string; code: string; unitType: string; unitTypeLabel: string; area: number; capacity: number | null; status: string; displayStatus: string; displayStatusLabel: string;
    maxTenants: number; tenants: number; freeSlots: number | null; firms: { id: string; name: string; kind: string; label: string | null }[]; currentAssignmentEnd: string | null;
    mapX: number | null; mapY: number | null; updatedAt: string;
};
type MapData = { floors: { id: string; label: string; hasPlan: boolean }[]; floor: { id: string; label: string; planImageUrl: string | null } | null; units: Unit[]; occupancy: { byCountPct: number | null; byAreaPct: number | null; occupiedUnits: number; rentableUnits: number } };

const COLOR: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500 border-emerald-200 text-white', PARTIAL: 'bg-amber-400 border-amber-100 text-black', OCCUPIED: 'bg-sky-600 border-sky-200 text-white',
    MAINTENANCE: 'bg-gray-500 border-gray-300 text-white', RESERVED: 'bg-violet-600 border-violet-200 text-white',
};
const LEGEND = [['AVAILABLE', 'Boş'], ['PARTIAL', 'Paylaşımlı — yer var'], ['OCCUPIED', 'Dolu'], ['RESERVED', 'Rezerve'], ['MAINTENANCE', 'Bakımda']] as const;

function MapInner() {
    const { can } = useMe();
    const notice = useNotice();
    const sp = useSearchParams();
    const [floorId, setFloorId] = useState(sp.get('floorId') ?? '');
    const q = useApi<{ map: MapData }>(`/api/admin/facility-units/map${floorId ? `?floorId=${floorId}` : ''}`);
    const [selected, setSelected] = useState<Unit | null>(null);
    const [edit, setEdit] = useState(false);
    const [placingId, setPlacingId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [search, setSearch] = useState('');
    const [wizardFor, setWizardFor] = useState<string[] | null>(null);
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const boxRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
    const m = q.data?.map;

    const needle = search.trim().toLocaleLowerCase('tr-TR');
    const matches = useMemo(() => new Set((m?.units ?? []).filter((u) => needle && (u.code.toLocaleLowerCase('tr-TR').includes(needle) || u.firms.some((f) => f.name.toLocaleLowerCase('tr-TR').includes(needle)))).map((u) => u.id)), [m, needle]);
    const posOf = (u: Unit) => positions[u.id] ?? (u.mapX !== null && u.mapY !== null ? { x: u.mapX, y: u.mapY } : null);
    const unplaced = (m?.units ?? []).filter((u) => !posOf(u));

    const pointToPct = (clientX: number, clientY: number) => {
        const r = boxRef.current!.getBoundingClientRect();
        return { x: Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100)) };
    };
    const savePos = async (u: Unit, p: { x: number; y: number }) => {
        setPositions((all) => ({ ...all, [u.id]: p }));
        try {
            await api(`/api/admin/facility-units/units/${u.id}`, { method: 'PATCH', json: { mapX: Math.round(p.x * 100) / 100, mapY: Math.round(p.y * 100) / 100 } });
        } catch (e) { notice.error((e as Error).message); }
    };

    const onMapClick = (e: React.MouseEvent) => {
        if (!edit || !placingId || !m) return;
        const u = m.units.find((x) => x.id === placingId);
        if (u) { void savePos(u, pointToPct(e.clientX, e.clientY)); notice.success(`${u.code} haritaya yerleştirildi.`); }
        setPlacingId(null);
    };
    const onPointerDown = (e: React.PointerEvent, u: Unit) => {
        if (!edit) return;
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = { id: u.id, moved: false };
    };
    const onPointerMove = (e: React.PointerEvent, u: Unit) => {
        if (!edit || dragRef.current?.id !== u.id) return;
        dragRef.current.moved = true;
        setPositions((all) => ({ ...all, [u.id]: pointToPct(e.clientX, e.clientY) }));
    };
    const onPointerUp = (e: React.PointerEvent, u: Unit) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (edit && d?.moved) void savePos(u, pointToPct(e.clientX, e.clientY));
        else setSelected(u);
    };

    if (q.error) return <Card padded={false}><ErrorState error={q.error} onRetry={q.reload} /></Card>;
    if (!m) return <Card padded={false}><LoadingRows rows={6} /></Card>;

    return (
        <div className="space-y-4">
            <PageHeader icon={MapIcon} title="Kat Haritası" description="Masa ve ofislerin plandaki yeri ve anlık doluluğu. Bir yere tıklayın: kim oturuyor, ne zamana kadar, tek tıkla yerleştirme."
                actions={can('create', 'facilities') && <Button variant="primary" icon={Wand2} onClick={() => setWizardFor([])}>Firma Yerleştir</Button>} />
            {!m.floor ? <Card><EmptyState title="Kat tanımlı değil" description="Önce Bina Kat Bilgileri ekranından kat ekleyin ve kat planı görselini girin." action={<Link href="/admin/alan-yonetimi/katlar" className="text-primary underline">Bina Kat Bilgileri</Link>} /></Card> : (
                <>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-full max-w-xs"><label className="mb-1 block text-xs text-gray-400" htmlFor="map-floor">Kat</label><Select id="map-floor" value={m.floor.id} onChange={(e) => { setFloorId(e.target.value); setSelected(null); }} options={m.floors.map((f) => ({ value: f.id, label: `${f.label}${f.hasPlan ? '' : ' (plan yok)'}` }))} /></div>
                        <div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" aria-hidden /><input aria-label="Firma veya masa ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Firma veya masa ara" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white" /></div>
                        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
                            <Button size="sm" variant="ghost" icon={Minus} aria-label="Uzaklaştır" onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))} disabled={zoom <= 1} />
                            <span className="w-12 text-center text-xs text-gray-300">%{Math.round(zoom * 100)}</span>
                            <Button size="sm" variant="ghost" icon={Plus} aria-label="Yakınlaştır" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} disabled={zoom >= 4} />
                        </div>
                        {can('update', 'facilities') && <Toggle id="map-edit" checked={edit} onChange={(v) => { setEdit(v); setPlacingId(null); }} label="Konum düzenle" />}
                        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-gray-300">
                            {LEGEND.map(([k, label]) => <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-full border ${COLOR[k]}`} />{label}</span>)}
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><p className="text-xs text-gray-400">Doluluk (bölüm)</p><p className="text-lg font-semibold text-white">{fmtPct(m.occupancy.byCountPct)} <span className="text-xs text-gray-500">{m.occupancy.occupiedUnits}/{m.occupancy.rentableUnits}</span></p><ProgressBar value={m.occupancy.byCountPct ?? 0} /></div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><p className="text-xs text-gray-400">Doluluk (m²)</p><p className="text-lg font-semibold text-white">{fmtPct(m.occupancy.byAreaPct)}</p><ProgressBar value={m.occupancy.byAreaPct ?? 0} /></div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><p className="text-xs text-gray-400">Boş yeri olan</p><p className="text-lg font-semibold text-emerald-300">{m.units.filter((u) => u.unitType !== 'COMMON' && u.status === 'AVAILABLE' && (u.freeSlots ?? 0) > 0).length} bölüm</p></div>
                    </div>
                    {edit && (
                        <Alert tone="info" title="Konum düzenleme">
                            İşaretleri sürükleyerek taşıyın; bırakınca kaydedilir. {unplaced.length > 0 ? 'Haritada olmayan bölümü aşağıdan seçip haritada tıklayarak yerleştirin.' : ''}
                            {unplaced.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{unplaced.map((u) => <button key={u.id} type="button" onClick={() => setPlacingId(u.id)} className={`rounded-md border px-2 py-1 text-xs ${placingId === u.id ? 'border-primary bg-primary/20 text-white' : 'border-white/20 text-gray-200'}`}>{u.code}</button>)}</div>}
                            {placingId && <p className="mt-1 text-xs">Şimdi haritada {m.units.find((u) => u.id === placingId)?.code} için yere tıklayın.</p>}
                        </Alert>
                    )}
                    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
                        <div className="max-h-[78vh] overflow-auto rounded-xl border border-white/10 bg-white">
                            {m.floor.planImageUrl ? (
                                <div ref={boxRef} onClick={onMapClick} className={`relative ${placingId ? 'cursor-crosshair' : ''}`} style={{ width: `${zoom * 100}%` }}>
                                    <img src={m.floor.planImageUrl} alt={`${m.floor.label} kat planı`} className="block w-full select-none" draggable={false} />
                                    {m.units.map((u) => {
                                        const p = posOf(u);
                                        if (!p) return null;
                                        const hit = matches.has(u.id);
                                        const dim = needle && !hit;
                                        return (
                                            <button key={u.id} type="button"
                                                onPointerDown={(e) => onPointerDown(e, u)} onPointerMove={(e) => onPointerMove(e, u)} onPointerUp={(e) => onPointerUp(e, u)}
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label={`${u.code} · ${u.displayStatusLabel}${u.firms.length ? ` · ${u.firms.map((f) => f.name).join(', ')}` : ''}`}
                                                title={`${u.code} · ${u.displayStatusLabel}${u.firms.length ? `\n${u.firms.map((f) => f.name + (f.label ? ` (${f.label})` : '')).join('\n')}` : ''}`}
                                                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 font-bold shadow-lg transition-transform ${COLOR[u.displayStatus] ?? COLOR.AVAILABLE} ${u.unitType === 'DESK' ? 'h-5 min-w-5 px-1 text-[9px]' : 'h-7 min-w-7 px-1.5 text-[10px]'} ${selected?.id === u.id ? 'scale-150 ring-4 ring-primary' : hit ? 'scale-150 ring-4 ring-yellow-300' : ''} ${dim ? 'opacity-25' : ''} ${edit ? 'cursor-move' : 'cursor-pointer hover:scale-125'}`}
                                                style={{ left: `${p.x}%`, top: `${p.y}%`, touchAction: 'none' }}>
                                                {u.unitType === 'DESK' ? u.code.replace(/^\D+-?0?/, '') : u.code}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : <div className="p-6"><EmptyState title="Bu katın plan görseli yok" description="Bina Kat Bilgileri ekranından kat planı görselinin adresini girin." /></div>}
                        </div>
                        <aside className="space-y-3">
                            {!selected ? <Card><p className="text-sm text-gray-400">Ayrıntı için haritada bir masa veya ofise tıklayın.{edit && ' (Düzenleme modunda tıklama da seçer; sürükleme taşır.)'}</p></Card> : (
                                <Card className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div><p className="text-base font-semibold text-white">{selected.code}</p><p className="text-xs text-gray-400">{selected.unitTypeLabel} · {fmtArea(selected.area)}{selected.capacity ? ` · ${selected.capacity} kişi` : ''} · {selected.unitType === 'COMMON' ? 'paylaşımlı' : `${selected.maxTenants} firmaya kadar`}</p></div>
                                        <button type="button" onClick={() => setSelected(null)} aria-label="Kapat" className="rounded p-1 text-gray-400 hover:bg-white/10"><X className="h-4 w-4" /></button>
                                    </div>
                                    <Badge tone={selected.displayStatus === 'AVAILABLE' ? 'success' : selected.displayStatus === 'OCCUPIED' ? 'info' : 'warning'}>{selected.displayStatusLabel}</Badge>
                                    {selected.firms.length ? (
                                        <ul className="space-y-1.5">{selected.firms.map((f) => <li key={f.id} className="text-sm"><Link href={f.kind === 'entrepreneur' ? `/admin/girisimciler/${f.id}` : `/admin/rehber/sirket/${f.id}`} className="text-primary hover:underline">{f.name}</Link>{f.label && <span className="text-xs text-gray-400"> · {f.label}</span>}</li>)}</ul>
                                    ) : <p className="text-sm text-gray-400">Bu yerde firma yok.</p>}
                                    {selected.currentAssignmentEnd && <p className="text-xs text-gray-500">Tahsis bitişi: {fmtDate(selected.currentAssignmentEnd)}</p>}
                                    <div className="flex flex-wrap gap-2">
                                        {can('create', 'facilities') && selected.displayStatus !== 'OCCUPIED' && selected.status === 'AVAILABLE' && <Button size="sm" variant="primary" icon={Wand2} onClick={() => setWizardFor([selected.id])}>Buraya firma yerleştir</Button>}
                                        <Link href={`/admin/alan-yonetimi/eslestirme?q=${encodeURIComponent(selected.code)}`} className="inline-flex items-center rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-white/10">Tahsisler</Link>
                                        {edit && <Button size="sm" icon={Move} onClick={() => setPlacingId(selected.id)}>Yeniden konumla</Button>}
                                    </div>
                                </Card>
                            )}
                            <Card>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Boş yerler</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {m.units.filter((u) => u.unitType !== 'COMMON' && u.status === 'AVAILABLE' && (u.freeSlots ?? 0) > 0).map((u) => <button key={u.id} type="button" onClick={() => setSelected(u)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20">{u.code}</button>)}
                                </div>
                            </Card>
                        </aside>
                    </div>
                </>
            )}
            <Modal open={wizardFor !== null} onClose={() => { setWizardFor(null); q.reload(); }} size="xl" title="Firma yerleştir" description="Seçilen yer işaretli gelir; başka masa / ofis de ekleyebilirsiniz.">
                {wizardFor !== null && <PlacementWizard defaultUnitIds={wizardFor} onDone={() => { q.reload(); setSelected(null); }} />}
            </Modal>
            {notice.node}
        </div>
    );
}

export default function FloorMapPage() {
    return <Suspense><MapInner /></Suspense>;
}
