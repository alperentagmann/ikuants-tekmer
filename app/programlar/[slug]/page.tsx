import React from "react";
import { Metadata } from "next";
import { ProgramService } from "@/lib/services/program-service";
import { DynamicProgramDetail } from "@/components/programs/DynamicProgramDetail";
import { FormPlacementService } from "@/lib/services/form-placement-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const program = await ProgramService.getProgramBySlug(slug);

    if (!program) {
        return {
            title: "Program Bulunamadı | İKÜANTS TEKMER",
            description: "Teknoloji Geliştirme Merkezi Programı",
        };
    }

    return {
        title: `${program.seoTitle || program.name} | İKÜANTS TEKMER`,
        description: program.seoDescription || program.shortDesc || "İKÜANTS TEKMER Kuluçka ve Girişimcilik Programı",
        openGraph: {
            title: program.seoTitle || program.name,
            description: program.seoDescription || program.shortDesc || "",
            images: program.ogImageUrl ? [{ url: program.ogImageUrl }] : [],
        },
    };
}

export default async function ProgramDetailPage({ params }: Props) {
    const { slug } = await params;
    const program = await ProgramService.getProgramBySlug(slug);

    if (!program) {
        notFound();
    }

    const placements = await FormPlacementService.forTarget("PROGRAM_PAGE", program.id);
    return <DynamicProgramDetail program={program} placements={placements} />;
}
