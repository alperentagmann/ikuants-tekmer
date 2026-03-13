"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KvkkCheckboxes } from "@/components/ui/KvkkCheckboxes";
import { Send, User, Check, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

type StudentFormData = {
    adSoyad: string;
    yetkiliKisiIletisim: string;
    universite: string;
    bolum: string;
    sinifTercihi: string;
    eposta: string;
    telefon: string;
    stajTuru: string;
    istenilenAlanlar: string;
    teknikBeceriler: string;
    deneyimKazanmakIstenenKonular: string;
    stajSuresi: string;
    haftalikGunSayisi: string;
    calismaModeli: string;
    deneyimBilgisi: string;
    dahaOnceStajYapildiMi: string;
    girisimlerdeStajNedeni: string;
};

const initialFormData: StudentFormData = {
    adSoyad: "",
    yetkiliKisiIletisim: "",
    universite: "",
    bolum: "",
    sinifTercihi: "",
    eposta: "",
    telefon: "",
    stajTuru: "",
    istenilenAlanlar: "",
    teknikBeceriler: "",
    deneyimKazanmakIstenenKonular: "",
    stajSuresi: "",
    haftalikGunSayisi: "",
    calismaModeli: "",
    deneyimBilgisi: "",
    dahaOnceStajYapildiMi: "",
    girisimlerdeStajNedeni: "",
};

export const StudentInternshipForm = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<StudentFormData>(initialFormData);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isKvkkComplete, setIsKvkkComplete] = useState(false);

    const totalPages = 2;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/basvuru', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    programName: "Öğrenci Staj Başvurusu",
                    fullName: formData.adSoyad,
                    email: formData.eposta,
                    phone: formData.telefon,
                    projectName: formData.universite
                })
            });
            const result = await response.json();
            if (result.success) {
                setIsSubmitted(true);
            } else {
                alert('Hata: ' + result.message);
            }
        } catch (error) {
            console.error('Submit error:', error);
            setIsSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg focus:border-green-500 focus:bg-white/10 p-3 text-white outline-none transition-all text-sm";
    const labelClass = "flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 mt-4";
    const sectionTitleClass = "text-2xl font-orbitron text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/10";

    if (isSubmitted) {
        return (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-green-500/30 p-12 rounded-2xl text-center">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h2 className="font-orbitron font-bold text-3xl text-white mb-4">Başvurunuz Alındı!</h2>
                <p className="text-gray-400 mb-6">Staj başvurunuz başarıyla alınmıştır. Girişimlerimizle eşleştirme sağlandığında sizinle iletişime geçeceğiz.</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all font-orbitron">
                    Yeni Başvuru Yap
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-2xl relative overflow-hidden min-h-[600px] flex flex-col">
            {/* Stepper */}
            <div className="flex justify-between mb-8 max-w-xl mx-auto px-4 w-full">
                {[1, 2].map(step => (
                    <div key={step} className={`flex flex-col items-center gap-2 ${currentPage >= step ? 'text-green-400' : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${currentPage >= step ? 'border-green-500 bg-green-500/20' : 'border-gray-800 bg-gray-900'}`}>
                            {step}
                        </div>
                        <span className="text-[10px] font-mono hidden md:block uppercase tracking-widest">
                            {step === 1 && "Bireysel ve Eğitim"}
                            {step === 2 && "Staj Tercihleri"}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex-grow">
                <AnimatePresence mode="wait">
                    {currentPage === 1 && (
                        <motion.div key="p1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                            <h3 className={sectionTitleClass}><User className="text-green-500" /> Bireysel ve Eğitim Bilgileri</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Ad Soyad *</label>
                                    <input required name="adSoyad" value={formData.adSoyad} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Yetkili Kişi / İletişim *</label>
                                    <input required name="yetkiliKisiIletisim" value={formData.yetkiliKisiIletisim} onChange={handleChange} className={inputClass} placeholder="Referans veya Ek İletişim vs." />
                                </div>
                                <div>
                                    <label className={labelClass}>Üniversite *</label>
                                    <input required name="universite" value={formData.universite} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Bölüm *</label>
                                    <input required name="bolum" value={formData.bolum} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Sınıf Tercihi *</label>
                                    <input required name="sinifTercihi" value={formData.sinifTercihi} onChange={handleChange} className={inputClass} placeholder="Örn: 3. Sınıf, 4. Sınıf" />
                                </div>
                                <div>
                                    <label className={labelClass}>E-posta *</label>
                                    <input required type="email" name="eposta" value={formData.eposta} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Telefon *</label>
                                    <input required type="tel" name="telefon" value={formData.telefon} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentPage === 2 && (
                        <motion.div key="p2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                            <h3 className={sectionTitleClass}><BookOpen className="text-green-500" /> Staj Tercihleri ve Nitelikler</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Staj Türü (Zorunlu / Gönüllü) *</label>
                                    <select required name="stajTuru" value={formData.stajTuru} onChange={handleChange} className={inputClass}>
                                        <option className="bg-[#050510]" value="">Seçiniz</option>
                                        <option className="bg-[#050510]" value="Zorunlu">Zorunlu</option>
                                        <option className="bg-[#050510]" value="Gönüllü">Gönüllü</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Staj Süresi *</label>
                                    <input required name="stajSuresi" value={formData.stajSuresi} onChange={handleChange} className={inputClass} placeholder="Örn: 2 Ay vb." />
                                </div>
                                <div>
                                    <label className={labelClass}>Haftalık Çalışma Gün Sayısı *</label>
                                    <input required type="number" name="haftalikGunSayisi" value={formData.haftalikGunSayisi} onChange={handleChange} className={inputClass} placeholder="Örn: 3" />
                                </div>
                                <div>
                                    <label className={labelClass}>Çalışma Modeli (Fiziki / Hibrit / Uzaktan) *</label>
                                    <select required name="calismaModeli" value={formData.calismaModeli} onChange={handleChange} className={inputClass}>
                                        <option className="bg-[#050510]" value="">Seçiniz</option>
                                        <option className="bg-[#050510]" value="Fiziki">Fiziki</option>
                                        <option className="bg-[#050510]" value="Hibrit">Hibrit</option>
                                        <option className="bg-[#050510]" value="Uzaktan">Uzaktan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Daha Önce Staj Yaptınız mı? *</label>
                                    <select required name="dahaOnceStajYapildiMi" value={formData.dahaOnceStajYapildiMi} onChange={handleChange} className={inputClass}>
                                        <option className="bg-[#050510]" value="">Seçiniz</option>
                                        <option className="bg-[#050510]" value="Evet">Evet</option>
                                        <option className="bg-[#050510]" value="Hayır">Hayır</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <label className={labelClass}>Staj yapmak istediğiniz alan(lar) hangileridir? *</label>
                                    <textarea required name="istenilenAlanlar" value={formData.istenilenAlanlar} onChange={handleChange} rows={2} className={inputClass} placeholder="Yazılım, Pazarlama vb." />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <label className={labelClass}>Varsa teknik becerilerinizi veya kullandığınız programları kısaca belirtiniz. *</label>
                                    <textarea required name="teknikBeceriler" value={formData.teknikBeceriler} onChange={handleChange} rows={2} className={inputClass} placeholder="Python, Adobe Suite vb." />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <label className={labelClass}>Staj sürecinde özellikle hangi konularda deneyim kazanmak istersiniz? *</label>
                                    <textarea required name="deneyimKazanmakIstenenKonular" value={formData.deneyimKazanmakIstenenKonular} onChange={handleChange} rows={2} className={inputClass} />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <label className={labelClass}>Deneyim Bilgisi</label>
                                    <textarea name="deneyimBilgisi" value={formData.deneyimBilgisi} onChange={handleChange} rows={2} className={inputClass} placeholder="Geçmiş tecrübelerinizden kısaca bahsediniz..." />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <label className={labelClass}>İKÜANTS TEKMER bünyesindeki girişimlerde staj yapmak isteme nedeniniz? *</label>
                                    <textarea required name="girisimlerdeStajNedeni" value={formData.girisimlerdeStajNedeni} onChange={handleChange} rows={3} className={inputClass} />
                                </div>

                            </div>

                            <div className="mt-8 pt-4 border-t border-white/10 space-y-4">
                                <KvkkCheckboxes onComplete={setIsKvkkComplete} hidePhotoVideoConsent={true} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition text-sm font-semibold"
                >
                    <ChevronLeft className="w-4 h-4" /> Geri
                </button>

                {currentPage === totalPages ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isKvkkComplete}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {isSubmitting ? "Gönderiliyor..." : "Başvuruyu Gönder"} <Send className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={nextPage}
                        className="flex items-center gap-2 px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm font-semibold"
                    >
                        Sonraki <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
