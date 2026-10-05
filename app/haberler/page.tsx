"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Calendar, ArrowRight, Tag, ChevronRight, Sparkles, X } from "lucide-react";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";
import { LEGACY_NEWS } from "@/data/legacy-news";

const news = LEGACY_NEWS;

const categories = ["Tümü", "Etkinlik", "Program", "Duyuru"];

interface NewsItem {
    id: number | string;
    slug?: string;
    title: string;
    excerpt: string;
    fullContent: string;
    date: string;
    category: string;
    image: string;
    featured: boolean;
    gallery?: string[];
    registrationLink?: string;
}

export default function HaberlerPage() {
    const [newsList, setNewsList] = useState<NewsItem[]>(news);
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [showRsvpForm, setShowRsvpForm] = useState(false);
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/public/news');
                const data = await res.json();
                if (data.success && Array.isArray(data.news) && data.news.length > 0) {
                    setNewsList(data.news.map((n: any) => ({
                        id: n.id,
                        title: n.title,
                        excerpt: n.excerpt || '',
                        fullContent: n.fullContent || n.content || '',
                        date: n.date || '',
                        category: n.category || 'Duyuru',
                        image: n.image || '/images/news-placeholder.jpg',
                        gallery: Array.isArray(n.gallery) ? n.gallery : [],
                        featured: !!n.featured,
                        registrationLink: n.registrationLink,
                        slug: n.slug,
                    })));
                }
            } catch {
                // Fallback to static news
            }
        };
        load();
    }, []);

    const filteredNews = selectedCategory === "Tümü"
        ? newsList
        : newsList.filter(item => item.category === selectedCategory);

    const featuredNews = newsList.find(n => n.featured) || newsList[0];
    const regularNews = filteredNews.filter(n => n.id !== featuredNews?.id || selectedCategory !== "Tümü");

    const closeModal = () => {
        setSelectedNews(null);
        setShowRsvpForm(false);
        setRsvpSubmitted(false);
    };

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Keyboard navigation for image gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedImage || !selectedNews?.gallery) return;

            if (e.key === "ArrowLeft") {
                const currentIndex = selectedNews.gallery.indexOf(selectedImage);
                const prevIndex = currentIndex === 0 ? selectedNews.gallery.length - 1 : currentIndex - 1;
                setSelectedImage(selectedNews.gallery[prevIndex]);
            } else if (e.key === "ArrowRight") {
                const currentIndex = selectedNews.gallery.indexOf(selectedImage);
                const nextIndex = currentIndex === selectedNews.gallery.length - 1 ? 0 : currentIndex + 1;
                setSelectedImage(selectedNews.gallery[nextIndex]);
            } else if (e.key === "Escape") {
                setSelectedImage(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedImage, selectedNews]);

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Newspaper className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">GÜNCEL</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Haber & Duyurular
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER'den en güncel haberler, etkinlikler ve duyurular
                    </p>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-3 mb-12"
                >
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${selectedCategory === category
                                ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30'
                                : 'bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10 hover:text-black dark:hover:text-white border border-gray-300 dark:border-white/10'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </motion.div>

                {/* Featured News (Hero Card) */}
                {selectedCategory === "Tümü" && featuredNews && (
                    <motion.div
                        onClick={() => setSelectedNews(featuredNews)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group block mb-12 cursor-pointer"
                    >
                        <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all shadow-lg dark:shadow-none bg-white dark:bg-white/5">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                {/* Image */}
                                <div className="relative h-64 lg:h-96 overflow-hidden">
                                    <img
                                        src={featuredNews.image}
                                        alt={featuredNews.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent lg:bg-gradient-to-t lg:from-black/60 lg:to-transparent" />
                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold">
                                            <Sparkles className="w-3 h-3" />
                                            ÖNE ÇIKAN
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 lg:p-12 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                                            <Tag className="w-3 h-3" />
                                            {featuredNews.category}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {featuredNews.date}
                                        </span>
                                    </div>
                                    <h2 className="font-orbitron text-2xl lg:text-3xl text-black dark:text-white font-bold mb-4 group-hover:text-primary transition-colors leading-tight">
                                        {featuredNews.title}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                                        {featuredNews.excerpt}
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                                        Devamını Oku
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularNews.map((item, index) => (
                        <motion.div
                            key={item.id}
                            onClick={() => setSelectedNews(item)}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative h-full rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all hover:shadow-xl dark:hover:shadow-xl hover:shadow-primary/10 shadow-md dark:shadow-none">
                                {/* Image */}
                                <div className="relative h-52 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                    <div className="absolute top-4 right-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${item.category === 'Etkinlik' ? 'bg-purple-500/80 text-white' :
                                            item.category === 'Program' ? 'bg-cyan-500/80 text-white' :
                                                'bg-orange-500/80 text-white'
                                            }`}>
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                                        <Calendar className="w-4 h-4" />
                                        {item.date}
                                    </div>
                                    <h3 className="text-lg font-semibold text-black dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                        {item.excerpt}
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 text-primary text-sm font-medium group-hover:gap-3 transition-all">
                                        Oku
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredNews.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">Bu kategoride henüz haber bulunmuyor.</p>
                    </motion.div>
                )}

                {/* Subscribe CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary/20 via-purple-600/10 to-secondary/20 border border-gray-200 dark:border-white/10 text-center shadow-lg"
                >
                    <h3 className="font-orbitron text-2xl text-black dark:text-white mb-3">
                        Güncel Haberlerden Haberdar Olun
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                        İKÜANTS TEKMER'in etkinlikleri, programları ve fırsatları hakkında bilgi almak için bizi takip edin.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            WhatsApp Kanalına Katıl
                        </a>
                        <a
                            href="https://www.instagram.com/ikuantstekmer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                        >
                            Instagram'da Takip Et
                        </a>
                        <a
                            href="https://www.linkedin.com/company/ikuants-tekmer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                        >
                            LinkedIn'de Takip Et
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl max-w-4xl w-full h-[95vh] md:h-[90vh] flex flex-col shadow-2xl dark:shadow-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Image */}
                            <div className="relative h-48 md:h-56 flex-shrink-0">
                                <img
                                    src={selectedNews.image}
                                    alt={selectedNews.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent" />
                                <button
                                    onClick={closeModal}
                                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                                <div className="absolute bottom-4 left-6">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${selectedNews.category === 'Etkinlik' ? 'bg-purple-500 text-white' :
                                        selectedNews.category === 'Program' ? 'bg-cyan-500 text-white' :
                                            'bg-orange-500 text-white'
                                        }`}>
                                        {selectedNews.category}
                                    </span>
                                </div>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                    <Calendar className="w-4 h-4" />
                                    {selectedNews.date}
                                </div>
                                <h2 className="font-orbitron text-2xl md:text-3xl text-black dark:text-white font-bold mb-6">
                                    {selectedNews.title}
                                </h2>
                                <div className="text-black/80 dark:text-gray-300 leading-loose whitespace-pre-line text-base md:text-lg mb-8">
                                    {selectedNews.fullContent}
                                </div>

                                {/* Gallery Section */}
                                {selectedNews.gallery && selectedNews.gallery.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="font-orbitron text-xl text-black dark:text-white mb-4">Etkinlik Galerisi</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedNews.gallery.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-video rounded-xl overflow-hidden group border border-gray-200 dark:border-white/10 cursor-pointer"
                                                    onClick={() => setSelectedImage(img)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`${selectedNews.title} - Görsel ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full">
                                                            🔍
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedNews.slug && (
                                    <div className="mt-6">
                                        <a href={`/haberler/${selectedNews.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Haberin kalıcı sayfası ve paylaşım <ArrowRight className="h-4 w-4" /></a>
                                    </div>
                                )}

                                {/* RSVP Section for Etkinlik */}
                                {selectedNews.category === 'Etkinlik' && (
                                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                                        {!showRsvpForm && !rsvpSubmitted && (
                                            <div className="text-center">
                                                <p className="text-black/70 dark:text-gray-400 mb-4">Bu etkinliğe katılmak ister misiniz?</p>
                                                {selectedNews.registrationLink ? (
                                                    <a
                                                        href={selectedNews.registrationLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/30"
                                                    >
                                                        🎉 Kayıt Ol
                                                        <ArrowRight className="w-5 h-5" />
                                                    </a>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowRsvpForm(true)}
                                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/30"
                                                    >
                                                        🎉 Sen de Katıl!
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {showRsvpForm && !rsvpSubmitted && (
                                            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
                                                <h3 className="font-orbitron text-xl text-black dark:text-white mb-4">Etkinlik Kaydı</h3>
                                                <p className="text-black/70 dark:text-gray-400 text-sm mb-6">Bilgilerinizi girerek etkinliğe katılım kaydınızı oluşturun.</p>
                                                {/* Questions are managed in Admin > Form Merkezi ("etkinlik-kayit-formu") */}
                                                <InlineFormCenterForm
                                                    slug="etkinlik-kayit-formu"
                                                    themeKey="site"
                                                    context={{ entityType: 'News', entityId: String(selectedNews.id), label: selectedNews.title }}
                                                    buttonClassName="w-full px-6 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                                                    onSubmitted={() => { setRsvpSubmitted(true); setShowRsvpForm(false); }}
                                                />
                                                <button
                                                    onClick={() => setShowRsvpForm(false)}
                                                    className="mt-3 w-full px-6 py-3 bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        )}

                                        {rsvpSubmitted && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="text-3xl">✅</span>
                                                </div>
                                                <h3 className="font-orbitron text-xl text-green-400 mb-2">Kaydınız Alındı!</h3>
                                                <p className="text-gray-400">Etkinlik hakkında detaylı bilgi e-posta adresinize gönderilecektir.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {selectedImage && selectedNews?.gallery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X className="w-8 h-8" />
                        </motion.button>

                        {/* Navigation Buttons */}
                        {selectedNews.gallery.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = selectedNews.gallery!.indexOf(selectedImage);
                                        const prevIndex = currentIndex === 0 ? selectedNews.gallery!.length - 1 : currentIndex - 1;
                                        setSelectedImage(selectedNews.gallery![prevIndex]);
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8 rotate-180" />
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = selectedNews.gallery!.indexOf(selectedImage);
                                        const nextIndex = currentIndex === selectedNews.gallery!.length - 1 ? 0 : currentIndex + 1;
                                        setSelectedImage(selectedNews.gallery![nextIndex]);
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        {/* Image */}
                        <motion.img
                            key={selectedImage} // Key helps Framer Motion detect changes for animation
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            src={selectedImage}
                            alt="Full screen view"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
