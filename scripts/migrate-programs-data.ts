import { prisma } from '../lib/prisma';

async function main() {
    console.log('=== Migrating ANTSPARK, ANTSFIRE & GLOW UP to Full Database CMS ===');

    const programs = [
        {
            slug: 'antspark-on-kulucka',
            name: 'ANTSPARK Ön Kuluçka Programı',
            programType: 'PRE_INCUBATION',
            tagline: 'Fikirden Girişime, Girişimden Geleceğe',
            shortDesc: 'Teknoloji tabanlı erken aşama iş fikri olan girişimci adayları ve ekipler için 12 haftalık hızlandırılmış ön kuluçka ve prototipleme programı.',
            detailedDesc: `ANTSPARK, teknoloji ve inovasyon odaklı iş fikirlerini ticarileşebilir prototiplere ve yatırım almaya hazır girişimlere dönüştüren kapsamlı bir ön kuluçka programıdır.

İstanbul Kültür Üniversitesi ve KOSGEB iş birliğiyle yürütülen program süresince girişimcilere; 34 saat uygulamalı eğitim, 25 saat bire bir kıdemli mentörlük, prototipleme laboratuvarı ve açık ofis alanı kullanımı, hukuki ve mali danışmanlık ile Demo Day yatırımcı sunumu imkânı sunulmaktadır.`,
            logoUrl: '/images/logo-tekmer.png',
            heroUrl: '/images/hero-slide-2.jpg',
            coverUrl: '/images/hero-slide-2.jpg',
            mobileHeroUrl: '/images/hero-slide-2.jpg',
            gallery: JSON.stringify(['/images/hero-slide-2.jpg', '/images/hero-slide-5.jpg', '/images/masterclass-4 network.jpg']),
            colorCode: 'from-purple-500 to-pink-500',
            duration: '12 Hafta',
            quota: '25 Girişim',
            mentorHours: '70+ Saat',
            applyStatus: 'OPEN',
            targetAudience: 'Teknoloji odaklı erken aşama fikir sahibi öğrenciler, akademisyenler, bağımsız geliştiriciler ve kurucu ekipler.',
            whoCanApply: 'Ar-Ge, yazılım, yapay zekâ, sağlık teknolojileri, havacılık veya derin teknoloji alanında doğrulanabilir bir fikri olan tüm bireysel girişimciler ve ekipler.',
            applicationCriteria: 'Yenilikçi yön, teknolojik yapılabilirlik, pazar potansiyeli ve kurucu ekip yetkinliği.',
            timelineJson: JSON.stringify([
                { stepNumber: 1, title: 'Başvuru ve Ön Değerlendirme', period: 'Hafta 1-2', description: 'Online başvuruların toplanması ve jüri puanlama süreci.' },
                { stepNumber: 2, title: 'Oryantasyon ve Temel Girişimcilik', period: 'Hafta 3-4', description: 'İş Modeli Kanvası, Yalın Girişim ve Problem Doğrulama eğitimleri.' },
                { stepNumber: 3, title: 'MVP Geliştirme & Birebir Mentörlük', period: 'Hafta 5-8', description: 'Haftalık mentörlük seansları, prototipleme ve ilk kullanıcı görüşmeleri.' },
                { stepNumber: 4, title: 'Hukuk, Finans & GTM', period: 'Hafta 9-10', description: 'Şirketleşme, fikri mülkiyet ve pazara giriş stratejisi.' },
                { stepNumber: 5, title: 'Pitching & Demo Day', period: 'Hafta 11-12', description: 'Yatırımcı ve jüri heyeti önünde mezuniyet sunumu ve ödül töreni.' },
            ]),
            benefitsJson: JSON.stringify([
                { title: 'Ücretsiz Açık Ofis & Prototipleme', description: '7/24 çalışma alanı, yüksek hızlı internet ve Maker laboratuvarı.', icon: 'Building2' },
                { title: 'Birebir Kıdemli Mentörlük', description: '20+ sektör lideri ve seri girişimciden haftalık kişiselleştirilmiş rehberlik.', icon: 'Users' },
                { title: 'KOSGEB & TÜBİTAK Hibe Danışmanlığı', description: 'Kamu destekleri ve teşvik başvurularında uzman dosya hazırlık desteği.', icon: 'DollarSign' },
                { title: 'Demo Day & Yatırımcı Erişimi', description: 'Melek yatırım ağları ve girişim sermayesi fonlarına doğrudan erişim.', icon: 'Rocket' },
            ]),
            faqsJson: JSON.stringify([
                { question: 'Programa katılmak için şirketleşmiş olmak şart mı?', answer: 'Hayır, ANTSPARK fikir aşamasındaki bireysel adaylara ve henüz şirket kurmamış ekiplere yöneliktir.' },
                { question: 'Program ücretli midir?', answer: 'Hayır, ANTSPARK Ön Kuluçka Programı tamamen ücretsizdir ve herhangi bir hisse/pay talep edilmez.' },
                { question: 'Eğitimler online mı yüz yüze mi yapılıyor?', answer: 'Eğitimler hibrit modelde (fiziksel TEKMER salonları ve online canlı yayın) gerçekleştirilmektedir.' },
            ]),
            documentsJson: JSON.stringify([
                { title: 'ANTSPARK Başvuru Rehberi ve Program Kılavuzu', fileUrl: '/docs/antspark-rehber.pdf', type: 'PDF', size: '2.4 MB' },
                { title: 'İş Modeli Kanvası Şablonu', fileUrl: '/docs/business-model-canvas.pdf', type: 'PDF', size: '1.1 MB' },
            ]),
            contentBlocksJson: JSON.stringify([
                { id: 'b-1', type: 'richText', title: 'Geleceğin Teknolojilerini İnşa Edin', content: 'ANTSPARK, teknoloji girişimcilerini fikir aşamasından alıp ölçeklenebilir ve ticarileşebilir bir iş modeline ulaştıran kapsamlı bir hızlandırıcı programıdır.' },
                { id: 'b-2', type: 'benefits', title: 'Programa Kabul Edilen Girişimcilere Sağlanan Avantajlar' },
                { id: 'b-3', type: 'timeline', title: 'Program Takvimi ve Aşamalar' },
                { id: 'b-4', type: 'faq', title: 'Sıkça Sorulan Sorular' },
                { id: 'b-5', type: 'cta', title: 'Hayalindeki Girişimi Bugün Başlat', content: 'ANTSPARK Ön Kuluçka Programı ile ekosistemin parçası olun.' }
            ]),
            ctaTitle: "ANTSPARK'a Hemen Başvur",
            ctaDescription: 'Erken aşama teknoloji fikrini hayata geçirmek için kontenjanlar dolmadan yerini al.',
            ctaText: "ANTSPARK'A BAŞVUR",
            ctaLink: '/basvuru',
            sortOrder: 1,
            isFeatured: true,
            isPublished: true,
            seoTitle: 'ANTSPARK Ön Kuluçka Programı | İKÜANTS TEKMER',
            seoDescription: 'Fikir aşamasındaki teknoloji girişimcileri için 12 haftalık hızlandırılmış ön kuluçka programı.',
        },
        {
            slug: 'antsfire-kulucka',
            name: 'ANTSFire Kuluçka Programı',
            programType: 'INCUBATION',
            tagline: 'Ticarileşme, Büyüme ve Yatırım Hızlandırma',
            shortDesc: 'Şirketleşmiş veya MVP aşamasını tamamlamış ileri seviye girişimler için 12 aylık kuluçka, ofis tahsisi ve küresel pazara açılma programı.',
            detailedDesc: `ANTSFire, prototipini tamamlamış veya şirketini kurmuş büyüme odaklı girişimcilere özel tasarlanmış 12 aylık ileri seviye kuluçka programıdır.

Girişimciler; 5746 sayılı Kanun kapsamında vergi ve SGK muafiyetleri, bağımsız ofis tahsisi, kurumsal müşteri eşleştirmeleri, büyüme (growth) mentörlüğü ve yatırım hazırlığı desteklerinden faydalanır.`,
            logoUrl: '/images/logo-tekmer.png',
            heroUrl: '/images/hero-slide-4.jpg',
            coverUrl: '/images/hero-slide-4.jpg',
            mobileHeroUrl: '/images/hero-slide-4.jpg',
            gallery: JSON.stringify(['/images/hero-slide-4.jpg', '/images/hero-slide-7.jpg', '/images/08.JPG']),
            colorCode: 'from-orange-500 to-red-600',
            duration: '12 Ay',
            quota: '15 Girişim',
            mentorHours: '120+ Saat',
            applyStatus: 'OPEN',
            targetAudience: 'MVP’si hazır, ilk müşterilerine ulaşmış veya ticarileşme aşamasındaki Ar-Ge ve teknoloji şirketleri.',
            whoCanApply: 'Yasal şirket kuruluşu olan veya TEKMER kabulü sonrası şirketleşecek teknoloji odaklı girişimler.',
            applicationCriteria: 'TRL 5+ seviyesi, pazar doğrulaması, ölçeklenebilir iş modeli ve tam zamanlı kurucu ekip.',
            timelineJson: JSON.stringify([
                { stepNumber: 1, title: 'Faz 0: Başvuru & Jüri Değerlendirmesi', period: 'Ay 1', description: 'Değerlendirme kurulu sunumları ve kabul.' },
                { stepNumber: 2, title: 'Faz 1: Ofis Tahsisi & Teşvik Kurulumu', period: 'Ay 2-3', description: 'Mevzuat ve vergi teşvik onayları, yerleşim.' },
                { stepNumber: 3, title: 'Faz 2: GTM & Kurumsal Satış', period: 'Ay 4-8', description: 'B2B müşteri eşleştirmeleri ve satış optimizasyonu.' },
                { stepNumber: 4, title: 'Faz 3: Yatırım & Scale-Up', period: 'Ay 9-12', description: 'Seri A / Tohum yatırım hazırlığı ve mezuniyet.' },
            ]),
            benefitsJson: JSON.stringify([
                { title: 'Özel Ar-Ge Ofisi Tahsisi', description: 'Modern altyapılı bağımsız veya co-working ofis alanları.', icon: 'Building' },
                { title: '5746 Sayılı Kanun Vergi İstisnaları', description: 'Gelir vergisi stopajı ve SGK teşvik avantajları.', icon: 'Shield' },
                { title: 'Kurumsal İş Birliği & Müşteri Ağı', description: 'Sanayi ve kurumsal partnerlerle doğrudan B2B eşleştirme.', icon: 'Zap' },
                { title: 'Yatırım Hazırlığı & Pitching', description: 'VC fonları ve melek yatırım ağlarıyla birebir oturumlar.', icon: 'Award' },
            ]),
            faqsJson: JSON.stringify([
                { question: 'ANTSFire programına şirketleşmeden başvurabilir miyim?', answer: 'Evet, başvuru yapabilirsiniz. Kabul sonrası TEKMER bünyesinde şirket kurulumu gerçekleştirilir.' },
                { question: 'Ofis tahsisinde giderler nasıl karşılanır?', answer: 'KOSGEB TEKMER mevzuatına uygun olarak indirimli ve sübvanse edilmiş altyapı sağlanır.' },
            ]),
            documentsJson: JSON.stringify([
                { title: 'ANTSFire Kuluçka Sözleşmesi ve Başvuru Kriterleri', fileUrl: '/docs/antsfire-kriterler.pdf', type: 'PDF', size: '3.1 MB' },
            ]),
            contentBlocksJson: JSON.stringify([
                { id: 'f-1', type: 'richText', title: 'Girişiminizi Bir Üst Seviyeye Taşıyın', content: 'ANTSFire, ticarileşme aşamasındaki teknoloji şirketlerine özel ofis, vergi muafiyeti ve yatırım ağı sunar.' },
                { id: 'f-2', type: 'benefits', title: 'Kuluçka Şirketlerine Sağlanan Ayrıcalıklar' },
                { id: 'f-3', type: 'timeline', title: 'Kuluçka Yol Haritası' },
                { id: 'f-4', type: 'faq', title: 'Sıkça Sorulan Sorular' },
                { id: 'f-5', type: 'cta', title: 'ANTSFire Ailesine Katılın', content: 'Teknolojinizi küresel pazara açacak desteğe hemen ulaşın.' }
            ]),
            ctaTitle: "ANTSFire Kuluçka Başvurusu",
            ctaDescription: 'Ar-Ge odaklı şirketinizi büyütmek için hemen başvurun.',
            ctaText: "ANTSFIRE'A BAŞVUR",
            ctaLink: '/basvuru',
            sortOrder: 2,
            isFeatured: true,
            isPublished: true,
            seoTitle: 'ANTSFire Kuluçka Programı | İKÜANTS TEKMER',
            seoDescription: 'Büyüme aşamasındaki teknoloji şirketleri için 12 aylık kuluçka ve ofis programı.',
        },
        {
            slug: 'glow-up',
            name: 'Glow Up Hızlandırma Programı',
            programType: 'ACCELERATION',
            tagline: 'Kadın Girişimciler ve İleri Teknoloji Odaklı Büyüme',
            shortDesc: 'Kadın teknoloji girişimcileri, derin teknoloji ve etki odaklı girişimler için özel mentörlük ve uluslararası fonlama programı.',
            detailedDesc: `Glow Up, kadın girişimcileri ve yüksek etki yaratan teknoloji projelerini desteklemek amacıyla kurgulanmış butik bir hızlandırma programıdır.

Program kapsamında; liderlik atölyeleri, global pazar analizleri, uluslararası hibe programları (Horizon Europe, EIC) ve fon yöneticileriyle özel oturumlar sunulmaktadır.`,
            logoUrl: '/images/logo-tekmer.png',
            heroUrl: '/images/hero-slide-3.jpg',
            coverUrl: '/images/hero-slide-3.jpg',
            mobileHeroUrl: '/images/hero-slide-3.jpg',
            gallery: JSON.stringify(['/images/hero-slide-3.jpg', '/images/07.JPG']),
            colorCode: 'from-pink-500 to-rose-600',
            duration: '16 Hafta',
            quota: '10 Girişim',
            mentorHours: '60+ Saat',
            applyStatus: 'OPEN',
            targetAudience: 'Kadın kurucu ortaklı veya sosyal / teknolojik etki odaklı girişimler.',
            whoCanApply: 'En az bir kadın kurucu ortağı bulunan veya sürdürülebilir kalkınma amaçlarına hizmet eden derin teknoloji ekipleri.',
            applicationCriteria: 'Etki potansiyeli, küresel ölçeklenebilirlik, güçlü kurucu vizyonu.',
            timelineJson: JSON.stringify([
                { stepNumber: 1, title: 'Başvuru & Mülakat', period: 'Hafta 1-2', description: 'Online başvuru ve jüri görüşmesi.' },
                { stepNumber: 2, title: 'Liderlik & Vizyon Kampı', period: 'Hafta 3-6', description: 'Liderlik psikolojisi, ekip yönetimi ve büyüme.' },
                { stepNumber: 3, title: 'Uluslararası Fon & Hibe', period: 'Hafta 7-12', description: 'AB fonları, küresel yatırımcı görüşmeleri.' },
                { stepNumber: 4, title: 'Global Showcase', period: 'Hafta 13-16', description: 'Uluslararası yatırımcı ağına sunum.' },
            ]),
            benefitsJson: JSON.stringify([
                { title: 'Kadın Liderlik Mentörlüğü', description: 'Başarılı kadın CEO ve fon yöneticilerinden birebir rehberlik.', icon: 'Users' },
                { title: 'Uluslararası Hibe Hazırlığı', description: 'Horizon Europe ve küresel fonlara başvuru danışmanlığı.', icon: 'Globe' },
                { title: 'Özel Yatırımcı Eşleştirmesi', description: 'Etki yatırımı odaklı VC ve melek ağlarıyla buluşma.', icon: 'Sparkles' },
            ]),
            faqsJson: JSON.stringify([
                { question: 'Glow Up programına sadece kadınlar mı başvurabilir?', answer: 'Kurucu ekibinde en az bir kadın lider veya kurucu ortak bulunan tüm ekipler başvurabilir.' },
            ]),
            documentsJson: JSON.stringify([
                { title: 'Glow Up Program Kılavuzu', fileUrl: '/docs/glow-up-kilavuz.pdf', type: 'PDF', size: '1.8 MB' },
            ]),
            contentBlocksJson: JSON.stringify([
                { id: 'g-1', type: 'richText', title: 'Kadın Girişimcilerin Gücüyle Gelecek', content: 'Glow Up, teknoloji ekosisteminde kadın liderliğini ve etki odaklı girişimleri destekler.' },
                { id: 'g-2', type: 'benefits', title: 'Program Ayrıcalıkları' },
                { id: 'g-3', type: 'timeline', title: 'Hızlandırma Fazları' },
                { id: 'g-4', type: 'cta', title: 'Glow Up ile Parlayın', content: 'Girişiminizi uluslararası sahneye taşımak için başvurun.' }
            ]),
            ctaTitle: "Glow Up'a Başvurun",
            ctaDescription: 'Geleceğe yön veren girişimciler arasında yerinizi alın.',
            ctaText: "GLOW UP'A BAŞVUR",
            ctaLink: '/basvuru',
            sortOrder: 3,
            isFeatured: true,
            isPublished: true,
            seoTitle: 'Glow Up Hızlandırma Programı | İKÜANTS TEKMER',
            seoDescription: 'Kadın kurucu ortaklı ve etki odaklı teknoloji girişimleri için 16 haftalık hızlandırma programı.',
        }
    ];

    for (const prog of programs) {
        const existing = await prisma.program.findFirst({
            where: {
                OR: [
                    { slug: prog.slug },
                    { name: prog.name },
                ]
            }
        });

        if (existing) {
            await prisma.program.update({
                where: { id: existing.id },
                data: {
                    ...prog,
                    slug: existing.slug || prog.slug,
                } as any
            });
            console.log(`  Updated program in DB: ${prog.name} (${prog.slug})`);
        } else {
            await prisma.program.create({
                data: prog as any
            });
            console.log(`  Created program in DB: ${prog.name} (${prog.slug})`);
        }
    }

    const count = await prisma.program.count({ where: { isArchived: false } });
    console.log(`\n=== Migration Complete: ${count} Active Programs in Database ===`);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
