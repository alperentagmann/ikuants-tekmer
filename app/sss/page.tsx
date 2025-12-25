"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqData = [
    {
        question: "TEKMER nedir?",
        answer: "TEKMER (Teknoloji Geliştirme Merkezi), girişimcilere ve start-up şirketlerine ön kuluçka, kuluçka ve büyüme süreçlerinde destek sağlayan, KOSGEB tarafından desteklenen merkezlerdir. İKÜANTS TEKMER, İstanbul Kültür Üniversitesi bünyesinde faaliyet göstermektedir."
    },
    {
        question: "TEKMER'e kimler başvurabilir?",
        answer: "Teknoloji tabanlı iş fikirleri olan girişimciler, üniversite öğrencileri, akademisyenler ve yenilikçi projeleri olan herkes TEKMER'e başvurabilir. Başvuru için bir iş fikri veya proje planı olması yeterlidir."
    },
    {
        question: "TEKMER'de kalış süresi ne kadardır?",
        answer: "Ön kuluçka süreci genellikle 6-12 ay, kuluçka süreci ise 2-3 yıl arasında değişmektedir. Bu süreler projenin gelişim durumuna göre uzatılabilir."
    },
    {
        question: "TEKMER'de yer almanın avantajları nelerdir?",
        answer: "TEKMER'de yer alan girişimciler; vergi muafiyetleri, SGK prim destekleri, Ar-Ge indirimleri, personel maaş destekleri, ofis imkanı, mentorluk, ağ oluşturma fırsatları ve KOSGEB desteklerine erişim gibi birçok avantajdan yararlanabilir."
    },
    {
        question: "Başvuru süreci nasıl işliyor?",
        answer: "Online başvuru formu doldurulduktan sonra ön değerlendirme yapılır. Uygun görülen projeler jüri değerlendirmesine alınır ve kabul edilen girişimcilerle görüşme yapılarak süreç başlatılır."
    },
    {
        question: "Fiziksel ofis zorunlu mu?",
        answer: "Hayır, fiziksel ofis kullanımı zorunlu değildir. Hibrit çalışma modeli desteklenmektedir. Ancak ofis kullanmak isteyen girişimcilere modern çalışma alanları sağlanmaktadır."
    },
    {
        question: "TEKMER'den mezuniyet sonrası destek var mı?",
        answer: "Evet, TEKMER mezunları da ekosistem içinde kalmaya devam eder. Mezun girişimciler networking etkinliklerine katılabilir ve danışmanlık hizmetlerinden faydalanabilir."
    },
    {
        question: "Hangi sektörlerden projeler kabul ediliyor?",
        answer: "Yapay Zeka, Cloud, Mobil Teknolojiler, Oyun, Animasyon, Fintech, Edutech, Biyoteknoloji, Medikal Cihaz ve Yenilikçi Teknolojiler gibi geniş bir yelpazede projeler kabul edilmektedir."
    }
];

export default function SSSPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="py-24 relative min-h-screen">
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
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        Sıkça Sorulan Sorular
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER hakkında merak edilenleri sizler için derledik.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-white pr-4">{faq.question}</span>
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
                                        <div className="px-6 pb-6 text-gray-400 border-t border-white/10 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
