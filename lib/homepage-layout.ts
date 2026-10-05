/**
 * Homepage layout: a design theme plus an ordered list of content blocks.
 * Stored in SiteSetting (published + draft). The default layout reproduces the
 * original homepage exactly (Hero slider + Differences) with no theme overrides.
 */

export type BlockType =
    | 'hero' | 'differences' | 'programs' | 'banner' | 'cta' | 'stats' | 'richText'
    | 'spaces' | 'supports' | 'entrepreneurs' | 'partners' | 'form' | 'gallery' | 'news'
    // Page sections that are part of a specific page
    | 'programsList'
    | 'supportsIntro' | 'supportsGrid' | 'supportsForms' | 'supportsCta'
    | 'spacesIntro' | 'spacesFeatures' | 'spacesFinder' | 'spacesList' | 'spacesForms';

/** Pages whose section order and content can be edited in the design studio. */
export type PageKey = 'home' | 'programlar' | 'destekler' | 'kullanim-alanlari';

export interface BlockStyle {
    background: 'default' | 'muted' | 'contrast' | 'gradient' | 'image';
    backgroundImage?: string | null;
    paddingY: 'none' | 'sm' | 'md' | 'lg';
    align: 'left' | 'center';
}

export interface HomeBlock {
    id: string;
    type: BlockType;
    visible: boolean;
    config: Record<string, unknown>;
    style: BlockStyle;
}

export interface HomeTheme {
    preset: 'original' | 'corporate' | 'minimal' | 'vibrant' | 'warm' | 'custom';
    primary: string | null;
    secondary: string | null;
    fontStyle: 'futuristic' | 'modern' | 'classic';
    radius: 'sharp' | 'rounded' | 'pill';
    density: 'compact' | 'comfortable' | 'spacious';
}

export interface HomeLayout {
    version: 1;
    theme: HomeTheme;
    blocks: HomeBlock[];
    updatedAt?: string;
    updatedBy?: string | null;
}

export const DEFAULT_STYLE: BlockStyle = { background: 'default', backgroundImage: null, paddingY: 'md', align: 'center' };

export const THEME_PRESETS: Record<HomeTheme['preset'], { label: string; description: string; theme: Partial<HomeTheme> }> = {
    original: { label: 'Orijinal', description: 'Sitenin mevcut tasarım dili (değişiklik yok).', theme: { primary: null, secondary: null, fontStyle: 'futuristic', radius: 'rounded', density: 'comfortable' } },
    corporate: { label: 'Kurumsal', description: 'Lacivert ve turkuaz, sade başlıklar.', theme: { primary: '#1e3a8a', secondary: '#0f766e', fontStyle: 'modern', radius: 'rounded', density: 'comfortable' } },
    minimal: { label: 'Minimal', description: 'Siyah-beyaz ağırlıklı, keskin köşeler, ferah boşluklar.', theme: { primary: '#111827', secondary: '#6b7280', fontStyle: 'modern', radius: 'sharp', density: 'spacious' } },
    vibrant: { label: 'Canlı', description: 'Mor ve pembe, yuvarlak hatlar.', theme: { primary: '#7c3aed', secondary: '#ec4899', fontStyle: 'futuristic', radius: 'pill', density: 'comfortable' } },
    warm: { label: 'Sıcak', description: 'Turuncu ve kırmızı, klasik başlıklar.', theme: { primary: '#ea580c', secondary: '#b91c1c', fontStyle: 'classic', radius: 'rounded', density: 'comfortable' } },
    custom: { label: 'Özel', description: 'Renkleri ve yazı stilini kendiniz seçin.', theme: {} },
};

export const DEFAULT_THEME: HomeTheme = { preset: 'original', primary: null, secondary: null, fontStyle: 'futuristic', radius: 'rounded', density: 'comfortable' };

