/**
 * Public site settings: one key set edited in Admin › Site Ayarları and read by the public site.
 * Defaults reproduce the texts the site already showed, so an empty database changes nothing.
 * The designer credit is fixed in code and cannot be edited or removed from the admin panel.
 */

export const DESIGN_CREDIT = 'Design By Alperen Tağman';

export interface CookieSettings {
    enabled: boolean;
    title: string;
    text: string;
    acceptText: string;
    rejectText: string;
    settingsText: string;
    policyUrl: string;
    version: string;
}

export type SuccessAnimationStyle = 'rocket' | 'confetti' | 'check';
export type MotionLevel = 'full' | 'reduced' | 'off';

export interface AnimationSettings {
    /** Site-wide motion: full, reduced (no large movement) or off. Visitors' reduced-motion preference always wins. */
    motion: MotionLevel;
    successEnabled: boolean;
    successStyle: SuccessAnimationStyle;
    successTitle: string;
    successText: string;
    /** Seconds the celebration stays on screen (2–10). */
    successSeconds: number;
}

export interface PublicSettings {
    siteName: string;
    siteTitle: string;
    siteDesc: string;
    phone: string;
    email: string;
    contactEmail: string;
    address: string;
    workingHours: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
    youtube: string;
    x: string;
    logoUrl: string;
    footerText: string;
    copyright: string;
    cookie: CookieSettings;
    cookiePolicy: string;
    animation: AnimationSettings;
}

export const DEFAULT_COOKIE_POLICY = `Bu web sitesi yalnızca sitenin çalışması için gerekli çerezleri ve benzeri tarayıcı depolama alanlarını kullanır.

Zorunlu çerezler
• Çerez tercihiniz: Bu bildirimde yaptığınız seçimi hatırlamak için tarayıcınızda saklanır.
• Oturum çerezi: Yalnızca yönetim paneline giriş yapan yetkili kullanıcılar için oluşturulur; ziyaretçiler için kullanılmaz.
• Tema tercihi: Açık / koyu görünüm seçiminiz tarayıcınızda saklanır.

Analiz ve pazarlama çerezleri
Sitede şu anda üçüncü taraf analiz veya reklam çerezi kullanılmamaktadır. Bu tür bir hizmet eklendiğinde yalnızca onay vermeniz hâlinde etkinleştirilir ve bu metin güncellenir.

Tercihinizi değiştirmek için sayfanın altındaki "Çerez tercihleri" bağlantısını kullanabilirsiniz. Kişisel verilerinizin işlenmesine ilişkin ayrıntılar için KVKK Aydınlatma Metni'ni inceleyebilirsiniz.`;

const DEFAULTS = {
    site_name: 'İKÜANTS TEKMER',
    site_title: 'İKÜANTS TEKMER — Girişimcilik & İnovasyon Merkezi',
    site_desc: 'Girişimcilik ve teknoloji geliştirme merkezi. Yenilikçi iş fikirlerini geleceğe taşıyoruz.',
    site_phone: '(0212) 498 41 62',
    site_email: 'bilgi@ikuantstekmer.com',
    contact_email: 'info@ikuantstekmer.com',
    contact_address: 'Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14 A Bakırköy 34158 İstanbul',
    contact_hours: 'Pazartesi - Cuma: 09:00 - 18:00',
    social_instagram: 'https://www.instagram.com/ikuantstekmer/',
    social_linkedin: 'https://www.linkedin.com/company/ikuants-tekmer/',
    social_whatsapp: 'https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz',
    social_youtube: '',
    social_x: '',
    brand_logo_url: '/logo.png',
    footer_text: 'İKÜANTS Teknoloji Geliştirme Merkezi. Girişimciler için tasarlanmış inovasyon ekosistemi.',
    footer_copyright: 'Copyright {yıl} İKÜANTS TEKMER',
    cookie_enabled: 'true',
    cookie_title: 'Çerez kullanımı',
    cookie_text: 'Sitemizin düzgün çalışması için zorunlu çerezler kullanıyoruz. Analiz veya pazarlama çerezleri yalnızca onayınızla etkinleştirilir.',
    cookie_accept_text: 'Kabul et',
    cookie_reject_text: 'Sadece zorunlu',
    cookie_settings_text: 'Tercihler',
    cookie_policy_url: '/cerez-politikasi',
    cookie_version: '1',
    animation_motion: 'full',
    animation_success_enabled: 'true',
    animation_success_style: 'rocket',
    animation_success_title: 'Başarıyla alınmıştır!',
    animation_success_text: 'Talebiniz bize ulaştı. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
    animation_success_seconds: '4',
} as const;

