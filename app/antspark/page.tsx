import React from "react";
import { Metadata } from "next";
import { ProgramService } from "@/lib/services/program-service";
import { DynamicProgramDetail } from "@/components/programs/DynamicProgramDetail";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const program = await ProgramService.getProgramBySlug("antspark-on-kulucka");
    return {
        title: program?.seoTitle || "ANTSPARK Ön Kuluçka Programı | İKÜANTS TEKMER",
        description: program?.seoDescription || "Fikir aşamasındaki teknoloji girişimcileri için 12 haftalık ön kuluçka programı.",
    };
}

export default async function AntsparkProgramPage() {
    const program = await ProgramService.getProgramBySlug("antspark-on-kulucka");
    if (!program) notFound();
    return <DynamicProgramDetail program={program} />;
}
