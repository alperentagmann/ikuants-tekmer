"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import type { BlockStyle, HomeBlock, HomeTheme } from "@/lib/homepage-layout";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";
import { SpaceCard, type PublicFacility } from "@/components/spaces/SpaceCard";
import type { GalleryImage } from "@/lib/facility-media";

const radiusClass = (t: HomeTheme) => (t.radius === "sharp" ? "rounded-none" : t.radius === "pill" ? "rounded-[2rem]" : "rounded-3xl");
const buttonRadius = (t: HomeTheme) => (t.radius === "sharp" ? "rounded-none" : t.radius === "pill" ? "rounded-full" : "rounded-xl");
const pad = (s: BlockStyle, t: HomeTheme) => {
    const scale = t.density === "compact" ? 0.75 : t.density === "spacious" ? 1.35 : 1;
    const base = { none: 0, sm: 3, md: 5, lg: 7 }[s.paddingY];
    return `${base * scale}rem`;
};

/** Background and spacing wrapper for builder blocks. */
export function BlockSection({ style, theme, children, id }: { style: BlockStyle; theme: HomeTheme; children: React.ReactNode; id?: string }) {
    const bg =
        style.background === "muted" ? "bg-white dark:bg-white/[0.03]"
        : style.background === "contrast" ? "bg-gray-900 text-white dark:bg-black"
        : style.background === "gradient" ? "text-white"
        : "bg-gray-50 dark:bg-[#050510]";
    const inline: React.CSSProperties = { paddingTop: pad(style, theme), paddingBottom: pad(style, theme) };
    if (style.background === "gradient") inline.backgroundImage = "linear-gradient(135deg, var(--primary), var(--secondary))";
    if (style.background === "image" && style.backgroundImage) {
        inline.backgroundImage = `linear-gradient(rgba(5,5,16,0.65), rgba(5,5,16,0.75)), url("${style.backgroundImage}")`;
        inline.backgroundSize = "cover";
        inline.backgroundPosition = "center";
    }
    return (
        <section id={id} className={`relative transition-colors duration-300 ${bg} ${style.background === "image" ? "text-white" : ""}`} style={inline}>
            <div className={`container mx-auto max-w-7xl px-6 ${style.align === "left" ? "text-left" : "text-center"}`}>{children}</div>
        </section>
    );
}

function Heading({ title, subtitle, light }: { title?: string; subtitle?: string; light?: boolean }) {
    if (!title && !subtitle) return null;
    return (
        <div className="mb-10">
            {title && <h2 className={`mb-3 font-orbitron text-3xl font-bold md:text-4xl ${light ? "text-white" : "text-gray-900 dark:text-white"}`}>{title}</h2>}
            {subtitle && <p className={`mx-auto max-w-2xl ${light ? "text-white/80" : "text-gray-600 dark:text-gray-400"}`}>{subtitle}</p>}
        </div>
    );
}

const isLight = (s: BlockStyle) => s.background === "contrast" || s.background === "gradient" || s.background === "image";

