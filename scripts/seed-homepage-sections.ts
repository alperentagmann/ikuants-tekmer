import { prisma } from '../lib/prisma';

const defaultSections = [
    { sectionKey: 'header', title: 'Header & Navigasyon', subtitle: 'Ana menü ve logo', sortOrder: 1, isVisible: true },
    { sectionKey: 'hero', title: 'Hero / Slider', subtitle: 'Ana başlık, slider ve butonlar', sortOrder: 2, isVisible: true },
    { sectionKey: 'hero_cards', title: 'Hero Alt Kartları', subtitle: 'Yenilikçi teknolojiler, prototip, geliştirme, sinerji', sortOrder: 3, isVisible: true },
    { sectionKey: 'programs', title: 'Programlar', subtitle: 'ANTSFire, ANTSPARK, GLOW UP program alanları', sortOrder: 4, isVisible: true },
    { sectionKey: 'entrepreneurs', title: 'Girişimciler', subtitle: 'Girişimci şirketleri vitrini', sortOrder: 5, isVisible: true },
    { sectionKey: 'mentors', title: 'Mentörler', subtitle: 'Uzman mentör ağı', sortOrder: 6, isVisible: true },
    { sectionKey: 'news', title: 'Haberler & Duyurular', subtitle: 'Son haberler ve gelişmeler', sortOrder: 7, isVisible: true },
    { sectionKey: 'events', title: 'Etkinlikler', subtitle: 'Yaklaşan etkinlik ve eğitim takvimi', sortOrder: 8, isVisible: true },
    { sectionKey: 'testimonials', title: 'Başarı Hikâyeleri', subtitle: 'Girişimci yorumları ve başarı hikâyeleri', sortOrder: 9, isVisible: true },
    { sectionKey: 'faq', title: 'Sıkça Sorulan Sorular (SSS)', subtitle: 'Girişimciler için temel sorular', sortOrder: 10, isVisible: true },
    { sectionKey: 'partners', title: 'Partnerler & İş Birlikleri', subtitle: 'Kurumsal iş ortakları logoları', sortOrder: 11, isVisible: true },
    { sectionKey: 'cta', title: 'CTA / Harekete Geç', subtitle: 'Girişimcilik başvurusu çağrısı', sortOrder: 12, isVisible: true },
    { sectionKey: 'footer', title: 'Footer & İletişim', subtitle: 'Adres, telefon, e-posta, sosyal medya linkleri', sortOrder: 13, isVisible: true },
];

async function main() {
    console.log('Seeding Homepage Sections...');
    for (const sec of defaultSections) {
        await prisma.homepageSection.upsert({
            where: { sectionKey: sec.sectionKey },
            update: {
                title: sec.title,
                subtitle: sec.subtitle,
                sortOrder: sec.sortOrder,
            },
            create: sec,
        });
    }
    console.log('✅ All 13 homepage sections seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
