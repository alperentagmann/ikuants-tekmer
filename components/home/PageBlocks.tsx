import React from "react";
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { Differences } from "@/components/sections/Differences";
import { Programs } from "@/components/sections/Programs";
import { Entrepreneurs } from "@/components/sections/Entrepreneurs";
import { PartnerLogos } from "@/components/sections/PartnerLogos";
import { BannerBlock, CtaBlock, StatsBlock, RichTextBlock, FormBlock, GalleryBlock, SpacesBlock, SupportsBlock, NewsBlock } from "@/components/home/HomeBlocks";
import { MaybeStudioBlock } from "@/components/home/StudioFrame";
import { BLOCK_LIBRARY, themeVariables, type HomeBlock, type HomeLayout } from "@/lib/homepage-layout";
import { ProgramService } from "@/lib/services/program-service";
import { FacilityService } from "@/lib/services/facility-service";
import { SupportService } from "@/lib/services/support-service";
import { NewsService } from "@/lib/services/news-service";

export type NewsCard = { id: string; slug: string; title: string; excerpt: string; date: string; category: string; image: string };
export type BlockData = { programs: unknown[]; facilities: unknown[]; supports: { id: string; title: string; description: string }[]; news: NewsCard[] };

/** Loads only the data the visible blocks need. */
export async function loadBlockData(blocks: HomeBlock[]): Promise<BlockData> {
    const needs = (t: HomeBlock["type"]) => blocks.some((b) => b.visible && b.type === t);
    const [programs, facilities, supports, news] = await Promise.all([
        needs("programs") ? ProgramService.getPublicPrograms() : Promise.resolve([]),
        needs("spaces") ? FacilityService.getPublicFacilities() : Promise.resolve([]),
        needs("supports") ? SupportService.getPublicSupports().catch(() => []) : Promise.resolve([]),
        needs("news") ? NewsService.getPublicNews({ limit: 12 }) : Promise.resolve([]),
    ]);
    return {
        programs,
        facilities,
        supports: supports.map((s) => ({ id: s.id, title: s.title, description: s.description })),
        news: news.map((n) => ({ id: n.id, slug: n.slug, title: n.title, excerpt: n.excerpt, date: n.date, category: n.category, image: n.image })),
    };
}

/** Renders a shared (non page-specific) block. Returns null for page sections. */
export function renderSharedBlock(b: HomeBlock, layout: HomeLayout, data: BlockData): React.ReactNode {
    const c = b.config as Record<string, string | number>;
    switch (b.type) {
        case "hero": return <Hero />;
        case "differences": return <Differences />;
        case "entrepreneurs": return <Entrepreneurs />;
        case "partners": return <PartnerLogos />;
        case "programs": return <Programs programs={data.programs as never} title={String(c.title || "GELİŞİM PROGRAMLARI")} subtitle={String(c.subtitle || "")} limit={Number(c.limit) || undefined} showLocation={false} />;
        case "banner": return <BannerBlock block={b} theme={layout.theme} />;
        case "cta": return <CtaBlock block={b} theme={layout.theme} />;
        case "stats": return <StatsBlock block={b} theme={layout.theme} />;
        case "richText": return <RichTextBlock block={b} theme={layout.theme} />;
        case "form": return <FormBlock block={b} theme={layout.theme} />;
        case "gallery": return <GalleryBlock block={b} theme={layout.theme} />;
        case "spaces": return <SpacesBlock block={b} theme={layout.theme} facilities={data.facilities as never} />;
        case "supports": return <SupportsBlock block={b} theme={layout.theme} supports={data.supports} />;
        case "news": return <NewsBlock block={b} theme={layout.theme} news={data.news} />;
        default: return null;
    }
}

/** Page wrapper: theme variables, draft banner and, in the studio canvas, selectable sections. */
export function LayoutPage({ layout, preview, studio, studioTab, className, render }: { layout: HomeLayout; preview: boolean; studio: boolean; studioTab: string; className?: string; render: (b: HomeBlock) => React.ReactNode }) {
    return (
        <div className={className} style={themeVariables(layout.theme) as React.CSSProperties}>
            {preview && !studio && (
                <div className="sticky top-20 z-40 flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-semibold text-black">
                    Taslak önizleme — ziyaretçiler yayındaki sürümü görür.
                    <Link href={`/admin/tasarim-studyosu?page=${studioTab}`} className="underline">Stüdyoya dön</Link>
                </div>
            )}
            {layout.blocks.filter((b) => b.visible).map((b) => {
                const node = render(b);
                if (!node) return null;
                return (
                    <MaybeStudioBlock key={b.id} enabled={studio} id={b.id} label={BLOCK_LIBRARY[b.type].label}>
                        {node}
                    </MaybeStudioBlock>
                );
            })}
        </div>
    );
}
