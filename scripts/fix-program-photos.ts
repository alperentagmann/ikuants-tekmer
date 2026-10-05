/**
 * The banner photo stored on ANTSFire (/images/hero-slide-4.jpg) is an ANTSPARK event photo.
 * Moves it to ANTSPARK and fills ANTSPARK's empty gallery with the site's existing ANTSPARK photos.
 * ANTSFire's image is cleared (no stand-in image is invented). Dry run by default; --apply writes.
 * Uses ProgramService so a revision and an audit entry are recorded.
 */
import { prisma } from '../lib/prisma';
import { ProgramService } from '../lib/services/program-service';

const apply = process.argv.includes('--apply');
const MISPLACED = '/images/hero-slide-4.jpg';
const ANTSPARK_GALLERY = ['/images/antspark_1 hukuk.jpg', '/images/antspark_2 psikoloji.jpg', '/images/antspark_3dijital.jpg', '/images/antspark_4mentör.jpg'];


async function main() {
    const antsfire = await prisma.program.findFirst({ where: { slug: { startsWith: 'antsfire' } } });
    const antspark = await prisma.program.findFirst({ where: { slug: { startsWith: 'antspark' } } });
    if (!antsfire || !antspark) throw new Error('ANTSFire / ANTSPARK programı bulunamadı');

    const moveFromFire = [antsfire.heroUrl, antsfire.coverUrl].includes(MISPLACED);
    if (moveFromFire) {
        console.log(`${apply ? 'CLEAR' : '[dry] clear'} ANTSFire banner (${MISPLACED})`);
        if (apply) await ProgramService.updateProgram(antsfire.id, { heroUrl: antsfire.heroUrl === MISPLACED ? null : antsfire.heroUrl, coverUrl: antsfire.coverUrl === MISPLACED ? null : antsfire.coverUrl, ogImageUrl: antsfire.ogImageUrl === MISPLACED ? null : antsfire.ogImageUrl } as never);
    }
    if (!antspark.heroUrl && moveFromFire) {
        console.log(`${apply ? 'SET' : '[dry] set'} ANTSPARK banner → ${MISPLACED}`);
        if (apply) await ProgramService.updateProgram(antspark.id, { heroUrl: MISPLACED, coverUrl: antspark.coverUrl || MISPLACED } as never);
    }
    let gallery: unknown[] = [];
    try {
        gallery = antspark.gallery ? JSON.parse(antspark.gallery) : [];
    } catch {
        gallery = [];
    }
    if (!Array.isArray(gallery) || gallery.length === 0) {
        console.log(`${apply ? 'SET' : '[dry] set'} ANTSPARK gallery (${ANTSPARK_GALLERY.length} photos)`);
        if (apply) await ProgramService.updateProgram(antspark.id, { gallery: ANTSPARK_GALLERY } as never);
    }
    // ANTSFire's gallery photos are ANTSPARK photos as well: move them over (deduplicated)
    let fireGallery: string[] = [];
    try {
        fireGallery = antsfire.gallery ? (JSON.parse(antsfire.gallery) as string[]).filter((g) => typeof g === 'string') : [];
    } catch {
        fireGallery = [];
    }
    if (fireGallery.length) {
        const fresh = await prisma.program.findUnique({ where: { id: antspark.id }, select: { gallery: true } });
        let sparkGallery: string[] = [];
        try {
            sparkGallery = fresh?.gallery ? JSON.parse(fresh.gallery) : [];
        } catch {
            sparkGallery = [];
        }
        const merged = Array.from(new Set([...(apply ? sparkGallery : ANTSPARK_GALLERY), ...fireGallery]));
        console.log(`${apply ? 'MOVE' : '[dry] move'} ${fireGallery.length} gallery photos ANTSFire → ANTSPARK`);
        if (apply) {
            await ProgramService.updateProgram(antspark.id, { gallery: merged } as never);
            await ProgramService.updateProgram(antsfire.id, { gallery: [] } as never);
        }
    }
    console.log(apply ? 'Applied.' : 'Dry run — pass --apply to write.');
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
