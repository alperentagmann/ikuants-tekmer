"use client";
import React, { useMemo, useState } from "react";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { SPACE_GROUPS, spaceGroupKey, type GalleryImage } from "@/lib/facility-media";
import { facilityPricing, isMachineFacility } from "@/lib/machines";
import { SpaceCard, facilityFacts, type PublicFacility } from "./SpaceCard";

type Availability = { isAvailable: boolean } | null;

/**
 * Filterable list of spaces and machines. Without filters it shows the familiar grouped view
 * (Stüdyolar, Laboratuvarlar, …); any filter switches to one flat, sorted grid.
 */
export function SpaceExplorer({
    facilities,
    iconFor,
    availability,
    onDetails,
    onReserve,
    onQuote,
    onOpen3D,
    onOpenGallery,
}: {
    facilities: PublicFacility[];
    iconFor: (fac: PublicFacility) => React.ComponentType<{ className?: string }>;
    availability: Record<string, { isAvailable: boolean }> | null;
    onDetails: (fac: PublicFacility) => void;
    onReserve: (fac: PublicFacility) => void;
    onQuote: (fac: PublicFacility) => void;
    onOpen3D: (fac: PublicFacility) => void;
    onOpenGallery: (fac: PublicFacility, images: GalleryImage[], start: number) => void;
}) {
    const [query, setQuery] = useState("");
    const [group, setGroup] = useState("all");
    const [price, setPrice] = useState<"all" | "free" | "paid">("all");
    const [minCapacity, setMinCapacity] = useState(0);
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [view, setView] = useState<"grid" | "list">("grid");

    const groups = useMemo(() => SPACE_GROUPS.map((g) => ({ ...g, count: facilities.filter((f) => spaceGroupKey(f.facilityType) === g.key).length })).filter((g) => g.count > 0), [facilities]);

    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("tr-TR");
        return facilities.filter((f) => {
            if (group !== "all" && spaceGroupKey(f.facilityType) !== group) return false;
            const paid = facilityPricing(f).model !== "FREE";
            if (price === "free" && paid) return false;
            if (price === "paid" && !paid) return false;
            if (minCapacity > 0 && !isMachineFacility(f) && (facilityFacts(f).capacity ?? 0) < minCapacity) return false;
            if (onlyAvailable && availability && !availability[f.id]?.isAvailable) return false;
            if (q && !`${f.title} ${f.description} ${facilityFacts(f).equipment.join(" ")}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
            return true;
        });
    }, [facilities, query, group, price, minCapacity, onlyAvailable, availability]);

    const filtering = Boolean(query.trim()) || group !== "all" || price !== "all" || minCapacity > 0 || onlyAvailable;
    const reset = () => {
        setQuery("");
        setGroup("all");
        setPrice("all");
        setMinCapacity(0);
        setOnlyAvailable(false);
    };

    const card = (fac: PublicFacility, index: number) => (
        <SpaceCard
            key={fac.id}
            fac={fac}
            index={index}
            compact={view === "list"}
            icon={iconFor(fac)}
            availability={(availability && availability[fac.id]) || (null as Availability)}
            onCheck={() => onDetails(fac)}
            onReserve={() => onReserve(fac)}
            onOpen3D={() => onOpen3D(fac)}
            onOpenGallery={(images, start) => onOpenGallery(fac, images, start)}
            onQuote={() => onQuote(fac)}
        />
    );
    const grid = view === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-3";
    const chip = (active: boolean) => `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${active ? "border-primary bg-primary text-white shadow-md shadow-primary/30" : "border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-gray-200"}`;

    return (
        <div className="space-y-8">
            <div className="sticky top-20 z-30 -mx-4 space-y-3 border-y border-gray-200/70 bg-gray-50/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#050510]/85 sm:mx-0 sm:rounded-2xl sm:border">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Alan, makine veya donanım ara (ör. podcast, 3D, toplantı)" aria-label="Alan ara" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none focus:border-primary dark:border-white/10 dark:bg-black/40 dark:text-white" />
                        {query && <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white" aria-label="Aramayı temizle"><X className="h-4 w-4" /></button>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-xl border border-gray-200 bg-white p-0.5 text-xs font-semibold dark:border-white/10 dark:bg-black/40" role="group" aria-label="Ücret">
                            {([["all", "Tümü"], ["free", "Ücretsiz"], ["paid", "Ücretli"]] as const).map(([v, l]) => (
                                <button key={v} type="button" aria-pressed={price === v} onClick={() => setPrice(v)} className={`rounded-lg px-3 py-1.5 ${price === v ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300"}`}>{l}</button>
                            ))}
                        </div>
                        <label className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-gray-200">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                            <select aria-label="En az kapasite" value={minCapacity} onChange={(e) => setMinCapacity(Number(e.target.value))} className="bg-transparent outline-none">
                                <option value={0}>Her kapasite</option>
                                {[2, 4, 8, 12, 20].map((n) => <option key={n} value={n}>{n}+ kişi</option>)}
                            </select>
                        </label>
                        {availability && (
                            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Yalnız müsaitler
                            </label>
                        )}
                        <div className="hidden rounded-xl border border-gray-200 bg-white p-0.5 dark:border-white/10 dark:bg-black/40 sm:flex" role="group" aria-label="Görünüm">
                            <button type="button" aria-label="Kart görünümü" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`rounded-lg p-1.5 ${view === "grid" ? "bg-primary text-white" : "text-gray-500"}`}><LayoutGrid className="h-4 w-4" /></button>
                            <button type="button" aria-label="Liste görünümü" aria-pressed={view === "list"} onClick={() => setView("list")} className={`rounded-lg p-1.5 ${view === "list" ? "bg-primary text-white" : "text-gray-500"}`}><List className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
                <nav aria-label="Alan kategorileri" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
                    <button type="button" className={chip(group === "all")} onClick={() => setGroup("all")}>Tümü <span className="opacity-70">{facilities.length}</span></button>
                    {groups.map((g) => <button key={g.key} type="button" className={chip(group === g.key)} onClick={() => setGroup(g.key)}>{g.title} <span className="opacity-70">{g.count}</span></button>)}
                </nav>
            </div>

            {filtering ? (
                <section aria-live="polite">
                    <div className="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span><strong className="text-gray-900 dark:text-white">{filtered.length}</strong> sonuç</span>
                        <button type="button" onClick={reset} className="text-xs font-semibold text-primary hover:underline">Filtreleri temizle</button>
                    </div>
                    {filtered.length ? <div className={grid}>{filtered.map(card)}</div> : (
                        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-white/10">Aradığınız ölçütlere uyan alan bulunamadı. <button type="button" onClick={reset} className="font-semibold text-primary hover:underline">Tümünü göster</button></div>
                    )}
                </section>
            ) : (
                SPACE_GROUPS.map((g) => {
                    const items = facilities.filter((f) => spaceGroupKey(f.facilityType) === g.key);
                    if (!items.length) return null;
                    return (
                        <section key={g.key} id={`alan-${g.key}`} className="scroll-mt-48">
                            <div className="mb-6 flex flex-col gap-1 border-b border-gray-200 pb-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="font-orbitron text-2xl font-bold text-black dark:text-white">{g.title}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{g.description}</p>
                                </div>
                                <span className="text-xs font-mono text-gray-500">{items.length} alan</span>
                            </div>
                            <div className={grid}>{items.map(card)}</div>
                        </section>
                    );
                })
            )}
        </div>
    );
}
