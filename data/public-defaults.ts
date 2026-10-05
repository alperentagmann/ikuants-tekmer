/**
 * Public content of the original İKÜANTS TEKMER website (mentors, programs, team, boards,
 * partners, facilities, services). Single source for the seed scripts and the fallback the
 * public services return when the database is unreachable (e.g. a deploy without
 * DATABASE_URL). Once seeded, the content is managed in admin; these values never
 * override database records.
 */

export interface MentorDefault {
    name: string;
    surname: string;
    company: string;
    title: string;
    imageUrl: string;
    linkedin: string;
}

export const MENTOR_DEFAULTS: MentorDefault[] = [
    { name: "Zico Ufuk", surname: "Batum", company: "Ventures & Mentors League", title: "Founder", imageUrl: "/images/zico-ufuk-batum.jpg", linkedin: "https://www.linkedin.com/in/zico-ufuk-batum-51238950/" },
    { name: "Onur", surname: "Yolay", company: "Innoway R&D Kft.", title: "Co-Founder", imageUrl: "/images/onur-yolay.jpg", linkedin: "https://www.linkedin.com/in/onuryolay/" },
    { name: "Nizamettin Sami", surname: "Harputlu", company: "Startup Centrum", title: "Co-Founder", imageUrl: "/images/nizamettin-harputlu.jpg", linkedin: "https://www.linkedin.com/in/nizamettinsamiharputlu/" },
    { name: "Abdulsamet", surname: "Ekşi", company: "Türk Havacılık ve Uzay Sanayii", title: "Technology and Innovation Management", imageUrl: "/images/abdulsamet-eksi.jpg", linkedin: "https://www.linkedin.com/in/abdulsameteksi/" },
    { name: "Bikem", surname: "İnce İnanç", company: "Malogra Danışmanlık", title: "Founder", imageUrl: "/images/bikem-ince.jpg", linkedin: "https://www.linkedin.com/in/bikeminceinanc/" },
    { name: "Büşra", surname: "Altınsoy", company: "Pexa Boru Sanayi", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/busra-altinsoy.jpg", linkedin: "https://www.linkedin.com/in/busraaltinsoy/" },
    { name: "Sıla", surname: "Dinçer", company: "Ödeal", title: "R&D Manager", imageUrl: "/images/sila-dincer.jpg", linkedin: "https://www.linkedin.com/in/siladincer/" },
    { name: "Filiz", surname: "Aksoy", company: "Bilişim Teknolojileri", title: "Proje ve Ürün Yöneticisi", imageUrl: "/images/filiz-aksoy.png", linkedin: "https://www.linkedin.com/in/filiz-aksoy/" },
    { name: "Pelin", surname: "Özkuzey", company: "Satış & Pazarlama", title: "Danışman", imageUrl: "/images/pelin-ozkuzey.jpg", linkedin: "https://www.linkedin.com/in/pelin-ozkuzey-71223712/" },
    { name: "Belma", surname: "Tost", company: "Pluxee Türkiye", title: "Senior Service & Experience Designer", imageUrl: "/images/belma-tost.jpg", linkedin: "https://www.linkedin.com/in/belma-tost" },
    { name: "Dr. Öğr. Üyesi Burçin", surname: "Ataseven Doğru", company: "İstanbul Kültür Üniversitesi", title: "İktisadi ve İdari Bilimler Fakültesi", imageUrl: "/images/burcin-ataseven.jpg", linkedin: "https://www.linkedin.com/in/dr-bur%C3%A7in-ataseven-do%C4%9Fru-689800250/" },
    { name: "Öğr. Gör. Ezgi", surname: "Delen", company: "İzmir Bakırçay Üniversitesi", title: "Girişimcilik Atölyesi ve Yarışmalar Koordinatörlüğü", imageUrl: "/images/ezgi-delen.jpg", linkedin: "https://www.linkedin.com/in/ezgi-delen" },
    { name: "Kenan", surname: "Keleş", company: "Palmiye Yazılım Teknolojileri Tic. Ltd. Şti.", title: "Co-Founder", imageUrl: "/images/kenan-keles.jpg", linkedin: "https://www.linkedin.com/in/mak-m%C3%BCh-kenan-kele%C5%9F-b4336a38/" },
    { name: "Süleyman", surname: "Bayramoğlu", company: "Pexa Boru Sanayi Anonim Şirketi", title: "CEO", imageUrl: "/images/suleyman-bayramoglu.jpg", linkedin: "https://www.linkedin.com/in/suleyman-bayramoglu/" },
    { name: "Günalp", surname: "Uysal", company: "Beezsoft", title: "Founder", imageUrl: "/images/gunalp-uysal.jpg", linkedin: "https://www.linkedin.com/in/gunalpuysal/" },
    { name: "Emre", surname: "Gül", company: "FiProduct – VRHistoria", title: "Product Manager", imageUrl: "/images/emre-gul.jpg", linkedin: "https://www.fiproduct.com/" },
    { name: "Melis Dünya", surname: "Sezer Türker", company: "FiProduct - VRHistoria", title: "Kreatif Direktör", imageUrl: "/images/melis-dunya-sezer.jpg", linkedin: "https://www.fiproduct.com/" },
    { name: "Müge", surname: "Bezgin", company: "Startup Centrum", title: "Co-Founder", imageUrl: "/images/muge-bezgin.jpg", linkedin: "https://www.linkedin.com/in/mugebezgin/" },
    { name: "Doç. Dr. Meri", surname: "Taksi Deveciyan", company: "İstanbul Kültür Üniversitesi", title: "İktisadi ve İdari Bilimler Fakültesi", imageUrl: "/images/meri-taksi.jpg", linkedin: "https://www.linkedin.com/in/meritaksideveciyan/" },
    { name: "Doğukan", surname: "Gözalp", company: "Startup Centrum", title: "Business Developer & Start-up Mentor", imageUrl: "/images/dogukan-gozalp.jpg", linkedin: "https://www.linkedin.com/in/dogukanozalp/" },
    { name: "Tuncay", surname: "Işıkçı", company: "Malogra Danışmanlık", title: "Finansal Yönetim Ekip Lideri", imageUrl: "/images/tuncay-isikci.jpg", linkedin: "https://www.linkedin.com/in/tuncay-i%C5%9F%C4%B1k%C3%A7%C4%B1-20b978222/" },
    { name: "Yusuf", surname: "Kelpetin", company: "AtakDx", title: "Founder", imageUrl: "/images/yusuf-yilmaz-mentor.jpg", linkedin: "https://www.linkedin.com/in/yusuf-kelpetin-a016533a/" },
];

export interface ProgramDefault {
    name: string;
    slug: string;
    programType: string;
    tagline: string;
    shortDesc: string;
    duration: string;
    quota?: string;
    mentorHours?: string;
    /** JSON array of feature titles */
    features: string;
    applyStatus: string;
    ctaText: string;
    ctaLink: string;
    isFeatured: boolean;
    sortOrder: number;
}

export const PROGRAM_DEFAULTS: ProgramDefault[] = [
    {
        name: "ANTSPARK Ön Kuluçka Programı",
        slug: "antspark-on-kulucka",
        programType: "PRE_INCUBATION",
        tagline: "Fikrini büyüt, işine dönüştür, geleceğe imzanı at!",
        shortDesc: "Yenilikçi iş fikirlerine sahip girişimcileri fikir aşamasından ticarileşme sürecine taşıyan kapsamlı bir gelişim yolculuğu.",
        duration: "12 Hafta",
        quota: "20 Girişim",
        mentorHours: "70+ Saat",
        features: JSON.stringify(["Kapsamlı Eğitimler & Atölyeler", "Birebir Mentorluk Desteği", "Yatırımcı Buluşmaları", "Co-Working & Prototipleme Alanı", "TÜBİTAK & KOSGEB Hazırlık", "DEMODAY Final Sunumu"]),
        applyStatus: "OPEN",
        ctaText: "ANTSPARK'A BAŞVUR",
        ctaLink: "/antspark-basvuru",
        isFeatured: true,
        sortOrder: 1,
    },
    {
        name: "ANTSFire Kuluçka Programı",
        slug: "antsfire-kulucka",
        programType: "INCUBATION",
        tagline: "Kıvılcımı ateşe dönüştür, şirketini ölçekle!",
        shortDesc: "ANTSPARK mezunu veya Ar-Ge odaklı şirketleşmiş girişimler için kişiselleştirilmiş 12 aylık ileri seviye kuluçka programı.",
        duration: "12 Ay",
        quota: "10 Girişim",
        mentorHours: "Uygulamalı",
        features: JSON.stringify(["Kişiselleştirilmiş Eğitim Modülleri", "KPI Bazlı Performans Takibi", "Satış & Pilot Odaklı Mentorluk", "Yatırım & Data Room Hazırlığı", "Ofis & Altyapı Desteği", "Hukuk & Finans Danışmanlığı"]),
        applyStatus: "OPEN",
        ctaText: "ANTSFIRE'A BAŞVUR",
        ctaLink: "/antsfire-basvuru",
        isFeatured: true,
        sortOrder: 2,
    },
    {
        name: "Glow Up Ideathon",
        slug: "glow-up-ideathon",
        programType: "IDEATHON",
        tagline: "2 günde fikrini iş modeline dönüştür!",
        shortDesc: "Yenilikçi fikirlerin ortaya çıkarılması, geliştirilmesi ve girişimcilik ekosistemine kazandırılması amacıyla gerçekleştirilen yoğun bir fikir geliştirme programı.",
        duration: "2 Gün",
        features: JSON.stringify(["İş Modeli Geliştirme Eğitimi", "Sunum Teknikleri Workshop", "Uzman Mentorluk Desteği", "Jüri Önünde Final Sunumu", "Ödüller & Networking", "ANTSPARK'a Direkt Başvuru Hakkı"]),
        applyStatus: "UPCOMING",
        ctaText: "ETKİNLİĞE BAŞVUR",
        ctaLink: "/glowup-basvuru",
        isFeatured: false,
        sortOrder: 3,
    },
];

export interface BoardMemberDefault {
    name: string;
    title: string;
    imageUrl: string;
    imageStyle?: string;
    organization?: string;
    duty: string;
    boardType: string;
    sortOrder: number;
}

export const BOARD_DEFAULTS: BoardMemberDefault[] = [
    // Danışma Kurulu
    { name: "Cengiz ULTAV", title: "İKÜ Mütevelli Heyet Üyesi, TTGV Yönetim Kurulu Başkanı, VESTEL Ventures Yönetim Kurulu Üyesi", imageUrl: "/images/cengiz-ultav.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 1 },
    { name: "Kadir TAMRAK", title: "AIVASOFT Kurucu Ortak", imageUrl: "/images/kadir-tamrak.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 2 },
    { name: "Cem UÇAR", title: "FUNEXAGON Kurucu Ortak", imageUrl: "/images/cem-ucar.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 3 },
    { name: "Elyar DAVARAN", title: "BLIZARD GAMES Gaming Art Director", imageUrl: "/images/elyar-davaran.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 4 },
    { name: "Emin Kağan KAYAK", title: "INCREA360 Tasarım Merkezi Teknoloji Yöneticisi", imageUrl: "/images/emin-kagan-kayak.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 5 },
    { name: "Onur YOLAY", title: "Boğaziçi Üniversitesi Hedefli Tedavi Teknolojileri Merkezi Proje ve IP Yöneticisi, INNOWAY R&G Kurucu Ortak", imageUrl: "/images/onur-yolay.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 6 },
    { name: "Serkan KAV", title: "Y İNOVASYON ve TEKNOLOJİ A.Ş.", imageUrl: "/images/serkan-kav.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 7 },
    { name: "Emrah CEBECİOĞLU", title: "CPA INTERNATIONAL TÜRKİYE Kurucu Ortak", imageUrl: "/images/emrah-cebecioglu.jpg", duty: "Danışma Kurulu Üyesi", boardType: "DANISMA", sortOrder: 8 },
    // Yönetim Kurulu
    { name: "Dr. Bahar Akıngüç Günver", title: "Yönetim Kurulu Başkanı", imageUrl: "/images/bahar-akinguc-gunver.jpg", duty: "Başkan", boardType: "YONETIM", sortOrder: 1 },
    { name: "Prof. Dr. Gülce Öğrüç Martins Riberio da Silva Lourenço", title: "Yönetim Kurulu Başkan Vekili", imageUrl: "/images/gulce-ogruc-ildiz.jpg", imageStyle: "scale-125 origin-top object-top", duty: "Başkan Vekili", boardType: "YONETIM", sortOrder: 2 },
    { name: "Yusuf Yılmaz", title: "Yönetim Kurulu Başkan Vekili", imageUrl: "/images/yusuf-yilmaz.jpg", duty: "Başkan Vekili", boardType: "YONETIM", sortOrder: 3 },
    { name: "Dr. Öğr. Üyesi Ceren Bilgici", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/ceren-bilgici.jpg", imageStyle: "object-top", duty: "Üye", boardType: "YONETIM", sortOrder: 4 },
    { name: "Dr. Öğr. Üyesi Ender Demir", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/ender-demir.jpg", imageStyle: "object-top", duty: "Üye", boardType: "YONETIM", sortOrder: 5 },
    { name: "Dr. Öğr. Üyesi Artür Yetvart Mumcu", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/artur-yetvart-mumcu.jpg", duty: "Üye", boardType: "YONETIM", sortOrder: 6 },
    { name: "Av. R. İmren Öner Topaloğlu", title: "Yönetim Kurulu Üyesi", imageUrl: "/images/imren-oner-topaloglu.jpg", imageStyle: "object-top", duty: "Üye", boardType: "YONETIM", sortOrder: 7 },
    // Değerlendirme Kurulu
    { name: "Duygu Yücesoy Manyaslı", title: "KOSGEB İkitelli Müdürü", organization: "KOSGEB", imageUrl: "/images/duygu-yucesoy-manyasli.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 1 },
    { name: "Dr. Artür Yetvart Mumcu", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/artur-yetvart-mumcu.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 2 },
    { name: "Prof. Dr. Akhan Akbulut", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/akhan-akbulut.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 3 },
    { name: "Dr. Zeynep Gergin", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/zeynep-gergin.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 4 },
    { name: "Gökhan Uluçay", title: "İstanbul Kültür Üniversitesi", organization: "İKÜ", imageUrl: "/images/gokhan-ulucay.jpg", duty: "Değerlendirme Kurulu Üyesi", boardType: "DEGERLENDIRME", sortOrder: 5 },
];

export const TEAM_DEFAULTS = [
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
    },
];

export const PARTNER_DEFAULTS = [
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
    },
];

export interface FacilityDefault {
    title: string;
    description: string;
    facilityType: string;
    iconName?: string;
    featuresJson?: string;
    sortOrder: number;
}

/** Studios and work areas as listed on the original website. */
export const FACILITY_DEFAULTS: FacilityDefault[] = [
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
    },
];

/**
 * Verified shared spaces (seeded by prisma/seed-spaces.ts). Only verified facts: names and
 * the capacities of the three open meeting tables; unknown values stay empty.
 */
export const VERIFIED_SPACES: { title: string; code: string; type: string; capacity: number | null; equipment: string | null; description: string }[] = [
    { title: 'Broadcasting Stüdyosu', code: 'STUDIO-01', type: 'STUDIO', capacity: null, equipment: 'Kamera sistemi, ses yalıtımı, canlı yayın altyapısı', description: 'Profesyonel yayın ve podcast kayıtları için tam donanımlı stüdyo. Yüksek kaliteli ses ve görüntü ekipmanları ile içerik üreticilerine hizmet vermektedir.' },
    { title: 'AR/VR Stüdyosu', code: 'STUDIO-02', type: 'STUDIO', capacity: null, equipment: "VR Headset'ler, motion capture, 3D modelleme istasyonları", description: "Artırılmış ve sanal gerçeklik projelerinin geliştirilmesi için özel donanımlı laboratuvar. VR headset'ler ve geliştirme araçları mevcuttur." },
    { title: 'Sanal Çekim Stüdyosu', code: 'STUDIO-03', type: 'STUDIO', capacity: null, equipment: 'Green screen, profesyonel aydınlatma, sanal set yazılımları', description: 'Green screen ve sanal set teknolojileri ile profesyonel video prodüksiyon imkanı sunan çekim stüdyosu.' },
    { title: 'Prototipleme Laboratuvarı', code: 'LAB-01', type: 'LAB', capacity: null, equipment: null, description: 'Prototip geliştirme çalışmaları için laboratuvar alanı.' },
    { title: 'Seminer Alanı', code: 'SEMINAR-01', type: 'SEMINAR_AREA', capacity: null, equipment: null, description: 'Seminer, eğitim ve sunumlar için kullanılan alan.' },
    { title: 'Kapalı Toplantı Odası', code: 'MEETING-01', type: 'MEETING_ROOM', capacity: null, equipment: null, description: 'Kapalı toplantı odası.' },
    { title: 'Açık Toplantı Masası 1 — 8 Kişilik', code: 'OPEN-TABLE-01', type: 'OPEN_MEETING_TABLE', capacity: 8, equipment: null, description: '8 kişilik açık toplantı masası.' },
    { title: 'Açık Toplantı Masası 2 — 8 Kişilik', code: 'OPEN-TABLE-02', type: 'OPEN_MEETING_TABLE', capacity: 8, equipment: null, description: '8 kişilik açık toplantı masası.' },
    { title: 'Açık Toplantı Masası — 20 Kişilik', code: 'OPEN-TABLE-03', type: 'OPEN_MEETING_TABLE', capacity: 20, equipment: null, description: '20 kişilik açık toplantı masası.' },
];

export const SERVICE_DEFAULTS = [
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
    },
];
