import { NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/setting-service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await SettingService.getPublicSettings();
        return NextResponse.json({
            success: true,
            settings: {
                siteName: settings['site.name'] || 'İKÜANTS TEKMER',
                siteTitle: settings['site.title'] || 'İKÜANTS TEKMER — Girişimcilik & İnovasyon Merkezi',
                siteDesc: settings['site.desc'] || 'Girişimcilik ve teknoloji geliştirme merkezi. Yenilikçi iş fikirlerini geleceğe taşıyoruz.',
                phone: settings['contact.phone'] || '(0212) 498 41 62',
                email: settings['contact.email'] || 'bilgi@ikuantstekmer.com',
                address: settings['contact.address'] || 'Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14 A Bakırköy 34158 İstanbul',
                instagram: settings['social.instagram'] || 'https://www.instagram.com/ikuantstekmer/',
                linkedin: settings['social.linkedin'] || 'https://www.linkedin.com/company/ikuants-tekmer/',
                whatsapp: settings['social.whatsapp'] || 'https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz',
                logoUrl: settings['brand.logo_url'] || '/logo.png',
                footerText: settings['footer.text'] || 'İKÜANTS Teknoloji Geliştirme Merkezi. Girişimciler için tasarlanmış inovasyon ekosistemi.',
                copyright: settings['footer.copyright'] || 'Copyright 2025 İKÜANTS TEKMER | Design By Alperen Tağman.',
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
