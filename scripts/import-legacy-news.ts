/**
 * Imports the news and announcements of the original website (data/legacy-news.ts) into the
 * database so they are managed from Admin › Haberler.
 *
 * - Missing items are created as PUBLISHED with their original date, category, cover and gallery.
 * - Items created by the old seed with a shortened text are completed (full text, gallery,
 *   excerpt) ONLY if nobody has edited them since (updatedAt == createdAt). Edited items are left
 *   untouched and listed.
 * - Gallery entries are kept only when the image file exists in /public.
 *
 * Dry run by default:   npx tsx scripts/import-legacy-news.ts
 * Apply:                npx tsx scripts/import-legacy-news.ts --apply
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { logAuditEvent } from '../lib/audit';
import { LEGACY_NEWS, type LegacyNewsItem } from '../data/legacy-news';

const MONTHS: Record<string, number> = { ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6, temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12 };

/** "27-28 Kasım 2025" → 2025-11-28 00:00 (Istanbul). The last day of a range is used. */
export function parseTurkishDate(text: string): Date | null {
    const m = text.toLocaleLowerCase('tr-TR').match(/(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s+([a-zçğıöşü]+)\s+(\d{4})/);
    if (!m) return null;
    const month = MONTHS[m[3]];
    if (!month) return null;
    const day = Number(m[2] || m[1]);
    return new Date(`${m[4]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+03:00`);
}

export function slugify(title: string): string {
    const map: Record<string, string> = { ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ş: 's', Ş: 's', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c' };
    return title.replace(/[ıİğĞüÜşŞöÖçÇ]/g, (c) => map[c] || c).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

/** Slugs already used by the old seed for the same articles. */
const KNOWN_SLUGS: Record<string, string> = {
    'ANTSPARK Demoday 2026 Gerçekleştirildi': 'antspark-demoday-2026-gerceklestirildi',
    'İKÜANTS TEKMER Staj Başvuruları Açıldı': 'ikuants-tekmer-staj-basvurulari-acildi',
    'TÜBİTAK Proje Destekleri Eğitimi': 'tubitak-proje-destekleri-egitimi',
};

const slugOf = (n: LegacyNewsItem) => Object.entries(KNOWN_SLUGS).find(([prefix]) => n.title.startsWith(prefix))?.[1] || slugify(n.title);
const exists = (url: string) => fs.existsSync(path.join(process.cwd(), 'public', url.replace(/^\//, '')));

export async function importLegacyNews(apply: boolean) {
    const categories = new Map<string, string>();
    for (const [name, slug, type] of [['Etkinlik', 'etkinlik', 'EVENT'], ['Program', 'program', 'PROGRAM'], ['Duyuru', 'duyuru', 'NEWS']] as const) {
        const c = apply ? await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug, type } }) : await prisma.category.findUnique({ where: { slug } });
        if (c) categories.set(name, c.id);
    }

    const report = { created: [] as string[], completed: [] as string[], skippedEdited: [] as string[], unchanged: [] as string[] };
    for (const n of LEGACY_NEWS) {
        const slug = slugOf(n);
        const gallery = (n.gallery || []).filter(exists);
        const cover = exists(n.image) ? n.image : gallery[0] || null;
        const publishedAt = parseTurkishDate(n.date);
        const existing = await prisma.news.findUnique({ where: { slug } });

        if (!existing) {
            report.created.push(`${slug} (${n.date})`);
            if (apply) {
                const row = await prisma.news.create({
                    data: {
                        title: n.title, slug, excerpt: n.excerpt, content: n.fullContent,
                        coverImage: cover, coverAltText: n.title, gallery: gallery.length ? JSON.stringify(gallery) : null,
                        categoryId: categories.get(n.category) || null, eventDate: n.date, publishedAt,
                        registrationLink: n.registrationLink || null, isFeatured: n.featured, showOnHome: true,
                        status: 'PUBLISHED', approvalStatus: 'APPROVED', author: 'İKÜANTS TEKMER',
                    },
                });
                await logAuditEvent({ action: 'CREATE', entityType: 'News', entityId: row.id, diff: `Eski web sitesinden aktarıldı: ${n.title}` });
            }
            continue;
        }

        const neverEdited = Math.abs(existing.updatedAt.getTime() - existing.createdAt.getTime()) < 5000;
        const shortened = existing.content.length < n.fullContent.length * 0.8 || (!existing.gallery && gallery.length > 0);
        if (!shortened) {
            report.unchanged.push(slug);
            continue;
        }
        if (!neverEdited) {
            report.skippedEdited.push(slug);
            continue;
        }
        report.completed.push(slug);
        if (apply) {
            await prisma.news.update({
                where: { id: existing.id },
                data: { content: n.fullContent, excerpt: n.excerpt, gallery: gallery.length ? JSON.stringify(gallery) : existing.gallery, coverAltText: existing.coverAltText || n.title },
            });
            await logAuditEvent({ action: 'UPDATE', entityType: 'News', entityId: existing.id, diff: `Kısaltılmış metin, eski web sitesindeki tam metin ve galeriyle tamamlandı: ${n.title}` });
        }
    }

    return report;
}

async function main() {
    const apply = process.argv.includes('--apply');
    console.log(JSON.stringify(await importLegacyNews(apply), null, 2));
    if (!apply) console.log('Dry run. Re-run with --apply to write these changes.');
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error(e);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}