export function BannerBlock({ block, theme }: { block: HomeBlock; theme: HomeTheme }) {
    const c = block.config as { title: string; text: string; buttonText: string; buttonLink: string; imageUrl: string; layout: string; accent: string };
    const light = isLight(block.style);
    const image = c.imageUrl ? <img src={c.imageUrl} alt={c.title} className={`h-full w-full object-cover ${radiusClass(theme)}`} loading="lazy" /> : null;
    if (c.layout === "full" && c.imageUrl) {
        return (
            <BlockSection style={{ ...block.style, paddingY: block.style.paddingY }} theme={theme}>
                <div className={`relative overflow-hidden ${radiusClass(theme)}`}>
                    <img src={c.imageUrl} alt={c.title} className="h-[420px] w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-8 text-left md:p-12">
                        <div className="max-w-2xl text-white">
                            {c.title && <h2 className="mb-3 font-orbitron text-3xl font-bold md:text-4xl">{c.title}</h2>}
                            {c.text && <p className="mb-6 whitespace-pre-line text-white/85">{c.text}</p>}
                            {c.buttonText && c.buttonLink && <Link href={c.buttonLink} className={`inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-bold text-gray-900 ${buttonRadius(theme)}`}>{c.buttonText} <ArrowRight className="h-4 w-4" /></Link>}
                        </div>
                    </div>
                </div>
            </BlockSection>
        );
    }
    return (
        <BlockSection style={block.style} theme={theme}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`grid items-center gap-10 text-left ${image ? "md:grid-cols-2" : ""}`}>
                <div className={c.layout === "image-left" ? "md:order-2" : ""}>
                    {c.title && <h2 className={`mb-4 font-orbitron text-3xl font-bold md:text-4xl ${light ? "text-white" : "text-gray-900 dark:text-white"}`}>{c.title}</h2>}
                    {c.text && <p className={`mb-6 whitespace-pre-line leading-relaxed ${light ? "text-white/85" : "text-gray-600 dark:text-gray-300"}`}>{c.text}</p>}
                    {c.buttonText && c.buttonLink && (
                        <Link href={c.buttonLink} className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white shadow-lg ${buttonRadius(theme)}`} style={{ background: c.accent || "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
                            {c.buttonText} <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
                {image && <div className={`aspect-[4/3] overflow-hidden shadow-2xl ${radiusClass(theme)} ${c.layout === "image-left" ? "md:order-1" : ""}`}>{image}</div>}
            </motion.div>
        </BlockSection>
    );
}

export function CtaBlock({ block, theme }: { block: HomeBlock; theme: HomeTheme }) {
    const c = block.config as { title: string; text: string; primaryText: string; primaryLink: string; secondaryText: string; secondaryLink: string };
    return (
        <BlockSection style={block.style} theme={theme}>
            <div className={`relative overflow-hidden p-10 text-center text-white shadow-2xl md:p-14 ${radiusClass(theme)}`} style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
                {c.title && <h2 className="mb-3 font-orbitron text-3xl font-bold md:text-4xl">{c.title}</h2>}
                {c.text && <p className="mx-auto mb-8 max-w-2xl whitespace-pre-line text-white/90">{c.text}</p>}
                <div className="flex flex-wrap justify-center gap-3">
                    {c.primaryText && c.primaryLink && <Link href={c.primaryLink} className={`inline-flex items-center gap-2 bg-white px-7 py-3.5 text-sm font-bold text-gray-900 shadow-lg ${buttonRadius(theme)}`}>{c.primaryText} <ArrowRight className="h-4 w-4" /></Link>}
                    {c.secondaryText && c.secondaryLink && <Link href={c.secondaryLink} className={`inline-flex items-center gap-2 border border-white/60 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10 ${buttonRadius(theme)}`}>{c.secondaryText}</Link>}
                </div>
            </div>
        </BlockSection>
    );
}

export function StatsBlock({ block, theme }: { block: HomeBlock; theme: HomeTheme }) {
    const c = block.config as { title: string; items: { value: string; label: string }[] };
    if (!c.items?.length) return null;
    const light = isLight(block.style);
    return (
        <BlockSection style={block.style} theme={theme}>
            <Heading title={c.title} light={light} />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {c.items.map((i) => (
                    <div key={i.label + i.value} className={`border p-6 ${radiusClass(theme)} ${light ? "border-white/20 bg-white/10" : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"}`}>
                        <div className="font-orbitron text-3xl font-black md:text-4xl" style={{ color: light ? "#fff" : "var(--primary)" }}>{i.value}</div>
                        <div className={`mt-1 text-sm ${light ? "text-white/80" : "text-gray-600 dark:text-gray-400"}`}>{i.label}</div>
                    </div>
                ))}
            </div>
        </BlockSection>
    );
}

