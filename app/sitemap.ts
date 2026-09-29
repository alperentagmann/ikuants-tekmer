import { MetadataRoute } from 'next';
import { EntrepreneurService } from '@/lib/services/entrepreneur-service';
import { MentorService } from '@/lib/services/mentor-service';
import { CaseStudyService } from '@/lib/services/case-study-service';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://ikuantstekmer.com';

    let entrepreneurUrls: MetadataRoute.Sitemap = [];
    let mentorUrls: MetadataRoute.Sitemap = [];
    let caseStudyUrls: MetadataRoute.Sitemap = [];
    let newsUrls: MetadataRoute.Sitemap = [];
    let programUrls: MetadataRoute.Sitemap = [];

    try {
        const publicEntrepreneurs = await EntrepreneurService.getPublicEntrepreneurs();
        entrepreneurUrls = publicEntrepreneurs.map((ent) => ({
            url: `${baseUrl}/girisimciler#${ent.id}`,
            lastModified: ent.updatedAt ? new Date(ent.updatedAt) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch {
        // Fallback gracefully
    }

    try {
        const publicMentors = await MentorService.getPublicMentors();
        mentorUrls = publicMentors.map((mentor) => ({
            url: `${baseUrl}/mentorler#${mentor.id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch {
        // Fallback gracefully
    }

    try {
        const caseStudies = await CaseStudyService.getPublishedCaseStudies();
        caseStudyUrls = caseStudies.map((cs) => ({
            url: `${baseUrl}/vaka-calismalari/${cs.slug}`,
            lastModified: cs.updatedAt ? new Date(cs.updatedAt) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }));
    } catch {
        // Fallback gracefully
    }

    try {
        const news = await prisma.news.findMany({
            where: { status: 'PUBLISHED' },
            select: { slug: true, updatedAt: true },
        });
        newsUrls = news.map((item) => ({
            url: `${baseUrl}/haberler/${item.slug}`,
            lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch {
        // Fallback gracefully
    }

    try {
        const programs = await prisma.program.findMany({
            where: { isArchived: false },
            select: { id: true, name: true, updatedAt: true },
        });
        programUrls = programs.map((prog) => ({
            url: `${baseUrl}/programlar#${prog.id}`,
            lastModified: prog.updatedAt ? new Date(prog.updatedAt) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }));
    } catch {
        // Fallback gracefully
    }

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/girisimciler`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/mentorler`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/programlar`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/haberler`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/vaka-calismalari`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/sss`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/hakkimizda`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/hizmetler`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/iletisim`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/gizlilik-politikasi`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ];

    return [...staticRoutes, ...programUrls, ...caseStudyUrls, ...newsUrls, ...entrepreneurUrls, ...mentorUrls];
}