export const BLOCK_LIBRARY: Record<BlockType, { label: string; description: string; defaults: Record<string, unknown>; single?: boolean; pages?: PageKey[]; builtIn?: boolean }> = {
    hero: { label: 'Hero slider', description: 'Ana sayfa banner slaytları (Banner sekmesinden yönetilir).', defaults: {}, single: true, pages: ['home'], builtIn: true },
    differences: { label: 'Farklarımız', description: 'Mevcut "farklarımız" bölümü.', defaults: {}, single: true, pages: ['home'], builtIn: true },
    programs: { label: 'Programlar', description: 'Program kartları (afiş, renk, Başvur / Bilgi Al).', defaults: { title: 'GELİŞİM PROGRAMLARI', subtitle: 'Sana en uygun programı seç ve ekosisteme katıl.', limit: 3 } },
    banner: { label: 'Görselli banner', description: 'Görsel + başlık + metin + buton. Duyuru ve kampanyalar için.', defaults: { title: 'Yeni dönem başvuruları açıldı', text: '', buttonText: 'Detaylı bilgi', buttonLink: '/programlar', imageUrl: '', layout: 'image-right' } },
    cta: { label: 'Çağrı (CTA)', description: 'Renkli kutu, başlık ve iki buton.', defaults: { title: 'Fikrini birlikte büyütelim', text: '', primaryText: 'Başvur', primaryLink: '/basvuru', secondaryText: 'İletişime geç', secondaryLink: '/iletisim' } },
    stats: { label: 'Sayılar', description: 'Kurumsal sayılar (değerleri siz girersiniz).', defaults: { title: '', items: [] } },
    richText: { label: 'Metin', description: 'Başlık ve paragraf metni.', defaults: { title: '', body: '' } },
    spaces: { label: 'Kullanım alanları', description: 'Fotoğraflı alan kartlarından seçki.', defaults: { title: 'Kullanım Alanlarımız', subtitle: 'Stüdyolar, laboratuvarlar ve toplantı alanları.', limit: 3 } },
    supports: { label: 'Destekler', description: 'TEKMER teşvikleri özeti.', defaults: { title: 'TEKMER Avantajları', subtitle: '5746 sayılı Kanun kapsamındaki destekler.', limit: 4 } },
    news: { label: 'Haberler & duyurular', description: 'Son haberler ve duyurular (Haberler ekranından yönetilir).', defaults: { title: 'HABERLER & DUYURULAR', subtitle: 'İKÜANTS TEKMER ekosisteminden son gelişmeler.', limit: 3 } },
    entrepreneurs: { label: 'Girişimciler', description: 'Mevcut girişimciler bölümü.', defaults: {}, single: true, builtIn: true },
    partners: { label: 'Partner logoları', description: 'Mevcut partner logo şeridi.', defaults: {}, single: true, builtIn: true },
    programsList: { label: 'Program kartları', description: 'Programlar sayfasının ana bölümü (başlık + kartlar).', defaults: {}, single: true, pages: ['programlar'], builtIn: true },
    supportsIntro: { label: 'Destekler: giriş', description: 'Sayfa başlığı ve açıklaması.', defaults: {}, single: true, pages: ['destekler'], builtIn: true },
    supportsGrid: { label: 'Destekler: kartlar', description: 'Teşvik kartları ve örnek senaryolar (Destekler ekranından yönetilir).', defaults: {}, single: true, pages: ['destekler'], builtIn: true },
    supportsForms: { label: 'Destekler: formlar', description: 'Bu sayfaya yerleştirilen formlar.', defaults: {}, single: true, pages: ['destekler'], builtIn: true },
    supportsCta: { label: 'Destekler: başvuru çağrısı', description: 'Sayfa sonundaki başvuru kutusu.', defaults: {}, single: true, pages: ['destekler'], builtIn: true },
    spacesIntro: { label: 'Alanlar: giriş', description: 'Sayfa başlığı ve açıklaması.', defaults: {}, single: true, pages: ['kullanim-alanlari'], builtIn: true },
    spacesFeatures: { label: 'Alanlar: özellik şeridi', description: 'İnternet, erişim, donanım kutucukları.', defaults: {}, single: true, pages: ['kullanim-alanlari'], builtIn: true },
    spacesFinder: { label: 'Alanlar: müsait alan bul', description: 'Tarih / saat ile müsaitlik sorgusu.', defaults: {}, single: true, pages: ['kullanim-alanlari'], builtIn: true },
    spacesList: { label: 'Alanlar: kategorili liste', description: 'Fotoğraflı alan kartları (Alanlar ekranından yönetilir).', defaults: {}, single: true, pages: ['kullanim-alanlari'], builtIn: true },
    spacesForms: { label: 'Alanlar: formlar', description: 'Bu sayfaya yerleştirilen formlar.', defaults: {}, single: true, pages: ['kullanim-alanlari'], builtIn: true },
    form: { label: 'Form', description: 'Form Merkezi\'nden yayındaki bir formu gömün.', defaults: { title: '', description: '', formSlug: '' } },
    gallery: { label: 'Görsel galerisi', description: 'Fotoğraf ızgarası.', defaults: { title: '', images: [] } },
};