export function RichTextBlock({ block, theme }: { block: HomeBlock; theme: HomeTheme }) {
    const c = block.config as { title: string; body: string };
    const light = isLight(block.style);
    return (
        <BlockSection style={block.style} theme={theme}>
            <div className={`mx-auto max-w-3xl ${block.style.align === "left" ? "mx-0" : ""}`}>
                {c.title && <h2 className={`mb-5 font-orbitron text-3xl font-bold ${light ? "text-white" : "text-gray-900 dark:text-white"}`}>{c.title}</h2>}
                {c.body && <div className={`whitespace-pre-line text-base leading-relaxed ${light ? "text-white/85" : "text-gray-700 dark:text-gray-300"}`}>{c.body}</div>}
            </div>
        </BlockSection>
    );
}

export function FormBlock({ block, theme }: { block: HomeBlock; theme: HomeTheme }) {
    const c = block.config as { title: string; description: string; formSlug: string };
    const [ref, setRef] = useState<string | null>(null);
    if (!c.formSlug) return null;
    return (
        <BlockSection style={block.style} theme={theme}>
            <div className={`mx-auto max-w-3xl border border-gray-200 bg-white p-6 text-left shadow-xl dark:border-white/10 dark:bg-[#0c0c18] md:p-10 ${radiusClass(theme)}`}>
                {c.title && <h2 className="mb-2 font-orbitron text-2xl font-bold text-gray-900 dark:text-white">{c.title}</h2>}
                {c.description && <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{c.description}</p>}
                {ref ? (
                    <p className="flex items-center gap-2 font-semibold text-emerald-600"><CheckCircle2 className="h-5 w-5" /> Formunuz alındı. Referans: {ref}</p>
                ) : (
                    <InlineFormCenterForm slug={c.formSlug} themeKey="site" onSubmitted={setRef} />
                )}
            </div>
        </BlockSection>
    );
}

export function GalleryBlock({ block, theme }: { block: HomeBlock; theme: HomeTheme }) {
    const c = block.config as { title: string; images: { url: string; caption: string }[] };
    const [open, setOpen] = useState<number | null>(null);
    if (!c.images?.length) return null;
    return (
        <BlockSection style={block.style} theme={theme}>
            <Heading title={c.title} light={isLight(block.style)} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {c.images.map((img, i) => (
                    <button key={img.url + i} type="button" onClick={() => setOpen(i)} className={`group overflow-hidden ${radiusClass(theme)} ${i === 0 ? "col-span-2 row-span-2" : ""}`} aria-label={img.caption || `Görsel ${i + 1}`}>
                        <img src={img.url} alt={img.caption || ""} loading="lazy" className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </button>
                ))}
            </div>
            {open !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
                    <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Kapat"><X className="h-6 w-6" /></button>
                    <figure onClick={(e) => e.stopPropagation()}>
                        <img src={c.images[open].url} alt={c.images[open].caption || ""} className="max-h-[82vh] rounded-xl object-contain" />
                        {c.images[open].caption && <figcaption className="mt-2 text-center text-sm text-white/80">{c.images[open].caption}</figcaption>}
                    </figure>
                </div>
            )}
        </BlockSection>
    );
}

export function SpacesBlock({ block, theme, facilities }: { block: HomeBlock; theme: HomeTheme; facilities: PublicFacility[] }) {
    const c = block.config as { title: string; subtitle: string; limit: number };
    const [gallery, setGallery] = useState<{ images: GalleryImage[]; index: number } | null>(null);
    const list = facilities.slice(0, c.limit || 3);
    if (!list.length) return null;
    return (
        <BlockSection style={block.style} theme={theme}>
            <Heading title={c.title} subtitle={c.subtitle} light={isLight(block.style)} />
            <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
                {list.map((f, i) => (
                    <SpaceCard key={f.id} fac={f} index={i} onReserve={() => { window.location.href = "/kullanim-alanlari"; }} onCheck={() => { window.location.href = "/kullanim-alanlari"; }} onOpen3D={() => { window.location.href = "/kullanim-alanlari"; }} onOpenGallery={(images, index) => setGallery({ images, index })} />
                ))}
            </div>
            <Link href="/kullanim-alanlari" className={`mt-10 inline-flex items-center gap-2 border border-current px-6 py-3 text-sm font-bold ${buttonRadius(theme)}`} style={{ color: isLight(block.style) ? "#fff" : "var(--primary)" }}>Tüm alanları gör <ArrowRight className="h-4 w-4" /></Link>
            {gallery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={() => setGallery(null)}>
                    <img src={gallery.images[gallery.index].url} alt={gallery.images[gallery.index].caption || ""} className="max-h-[85vh] rounded-xl object-contain" />
                </div>
            )}
        </BlockSection>
    );
}

