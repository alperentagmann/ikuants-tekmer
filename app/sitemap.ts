import { MetadataRoute } from 'next';
import { CaseStudyService } from '@/lib/services/case-study-service';
import { ProgramService } from '@/lib/services/program-service';
import { prisma } from '@/lib/prisma';

type Frequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/** Public pages that exist as routes (path, change frequency, priority). */
const STATIC_ROUTES: [string, Frequency, number][] = [
    ['', 'daily', 1.0],
    ['/programlar', 'weekly', 0.9],
    ['/antspark', 'weekly', 0.9],
    ['/antsfire', 'weekly', 0.9],
    ['/girisimciler', 'daily', 0.9],
    ['/mentorler', 'weekly', 0.8],
    ['/haberler', 'daily', 0.8],
    ['/kullanim-alanlari', 'monthly', 0.8],
    ['/hizmetlerimiz', 'monthly', 0.8],
    ['/destekler', 'monthly', 0.8],
    ['/vaka-calismalari', 'weekly', 0.8],
    ['/ekibimiz', 'monthly', 0.7],
    ['/kurullar', 'monthly', 0.7],
    ['/isbirliklerimiz', 'monthly', 0.7],
    ['/mevzuat', 'monthly', 0.6],
    ['/sss', 'monthly', 0.7],
    ['/iletisim', 'monthly', 0.7],
    ['/basvuru', 'monthly', 0.7],
    ['/kvkk', 'yearly', 0.5],
    ['/gizlilik-politikasi', 'yearly', 0.5],
    ['/cerez-politikasi', 'yearly', 0.5],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://ikuantstekmer.com';
    const now = new Date();

    const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map(([path, changeFrequency, priority]) => ({ url: `${baseUrl}${path}`, lastModified: now, changeFrequency, priority }));

    // Program detail pages (the service falls back to the default programs without a database)
    const programs = await ProgramService.getPublicPrograms();
    const programUrls: MetadataRoute.Sitemap = programs
        .filter((p): p is NonNullable<typeof p> => Boolean(p?.slug))
        .map((p) => ({ url: `${baseUrl}/programlar/${p.slug}`, lastModified: p.updatedAt ? new Date(p.updatedAt) : now, changeFrequency: 'monthly' as const, priority: 0.8 }));

    let caseStudyUrls: MetadataRoute.Sitemap = [];
    try {
        const caseStudies = await CaseStudyService.getPublishedCaseStudies();
        caseStudyUrls = caseStudies.map((cs) => ({
            url: `${baseUrl}/vaka-calismalari/${cs.slug}`,
            lastModified: cs.updatedAt ? new Date(cs.updatedAt) : now,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }));
    } catch {
        // Fallback gracefully
    }

    let newsUrls: MetadataRoute.Sitemap = [];
    try {
        const news = await prisma.news.findMany({
            where: { status: 'PUBLISHED', isArchived: false },
            select: { slug: true, updatedAt: true },
        });
        newsUrls = news.map((item) => ({
            url: `${baseUrl}/haberler/${item.slug}`,
            lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch {
        // Fallback gracefully
    }

    return [...staticUrls, ...programUrls, ...caseStudyUrls, ...newsUrls];
}
