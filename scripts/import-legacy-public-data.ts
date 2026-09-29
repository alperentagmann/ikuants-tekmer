import { PrismaClient } from '@prisma/client';
import { siteContent } from '../data/content';

const prisma = new PrismaClient();

const staticMentors = [
    { name: "Zico Ufuk Batum", company: "Ventures & Mentors League", title: "Founder", image: "/images/zico-ufuk-batum.jpg", linkedin: "https://www.linkedin.com/in/zico-ufuk-batum-51238950/" },
    { name: "Onur Yolay", company: "Innoway R&D Kft.", title: "Co-Founder", image: "/images/onur-yolay.jpg", linkedin: "https://www.linkedin.com/in/onuryolay/" },
    { name: "Nizamettin Sami Harputlu", company: "Startup Centrum", title: "Co-Founder", image: "/images/nizamettin-harputlu.jpg", linkedin: "https://www.linkedin.com/in/nizamettinsamiharputlu/" },
    { name: "Abdulsamet Ekşi", company: "Türk Havacılık ve Uzay Sanayii", title: "Technology and Innovation Management", image: "/images/abdulsamet-eksi.jpg", linkedin: "https://www.linkedin.com/in/abdulsameteksi/" },
    { name: "Bikem İnce İnanç", company: "Malogra Danışmanlık", title: "Founder", image: "/images/bikem-ince.jpg", linkedin: "https://www.linkedin.com/in/bikeminceinanc/" },
    { name: "Büşra Altınsoy", company: "Pexa Boru Sanayi", title: "Yönetim Kurulu Üyesi", image: "/images/busra-altinsoy.jpg", linkedin: "https://www.linkedin.com/in/busraaltinsoy/" },
    { name: "Sıla Dinçer", company: "Ödeal", title: "R&D Manager", image: "/images/sila-dincer.jpg", linkedin: "https://www.linkedin.com/in/siladincer/" },
    { name: "Filiz Aksoy", company: "Bilişim Teknolojileri", title: "Proje ve Ürün Yöneticisi", image: "/images/filiz-aksoy.png", linkedin: "https://www.linkedin.com/in/filiz-aksoy/" },
    { name: "Pelin Özkuzey", company: "Satış & Pazarlama", title: "Danışman", image: "/images/pelin-ozkuzey.jpg", linkedin: "https://www.linkedin.com/in/pelin-ozkuzey-71223712/" },
    { name: "Belma Tost", company: "Pluxee Türkiye", title: "Senior Service & Experience Designer", image: "/images/belma-tost.jpg", linkedin: "https://www.linkedin.com/in/belma-tost" },
    { name: "Dr. Öğr. Üyesi Burçin Ataseven Doğru", company: "İstanbul Kültür Üniversitesi", title: "İktisadi ve İdari Bilimler Fakültesi", image: "/images/burcin-ataseven.jpg", linkedin: "https://www.linkedin.com/in/dr-bur%C3%A7in-ataseven-do%C4%9Fru-689800250/" },
    { name: "Öğr. Gör. Ezgi Delen", company: "İzmir Bakırçay Üniversitesi", title: "Girişimcilik Atölyesi ve Yarışmalar Koordinatörlüğü", image: "/images/ezgi-delen.jpg", linkedin: "https://www.linkedin.com/in/ezgi-delen" },
    { name: "Kenan Keleş", company: "Palmiye Yazılım Teknolojileri Tic. Ltd. Şti.", title: "Co-Founder", image: "/images/kenan-keles.jpg", linkedin: "https://www.linkedin.com/in/mak-m%C3%BCh-kenan-kele%C5%9F-b4336a38/" },
    { name: "Süleyman Bayramoğlu", company: "Pexa Boru Sanayi Anonim Şirketi", title: "CEO", image: "/images/suleyman-bayramoglu.jpg", linkedin: "https://www.linkedin.com/in/suleyman-bayramoglu/" },
    { name: "Günalp Uysal", company: "Beezsoft", title: "Founder", image: "/images/gunalp-uysal.jpg", linkedin: "https://www.linkedin.com/in/gunalpuysal/" },
    { name: "Emre Gül", company: "FiProduct – VRHistoria", title: "Product Manager", image: "/images/emre-gul.jpg", linkedin: "https://www.fiproduct.com/" },
    { name: "Melis Dünya Sezer Türker", company: "FiProduct - VRHistoria", title: "Kreatif Direktör", image: "/images/melis-dunya-sezer.jpg", linkedin: "https://www.fiproduct.com/" },
    { name: "Müge Bezgin", company: "Startup Centrum", title: "Co-Founder", image: "/images/muge-bezgin.jpg", linkedin: "https://www.linkedin.com/in/mugebezgin/" },
    { name: "Doç. Dr. Meri Taksi Deveciyan", company: "İstanbul Kültür Üniversitesi", title: "İktisadi ve İdari Bilimler Fakültesi", image: "/images/meri-taksi.jpg", linkedin: "https://www.linkedin.com/in/meritaksideveciyan/" },
    { name: "Doğukan Gözalp", company: "Startup Centrum", title: "Business Developer & Start-up Mentor", image: "/images/dogukan-gozalp.jpg", linkedin: "https://www.linkedin.com/in/dogukanozalp/" },
    { name: "Tuncay Işıkçı", company: "Malogra Danışmanlık", title: "Finansal Yönetim Ekip Lideri", image: "/images/tuncay-isikci.jpg", linkedin: "https://www.linkedin.com/in/tuncay-i%C5%9F%C4%B1k%C3%A7%C4%B1-20b978222/" },
    { name: "Yusuf Kelpetin", company: "AtakDx", title: "Founder", image: "/images/yusuf-yilmaz-mentor.jpg", linkedin: "https://www.linkedin.com/in/yusuf-kelpetin-a016533a/" }
];

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function slugify(text: string): string {
    const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    };
    return text
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

