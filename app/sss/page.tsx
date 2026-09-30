"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";

export default function SSSPage() {
    const [faqData, setFaqData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch('/api/public/faqs');
                const data = await res.json();
                if (data.success && Array.isArray(data.faqs)) {
                    setFaqData(data.faqs);
                }
            } catch (err) {
                console.error("Failed to load FAQs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const categories = ['ALL', ...Array.from(new Set(faqData.map(f => f.category || 'GENEL')))];
    const filteredFaqs = activeCategory === 'ALL' ? faqData : faqData.filter(f => (f.category || 'GENEL') === activeCategory);

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
                        <HelpCircle className="w-4 h-4 text-secondary" />
                        <span className="text-sm text-secondary font-mono">YARDIM MERKEZİ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Sıkça Sorulan Sorular
                    </h1>
                    <p className="text-black/70 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER hakkında merak edilenleri sizler için derledik.
                    </p>
                </motion.div>

                {categories.length > 2 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                                    activeCategory === cat
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                {cat === 'ALL' ? 'TÜMÜ' : cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-gray-500 font-mono text-sm">Sorular yükleniyor...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFaqs.map((faq, index) => (
                            <motion.div
                                key={faq.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-white/5 backdrop-blur-sm shadow-md dark:shadow-none"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-medium text-black dark:text-white pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-secondary transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 text-black/70 dark:text-gray-400 border-t border-gray-200 dark:border-white/10 pt-4 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
