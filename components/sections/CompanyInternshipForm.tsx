"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KvkkCheckboxes } from "@/components/ui/KvkkCheckboxes";
import { Send, Building2, Briefcase, Check, ChevronLeft, ChevronRight } from "lucide-react";

type CompanyFormData = {
    firmaUnvani: string;
    yetkiliKisiIletisim: string;
    tekmerStatusu: string;
    agirlikliGorevAlanlari: string;
    stajyerSayisi: string;
    stajTuru: string;
    stajSuresiVeGun: string;
    uygunBolumler: string;
    sinifTercihi: string;
    arananTemelBeceriler: string[];
    temelBilgiVeBeceriler: string;
    gorevAlacagiAlanlar: string;
    yapilacakCalismalar: string;
    calismaModeli: string;
    saglananImkanlar: string;
    mulakatDurumu: string;
};

const initialFormData: CompanyFormData = {
    firmaUnvani: "",
    yetkiliKisiIletisim: "",
    tekmerStatusu: "",
    agirlikliGorevAlanlari: "",
    stajyerSayisi: "",
    stajTuru: "",
    stajSuresiVeGun: "",
    uygunBolumler: "",
    sinifTercihi: "",
    arananTemelBeceriler: [],
    temelBilgiVeBeceriler: "",
    gorevAlacagiAlanlar: "",
    yapilacakCalismalar: "",
    calismaModeli: "",
    saglananImkanlar: "",
    mulakatDurumu: "",
};

const BECERI_ALANLARI = [
    "Ar-Ge", "Yazılım", "İş Geliştirme", "Pazarlama", "Diğer"
];

