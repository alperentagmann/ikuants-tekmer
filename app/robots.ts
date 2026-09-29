import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://ikuantstekmer.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin',
                    '/admin/*',
                    '/api/admin',
                    '/api/admin/*',
                    '/api/auth/*',
                    '/private/*',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
