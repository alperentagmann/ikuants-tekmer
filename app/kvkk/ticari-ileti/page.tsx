"use client";
import React from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TicariIletiPage() {
    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />

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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
                        <Mail className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500 font-mono">TİCARİ İLETİ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-2xl md:text-3xl text-white mb-4">
                        Ticari Elektronik İleti Gönderilmesine İlişkin Onay Metni
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 text-gray-300 space-y-6 text-sm leading-relaxed">
                        <p>
                            İKÜANTS TEKMER ("TEKMER") tarafından gerçekleştirilecek aktivite, tanıtım, organizasyon ve İKÜANTS TEKMER ve T.C. İSTANBUL KÜLTÜR ÜNİVERSİTESİ'ne bağlı birimlerin gerçekleştirdiği akademik, sosyal tüm etkinliklerden haberdar olmak için İKÜANTS TEKMER ve İSTANBUL KÜLTÜR ÜNİVERSİTESİ tarafından şahsınıza ticari elektronik ileti gönderilmesine onay vermeniz gerekmektedir.
                        </p>

                        <h3 className="text-white font-semibold text-lg mt-6">İzin Verdiğinizde</h3>
                        <p>İKÜANTS TEKMER ve İSTANBUL KÜLTÜR ÜNİVERSİTESİ'nin:</p>

                        <ul className="list-disc pl-6 space-y-3">
                            <li>Size aktivite ve tanıtımlarla ilgili bilgi sunmasını</li>
                            <li>Satış, pazarlama ve benzer amaçlı her türlü iletişim mesajlarını göndermesini</li>
                            <li>Paylaşmış olduğunuz kişisel verilerinizi işleyerek, size telefon, kısa mesaj ve elektronik posta ile ulaşmasını</li>
                            <li>Elektronik iletilerin içeriğinin ve diğer kayıtların gerektiğinde ilgili Bakanlığa sunulmak üzere kayıt altına alınarak saklanmasını</li>
                        </ul>
                        <p className="mt-4">kabul etmektesiniz.</p>

                        <h3 className="text-white font-semibold text-lg mt-6">Veri Paylaşımı</h3>
                        <p>
                            Bu bilgiler sadece iletilerinizin sağlıklı şekilde teslim edilmesi, telefon, SMS ve/veya e-posta yoluyla bildirimlerimizin zamanında ulaştırılabilmesi amacıyla sözleşme ilişkisi içinde olduğumuz 3. kişilerle gerekli ölçüde paylaşılacaktır.
                        </p>

                        <h3 className="text-white font-semibold text-lg mt-6">İptal Hakkı</h3>
                        <p>
                            Dilediğiniz zaman, hiçbir gerekçe göstermeksizin bu kullanım şartları kapsamındaki elektronik iletileri almaktan vazgeçebilirsiniz. Bu talebinizi İKÜANTS TEKMER ve İSTANBUL KÜLTÜR ÜNİVERSİTESİ'ne çağrı veya iletide yer alan iletişim bilgilerini kullanarak veya aşağıdaki iletişim adreslerine ücretsiz olarak iletebilirsiniz.
                        </p>

                        <div className="mt-8 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                            <p className="text-white font-medium mb-2">İletişim</p>
                            <p className="text-gray-300">
                                <strong>E-posta:</strong> bilgi@ikuantstekmer.com<br />
                                <strong>Telefon:</strong> (0212) 498 41 62<br />
                                <strong>Adres:</strong> Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14/A Bakırköy/İstanbul
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
