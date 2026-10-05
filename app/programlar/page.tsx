import type { Metadata } from "next";
import { Programs } from "@/components/sections/Programs";
import { PageLayoutService } from "@/lib/services/homepage-layout-service";
import { LayoutPage, loadBlockData, renderSharedBlock } from "@/components/home/PageBlocks";
import { ProgramService } from "@/lib/services/program-service";
import { previewMode } from "@/lib/page-preview";
import { pageText } from "@/lib/homepage-layout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Programlar | İKÜANTS TEKMER",
    description: "Ön kuluçka, kuluçka ve hızlandırma programları. Başvurun veya detaylı bilgi alın.",
};

type Props = { searchParams: Promise<{ onizleme?: string; studio?: string }> };

/** Section order and extra sections are edited in Admin › Tasarım Stüdyosu › Programlar. */
export default async function ProgramlarPage({ searchParams }: Props) {
    const { preview, studio } = await previewMode(await searchParams);
    const layout = await PageLayoutService.forRequest("programlar", preview);
    const [data, programs] = await Promise.all([loadBlockData(layout.blocks), ProgramService.getPublicPrograms()]);
    return (
        <LayoutPage
            layout={layout}
            preview={preview}
            studio={studio}
            studioTab="programlar"
            className="flex flex-col pt-8"
            render={(b) => (b.type === "programsList" ? <Programs programs={programs as never} eyebrow={pageText("programsList", b.config, "eyebrow")} title={pageText("programsList", b.config, "title")} subtitle={pageText("programsList", b.config, "subtitle")} /> : renderSharedBlock(b, layout, data))}
        />
    );
}
