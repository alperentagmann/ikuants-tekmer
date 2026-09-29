import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CaseStudyService } from '@/lib/services/case-study-service';
import {
    Award,
    TrendingUp,
    CheckCircle2,
    Building2,
    ArrowLeft,
    Share2,
    Quote,
    ExternalLink
} from 'lucide-react';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const study = await CaseStudyService.getCaseStudyBySlug(slug);

    if (!study) {
        return {
            title: 'Vaka Çalışması Bulunamadı | İKÜANTS TEKMER',
        };
    }

    const title = study.seoTitle || `${study.title} | İKÜANTS TEKMER`;
    const description = study.seoDescription || study.summary || 'İKÜANTS TEKMER Girişimcilik Başarı Hikâyesi.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://ikuantstekmer.com/vaka-calismalari/${study.slug}`,
        },
        openGraph: {
            title,
            description,
            images: study.featuredImage ? [study.featuredImage] : undefined,
            type: 'article',
        },
    };
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const study = await CaseStudyService.getCaseStudyBySlug(slug);

    if (!study || !study.isPublished) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: study.title,
        description: study.summary || study.seoDescription,
        image: study.featuredImage ? [study.featuredImage] : undefined,
        datePublished: study.createdAt,
        dateModified: study.updatedAt,
        author: {
            '@type': 'Organization',
            name: 'İKÜANTS TEKMER',
            url: 'https://ikuantstekmer.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'İKÜANTS TEKMER',
            logo: {
                '@type': 'ImageObject',
                url: 'https://ikuantstekmer.com/logo.png',
            },
        },
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-4xl mx-auto">
                <Breadcrumb
                    items={[
                        { label: 'Vaka Çalışmaları', href: '/vaka-calismalari' },
                        { label: study.title, href: `/vaka-calismalari/${study.slug}` },
                    ]}
                    className="mb-8"
                />

                <Link
                    href="/vaka-calismalari"
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tüm Vaka Çalışmalarına Dön</span>
                </Link>

                <article className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10 backdrop-blur-sm shadow-xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-6">
                        {study.entrepreneur && (
                            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full">
                                {study.entrepreneur.companyName}
                            </span>
                        )}
                        {study.program && (
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">
                                {study.program.name}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                        {study.title}
                    </h1>

                    {study.summary && (
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed font-medium pb-6 border-b border-slate-800">
                            {study.summary}
                        </p>
                    )}

                    {study.featuredImage && (
                        <div className="rounded-2xl overflow-hidden mb-8 border border-slate-800 bg-slate-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={study.featuredImage}
                                alt={study.title}
                                className="w-full max-h-[450px] object-cover"
                            />
                        </div>
                    )}

                    {study.metrics && (
                        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 mb-10 flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">
                                    Temel Sayısal Başarı Göstergeleri
                                </h3>
                                <p className="text-lg sm:text-xl font-bold text-white">
                                    {study.metrics}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-10 text-slate-200 leading-relaxed text-base sm:text-lg">
                        {study.challenge && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-3 text-cyan-400">
                                    1. Başlangıç Durumu & Karşılaşılan Zorluklar
                                </h2>
                                <p className="text-slate-300">{study.challenge}</p>
                            </section>
                        )}

                        {study.solution && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-3 text-cyan-400">
                                    2. Geliştirilen Çözüm & İnovasyon
                                </h2>
                                <p className="text-slate-300">{study.solution}</p>
                            </section>
                        )}

                        {study.contribution && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-3 text-cyan-400">
                                    3. İKÜANTS TEKMER Desteği ve Süreç
                                </h2>
                                <p className="text-slate-300">{study.contribution}</p>
                            </section>
                        )}

                        {study.results && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-3 text-cyan-400">
                                    4. Elde Edilen Çıktılar & Gelecek Hedefleri
                                </h2>
                                <p className="text-slate-300">{study.results}</p>
                            </section>
                        )}

                        {study.quote && (
                            <div className="bg-slate-950/80 border-l-4 border-cyan-400 p-6 rounded-r-2xl my-8 italic text-slate-300">
                                <Quote className="w-6 h-6 text-cyan-400 mb-2 opacity-50" />
                                <p className="text-lg text-white mb-2">&ldquo;{study.quote}&rdquo;</p>
                                {study.quoteAuthor && (
                                    <p className="text-xs text-slate-400 font-semibold not-italic">
                                        — {study.quoteAuthor}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Link
                            href="/programlar"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg shadow-cyan-950/40"
                        >
                            <span>Siz de Programlarımıza Başvurun</span>
                        </Link>
                        {study.entrepreneur && (
                            <Link
                                href={`/girisimciler#${study.entrepreneur.id}`}
                                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                                <span>Girişim Profilini İncele</span>
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </article>
            </div>
        </main>
    );
}
