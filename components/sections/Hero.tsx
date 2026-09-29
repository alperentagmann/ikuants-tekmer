"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { siteContent } from "@/data/content";

const { techCategories } = siteContent;

interface SlideItem {
    id?: string;
    title: string;
    subtitle?: string | null;
    badgeText?: string | null;
    description?: string | null;
    mediaUrl: string;
    mobileMediaUrl?: string | null;
    primaryCtaText?: string | null;
    primaryCtaLink?: string | null;
    secondaryCtaText?: string | null;
    secondaryCtaLink?: string | null;
}

const defaultSlides: SlideItem[] = [
    {
        title: "Geleceği Şekillendiren Girişimcilik Ekosistemi",
        subtitle: "İKÜANTS TEKMER ile Fikirlerinizi Küresel Başarıya Dönüştürün",
        badgeText: "TEKNOLOJİ & İNOVASYON",
        description: "Yenilikçi teknolojiler, mentorluk, altyapı ve yatırım destekleriyle girişimcileri dünya standartlarına taşıyoruz.",
        mediaUrl: "/images/hero-slide-1.jpg",
        primaryCtaText: "HEMEN BAŞVUR",
        primaryCtaLink: "/basvuru",
        secondaryCtaText: "PROGRAMLARI İNCELE",
        secondaryCtaLink: "/programlar"
    },
    {
        title: "ANTsPARK Demoday & Ödül Töreni",
        subtitle: "En İyi Girişimler Yatırımcılarla Buluştu",
        badgeText: "BAŞARI & ÖDÜLLER",
        description: "Demoday etkinliğinde başarı gösteren girişimcilerimiz tohum öncesi fonlama ve ödüllerle buluştu.",
        mediaUrl: "/images/hero-slide-2.jpg",
        primaryCtaText: "BAŞARI HİKÂYELERİ",
        primaryCtaLink: "/haberler",
        secondaryCtaText: "ETKİNLİKLER",
        secondaryCtaLink: "/etkinlikler"
    },
    {
        title: "Güçlü ve Büyüyen Girişimci Topluluğu",
        subtitle: "Sinerji, İş Birlikleri ve Ortak Çalışma Alanı",
        badgeText: "EKOSİSTEM",
        description: "Farklı disiplinlerden 25+ ileri teknoloji girişimi İKÜANTS TEKMER çatısı altında birlikte büyüyor.",
        mediaUrl: "/images/hero-slide-3.jpg",
        primaryCtaText: "GİRİŞİMCİLERİMİZ",
        primaryCtaLink: "/girisimciler",
        secondaryCtaText: "BİZE KATIL",
        secondaryCtaLink: "/basvuru"
    },
    {
        title: "Uygulamalı Eğitim ve Seminerler",
        subtitle: "Akademik ve Sektörel Uzmanlarla Gelişim",
        badgeText: "AKADEMİ & EĞİTİM",
        description: "Pazar doğrulama, finansal modelleme, fikri mülkiyet hakları ve yatırım hazırlığı eğitimleri.",
        mediaUrl: "/images/hero-slide-4.jpg",
        primaryCtaText: "EĞİTİMLER",
        primaryCtaLink: "/programlar",
        secondaryCtaText: "DETAYLI BİLGİ",
        secondaryCtaLink: "/iletisim"
    },
    {
        title: "Proje ve Hibe Destek Programları",
        subtitle: "KOSGEB, TÜBİTAK ve İSTKA Destekleri",
        badgeText: "HİBE & FONLAMA",
        description: "Girişiminizin Ar-Ge ve inovasyon fonlarına erişiminde uzman danışmanlık ve proje hazırlık desteği.",
        mediaUrl: "/images/hero-slide-5.jpg",
        primaryCtaText: "DESTEKLERİ İNCELE",
        primaryCtaLink: "/destekler",
        secondaryCtaText: "BAŞVURU YAP",
        secondaryCtaLink: "/basvuru"
    },
    {
        title: "Birebir Mentörlük Seansları",
        subtitle: "Sektör Liderleriyle Stratejik Yol Haritası",
        badgeText: "MENTÖRLÜK",
        description: "20'den fazla deneyimli mentör ile teknik, hukuki, finansal ve pazarlama alanlarında birebir seanslar.",
        mediaUrl: "/images/hero-slide-6.jpg",
        primaryCtaText: "MENTÖRLERİMİZ",
        primaryCtaLink: "/mentorler",
        secondaryCtaText: "MENTÖR OL",
        secondaryCtaLink: "/mentor-basvuru"
    },
    {
        title: "Teknoloji Odaklı Açılış ve Paneller",
        subtitle: "Sanayi ve Akademi Buluşmaları",
        badgeText: "ETKİNLİK",
        description: "Yapay zeka, derin teknoloji, oyun ve biyoteknoloji alanlarında vizyoner konuşmacılarla ilham veren oturumlar.",
        mediaUrl: "/images/hero-slide-7.jpg",
        primaryCtaText: "ETKİNLİK TAKVİMİ",
        primaryCtaLink: "/etkinlikler",
        secondaryCtaText: "KAYIT OL",
        secondaryCtaLink: "/etkinlikler"
    },
    {
        title: "Yatırımcı Buluşmaları ve Demo Günleri",
        subtitle: "Erken Aşama Girişimler için Küresel Yatırım",
        badgeText: "YATIRIMCI AĞI",
        description: "Melek yatırım ağları ve girişim sermayesi fonları ile doğrudan temas ve yatırım turları.",
        mediaUrl: "/images/hero-slide-8.jpg",
        primaryCtaText: "HEMEN BAŞVUR",
        primaryCtaLink: "/basvuru",
        secondaryCtaText: "İLETİŞİME GEÇ",
        secondaryCtaLink: "/iletisim"
    }
];

