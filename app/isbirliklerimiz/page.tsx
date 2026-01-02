"use client";
import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function IsbirliklerimizPage() {
    return (
        <div className="py-24 relative min-h-screen">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">İŞBİRLİKLERİMİZ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        İşbirliklerimiz
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER'in stratejik partnerleri ve çözüm ortakları
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Malogra */}
                    <div className="group relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-secondary/40 transition-all hover:shadow-xl hover:shadow-secondary/10 flex flex-col items-center">
                        <div className="h-24 w-full flex items-center justify-center mb-6 p-4 bg-white rounded-xl">
                            <img src="/images/malogra.jpeg" alt="Malogra" className="max-h-full object-contain" />
                        </div>
                        <h3 className="font-orbitron text-xl text-white mb-3">MALOGRA</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed text-center">
                            Finansal yönetim çözümleri, banka ilişkileri, bütçe ve raporlama, teşvik ve hibe danışmanlığı ile ihracat süreçlerinde firmalara stratejik rehberlik sunmaktadır.
                        </p>
                        <div className="mt-auto flex gap-4">
                            <a href="https://www.malogra.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-secondary transition-colors">Web Sitesi</a>
                            <span className="text-white/20">|</span>
                            <a href="https://www.linkedin.com/company/malogradanismanlik/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-secondary transition-colors">LinkedIn</a>
                        </div>
                    </div>

                    {/* StartupCentrum */}
                    <div className="group relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-secondary/40 transition-all hover:shadow-xl hover:shadow-secondary/10 flex flex-col items-center">
                        <div className="h-24 w-full flex items-center justify-center mb-6 p-4 bg-white rounded-xl">
                            <img src="/images/startupcentrum-cover-jpg.jpg" alt="StartupCentrum" className="max-h-full object-contain" />
                        </div>
                        <h3 className="font-orbitron text-xl text-white mb-3">StartupCentrum</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed text-center">
                            Girişimcilik ekosisteminin verilerini tutan, girişimcileri ve yatırımcıları bir araya getiren dijital platform.
                        </p>
                        <div className="mt-auto flex gap-4">
                            <a href="https://startupcentrum.com/tr" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-secondary transition-colors">Web Sitesi</a>
                            <span className="text-white/20">|</span>
                            <a href="https://www.linkedin.com/company/startupcentrum/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-secondary transition-colors">LinkedIn</a>
                        </div>
                    </div>

                    {/* Başakşehir Living Lab */}
                    <div className="group relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-secondary/40 transition-all hover:shadow-xl hover:shadow-secondary/10 flex flex-col items-center">
                        <div className="h-24 w-full flex items-center justify-center mb-6 p-4 bg-white rounded-xl">
                            <img src="/images/başakşehirlivinglab.png" alt="Başakşehir Living Lab" className="max-h-full object-contain" />
                        </div>
                        <h3 className="font-orbitron text-xl text-white mb-3">Başakşehir Living Lab</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed text-center">
                            Akıllı şehircilik ve inovasyon alanında projeler geliştiren, girişimcilere kuluçka ve laboratuvar imkanları sunan yaşam laboratuvarı.
                        </p>
                        <div className="mt-auto flex gap-4">
                            <a href="https://basaksehirlivinglab.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-secondary transition-colors">Web Sitesi</a>
                            <span className="text-white/20">|</span>
                            <a href="https://www.linkedin.com/company/basaksehirlivinglab/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-secondary transition-colors">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
