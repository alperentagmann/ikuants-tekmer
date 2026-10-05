import { PrismaClient } from '@prisma/client';
import { BOARD_DEFAULTS, FACILITY_DEFAULTS, LEGISLATION_DEFAULTS, PARTNER_DEFAULTS, SERVICE_DEFAULTS, TEAM_DEFAULTS } from '../data/public-defaults';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding comprehensive CMS parity data for İKÜANTS TEKMER...');

    // 1. BOARD MEMBERS (Kurullar)
    console.log('Seeding Board Members (Yönetim, Değerlendirme, Danışma)...');

    for (const b of BOARD_DEFAULTS) {
        const existing = await prisma.boardMember.findFirst({
            where: { fullName: b.name, boardType: b.boardType }
        });
        if (!existing) {
            await prisma.boardMember.create({
                data: {
                    fullName: b.name,
                    title: b.title,
                    organization: (b as any).organization || 'İKÜANTS TEKMER',
                    duty: b.duty,
                    boardType: b.boardType,
                    imageUrl: b.imageUrl,
                    imageStyle: (b as any).imageStyle || null,
                    sortOrder: b.sortOrder,
                    isActive: true,
                    isPublished: true,
                }
            });
        }
    }
    console.log('✅ Board Members seeded.');

    // 2. TEAM MEMBERS (Ekibimiz)
    console.log('Seeding Team Members...');
    const teamMembers = TEAM_DEFAULTS;

    for (const t of teamMembers) {
        const existing = await prisma.teamMember.findFirst({ where: { fullName: t.fullName } });
        if (!existing) {
            await prisma.teamMember.create({ data: t });
        } else {
            await prisma.teamMember.update({
                where: { id: existing.id },
                data: t
            });
        }
    }
    console.log('✅ Team Members seeded.');

    // 3. PARTNERS (İş Birliklerimiz)
    console.log('Seeding Partners...');
    const partners = PARTNER_DEFAULTS;

    for (const p of partners) {
        const existing = await prisma.partner.findFirst({ where: { name: p.name } });
        if (!existing) {
            await prisma.partner.create({ data: p });
        } else {
            await prisma.partner.update({ where: { id: existing.id }, data: p });
        }
    }
    console.log('✅ Partners seeded.');

    // 4. FACILITIES (Kullanım Alanları)
    console.log('Seeding Facilities...');
    const facilities = FACILITY_DEFAULTS;

    for (const f of facilities) {
        const existing = await prisma.facility.findFirst({ where: { title: f.title } });
        if (!existing) {
            await prisma.facility.create({ data: f });
        }
    }
    console.log('✅ Facilities seeded.');

    // 5. SERVICES (Hizmetlerimiz)
    console.log('Seeding Services...');
    const services = SERVICE_DEFAULTS;

    for (const s of services) {
        const existing = await prisma.serviceItem.findFirst({ where: { title: s.title } });
        if (!existing) {
            await prisma.serviceItem.create({ data: s });
        }
    }
    console.log('✅ Services seeded.');

    // 6. LEGISLATIONS (Mevzuat)
    console.log('Seeding Legislation documents...');
    const regulations = LEGISLATION_DEFAULTS;

    for (const r of regulations) {
        const existing = await prisma.legislationDocument.findFirst({ where: { title: r.title } });
        if (!existing) {
            await prisma.legislationDocument.create({ data: r });
        }
    }
    console.log('✅ Legislation documents seeded.');

    // 7. FAQS (SSS)
    console.log('Seeding FAQs...');
    const faqs = [
        {
            question: "TEKMER nedir?",
            answer: "TEKMER (Teknoloji Geliştirme Merkezi), girişimcilere ve start-up şirketlerine ön kuluçka, kuluçka ve büyüme süreçlerinde destek sağlayan, KOSGEB tarafından desteklenen merkezlerdir. İKÜANTS TEKMER, İstanbul Kültür Üniversitesi bünyesinde faaliyet göstermektedir.",
            category: "GENEL",
            sortOrder: 1,
        },
        {
            question: "TEKMER'e kimler başvurabilir?",
            answer: "Teknoloji tabanlı iş fikirleri olan girişimciler, üniversite öğrencileri, akademisyenler ve yenilikçi projeleri olan herkes TEKMER'e başvurabilir. Başvuru için bir iş fikri veya proje planı olması yeterlidir.",
            category: "BASVURU",
            sortOrder: 2,
        },
        {
            question: "TEKMER'de kalış süresi ne kadardır?",
            answer: "Ön kuluçka süreci genellikle 6-12 ay, kuluçka süreci ise 2-3 yıl arasında değişmektedir. Bu süreler projenin gelişim durumuna göre uzatılabilir.",
            category: "KULUCKA",
            sortOrder: 3,
        },
        {
            question: "TEKMER'de yer almanın avantajları nelerdir?",
            answer: "TEKMER'de yer alan girişimciler; vergi muafiyetleri, SGK prim destekleri, Ar-Ge indirimleri, personel maaş destekleri, ofis imkanı, mentorluk, ağ oluşturma fırsatları ve KOSGEB desteklerine erişim gibi birçok avantajdan yararlanabilir.",
            category: "DESTEKLER",
            sortOrder: 4,
        },
        {
            question: "Başvuru süreci nasıl işliyor?",
            answer: "Online başvuru formu doldurulduktan sonra ön değerlendirme yapılır. Uygun görülen projeler jüri değerlendirmesine alınır ve kabul edilen girişimcilerle görüşme yapılarak süreç başlatılır.",
            category: "BASVURU",
            sortOrder: 5,
        },
        {
            question: "Fiziksel ofis zorunlu mu?",
            answer: "Hayır, fiziksel ofis kullanımı zorunlu değildir. Hibrit çalışma modeli desteklenmektedir. Ancak ofis kullanmak isteyen girişimcilere modern çalışma alanları sağlanmaktadır.",
            category: "GENEL",
            sortOrder: 6,
        },
        {
            question: "TEKMER'den mezuniyet sonrası destek var mı?",
            answer: "Evet, TEKMER mezunları da ekosistem içinde kalmaya devam eder. Mezun girişimciler networking etkinliklerine katılabilir ve danışmanlık hizmetlerinden faydalanabilir.",
            category: "KULUCKA",
            sortOrder: 7,
        },
        {
            question: "Hangi sektörlerden projeler kabul ediliyor?",
            answer: "Yapay Zeka, Cloud, Mobil Teknolojiler, Oyun, Animasyon, Fintech, Edutech, Biyoteknoloji, Medikal Cihaz ve Yenilikçi Teknolojiler gibi geniş bir yelpazede projeler kabul edilmektedir.",
            category: "GENEL",
            sortOrder: 8,
        }
    ];

    for (const f of faqs) {
        const existing = await prisma.faqItem.findFirst({ where: { question: f.question } });
        if (!existing) {
            await prisma.faqItem.create({ data: f });
        }
    }
    console.log('✅ FAQs seeded.');

    console.log('🎉 All CMS parity initial data seeded successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding CMS parity data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
