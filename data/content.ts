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
            { id: 1, name: "Pexa Boru San. A.Ş.", type: "Sanayi", level: "ACTIVE", service: "", keywords: [], icon: Building2, color: "text-blue-400" },
            { id: 2, name: "Serazio Danışmanlık İletişim Ve Satış Tic. Ltd. Şti.", type: "E-Ticaret / Marketplace / İç Mimari", level: "ACTIVE", service: "Premium iç mekân markalarını mimarlar ve son kullanıcılarla buluşturan küratörlü pazaryeri platformudur.", keywords: ["premium mobilya", "lüks dekorasyon", "interior marketplace", "iç mimari", "b2b", "b2c", "tasarım pazaryeri"], icon: Briefcase, color: "text-purple-400" },
            { id: 3, name: "Aleaza Development Solutions", type: "Robotik / Güvenlik Teknolojileri", level: "ACTIVE", service: "Güvenlik ve savunma ile iş sağlığı alanlarına yönelik akıllı robotik çözümler geliştirir.", keywords: ["robotik", "güvenlik robotu", "endüstriyel otomasyon", "insan-makine etkileşimi", "proaktif güvenlik", "otonom sistem"], icon: Code2, color: "text-green-400" },
            { id: 4, name: "Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.", type: "Sosyal Etki / Kurumsal Gönüllülük / SaaS", level: "ACTIVE", service: "Kurumların gönüllülük, bağış ve sosyal sorumluluk süreçlerini dijitalleştiren sosyal etki platformudur.", keywords: ["kurumsal gönüllülük", "csr", "sosyal etki", "stk", "bağış", "iyilik platformu", "saas"], icon: Users, color: "text-cyan-400" },
            { id: 5, name: "Atakdx Mühendislik Ve Danışmanlık Hizmetleri Ltd. Şti.", type: "Mühendislik", level: "ACTIVE", service: "", keywords: [], icon: Gauge, color: "text-orange-400" },
            { id: 6, name: "MathTalk", type: "Eğitim Teknolojileri / Yapay Zekâ", level: "ACTIVE", service: "Doğal dil ile matematik problemlerini anlayıp çözüm üreten AI destekli problem çözüm platformudur.", keywords: ["ai matematik", "nlp", "edtech", "problem çözme", "mühendislik hesaplama", "öğrenci platformu"], icon: GraduationCap, color: "text-yellow-400" },
            { id: 7, name: "Palmiye Bilgi Teknolojileri Sanayi ve Ticaret Limited Şirketi", type: "GovTech / Satınalma Süreç Yazılımı", level: "ACTIVE", service: "Doğrudan temin satınalma süreçlerini tek platformda standartlaştıran ve evrak/rapor üretimi yapan yazılımdır.", keywords: ["doğrudan temin", "kamu satınalma", "ihale mevzuatı", "teklif toplama", "yaklaşık maliyet", "piyasa fiyat araştırması", "govtech"], icon: Globe, color: "text-pink-400" },
            { id: 8, name: "Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.", type: "EdTech / Community Platform / Sponsorluk Ağı", level: "ACTIVE", service: "Üniversite kulüpleri, sponsorlar ve öğrencileri bir araya getiren etkinlik ve sponsorluk ekosistem platformudur.", keywords: ["üniversite kulüp", "sponsorluk", "öğrenci etkinlik", "kampüs ağı", "dijital ekosistem", "network platformu"], icon: Smartphone, color: "text-indigo-400" },
            { id: 9, name: "FiProduct", type: "Ürün Geliştirme / VR", level: "ACTIVE", service: "Kültürel mirası 3D modelleme ile yeniden inşa edip VR ortamında interaktif deneyimlere dönüştürür.", keywords: ["vr", "kültürel miras", "3d modelleme", "tarihi rekonstrüksiyon", "vr müze", "dijital kültür", "immersive"], icon: Lightbulb, color: "text-red-400" },
            { id: 10, name: "İnterfiber Bilişim Teknoloji Ticaret Limited Şirketi", type: "Telekom / İnternet Servis Sağlayıcı / Wi-Fi Çözümleri", level: "ACTIVE", service: "Kurumsal internet altyapısı, 5G destekli yedekli bağlantı ve Wi-Fi portal/reklam entegrasyonu sağlar.", keywords: ["kurumsal internet", "ISS", "otel wi-fi", "5g yedek internet", "wifi portal", "wifi reklam", "kesintisiz internet", "internet altyapı"], icon: Globe, color: "text-blue-500" },
            { id: 11, name: "3B Postür ve Hareket Analiz Girişimi", type: "Sağlık Teknolojileri / 3D Analiz", level: "ACTIVE", service: "Radyasyonsuz 3B postür ve hareket analizi ile klinik süreçlere dijital karar destek sunar.", keywords: ["3b postür analizi", "hareket analizi", "dijital sağlık", "biyomekanik", "klinik karar destek", "rehabilitasyon", "skolyoz analizi"], icon: Lightbulb, color: "text-green-500" },
            { id: 12, name: "Ung Sağlık Teknolojileri Ürünleri Ve Hiz. San. Tic. Ltd. Şti.", type: "Dijital Sağlık / Yapay Zekâ / Diş Sağlığı", level: "ACTIVE", service: "TMB ve bruksizm için yapay zekâ destekli klinik karar destek ve hasta takip platformu geliştirir.", keywords: ["tmb", "bruksizm", "dijital diş sağlığı", "klinik karar destek", "sağlık saas", "telemedikal", "bulut hasta takibi"], icon: Zap, color: "text-cyan-500" },
            { id: 13, name: "Napolion Kahve Ticareti Ve Lojistik Limited Şirketi", type: "Yazılım (Detay Eksik)", level: "ACTIVE", service: "Başvuruda proje detayı bulunmadığı için faaliyet alanı yazılım olarak sınıflandırılmıştır.", keywords: ["yazılım geliştirme", "dijital çözüm", "teknoloji girişimi"], icon: Code2, color: "text-purple-500" },
            { id: 14, name: "İPDM Plan Proje Destekleme Merkezleri ve Dan. Hiz. Ltd. Şti.", type: "B2B Yazılım / Ar-Ge Süreç Yönetimi", level: "ACTIVE", service: "Ar-Ge birimleri için süreç, kaynak, risk ve doküman yönetimini bütünleşik sunan yazılımlar geliştirir.", keywords: ["ar-ge yönetim yazılımı", "risk yönetimi", "doküman yönetimi", "proje yönetimi", "karar destek", "süreç madenciliği", "b2b saas"], icon: Briefcase, color: "text-orange-500" },
            { id: 15, name: "Funexagon Oyun Teknolojileri Sanayi Ve Ticaret A.Ş.", type: "Oyun Teknolojileri / DOOH / Yaratıcı Teknolojiler", level: "ACTIVE", service: "Unreal Engine tabanlı oyunlar ve anamorfik DOOH/immersive dijital deneyim çözümleri üretir.", keywords: ["unreal engine", "oyun stüdyosu", "aaa oyun", "shooter", "live ops", "anamorfik", "dooh", "immersive deneyim", "vfx"], icon: Gamepad2, color: "text-pink-500" },
            { id: 16, name: "Allesgut Teknoloji Ltd. Şti.", type: "Sağlık B2B E-Ticaret / Marketplace", level: "ACTIVE", service: "Ecza depoları ile eczaneleri buluşturan B2B dijital sipariş ve tedarik platformu geliştirir.", keywords: ["eczane tedarik", "ecza deposu", "b2b e-ticaret", "sağlık marketplace", "stok fiyat karşılaştırma", "sipariş yönetimi"], icon: Building2, color: "text-teal-500" },
            { id: 17, name: "İlter İç Ve Dış Ltd. Şti.", type: "Yapay Zekâ / Computer Vision / Davranış Analitiği", level: "ACTIVE", service: "Beden dili ve mikro ifadeleri analiz eden yapay zekâ tabanlı platform geliştirir.", keywords: ["beden dili analizi", "mikro ifade", "computer vision", "duygu analizi", "davranış analitiği", "yapay zeka veri seti"], icon: Users, color: "text-indigo-500" },
            { id: 18, name: "İnvo Proje Danışmanlık Hizmetleri Ltd. Şti.", type: "FinTech / GovTech / Yapay Zekâ SaaS", level: "ACTIVE", service: "KOBİ’ler için hibe-teşvik eşleştirme, başvuru asistanı ve proje yönetimi sağlayan AI destekli platform sunar.", keywords: ["hibe platformu", "teşvik eşleştirme", "kosgeb", "tübitak", "ai chatbot", "proje yazımı", "proje yönetimi", "saas"], icon: FileCheck, color: "text-yellow-500" },
            { id: 20, name: "Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.", type: "Lojistik Teknolojileri / Mobil SaaS", level: "ACTIVE", service: "Uluslararası taşımacılıkta sürücü takibi, evrak yönetimi ve operasyon dijitalleşmesi sağlayan mobil platform geliştirir.", keywords: ["lojistik yazılım", "taşımacılık", "sürücü takip", "evrak yönetimi", "mobil uygulama", "tedarik zinciri", "operasyon yönetimi"], icon: Smartphone, color: "text-emerald-500" },
            { id: 21, name: "Altelca Aviation", type: "Havacılık Teknolojileri / Simülasyon", level: "ACTIVE", service: "Havacılık eğitimine yönelik hareketli uçuş simülatörleri ve ilgili yazılım-donanım entegrasyonları geliştirir.", keywords: ["uçuş simülatörü", "havacılık eğitim", "boeing 737 simülatör", "6 eksenli hareket", "simülasyon yazılımı", "avionics"], icon: Gauge, color: "text-blue-600" },
            { id: 22, name: "M-RADS (Medical Reporting and Detection System)", type: "Sağlıkta Yapay Zekâ / Medikal Görüntüleme", level: "ACTIVE", service: "MRI/CT/USG gibi görüntülerden ön tanı ve raporlama desteği veren çok modaliteli medikal AI karar destek sistemi geliştirir.", keywords: ["medikal ai", "radyoloji", "mri analiz", "ct analiz", "görüntü işleme", "karar destek", "otomatik raporlama"], icon: Zap, color: "text-red-500" },
            { id: 23, name: "Elevatora", type: "ERP / KOBİ Dijital Dönüşüm", level: "ACTIVE", service: "İmalat ve saha hizmetleri KOBİ’leri için modüler bulut ERP (stok-üretim-CRM-finans-saha) çözümleri sunar.", keywords: ["kobi erp", "bulut erp", "üretim planlama", "stok yönetimi", "crm", "saha operasyon", "modüler erp"], icon: Building2, color: "text-purple-600" },
            { id: 24, name: "Fatma Patlar Akbulut (Akfa)", type: "Siber Güvenlik / Yapay Zekâ Güvenliği / RegTech", level: "ACTIVE", service: "LLM’ler için prompt injection/jailbreak/PII sızıntısı gibi riskleri test eden ve EU AI Act uyum araçları sunan platformdur.", keywords: ["llm security", "prompt injection", "jailbreak", "ai act", "regtech", "kvkk", "gdpr", "model güvenliği", "pii leakage"], icon: Shield, color: "text-green-600" },
            { id: 25, name: "Insprefex Yazılım Danışmanlık Anonim Şirketi", type: "Customer Experience / Analytics / Yapay Zekâ", level: "ACTIVE", service: "NPS/CSAT/CES gibi metrikleri tek havuzda toplayıp analitik ve AI ile müşteri içgörüsü üreten CX platformudur.", keywords: ["nps", "csat", "ces", "cx analytics", "customer intelligence", "segmentasyon", "müşteri geri bildirim", "tahminleme"], icon: Lightbulb, color: "text-cyan-600" },
            { id: 30, name: "Emre Ertürk Ve Oğuzhan Gökduman Ortaklığı", type: "Yazılım / Teknoloji", level: "ACTIVE", service: "Yeni eklenen ortaklık girişimi.", keywords: ["yazılım", "teknoloji", "girişim"], icon: Users, color: "text-indigo-600" }
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
