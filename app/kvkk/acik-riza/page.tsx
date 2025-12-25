"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AcikRizaPage() {
    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <Link href="/kvkk" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    KVKK Sayfasına Dön
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
                        <Shield className="w-4 h-4 text-secondary" />
                        <span className="text-sm text-secondary font-mono">AÇIK RIZA</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-2xl md:text-3xl text-white mb-4">
                        Kişisel Verilerin Korunması Açık Rıza Formu
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 text-gray-300 space-y-6 text-sm leading-relaxed">
                        <p>
                            Tarafımca okunan TEKMER "Kişisel Verilerin Korunması Aydınlatma Metni" ve "Kişisel Veri İşleme Politikası" çerçevesinde kişisel verilerimin İKÜANTS Teknoloji Geliştirme Merkezi Anonim Şirketi tarafından işlenmesine ilişkin açık rıza beyanımdır.
                        </p>

                        <h3 className="text-white font-semibold text-lg mt-6">Kabul Beyanı</h3>
                        <p>Aşağıdaki hususlara açıkça izin verdiğimi kabul ve beyan ederim:</p>

                        <ul className="list-disc pl-6 space-y-3">
                            <li>T.C. İstanbul Kültür Üniversitesi eğitim programları hakkında ön başvuru bilgisi alınabilmesi</li>
                            <li>Buna ilişkin istatistiki verilerin toplanabilmesi</li>
                            <li>Kimlik, iletişim, proje ve etkinlik verilerimin işlenmesi</li>
                            <li>Etkinlik süresince çekilen fotoğraf ve videoların kurumun sosyal medya, web sitesi ve tanıtım materyallerinde kullanılması</li>
                            <li>Gelecek etkinlikler ve girişimcilik programları hakkında tarafıma bilgilendirme yapılması</li>
                            <li>Katılımcılarla bu hususta iletişime geçilebilmesi</li>
                            <li>Aydınlatma Metninde belirtilen amaçlarla kişisel verilerimin işlenmesi</li>
                            <li>Kişisel verilerimin yurt içi veya yurt dışına aktarılması</li>
                        </ul>

                        <div className="mt-8 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
                            <p className="text-white font-medium mb-2">Önemli Not</p>
                            <p className="text-gray-300">
                                Bu açık rıza beyanı, başvuru formlarında yer alan onay kutucuklarını işaretlemeniz ile geçerli kabul edilecektir. Haklarınız konusunda bilgilendirildiğinizi ve kişisel verilerinizin işlenmesine açıkça izin verdiğinizi kabul etmiş olursunuz.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