export type SettingKey = keyof typeof DEFAULTS;
export const SETTING_DEFAULTS: Record<SettingKey, string> = DEFAULTS;

/** Keys editable from the admin settings screen (all public). */
export const EDITABLE_PUBLIC_KEYS = Object.keys(DEFAULTS) as SettingKey[];

/** Older dotted keys that may still exist in some databases. */
const LEGACY: Partial<Record<SettingKey, string>> = {
    site_name: 'site.name', site_title: 'site.title', site_desc: 'site.desc', site_phone: 'contact.phone', site_email: 'contact.email',
    contact_address: 'contact.address', social_instagram: 'social.instagram', social_linkedin: 'social.linkedin', social_whatsapp: 'social.whatsapp',
    brand_logo_url: 'brand.logo_url', footer_text: 'footer.text', footer_copyright: 'footer.copyright',
};

/** Removes any designer credit typed into the editable copyright (the credit is rendered separately). */
export function stripCredit(text: string): string {
    return text.replace(/\s*[|·\-–—]?\s*design(ed)?\s*by\s*alperen\s*ta[ğg]man\.?/gi, '').trim();
}

export function resolvePublicSettings(raw: Record<string, string>): PublicSettings {
    const get = (k: SettingKey) => {
        const v = raw[k] ?? (LEGACY[k] ? raw[LEGACY[k] as string] : undefined);
        return typeof v === 'string' && v.trim() !== '' ? v : DEFAULTS[k];
    };
    const optional = (k: SettingKey) => {
        const v = raw[k];
        return typeof v === 'string' ? v.trim() : DEFAULTS[k];
    };
    return {
        siteName: get('site_name'),
        siteTitle: get('site_title'),
        siteDesc: get('site_desc'),
        phone: get('site_phone'),
        email: get('site_email'),
        contactEmail: get('contact_email'),
        address: get('contact_address'),
        workingHours: get('contact_hours'),
        instagram: optional('social_instagram'),
        linkedin: optional('social_linkedin'),
        whatsapp: optional('social_whatsapp'),
        youtube: optional('social_youtube'),
        x: optional('social_x'),
        logoUrl: get('brand_logo_url'),
        footerText: get('footer_text'),
        // {yıl} is replaced with the current year so the notice stays current without edits
        copyright: (stripCredit(get('footer_copyright')) || DEFAULTS.footer_copyright).replace(/\{y[ıi]l\}/gi, String(new Date().getFullYear())),
        cookie: {
            enabled: get('cookie_enabled') !== 'false',
            title: get('cookie_title'),
            text: get('cookie_text'),
            acceptText: get('cookie_accept_text'),
            rejectText: get('cookie_reject_text'),
            settingsText: get('cookie_settings_text'),
            policyUrl: get('cookie_policy_url'),
            version: get('cookie_version'),
        },
        cookiePolicy: raw.cookie_policy_text?.trim() ? raw.cookie_policy_text : DEFAULT_COOKIE_POLICY,
        animation: {
            motion: (['full', 'reduced', 'off'] as const).find((m) => m === get('animation_motion')) || 'full',
            successEnabled: get('animation_success_enabled') !== 'false',
            successStyle: (['rocket', 'confetti', 'check'] as const).find((m) => m === get('animation_success_style')) || 'rocket',
            successTitle: get('animation_success_title'),
            successText: get('animation_success_text'),
            successSeconds: Math.min(10, Math.max(2, Number(get('animation_success_seconds')) || 4)),
        },
    };
}
