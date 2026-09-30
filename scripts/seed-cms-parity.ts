import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding comprehensive CMS parity data for İKÜANTS TEKMER...');

    // 1. BOARD MEMBERS (Kurullar)
    console.log('Seeding Board Members (Yönetim, Değerlendirme, Danışma)...');
    
    // Danışma Kurulu
    const danismaKurulu = [
        { name: "Cengiz ULTAV", title: "İKÜ Mütevelli Heyet Üyesi, TTGV Yönetim Kurulu Başkanı, VESTEL Ventures Yönetim Kurulu Üyesi", imageUrl: "/images/cengiz-ultav.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 1 },
        { name: "Kadir TAMRAK", title: "AIVASOFT Kurucu Ortak", imageUrl: "/images/kadir-tamrak.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 2 },
        { name: "Cem UÇAR", title: "FUNEXAGON Kurucu Ortak", imageUrl: "/images/cem-ucar.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 3 },
        { name: "Elyar DAVARAN", title: "BLIZARD GAMES Gaming Art Director", imageUrl: "/images/elyar-davaran.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 4 },
        { name: "Emin Kağan KAYAK", title: "INCREA360 Tasarım Merkezi Teknoloji Yöneticisi", imageUrl: "/images/emin-kagan-kayak.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 5 },
        { name: "Onur YOLAY", title: "Boğaziçi Üniversitesi Hedefli Tedavi Teknolojileri Merkezi Proje ve IP Yöneticisi, INNOWAY R&G Kurucu Ortak", imageUrl: "/images/onur-yolay.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 6 },
        { name: "Serkan KAV", title: "Y İNOVASYON ve TEKNOLOJİ A.Ş.", imageUrl: "/images/serkan-kav.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 7 },
        { name: "Emrah CEBECİOĞLU", title: "CPA INTERNATIONAL TÜRKİYE Kurucu Ortak", imageUrl: "/images/emrah-cebecioglu.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 8 }
    ];

    // Yönetim Kurulu
    const yonetimKurulu = [
        { name: "Dr. Bahar Akıngüç Günver", title: "Yönetim Kurulu Başkanı", imageUrl: "/images/bahar-akinguc-gunver.jpg", duty: "Başkan", boardType: "YONETIM", sortOrder: 1 },
        { name: "Prof. Dr. Gülce Öğrüç Martins Riberio da Silva Lourenço", title: "Yönetim Kurulu Başkan Vekili", imageUrl: "/images/gulce-ogruc-ildiz.jpg", imageStyle: "scale-125 origin-top object-top", duty: "Başkan Vekili", boardType: "YONETIM", sortOrder: 2 },
        { name: "Yusuf Yılmaz", title: "Yönetim Kurulu Başkan Vekili", imageUrl: "/images/yusuf-yilmaz.jpg", duty: "Başkan Vekili", boardType: "YONETIM", sortOrder: 3 },
        { name: "Dr. Öğr. Üyesi Ceren Bilgici", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/ceren-bilgici.jpg", imageStyle: "object-top", duty: "Üye", boardType: "YONETIM", sortOrder: 4 },
        { name: "Dr. Öğr. Üyesi Ender Demir", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/ender-demir.jpg", imageStyle: "object-top", duty: "Üye", boardType: "YONETIM", sortOrder: 5 },
        { name: "Dr. Öğr. Üyesi Artür Yetvart Mumcu", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/artur-yetvart-mumcu.jpg", duty: "Üye", boardType: "YONETIM", sortOrder: 6 },
        { name: "Av. R. İmren Öner Topaloğlu", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/imren-oner-topaloglu.jpg", imageStyle: "object-top", duty: "Üye", boardType: "YONETIM", sortOrder: 7 }
    ];

    // Değerlendirme Kurulu
    const degerlendirmeKurulu = [
        { name: "Duygu Yücesoy Manyaslı", title: "KOSGEB İkitelli Müdürü", organization: "KOSGEB", imageUrl: "/images/duygu-yucesoy-manyasli.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 1 },
        { name: "Dr. Artür Yetvart Mumcu", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/artur-yetvart-mumcu.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 2 },
        { name: "Prof. Dr. Akhan Akbulut", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/akhan-akbulut.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 3 },
        { name: "Dr. Zeynep Gergin", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/zeynep-gergin.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 4 },
        { name: "Gökhan Uluçay", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/gokhan-ulucay.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 5 }
    ];

    for (const b of [...danismaKurulu, ...yonetimKurulu, ...degerlendirmeKurulu]) {
        const existing = await prisma.boardMember.findFirst({
            where: { fullName: b.name, boardType: b.boardType }
        });
        if (!existing) {
            await prisma.boardMember.create({
                data: {
                    fullName: b.name,
                    title: b.title,
                    organization: b.organization || 'İKÜANTS TEKMER',
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
    const teamMembers = [
        {
            fullName: "Hatice Tuğsavul",
            title: "TEKMER Müdürü",
            department: "YÖNETİM",
            bio: "Girişimcilik ekosisteminde 20 yılı aşkın süredir ulusal ve uluslararası kuluçka merkezleri, Teknoloji Transfer Ofisleri, TEKMER'lerde görev yapmaktadır. Eğitim ve etkinlik düzenleme, danışmanlık, mentörlük, proje yürütücülüğü, girişimci-yatırımcı buluşturmaları, ağ kurma ve sürdürülebilirlik yetkin olduğu alanlardır.",
            linkedin: "https://www.linkedin.com/in/hatice-tugsavul-76729616/",
            email: "bilgi@ikuantstekmer.com",
            phone: "0212 498 41 62",
            imageUrl: "/images/hatice-tugsavul.jpg",
            sortOrder: 1,
        },
        {
            fullName: "Alperen Tağman",
            title: "Teknoloji Geliştirme Uzmanı",
            department: "TEKNOLOJİ VE OPERASYON",
            bio: "RTTP (Registered Technology Transfer Professional). Girişimcilik ekosistemini güçlendirmek adına aktif çalışmalar yürütmektedir. Aynı zamanda TEKMER alanında bilgi birikimiyle akademik programlar, ön kuluçka ve kuluçka süreçleri kapsamında girişimcilere rehberlik ve organizasyonel yönetim desteği sağlamaktadır. Şirketlere danışmanlık sunmakta olup, teknoloji transferi ve inovasyon yönetimi alanında stratejik iş geliştirme ve proje süreçlerine liderlik etmektedir.",
            linkedin: "https://www.linkedin.com/in/alperentagmann/",
            email: "alperen.tagman@ikuantstekmer.com",
            phone: "0212 498 41 03",
            imageUrl: "/images/alperen-tagman.jpg",
            sortOrder: 2,
        }
    ];

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
    const partners = [
        {
            name: "MALOGRA",
            logoUrl: "/images/malogra.jpeg",
            description: "Finansal yönetim çözümleri, banka ilişkileri, bütçe ve raporlama, teşvik ve hibe danışmanlığı ile ihracat süreçlerinde firmalara stratejik rehberlik sunmaktadır.",
            websiteUrl: "https://www.malogra.com/",
            linkedinUrl: "https://www.linkedin.com/company/malogradanismanlik/",
            partnerGroup: "STAKEHOLDER",
            sortOrder: 1,
        },
        {
            name: "StartupCentrum",
            logoUrl: "/images/startupcentrum-cover-jpg.jpg",
            description: "Girişimcilik ekosisteminin verilerini tutan, girişimcileri ve yatırımcıları bir araya getiren dijital platform.",
            websiteUrl: "https://startupcentrum.com/tr",
            linkedinUrl: "https://www.linkedin.com/company/startupcentrum/",
            partnerGroup: "ECOSYSTEM",
            sortOrder: 2,
        },
        {
            name: "Başakşehir Living Lab",
            logoUrl: "/images/başakşehirlivinglab.png",
            description: "Akıllı şehircilik ve inovasyon alanında projeler geliştiren, girişimcilere kuluçka ve laboratuvar imkanları sunan yaşam laboratuvarı.",
            websiteUrl: "https://basaksehirlivinglab.com/",
            linkedinUrl: "https://www.linkedin.com/company/basaksehirlivinglab/",
            partnerGroup: "STAKEHOLDER",
            sortOrder: 3,
        }
    ];

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
    const facilities = [
        {
            title: "Broadcasting Stüdyosu",
            description: "Profesyonel yayın ve podcast kayıtları için tam donanımlı stüdyo. Yüksek kaliteli ses ve görüntü ekipmanları ile içerik üreticilerine hizmet vermektedir.",
            facilityType: "STUDIO",
            iconName: "Monitor",
            featuresJson: JSON.stringify(["Profesyonel kamera sistemi", "Ses yalıtımı", "Canlı yayın altyapısı"]),
            sortOrder: 1,
        },
        {
            title: "AR/VR Stüdyosu",
            description: "Artırılmış ve sanal gerçeklik projelerinin geliştirilmesi için özel donanımlı laboratuvar. VR headset'ler ve geliştirme araçları mevcuttur.",
            facilityType: "STUDIO",
            iconName: "Gamepad2",
            featuresJson: JSON.stringify(["VR Headset'ler", "Motion capture", "3D modelleme istasyonları"]),
            sortOrder: 2,
        },
        {
            title: "Sanal Çekim Stüdyosu",
            description: "Green screen ve sanal set teknolojileri ile profesyonel video prodüksiyon imkanı sunan çekim stüdyosu.",
            facilityType: "STUDIO",
            iconName: "Video",
            featuresJson: JSON.stringify(["Green screen", "Profesyonel aydınlatma", "Sanal set yazılımları"]),
            sortOrder: 3,
        },
        {
            title: "Ortak Genel Çalışma Alanları",
            description: "Girişimcilerin ve takımların birlikte çalışabileceği açık ofis alanları. Modern mobilyalar ve yüksek hızlı internet altyapısı.",
            facilityType: "WORK_AREA",
            iconName: "Laptop",
            sortOrder: 4,
        },
        {
            title: "Tematik Çalışma Alanları",
            description: "Belirli sektörlere ve projelere odaklanan özel çalışma alanları. Yaratıcı endüstrilere yönelik projeler için ideal ortam.",
            facilityType: "WORK_AREA",
            iconName: "Coffee",
            sortOrder: 5,
        },
        {
            title: "Toplantı Odası",
            description: "Profesyonel görüşmeler, yatırımcı sunumları ve takım toplantıları için donanımlı toplantı odaları.",
            facilityType: "WORK_AREA",
            iconName: "MessageSquare",
            sortOrder: 6,
        }
    ];

    for (const f of facilities) {
        const existing = await prisma.facility.findFirst({ where: { title: f.title } });
        if (!existing) {
            await prisma.facility.create({ data: f });
        }
    }
    console.log('✅ Facilities seeded.');

    // 5. SERVICES (Hizmetlerimiz)
    console.log('Seeding Services...');
    const services = [
        {
            title: "Ofis Alanı ve Altyapı Desteği",
            iconName: "Building2",
            colorGradient: "from-purple-500 to-pink-500",
            description: "Girişimcilere işlerini kurabilecekleri modern ofis alanları sağlıyoruz.",
            highlight: "Teknoloji odaklı girişimler için tam donanımlı çalışma alanları",
            detailsJson: JSON.stringify([
                "Düşük maliyetli ofis kiralama imkanı",
                "Ar-Ge çalışmalarına uygun teknik altyapı",
                "Laboratuvar ekipmanları ve donanımlar",
                "Yazılım araçları ve geliştirme ortamları",
                "Yüksek hızlı internet ve BT altyapısı"
            ]),
            sortOrder: 1,
        },
        {
            title: "Mentorluk ve Danışmanlık Hizmetleri",
            iconName: "Users",
            colorGradient: "from-cyan-500 to-blue-500",
            description: "Deneyimli mentörler ve danışmanlardan birebir destek alın.",
            highlight: "20+ alanında uzman mentör kadrosu",
            detailsJson: JSON.stringify([
                "İş planı oluşturma rehberliği",
                "Pazarlama stratejileri geliştirme",
                "Finansal yönetim danışmanlığı",
                "Yatırımcı ilişkileri yönetimi",
                "Stratejik karar alma desteği"
            ]),
            sortOrder: 2,
        },
        {
            title: "Eğitim ve Gelişim Fırsatları",
            iconName: "GraduationCap",
            colorGradient: "from-green-500 to-teal-500",
            description: "Girişimcilerin ve ekiplerinin gelişimi için kapsamlı eğitim programları.",
            highlight: "Üniversite iş birliğiyle düzenlenen sertifikalı programlar",
            detailsJson: JSON.stringify([
                "İş stratejileri ve yönetim eğitimleri",
                "Pazarlama ve satış atölyeleri",
                "Finansal okuryazarlık programları",
                "Ekip yönetimi ve liderlik",
                "Yeni teknolojiler ve inovasyon seminerleri",
                "Firmalarımız için Yüksek Lisans burs imkanı"
            ]),
            sortOrder: 3,
        },
        {
            title: "Yatırımcı Ağı ve İş Birlikleri",
            iconName: "Handshake",
            colorGradient: "from-orange-500 to-red-500",
            description: "Geniş iş ağı ile yatırımcı ve iş birliği fırsatları sunuyoruz.",
            highlight: "Melek yatırımcı ve VC ağına doğrudan erişim",
            detailsJson: JSON.stringify([
                "Potansiyel yatırımcılarla tanışma etkinlikleri",
                "Demo Day ve pitch sunumları",
                "Girişimciler arası networking",
                "Sektörel iş birlikleri kurma",
                "Ortak proje geliştirme imkanları"
            ]),
            sortOrder: 4,
        },
        {
            title: "Ar-Ge Destekleri ve Vergi İndirimleri",
            iconName: "FileCheck",
            colorGradient: "from-indigo-500 to-purple-500",
            description: "Ar-Ge teşvikleri ve devlet desteklerinden yararlanın.",
            highlight: "Devlet destekleriyle Ar-Ge maliyetlerinizi minimize edin",
            detailsJson: JSON.stringify([
                "Ar-Ge vergi indirimleri rehberliği",
                "TÜBİTAK ve KOSGEB destek başvuruları",
                "Hibe programları danışmanlığı",
                "SGK teşvikleri bilgilendirmesi",
                "Teknoloji geliştirme bölgesi avantajları"
            ]),
            sortOrder: 5,
        }
    ];

    for (const s of services) {
        const existing = await prisma.serviceItem.findFirst({ where: { title: s.title } });
        if (!existing) {
            await prisma.serviceItem.create({ data: s });
        }
    }
    console.log('✅ Services seeded.');

    // 6. LEGISLATIONS (Mevzuat)
    console.log('Seeding Legislation documents...');
    const regulations = [
        {
            title: "KOSGEB Destek Programları Yönetmeliği",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/kosgeb-destek-programlari-yonetmeligi.pdf",
            description: "Küçük ve Orta Ölçekli İşletmeleri Geliştirme ve Destekleme İdaresi Başkanlığı destek programları",
            category: "YONETMELIK",
            sortOrder: 1,
        },
        {
            title: "Cumhurbaşkanlığı Kararnamesi",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/cumhurbaskanligi-kararnamesi.pdf",
            description: "Teknoloji geliştirme bölgelerine ilişkin Cumhurbaşkanlığı kararnamesi",
            category: "KARARNAME",
            sortOrder: 2,
        },
        {
            title: "7263 Sayılı Kanun",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/7263-sayili-kanun.pdf",
            description: "Teknoloji Geliştirme Bölgeleri Kanunu ile bazı kanunlarda değişiklik yapılmasına dair kanun",
            category: "KANUN",
            sortOrder: 3,
        },
        {
            title: "5746 Ar-Ge Faaliyetlerinin Desteklenmesi Kanunu Yönetmeliği",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/5746-arge-faaliyetlerinin-desteklenmesi-kanunu-yonetmeligi.pdf",
            description: "Araştırma, geliştirme ve tasarım faaliyetlerinin desteklenmesine ilişkin yönetmelik",
            category: "YONETMELIK",
            sortOrder: 4,
        },
        {
            title: "4691 Sayılı Teknoloji Geliştirme Bölgeleri Yönetmeliği",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/4691-sayili-teknoloji-gelistirme-bolgeleri-yonetmeligi.pdf",
            description: "Teknoloji geliştirme bölgelerinin kuruluşu, işleyişi ve denetimine ilişkin yönetmelik",
            category: "YONETMELIK",
            sortOrder: 5,
        },
        {
            title: "4691-5746 Kanunlarında Değişiklik Düzenlemesi",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/4691-5746-kanunlarinda-degisiklik-duzenlenmesi.pdf",
            description: "İlgili kanunlarda yapılan değişiklik ve düzenlemeler",
            category: "TEBLIG",
            sortOrder: 6,
        },
        {
            title: "4691 Sayılı Teknoloji Geliştirme Bölgeleri Kanunu",
            externalUrl: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/4691-sayili-teknoloji-gelistirme-bolgeleri-kanunu.pdf",
            description: "Teknoloji geliştirme bölgelerinin kuruluşu, yönetimi ve çalışmalarına ilişkin ana kanun",
            category: "KANUN",
            sortOrder: 7,
        }
    ];

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
