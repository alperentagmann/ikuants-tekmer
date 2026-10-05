import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StandaloneForm } from "./StandaloneForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** A published form is reachable here when it has an active standalone placement or an open campaign. */
async function loadForm(slug: string) {
    const form = await prisma.form.findFirst({
        where: { slug, isPublished: true, isArchived: false },
        select: { id: true, slug: true, title: true, description: true, theme: true, placements: { where: { targetType: "STANDALONE", isActive: true }, select: { title: true, description: true }, take: 1 }, campaigns: { where: { status: "OPEN" }, select: { id: true }, take: 1 } },
    });
    if (!form || (form.placements.length === 0 && form.campaigns.length === 0)) return null;
    return form;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const form = await loadForm((await params).slug);
    return { title: form ? `${form.placements[0]?.title || form.title} | İKÜANTS TEKMER` : "Form bulunamadı | İKÜANTS TEKMER", robots: { index: false } };
}

export default async function StandaloneFormPage({ params }: Props) {
    const form = await loadForm((await params).slug);
    if (!form) notFound();
    return <StandaloneForm slug={form.slug} title={form.placements[0]?.title || form.title} description={form.placements[0]?.description || form.description} themeKey={form.theme || "site"} />;
}
