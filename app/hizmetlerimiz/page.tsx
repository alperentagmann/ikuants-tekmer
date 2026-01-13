"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    Building2, Users, GraduationCap, Handshake, FileCheck,
    Lightbulb, TrendingUp, Shield, ArrowRight
} from "lucide-react";

const services = [
    {
        id: 1,
        title: "Ofis Alanı ve Altyapı Desteği",
        icon: Building2,
        color: "from-purple-500 to-pink-500",
        description: "Girişimcilere işlerini kurabilecekleri modern ofis alanları sağlıyoruz.",
        details: [
            "Düşük maliyetli ofis kiralama imkanı",
            "Ar-Ge çalışmalarına uygun teknik altyapı",
            "Laboratuvar ekipmanları ve donanımlar",
            "Yazılım araçları ve geliştirme ortamları",
            "Yüksek hızlı internet ve BT altyapısı"
        ],
        highlight: "Teknoloji odaklı girişimler için tam donanımlı çalışma alanları"
    },
    {
        id: 2,
        title: "Mentorluk ve Danışmanlık Hizmetleri",
        icon: Users,
        color: "from-cyan-500 to-blue-500",
        description: "Deneyimli mentörler ve danışmanlardan birebir destek alın.",
        details: [
            "İş planı oluşturma rehberliği",
            "Pazarlama stratejileri geliştirme",
            "Finansal yönetim danışmanlığı",
            "Yatırımcı ilişkileri yönetimi",
            "Stratejik karar alma desteği"
        ],
        highlight: "20+ alanında uzman mentör kadrosu"
    },
    {
        id: 3,
        title: "Eğitim ve Gelişim Fırsatları",
        icon: GraduationCap,
        color: "from-green-500 to-teal-500",
        description: "Girişimcilerin ve ekiplerinin gelişimi için kapsamlı eğitim programları.",
        details: [
            "İş stratejileri ve yönetim eğitimleri",
            "Pazarlama ve satış atölyeleri",
            "Finansal okuryazarlık programları",
            "Ekip yönetimi ve liderlik",
            "Yeni teknolojiler ve inovasyon seminerleri",
            "Firmalarımız için Yüksek Lisans burs imkanı"
        ],
        highlight: "Üniversite iş birliğiyle düzenlenen sertifikalı programlar"
    },
    {
        id: 4,
        title: "Yatırımcı Ağı ve İş Birlikleri",
        icon: Handshake,
        color: "from-orange-500 to-red-500",
        description: "Geniş iş ağı ile yatırımcı ve iş birliği fırsatları sunuyoruz.",
        details: [
            "Potansiyel yatırımcılarla tanışma etkinlikleri",
            "Demo Day ve pitch sunumları",
            "Girişimciler arası networking",
            "Sektörel iş birlikleri kurma",
            "Ortak proje geliştirme imkanları"
        ],
        highlight: "Melek yatırımcı ve VC ağına doğrudan erişim"
    },
    {
        id: 5,
        title: "Ar-Ge Destekleri ve Vergi İndirimleri",
        icon: FileCheck,
        color: "from-indigo-500 to-purple-500",
        description: "Ar-Ge teşvikleri ve devlet desteklerinden yararlanın.",
        details: [
            "Ar-Ge vergi indirimleri rehberliği",
            "TÜBİTAK ve KOSGEB destek başvuruları",
            "Hibe programları danışmanlığı",
            "SGK teşvikleri bilgilendirmesi",
            "Teknoloji geliştirme bölgesi avantajları"
        ],
        highlight: "Devlet destekleriyle Ar-Ge maliyetlerinizi minimize edin"
    }
];

const benefits = [
    {
        icon: Lightbulb,
        title: "İnovasyon ve Teknoloji Gelişimi",
        description: "Yeni teknolojiler geliştirmenize ve yenilikçi çözümler üretmenize olanak tanıyoruz."
    },
    {
        icon: TrendingUp,
        title: "Sürdürülebilir Büyüme",
        description: "Sunduğumuz imkanlar sayesinde uzun vadeli büyüme hedeflerinize ulaşabilirsiniz."
    },
    {
        icon: Shield,
        title: "Risk Azaltma",
        description: "Çeşitli desteklerle iş dünyasında karşılaştığınız riskleri minimize etmenize yardımcı oluyoruz."
    }
];

export default function HizmetlerimizPage() {
    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">HİZMETLERİMİZ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        TEKMER'in Girişimcilere Sunduğu Hizmetler
                    </h1>
                    <p className="text-black/70 dark:text-gray-400 max-w-3xl mx-auto">
                        İKÜANTS TEKMER olarak girişimcilerimize kapsamlı destekler sunarak
                        onların büyümelerine ve başarılı olmalarına yardımcı oluyoruz.
                    </p>
                </motion.div>

                {/* Services Grid */}
                <div className="space-y-8 mb-20">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 hover:border-primary/30 dark:hover:border-white/20 transition-all shadow-md dark:shadow-none">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Left Side - Icon & Title */}
                                    <div className="lg:w-1/3">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <service.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="font-orbitron text-xl text-black dark:text-white font-bold mb-2">
                                            {service.title}
                                        </h3>
                                        <p className="text-black/70 dark:text-gray-400 text-sm mb-4">
                                            {service.description}
                                        </p>
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${service.color} bg-opacity-10 border border-white/10`}>
                                            <span className="text-xs text-white font-medium">{service.highlight}</span>
                                        </div>
                                    </div>

                                    {/* Right Side - Details */}
                                    <div className="lg:w-2/3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {service.details.map((detail, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-white/5">
                                                    <ArrowRight className={`w-4 h-4 shrink-0 ${service.color.includes('purple') ? 'text-purple-400' :
                                                        service.color.includes('cyan') ? 'text-cyan-400' :
                                                            service.color.includes('green') ? 'text-green-400' :
                                                                service.color.includes('orange') ? 'text-orange-400' :
                                                                    'text-indigo-400'
                                                        }`} />
                                                    <span className="text-black/80 dark:text-gray-300 text-sm">{detail}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Benefits Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-16"
                >
                    <h2 className="font-orbitron text-2xl text-black dark:text-white text-center mb-8">
                        TEKMER'in Sağladığı Başlıca Faydalar
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="p-6 rounded-xl bg-white dark:bg-gradient-to-br dark:from-primary/10 dark:to-transparent border border-gray-200 dark:border-primary/20 text-center shadow-md dark:shadow-none"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <benefit.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-black dark:text-white font-semibold mb-2">{benefit.title}</h3>
                                <p className="text-black/70 dark:text-gray-400 text-sm">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center p-8 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-primary/10 dark:to-secondary/10 border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
                >
                    <h3 className="font-orbitron text-xl text-black dark:text-white mb-4">
                        Girişimcilik Yolculuğunuza Başlayın
                    </h3>
                    <p className="text-black/70 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                        İKÜANTS TEKMER'in sunduğu tüm hizmetlerden yararlanmak için hemen başvurun.
                    </p>
                    <a
                        href="/basvuru"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold shadow-lg shadow-primary/30"
                    >
                        Başvuru Yap
                        <ArrowRight className="w-5 h-5" />
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
