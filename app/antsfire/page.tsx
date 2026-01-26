"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Flame, Rocket, Target, Users, Calendar, MapPin, CheckCircle,
    ArrowRight, Trophy, BookOpen, BarChart, Shield, Zap, HelpCircle,
    ChevronDown, ChevronUp, FileText, Clock, Award, Building, DollarSign
} from "lucide-react";
import Link from "next/link";

// Program Phases - 3 Faz
const phases = [
    {
        id: 0,
        title: "Faz 0: Başvuru & Seçim",
        period: "Şubat 2026",
        dates: "02 - 27 Şubat",
        description: "Başvurular, uygunluk kontrolü, jüri puanlama ve kabul listesinin ilanı.",
        details: ["02 Şubat: Başvurular açılır", "22 Şubat: Başvurular kapanır", "25-27 Şubat: Sonuçlar ilan edilir"],
        output: "Kabul listesi + başlangıç evrakları"
    },
    {
        id: 1,
        title: "Faz 1: Eğitim & Mentörlük",
        period: "Mart - Nisan 2026",
        dates: "02 Mart - 16 Nisan",
        description: "34 saat zorunlu eğitim + 25 saat bire bir mentörlük ile ortak metodoloji kazandırma.",
        details: ["34 saat eğitim (Salı-Perşembe)", "25 saat bire bir mentörlük", "KPI seti & yol haritası oluşturma"],
        output: "Yol haritası + KPI seti + satış/GTM planı"
    },
    {
        id: 2,
        title: "Faz 2: Kuluçka",
        period: "Mayıs - Kasım 2026",
        dates: "Mayıs - Kasım",
        description: "Düzenli eğitim yok; yer edinme, danışmanlık, altyapı ve takip ile ticarileşme desteği.",
        details: ["30 Nisan: Proje lansmanı", "Yer edinme & danışmanlık", "Aylık KPI check-in"],
        output: "KPI ilerleme + iş geliştirme + yatırım hazırlığı"
    }
];

// Eğitim Takvimi - 12 Oturum
const trainingSchedule = [
    { date: "03 Mart Salı", title: "Program Oryantasyonu + KPI Çerçevesi + TRL/Ürün Durum Analizi", category: "Girişimcilik", output: "Mevcut Durum & Hedef KPI taslağı" },
    { date: "05 Mart Perşembe", title: "Pazar Analizi, ICP Tanımı ve Müşteri Segmentasyonu", category: "İş Geliştirme", output: "Net ICP dokümanı" },
    { date: "10 Mart Salı", title: "İleri Seviye İş Modeli Tasarımı ve Değer Önerisi", category: "Girişimcilik", output: "Güncellenmiş iş modeli" },
    { date: "12 Mart Perşembe", title: "Go-To-Market Stratejisi ve İlk 90 Gün", category: "İş Geliştirme", output: "90 günlük GTM planı" },
    { date: "24 Mart Salı", title: "Finansal Yapı, Runway ve Birim Ekonomi", category: "Girişimcilik", output: "12 aylık finansal özet" },
    { date: "26 Mart Perşembe", title: "Satış Hunisi, Teklif Yapısı ve CRM Disiplini", category: "İş Geliştirme", output: "Satış hunisi ve teklif şablonu" },
    { date: "31 Mart Salı", title: "Hukuk, Sözleşmeler ve IP Stratejisi", category: "Girişimcilik", output: "Hukuk & IP aksiyon listesi" },
    { date: "02 Nisan Perşembe", title: "Dijital Pazarlama Stratejisi (İleri Seviye)", category: "Dijital Pazarlama", output: "90 günlük dijital pazarlama planı" },
    { date: "07 Nisan Salı", title: "Yatırım Hazırlığı ve Pitch Kurgusu", category: "Girişimcilik", output: "Pitch deck taslak yapısı" },
    { date: "09 Nisan Perşembe", title: "Growth, Funnel Optimizasyonu ve Metrikler", category: "Dijital Pazarlama", output: "Funnel iyileştirme aksiyonları" },
    { date: "14 Nisan Salı", title: "Büyüme, Ölçeklenme ve Stratejik Kararlar", category: "Girişimcilik", output: "6-12 aylık büyüme yol haritası" },
    { date: "16 Nisan Perşembe", title: "Kurumsal Satış, İş Birlikleri ve Ortaklık Modelleri", category: "Dijital Pazarlama", output: "Kurumsal satış ve iş birliği planı" }
];

