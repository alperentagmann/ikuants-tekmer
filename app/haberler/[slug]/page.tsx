import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, Tag } from "lucide-react";
import { NewsService } from "@/lib/services/news-service";
import { NewsGallery, ShareButtons } from "./NewsDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await NewsService.getPublicBySlug(slug).catch(() => null);
    if (!data) return { title: "Haber bulunamadı | İKÜANTS TEKMER" };
    const { item } = data;
    const description = item.seoDescription || item.excerpt || item.content.slice(0, 160);
    return {
        title: `${item.seoTitle || item.title} | İKÜANTS TEKMER`,
        description,
        alternates: { canonical: `/haberler/${item.slug}` },
        openGraph: { type: "article", title: item.title, description, images: item.image ? [{ url: item.image, alt: item.imageAlt }] : undefined, publishedTime: item.publishedAt?.toISOString() },
    };
}

/** Permanent, shareable page of one news item or announcement. */
export default async function NewsDetailPage({ params }: Props) {
    const { slug } = await params;
    const data = await NewsService.getPublicBySlug(slug).catch(() => null);
    if (!data) notFound();
    const { item, related } = data;
    const paragraphs = item.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const articleLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: item.title,
        datePublished: item.publishedAt?.toISOString(),
        dateModified: item.updatedAt.toISOString(),
        image: item.image ? [item.image] : undefined,
        publisher: { "@type": "Organization", name: "İKÜANTS TEKMER" },
    };

    return (
        <article className="relative min-h-screen bg-gray-50 pb-24 transition-colors duration-300 dark:bg-[#050510]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd).replace(/</g, "\\u003c") }} />
            <div className="relative h-[42vh] min-h-[320px] overflow-hidden">
                {item.image ? <img src={item.image} alt={item.imageAlt} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/30 via-purple-600/20 to-cyan-500/20" />}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/40 to-transparent dark:from-[#050510] dark:via-[#050510]/50" />
            </div>

            <div className="container relative z-10 mx-auto -mt-40 max-w-4xl px-4 sm:px-6">
                <Link href="/haberler" className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 backdrop-blur hover:text-primary dark:border-white/10 dark:bg-black/40 dark:text-gray-200"><ArrowLeft className="h-3.5 w-3.5" /> Tüm haberler</Link>
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0b0b16] sm:p-10">
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary"><Tag className="h-3.5 w-3.5" />{item.category}</span>
                        {item.date && <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"><Calendar className="h-3.5 w-3.5" />{item.date}</span>}
                    </div>
                    <h1 className="mb-6 font-orbitron text-2xl font-bold leading-tight text-black dark:text-white sm:text-4xl">{item.title}</h1>
                    {item.excerpt && <p className="mb-8 border-l-4 border-primary pl-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">{item.excerpt}</p>}
                    <div className="space-y-4 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
                        {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                    </div>
                    {item.registrationLink && (
                        <a href={item.registrationLink} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90">Kayıt ol <ExternalLink className="h-4 w-4" /></a>
                    )}
                    {item.gallery.length > 0 && <NewsGallery images={item.gallery} title={item.title} />}
                    <div className="mt-10 border-t border-gray-200 pt-6 dark:border-white/10"><ShareButtons title={item.title} /></div>
                </div>

                {related.length > 0 && (
                    <section className="mt-14">
                        <h2 className="mb-5 font-orbitron text-xl font-bold text-black dark:text-white">Diğer haberler</h2>
                        <div className="grid gap-5 sm:grid-cols-3">
                            {related.map((r) => (
                                <Link key={r.id} href={`/haberler/${r.slug}`} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
                                    <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 to-cyan-500/10">{r.image && <img src={r.image} alt={r.imageAlt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}</div>
                                    <div className="p-4">
                                        <div className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">{r.category} · {r.date}</div>
                                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-primary dark:text-white">{r.title}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </article>
    );
}