export function SupportsBlock({ block, theme, supports }: { block: HomeBlock; theme: HomeTheme; supports: { id: string; title: string; description: string }[] }) {
    const c = block.config as { title: string; subtitle: string; limit: number };
    const list = supports.slice(0, c.limit || 4);
    if (!list.length) return null;
    const light = isLight(block.style);
    return (
        <BlockSection style={block.style} theme={theme}>
            <Heading title={c.title} subtitle={c.subtitle} light={light} />
            <div className="grid grid-cols-1 gap-5 text-left md:grid-cols-2">
                {list.map((s) => (
                    <div key={s.id} className={`border p-6 ${radiusClass(theme)} ${light ? "border-white/20 bg-white/10" : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"}`}>
                        <h3 className={`mb-2 font-orbitron text-lg font-bold ${light ? "text-white" : "text-gray-900 dark:text-white"}`}>{s.title}</h3>
                        <p className={`line-clamp-3 text-sm ${light ? "text-white/80" : "text-gray-600 dark:text-gray-400"}`}>{s.description}</p>
                    </div>
                ))}
            </div>
            <Link href="/destekler" className={`mt-10 inline-flex items-center gap-2 border border-current px-6 py-3 text-sm font-bold ${buttonRadius(theme)}`} style={{ color: light ? "#fff" : "var(--primary)" }}>Tüm destekler <ArrowRight className="h-4 w-4" /></Link>
        </BlockSection>
    );
}

export function NewsBlock({ block, theme, news }: { block: HomeBlock; theme: HomeTheme; news: { id: string; slug: string; title: string; excerpt: string; date: string; category: string; image: string }[] }) {
    const c = block.config as { title: string; subtitle: string; limit: number };
    const list = news.slice(0, c.limit || 3);
    if (!list.length) return null;
    const light = isLight(block.style);
    return (
        <BlockSection style={block.style} theme={theme}>
            <Heading title={c.title} subtitle={c.subtitle} light={light} />
            <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
                {list.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Link href={`/haberler/${n.slug}`} className={`group flex h-full flex-col overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-xl ${radiusClass(theme)} ${light ? "border-white/20 bg-white/10" : "border-gray-200 bg-white hover:border-primary/40 dark:border-white/10 dark:bg-white/5"}`}>
                            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 to-cyan-500/10">
                                {n.image && <img src={n.image} alt={n.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">{n.category}</span>
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                                <div className={`mb-1.5 text-xs ${light ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>{n.date}</div>
                                <h3 className={`mb-2 line-clamp-2 font-semibold ${light ? "text-white" : "text-gray-900 group-hover:text-primary dark:text-white"}`}>{n.title}</h3>
                                <p className={`line-clamp-2 text-sm ${light ? "text-white/80" : "text-gray-600 dark:text-gray-400"}`}>{n.excerpt}</p>
                                <span className="mt-auto pt-4 text-xs font-bold" style={{ color: light ? "#fff" : "var(--primary)" }}>Devamını oku →</span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
            <Link href="/haberler" className={`mt-10 inline-flex items-center gap-2 border border-current px-6 py-3 text-sm font-bold ${buttonRadius(theme)}`} style={{ color: light ? "#fff" : "var(--primary)" }}>Tüm haberler <ArrowRight className="h-4 w-4" /></Link>
        </BlockSection>
    );
}

