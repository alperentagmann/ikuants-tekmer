import React from "react";
import { Metadata } from "next";
import { ProgramService } from "@/lib/services/program-service";
import { DynamicProgramDetail } from "@/components/programs/DynamicProgramDetail";
import { FormPlacementService } from "@/lib/services/form-placement-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const program = await ProgramService.getProgramBySlug("antsfire-kulucka");
    return {
        title: program?.seoTitle || "ANTSFire Kuluçka Programı | İKÜANTS TEKMER",
        description: program?.seoDescription || "Büyüme aşamasındaki teknoloji şirketleri için 12 aylık kuluçka programı.",
    };
}

export default async function AntsfireProgramPage() {
    const program = await ProgramService.getProgramBySlug("antsfire-kulucka");
    if (!program) notFound();
    const placements = await FormPlacementService.forTarget("PROGRAM_PAGE", program.id);
    return <DynamicProgramDetail program={program} placements={placements} />;
}
