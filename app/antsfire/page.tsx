"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Flame, Rocket, Target, Users, Calendar, MapPin, CheckCircle,
    ArrowRight, Trophy, BookOpen, BarChart, Shield, Zap, HelpCircle,
    ChevronDown, ChevronUp, FileText, Search
} from "lucide-react";
import Link from "next/link";

// Program Phases
const phases = [
    {
        id: 0,
        title: "Faz 0: Kabul ve İhtiyaç Analizi",
        period: "1. Ay",
        description: "Kurucu görüşmeleri, ihtiyaç analizi, firma bazlı yol haritası, hedef ve KPI’ların belirlenmesi.",
        details: ["Kurucu Görüşmeleri", "İhtiyaç Analizi", "Yol Haritası & KPI"]
    },
    {
        id: 1,
        title: "Faz 1: Eğitim (Zorunlu Çekirdek)",
        period: "1-3. Ay",
        description: "Girişimcilik ve Dijital Pazarlama eğitimlerinin hibrit ve uygulamalı olarak tamamlanması.",
        details: ["Girişimcilik Eğitimi", "Dijital Pazarlama", "Uygulamalı Atölyeler"]
    },
    {
        id: 2,
        title: "Faz 2: Ana Mentorluk",
        period: "4-6. Ay",
        description: "Haftalık ana mentorluk görüşmeleri, aylık performans toplantıları ve aksiyon takibi.",
        details: ["Birebir Ana Mentorluk", "Aylık Performans Takibi", "Çıktı Odaklı İlerleme"]
    },
    {
        id: 3,
        title: "Faz 3: İş Geliştirme & Teknik Mentorluk",
        period: "7-12. Ay",
        description: "İhtiyaca göre teknik mentorluk, yatırım hazırlığı, ölçeklenme ve mezuniyet.",
        details: ["Teknik Mentorluk", "Yatırım Hazırlığı", "Demo Day & Mezuniyet"]
    }
];

// Modules
const modules = [
    { code: "M01", title: "İş Modeli Tasarımı ve Strateji", desc: "İş modeli güncelleme, değer önerisi, fiyatlama" },
    { code: "M02", title: "Müşteri Keşfi ve Doğrulama", desc: "Görüşme rehberi, ICP, problem-çözüm uyumu" },
    { code: "M03", title: "B2B Satış Sistemi", desc: "Satış hunisi, teklif/CRM, satış metrikleri" },
    { code: "M04", title: "Dijital Pazarlama ve Büyüme", desc: "Kanal seçimi, içerik planı, ölçümleme" },
    { code: "M05", title: "Finans ve Nakit Akışı", desc: "Bütçe, birim ekonomi, runway, senaryolar" },
    { code: "M06", title: "Hukuk, Sözleşmeler ve IP", desc: "NDA, sözleşmeler, IP stratejisi" },
    { code: "M07", title: "Ürün Yol Haritası ve Hedefler", desc: "Roadmap, OKR, önceliklendirme" },
    { code: "M08", title: "Regülasyon ve Uygunluk", desc: "Sektöre göre regülasyon, uyum gereklilikleri" },
    { code: "M09", title: "Pitch Deck ve Yatırım Hazırlığı", desc: "Deck kurgusu, metrikler, hikaye" },
    { code: "M10", title: "Data Room ve Dokümantasyon", desc: "Veri odası şablonları, due diligence" },
    { code: "M11", title: "Operasyonel Ölçekleme", desc: "Süreç, KPI, hizmet/ürün operasyonu" },
    { code: "M12", title: "Liderlik ve Ekip Yönetimi", desc: "Rol tasarımı, kültür, performans" }
];

// FAQ
const faqs = [
    { q: "Program ücretli mi?", a: "Hayır, ANTSFire Kuluçka Programı ücretsizdir." },
    { q: "Her girişim aynı eğitimi mi alacak?", a: "Çekirdek eğitimler (Girişimcilik ve Dijital Pazarlama) zorunludur; ek modüller ihtiyaç analizine göre açılır." },
    { q: "Mentorlar nasıl seçiliyor?", a: "Mentor havuzumuzdan ihtiyaçlarınıza en uygun uzmanlar, çıkar çelişkisi kontrolü yapılarak sizinle eşleştirilir." },
    { q: "Yatırım garantisi var mı?", a: "Yatırım garantisi verilmemektedir ancak yatırım hazırlığı ve yatırımcı ağlarına erişim konusunda yoğun destek sağlanır." },
    { q: "Haftalık zaman yükü nedir?", a: "Eğitim fazında (ilk 3 ay) azami 4 saat; ana mentorluk fazında (sonraki 3 ay) azami 1 saat; son 6 ay ise ihtiyaca göre planlanır." },
    { q: "Hangi aşamadaki girişimler başvurabilir?", a: "Şirketleşmiş, Ar-Ge odaklı ve tercihen ANTSPARK mezunu girişimler başvurabilir." }
];

