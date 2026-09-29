import { MetadataRoute } from 'next';
import { EntrepreneurService } from '@/lib/services/entrepreneur-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ikuantstekmer.com';

    let entrepreneurUrls: MetadataRoute.Sitemap = [];

    try {
        const publicEntrepreneurs = await EntrepreneurService.getPublicEntrepreneurs();
        entrepreneurUrls = publicEntrepreneurs.map((ent) => ({
            url: `${baseUrl}/girisimciler#${ent.id}`,
            lastModified: ent.updatedAt ? new Date(ent.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
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
    ];

    return [...staticRoutes, ...entrepreneurUrls];
}
