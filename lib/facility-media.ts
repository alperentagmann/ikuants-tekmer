/** Facility photos: a cover image plus an ordered gallery of { url, caption }. */
export type GalleryImage = { url: string; caption: string | null };

export function parseGallery(raw: string | null | undefined): GalleryImage[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((g) => (typeof g === 'string' ? { url: g, caption: null } : g && typeof g.url === 'string' ? { url: g.url, caption: typeof g.caption === 'string' ? g.caption : null } : null))
            .filter((g): g is GalleryImage => Boolean(g && g.url));
    } catch {
        return [];
    }
}

export function serializeGallery(input: unknown): string | null {
    if (!Array.isArray(input)) return null;
    const clean = input
        .map((g) => (typeof g === 'string' ? { url: g, caption: null } : g && typeof g === 'object' && typeof (g as GalleryImage).url === 'string' ? { url: (g as GalleryImage).url, caption: (g as GalleryImage).caption ? String((g as GalleryImage).caption).slice(0, 200) : null } : null))
        .filter((g): g is GalleryImage => Boolean(g && g.url.trim()))
        .slice(0, 30)
        .map((g) => ({ url: g.url.trim().slice(0, 500), caption: g.caption }));
    return clean.length ? JSON.stringify(clean) : null;
}

/** Public page groups: studios, labs, machine park (laser / SMT / 3D), meeting spaces, events, work areas. */
export const SPACE_GROUPS: { key: string; title: string; description: string; types: string[] }[] = [
    { key: 'studios', title: 'Stüdyolar', description: 'Yayın, çekim ve AR/VR prodüksiyonu için donanımlı stüdyolar.', types: ['STUDIO'] },
    { key: 'labs', title: 'Laboratuvarlar', description: 'Prototip geliştirme ve teknik çalışmalar için laboratuvar alanları.', types: ['LAB'] },
    { key: 'laser', title: 'Lazer Kesim', description: 'Lazer kesim ve hizalama makineleri. Ücretli; rezervasyondan sonra fiyat teklifi isteyin.', types: ['MACHINE_LASER'] },
    { key: 'smt', title: 'Elektronik Dizgi (SMT)', description: 'Lehim pastası baskı, otomatik dizgi ve reflow ile PCB üretimi. Ücretli; fiyat teklifi ile.', types: ['MACHINE_SMT'] },
    { key: 'printing3d', title: '3D Baskı', description: 'Çift nozullu FDM 3D yazıcı ile prototip ve fonksiyonel parça. Ücretli; fiyat teklifi ile.', types: ['MACHINE_3D'] },
    { key: 'meeting', title: 'Toplantı Odaları ve Masaları', description: 'Ekip toplantıları, görüşmeler ve yatırımcı sunumları için kapalı oda ve açık masalar.', types: ['MEETING_ROOM', 'OPEN_MEETING_TABLE'] },
    { key: 'events', title: 'Seminer ve Etkinlik Alanları', description: 'Eğitim, seminer ve sunumlar için geniş alanlar.', types: ['SEMINAR_AREA'] },
    { key: 'work', title: 'Çalışma Alanları', description: 'Ofisler, ortak masalar ve çalışma alanları.', types: ['OFFICE', 'SHARED_DESK', 'WORK_AREA', 'FEATURE'] },
];

export function spaceGroupKey(type: string | null | undefined): string {
    return SPACE_GROUPS.find((g) => g.types.includes(String(type || '').toUpperCase()))?.key || 'work';
}
