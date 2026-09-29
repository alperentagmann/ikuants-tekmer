import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CaseStudyService } from '@/lib/services/case-study-service';
import { Award, ArrowRight, Building2, TrendingUp, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Vaka Çalışmaları ve Başarı Hikâyeleri | İKÜANTS TEKMER',
    description: 'İKÜANTS TEKMER bünyesinde kuluçka, Ar-Ge ve büyüme desteği alan teknoloji girişimlerinin başarı hikâyeleri ve vaka çalışmaları.',
    alternates: {
        canonical: 'https://ikuantstekmer.com/vaka-calismalari',
    },
};

export default async function CaseStudiesPage() {
    const caseStudies = await CaseStudyService.getPublishedCaseStudies();

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Breadcrumb
                    items={[{ label: 'Vaka Çalışmaları', href: '/vaka-calismalari' }]}
                    className="mb-8"
                />

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
                        <Award className="w-4 h-4" />
                        <span>Ekosistem Etkisi</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                        Vaka Çalışmaları & Başarı Hikâyeleri
                    </h1>
                    <p className="text-slate-400 text-lg">
                        İKÜANTS TEKMER kuluçka ve hızlandırma programlarıyla ölçeklenen girişimlerin büyüme yolculukları.
                    </p>
                </div>

                {caseStudies.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
                        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Henüz Yayınlanmış Vaka Çalışması Bulunmuyor</h3>
                        <p className="text-slate-400 mb-6">
                            Girişimlerimizin kuluçka süreçleri ve etki analizleri tamamlandıkça başarı hikâyeleri burada paylaşılacaktır.
                        </p>
                        <Link
                            href="/girisimciler"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                        >
                            <span>Girişimcilerimizi İnceleyin</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {caseStudies.map((study) => (
                            <article
                                key={study.id}
                                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col group"
                            >
                                {study.featuredImage && (
                                    <div className="h-48 w-full overflow-hidden bg-slate-950 relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={study.featuredImage}
                                            alt={study.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-3">
                                            {study.entrepreneur && (
                                                <span className="bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                                                    {study.entrepreneur.companyName}
                                                </span>
                                            )}
                                            {study.program && (
                                                <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                                                    {study.program.name}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-3">
                                            {study.title}
                                        </h2>
                                        {study.summary && (
                                            <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                                                {study.summary}
                                            </p>
                                        )}
                                        {study.metrics && (
                                            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 mb-4 flex items-center gap-3">
                                                <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <span className="text-xs font-semibold text-emerald-300 truncate">
                                                    {study.metrics}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        href={`/vaka-calismalari/${study.slug}`}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mt-4 pt-4 border-t border-slate-800"
                                    >
                                        <span>Hikâyeyi Oku</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
