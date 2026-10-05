import type { Metadata } from "next";
import { SupportService } from "@/lib/services/support-service";
import { FormPlacementService } from "@/lib/services/form-placement-service";
import { PageLayoutService } from "@/lib/services/homepage-layout-service";
import { loadBlockData, renderSharedBlock } from "@/components/home/PageBlocks";
import { BLOCK_LIBRARY, themeVariables } from "@/lib/homepage-layout";
import { previewMode } from "@/lib/page-preview";
import { SUPPORT_DEFAULTS } from "@/data/support-defaults";
import { SupportsView, type SupportItem } from "./SupportsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "TEKMER Avantajları ve Destekler | İKÜANTS TEKMER",
    description: "5746 sayılı Kanun kapsamında İKÜANTS TEKMER firmalarının yararlanabileceği vergi avantajları ve devlet destekleri.",
};

type Props = { searchParams: Promise<{ onizleme?: string; studio?: string }> };

export default async function DesteklerPage({ searchParams }: Props) {
    const { preview, studio } = await previewMode(await searchParams);
    const layout = await PageLayoutService.forRequest("destekler", preview);
    const [rows, placements, data] = await Promise.all([SupportService.getPublicSupports().catch(() => []), FormPlacementService.forTarget("SUPPORTS_PAGE"), loadBlockData(layout.blocks)]);
    const supports: SupportItem[] = rows.length
        ? rows.map((s, i) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              example: s.exampleScenario || "",
              iconName: s.iconName || "FileCheck",
              color: s.colorGradient || (i % 2 === 0 ? "from-blue-500 to-cyan-500" : "from-purple-500 to-pink-500"),
              ctaText: s.ctaText || null,
              ctaLink: s.ctaLink || null,
              sourceUrl: s.sourceUrl || null,
          }))
        : SUPPORT_DEFAULTS.map((s) => ({ id: s.id, title: s.title, description: s.description, example: s.exampleScenario, iconName: s.iconName, color: s.colorGradient, ctaText: null, ctaLink: null, sourceUrl: null }));
    const slots = layout.blocks.filter((b) => b.visible).map((b) => ({ id: b.id, key: b.type, label: BLOCK_LIBRARY[b.type].label, config: b.config, node: b.type.startsWith("supports") && b.type !== "supports" ? undefined : renderSharedBlock(b, layout, data) }));
    return (
        <div style={themeVariables(layout.theme) as React.CSSProperties}>
            {preview && !studio && <div className="sticky top-20 z-40 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black">Taslak önizleme — ziyaretçiler yayındaki sürümü görür.</div>}
            <SupportsView supports={supports} placements={placements} slots={slots} studio={studio} />
        </div>
    );
}