/**
 * Editable texts of a page's own sections. An empty value shows the original text, so a
 * page looks exactly as designed until an editor overrides a field in the design studio.
 */
export type PageTextField = { field: string; label: string; original: string; multiline?: boolean; link?: boolean };
export const PAGE_TEXTS: Partial<Record<BlockType, PageTextField[]>> = {
    programsList: [
        { field: 'eyebrow', label: 'Üst etiket', original: '// PROGRAMLARIMIZ' },
        { field: 'title', label: 'Başlık', original: 'GELİŞİM PROGRAMLARI' },
        { field: 'subtitle', label: 'Açıklama', original: 'Fikirden ürüne, girişimden başarıya uzanan yolculuğunda yanındayız. Sana en uygun programı seç ve ekosisteme katıl.', multiline: true },
    ],
    supportsIntro: [
        { field: 'eyebrow', label: 'Üst etiket', original: 'AVANTAJLAR & TEŞVİKLER' },
        { field: 'title', label: 'Başlık', original: 'TEKMER Avantajları ve Destekler' },
        { field: 'text', label: 'Açıklama', original: 'İKÜANTS TEKMER bünyesinde yer alan firmalar, 5746 sayılı Kanun kapsamında sağlanan birçok vergi avantajı ve devlet desteğinden yararlanma imkanına sahiptir.', multiline: true },
        { field: 'note', label: 'Dipnot', original: '* Bu teşvikler 5746 sayılı Kanun kapsamındaki projeler için geçerlidir. Güncel oran ve tutarlar için mevzuatı ve ekibimizi esas alın.', multiline: true },
    ],
    supportsCta: [
        { field: 'title', label: 'Başlık', original: 'Bu Avantajlardan Yararlanmak İçin Hemen Başvurun' },
        { field: 'text', label: 'Metin', original: "Projenizi hayata geçirirken İKÜANTS TEKMER'in sunduğu finansal ve operasyonel desteklerden faydalanın.", multiline: true },
        { field: 'primaryText', label: 'Ana buton', original: 'Başvuru Yap' },
        { field: 'primaryLink', label: 'Ana buton linki', original: '/basvuru', link: true },
        { field: 'secondaryText', label: 'İkinci buton (iletişim formu)', original: 'Uzmanımızla görüşün' },
    ],
    spacesIntro: [
        { field: 'eyebrow', label: 'Üst etiket', original: 'ORTAK ALANLAR & TESİSLER' },
        { field: 'title', label: 'Başlık', original: 'Kullanım Alanları & Rezervasyon' },
        { field: 'text', label: 'Açıklama', original: 'İKÜANTS TEKMER stüdyoları, laboratuvarları ve ortak toplantı masaları tek bir platformda. Müsaitlik durumunu anlık kontrol edin ve rezervasyon talebinizi doğrudan oluşturun.', multiline: true },
    ],
};

