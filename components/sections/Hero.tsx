"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { siteContent } from "@/data/content";

const defaultSlideImages = [
    "/images/hero-slide-1.jpg",
    "/images/hero-slide-2.jpg",
    "/images/hero-slide-3.jpg",
    "/images/hero-slide-4.jpg",
    "/images/hero-slide-5.jpg",
    "/images/hero-slide-6.jpg",
    "/images/hero-slide-7.jpg",
    "/images/hero-slide-8.jpg",
    "/images/hero-slide-9.jpg",
    "/images/hero-slide-10.jpg",
    "/images/hero-slide-11.jpg",
    "/images/hero-3.jpg",
    "/images/hero-4.jpg",
    "/images/hero-5.jpg",
    "/images/hero-7.jpg",
    "/images/06.jpeg",
    "/images/07.JPG",
    "/images/08.JPG",
    "/images/09.JPG",
    "/images/10.JPG",
    "/images/11.jpeg",
    "/images/12.JPG",
    "/images/slider-1.png",
];

interface DynamicSlide {
    id?: string;
    mediaUrl: string;
    mobileMediaUrl?: string | null;
    title?: string;
    subtitle?: string;
    badgeText?: string;
    description?: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
}

export const Hero = () => {
    const { hero } = siteContent;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState<DynamicSlide[]>(
        defaultSlideImages.map((url, i) => ({
            mediaUrl: url,
            title: `İKÜANTS TEKMER Slayt ${i + 1}`,
        }))
    );

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await fetch('/api/public/slides');
                const data = await res.json();
                if (data.success && Array.isArray(data.slides) && data.slides.length > 0) {
                    setSlides(data.slides);
                }
            } catch {
                // Fallback to default 23 slides
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

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const activeSlide = slides[currentSlide] || slides[0] || { mediaUrl: defaultSlideImages[0] };
    const totalSlides = slides.length || 23;
    const currentNumberFormatted = String(currentSlide + 1).padStart(2, '0');
    const totalNumberFormatted = String(totalSlides).padStart(2, '0');

    return (
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* 1. Background Slider with Smooth Fade and Zoom */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlide.mediaUrl + currentSlide}
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <picture>
                            {activeSlide.mobileMediaUrl && (
                                <source media="(max-width: 768px)" srcSet={activeSlide.mobileMediaUrl} />
                            )}
                            <img
                                src={activeSlide.mediaUrl}
                                alt={activeSlide.title || "İKÜANTS TEKMER"}
                                className="w-full h-full object-cover"
                            />
                        </picture>
                        {/* Premium Glass & Contrast Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/95 dark:from-[#050510]/85 dark:via-[#050510]/75 dark:to-[#050510]/95 backdrop-blur-[2px] transition-colors duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-purple-900/10 pointer-events-none" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 2. Side Navigation Arrows (Desktop) */}
            {totalSlides > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        aria-label="Önceki Slayt"
                        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/70 text-gray-900 dark:text-white border border-gray-300/60 dark:border-white/20 backdrop-blur-xl transition-all shadow-xl cursor-pointer hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextSlide}
                        aria-label="Sonraki Slayt"
                        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/70 text-gray-900 dark:text-white border border-gray-300/60 dark:border-white/20 backdrop-blur-xl transition-all shadow-xl cursor-pointer hover:scale-110 active:scale-95"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* 3. Modern Counter & Progress Pagination Pill */}
            {totalSlides > 1 && (
                <div data-testid="hero-counter-pill" className="absolute bottom-6 md:bottom-10 right-6 md:right-12 z-20 flex items-center gap-3 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-gray-300 dark:border-white/15 px-4 py-2 rounded-full shadow-2xl">
                    <button
                        onClick={prevSlide}
                        aria-label="Önceki"
                        className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div data-testid="hero-slide-counter" className="flex items-center gap-1.5 font-mono text-xs text-gray-900 dark:text-white font-bold tracking-wider">
                        <span className="text-primary">{currentNumberFormatted}</span>
                        <span className="text-gray-400">/</span>
                        <span data-testid="hero-total-count" className="text-gray-500 dark:text-gray-400">{totalNumberFormatted}</span>
                    </div>
                    {/* Micro animated progress line */}
                    <div className="w-12 h-1 bg-gray-200 dark:bg-white/20 rounded-full overflow-hidden hidden sm:block">
                        <motion.div
                            key={currentSlide}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 6, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-primary to-purple-500"
                        />
                    </div>
                    <button
                        onClick={nextSlide}
                        aria-label="Sonraki"
                        className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 4. Main Hero Typography & Call-To-Action (Mobile & Desktop Perfected) */}
            <div className="container relative z-10 mx-auto px-5 sm:px-6 max-w-5xl flex flex-col items-center text-center pt-16 pb-16 md:py-24">
                {/* Status Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-white/90 dark:bg-black/60 backdrop-blur-xl text-primary dark:text-secondary text-xs sm:text-sm font-bold tracking-wider shadow-lg"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {hero.status || "TEKNOLOJİ GELİŞTİRME MERKEZİ"}
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="font-orbitron font-black tracking-tight leading-[1.15] mb-5"
                >
                    <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-1 text-black dark:text-white drop-shadow-xl">
                        {hero.title?.line1 || "Geleceği Şekillendiren"}
                    </span>
                    <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary via-purple-600 to-secondary bg-clip-text text-transparent drop-shadow-md">
                        {hero.title?.line2 || "Girişimcilik Ekosistemi"}
                    </span>
                </motion.h1>

                {/* Subtitle / Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="text-sm sm:text-base md:text-lg text-gray-800 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed px-4 py-2 bg-white/40 dark:bg-black/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-white/5"
                >
                    {hero.description || "İstanbul Kültür Üniversitesi ve KOSGEB iş birliğiyle; teknoloji odaklı girişimcilere kuluçka, mentörlük ve teşvik destekleri sunuyoruz."}
                </motion.p>

                {/* Action CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
                >
                    <Link
                        href="/basvuru"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold text-sm tracking-wide shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                    >
                        <span>HEMEN BAŞVUR</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                        href="/programlar"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 backdrop-blur-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                    >
                        <span>PROGRAMLAR</span>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};