export const Hero = () => {
    const { hero } = siteContent;
    const [slides, setSlides] = useState<SlideItem[]>(defaultSlides);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await fetch('/api/public/slides');
                const data = await res.json();
                if (data.success && Array.isArray(data.slides) && data.slides.length > 0) {
                    setSlides(data.slides);
                }
            } catch (e) {
                console.error("Failed to load slides from API, using default slides", e);
            }
        };
        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const activeSlide = slides[currentSlide] || slides[0] || defaultSlides[0];

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* Background Slider */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlide.mediaUrl + currentSlide}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <picture>
                            {activeSlide.mobileMediaUrl && (
                                <source media="(max-width: 768px)" srcSet={activeSlide.mobileMediaUrl} />
                            )}
                            <img
                                src={activeSlide.mediaUrl}
                                alt={activeSlide.title || "İKÜANTS TEKMER Hero"}
                                className="w-full h-full object-cover"
                            />
                        </picture>
                        {/* Modern Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-gray-50/75 to-white/70 dark:from-[#050510]/92 dark:via-[#0a0a1a]/85 dark:to-[#050510]/80 transition-colors duration-300" />
                        {/* Accent gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Slider Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        aria-label="Önceki Slayt"
                        className="absolute left-4 md:left-8 z-20 p-3 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        aria-label="Sonraki Slayt"
                        className="absolute right-4 md:right-8 z-20 p-3 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Slider Dots */}
            {slides.length > 1 && (
                <div className="absolute top-24 right-8 z-20 flex flex-col gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                            className={`w-2 rounded-full transition-all cursor-pointer ${
                                currentSlide === index
                                    ? 'bg-primary h-6 shadow-lg shadow-primary/50'
                                    : 'bg-gray-400 h-2 dark:bg-white/40 hover:bg-gray-600 dark:hover:bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            )}

            <div className="container relative z-10 mx-auto px-6 max-w-7xl flex flex-col items-center text-center -mt-4 pb-4">
                {/* Dynamic Badge */}
                <motion.div
                    key={`badge-${currentSlide}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/50 bg-white/80 dark:bg-black/60 backdrop-blur-xl text-primary dark:text-secondary text-sm font-bold tracking-wider shadow-xl dark:shadow-none dark:border-secondary/40"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                    {activeSlide.badgeText || hero.status}
                </motion.div>

                {/* Title */}
                <motion.h1
                    key={`title-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="font-orbitron font-black tracking-tight leading-[1.1] mb-6 max-w-4xl"
                >
                    <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 text-black dark:text-white drop-shadow-2xl">
                        {activeSlide.title || hero.title.line1}
                    </span>
                    {activeSlide.subtitle && (
                        <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-primary via-purple-600 to-secondary bg-clip-text text-transparent drop-shadow-lg font-bold">
                            {activeSlide.subtitle}
                        </span>
                    )}
                </motion.h1>

                {/* Description */}
                <motion.p
                    key={`desc-${currentSlide}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base md:text-lg lg:text-xl text-black dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed bg-white/60 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none px-6 py-3 rounded-xl border border-gray-200 dark:border-transparent shadow-lg dark:shadow-none"
                >
                    {activeSlide.description || hero.description}
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 mb-10"
                >
                    <Link
                        href={activeSlide.primaryCtaLink || "/basvuru"}
                        className="group relative px-8 py-4 bg-gradient-to-r from-primary via-purple-600 to-primary text-white font-bold text-base tracking-wide overflow-hidden rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 shadow-xl"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {activeSlide.primaryCtaText || hero.buttons.primary}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Link>

                    <Link
                        href={activeSlide.secondaryCtaLink || "/programlar"}
                        className="px-8 py-4 bg-white/90 dark:bg-white/10 backdrop-blur-md border-2 border-gray-300 dark:border-white/30 text-gray-900 dark:text-white font-bold text-base tracking-wide hover:bg-white dark:hover:bg-white/20 hover:border-primary dark:hover:border-primary transition-all rounded-xl shadow-lg"
                    >
                        {activeSlide.secondaryCtaText || hero.buttons.secondary}
                    </Link>
                </motion.div>

                {/* Stats / Features Mini Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl"
                >
                    {hero.stats.map((stat, i) => (
                        <div
                            key={i}
                            onClick={() => setExpandedCategory(expandedCategory === i ? null : i)}
                            className={`group p-3 border bg-white/90 dark:bg-black/30 backdrop-blur-xl dark:backdrop-blur-sm rounded-lg transition-all cursor-pointer hover:scale-105 relative ${
                                expandedCategory === i
                                    ? 'border-primary dark:border-secondary/60 bg-primary/10 dark:bg-primary/10 shadow-xl shadow-primary/30'
                                    : 'border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-secondary/40 shadow-md dark:shadow-none'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <stat.icon className={`w-5 h-5 ${expandedCategory === i ? 'text-primary' : 'text-black dark:text-gray-300'} group-hover:text-primary transition-colors flex-shrink-0`} />
                                <div className="text-xs font-orbitron font-bold text-black dark:text-white group-hover:text-primary transition-colors truncate">
                                    {stat.title}
                                </div>
                            </div>
                            <div className="text-[9px] text-black/60 dark:text-gray-500 uppercase tracking-wider pl-7">
                                {stat.subtitle}
                            </div>
                            <ChevronRight className={`absolute top-2 right-2 w-3 h-3 text-gray-400 group-hover:text-secondary transition-all ${expandedCategory === i ? 'rotate-90' : ''}`} />
                        </div>
                    ))}
                </motion.div>

                {/* Expanded Category Details */}
                <AnimatePresence>
                    {expandedCategory !== null && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 w-full max-w-4xl overflow-hidden"
                        >
                            <div className="p-6 bg-gradient-to-r from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 border border-black/10 dark:border-white/10 rounded-2xl backdrop-blur-sm shadow-lg dark:shadow-none bg-white/40 dark:bg-transparent">
                                <h3 className="font-orbitron text-xl text-black dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-primary dark:text-secondary">{techCategories[expandedCategory]?.title}</span>
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {techCategories[expandedCategory]?.items.map((item: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-full text-sm text-gray-800 dark:text-gray-200 hover:bg-white hover:border-primary dark:hover:bg-primary/30 dark:hover:border-primary/50 transition-all font-medium shadow-sm dark:shadow-none"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};
