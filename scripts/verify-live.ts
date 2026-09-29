import { prisma } from '../lib/prisma';

async function verify() {
    console.log('--- 1. Testing /api/public/slides ---');
    const slidesRes = await fetch('http://localhost:3000/api/public/slides');
    const slides = await slidesRes.json();
    console.log('Slides count:', slides.slides?.length, 'Success:', slides.success);

    console.log('--- 2. Testing /api/public/settings ---');
    const settingsRes = await fetch('http://localhost:3000/api/public/settings');
    const settings = await settingsRes.json();
    console.log('Settings:', settings.settings);

    console.log('--- 3. Testing /api/public/homepage ---');
    const hpRes = await fetch('http://localhost:3000/api/public/homepage');
    const hp = await hpRes.json();
    console.log('Active sections count:', hp.sections?.length, 'Success:', hp.success);

    console.log('--- 4. Testing / (Public Homepage HTML) ---');
    const homeRes = await fetch('http://localhost:3000/');
    console.log('Homepage status:', homeRes.status);
    const text = await homeRes.text();
    console.log('Contains İKÜANTS:', text.includes('İKÜANTS') || text.includes('ikuants'));
    console.log('Contains footer email:', text.includes('bilgi@ikuantstekmer.com'));

    console.log('--- 5. Testing DB counts ---');
    const [sc, secCount, entCount, menCount] = await Promise.all([
        prisma.heroSlide.count(),
        prisma.homepageSection.count(),
        prisma.entrepreneur.count(),
        prisma.mentor.count()
    ]);
    console.log({
        heroSlidesInDb: sc,
        homepageSectionsInDb: secCount,
        entrepreneursInDb: entCount,
        mentorsInDb: menCount
    });

    process.exit(0);
}

verify().catch((e) => {
    console.error('Verification error:', e);
    process.exit(1);
});
