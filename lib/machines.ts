/**
 * Machine park (paid equipment): laser cutting, electronics assembly (SMT) and 3D printing.
 * Machines are Facility records (facilityType MACHINE_*) so they reuse availability, reservations
 * and the admin space screens. Pricing and the machine list live in featuresJson.
 * Technical values are recorded only from a cited source; unknown values stay null.
 */

export const MACHINE_TYPES = ['MACHINE_LASER', 'MACHINE_SMT', 'MACHINE_3D'] as const;
export type MachineType = (typeof MACHINE_TYPES)[number];

export const MACHINE_QUOTE_FORM_SLUG = 'makine-fiyat-teklifi';

export type PricingModel = 'FREE' | 'QUOTE' | 'HOURLY';

export interface FacilityPricing {
    model: PricingModel;
    /** Hourly price excluding VAT; null until the tariff is published. */
    hourlyRate: number | null;
    currency: 'TRY';
    note: string | null;
}

export interface MachineSpec {
    label: string;
    value: string;
}

export interface MachineInfo {
    name: string;
    role: string | null;
    specs: MachineSpec[];
    sourceUrl: string | null;
}

export function isMachineType(type: string | null | undefined): boolean {
    return MACHINE_TYPES.includes(String(type || '').toUpperCase() as MachineType);
}

export function isMachineFacility(f: { facilityType: string | null }): boolean {
    return isMachineType(f.facilityType);
}

function parseFeatures(featuresJson: string | null | undefined): Record<string, unknown> {
    try {
        const v = featuresJson ? JSON.parse(featuresJson) : {};
        return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    } catch {
        return {};
    }
}

/** Meeting rooms and shared spaces are free; machines default to "price on request". */
export function facilityPricing(f: { facilityType: string | null; featuresJson: string | null }): FacilityPricing {
    const raw = parseFeatures(f.featuresJson).pricing as Record<string, unknown> | undefined;
    const fallback: PricingModel = isMachineFacility(f) ? 'QUOTE' : 'FREE';
    const model = (['FREE', 'QUOTE', 'HOURLY'] as const).find((m) => m === raw?.model) || fallback;
    const rate = typeof raw?.hourlyRate === 'number' && raw.hourlyRate > 0 ? raw.hourlyRate : null;
    return { model, hourlyRate: model === 'HOURLY' ? rate : null, currency: 'TRY', note: typeof raw?.note === 'string' && raw.note.trim() ? raw.note.trim() : null };
}

export function facilityMachines(f: { featuresJson: string | null }): MachineInfo[] {
    const list = parseFeatures(f.featuresJson).machines;
    if (!Array.isArray(list)) return [];
    return list
        .map((m) => (m && typeof m === 'object' ? (m as Record<string, unknown>) : null))
        .filter((m): m is Record<string, unknown> => Boolean(m && typeof m.name === 'string' && m.name.trim()))
        .map((m) => ({
            name: String(m.name).trim(),
            role: typeof m.role === 'string' && m.role.trim() ? m.role.trim() : null,
            specs: (Array.isArray(m.specs) ? m.specs : [])
                .map((s) => s as Record<string, unknown>)
                .filter((s) => typeof s?.label === 'string' && typeof s?.value === 'string' && String(s.value).trim())
                .map((s) => ({ label: String(s.label), value: String(s.value) })),
            sourceUrl: typeof m.sourceUrl === 'string' && /^https?:\/\//.test(m.sourceUrl) ? m.sourceUrl : null,
        }));
}

/** Validates pricing sent from the admin screen. */
export function sanitizePricing(input: unknown): FacilityPricing {
    const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const model = (['FREE', 'QUOTE', 'HOURLY'] as const).find((m) => m === r.model) || 'FREE';
    const rate = Number(r.hourlyRate);
    return {
        model,
        hourlyRate: model === 'HOURLY' && Number.isFinite(rate) && rate > 0 ? Math.round(rate * 100) / 100 : null,
        currency: 'TRY',
        note: typeof r.note === 'string' && r.note.trim() ? r.note.trim().slice(0, 300) : null,
    };
}

/** Validates the machine list sent from the admin screen. */
export function sanitizeMachines(input: unknown): MachineInfo[] {
    return facilityMachines({ featuresJson: JSON.stringify({ machines: Array.isArray(input) ? input.slice(0, 20) : [] }) }).map((m) => ({
        name: m.name.slice(0, 120),
        role: m.role ? m.role.slice(0, 120) : null,
        specs: m.specs.slice(0, 20).map((s) => ({ label: s.label.slice(0, 60), value: s.value.slice(0, 200) })),
        sourceUrl: m.sourceUrl,
    }));
}

