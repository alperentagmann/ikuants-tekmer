import React from "react";
import { Metadata } from "next";
import { ProgramService } from "@/lib/services/program-service";
import { DynamicProgramDetail } from "@/components/programs/DynamicProgramDetail";
import { FormPlacementService } from "@/lib/services/form-placement-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const program = await ProgramService.getProgramBySlug("glow-up");
    return {
        title: program?.seoTitle || "Glow Up Hızlandırma Programı | İKÜANTS TEKMER",
        description: program?.seoDescription || "Kadın kurucu ortaklı teknoloji girişimleri için hızlandırma programı.",
    };
}

export default async function GlowUpProgramPage() {
    const program = await ProgramService.getProgramBySlug("glow-up");
    if (!program) notFound();
    const placements = await FormPlacementService.forTarget("PROGRAM_PAGE", program.id);
    return <DynamicProgramDetail program={program} placements={placements} />;
}
