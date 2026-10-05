import type { Metadata } from "next";
import { PageLayoutService } from "@/lib/services/homepage-layout-service";
import { loadBlockData, renderSharedBlock } from "@/components/home/PageBlocks";
import { BLOCK_LIBRARY, themeVariables } from "@/lib/homepage-layout";
import { previewMode } from "@/lib/page-preview";
import { SpacesPageClient } from "./SpacesPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Kullanım Alanları & Rezervasyon | İKÜANTS TEKMER",
    description: "İKÜANTS TEKMER stüdyoları, laboratuvarları ve toplantı alanları. Müsaitliği kontrol edin ve rezervasyon talebi oluşturun.",
};

type Props = { searchParams: Promise<{ onizleme?: string; studio?: string }> };

export default async function KullanimAlanlariPage({ searchParams }: Props) {
    const { preview, studio } = await previewMode(await searchParams);
    const layout = await PageLayoutService.forRequest("kullanim-alanlari", preview);
    const data = await loadBlockData(layout.blocks);
    const slots = layout.blocks.filter((b) => b.visible).map((b) => ({ id: b.id, key: b.type, label: BLOCK_LIBRARY[b.type].label, config: b.config, node: b.type.startsWith("spaces") && b.type !== "spaces" ? undefined : renderSharedBlock(b, layout, data) }));
    return (
        <div style={themeVariables(layout.theme) as React.CSSProperties}>
            {preview && !studio && <div className="sticky top-20 z-40 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black">Taslak önizleme — ziyaretçiler yayındaki sürümü görür.</div>}
            <SpacesPageClient slots={slots} studio={studio} />
        </div>
    );
}
