"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Send, Users, User, Mail, Phone, GraduationCap, Lightbulb,
    Target, FileText, Check, ChevronRight, ChevronLeft, Sparkles
} from "lucide-react";

interface TeamMember {
    name: string;
    email: string;
    phone: string;
    university: string;
    department: string;
}

const initialFormData = {
    // Takım Bilgileri
    teamName: "",
    teamSize: "3",
    // Takım Üyeleri (lider + 2-4 üye)
    leaderName: "",
    leaderEmail: "",
    leaderPhone: "",
    leaderUniversity: "",
    leaderDepartment: "",
    // Proje Bilgileri
    projectName: "",
    projectSummary: "",
    problemDescription: "",
    solutionDescription: "",
    targetAudience: "",
    theme: [] as string[],
    // Onaylar
    kvkkConsent: false,
    photoConsent: false,
};

const themes = [
    "Yapay Zekâ & Bulut Bilişim",
    "Mobilite & Gömülü Sistemler",
    "Yeni Medya & Animasyon",
    "Oyun Geliştirme & Mobil Uygulamalar",
    "Eğitim Teknolojileri",
    "Sağlık Teknolojileri & Biyoteknoloji",
    "Fintech",
    "Sürdürülebilirlik & Çevre Teknolojileri"
];

export default function GlowUpBasvuruPage() {
    const [formData, setFormData] = useState(initialFormData);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const totalPages = 3;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleThemeChange = (theme: string) => {
        setFormData(prev => ({
            ...prev,
            theme: prev.theme.includes(theme)
                ? prev.theme.filter(t => t !== theme)
                : [...prev.theme, theme]
        }));
    };

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const validatePage = (page: number) => {
        switch (page) {
            case 1:
                return formData.teamName && formData.teamSize && formData.leaderName && formData.leaderEmail && formData.leaderPhone && formData.leaderUniversity && formData.leaderDepartment;
            case 2:
                return formData.projectName && formData.theme.length > 0 && formData.projectSummary && formData.problemDescription && formData.solutionDescription && formData.targetAudience;
            case 3:
                return formData.kvkkConsent && formData.photoConsent;
            default:
                return false;
        }
    };

    const isCurrentPageValid = validatePage(currentPage);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/basvuru', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, formType: 'glowup' })
            });
            const result = await response.json();
            if (result.success) {
                setIsSubmitted(true);
            } else {
                alert('Bir hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Başvuru gönderilirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg focus:border-cyan-500 focus:bg-white/10 p-4 text-white outline-none transition-all";
    const labelClass = "flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold mb-2";

    if (isSubmitted) {
        return (
            <div className="py-24 min-h-screen">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0a0a0a] border border-green-500/30 p-12 rounded-2xl text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="font-orbitron font-bold text-3xl text-white mb-4">Başvurunuz Alındı!</h2>
                        <p className="text-gray-400 mb-6">
                            GLOW UP Ideathon başvurunuz başarıyla gönderildi. Takımınıza en kısa sürede dönüş yapılacaktır.
                        </p>
                        <button
                            onClick={() => { setIsSubmitted(false); setFormData(initialFormData); setCurrentPage(1); }}
                            className="px-8 py-3 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all font-semibold"
                        >
                            Yeni Başvuru
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
                        <Lightbulb className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-400 font-mono">IDEATHON BAŞVURUSU</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            GLOW UP
                        </span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        2 günde fikrini iş modeline dönüştür! Takımınızla birlikte başvurun.
                    </p>
                </motion.div>

                {/* Program Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 border border-white/10"
                >
                    <h2 className="font-orbitron text-xl text-white mb-6 text-center">GLOW UP Nedir?</h2>
                    <p className="text-gray-300 text-center mb-8 max-w-3xl mx-auto">
                        GLOW UP, İKÜANTS TEKMER tarafından düzenlenen 2 günlük yoğun bir ideathon programıdır.
                        Teknoloji odaklı fikirlerinizi deneyimli mentörler eşliğinde geliştirin, iş modeline dönüştürün
                        ve jüri önünde sunarak ödül kazanma şansı yakalayın!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-3xl mb-2">🚀</div>
                            <h3 className="text-white font-semibold mb-2">2 Gün Yoğun Program</h3>
                            <p className="text-gray-400 text-sm">Fikir geliştirmeden sunuma kadar tüm süreçler</p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-3xl mb-2">👨‍🏫</div>
                            <h3 className="text-white font-semibold mb-2">Uzman Mentörlük</h3>
                            <p className="text-gray-400 text-sm">Alanında uzman mentörlerden birebir destek</p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center">
                            <div className="text-3xl mb-2">🏆</div>
                            <h3 className="text-white font-semibold mb-2">Ödüller & Fırsatlar</h3>
                            <p className="text-gray-400 text-sm">Para ödülü ve ANTSPARK'a doğrudan katılım hakkı</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                            <h3 className="text-cyan-400 font-semibold mb-3">📅 Program Akışı</h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li>• <strong>1. Gün:</strong> Fikir sunumu, ekip eşleşmesi, problem tanımlama, çözüm tasarımı</li>
                                <li>• <strong>1. Gün Akşam:</strong> Mentör seansları, prototip çalışması</li>
                                <li>• <strong>2. Gün:</strong> İş modeli kanvası, sunum hazırlama, pitch pratiği</li>
                                <li>• <strong>2. Gün Final:</strong> Jüri önünde sunum, değerlendirme ve ödül töreni</li>
                            </ul>
                        </div>
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                            <h3 className="text-cyan-400 font-semibold mb-3">🎁 Kazanımlar</h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li>• İlk 3 takıma para ödülü</li>
                                <li>• İlk 3 takıma ANTSPARK Ön Kuluçka Programı'na direkt kabul</li>
                                <li>• Tüm katılımcılara katılım sertifikası</li>
                                <li>• Networking fırsatları ve ekosistem bağlantıları</li>
                                <li>• Mentörlerle kalıcı iletişim imkanı</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {['Takım Bilgileri', 'Proje Detayları', 'Onaylar'].map((step, i) => (
                            <span key={i} className={`text-xs font-mono ${currentPage > i ? 'text-cyan-400' : 'text-gray-500'}`}>
                                {step}
                            </span>
                        ))}
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${(currentPage / totalPages) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-2xl"
                >
                    <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500 absolute top-0 left-0 rounded-t-2xl" />

                    {/* Page 1: Takım Bilgileri */}
                    {currentPage === 1 && (
                        <div className="space-y-6">
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-cyan-400" />
                                Takım Bilgileri
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>
                                        <Sparkles className="w-4 h-4 text-cyan-400" />
                                        Takım Adı <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="teamName" value={formData.teamName} onChange={handleChange} className={inputClass} placeholder="Örn: Innovation Squad" required />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Users className="w-4 h-4 text-cyan-400" />
                                        Takım Kişi Sayısı <span className="text-red-500">*</span>
                                    </label>
                                    <select name="teamSize" value={formData.teamSize} onChange={handleChange} className={inputClass}>
                                        <option value="3">3 Kişi</option>
                                        <option value="4">4 Kişi</option>
                                        <option value="5">5 Kişi</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6 mt-6">
                                <h3 className="text-white font-semibold mb-4">Takım Lideri Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}><User className="w-4 h-4 text-cyan-400" /> Ad Soyad *</label>
                                        <input type="text" name="leaderName" value={formData.leaderName} onChange={handleChange} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Mail className="w-4 h-4 text-cyan-400" /> E-posta *</label>
                                        <input type="email" name="leaderEmail" value={formData.leaderEmail} onChange={handleChange} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Phone className="w-4 h-4 text-cyan-400" /> Telefon *</label>
                                        <input type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleChange} className={inputClass} placeholder="+90 5XX XXX XX XX" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}><GraduationCap className="w-4 h-4 text-cyan-400" /> Üniversite *</label>
                                        <input type="text" name="leaderUniversity" value={formData.leaderUniversity} onChange={handleChange} className={inputClass} required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}><GraduationCap className="w-4 h-4 text-cyan-400" /> Bölüm *</label>
                                        <input type="text" name="leaderDepartment" value={formData.leaderDepartment} onChange={handleChange} className={inputClass} required />
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mt-4">
                                * Diğer takım üyelerinin bilgileri etkinlik günü alınacaktır.
                            </p>
                        </div>
                    )}

                    {/* Page 2: Proje Detayları */}
                    {currentPage === 2 && (
                        <div className="space-y-6">
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-cyan-400" />
                                Proje Detayları
                            </h2>

                            <div>
                                <label className={labelClass}><FileText className="w-4 h-4 text-cyan-400" /> Proje/Fikir Adı *</label>
                                <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} className={inputClass} required />
                            </div>

                            <div>
                                <label className={labelClass}><Target className="w-4 h-4 text-cyan-400" /> İlgili Tema(lar) *</label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {themes.map((theme) => (
                                        <label key={theme} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all">
                                            <input
                                                type="checkbox"
                                                checked={formData.theme.includes(theme)}
                                                onChange={() => handleThemeChange(theme)}
                                                className="w-4 h-4 accent-cyan-500"
                                            />
                                            <span className="text-sm text-gray-300">{theme}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Proje Özeti *</label>
                                <textarea name="projectSummary" value={formData.projectSummary} onChange={handleChange} rows={3} className={inputClass} placeholder="Projenizi bir paragrafta özetleyin..." required />
                            </div>

                            <div>
                                <label className={labelClass}>Çözmek İstediğiniz Problem *</label>
                                <textarea name="problemDescription" value={formData.problemDescription} onChange={handleChange} rows={3} className={inputClass} placeholder="Hangi problemi çözmeyi hedefliyorsunuz?" required />
                            </div>

                            <div>
                                <label className={labelClass}>Çözüm Öneriniz *</label>
                                <textarea name="solutionDescription" value={formData.solutionDescription} onChange={handleChange} rows={3} className={inputClass} placeholder="Bu problemi nasıl çözeceksiniz?" required />
                            </div>

                            <div>
                                <label className={labelClass}>Hedef Kitleniz *</label>
                                <textarea name="targetAudience" value={formData.targetAudience} onChange={handleChange} rows={2} className={inputClass} placeholder="Ürün/hizmetinizin hedef kitlesi kimdir?" required />
                            </div>
                        </div>
                    )}

                    {/* Page 3: Onaylar */}
                    {currentPage === 3 && (
                        <div className="space-y-6">
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <Check className="w-5 h-5 text-cyan-400" />
                                Onaylar
                            </h2>

                            <div className="space-y-4">
                                <label className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all">
                                    <input
                                        type="checkbox"
                                        name="kvkkConsent"
                                        checked={formData.kvkkConsent}
                                        onChange={handleChange}
                                        className="w-5 h-5 accent-cyan-500 mt-0.5"
                                        required
                                    />
                                    <span className="text-sm text-gray-300">
                                        <a href="https://ikuantstekmer.com/sites/default/files/kvkk" target="_blank" className="text-cyan-400 hover:underline">KVKK Aydınlatma Metni</a>'ni okudum, anladım ve kişisel verilerime ilişkin olarak bilgilendirildiğimi kabul ederim. <span className="text-red-500">*</span>
                                    </span>
                                </label>

                                <label className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all">
                                    <input
                                        type="checkbox"
                                        name="photoConsent"
                                        checked={formData.photoConsent}
                                        onChange={handleChange}
                                        className="w-5 h-5 accent-cyan-500 mt-0.5"
                                        required
                                    />
                                    <span className="text-sm text-gray-300">
                                        Yarışma boyunca alınacak fotoğraf ve video kayıtlarının İKÜANTS TEKMER tarafından sosyal medya ve iletişim kanallarında yayımlanmasına onay veriyorum. <span className="text-red-500">*</span>
                                    </span>
                                </label>
                            </div>

                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mt-6">
                                <p className="text-sm text-gray-300">
                                    <strong className="text-cyan-400">Not:</strong> Başvuru sonuçları e-posta ile bildirilecektir. İlk 3'e giren takımlar İKÜANTS TEKMER Ön Kuluçka Programına doğrudan katılım hakkı kazanacaktır.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
                        {currentPage > 1 ? (
                            <button
                                type="button"
                                onClick={prevPage}
                                className="flex items-center gap-2 px-6 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Önceki
                            </button>
                        ) : <div />}

                        {currentPage < totalPages ? (
                            <button
                                type="button"
                                onClick={nextPage}
                                disabled={!isCurrentPageValid}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${isCurrentPageValid
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90'
                                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Sonraki
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!isCurrentPageValid || isSubmitting}
                                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${isCurrentPageValid && !isSubmitting
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Başvuruyu Gönder
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
