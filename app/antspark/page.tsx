"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Calendar, Users, CheckCircle, Clock, BookOpen, User, ChevronDown, ChevronUp, MessageCircle, UserPlus } from "lucide-react";
import Link from "next/link";

// Eğitim verileri - Kasım/Aralık 2025, Ocak/Şubat 2026
const trainings = [
    // Kasım 2025
    { date: "17.11.2025", day: "Pazartesi", time: "14.00-15.00", topic: "Program Tanıtımı", description: "Tanışma - Lansman", trainer: "Alperen Tağman\nİKÜANTS TEKMER", status: "completed" },
    { date: "18.11.2025", day: "Salı", time: "15.00-18.00", topic: "Girişimcilik 101: Temel Kavramlar", description: "Girişimciliğin Girişi ve Temel Kavramlar", trainer: "Dr. Öğr. Üyesi Artür Yetvart Mumcu\nİstanbul Kültür Üniversitesi", status: "completed" },
    { date: "20.11.2025", day: "Perşembe", time: "15.00-18.00", topic: "Girişimcilik: Fikirden Girişime Adımlar", description: "Fikirlerin Girişim Potansiyeli", trainer: "Nizamettin Sami Harputlu\nStartup Centrum", status: "completed" },
    { date: "24.11.2025", day: "Pazartesi", time: "15.00-18.00", topic: "Business Canvas ve Yalın Canvas ile Fikir Çalışması", description: "İş modeli kanvası üzerinde fikir geliştirme", trainer: "Müge Bezgin\nStartup Centrum", status: "completed" },
    { date: "25.11.2025", day: "Salı", time: "15.00-18.00", topic: "Pazar Araştırması ve Fikirlerin Uygulanabilirliği", description: "Pazar büyüklüğü, segmentasyon, rakip analizi, kullanıcı görüşmeleri", trainer: "Filiz Aksoy\nBgmsz. Danışman", status: "completed" },
    { date: "27.11.2025", day: "Perşembe", time: "15.00-18.00", topic: "Girişimcilikte Psikolojik Dayanıklılık: Esneklik Geliştirme Atölyesi-1", description: "Esnek düşünme ve anda olma, Zayıf ve Güçlü Yanlar", trainer: "Dr. Öğr. Üyesi Meryem Demir Güdül\nİstanbul Kültür Üniversitesi", status: "completed" },
    // Aralık 2025
    { date: "01.12.2025", day: "Pazartesi", time: "15.00-18.00", topic: "Fikirden İş Modeline Temel Yapılandırma", description: "Business Model Canvas, gelir modeli türleri", trainer: "Çağrı Temel\nHezarfen LLC | Dover, DE", status: "completed" },
    { date: "02.12.2025", day: "Salı", time: "15.00-18.00", topic: "Finansal Planlama için Fikir Geliştirme", description: "Gelir/gider tahmini, nakit akışı", trainer: "Bikem İnce İnanç\nMalogra Danışmanlık", status: "completed" },
    { date: "03.12.2025", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    { date: "04.12.2025", day: "Perşembe", time: "15.00-18.00", topic: "Girişimcilikte Psikolojik Dayanıklılık: Esneklik Geliştirme Atölyesi-2", description: "Değerlerle yön bulma ve kararlı olma", trainer: "Dr. Öğr. Üyesi Meryem Demir Güdül\nİstanbul Kültür Üniversitesi", status: "completed" },
    { date: "08.12.2025", day: "Pazartesi", time: "15.00-18.00", topic: "Girişimciler İçin Hukuki Çerçeve", description: "Şirket türleri, sözleşmeler, KVKK", trainer: "İmren Öner Topaloğlu\nDr. Öğretim Üyesi Muharrem Tütüncü\nDr. Öğretim Üyesi Ender Demir", status: "completed" },
    { date: "09.12.2025", day: "Salı", time: "15.00-18.00", topic: "Dijital Pazarlamaya Giriş", description: "Dijital pazarlama stratejileri, hedef kitleye ulaşma", trainer: "Haydar Özkömürcü\nCremicro Digital Marketing Agency", status: "completed" },
    { date: "10.12.2025", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    { date: "11.12.2025", day: "Perşembe", time: "15.00-18.00", topic: "Girişimcilikte Psikolojik Dayanıklılık: Esneklik Geliştirme Atölyesi-3", description: "Değerlerle ve farkındalıkla liderlik etme", trainer: "Dr. İlker Çitli\nMEB & İstanbul Medipol Üniversitesi", status: "completed" },
    { date: "15.12.2025", day: "Pazartesi", time: "14.00-16.00", topic: "MasterClass", description: "Networking ve Panel", trainer: "Ventures & Mentors", status: "completed" },
    { date: "15.12.2025", day: "Pazartesi", time: "16.00-17.30", topic: "Fikri Mülkiyet Hakları", description: "Girişimciler İçin Fikri Mülkiyet Haklarının Önemi", trainer: "Hüseyin Demir\nAdres Patent", status: "completed" },
    { date: "16.12.2025", day: "Salı", time: "15.00-18.00", topic: "Fikir Değerlendirme Teknikleri", description: "SWOT, PESTEL, problem-doğrulama, pazar analizi", trainer: "Ufuk Batum\nVentures & Mentors League", status: "completed" },
    { date: "17.12.2025", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    { date: "18.12.2025", day: "Perşembe", time: "15.00-18.00", topic: "Fikirden Ürüne Giden Yol: Startup'ta İlk 90 Gün", description: "MVP geliştirme ve kullanıcı geri bildirimiyle iterasyon", trainer: "Çağrı Temel\nHezarfen LLC | Dover, DE", status: "completed" },
    { date: "24.12.2025", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    // Ocak 2026
    { date: "07.01.2026", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    { date: "08.01.2026", day: "Perşembe", time: "15.00-18.00", topic: "Girişimciler için Sürdürülebilirlik Eğitimi", description: "Çevresel etki analizi, sürdürülebilir iş modelleri", trainer: "Dr. Öğr. Üyesi Nazife Merve Hamzaoğlu\nİstanbul Kültür Üniversitesi", status: "completed" },
    { date: "12.01.2026", day: "Pazartesi", time: "15.00-18.00", topic: "Dijital Pazarlama: Sosyal Medya", description: "Platform seçimi, içerik planlama, sosyal medya yönetimi", trainer: "Müge Bezgin\nStartup Centrum", status: "completed" },
    { date: "13.01.2026", day: "Salı", time: "15.00-18.00", topic: "Dijital Pazarlama: SEO ve Web Optimizasyonu", description: "Arama motoru optimizasyonu, web sitesi performansı", trainer: "", status: "completed" },
    { date: "14.01.2026", day: "Çarşamba", time: "14.00-17.00", topic: "Girişimcilikte Psikolojik Dayanıklılık: Grup Mentörlüğü", description: "Ekip dinamikleri ve grup psikolojisi", trainer: "Dr. Öğr. Üyesi Meryem Demir Güdül\nİstanbul Kültür Üniversitesi\nDr. İlker Çitli\nMEB & İstanbul Medipol Üniversitesi", status: "completed" },
    { date: "15.01.2026", day: "Perşembe", time: "15.00-18.00", topic: "Dijital Pazarlama: Online Reklam Yönetimi", description: "Reklam kampanyası planlama, hedefleme ve bütçe yönetimi", trainer: "", status: "completed" },
    { date: "19.01.2026", day: "Pazartesi", time: "15.00-18.00", topic: "İş Geliştirme: Marka Stratejisi", description: "Marka kimliği oluşturma, müşteri algısı yönetimi", trainer: "Melis Dünya Sezen\nFiProduct", status: "completed" },
    { date: "20.01.2026", day: "Salı", time: "15.00-18.00", topic: "İş Geliştirme: E-Ticaret", description: "Online satış altyapıları, ödeme sistemleri, lojistik", trainer: "Berkalp Kaya\nHazır Cevap", status: "completed" },
    { date: "21.01.2026", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    { date: "22.01.2026", day: "Perşembe", time: "15.00-18.00", topic: "Dijital Pazarlama & İş Geliştirme: Analitik", description: "Veri analizi, ölçümleme, performans değerlendirme", trainer: "Emre Gül\nFiProduct", status: "completed" },
    { date: "26.01.2026", day: "Pazartesi", time: "15.00-18.00", topic: "Girişimciler için Teşvik ve Hibe Fırsatları", description: "KOSGEB, TÜBİTAK, yatırım fonları, hibe programları", trainer: "Sıla Dinçer\nÖdeAl R&D Manager", status: "completed" },
    { date: "28.01.2026", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
    { date: "29.01.2026", day: "Perşembe", time: "15.00-18.00", topic: "Stratejik Planlama", description: "Vizyon, misyon, hedef belirleme, uzun vadeli strateji", trainer: "Yusuf Yılmaz\nAtakDX", status: "completed" },
    // Şubat 2026
    { date: "02.02.2026", day: "Pazartesi", time: "15.00-18.00", topic: "Sunum Hazırlama", description: "Yatırımcıya yönelik pitch deck hazırlama, girişim hikayesi", trainer: "Bikem İnce İnanç\nMalogra Danışmanlık", status: "completed" },
    { date: "03.02.2026", day: "Salı", time: "15.00-18.00", topic: "Dijital İş Geliştirme ve Dönüşüm", description: "İş modeli inovasyonu ve dijital dönüşüm stratejileri", trainer: "", status: "completed" },
    { date: "04.02.2026", day: "Çarşamba", time: "14.00-17.00", topic: "Mentörlük", description: "Birebir Mentörlük Seansları", trainer: "", status: "completed" },
];

export default function AntsparkProgramPage() {
    const [showCompleted, setShowCompleted] = useState(true);
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [registeringFor, setRegisteringFor] = useState<string | null>(null);
    const [registerData, setRegisterData] = useState({ name: "", email: "", phone: "" });
    const [registered, setRegistered] = useState<string[]>([]);

    const completedTrainings = trainings.filter(t => t.status === "completed");
    const upcomingTrainings = trainings.filter(t => t.status === "upcoming");

    const handleRegister = (trainingDate: string) => {
        if (registerData.name && registerData.email && registerData.phone) {
            console.log('Registration:', { training: trainingDate, ...registerData });
            setRegistered([...registered, trainingDate]);
            setRegisteringFor(null);
            setRegisterData({ name: "", email: "", phone: "" });
        }
    };

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
                        <Rocket className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-mono">ÖN KULUÇKA PROGRAMI</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
                        ANTSPARK
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                        Fikrini büyüt, işine dönüştür, geleceğe imzanı at!
                    </p>

                    {/* CTA Button */}
                    <Link
                        href="/antspark-basvuru"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-orange-500/30"
                    >
                        <Rocket className="w-5 h-5" />
                        Programa Başvur
                    </Link>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center shadow-md dark:shadow-none">
                        <div className="text-3xl font-orbitron font-bold text-orange-600 dark:text-orange-400 mb-1">{completedTrainings.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Tamamlanan Eğitim</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center shadow-md dark:shadow-none">
                        <div className="text-3xl font-orbitron font-bold text-yellow-600 dark:text-yellow-400 mb-1">{upcomingTrainings.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Yaklaşan Eğitim</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center shadow-md dark:shadow-none">
                        <div className="text-3xl font-orbitron font-bold text-green-600 dark:text-green-400 mb-1">12+</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Mentör</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center shadow-md dark:shadow-none">
                        <div className="text-3xl font-orbitron font-bold text-purple-600 dark:text-purple-400 mb-1">3 Ay</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Program Süresi</div>
                    </div>
                </motion.div>

                {/* Completed Trainings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="w-full flex items-center justify-between p-6 rounded-2xl bg-green-500/10 border border-green-500/30 mb-4 hover:bg-green-500/15 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <span className="font-orbitron text-xl text-gray-900 dark:text-white">Tamamlanan Eğitimler</span>
                            <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-700 dark:text-green-400 text-sm">{completedTrainings.length}</span>
                        </div>
                        {showCompleted ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                    </button>

                    {showCompleted && (
                        <div className="space-y-3">
                            {completedTrainings.map((training, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-green-500/30 transition-all shadow-sm dark:shadow-none"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex items-center gap-3 md:w-48">
                                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            <span className="text-gray-900 dark:text-white font-medium">{training.date}</span>
                                            <span className="text-gray-500 text-sm">{training.day}</span>
                                        </div>
                                        <div className="flex items-center gap-2 md:w-28">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-400 text-sm">{training.time}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {training.topic === "Mentörlük" ? (
                                                    <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                ) : (
                                                    <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                )}
                                                <span className={`font-medium ${training.topic === "Mentörlük" ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-white"}`}>{training.topic}</span>
                                            </div>
                                            <p className="text-gray-500 text-sm mt-1">{training.description}</p>
                                        </div>
                                        {training.trainer && (
                                            <div className="flex items-start gap-2 md:w-56">
                                                <User className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                                                <span className="text-purple-700 dark:text-purple-300 text-sm whitespace-pre-wrap">{training.trainer}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Upcoming Trainings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                >
                    <button
                        onClick={() => setShowUpcoming(!showUpcoming)}
                        className="w-full flex items-center justify-between p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-4 hover:bg-yellow-500/15 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            <span className="font-orbitron text-xl text-gray-900 dark:text-white">Yaklaşan Eğitimler</span>
                            <span className="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-700 dark:text-yellow-400 text-sm">{upcomingTrainings.length}</span>
                        </div>
                        {showUpcoming ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                    </button>

                    {showUpcoming && (
                        <div className="space-y-3">
                            {upcomingTrainings.map((training, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-yellow-500/30 transition-all shadow-sm dark:shadow-none"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex items-center gap-3 md:w-48">
                                            <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            <span className="text-gray-900 dark:text-white font-medium">{training.date}</span>
                                            <span className="text-gray-500 text-sm">{training.day}</span>
                                        </div>
                                        <div className="flex items-center gap-2 md:w-28">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-400 text-sm">{training.time}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {training.topic === "Mentörlük" ? (
                                                    <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                ) : (
                                                    <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                )}
                                                <span className={`font-medium ${training.topic === "Mentörlük" ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-white"}`}>{training.topic}</span>
                                            </div>
                                            <p className="text-gray-500 text-sm mt-1">{training.description}</p>
                                        </div>
                                        {training.trainer && (
                                            <div className="flex items-start gap-2 md:w-56">
                                                <User className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                                                <span className="text-purple-700 dark:text-purple-300 text-sm whitespace-pre-wrap">{training.trainer}</span>
                                            </div>
                                        )}
                                        {/* Register Button */}
                                        <div className="md:w-32">
                                            {registered.includes(training.date + training.topic) ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Kayıtlı
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setRegisteringFor(training.date + training.topic)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-all"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Kayıt Ol
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Registration Form */}
                                    {registeringFor === training.date + training.topic && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Ad Soyad"
                                                    value={registerData.name}
                                                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                                    className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-sm focus:border-yellow-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="E-posta"
                                                    value={registerData.email}
                                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                    className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-sm focus:border-yellow-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Telefon"
                                                    value={registerData.phone}
                                                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                                    className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-sm focus:border-yellow-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRegister(training.date + training.topic)}
                                                        className="flex-1 px-3 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-all"
                                                    >
                                                        Kaydet
                                                    </button>
                                                    <button
                                                        onClick={() => setRegisteringFor(null)}
                                                        className="px-3 py-2 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                                    >
                                                        İptal
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Program Info */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-8 rounded-2xl bg-gradient-to-r from-orange-500/10 via-red-500/5 to-purple-500/10 border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
                >
                    <h3 className="font-orbitron text-xl text-gray-900 dark:text-white mb-4">Program Hakkında</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Eğitim Konuları</h4>
                            <ul className="space-y-1">
                                <li>• Girişimcilik Temelleri</li>
                                <li>• İş Modeli Geliştirme</li>
                                <li>• Dijital Pazarlama</li>
                                <li>• Finansal Planlama</li>
                                <li>• Fikri Mülkiyet Hakları</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Program Avantajları</h4>
                            <ul className="space-y-1">
                                <li>• 12+ Haftalık Yoğun Eğitim</li>
                                <li>• Birebir Mentörlük Desteği</li>
                                <li>• Networking Etkinlikleri</li>
                                <li>• Co-Working Alanı Kullanımı</li>
                                <li>• Demo Day Sunumu</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
