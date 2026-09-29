import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialHeroSlides = [
    {
        title: "Geleceği Şekillendiren Girişimcilik Ekosistemi",
        subtitle: "İKÜANTS TEKMER ile Fikirlerinizi Küresel Başarıya Dönüştürün",
        badgeText: "TEKNOLOJİ & İNOVASYON",
        description: "Yenilikçi teknolojiler, mentorluk, altyapı ve yatırım destekleriyle girişimcileri dünya standartlarına taşıyoruz.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-1.jpg",
        mobileMediaUrl: "/images/hero-slide-1.jpg",
        primaryCtaText: "HEMEN BAŞVUR",
        primaryCtaLink: "/basvuru",
        secondaryCtaText: "PROGRAMLARI İNCELE",
        secondaryCtaLink: "/programlar",
        sortOrder: 1,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "ANTsPARK Demoday & Ödül Töreni",
        subtitle: "En İyi Girişimler Yatırımcılarla Buluştu",
        badgeText: "BAŞARI & ÖDÜLLER",
        description: "Demoday etkinliğinde başarı gösteren girişimcilerimiz tohum öncesi fonlama ve ödüllerle buluştu.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-2.jpg",
        mobileMediaUrl: "/images/hero-slide-2.jpg",
        primaryCtaText: "BAŞARI HİKÂYELERİ",
        primaryCtaLink: "/haberler",
        secondaryCtaText: "ETKİNLİKLER",
        secondaryCtaLink: "/etkinlikler",
        sortOrder: 2,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "Güçlü ve Büyüyen Girişimci Topluluğu",
        subtitle: "Sinerji, İş Birlikleri ve Ortak Çalışma Alanı",
        badgeText: "EKOSİSTEM",
        description: "Farklı disiplinlerden 25+ ileri teknoloji girişimi İKÜANTS TEKMER çatısı altında birlikte büyüyor.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-3.jpg",
        mobileMediaUrl: "/images/hero-slide-3.jpg",
        primaryCtaText: "GİRİŞİMCİLERİMİZ",
        primaryCtaLink: "/girisimciler",
        secondaryCtaText: "BİZE KATIL",
        secondaryCtaLink: "/basvuru",
        sortOrder: 3,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "Uygulamalı Eğitim ve Seminerler",
        subtitle: "Akademik ve Sektörel Uzmanlarla Gelişim",
        badgeText: "AKADEMİ & EĞİTİM",
        description: "Pazar doğrulama, finansal modelleme, fikri mülkiyet hakları ve yatırım hazırlığı eğitimleri.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-4.jpg",
        mobileMediaUrl: "/images/hero-slide-4.jpg",
        primaryCtaText: "EĞİTİMLER",
        primaryCtaLink: "/programlar",
        secondaryCtaText: "DETAYLI BİLGİ",
        secondaryCtaLink: "/iletisim",
        sortOrder: 4,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "Proje ve Hibe Destek Programları",
        subtitle: "KOSGEB, TÜBİTAK ve İSTKA Destekleri",
        badgeText: "HİBE & FONLAMA",
        description: "Girişiminizin Ar-Ge ve inovasyon fonlarına erişiminde uzman danışmanlık ve proje hazırlık desteği.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-5.jpg",
        mobileMediaUrl: "/images/hero-slide-5.jpg",
        primaryCtaText: "DESTEKLERİ İNCELE",
        primaryCtaLink: "/destekler",
        secondaryCtaText: "BAŞVURU YAP",
        secondaryCtaLink: "/basvuru",
        sortOrder: 5,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "Birebir Mentörlük Seansları",
        subtitle: "Sektör Liderleriyle Stratejik Yol Haritası",
        badgeText: "MENTÖRLÜK",
        description: "20'den fazla deneyimli mentör ile teknik, hukuki, finansal ve pazarlama alanlarında birebir seanslar.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-6.jpg",
        mobileMediaUrl: "/images/hero-slide-6.jpg",
        primaryCtaText: "MENTÖRLERİMİZ",
        primaryCtaLink: "/mentorler",
        secondaryCtaText: "MENTÖR OL",
        secondaryCtaLink: "/mentor-basvuru",
        sortOrder: 6,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "Teknoloji Odaklı Açılış ve Paneller",
        subtitle: "Sanayi ve Akademi Buluşmaları",
        badgeText: "ETKİNLİK",
        description: "Yapay zeka, derin teknoloji, oyun ve biyoteknoloji alanlarında vizyoner konuşmacılarla ilham veren oturumlar.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-7.jpg",
        mobileMediaUrl: "/images/hero-slide-7.jpg",
        primaryCtaText: "ETKİNLİK TAKVİMİ",
        primaryCtaLink: "/etkinlikler",
        secondaryCtaText: "KAYIT OL",
        secondaryCtaLink: "/etkinlikler",
        sortOrder: 7,
        status: "PUBLISHED",
        isActive: true,
    },
    {
        title: "Yatırımcı Buluşmaları ve Demo Günleri",
        subtitle: "Erken Aşama Girişimler için Küresel Yatırım",
        badgeText: "YATIRIMCI AĞI",
        description: "Melek yatırım ağları ve girişim sermayesi fonları ile doğrudan temas ve yatırım turları.",
        mediaType: "IMAGE",
        mediaUrl: "/images/hero-slide-8.jpg",
        mobileMediaUrl: "/images/hero-slide-8.jpg",
        primaryCtaText: "HEMEN BAŞVUR",
        primaryCtaLink: "/basvuru",
        secondaryCtaText: "İLETİŞİME GEÇ",
        secondaryCtaLink: "/iletisim",
        sortOrder: 8,
        status: "PUBLISHED",
        isActive: true,
    }
];

async function seedHeroSlides() {
    console.log('--- SEEDING HERO SLIDES ---');
    try {
        await prisma.$connect();
        const existingCount = await prisma.heroSlide.count();
        console.log(`Mevcut Hero Slide sayısı: ${existingCount}`);

        if (existingCount === 0) {
            for (const slide of initialHeroSlides) {
                await prisma.heroSlide.create({
                    data: slide,
                });
                console.log(`✓ Eklendi: ${slide.title}`);
            }
        } else {
            console.log('Hero slide kayıtları zaten mevcut. İlk slide kontrol ediliyor...');
            const slides = await prisma.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } });
            console.log(`Bulunan slide adedi: ${slides.length}`);
        }
    } catch (e) {
        console.error('Seed error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedHeroSlides();
