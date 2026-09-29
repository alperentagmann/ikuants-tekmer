import { prisma } from '../lib/prisma';

async function main() {
    console.log('=== Hero Slide Migration: Bringing total to 23 slides ===');

    // First: verify existing slides
    const existing = await prisma.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } });
    console.log(`Current slide count: ${existing.length}`);
    existing.forEach(s => console.log(`  [${s.sortOrder}] ${s.mediaUrl}`));

    // Update existing slides 1-8 to ensure correct image paths
    const existingUpdates = [
        { sortOrder: 1, mediaUrl: '/images/hero-slide-1.jpg', title: 'Geleceği Şekillendiren Girişimcilik Ekosistemi' },
        { sortOrder: 2, mediaUrl: '/images/hero-slide-2.jpg', title: 'ANTsPARK Demoday & Ödül Töreni' },
        { sortOrder: 3, mediaUrl: '/images/hero-slide-3.jpg', title: 'Güçlü ve Büyüyen Girişimci Topluluğu' },
        { sortOrder: 4, mediaUrl: '/images/hero-slide-4.jpg', title: 'Uygulamalı Eğitim ve Seminerler' },
        { sortOrder: 5, mediaUrl: '/images/hero-slide-5.jpg', title: 'Proje ve Hibe Destek Programları' },
        { sortOrder: 6, mediaUrl: '/images/hero-slide-6.jpg', title: 'Birebir Mentörlük Seansları' },
        { sortOrder: 7, mediaUrl: '/images/hero-slide-7.jpg', title: 'Teknoloji Odaklı Açılış ve Paneller' },
        { sortOrder: 8, mediaUrl: '/images/hero-slide-8.jpg', title: 'Yatırımcı Buluşmaları ve Demo Günleri' },
    ];

    for (const upd of existingUpdates) {
        const slide = existing.find(s => s.sortOrder === upd.sortOrder);
        if (slide) {
            await prisma.heroSlide.update({
                where: { id: slide.id },
                data: { mediaUrl: upd.mediaUrl, mobileMediaUrl: upd.mediaUrl }
            });
            console.log(`  Updated slide ${upd.sortOrder} → ${upd.mediaUrl}`);
        }
    }

    // Define 15 new slides to add (sortOrder 9-23)
    const newSlides = [
        {
            sortOrder: 9,
            mediaUrl: '/images/hero-slide-9.jpg',
            mobileMediaUrl: '/images/hero-slide-9.jpg',
            title: 'İnovasyon Merkezi Etkinlikleri',
            subtitle: 'Fikir, Tasarım ve Teknoloji Buluşmaları',
            badgeText: 'ETKİNLİK',
            description: 'Girişimcilik ekosistemimizde düzenlenen hackathon, workshop ve seminer etkinlikleriyle fark yaratıyoruz.',
            primaryCtaText: 'ETKİNLİKLER',
            primaryCtaLink: '/etkinlikler',
            secondaryCtaText: 'HEMEN BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 10,
            mediaUrl: '/images/hero-slide-10.jpg',
            mobileMediaUrl: '/images/hero-slide-10.jpg',
            title: 'Kuluçka Programı Başarı Hikayeleri',
            subtitle: 'Güçlü Portföy, Gerçek Büyüme',
            badgeText: 'BAŞARI',
            description: 'ANTsPARK kuluçka programından mezun girişimlerimiz ulusal ve küresel arenada büyümeye devam ediyor.',
            primaryCtaText: 'GİRİŞİMCİLER',
            primaryCtaLink: '/girisimciler',
            secondaryCtaText: 'PROGRAMLAR',
            secondaryCtaLink: '/programlar',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 11,
            mediaUrl: '/images/hero-slide-11.jpg',
            mobileMediaUrl: '/images/hero-slide-11.jpg',
            title: 'Ar-Ge ve İnovasyon Altyapısı',
            subtitle: 'Modern Ofis ve Laboratuvar Ortamı',
            badgeText: 'ALTYAPI',
            description: 'Yüksek hızlı internet, prototipleme laboratuvarı, toplantı odaları ve modern co-working alanları.',
            primaryCtaText: 'ALTYAPI',
            primaryCtaLink: '/hakkimizda',
            secondaryCtaText: 'BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 12,
            mediaUrl: '/images/hero-3.jpg',
            mobileMediaUrl: '/images/hero-3.jpg',
            title: 'Topluluk ve İş Birliği Kültürü',
            subtitle: 'Ekip Çalışması ile Büyüyoruz',
            badgeText: 'TOPLULUK',
            description: 'Farklı sektörlerden girişimcilerin bir arada olduğu dinamik ve destekleyici bir iş birliği kültürü.',
            primaryCtaText: 'HAKKIMIZDA',
            primaryCtaLink: '/hakkimizda',
            secondaryCtaText: 'BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 13,
            mediaUrl: '/images/hero-4.jpg',
            mobileMediaUrl: '/images/hero-4.jpg',
            title: 'Sektörel Bağlantılar ve Ağ',
            subtitle: 'Kurumsal Ortaklıklar, Güçlü Ekosistem',
            badgeText: 'NETWORK',
            description: 'KOSGEB, TÜBİTAK, İSTKA ve İKÜ ortaklığıyla güçlü bir kurumsal destek ağına erişin.',
            primaryCtaText: 'DESTEKLER',
            primaryCtaLink: '/destekler',
            secondaryCtaText: 'İLETİŞİM',
            secondaryCtaLink: '/iletisim',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 14,
            mediaUrl: '/images/hero-5.jpg',
            mobileMediaUrl: '/images/hero-5.jpg',
            title: 'Teknoloji Transferi ve Ticarileşme',
            subtitle: 'Akademiden Pazara Köprü',
            badgeText: 'TEKNOLOJİ TRANSFERİ',
            description: 'Üniversite-sanayi işbirliği ile ar-ge çıktılarının ticarileştirilmesinde uzman rehberlik.',
            primaryCtaText: 'PROGRAMLAR',
            primaryCtaLink: '/programlar',
            secondaryCtaText: 'BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 15,
            mediaUrl: '/images/hero-7.jpg',
            mobileMediaUrl: '/images/hero-7.jpg',
            title: 'Girişimcilik Ekosistemi Etkinlikleri',
            subtitle: 'Panel, Workshop ve Networking',
            badgeText: 'PROGRAM',
            description: 'Yıl boyunca düzenlenen etkinlikler ve programlarla girişimcilerin büyümesini hızlandırıyoruz.',
            primaryCtaText: 'ETKİNLİKLER',
            primaryCtaLink: '/etkinlikler',
            secondaryCtaText: 'HEMEN BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 16,
            mediaUrl: '/images/06.jpeg',
            mobileMediaUrl: '/images/06.jpeg',
            title: 'Mezun Girişimciler Buluşması',
            subtitle: 'Başarı Hikayeleri ve İlham',
            badgeText: 'MEZUNLAR',
            description: 'Programlarımızdan mezun girişimcilerimiz ile networking etkinliklerimizde bir araya geliyoruz.',
            primaryCtaText: 'GİRİŞİMCİLER',
            primaryCtaLink: '/girisimciler',
            secondaryCtaText: 'KATIL',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 17,
            mediaUrl: '/images/07.JPG',
            mobileMediaUrl: '/images/07.JPG',
            title: 'İKÜANTS TEKMER Açılış Etkinliği',
            subtitle: 'Geleceğe Adım Atıyoruz',
            badgeText: 'AÇILIŞ',
            description: 'İKÜANTS TEKMER\'in açılışında yaşanan tarihi anı ve vizyon konuşmalarını hatırlıyoruz.',
            primaryCtaText: 'HAKKIMIZDA',
            primaryCtaLink: '/hakkimizda',
            secondaryCtaText: 'BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 18,
            mediaUrl: '/images/08.JPG',
            mobileMediaUrl: '/images/08.JPG',
            title: 'Masterclass ve Eğitim Serileri',
            subtitle: 'Sektör Liderlerinden Birebir Öğren',
            badgeText: 'EĞİTİM',
            description: 'Girişimcilik, teknoloji ve iş geliştirme konularında uzman eğitmenlerle masterclass serileri.',
            primaryCtaText: 'PROGRAMLAR',
            primaryCtaLink: '/programlar',
            secondaryCtaText: 'KAYIT OL',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 19,
            mediaUrl: '/images/09.JPG',
            mobileMediaUrl: '/images/09.JPG',
            title: 'Demo Day ve Sunum Günleri',
            subtitle: 'Yatırımcılar Önünde Sahne Al',
            badgeText: 'DEMO DAY',
            description: 'Girişimlerinizi melek yatırımcılar ve iş dünyası önünde sunma fırsatı yakalayın.',
            primaryCtaText: 'BAŞVUR',
            primaryCtaLink: '/basvuru',
            secondaryCtaText: 'DETAYLI BİLGİ',
            secondaryCtaLink: '/hakkimizda',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 20,
            mediaUrl: '/images/10.JPG',
            mobileMediaUrl: '/images/10.JPG',
            title: 'Ödül Töreni ve Kapanış',
            subtitle: 'Başarının Taçlandırıldığı An',
            badgeText: 'ÖDÜLLER',
            description: 'Her dönem sonunda en başarılı girişimleri ödüllendiriyor, motivasyonu en üst düzeyde tutuyoruz.',
            primaryCtaText: 'BAŞARI HİKAYELERİ',
            primaryCtaLink: '/haberler',
            secondaryCtaText: 'PROGRAMLAR',
            secondaryCtaLink: '/programlar',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 21,
            mediaUrl: '/images/11.jpeg',
            mobileMediaUrl: '/images/11.jpeg',
            title: 'Ortak Çalışma Alanı',
            subtitle: 'Üretken ve Modern Ofis Ortamı',
            badgeText: 'COWORKING',
            description: 'Yüksek hızlı internet, ergonomik çalışma alanı ve 7/24 erişim ile verimli bir iş ortamı.',
            primaryCtaText: 'HAKKIMIZDA',
            primaryCtaLink: '/hakkimizda',
            secondaryCtaText: 'BAŞVUR',
            secondaryCtaLink: '/basvuru',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 22,
            mediaUrl: '/images/12.JPG',
            mobileMediaUrl: '/images/12.JPG',
            title: 'Proje Geliştirme ve Prototipleme',
            subtitle: 'Fikrinden Ürüne Hızlı Yol',
            badgeText: 'PROTOTIPLEME',
            description: 'Laboratuvar altyapısı ve teknik destek ile girişimlerinizi hızla prototipe dönüştürün.',
            primaryCtaText: 'BAŞVUR',
            primaryCtaLink: '/basvuru',
            secondaryCtaText: 'DESTEKLER',
            secondaryCtaLink: '/destekler',
            status: 'PUBLISHED',
            isActive: true,
        },
        {
            sortOrder: 23,
            mediaUrl: '/images/slider-1.png',
            mobileMediaUrl: '/images/slider-1.png',
            title: 'İKÜANTS TEKMER ile Fark Yarat',
            subtitle: 'Türkiye\'nin Önde Gelen Teknoloji Merkezi',
            badgeText: 'İKÜANTS TEKMER',
            description: 'İstanbul Kültür Üniversitesi bünyesindeki teknoloji geliştirme merkeziyle geleceği birlikte inşa edelim.',
            primaryCtaText: 'HEMEN BAŞVUR',
            primaryCtaLink: '/basvuru',
            secondaryCtaText: 'DETAYLI BİLGİ',
            secondaryCtaLink: '/hakkimizda',
            status: 'PUBLISHED',
            isActive: true,
        },
    ];

    // Check which sortOrders already exist
    const existingOrders = new Set(existing.map(s => s.sortOrder));
    let created = 0;

    for (const slide of newSlides) {
        if (existingOrders.has(slide.sortOrder)) {
            console.log(`  Slide sortOrder ${slide.sortOrder} already exists — skipping`);
            continue;
        }
        await prisma.heroSlide.create({ data: slide as any });
        console.log(`  Created slide ${slide.sortOrder} → ${slide.mediaUrl}`);
        created++;
    }

    const finalCount = await prisma.heroSlide.count();
    console.log(`\n=== RESULT ===`);
    console.log(`New slides created: ${created}`);
    console.log(`Total slides in DB: ${finalCount}`);

    if (finalCount >= 23) {
        console.log(`✅ HERO SLIDE COUNT: ${finalCount}/23+ PASS`);
    } else {
        console.log(`⚠️  HERO SLIDE COUNT: ${finalCount}/23 - needs more`);
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