/** Text of a page section field: the editor's value, else the original text. */
export function pageText(type: BlockType, config: Record<string, unknown> | undefined, field: string): string {
    const v = config?.[field];
    if (typeof v === 'string' && v.trim()) return v;
    return PAGE_TEXTS[type]?.find((f) => f.field === field)?.original ?? '';
}

const blk = (type: BlockType): HomeBlock => ({ id: type, type, visible: true, config: { ...BLOCK_LIBRARY[type].defaults }, style: DEFAULT_STYLE });

export const PAGE_DEFS: Record<PageKey, { label: string; path: string; defaults: BlockType[] }> = {
    home: { label: 'Ana sayfa', path: '/', defaults: ['hero', 'differences', 'news'] },
    programlar: { label: 'Programlar', path: '/programlar', defaults: ['programsList'] },
    destekler: { label: 'Destekler', path: '/destekler', defaults: ['supportsIntro', 'supportsGrid', 'supportsForms', 'supportsCta'] },
    'kullanim-alanlari': { label: 'Kullanım alanları', path: '/kullanim-alanlari', defaults: ['spacesIntro', 'spacesFeatures', 'spacesFinder', 'spacesList', 'spacesForms'] },
};
export const PAGE_KEYS = Object.keys(PAGE_DEFS) as PageKey[];
export const isPageKey = (v: unknown): v is PageKey => typeof v === 'string' && v in PAGE_DEFS;

/** Default layout of a page: its original sections in their original order (home also lists the latest news), no theme overrides. */
export function defaultLayout(page: PageKey): HomeLayout {
    return { version: 1, theme: DEFAULT_THEME, blocks: PAGE_DEFS[page].defaults.map(blk) };
}

/** Block types that may appear on a page. */
export function blockAllowed(type: BlockType, page: PageKey): boolean {
    const def = BLOCK_LIBRARY[type];
    return !def.pages || def.pages.includes(page);
}

export const DEFAULT_LAYOUT: HomeLayout = defaultLayout('home');

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
/** Internal paths or http(s) URLs only. */
const safeLink = (v: unknown) => {
    const s = str(v, 300).trim();
    return s.startsWith('/') || /^https?:\/\//i.test(s) ? s : '';
};

function sanitizeConfig(type: BlockType, raw: Record<string, unknown>): Record<string, unknown> {
    const c = raw || {};
    switch (type) {
        case 'programs':
        case 'spaces':
        case 'supports':
        case 'news':
            return { title: str(c.title, 120), subtitle: str(c.subtitle, 300), limit: Math.min(12, Math.max(1, Number(c.limit) || 3)) };
        case 'banner':
            return { title: str(c.title, 160), text: str(c.text, 800), buttonText: str(c.buttonText, 60), buttonLink: safeLink(c.buttonLink), imageUrl: safeLink(c.imageUrl), layout: oneOf(c.layout, ['image-left', 'image-right', 'full'] as const, 'image-right'), accent: HEX.test(str(c.accent)) ? str(c.accent) : '' };
        case 'cta':
            return { title: str(c.title, 160), text: str(c.text, 600), primaryText: str(c.primaryText, 60), primaryLink: safeLink(c.primaryLink), secondaryText: str(c.secondaryText, 60), secondaryLink: safeLink(c.secondaryLink) };
        case 'stats':
            return { title: str(c.title, 120), items: (Array.isArray(c.items) ? c.items : []).slice(0, 8).map((i) => ({ value: str((i as Record<string, unknown>).value, 30), label: str((i as Record<string, unknown>).label, 60) })).filter((i) => i.value || i.label) };
        case 'richText':
            return { title: str(c.title, 160), body: str(c.body, 5000) };
        case 'form':
            return { title: str(c.title, 160), description: str(c.description, 400), formSlug: str(c.formSlug, 120).replace(/[^a-z0-9-]/g, '') };
        case 'gallery':
            return { title: str(c.title, 120), images: (Array.isArray(c.images) ? c.images : []).slice(0, 24).map((i) => ({ url: safeLink((i as Record<string, unknown>).url), caption: str((i as Record<string, unknown>).caption, 160) })).filter((i) => i.url) };
        default: {
            const fields = PAGE_TEXTS[type];
            if (!fields) return {};
            const out: Record<string, string> = {};
            for (const f of fields) {
                const v = f.link ? safeLink(c[f.field]) : str(c[f.field], f.multiline ? 1200 : 200).trim();
                if (v) out[f.field] = v;
            }
            return out;
        }
    }
}

