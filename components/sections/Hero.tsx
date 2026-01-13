"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { siteContent } from "@/data/content";

const { techCategories } = siteContent;

const sliderImages = [
    {
        src: "/images/hero-slide-1.jpg",
        alt: "İKÜANTS TEKMER Ana Etkinlik"
    },
    {
        src: "/images/hero-slide-2.jpg",
        alt: "Ödül Töreni"
    },
    {
        src: "/images/hero-slide-3.jpg",
        alt: "Girişimci Topluluğu"
    },
    {
        src: "/images/hero-slide-4.jpg",
        alt: "Seminer Katılımcıları"
    },
    {
        src: "/images/hero-slide-5.jpg",
        alt: "Proje Sunumu"
    },
    {
        src: "/images/hero-slide-6.jpg",
        alt: "Mentörlük Seansı"
    },
    {
        src: "/images/hero-slide-7.jpg",
        alt: "Açılış Konuşması"
    },
    {
        src: "/images/hero-slide-8.jpg",
        alt: "Yatırımcı Buluşması"
    },
    {
        src: "/images/hero-slide-9.jpg",
        alt: "Eğitim Semineri"
    },
    {
        src: "/images/hero-slide-10.jpg",
        alt: "Networking Etkinliği"
    },
    {
        src: "/images/hero-slide-11.jpg",
        alt: "Hackathon Çalışması"
    }
];

export const Hero = () => {
    const { hero } = siteContent;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* Background Slider */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <img
                            src={sliderImages[currentSlide].src}
                            alt={sliderImages[currentSlide].alt}
                            className="w-full h-full object-cover"
                        />
                        {/* Modern Gradient Overlay - lighter for images to show */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-gray-50/70 to-white/60 dark:from-[#050510]/90 dark:via-[#0a0a1a]/85 dark:to-[#050510]/80 transition-colors duration-300" />
                        {/* Accent gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Slider Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 md:left-8 z-20 p-3 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 backdrop-blur-md transition-all shadow-lg"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 md:right-8 z-20 p-3 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 backdrop-blur-md transition-all shadow-lg"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slider Dots */}
            <div className="absolute top-24 right-8 z-20 flex flex-col gap-2">
                {sliderImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${currentSlide === index
                            ? 'bg-primary h-6 shadow-lg'
                            : 'bg-gray-400 dark:bg-white/40 hover:bg-gray-600 dark:hover:bg-white/60'
                            }`}
                    />
                ))}
            </div>

            <div className="container relative z-10 mx-auto px-6 max-w-7xl flex flex-col items-center text-center pt-24 pb-8">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/50 bg-white/80 dark:bg-black/60 backdrop-blur-xl text-primary dark:text-secondary text-sm font-bold tracking-wider shadow-xl dark:shadow-none dark:border-secondary/40"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                    {hero.status}
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-orbitron font-black tracking-tight leading-[1.1] mb-6"
                >
                    <span className="block text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-2 text-black dark:text-white drop-shadow-2xl">
                        {hero.title.line1}
                    </span>
                    <span className="block text-4xl md:text-5xl lg:text-6xl xl:text-7xl bg-gradient-to-r from-primary via-purple-600 to-secondary bg-clip-text text-transparent drop-shadow-lg">
                        {hero.title.line2}
                    </span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-base md:text-lg lg:text-xl text-black dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed bg-white/60 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none px-6 py-3 rounded-xl border border-gray-200 dark:border-transparent shadow-lg dark:shadow-none"
                >
                    {hero.description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 mb-10"
                >
                    <Link
                        href="/basvuru"
                        className="group relative px-8 py-4 bg-gradient-to-r from-primary via-purple-600 to-primary text-white font-bold text-base tracking-wide overflow-hidden rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 shadow-xl"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {hero.buttons.primary}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Link>

                    <Link
                        href="/destekler"
                        className="px-8 py-4 bg-white/90 dark:bg-white/10 backdrop-blur-md border-2 border-gray-300 dark:border-white/30 text-gray-900 dark:text-white font-bold text-base tracking-wide hover:bg-white dark:hover:bg-white/20 hover:border-primary dark:hover:border-primary transition-all rounded-xl shadow-lg"
                    >
                        {hero.buttons.secondary}
                    </Link>
                </motion.div>

                {/* Stats / Features Mini Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl"
                >
                    {hero.stats.map((stat, i) => (
                        <div
                            key={i}
                            onClick={() => setExpandedCategory(expandedCategory === i ? null : i)}
                            className={`group p-3 border bg-white/90 dark:bg-black/30 backdrop-blur-xl dark:backdrop-blur-sm rounded-lg transition-all cursor-pointer hover:scale-105 relative ${expandedCategory === i
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
                            <div className="p-6 bg-gradient-to-r from-primary/20 to-purple-600/20 border border-white/10 rounded-2xl backdrop-blur-sm">
                                <h3 className="font-orbitron text-xl text-white mb-4 flex items-center gap-2">
                                    <span className="text-secondary">{techCategories[expandedCategory]?.title}</span>
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {techCategories[expandedCategory]?.items.map((item: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-gray-200 hover:bg-primary/30 hover:border-primary/50 transition-all"
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
