import { PageLayoutService } from "@/lib/services/homepage-layout-service";
import { LayoutPage, loadBlockData, renderSharedBlock } from "@/components/home/PageBlocks";
import { previewMode } from "@/lib/page-preview";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ onizleme?: string; studio?: string }> };

/** Homepage built from the published layout (Admin › Ana Sayfa › Tasarım Stüdyosu). */
export default async function Home({ searchParams }: Props) {
    const { preview, studio } = await previewMode(await searchParams);
    const layout = await PageLayoutService.forRequest("home", preview);
    const data = await loadBlockData(layout.blocks);
    return (
        <LayoutPage
            layout={layout}
            preview={preview}
            studio={studio}
            studioTab="home"
            className="flex flex-col bg-gray-50 dark:bg-[#050510] transition-colors duration-300"
            render={(b) => renderSharedBlock(b, layout, data)}
        />
    );
}
