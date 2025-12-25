"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AydinlatmaMetniPage() {
    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">KVKK</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-2xl md:text-3xl text-white mb-4">
                        Kişisel Verilerin İşlenmesi Aydınlatma Metni
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-invert prose-sm max-w-none"
                >
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 text-gray-300 space-y-6 text-sm leading-relaxed">
                        <p>
                            İKÜANTS Tekmer Teknoloji Geliştirme Merkezi Anonim Şirketi tarafından "Veri Sorumlusu" sıfatı ile kişisel verilerinizin hangi kapsamda işlenebileceği aşağıda açıklanmaktadır. Kişisel verileriniz, Veri Sorumlusu tarafından aşağıda açıklanan çerçevede ve her zaman 6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") ile uyumlu olarak işlenmektedir.
                        </p>

                        <p>
                            İKÜANTS Tekmer Teknoloji Geliştirme Merkezi Anonim Şirketi ("TEKMER" yahut "Şirket" olarak anılacaktır), kişisel verilerin güvenliği hususuna azami hassasiyet göstermektedir.
                        </p>

                        <h3 className="text-white font-semibold text-lg mt-8">TANIMLAR</h3>
                        <p>6698 sayılı Kişisel Verilerin Korunması Kanunu'na göre:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Kişisel veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgiyi ifade eder.</li>
                            <li><strong>Kişisel verilerin işlenmesi:</strong> Kişisel verilerin tamamen veya kısmen otomatik olan ya da herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla elde edilmesi, kaydedilmesi, depolanması, muhafaza edilmesi, değiştirilmesi, yeniden düzenlenmesi, açıklanması, aktarılması, devralınması, elde edilebilir hâle getirilmesi, sınıflandırılması ya da kullanılmasının engellenmesi gibi veriler üzerinde gerçekleştirilen her türlü işlemi ifade eder.</li>
                            <li><strong>İlgili kişi:</strong> Kişisel verisi işlenen gerçek kişiyi ifade eder.</li>
                            <li><strong>Veri sorumlusu:</strong> Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan gerçek veya tüzel kişiyi ifade eder.</li>
                        </ul>

                        <h3 className="text-white font-semibold text-lg mt-8">KİŞİSEL VERİLERİNİZİN ELDE EDİLMESİ</h3>
                        <p>
                            İKÜANTS TEKMER, 5237 Sayılı Türk Ceza Kanunu ve 6698 Sayılı Kişisel Verilerin Korunması Kanunu başta olmak üzere, ilgili mevzuattan kaynaklanan yasal yükümlülüklerini yerine getirmek amacıyla bazı kişisel verilerinizi (ad soyad, iletişim bilgileri, e-posta ve/veya telefon numarası, yaş, cinsiyet, adres, eğitim durumu, üniversite bilgisi, bölümü, uzmanlık alanları, ilgi alanları, Takım ve Proje verileri, görsel işitsel veriler, dijital veriler, IP Adresi, çevrimiçi form bilgileri, LinkedIn Profili, portfolyo bağlantıları, iş fikri açıklaması, iş modeli, iş planı, sunum dökümanları, şirket bilgisi) işleyebilmektedir.
                        </p>

                        <h3 className="text-white font-semibold text-lg mt-8">KİŞİSEL VERİLERİN İŞLENME AMACI</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>TEKMER'in tabi olduğu 5746 sayılı Araştırma, Geliştirme ve Tasarım Faaliyetlerinin Desteklenmesi Hakkında Kanun kapsamındaki yasal yükümlülükleri yerine getirmek</li>
                            <li>Girişimci, yatırımcı ile ticari ve iş stratejilerinin belirlenmesi ve uygulanması</li>
                            <li>İletişim, pazar araştırması ve sosyal sorumluluk aktiviteleri</li>
                            <li>Jüri değerlendirme, ödül süreçleri ve etkinlik planlaması</li>
                            <li>Başvuruların alınması, değerlendirilmesi ve katılımcı seçimi</li>
                            <li>Eğitim, mentörlük ve danışmanlık faaliyetlerinin sağlanması</li>
                            <li>Etkinlik süresince fotoğraf ve video çekimleri yapılarak kullanılması</li>
                        </ul>

                        <h3 className="text-white font-semibold text-lg mt-8">KİŞİSEL VERİLERİN AKTARILMASI</h3>
                        <p>
                            TEKMER tarafından toplanan kişisel verileriniz; 6698 sayılı KVK Kanunu'nun 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları kapsamında, iş ortakları ve paydaşları, tedarikçileri, danışmanları, hukuken bilgi almaya yetkili kamu kurum ve kuruluşları ile paylaşılabilecektir.
                        </p>

                        <h3 className="text-white font-semibold text-lg mt-8">HAKLARINIZ</h3>
                        <p>Kanun'un 11. Maddesine göre kişisel veri sahibi olarak:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Kişisel veri işlenip işlenmediğini öğrenme</li>
                            <li>Kişisel veriler işlenmişse buna ilişkin bilgi talep etme</li>
                            <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanıp kullanılmadığını öğrenme</li>
                            <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                            <li>Kişisel verilerin eksik ya da yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
                            <li>Kişisel verilerin silinmesini, anonim hale getirilmesini veya yok edilmesini isteme</li>
                        </ul>
                        <p className="mt-4">haklarına sahipsiniz.</p>

                        <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/30">
                            <p className="text-white font-medium mb-2">İletişim</p>
                            <p className="text-gray-300">
                                <strong>Adres:</strong> Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14/A Bakırköy/İstanbul<br />
                                <strong>E-posta:</strong> bilgi@ikuantstekmer.com<br />
                                <strong>Web:</strong> www.ikuantstekmer.com
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
