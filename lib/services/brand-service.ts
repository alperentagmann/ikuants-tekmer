import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface BrandSettings {
    institutionName: string;
    tagline: string;
    logoUrl: string;
    adminLogoUrl: string;
    faviconUrl: string;
    accentColor: string;
    loginBackgroundUrl: string;
    loginWelcomeTitle: string;
    loginWelcomeSubtitle: string;
    footerText: string;
}

const DEFAULT_BRAND_SETTINGS: BrandSettings = {
    institutionName: 'İKÜANTS TEKMER',
    tagline: 'Teknoloji Geliştirme ve Girişimcilik Merkezi',
    logoUrl: '/images/ikuants-logo.png',
    adminLogoUrl: '/images/ikuants-admin-logo.png',
    faviconUrl: '/favicon.ico',
    accentColor: '#6366f1',
    loginBackgroundUrl: '/images/hero-bg.jpg',
    loginWelcomeTitle: 'İKÜANTS TEKMER Portalı',
    loginWelcomeSubtitle: 'Girişimcilik ve İnovasyon Yönetim Paneli',
    footerText: `© ${new Date().getFullYear()} İKÜANTS TEKMER. Tüm Hakları Saklıdır.`,
};

export class BrandService {
    /**
     * Get active brand settings with safe defaults
     */
    static async getBrandSettings(): Promise<BrandSettings> {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: 'brand_settings' },
        });

        if (!setting || !setting.value) {
            return DEFAULT_BRAND_SETTINGS;
        }

        try {
            const parsed = JSON.parse(setting.value);
            return { ...DEFAULT_BRAND_SETTINGS, ...parsed };
        } catch {
            return DEFAULT_BRAND_SETTINGS;
        }
    }

    /**
     * Update brand settings
     */
    static async updateBrandSettings(data: Partial<BrandSettings>, actorId?: string): Promise<BrandSettings> {
        const current = await this.getBrandSettings();
        const updated = { ...current, ...data };

        await prisma.siteSetting.upsert({
            where: { key: 'brand_settings' },
            update: {
                value: JSON.stringify(updated),
                group: 'BRANDING',
            },
            create: {
                key: 'brand_settings',
                value: JSON.stringify(updated),
                group: 'BRANDING',
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'SiteSetting',
            entityId: 'brand_settings',
            diff: `Updated institution brand settings: "${updated.institutionName}"`,
        });

        return updated;
    }
}
