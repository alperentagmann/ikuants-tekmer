import React from 'react';
import { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ShieldCheck, Mail, Phone, MapPin, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Gizlilik ve KVKK Politikası | İKÜANTS TEKMER',
    description: 'İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi (İKÜANTS TEKMER) Gizlilik, Çerez ve KVKK Aydınlatma Politikası.',
    alternates: {
        canonical: 'https://ikuantstekmer.com/gizlilik-politikasi',
    },
};

export default function GizlilikPolitikasiPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Breadcrumb
                    items={[{ label: 'Gizlilik Politikası', href: '/gizlilik-politikasi' }]}
                    className="mb-8"
                />

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10 backdrop-blur-sm shadow-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Veri Güvenliği ve Gizlilik</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Gizlilik ve Kişisel Verilerin Korunması Politikası
                    </h1>

                    <p className="text-sm text-slate-400 mb-8 pb-6 border-b border-slate-800">
                        Son Güncelleme: 29 Eylül 2026 | Veri Sorumlusu: İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi (İKÜANTS TEKMER)
                    </p>

                    <div className="prose prose-invert max-w-none space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                1. Amaç ve Kapsam
                            </h2>
                            <p>
                                Bu Gizlilik Politikası, İKÜANTS TEKMER web sitesini (<span className="text-cyan-400">ikuantstekmer.com</span>), başvuru formlarını ve dijital hizmetlerini kullanan girişimciler, mentörler, iş ortakları ve ziyaretçilerin kişisel verilerinin 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) ve ilgili mevzuata uygun olarak işlenmesini ve korunmasını açıklamaktadır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                2. İşlenen Kişisel Veriler
                            </h2>
                            <p>
                                İKÜANTS TEKMER faaliyetleri kapsamında işlenebilecek veriler:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                                <li><strong>Kimlik ve İletişim Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası, TCKN (yalnızca resmi sözleşme/başvuru onay aşamalarında).</li>
                                <li><strong>Girişim ve İş Fikri Bilgileri:</strong> Şirket unvanı, sektör, proje açıklaması, kurucu ekip bilgileri ve sunum dosyaları.</li>
                                <li><strong>İşlem Güvenliği ve Log Kayıtları:</strong> IP adresi, erişim logları, çerez kayıtları ve oturum bilgileri.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                3. Verilerin İşlenme Amaçları
                            </h2>
                            <p>
                                Toplanan veriler; girişimcilik programı başvurularının değerlendirilmesi, kuluçka ve mentörlük süreçlerinin yürütülmesi, KOSGEB ve üniversite mevzuatına uyum sağlanması, yasal yükümlülüklerin ifası ve iletişim taleplerine yanıt verilmesi amaçlarıyla sınırlı olarak işlenir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                4. Veri Güvenliği ve Saklama
                            </h2>
                            <p>
                                Kişisel verileriniz, endüstri standardı güvenlik protokolleri (SSL/TLS şifreleme, HSTS, güçlü kimlik doğrulama, rol bazlı erişim denetimi ve güvenlik duvarları) ile korunmaktadır. Verileriniz, yasal mevzuatta öngörülen süreler boyunca veya işleme amacının gerektirdiği süre zarfında güvenli veritabanlarında saklanır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                5. İlgili Kişi Hakları (KVKK Madde 11)
                            </h2>
                            <p>
                                KVKK m. 11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amaca uygun kullanılıp kullanılmadığını öğrenme, eksik/yanlış verilerin düzeltilmesini isteme ve silinmesini veya yok edilmesini talep etme haklarına sahipsiniz.
                            </p>
                        </section>

                        <section className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 mt-8">
                            <h3 className="text-lg font-bold text-white mb-4">Veri Sorumlusu İletişim Bilgileri</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                                    <span>Ataköy Yerleşkesi, E5 Karayolu Üzeri, Bakırköy / İstanbul</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-cyan-400 shrink-0" />
                                    <a href="tel:02124984162" className="hover:text-cyan-400 transition-colors">(0212) 498 41 62</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                                    <a href="mailto:bilgi@ikuantstekmer.com" className="hover:text-cyan-400 transition-colors">bilgi@ikuantstekmer.com</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                                    <Link href="/kvkk/aydinlatma-metni" className="text-cyan-400 hover:underline">Detaylı Aydınlatma Metni</Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