// Mentörlük Takvimi
const mentorshipSchedule = [
    { week: "Hafta 1", dates: "09-13 Mart", theme: "Yol haritası & KPI netleştirme", output: "5 haftalık aksiyon planı" },
    { week: "Hafta 2", dates: "23-27 Mart", theme: "Satış sistemi & hedef müşteri", output: "ICP + pipeline hedefi" },
    { week: "Hafta 3", dates: "30 Mart - 3 Nisan", theme: "Growth & pazarlama kanalı", output: "30/90 günlük plan" }
];

// Hızlı Bilgi Tablosu
const quickInfo = [
    { label: "Program Adı", value: "ANTSFire Kuluçka Programı" },
    { label: "Ön Koşul", value: "ANTSPARK mezuniyeti veya Ar-Ge projesi ile TEKMER kabulü" },
    { label: "Süre", value: "9 Ay" },
    { label: "Hedef Kitle", value: "Şirketleşmiş, Ar-Ge odaklı, TRL≥4 girişimler" },
    { label: "Kontenjan", value: "10 girişim" },
    { label: "Eğitim", value: "34 saat (16s Girişimcilik + 18s İş Geliştirme)" },
    { label: "Mentörlük", value: "25 saat bire bir" },
    { label: "Eğitim Günleri", value: "Salı-Perşembe 13.00-16.00" },
    { label: "Mentörlük Günleri", value: "Pazartesi-Cuma" },
    { label: "Lansman", value: "30 Nisan 2026" },
    { label: "Devam Zorunluluğu", value: "En az %70" }
];

// Seçim Kriterleri Puanlama
const scoringCriteria = [
    { category: "Problem ve Değer Önerisi", points: 15, details: "Problem netliği, farklılaştırıcı çözüm, ölçülebilirlik" },
    { category: "Teknoloji/Ar-Ge ve TRL", points: 20, details: "Teknolojik üstünlük, TRL seviyesi, teknik riskler" },
    { category: "Pazar ve GTM", points: 15, details: "Hedef pazar, GTM kanalları, fiyatlama" },
    { category: "Ekip ve İcra Kabiliyeti", points: 15, details: "Kurucu uyumu, rol dağılımı, bağlılık" },
    { category: "Traction / İlerleme", points: 15, details: "Pilot/LOI kanıtı, metrik olgunluğu" },
    { category: "Finansal Sürdürülebilirlik", points: 10, details: "Runway, bütçe disiplini, birim ekonomi" },
    { category: "TEKMER Stratejik Uyum", points: 10, details: "Küme uyumu, ekosistem katkısı" }
];

// FAQ - 20 Soru
const faqs = [
    { q: "Kimler başvurabilir?", a: "Şirketleşmiş (Ltd/A.Ş.) ve Ar-Ge/yenilik bileşeni taşıyan, TRL≥4 seviyesinde ürün/prototip geliştirmiş, ANTSPARK mezunu veya Ar-Ge projesiyle TEKMER kabul koşulunu sağlayan girişimler başvurabilir." },
    { q: "Program ücretli mi?", a: "Programın eğitim ve mentörlük bileşenleri program kapsamında yürütülür. Yer edinme tercih edilirse ilgili ücretlendirme modeli uygulanır (ücretsiz dönem + indirim + standart)." },
    { q: "Eğitimlere katılım zorunlu mu?", a: "Evet. ANTSFire'de eğitimler seçmeli değildir. Programa kabul edilen her girişim tüm eğitim oturumlarına katılır." },
    { q: "Mentörlük bire bir mi?", a: "Evet. Mentörlük bire bir yürütülür ve her girişim haftada 50 dakika mentörlük alır." },
    { q: "Devam zorunluluğu nedir?", a: "Eğitim ve mentörlük oturumlarının en az %70'ine katılım zorunludur." },
    { q: "Şirket merkezini TEKMER'e taşımak zorunlu mu?", a: "Zorunlu değildir. Ancak yer edinmeden yararlanmak isteyen girişimler için adres/yer edinme uygulaması TEKMER prosedürleri çerçevesinde yürütülür." },
    { q: "1 Mayıs sonrası eğitim olacak mı?", a: "Hayır. Program kurgusu gereği 1 Mayıs sonrası düzenli eğitim planlanmaz. Bu dönem kuluçka ve danışmanlık ağırlıklıdır." },
    { q: "Lansman ne zaman?", a: "30 Nisan 2026 tarihinde proje duyuru/lansman planlanmıştır." },
    { q: "Yatırım garantisi var mı?", a: "Hayır. Program yatırım garantisi sunmaz; ancak yatırım hazırlığı (deck, data room vb.) ve ekosistem erişimi desteklenir." },
    { q: "Program sonunda mezuniyet nasıl olur?", a: "Devam ve yükümlülüklerini sağlayan, KPI hedeflerinde ilerleme gösteren girişimler programdan mezun kabul edilir." },
    { q: "Mentörler nasıl atanıyor?", a: "İhtiyaç analizi + mentor havuzu + çıkar çatışması kontrolü ile eşleştirme yapılır." },
    { q: "Mentör değişikliği mümkün mü?", a: "Gerekçeli talep ve program yöneticisinin onayı ile değerlendirilebilir." },
    { q: "Eğitimler hibrit mi?", a: "Programın çekirdek oturumları öncelikle belirlenen formatta yürütülür; gerektiğinde çevrim içi destek sağlanabilir." },
    { q: "Ofis almak zorunlu mu?", a: "Hayır. Yer edinme bir tercih alanıdır." },
    { q: "Yer edinmezsek programdan yararlanabilir miyiz?", a: "Evet. Ancak yer edinme avantajları ve kuluçka içi fiziksel kaynak kullanımı farklılaşabilir." },
    { q: "Kuluçka döneminde hangi destek var?", a: "Danışmanlık (kota), yönlendirme, ekosistem erişimi, görünürlük, yatırım hazırlığı destekleri vardır." },
    { q: "Program sonunda sertifika veriliyor mu?", a: "Devam ve yükümlülükleri sağlayan girişimlere mezuniyet/katılım belgesi düzenlenir." },
    { q: "Programdan çıkarsak ne olur?", a: "Yer edinme teşvikleri ve program hakları program yöneticisi tarafından yeniden değerlendirilir." },
    { q: "İki kurucu katılamazsa ne olur?", a: "Kurucu bağlılığı önemlidir; program yöneticisi minimum katılım koşullarını işletir." },
    { q: "Program çıktıları nasıl raporlanır?", a: "Aylık KPI check-in + dönem kapanış raporu ile izlenir." }
];

