import { Gauge, Users, Shield, Zap, Gamepad2, Code2, DollarSign, Globe, Smartphone, Briefcase, Building2, GraduationCap, Lightbulb, FileCheck } from "lucide-react";

export const siteContent = {
    hero: {
        status: "İKÜANTS TEKMER",
        title: {
            line1: "GELECEĞE KÜLTÜR",
            line2: "KATIYORUZ"
        },
        description: "Geleceği birlikte şekillendiriyoruz. İnovasyon ve teknoloji merkezimizde girişimcileri, kurumları ve yatırımcıları bir araya getiriyoruz.",
        buttons: {
            primary: "HEMEN BAŞVUR",
            secondary: "DETAYLI BİLGİ"
        },
        stats: [
            { title: "Yenilikçi Teknolojiler", subtitle: "AI & Cloud", icon: Code2 },
            { title: "Tasarım", subtitle: "Oyun & Animasyon", icon: Gamepad2 },
            { title: "Geliştirme", subtitle: "Mobil & UI/UX", icon: Smartphone },
            { title: "Sinerji", subtitle: "Fintech & Biotech", icon: Lightbulb },
        ]
    },
    techCategories: [
        { title: "Yenilikçi Teknolojiler", items: ["Yapay Zekâ", "Cloud", "Mobilite", "Gömülü Sistemler"] },
        { title: "Tasarım", items: ["Kısa Film", "Animasyon", "Yeni Medya", "Reklam Temaları"] },
        { title: "Geliştirme", items: ["UI/UX Tasarım", "Mobil Teknolojiler", "Oyun Kümelenmeleri"] },
        { title: "Sinerji", items: ["Edutech", "Medikal Cihaz", "Biyomedikal", "Biyoteknoloji", "Fintech"] },
    ],
    differences: {
        header: "NEDEN İKÜANTS TEKMER?",
        subheader: "// AVANTAJLAR",
        description: "Girişimcilere ve işletmelere ön inkübasyon, inkübasyon ve büyüme aşamalarında; iş geliştirme, finansal kaynaklara erişim, yönetim desteği, danışmanlık, mentorluk, ofis imkânı ve geniş bir iş ağına katılım fırsatları sunuyoruz.",
        features: [
            {
                id: "01",
                title: "AR-GE VE TASARIM İNDİRİMİ",
                desc: "Ar-Ge ve yenilik veya tasarım harcamalarının tamamı (%100'ü) kurum kazancının tespitinde indirim konusu yapılmaktadır.",
                icon: FileCheck,
                color: "from-blue-500 to-cyan-500"
            },
            {
                id: "02",
                title: "GELİR VERGİSİ STOPAJI TEŞVİKİ",
                desc: "Teknoloji merkezlerinde çalışan Ar-Ge ve destek personelinin elde ettikleri ücretler üzerinden hesaplanan gelir vergisinin belirli oranları vergiden indirilebilir.",
                icon: DollarSign,
                color: "from-green-500 to-emerald-500"
            },
            {
                id: "03",
                title: "SİGORTA PRİMİ DESTEĞİ",
                desc: "Teknoloji merkezlerinde çalışan Ar-Ge ve destek personelinin elde ettikleri ücretler üzerinden hesaplanan sigorta primi işveren hissesinin %50'si karşılanmaktadır.",
                icon: Shield,
                color: "from-purple-500 to-pink-500"
            },
            {
                id: "04",
                title: "DAMGA VERGİSİ İSTİSNASI",
                desc: "Ar-Ge ve yenilik faaliyetleri ile ilgili olarak düzenlenen kağıtlar damga vergisinden istisnadır.",
                icon: FileCheck, // Reusing FileCheck or finding a better one like Stamp if imported
                color: "from-red-500 to-orange-500"
            },
            {
                id: "05",
                title: "GÜMRÜK VERGİSİ İSTİSNASI",
                desc: "Ar-Ge, yenilik ve tasarım projeleri ile ilgili araştırmalarda kullanılmak üzere ithal edilen eşya gümrük vergisinden ve diğer harcamalardan istisnadır.",
                icon: Globe,
                color: "from-indigo-500 to-blue-600"
            },
            {
                id: "06",
                title: "TEMEL BİLİMLER DESTEĞİ",
                desc: "En az lisans derecesine sahip Ar-Ge personeli için asgari ücretin brüt tutarı kadarlık kısmı Bakanlık bütçesinden karşılanır.",
                icon: GraduationCap,
                color: "from-yellow-400 to-orange-500"
            }
        ]
    },
    programs: {
        header: "PROGRAMLARIMIZ",
        items: [
            { name: "ANTSPARK Ön Kuluçka", desc: "Fikir aşamasındaki girişimciler için kapsamlı ön kuluçka programı", link: "/antspark-kulucka" },
            { name: "Glow Up Ideathon", desc: "Yaratıcı fikirlerin yarıştığı ideathon etkinliği", link: "/glow-ideathon" },
        ]
    },
    entrepreneurs: {
        header: "GİRİŞİMCİLERİMİZ",
        description: "İKÜANTS TEKMER bünyesinde yer alan girişimci ve işletmeler",
        list: [
            { id: 1, name: "PEXA BORU", type: "SANAYİ", level: "ACTIVE", icon: Building2, color: "text-blue-400" },
            { id: 2, name: "SERAZİO", type: "DANIŞMANLIK", level: "ACTIVE", icon: Briefcase, color: "text-purple-400" },
            { id: 3, name: "ALEAZA", type: "TEKNOLOJİ", level: "ACTIVE", icon: Code2, color: "text-green-400" },
            { id: 4, name: "ABILITYPOOL", type: "HR TECH", level: "ACTIVE", icon: Users, color: "text-cyan-400" },
            { id: 5, name: "ATAKDX", type: "MÜHENDİSLİK", level: "ACTIVE", icon: Gauge, color: "text-orange-400" },
            { id: 6, name: "MATH TALK", type: "EDUTECH", level: "ACTIVE", icon: GraduationCap, color: "text-yellow-400" },
            { id: 7, name: "PALMİYE BİLGİ", type: "BİLGİ TEKNOLOJİLERİ", level: "ACTIVE", icon: Globe, color: "text-pink-400" },
            { id: 8, name: "KULÜPBİRLİĞİM", type: "BİLİŞİM", level: "ACTIVE", icon: Smartphone, color: "text-indigo-400" },
            { id: 9, name: "FiPRODUCT", type: "ÜRÜN GELİŞTİRME", level: "ACTIVE", icon: Lightbulb, color: "text-red-400" },
        ]
    },
    supports: {
        header: "HİZMETLERİMİZ",
        description: "Girişimcilere sunduğumuz destekler ve imkanlar",
        items: [
            {
                title: "İş Geliştirme",
                desc: "Stratejik planlama, pazar analizi ve iş modelinizi güçlendirme desteği.",
                icon: Briefcase
            },
            {
                title: "Finansal Kaynaklara Erişim",
                desc: "KOSGEB destekleri, yatırım ağları ve hibe programlarına yönlendirme.",
                icon: DollarSign
            },
            {
                title: "Danışmanlık & Mentorluk",
                desc: "Deneyimli mentörlerden birebir danışmanlık ve rehberlik hizmeti.",
                icon: Users
            },
            {
                title: "Ofis İmkanı",
                desc: "Modern ve donanımlı çalışma alanları ile fiziksel altyapı desteği.",
                icon: Building2
            }
        ]
    },
    contact: {
        header: "İLETİŞİM",
        description: "Bizimle iletişime geçin, geleceği birlikte şekillendirelim.",
        info: {
            address: {
                title: "Adres",
                value: "Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14 A Bakırköy 34158 İstanbul"
            },
            email: {
                title: "E-Posta",
                value: "info@ikuantstekmer.com"
            },
            phone: {
                title: "Telefon",
                value: "(0212) 498 41 62"
            }
        }
    }
};
