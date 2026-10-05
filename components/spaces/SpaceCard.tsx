"use client";
import React from "react";
import { motion } from "framer-motion";
import { Boxes, Calendar, Search, Images, Users, MapPin, Building2, Receipt, Cpu } from "lucide-react";
import { parseGallery, type GalleryImage } from "@/lib/facility-media";
import { facilityMachines, facilityPricing, isMachineFacility, pricingLabel } from "@/lib/machines";

export interface PublicFacility {
    id: string;
    title: string;
    description: string;
    facilityType: string;
    featuresJson: string | null;
    iconName: string | null;
    coverImageUrl?: string | null;
    galleryJson?: string | null;
    has3D?: boolean;
}

export function facilityFacts(fac: PublicFacility): { capacity: number | null; floor: string | null; equipment: string[] } {
    try {
        const parsed = fac.featuresJson ? JSON.parse(fac.featuresJson) : {};
        if (Array.isArray(parsed)) return { capacity: null, floor: null, equipment: parsed.filter((x) => typeof x === "string") };
        const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" && v.trim() ? v.split(/[,;]\s*/) : []);
        return { capacity: typeof parsed.capacity === "number" ? parsed.capacity : null, floor: typeof parsed.floor === "string" ? parsed.floor : null, equipment: [...list(parsed.equipment), ...list(parsed.amenities)] };
    } catch {
        return { capacity: null, floor: null, equipment: [] };
    }
}

export function SpaceCard({
    fac,
    index,
    icon: Icon = Building2,
    availability,
    onReserve,
    onCheck,
    onOpen3D,
    onOpenGallery,
    onQuote,
    compact = false,
}: {
    fac: PublicFacility;
    index: number;
    /** Horizontal list layout. */
    compact?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    availability?: { isAvailable: boolean } | null;
    onReserve: () => void;
    onCheck: () => void;
    onOpen3D: () => void;
    onOpenGallery: (images: GalleryImage[], start: number) => void;
    /** Machines only: opens the price-quote request. */
    onQuote?: () => void;
}) {
    const facts = facilityFacts(fac);
    const machine = isMachineFacility(fac);
    const pricing = facilityPricing(fac);
    const machines = machine ? facilityMachines(fac) : [];
    const gallery = parseGallery(fac.galleryJson);
    const images: GalleryImage[] = [...(fac.coverImageUrl ? [{ url: fac.coverImageUrl, caption: fac.title }] : []), ...gallery.filter((g) => g.url !== fac.coverImageUrl)];
    const cover = images[0]?.url;

    return (
        <motion.div
            // Animate on mount (not on scroll) so cards can never stay invisible
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.03 }}
            className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:shadow-none ${compact ? "flex flex-col sm:flex-row" : "flex flex-col"}`}
        >
            {/* Photo: shows what the space actually looks like */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-primary/15 via-purple-500/10 to-secondary/15 ${compact ? "aspect-[16/10] sm:aspect-auto sm:w-64 sm:shrink-0" : "aspect-[16/10]"}`}>
                {cover ? (
                    <button type="button" onClick={() => onOpenGallery(images, 0)} className="block h-full w-full" aria-label={`${fac.title} fotoğraflarını aç`}>
                        <img src={cover} alt={fac.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </button>
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-primary/70">
                        <Icon className="h-12 w-12" />
                        <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">Fotoğraf yakında eklenecek</span>
                    </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {availability ? (
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${availability.isAvailable ? "bg-emerald-500/90" : "bg-rose-500/90"}`}>{availability.isAvailable ? "✓ MÜSAİT" : "✕ DOLU"}</span>
                    ) : null}
                    {fac.has3D && <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">3D / 360°</span>}
                </div>
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur ${pricing.model === "FREE" ? "bg-emerald-600/85" : "bg-amber-500/90"}`} data-testid="pricing-badge">{pricingLabel(pricing)}</span>
                {images.length > 1 && (
                    <button type="button" onClick={() => onOpenGallery(images, 0)} className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                        <Images className="h-3.5 w-3.5" /> {images.length} fotoğraf
                    </button>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <button type="button" onClick={onCheck} className="mb-1.5 text-left text-lg font-semibold text-black transition-colors group-hover:text-primary dark:text-white">{fac.title}</button>
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{fac.description}</p>

                {machine ? (
                    <ul className="mb-4 space-y-1.5" aria-label="Makineler">
                        {machines.map((m) => (
                            <li key={m.name} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span><strong className="font-semibold">{m.name}</strong>{m.role ? <span className="text-gray-500 dark:text-gray-400"> · {m.role}</span> : null}</span>
                            </li>
                        ))}
                        {pricing.note && <li className="text-[11px] text-amber-700 dark:text-amber-300">{pricing.note}</li>}
                    </ul>
                ) : (
                <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 dark:bg-white/5"><Users className="h-3.5 w-3.5 text-primary" />{facts.capacity ? `${facts.capacity} kişi` : "Kapasite: bilgi girilmemiş"}</span>
                    {facts.floor && <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 dark:bg-white/5"><MapPin className="h-3.5 w-3.5 text-primary" />{facts.floor}</span>}
                </div>
                )}

                {!machine && facts.equipment.length > 0 && (
                    <ul className="mb-4 space-y-1">
                        {facts.equipment.slice(0, 3).map((e) => (
                            <li key={e} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" /><span className="line-clamp-1">{e}</span></li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
                    {fac.has3D && (
                        <button type="button" onClick={onOpen3D} className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10">
                            <Boxes className="h-3.5 w-3.5" /> 3D Alanı İncele
                        </button>
                    )}
                    <button type="button" onClick={onCheck} className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 hover:border-primary/40 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10">
                        <Search className="h-3.5 w-3.5 text-cyan-500" /> Detay & doluluk
                    </button>
                    <button type="button" onClick={onReserve} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:opacity-90">
                        <Calendar className="h-3.5 w-3.5" /> Talep Oluştur
                    </button>
                    {machine && onQuote && (
                        <button type="button" onClick={onQuote} className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
                            <Receipt className="h-3.5 w-3.5" /> Fiyat Teklifi Talep Et
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