export default function AntsFirePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'training' | 'mentorship'>('training');

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
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-bold tracking-wider">KULUÇKA PROGRAMI • 9 AY</span>
                    </div>

                    <h1 className="font-orbitron font-bold text-5xl md:text-7xl mb-6 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 dark:from-orange-400 dark:via-red-500 dark:to-orange-400">
                            ANTSFire
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-light mb-4">
                        Kıvılcımı ateşe dönüştür, şirketini ölçekle!
                    </p>

                    <p className="text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-10 leading-relaxed">
                        ANTSFire; ANTSPARK Ön Kuluçka'dan mezun olmuş veya Ar-Ge projesi ile TEKMER bünyesine kabul edilmiş
                        şirketleşmiş girişimlere yönelik, toplam <strong>9 ay</strong> süreli, yapılandırılmış gelişim ve ölçeklenme programıdır.
                        Program; zorunlu çekirdek eğitimler ve bire bir mentörlük ile kısa sürede ortak bir metodoloji kazandırır;
                        ardından TEKMER kaynakları, danışmanlık ve iş geliştirme desteğiyle girişimi ticarileşme ve ölçeklenmeye taşır.
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
                        { label: "Süre", value: "9 Ay", sub: "Mart - Kasım 2026", icon: Calendar },
                        { label: "Kontenjan", value: "10 Girişim", sub: "Şirketleşmiş", icon: Users },
                        { label: "Eğitim", value: "34 Saat", sub: "Zorunlu Çekirdek", icon: BookOpen },
                        { label: "Mentörlük", value: "25 Saat", sub: "Bire Bir", icon: Target }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-[#0a0a0a]/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 p-6 rounded-2xl text-center group hover:border-orange-500/30 transition-colors shadow-lg dark:shadow-none"
                        >
                            <stat.icon className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                            <h3 className="text-2xl md:text-3xl font-orbitron font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{stat.value}</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-xs text-gray-500 mt-2">{stat.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* HIZLI BİLGİ TABLOSU */}
                <section id="details" className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-gray-900 dark:text-white">Hızlı Bilgi</h2>
                        <p className="text-gray-600 dark:text-gray-400">Program hakkında özet bilgiler</p>
                    </div>

                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg dark:shadow-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {quickInfo.map((info, index) => (
                                <div
                                    key={index}
                                    className={`p-5 border-b border-gray-100 dark:border-white/5 ${index % 3 !== 2 ? 'lg:border-r' : ''} ${index % 2 !== 1 ? 'md:border-r lg:border-r-0' : ''} ${index % 2 === 0 ? 'md:border-r' : ''}`}
                                >
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">{info.label}</p>
                                    <p className="text-gray-900 dark:text-white font-semibold">{info.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PROGRAM COMPARISON */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-gray-900 dark:text-white">Ön Kuluçka ile Farklar</h2>
                        <p className="text-gray-600 dark:text-gray-400">ANTSPARK ile başlayan yolculuğunuzu bir üst seviyeye taşıyın</p>
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

                            {/* Rows */}
                            {[
                                { label: "Katılım Koşulu", spark: "Erken aşama ekip/fikir", fire: "Şirketleşmiş + TRL≥4 + TEKMER kabul" },
                                { label: "Süre", spark: "6-12 hafta", fire: "9 ay" },
                                { label: "Eğitim Modeli", spark: "Temel modüller", fire: "Zorunlu ileri seviye çekirdek eğitim (34s)" },
                                { label: "Mentörlük", spark: "Genel yönlendirme", fire: "Bire bir mentörlük + çıktı ve KPI takibi" },
                                { label: "Hedef", spark: "Fikir → MVP hazırlığı", fire: "MVP → pilot/satış → yatırım hazırlığı" },
                                { label: "Başarı Ölçümü", spark: "Katılım ve teslimler", fire: "KPI bazlı performans (pilot, gelir, yatırım)" }
                            ].map((row, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="p-4 flex items-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">{row.label}</div>
                                    <div className="p-4 text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-purple-50/50 dark:bg-purple-900/5">{row.spark}</div>
                                    <div className="p-4 text-center text-gray-800 dark:text-gray-300 font-medium border-b border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10 border-x border-orange-200 dark:border-orange-500/20">{row.fire}</div>
                                </React.Fragment>
                            ))}

                            {/* Footer Row */}
                            <div className="p-6 flex items-center font-semibold text-gray-700 dark:text-gray-300">Kaynak Kullanımı</div>
                            <div className="p-6 bg-purple-50 dark:bg-purple-900/5 rounded-b-2xl border-b border-x border-purple-200 dark:border-purple-500/10 text-center text-gray-600 dark:text-gray-400">Temel altyapı</div>
                            <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-b-2xl border-b border-x border-orange-200 dark:border-orange-500/20 text-center">
                                <span className="text-orange-600 dark:text-orange-400 font-bold">Yer edinme + profesyonel hizmetler</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TIMELINE / PHASES */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-gray-900 dark:text-white">Program Mimarisi</h2>
                        <p className="text-gray-600 dark:text-gray-400">10 aylık yolculuğunuzun 3 ana fazı</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {phases.map((phase, index) => (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all group shadow-md dark:shadow-none"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                                        {phase.id}
                                    </div>
                                    <div>
                                        <div className="text-orange-600 dark:text-orange-500 text-sm font-bold">{phase.period}</div>
                                        <div className="text-xs text-gray-500">{phase.dates}</div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{phase.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{phase.description}</p>
                                <ul className="space-y-2 mb-4">
                                    {phase.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                    <p className="text-xs text-gray-400">Temel Çıktı:</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">{phase.output}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* EĞİTİM & MENTÖRLÜK TAKVİMİ */}
                <section className="mb-24 bg-gray-900 dark:bg-[#0a0a0a] rounded-3xl p-8 md:p-12 border border-gray-800 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

                    <div className="relative z-10 mb-8">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-white">Eğitim & Mentörlük Takvimi</h2>
                        <p className="text-gray-400 max-w-2xl mb-6">
                            <strong>Faz 1</strong> kapsamında 34 saat zorunlu eğitim ve 25 saat bire bir mentörlük.
                            Tüm oturumlar <strong>Mart - Nisan 2026</strong> arasında gerçekleşir.
                        </p>

                        {/* Tab Switch */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('training')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'training'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4 inline-block mr-2" />
                                Eğitim (34 Saat)
                            </button>
                            <button
                                onClick={() => setActiveTab('mentorship')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'mentorship'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                            >
                                <Users className="w-4 h-4 inline-block mr-2" />
                                Mentörlük (25 Saat)
                            </button>
                        </div>
                    </div>

                    {/* Training Schedule */}
                    {activeTab === 'training' && (
                        <div className="relative z-10 space-y-3">
                            <div className="text-sm text-gray-500 mb-4">
                                📌 Bayram Tatili: 14-22 Mart arası eğitim yok | 📌 23 Nisan: Resmi tatil
                            </div>
                            {trainingSchedule.map((session, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="shrink-0 w-28 text-center">
                                        <div className="text-xs text-orange-400 font-mono">{session.date.split(' ')[0]} {session.date.split(' ')[1]}</div>
                                        <div className="text-xs text-gray-500">{session.date.split(' ')[2]}</div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-semibold mb-1">{session.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${session.category === 'Girişimcilik'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : session.category === 'İş Geliştirme'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-purple-500/20 text-purple-400'
                                                }`}>
                                                {session.category}
                                            </span>
                                            <span className="text-xs text-gray-500">Çıktı: {session.output}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mentorship Schedule */}
                    {activeTab === 'mentorship' && (
                        <div className="relative z-10">
                            <div className="text-sm text-gray-400 mb-6">
                                10 girişim × 50 dakika × 3 hafta = Toplam 25 saat mentörlük.<br />
                                5 girişim Pazartesi, 5 girişim Cuma mentörlük alır.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {mentorshipSchedule.map((week, idx) => (
                                    <div key={idx} className="p-6 rounded-xl bg-white/5 border border-white/10">
                                        <div className="text-orange-400 font-bold mb-1">{week.week}</div>
                                        <div className="text-xs text-gray-500 mb-4">{week.dates}</div>
                                        <h4 className="text-white font-semibold mb-3">{week.theme}</h4>
                                        <div className="pt-3 border-t border-white/10">
                                            <p className="text-xs text-gray-400">Oturum Çıktısı:</p>
                                            <p className="text-sm text-orange-400">{week.output}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* YER EDİNME & ÜCRETLENDİRME */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-orbitron font-bold mb-4 text-gray-900 dark:text-white">Yer Edinme & Ücretlendirme</h2>
                        <p className="text-gray-600 dark:text-gray-400">1 yıl taahhütlü teşvik modeli</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { period: "Eğitim & Mentörlük Dönemi", months: "Mart - Nisan", discount: "Ücretsiz", icon: BookOpen, color: "green" },
                            { period: "Kuluçka Başlangıcı", months: "Mayıs - Temmuz", discount: "%50 İndirim", icon: Building, color: "orange" },
                            { period: "Standart Dönem", months: "Ağustos +", discount: "Standart Ücret", icon: DollarSign, color: "gray" }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center shadow-md dark:shadow-none"
                            >
                                <item.icon className={`w-10 h-10 mx-auto mb-4 ${item.color === 'green' ? 'text-green-500' : item.color === 'orange' ? 'text-orange-500' : 'text-gray-500'
                                    }`} />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.period}</h3>
                                <p className="text-sm text-gray-500 mb-4">{item.months}</p>
                                <div className={`inline-block px-4 py-2 rounded-full font-bold ${item.color === 'green'
                                    ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                    : item.color === 'orange'
                                        ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                        : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {item.discount}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        ⚠️ Yer edinmeden yararlanan girişimler, eğitim ve mentörlük süreci tamamlandıktan sonra en az <strong>1 yıl</strong> TEKMER'de kalmayı kabul eder.
                    </p>
                </section>

                {/* SEÇİM KRİTERLERİ & PUANLAMA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
                    {/* Scoring Criteria */}
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white">Puanlama Rubriği</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Başvurular 100 puan üzerinden değerlendirilir. Kabul eşiği: <strong>70/100</strong>
                        </p>
                        <div className="space-y-3">
                            {scoringCriteria.map((criteria, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-lg">
                                    <div>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{criteria.category}</span>
                                        <p className="text-xs text-gray-500">{criteria.details}</p>
                                    </div>
                                    <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0 ml-4">{criteria.points} puan</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Eligibility Criteria */}
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white">Ön Koşullar</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Aşağıdaki koşullar sağlanmıyorsa başvuru "uygun değil" kabul edilebilir.
                        </p>
                        <ul className="space-y-3">
                            {[
                                "Şirketleşme (Ltd/A.Ş.)",
                                "TEKMER kabul koşulu (ANTSPARK mezuniyeti veya Ar-Ge projesi)",
                                "TRL ≥ 4 seviyesinde ürün/prototip",
                                "Kurucu bağlılığı (en az 1 kurucu aktif)",
                                "Program koşullarının kabulü (devam, raporlama, etik)"
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
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-semibold text-gray-900 dark:text-gray-200 pr-4">{faq.q}</span>
                                    {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
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
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-4 max-w-2xl mx-auto relative z-10">
                        Son başvuru: <strong>22 Şubat 2026</strong>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto relative z-10">
                        Sınırlı kontenjan (10 girişim) için başvurular devam ediyor.
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