export default function AntsFirePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* HERO SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-8">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-bold tracking-wider">İLERİ SEVİYE KULUÇKA PROGRAMI</span>
                    </div>

                    <h1 className="font-orbitron font-bold text-5xl md:text-7xl mb-6 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 dark:from-orange-400 dark:via-red-500 dark:to-orange-400">
                            ANTSFire
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-light mb-4">
                        Kıvılcımı ateşe dönüştür, şirketini ölçekle!
                    </p>

                    <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                        ANTSPARK mezunu veya Ar-Ge odaklı şirketleşmiş girişimler için tasarlanmış,
                        kişiselleştirilmiş 12 aylık (1 yıllık) gelişim ve ölçeklenme programı.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/antsfire-basvuru"
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-orbitron font-bold text-lg text-white hover:shadow-[0_0_30px_rgba(234,88,12,0.4)] transition-all flex items-center justify-center gap-2 group"
                        >
                            Programa Başvur
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#details"
                            className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-xl font-orbitron font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-700 dark:text-gray-300"
                        >
                            Detayları İncele
                        </a>
                    </div>
                </motion.div>

                {/* SUMMARY STATS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
                    {[
                        { label: "Süre", value: "12 Ay", sub: "1 Yıllık Döngü" },
                        { label: "Kontenjan", value: "10 Girişim", sub: "1 Kohort" },
                        { label: "Odak", value: "Ölçeklenme", sub: "Satış & Pilot" },
                        { label: "Destek", value: "Eğitim & Mentorluk", sub: "Kişiselleştirilmiş" }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-[#0a0a0a]/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 p-6 rounded-2xl text-center group hover:border-orange-500/30 transition-colors shadow-lg dark:shadow-none"
                        >
                            <h3 className="text-2xl md:text-3xl font-orbitron font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{stat.value}</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-xs text-gray-500 mt-2">{stat.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* PROGRAM COMPARISON */}
                <section id="details" className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-gray-900 dark:text-white">Neden ANTSFire?</h2>
                        <p className="text-gray-600 dark:text-gray-400">ANTSPARK ile başlayan yolculuğunuzu bir üst seviyeye taşıyın.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px] grid grid-cols-3 gap-4">
                            {/* Headers */}
                            <div className="col-span-1 p-6"></div>
                            <div className="col-span-1 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-t-2xl border-t border-x border-purple-200 dark:border-purple-500/30 text-center">
                                <Rocket className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400">ANTSPARK</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ön Kuluçka</p>
                            </div>
                            <div className="col-span-1 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-t-2xl border-t border-x border-orange-200 dark:border-orange-500/30 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-orange-500/5 pulse-slow" />
                                <Flame className="w-8 h-8 text-orange-600 dark:text-orange-500 mx-auto mb-3 relative z-10" />
                                <h3 className="text-xl font-bold text-orange-600 dark:text-orange-500 relative z-10">ANTSFire</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10">Kuluçka</p>
                            </div>

                            {/* Row 1 */}
                            <div className="p-4 flex items-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">Hedef</div>
                            <div className="p-4 text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-purple-50/50 dark:bg-purple-900/5">Fikir → MVP Hazırlığı</div>
                            <div className="p-4 text-center text-gray-800 dark:text-gray-300 font-medium border-b border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10 border-x border-orange-200 dark:border-orange-500/20">MVP → Pilot / Satış / Yatırım</div>

                            {/* Row 2 */}
                            <div className="p-4 flex items-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">Katılım Koşulu</div>
                            <div className="p-4 text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-purple-50/50 dark:bg-purple-900/5">Erken aşama ekip/fikir</div>
                            <div className="p-4 text-center text-gray-800 dark:text-gray-300 font-medium border-b border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10 border-x border-orange-200 dark:border-orange-500/20">Şirketleşmiş + Ar-Ge Projesi</div>

                            {/* Row 3 */}
                            <div className="p-4 flex items-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">Eğitim Modeli</div>
                            <div className="p-4 text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-purple-50/50 dark:bg-purple-900/5">Standart temel modüller</div>
                            <div className="p-4 text-center text-orange-600 dark:text-orange-400 font-bold border-b border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10 border-x border-orange-200 dark:border-orange-500/20">Zorunlu Çekirdek + Seçmeli</div>

                            {/* Row 4 */}
                            <div className="p-4 flex items-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">Mentorluk</div>
                            <div className="p-4 text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-purple-50/50 dark:bg-purple-900/5">Genel yönlendirme</div>
                            <div className="p-4 text-center text-gray-800 dark:text-gray-300 font-medium border-b border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10 border-x border-orange-200 dark:border-orange-500/20">Uygulama + Çıktı Takibi</div>

                            {/* Footer Row */}
                            <div className="p-6 flex items-center font-semibold text-gray-700 dark:text-gray-300">Ofis & Yatırım Desteği</div>
                            <div className="p-6 bg-purple-50 dark:bg-purple-900/5 rounded-b-2xl border-b border-x border-purple-200 dark:border-purple-500/10 text-center text-gray-600 dark:text-gray-400">Co-Working</div>
                            <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-b-2xl border-b border-x border-orange-200 dark:border-orange-500/20 text-center">
                                <CheckCircle className="w-6 h-6 text-orange-500 mx-auto" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* TIMELINE / PHASES */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-gray-900 dark:text-white">Program Mimarisi</h2>
                        <p className="text-gray-600 dark:text-gray-400">12 aylık yolculuğunuzun adım adım planı</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {phases.map((phase, index) => (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all group shadow-md dark:shadow-none"
                            >
                                <div className="text-orange-600 dark:text-orange-500 text-sm font-bold mb-2">{phase.period}</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{phase.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{phase.description}</p>
                                <ul className="space-y-2">
                                    {phase.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* MODULES */}
                <section className="mb-24 bg-gray-900 dark:bg-[#0a0a0a] rounded-3xl p-8 md:p-12 border border-gray-800 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

                    <div className="relative z-10 mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-white">Seçmeli Eğitim Modülleri</h2>
                        <p className="text-gray-400 max-w-2xl">
                            Eğitim paketiniz, <strong>Faz 0</strong>'da yapılan ihtiyaç analizi sonucunda size özel olarak oluşturulur.
                            Herkes her eğitimi almaz, sadece ihtiyacınız olana odaklanırsınız.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                        {modules.map((module) => (
                            <div key={module.code} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 font-mono text-orange-400 font-bold text-sm">
                                    {module.code}
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">{module.title}</h4>
                                    <p className="text-sm text-gray-500">{module.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* MENTOR + CRITERIA GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
                    {/* Mentorship */}
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white">Mentorluk Modeli</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Program boyunca her girişime bir <strong>Ana Mentor</strong> atanır.
                            Ana mentorunuz, yolculuğunuzda size rehberlik ederken, ihtiyaç duyduğunuz alanlarda
                            (Hukuk, Finans, Satış vb.) <strong>Uzman Mentorları</strong> devreye sokar.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl">
                                <span className="text-gray-700 dark:text-gray-300">Ana Mentor Görüşmesi (Faz 2)</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">Haftada 1</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl">
                                <span className="text-gray-700 dark:text-gray-300">Aylık Performans Toplantısı</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">Ayda 1</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl">
                                <span className="text-gray-700 dark:text-gray-300">Teknik Mentorluk (Faz 3)</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">2 Haftada 1</span>
                            </div>
                        </div>
                    </div>

                    {/* Criteria */}
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white">Seçim Kriterleri</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Başvurularınız; problem tanımı, çözümün yenilikçiliği, pazar potansiyeli ve ekip yetkinliği
                            çerçevesinde 100 puan üzerinden değerlendirilir.
                        </p>
                        <ul className="space-y-3">
                            {[
                                "Şirketleşmiş Olmak (veya plan sunmak)",
                                "ANTSPARK Mezunu veya Ar-Ge Projesi Sahibi Olmak",
                                "Ar-Ge / Yenilik Bileşeni İçermek",
                                "Tam Zamanlı Kurucu Bağlılığı"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* FAQ */}
                <section className="mb-24 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-orbitron font-bold text-center mb-12 text-gray-900 dark:text-white">Sıkça Sorulan Sorular</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-semibold text-gray-900 dark:text-gray-200">{faq.q}</span>
                                    {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </button>
                                {openFaq === index && (
                                    <div className="p-5 pt-0 text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-white/5">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* FINAL CTA */}
                <div className="text-center bg-gradient-to-r from-orange-100 via-red-100 to-orange-100 dark:from-orange-900/40 dark:via-red-900/40 dark:to-orange-900/40 border border-orange-200 dark:border-orange-500/30 rounded-3xl p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-orange-500/5 pulse-slow pointer-events-none" />
                    <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-gray-900 dark:text-white mb-6 relative z-10">
                        Ateşi Büyütmeye Hazır Mısın?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                        Sınırlı kontenjan için başvurular devam ediyor. Girişimini ölçeklendirmek için hemen başvur.
                    </p>
                    <Link
                        href="/antsfire-basvuru"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-xl hover:bg-gray-50 border border-gray-200 dark:border-transparent transition-all shadow-xl relative z-10"
                    >
                        Şimdi Başvur
                        <Rocket className="w-6 h-6" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