/** Validates a layout coming from the admin editor; unknown fields and unsafe links are dropped. */
export function sanitizeLayout(input: unknown, page: PageKey = 'home'): HomeLayout {
    const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const t = (raw.theme && typeof raw.theme === 'object' ? raw.theme : {}) as Record<string, unknown>;
    const theme: HomeTheme = {
        preset: oneOf(t.preset, Object.keys(THEME_PRESETS) as HomeTheme['preset'][], 'original'),
        primary: HEX.test(str(t.primary)) ? str(t.primary) : null,
        secondary: HEX.test(str(t.secondary)) ? str(t.secondary) : null,
        fontStyle: oneOf(t.fontStyle, ['futuristic', 'modern', 'classic'] as const, 'futuristic'),
        radius: oneOf(t.radius, ['sharp', 'rounded', 'pill'] as const, 'rounded'),
        density: oneOf(t.density, ['compact', 'comfortable', 'spacious'] as const, 'comfortable'),
    };
    const seen = new Set<string>();
    const blocks: HomeBlock[] = (Array.isArray(raw.blocks) ? raw.blocks : [])
        .slice(0, 40)
        .map((b) => b as Record<string, unknown>)
        .filter((b) => typeof b.type === 'string' && b.type in BLOCK_LIBRARY && blockAllowed(b.type as BlockType, page))
        .filter((b) => {
            const type = b.type as BlockType;
            if (!BLOCK_LIBRARY[type].single) return true;
            if (seen.has(type)) return false;
            seen.add(type);
            return true;
        })
        .map((b, i) => {
            const type = b.type as BlockType;
            const s = (b.style && typeof b.style === 'object' ? b.style : {}) as Record<string, unknown>;
            return {
                id: str(b.id, 40).replace(/[^\w-]/g, '') || `${type}-${i}`,
                type,
                visible: b.visible !== false,
                config: sanitizeConfig(type, (b.config || {}) as Record<string, unknown>),
                style: {
                    background: oneOf(s.background, ['default', 'muted', 'contrast', 'gradient', 'image'] as const, 'default'),
                    backgroundImage: safeLink(s.backgroundImage) || null,
                    paddingY: oneOf(s.paddingY, ['none', 'sm', 'md', 'lg'] as const, 'md'),
                    align: oneOf(s.align, ['left', 'center'] as const, 'center'),
                },
            };
        });
    return { version: 1, theme, blocks };
}

/** CSS variable overrides for the homepage wrapper; the original preset changes nothing. */
export function themeVariables(theme: HomeTheme): Record<string, string> {
    const preset = THEME_PRESETS[theme.preset]?.theme || {};
    const primary = theme.primary || (preset.primary as string | null | undefined) || null;
    const secondary = theme.secondary || (preset.secondary as string | null | undefined) || null;
    const vars: Record<string, string> = {};
    if (primary) vars['--primary'] = primary;
    if (secondary) vars['--secondary'] = secondary;
    if (theme.fontStyle === 'modern') vars['--font-orbitron'] = 'var(--font-inter), Inter, system-ui, sans-serif';
    if (theme.fontStyle === 'classic') vars['--font-orbitron'] = 'Georgia, "Times New Roman", serif';
    return vars;
}
