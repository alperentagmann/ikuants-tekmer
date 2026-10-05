"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Calendar, CalendarClock, ChevronLeft, ChevronRight, Clock, Cpu, ExternalLink, Images, Info, Layers, MapPin, Receipt, Ruler, ShieldCheck, Users, X } from "lucide-react";
import { parseGallery, type GalleryImage } from "@/lib/facility-media";
import { facilityMachines, facilityPricing, isMachineFacility, pricingLabel } from "@/lib/machines";
import type { PublicFacility } from "./SpaceCard";

interface DayInfo { openTime: string; closeTime: string; isWorkingDay: boolean; reservationEnabled: boolean; status: string; busy: { start: string; end: string; pending: boolean }[] }

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const toMin = (t: string) => (t === "24:00" ? 1440 : Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)));
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const istanbulToday = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const shiftDay = (d: string, n: number) => new Date(new Date(`${d}T12:00:00+03:00`).getTime() + n * 86400000 + 3 * 3600000).toISOString().slice(0, 10);

function details(fac: PublicFacility) {
    let f: Record<string, unknown> = {};
    try {
        const v = fac.featuresJson ? JSON.parse(fac.featuresJson) : {};
        if (v && typeof v === "object" && !Array.isArray(v)) f = v as Record<string, unknown>;
    } catch {
        f = {};
    }
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" && v.trim() ? v.split(/[,;]\s*/) : []);
    return {
        capacity: typeof f.capacity === "number" ? f.capacity : null,
        floor: typeof f.floor === "string" && f.floor.trim() ? f.floor : null,
        squareMeters: typeof f.squareMeters === "number" ? f.squareMeters : null,
        openTime: typeof f.openTime === "string" ? f.openTime : null,
        closeTime: typeof f.closeTime === "string" ? f.closeTime : null,
        workingDays: Array.isArray(f.workingDays) ? (f.workingDays as unknown[]).map(Number).filter((d) => d >= 1 && d <= 7) : null,
        approvalRequired: f.approvalRequired !== false,
        equipment: [...list(f.equipment), ...list(f.amenities)],
    };
}

/**
 * Space detail slide-over: photos, facts, machines with specs and a day timeline. Picking a free
 * start and end on the timeline opens the reservation request with those times filled in.
 */