export function pricingLabel(p: FacilityPricing): string {
    if (p.model === 'FREE') return 'Ücretsiz';
    if (p.model === 'HOURLY' && p.hourlyRate) return `${p.hourlyRate.toLocaleString('tr-TR')} ₺ / saat (KDV hariç)`;
    return 'Ücretli · fiyat teklifi ile';
}

/**
 * Initial machine records (created once, never overwritten). Specs were taken from the
 * manufacturer / reseller pages listed in sourceUrl. The laser machines' model details are
 * not published, so their specs stay empty until an admin enters them.
 */
export const MACHINE_SEEDS: { title: string; code: string; type: MachineType; description: string; machines: MachineInfo[] }[] = [
    {
        title: 'Lazer Kesim Atölyesi',
        code: 'MACHINE-LASER-01',
        type: 'MACHINE_LASER',
        description: 'Prototip ve küçük seri üretim için lazer kesim ve hizalama makineleri. Rezervasyon talebinden sonra iş detaylarınızla fiyat teklifi isteyebilirsiniz.',
        machines: [
            { name: 'Lazerpol Lazer Kesim Makinesi', role: 'Lazer kesim', specs: [], sourceUrl: null },
            { name: 'EBH Lazer Kesim ve Hizalama Makinesi', role: 'Lazer kesim ve hizalama', specs: [], sourceUrl: null },
        ],
    },
    {
        title: 'Elektronik Dizgi (SMT) Hattı',
        code: 'MACHINE-SMT-01',
        type: 'MACHINE_SMT',
        description: 'Baskı devre kartı (PCB) dizgisi için lehim pastası baskı, otomatik dizgi (pick & place) ve reflow fırını. Prototip ve küçük seri kart üretimine uygundur.',
        machines: [
            { name: 'Solder Paste Printer', role: 'Lehim pastası baskı', specs: [], sourceUrl: null },
            {
                name: 'NeoDen YY1 Pick and Place',
                role: 'Otomatik dizgi',
                specs: [
                    { label: 'Kafa', value: 'Tek gantry, 2 kafa' },
                    { label: 'Dizgi hızı', value: '3.000 CPH (görüntü açık) / 4.000 CPH (görüntü kapalı)' },
                    { label: 'Hassasiyet', value: '±0,02 mm' },
                    { label: 'Komponent', value: '0201 – 18×18 mm, en fazla 12 mm yükseklik' },
                    { label: 'Besleyici', value: '52 adet 8 mm bant besleyici' },
                    { label: 'PCB', value: 'En fazla 315×350 mm (tek taraf besleyici)' },
                ],
                sourceUrl: 'https://uelectronics.com/wp-content/uploads/2024/06/User-Manual-NeoDen-YY1-PNP-machine.pdf',
            },
            {
                name: 'T-937M Reflow Fırını',
                role: 'Reflow lehimleme',
                specs: [
                    { label: 'Güç', value: '3300 W' },
                    { label: 'Lehimleme alanı', value: '290×375 mm (kurşunsuz) / 315×375 mm (kurşunlu)' },
                ],
                sourceUrl: 'https://eevblog.com/forum/reviews/puhui-t-937m-experience',
            },
        ],
    },
    {
        title: '3D Baskı — Bambu Lab H2D',
        code: 'MACHINE-3D-01',
        type: 'MACHINE_3D',
        description: 'Çift nozullu, ısıtmalı hazneli FDM 3D yazıcı. Mühendislik filamentleriyle prototip ve fonksiyonel parça üretimi.',
        machines: [
            {
                name: 'Bambu Lab H2D',
                role: 'FDM 3D baskı (çift nozul)',
                specs: [
                    { label: 'Baskı hacmi', value: 'Tek nozul 325×320×325 mm · çift nozul 300×320×325 mm · toplam 350×320×325 mm' },
                    { label: 'Nozul sıcaklığı', value: 'En fazla 350 °C' },
                    { label: 'Tabla sıcaklığı', value: 'En fazla 120 °C' },
                    { label: 'Hazne', value: 'Aktif ısıtmalı, 65 °C' },
                    { label: 'Nozul çapları', value: '0,2 / 0,4 / 0,6 / 0,8 mm' },
                ],
                sourceUrl: 'https://core-electronics.com.au/bambu-lab-h2d-3d-printer-machine-only.html',
            },
        ],
    },
];