async function importLegacyData() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`\n📦 ${isDryRun ? '[DRY RUN] ' : ''}İKÜANTS TEKMER — Legacy Public Data Consolidation & Migration\n`);

    try {
        await prisma.$connect();

        // 1. ENTREPRENEURS CONSOLIDATION
        console.log('=== [1] GİRİŞİMCİLER (ENTREPRENEURS) EŞLEŞTİRME & İÇE AKTARMA ===');
        const legacyEntrepreneurs = siteContent.entrepreneurs.list;
        const dbEntrepreneurs = await prisma.entrepreneur.findMany();

        console.log(`Public Legacy Girişimci Sayısı: ${legacyEntrepreneurs.length}`);
        console.log(`Mevcut DB Girişimci Sayısı: ${dbEntrepreneurs.length}`);

        let importedEnts = 0;
        let matchedEnts = 0;

        for (let i = 0; i < legacyEntrepreneurs.length; i++) {
            const leg = legacyEntrepreneurs[i];
            const normLegName = normalizeText(leg.name);

            // Match against DB records
            const match = dbEntrepreneurs.find(db => {
                const normDbName = normalizeText(db.name);
                return normDbName.includes(normLegName.slice(0, 10)) || normLegName.includes(normDbName.slice(0, 10));
            });

            if (match) {
                matchedEnts++;
                console.log(`  ✓ Eşleşti: "${leg.name}" <==> DB: "${match.name}" (ID: ${match.id})`);
                // Update missing fields if needed
                if (!isDryRun && (!match.shortDesc || !match.keywords)) {
                    await prisma.entrepreneur.update({
                        where: { id: match.id },
                        data: {
                            shortDesc: match.shortDesc || leg.service,
                            keywords: match.keywords || (leg.keywords ? JSON.stringify(leg.keywords) : null),
                        }
                    });
                }
            } else {
                console.log(`  + Yeni DB Kaydı Oluşturuluyor: "${leg.name}"`);
                importedEnts++;
                if (!isDryRun) {
                    await prisma.entrepreneur.create({
                        data: {
                            name: leg.name,
                            slug: slugify(leg.name),
                            sector: leg.type || 'Teknoloji',
                            shortDesc: leg.service || '',
                            keywords: leg.keywords ? JSON.stringify(leg.keywords) : null,
                            status: 'ACTIVE',
                            isPublished: true,
                            sortOrder: i,
                        }
                    });
                }
            }
        }

        console.log(`\nGirişimci Sonucu: ${matchedEnts} Eşleşen, ${importedEnts} Yeni İçe Aktarılan.\n`);

        // 2. MENTORS CONSOLIDATION
        console.log('=== [2] MENTÖRLER (MENTORS) EŞLEŞTİRME & İÇE AKTARMA ===');
        const dbMentors = await prisma.mentor.findMany();

        console.log(`Public Static Mentör Sayısı: ${staticMentors.length}`);
        console.log(`Mevcut DB Mentör Sayısı: ${dbMentors.length}`);

        let importedMentors = 0;
        let matchedMentors = 0;

        for (let i = 0; i < staticMentors.length; i++) {
            const leg = staticMentors[i];
            const normName = normalizeText(leg.name);

            const match = dbMentors.find(db => {
                const fullDbName = normalizeText(`${db.name} ${db.surname}`);
                return fullDbName.includes(normName.slice(0, 10)) || normName.includes(fullDbName.slice(0, 10));
            });

            if (match) {
                matchedMentors++;
                console.log(`  ✓ Eşleşti: "${leg.name}" <==> DB: "${match.name} ${match.surname}" (ID: ${match.id})`);
                // Update missing image / linkedin if DB is missing them
                if (!isDryRun && (leg.image || leg.linkedin)) {
                    await prisma.mentor.update({
                        where: { id: match.id },
                        data: {
                            imageUrl: match.imageUrl || leg.image,
                            linkedin: match.linkedin || leg.linkedin,
                            company: match.company || leg.company,
                            title: match.title || leg.title,
                        }
                    });
                }
            } else {
                console.log(`  + Yeni DB Mentör Oluşturuluyor: "${leg.name}"`);
                importedMentors++;
                const nameParts = leg.name.split(' ');
                const surname = nameParts.pop() || '';
                const name = nameParts.join(' ') || surname;

                if (!isDryRun) {
                    await prisma.mentor.create({
                        data: {
                            name,
                            surname,
                            company: leg.company,
                            title: leg.title,
                            imageUrl: leg.image,
                            linkedin: leg.linkedin,
                            isActive: true,
                            sortOrder: i,
                        }
                    });
                }
            }
        }

        console.log(`\nMentör Sonucu: ${matchedMentors} Eşleşen, ${importedMentors} Yeni İçe Aktarılan.\n`);

        console.log('============================================================');
        console.log('🎉 Veri Konsolidasyonu & İçe Aktarma İşlemi Tamamlandı!');
        console.log('============================================================\n');

    } catch (e: any) {
        console.error('❌ İçe aktarma sırasında hata:', e.message || e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

importLegacyData();