export const CompanyInternshipForm = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isKvkkComplete, setIsKvkkComplete] = useState(false);

    const totalPages = 2;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayToggle = (name: 'arananTemelBeceriler', value: string) => {
        setFormData(prev => {
            const arr = prev[name];
            if (arr.includes(value)) {
                return { ...prev, [name]: arr.filter(v => v !== value) };
            }
            return { ...prev, [name]: [...arr, value] };
        });
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
                    programName: "Firma Staj Çağrısı",
                    fullName: formData.yetkiliKisiIletisim,
                    projectName: formData.firmaUnvani
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

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:bg-white/10 p-3 text-white outline-none transition-all text-sm";
    const labelClass = "flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 mt-4";
    const sectionTitleClass = "text-2xl font-orbitron text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/10";

    if (isSubmitted) {
        return (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-blue-500/30 p-12 rounded-2xl text-center">
                <Check className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                <h2 className="font-orbitron font-bold text-3xl text-white mb-4">Çağrınız Alındı!</h2>
                <p className="text-gray-400 mb-6">Stajyer talebiniz başarıyla bize ulaşmıştır. En kısa sürede öğrencilerle eşleştirme süreci başlatılacaktır.</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all font-orbitron">
                    Yeni Çağrı Oluştur
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-2xl relative overflow-hidden min-h-[600px] flex flex-col">
            {/* Stepper */}
            <div className="flex justify-between mb-8 max-w-xl mx-auto px-4 w-full">
                {[1, 2].map(step => (
                    <div key={step} className={`flex flex-col items-center gap-2 ${currentPage >= step ? 'text-blue-400' : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${currentPage >= step ? 'border-blue-500 bg-blue-500/20' : 'border-gray-800 bg-gray-900'}`}>
                            {step}
                        </div>
                        <span className="text-[10px] font-mono hidden md:block uppercase tracking-widest">
                            {step === 1 && "Firma Bilgileri"}
                            {step === 2 && "Staj Detayları"}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex-grow">
                <AnimatePresence mode="wait">
                    {currentPage === 1 && (
                        <motion.div key="p1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                            <h3 className={sectionTitleClass}><Building2 className="text-blue-500" /> İlk Kurulum ve İletişim</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Firma Unvanı *</label>
                                    <input required name="firmaUnvani" value={formData.firmaUnvani} onChange={handleChange} className={inputClass} placeholder="Firma adını giriniz" />
                                </div>
                                <div>
                                    <label className={labelClass}>Yetkili Kişi / İletişim *</label>
                                    <input required name="yetkiliKisiIletisim" value={formData.yetkiliKisiIletisim} onChange={handleChange} className={inputClass} placeholder="Ad Soyad, Telefon/E-posta vb." />
                                </div>
                                <div>
                                    <label className={labelClass}>TEKMER Statüsü (Ofis / Masa) *</label>
                                    <select required name="tekmerStatusu" value={formData.tekmerStatusu} onChange={handleChange} className={inputClass}>
                                        <option className="bg-[#050510]" value="">Seçiniz</option>
                                        <option className="bg-[#050510]" value="Ofis">Ofis</option>
                                        <option className="bg-[#050510]" value="Masa">Masa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Talep Edilen Stajyer Sayısı *</label>
                                    <input required type="number" name="stajyerSayisi" value={formData.stajyerSayisi} onChange={handleChange} className={inputClass} placeholder="Sayı giriniz" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className={labelClass}>Stajyerin ağırlıklı olarak görev alacağı alan(lar) nelerdir? *</label>
                                <textarea required name="agirlikliGorevAlanlari" value={formData.agirlikliGorevAlanlari} onChange={handleChange} rows={2} className={inputClass} placeholder="Örn: Yazılım Geliştirme, Ürün Testleri vb." />
                            </div>

                            <div className="mt-4">
                                <label className={labelClass}>Aranan Temel Beceriler *</label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                    {BECERI_ALANLARI.map(field => (
                                        <label key={field} className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-blue-400">
                                            <input
                                                type="checkbox"
                                                checked={formData.arananTemelBeceriler.includes(field)}
                                                onChange={() => handleArrayToggle('arananTemelBeceriler', field)}
                                                className="accent-blue-500"
                                            />
                                            <span className="text-xs">{field}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {currentPage === 2 && (
                        <motion.div key="p2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                            <h3 className={sectionTitleClass}><Briefcase className="text-blue-500" /> Staj ve Beklentiler</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Staj Türü (Zorunlu / Gönüllü) *</label>
                                    <select required name="stajTuru" value={formData.stajTuru} onChange={handleChange} className={inputClass}>
                                        <option className="bg-[#050510]" value="">Seçiniz</option>
                                        <option className="bg-[#050510]" value="Zorunlu">Zorunlu</option>
                                        <option className="bg-[#050510]" value="Gönüllü">Gönüllü</option>
                                        <option className="bg-[#050510]" value="Fark Etmez">Fark Etmez</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Staj Süresi ve Haftalık Gün Sayısı *</label>
                                    <input required name="stajSuresiVeGun" value={formData.stajSuresiVeGun} onChange={handleChange} className={inputClass} placeholder="Örn: 2 Ay, Haftada 3 Gün" />
                                </div>
                                <div>
                                    <label className={labelClass}>Uygun Olduğunu Düşündüğünüz Bölüm/Bölümler *</label>
                                    <input required name="uygunBolumler" value={formData.uygunBolumler} onChange={handleChange} className={inputClass} placeholder="Örn: Bilgisayar Müh, İşletme vb." />
                                </div>
                                <div>
                                    <label className={labelClass}>Sınıf Tercihi *</label>
                                    <input required name="sinifTercihi" value={formData.sinifTercihi} onChange={handleChange} className={inputClass} placeholder="Örn: 3. veya 4. Sınıf" />
                                </div>
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <label className={labelClass}>Stajyer adayında bulunmasını beklediğiniz temel bilgi ve beceriler nelerdir? *</label>
                                <textarea required name="temelBilgiVeBeceriler" value={formData.temelBilgiVeBeceriler} onChange={handleChange} rows={2} className={inputClass} />
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <label className={labelClass}>Stajyerin Görev Alacağı Alanlar *</label>
                                <textarea required name="gorevAlacagiAlanlar" value={formData.gorevAlacagiAlanlar} onChange={handleChange} rows={2} className={inputClass} placeholder="(Pazarlama, Ar-Ge vb... detaylı)" />
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <label className={labelClass}>Staj Süresince Yapacağı Çalışmalar (Kısa Açıklama) *</label>
                                <textarea required name="yapilacakCalismalar" value={formData.yapilacakCalismalar} onChange={handleChange} rows={3} className={inputClass} placeholder="Örn: Proje süreçlerine destek verecek, kodlama yapacak..." />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mt-4">
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
                                    <label className={labelClass}>Sağlanan İmkânlar *</label>
                                    <input required name="saglananImkanlar" value={formData.saglananImkanlar} onChange={handleChange} className={inputClass} placeholder="(Ücret, Yemek, Ulaşım vb.)" />
                                </div>
                                <div>
                                    <label className={labelClass}>CV İncelemesi / Mülakat Yapılacak mı? *</label>
                                    <select required name="mulakatDurumu" value={formData.mulakatDurumu} onChange={handleChange} className={inputClass}>
                                        <option className="bg-[#050510]" value="">Seçiniz</option>
                                        <option className="bg-[#050510]" value="Evet (CV İncelemesi ve Mülakat)">Evet (CV İncelemesi ve Mülakat)</option>
                                        <option className="bg-[#050510]" value="Sadece CV İncelemesi">Sadece CV İncelemesi</option>
                                        <option className="bg-[#050510]" value="Hayır">Hayır</option>
                                    </select>
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
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {isSubmitting ? "Gönderiliyor..." : "Çağrıyı Gönder"} <Send className="w-4 h-4" />
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
