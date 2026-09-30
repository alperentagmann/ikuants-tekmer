import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Forensically verifying all 23 Hero Slides in DB...');
    const slides = await prisma.heroSlide.findMany({
        orderBy: { sortOrder: 'asc' },
    });

    console.log(`Total Slides in DB: ${slides.length}`);

    let fileExistsCount = 0;
    let missingFiles = 0;
    const mediaUrls = new Set<string>();
    const duplicates: string[] = [];

    slides.forEach((slide, idx) => {
        const localPath = path.join(process.cwd(), 'public', slide.mediaUrl.replace(/^\//, ''));
        const exists = fs.existsSync(localPath);
        if (exists) {
            fileExistsCount++;
        } else {
            missingFiles++;
            console.log(`⚠️ Missing local file for slide ${idx + 1} (${slide.id}): ${slide.mediaUrl}`);
        }

        if (mediaUrls.has(slide.mediaUrl)) {
            duplicates.push(slide.mediaUrl);
        } else {
            mediaUrls.add(slide.mediaUrl);
        }
    });

    console.log(`\n================ HERO SLIDES SUMMARY ================`);
    console.log(`DB SLIDES: ${slides.length}`);
    console.log(`LOCAL FILE EXISTS: ${fileExistsCount}/${slides.length}`);
    console.log(`MISSING FILES: ${missingFiles}`);
    console.log(`UNIQUE MEDIA URLS: ${mediaUrls.size}`);
    console.log(`DUPLICATES: ${duplicates.length}`);
    console.log(`ALL ACTIVE: ${slides.every(s => s.isActive)}`);
    console.log(`ALL PUBLISHED: ${slides.every(s => s.status === 'PUBLISHED')}`);
    console.log(`=====================================================\n`);

    await prisma.$disconnect();
}

main().catch(console.error);