export function SpaceDetailDrawer({
    fac,
    groupTitle,
    onClose,
    onReserve,
    onQuote,
    onOpen3D,
    onOpenGallery,
}: {
    fac: PublicFacility | null;
    groupTitle?: string;
    onClose: () => void;
    onReserve: (times?: { date: string; startTime: string; endTime: string }) => void;
    onQuote: () => void;
    onOpen3D: () => void;
    onOpenGallery: (images: GalleryImage[], start: number) => void;
}) {
    const [date, setDate] = useState(istanbulToday);
    const [day, setDay] = useState<DayInfo | null>(null);
    const [dayError, setDayError] = useState<string | null>(null);
    const [pick, setPick] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
    const [photo, setPhoto] = useState(0);

    const load = useCallback(async (id: string, d: string) => {
        setDay(null);
        setDayError(null);
        try {
            const res = await fetch(`/api/public/reservations/day?spaceId=${encodeURIComponent(id)}&date=${d}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Doluluk bilgisi alınamadı");
            setDay(json as DayInfo);
        } catch (e) {
            setDayError(e instanceof Error ? e.message : "Doluluk bilgisi alınamadı");
        }
    }, []);

    useEffect(() => {
        if (!fac) return;
        const t = setTimeout(() => {
            setPick({ start: null, end: null });
            void load(fac.id, date);
        }, 0);
        return () => clearTimeout(t);
    }, [fac, date, load]);

    useEffect(() => {
        if (!fac) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [fac, onClose]);

    const info = useMemo(() => (fac ? details(fac) : null), [fac]);
    const images = useMemo<GalleryImage[]>(() => {
        if (!fac) return [];
        const gallery = parseGallery(fac.galleryJson);
        return [...(fac.coverImageUrl ? [{ url: fac.coverImageUrl, caption: fac.title }] : []), ...gallery.filter((g) => g.url !== fac.coverImageUrl)];
    }, [fac]);

    const slots = useMemo(() => {
        if (!day) return [];
        const open = toMin(day.openTime);
        const close = toMin(day.closeTime);
        const now = date === istanbulToday() ? (new Date(Date.now() + 3 * 3600000).getUTCHours() * 60 + new Date().getUTCMinutes()) : -1;
        const out: { start: number; busy: boolean; pending: boolean; past: boolean }[] = [];
        for (let m = open; m < close; m += 30) {
            const hit = day.busy.find((b) => toMin(b.start) < m + 30 && toMin(b.end) > m);
            out.push({ start: m, busy: Boolean(hit), pending: Boolean(hit?.pending), past: now >= 0 && m < now });
        }
        return out;
    }, [day, date]);

    if (!fac || !info) return null;
    const machine = isMachineFacility(fac);
    const pricing = facilityPricing(fac);
    const machines = machine ? facilityMachines(fac) : [];
    const closed = day && (!day.isWorkingDay || !day.reservationEnabled || day.status !== "AVAILABLE");

    const choose = (m: number) => {
        if (pick.start === null || pick.end !== null || m < pick.start) {
            setPick({ start: m, end: null });
            return;
        }
        // The range must not cross a busy slot
        const blocked = slots.some((s) => s.start >= pick.start! && s.start <= m && (s.busy || s.past));
        if (blocked) {
            setPick({ start: m, end: null });
            return;
        }
        setPick({ start: pick.start, end: m + 30 });
    };
    const selected = (m: number) => pick.start !== null && (pick.end === null ? m === pick.start : m >= pick.start && m < pick.end);

    return (
        <AnimatePresence>
            <motion.div key="backdrop" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.aside
                key="panel"
                role="dialog"
                aria-modal="true"
                aria-label={`${fac.title} ayrıntıları`}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0b15]"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
                <div className="relative aspect-[16/8] shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/10 to-secondary/20">
                    {images.length ? (
                        <button type="button" className="block h-full w-full" onClick={() => onOpenGallery(images, photo)} aria-label="Fotoğrafları büyüt">
                            <img src={images[photo].url} alt={images[photo].caption || fac.title} className="h-full w-full object-cover" />
                        </button>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400"><Images className="mr-2 h-5 w-5" /> Fotoğraf yakında eklenecek</div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70" aria-label="Kapat"><X className="h-5 w-5" /></button>
                    {images.length > 1 && (
                        <>
                            <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white" aria-label="Önceki fotoğraf" onClick={() => setPhoto((p) => (p - 1 + images.length) % images.length)}><ChevronLeft className="h-5 w-5" /></button>
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white" aria-label="Sonraki fotoğraf" onClick={() => setPhoto((p) => (p + 1) % images.length)}><ChevronRight className="h-5 w-5" /></button>
                        </>
                    )}
                    <div className="absolute bottom-4 left-5 right-5">
                        <div className="mb-1 flex flex-wrap gap-1.5">
                            {groupTitle && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{groupTitle}</span>}
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${pricing.model === "FREE" ? "bg-emerald-600/90" : "bg-amber-500/90"}`}>{pricingLabel(pricing)}</span>
                        </div>
                        <h2 className="font-orbitron text-2xl font-bold text-white drop-shadow">{fac.title}</h2>
                    </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{fac.description}</p>

                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        {[
                            { icon: Users, label: "Kapasite", value: info.capacity ? `${info.capacity} kişi` : null, hide: machine },
                            { icon: MapPin, label: "Konum", value: info.floor },
                            { icon: Ruler, label: "Alan", value: info.squareMeters ? `${info.squareMeters} m²` : null },
                            { icon: Clock, label: "Saatler", value: info.openTime && info.closeTime ? `${info.openTime} – ${info.closeTime}` : null },
                            { icon: CalendarClock, label: "Günler", value: info.workingDays?.length ? [...info.workingDays].sort().map((d) => DAYS[d - 1]).join(", ") : null },
                            { icon: ShieldCheck, label: "Onay", value: info.approvalRequired ? "Talep ekip onayıyla kesinleşir" : "Anında onay" },
                        ]
                            .filter((x) => !x.hide)
                            .map((x) => (
                                <div key={x.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <dt className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400"><x.icon className="h-3.5 w-3.5 text-primary" />{x.label}</dt>
                                    <dd className="mt-0.5 font-semibold text-gray-900 dark:text-white">{x.value || <span className="font-normal text-gray-400">Bilgi girilmemiş</span>}</dd>
                                </div>
                            ))}
                    </dl>

                    {machine ? (
                        <section>
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Cpu className="h-4 w-4 text-primary" /> Makineler</h3>
                            <div className="space-y-3">
                                {machines.map((m) => (
                                    <div key={m.name} className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-2">
                                            <div><div className="font-semibold text-gray-900 dark:text-white">{m.name}</div>{m.role && <div className="text-xs text-gray-500 dark:text-gray-400">{m.role}</div>}</div>
                                            {m.sourceUrl && <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[11px] text-primary hover:underline">Kaynak <ExternalLink className="h-3 w-3" /></a>}
                                        </div>
                                        {m.specs.length ? (
                                            <table className="mt-2 w-full text-xs"><tbody>{m.specs.map((s) => <tr key={s.label} className="border-t border-gray-100 dark:border-white/5"><td className="py-1 pr-3 text-gray-500 dark:text-gray-400">{s.label}</td><td className="py-1 text-gray-800 dark:text-gray-200">{s.value}</td></tr>)}</tbody></table>
                                        ) : <p className="mt-1 text-[11px] text-gray-400">Teknik bilgiler yakında eklenecek.</p>}
                                    </div>
                                ))}
                            </div>
                            {pricing.note && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{pricing.note}</p>}
                        </section>
                    ) : info.equipment.length > 0 ? (
                        <section>
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Layers className="h-4 w-4 text-primary" /> Donanım ve olanaklar</h3>
                            <div className="flex flex-wrap gap-1.5">{info.equipment.map((e) => <span key={e} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">{e}</span>)}</div>
                        </section>
                    ) : null}

                    <section>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Calendar className="h-4 w-4 text-primary" /> Doluluk</h3>
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={() => setDate((d) => shiftDay(d, -1))} disabled={date <= istanbulToday()} className="rounded-lg border border-gray-200 p-1.5 text-gray-600 disabled:opacity-30 dark:border-white/10 dark:text-gray-300" aria-label="Önceki gün"><ChevronLeft className="h-4 w-4" /></button>
                                <input type="date" aria-label="Tarih" min={istanbulToday()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-white/10 dark:bg-black/40 dark:text-white" />
                                <button type="button" onClick={() => setDate((d) => shiftDay(d, 1))} className="rounded-lg border border-gray-200 p-1.5 text-gray-600 dark:border-white/10 dark:text-gray-300" aria-label="Sonraki gün"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                        {dayError ? (
                            <p className="text-xs text-rose-500">{dayError}</p>
                        ) : !day ? (
                            <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                        ) : closed ? (
                            <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">{!day.isWorkingDay ? "Bu gün alanın çalışma günleri dışında." : day.status !== "AVAILABLE" ? "Alan şu anda bakımda veya kullanıma kapalı." : "Bu alan şu anda rezervasyona açık değil."}</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6" role="group" aria-label="Saat dilimleri">
                                    {slots.map((s) => {
                                        const disabled = s.busy || s.past;
                                        return (
                                            <button
                                                key={s.start}
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => choose(s.start)}
                                                aria-pressed={selected(s.start)}
                                                title={s.busy ? (s.pending ? "Onay bekleyen talep var" : "Dolu") : s.past ? "Geçmiş saat" : "Müsait"}
                                                className={`rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                                                    selected(s.start)
                                                        ? "border-primary bg-primary text-white"
                                                        : s.busy
                                                          ? s.pending ? "cursor-not-allowed border-amber-300/50 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" : "cursor-not-allowed border-rose-300/50 bg-rose-100 text-rose-700 line-through dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                                          : s.past ? "cursor-not-allowed border-gray-200 text-gray-300 dark:border-white/5 dark:text-gray-600" : "border-emerald-300/60 bg-emerald-50 text-emerald-700 hover:border-emerald-500 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                }`}
                                            >
                                                {toTime(s.start)}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Müsait</span>
                                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Onay bekleyen talep</span>
                                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Dolu</span>
                                    <span className="flex items-center gap-1"><Info className="h-3 w-3" />Başlangıç ve bitiş saatine tıklayın</span>
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <div className="shrink-0 border-t border-gray-200 bg-white/90 p-4 backdrop-blur dark:border-white/10 dark:bg-[#0b0b15]/90">
                    {pick.start !== null && pick.end !== null && (
                        <p className="mb-2 text-xs text-gray-600 dark:text-gray-300">Seçilen: <strong>{new Date(`${date}T12:00:00+03:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })} · {toTime(pick.start)} – {toTime(pick.end)}</strong></p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onReserve(pick.start !== null && pick.end !== null ? { date, startTime: toTime(pick.start), endTime: toTime(pick.end) } : undefined)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90">
                            <Calendar className="h-4 w-4" /> {pick.start !== null && pick.end !== null ? "Bu saatler için talep oluştur" : "Rezervasyon talebi oluştur"}
                        </button>
                        {machine && <button type="button" onClick={onQuote} className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"><Receipt className="h-4 w-4" /> Fiyat teklifi</button>}
                        {fac.has3D && <button type="button" onClick={onOpen3D} className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10"><Boxes className="h-4 w-4" /> 3D</button>}
                    </div>
                </div>
            </motion.aside>
        </AnimatePresence>
    );
}
