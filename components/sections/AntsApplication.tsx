"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, User, Mail, Phone, Building2, GraduationCap, FileText, Users,
    ClipboardList, Target, ChevronRight, ChevronLeft, Rocket, Lightbulb,
    Globe, Award, Calendar, MapPin, Linkedin, Upload, Check, X
} from "lucide-react";

type FormData = {
    // Page 1 - Personal Info
    projectName: string;
    fullName: string;
    projectRole: string;
    phone: string;
    email: string;
    birthDate: string;
    gender: string;
    education: string;
    faculty: string;
    department: string;
    city: string;
    linkedin: string;

    // Page 2 - Project Info
    sectors: string;
    tekmerThemes: string;
    projectSummary: string;
    problemToSolve: string;
    whySolveProblem: string;
    projectStage: string;
    hasMVP: string;
    solutionDescription: string;
    targetAudience: string;
    marketingStrategy: string;
    projectWebsite: string;
    yearlyGoals: string;
    previousCompetitions: string;
    intellectualProperty: string;
    hasInvestment: string;
    differentiators: string;

    // Page 3 - Team Info
    teamSize: string;
    founders: string;
    hasTechnicalFounder: string;
    weeklyHours: string;
    mentorshipAreas: string;

    // Page 4 - Consents
    privacyConsent: boolean;
    dataProcessingConsent: boolean;
    communicationConsent: boolean;
    communicationChannels: string[];
};

const initialFormData: FormData = {
    projectName: "",
    fullName: "",
    projectRole: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "",
    education: "",
    faculty: "",
    department: "",
    city: "",
    linkedin: "",
    sectors: "",
    tekmerThemes: "",
    projectSummary: "",
    problemToSolve: "",
    whySolveProblem: "",
    projectStage: "",
    hasMVP: "",
    solutionDescription: "",
    targetAudience: "",
    marketingStrategy: "",
    projectWebsite: "",
    yearlyGoals: "",
    previousCompetitions: "",
    intellectualProperty: "",
    hasInvestment: "",
    differentiators: "",
    teamSize: "",
    founders: "",
    hasTechnicalFounder: "",
    weeklyHours: "",
    mentorshipAreas: "",
    privacyConsent: false,
    dataProcessingConsent: false,
    communicationConsent: false,
    communicationChannels: []
};

export const AntsApplication = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const totalPages = 4;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxArray = (name: string, value: string) => {
        setFormData(prev => {
            const arr = prev[name as keyof FormData] as string[];
            if (arr.includes(value)) {
                return { ...prev, [name]: arr.filter(v => v !== value) };
            }
            return { ...prev, [name]: [...arr, value] };
        });
    };

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const [isSubmitting, setIsSubmitting] = useState(false);

    const validatePage = (page: number) => {
        switch (page) {
            case 1:
                return formData.projectName && formData.fullName && formData.projectRole && formData.phone && formData.email;
            case 2:
                return formData.sectors && formData.projectSummary && formData.problemToSolve && formData.projectStage && formData.solutionDescription;
            case 3:
                return formData.founders;
            case 4:
                return formData.privacyConsent && formData.dataProcessingConsent;
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
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                setIsSubmitted(true);
            } else {
                alert('Bir hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:bg-white/10 p-4 text-white outline-none transition-all";
    const labelClass = "flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold mb-2";

    if (isSubmitted) {
        return (
            <section id="antspark-application" className="py-24 relative bg-[#050510]">
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
                            ANTSPARK Ön Kuluçka Programı başvurunuz başarıyla gönderildi.
                            En kısa sürede sizinle iletişime geçeceğiz.
                        </p>
                        <button
                            onClick={() => { setIsSubmitted(false); setFormData(initialFormData); setCurrentPage(1); }}
                            className="px-8 py-3 bg-purple-500/20 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all font-orbitron"
                        >
                            Yeni Başvuru
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section id="antspark-application" className="py-24 relative bg-[#050510]">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
                        <Rocket className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-400 font-mono">ANTSPARK ÖN KULUÇKA PROGRAMI</span>
                    </div>
                    <h2 className="font-orbitron font-bold text-3xl md:text-4xl text-white mb-2">
                        Başvuru Formu
                    </h2>
                    <p className="text-gray-400">Fikrini büyüt, işine dönüştür, geleceğe imzanı at!</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3, 4].map(page => (
                            <div
                                key={page}
                                className={`flex items-center gap-2 ${currentPage >= page ? 'text-purple-400' : 'text-gray-600'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentPage >= page ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {page}
                                </div>
                                <span className="hidden md:inline text-xs">
                                    {page === 1 && "Kişisel Bilgiler"}
                                    {page === 2 && "Proje Bilgileri"}
                                    {page === 3 && "Ekip Bilgileri"}
                                    {page === 4 && "Onaylar"}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentPage / totalPages) * 100}%` }}
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

                    <AnimatePresence mode="wait">
                        {/* PAGE 1 - Personal Info */}
                        {currentPage === 1 && (
                            <motion.div
                                key="page1"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-400" />
                                    Kişisel Bilgiler
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Girişiminizin Adı <span className="text-red-500">*</span></label>
                                        <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} className={inputClass} placeholder="Örn: Girişim Adı" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Adınız Soyadınız <span className="text-red-500">*</span></label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} placeholder="Örn: Ahmet Yılmaz" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Projedeki Göreviniz <span className="text-red-500">*</span></label>
                                        <select name="projectRole" value={formData.projectRole} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Kurucu Ortak" className="bg-[#0a0a0a]">Kurucu Ortak</option>
                                            <option value="CEO" className="bg-[#0a0a0a]">CEO</option>
                                            <option value="CTO" className="bg-[#0a0a0a]">CTO</option>
                                            <option value="COO" className="bg-[#0a0a0a]">COO</option>
                                            <option value="Diğer" className="bg-[#0a0a0a]">Diğer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Telefon Numaranız <span className="text-red-500">*</span></label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+90 5XX XXX XX XX" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>E-posta Adresiniz <span className="text-red-500">*</span></label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="ornek@email.com" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Doğum Tarihiniz</label>
                                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={inputClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Cinsiyet</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Erkek" className="bg-[#0a0a0a]">Erkek</option>
                                            <option value="Kadın" className="bg-[#0a0a0a]">Kadın</option>
                                            <option value="Belirtmek İstemiyorum" className="bg-[#0a0a0a]">Belirtmek İstemiyorum</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Eğitim Durumunuz</label>
                                        <select name="education" value={formData.education} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Lise" className="bg-[#0a0a0a]">Lise</option>
                                            <option value="Ön Lisans" className="bg-[#0a0a0a]">Ön Lisans</option>
                                            <option value="Lisans" className="bg-[#0a0a0a]">Lisans</option>
                                            <option value="Yüksek Lisans" className="bg-[#0a0a0a]">Yüksek Lisans</option>
                                            <option value="Doktora" className="bg-[#0a0a0a]">Doktora</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Fakülte / Yüksekokul</label>
                                        <input type="text" name="faculty" value={formData.faculty} onChange={handleChange} className={inputClass} placeholder="Örn: Mühendislik Fakültesi" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Bölüm/Program</label>
                                        <input type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} placeholder="Örn: Bilgisayar Mühendisliği" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Şehir</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} placeholder="Örn: İstanbul" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>LinkedIn Hesabınız</label>
                                        <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/in/..." />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PAGE 2 - Project Info */}
                        {currentPage === 2 && (
                            <motion.div
                                key="page2"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-purple-400" />
                                    Proje Bilgileri
                                </h3>

                                <div>
                                    <label className={labelClass}>Projenizin İlgili Olduğu Sektör(ler) <span className="text-red-500">*</span></label>
                                    <input type="text" name="sectors" value={formData.sectors} onChange={handleChange} className={inputClass} placeholder="Örn: Teknoloji, Fintech, Eğitim" />
                                </div>

                                <div>
                                    <label className={labelClass}>İKÜ ANTS TEKMER temalarıyla hangi sektör ile buluşmaktasınız?</label>
                                    <input type="text" name="tekmerThemes" value={formData.tekmerThemes} onChange={handleChange} className={inputClass} placeholder="Örn: Yenilikçi Teknolojiler, Geliştirme, Sinerji" />
                                </div>

                                <div>
                                    <label className={labelClass}>Projenizi Bir Cümle ile Özetleyiniz <span className="text-red-500">*</span></label>
                                    <textarea name="projectSummary" value={formData.projectSummary} onChange={handleChange} rows={2} className={inputClass} placeholder="Projenizi tek cümlede açıklayın..." />
                                </div>

                                <div>
                                    <label className={labelClass}>Girişiminiz ile Çözmeyi Planladığınız Problem <span className="text-red-500">*</span></label>
                                    <textarea name="problemToSolve" value={formData.problemToSolve} onChange={handleChange} rows={3} className={inputClass} placeholder="Hangi problemi çözmeyi hedefliyorsunuz?" />
                                </div>

                                <div>
                                    <label className={labelClass}>Bu problemi neden çözmek istediniz?</label>
                                    <textarea name="whySolveProblem" value={formData.whySolveProblem} onChange={handleChange} rows={2} className={inputClass} placeholder="Motivasyonunuz nedir?" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Girişiminizin Aşaması <span className="text-red-500">*</span></label>
                                        <select name="projectStage" value={formData.projectStage} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Fikir Aşaması" className="bg-[#0a0a0a]">Fikir Aşaması</option>
                                            <option value="Prototip Aşaması" className="bg-[#0a0a0a]">Prototip Aşaması</option>
                                            <option value="MVP Aşaması" className="bg-[#0a0a0a]">MVP Aşaması</option>
                                            <option value="Büyüme Aşaması" className="bg-[#0a0a0a]">Büyüme Aşaması</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>İlk MVP'niz Çıktı mı?</label>
                                        <select name="hasMVP" value={formData.hasMVP} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Evet" className="bg-[#0a0a0a]">Evet</option>
                                            <option value="Hayır" className="bg-[#0a0a0a]">Hayır</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Ürününüz/Hizmetiniz hangi sorunu nasıl çözüyor? <span className="text-red-500">*</span></label>
                                    <textarea name="solutionDescription" value={formData.solutionDescription} onChange={handleChange} rows={4} className={inputClass} placeholder="Teknik altyapı dahil detaylı açıklama..." />
                                </div>

                                <div>
                                    <label className={labelClass}>Müşteri / Hedef Kitleniz Kimdir?</label>
                                    <textarea name="targetAudience" value={formData.targetAudience} onChange={handleChange} rows={2} className={inputClass} placeholder="Hedef kitlenizi tanımlayın..." />
                                </div>

                                <div>
                                    <label className={labelClass}>Pazarlama Stratejiniz Nedir?</label>
                                    <textarea name="marketingStrategy" value={formData.marketingStrategy} onChange={handleChange} rows={3} className={inputClass} placeholder="Pazarlama planınızı açıklayın..." />
                                </div>

                                <div>
                                    <label className={labelClass}>Girişiminizin Web Sitesi / LinkedIn Hesabı</label>
                                    <input type="text" name="projectWebsite" value={formData.projectWebsite} onChange={handleChange} className={inputClass} placeholder="URL veya 'Yok'" />
                                </div>

                                <div>
                                    <label className={labelClass}>Girişiminizin 1 Yıllık Hedefleri Nelerdir?</label>
                                    <textarea name="yearlyGoals" value={formData.yearlyGoals} onChange={handleChange} rows={3} className={inputClass} placeholder="1 yıllık hedeflerinizi listeleyin..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Daha Önce Başka Bir Yarışmaya Katıldınız mı?</label>
                                        <select name="previousCompetitions" value={formData.previousCompetitions} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Evet" className="bg-[#0a0a0a]">Evet</option>
                                            <option value="Hayır" className="bg-[#0a0a0a]">Hayır</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Girişiminizde yatırım aldınız mı?</label>
                                        <select name="hasInvestment" value={formData.hasInvestment} onChange={handleChange} className={inputClass}>
                                            <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                            <option value="Evet" className="bg-[#0a0a0a]">Evet</option>
                                            <option value="Hayır" className="bg-[#0a0a0a]">Hayır</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Girişiminizin FSMH (Fikri Mülkiyet) Süreçleri</label>
                                    <input type="text" name="intellectualProperty" value={formData.intellectualProperty} onChange={handleChange} className={inputClass} placeholder="Patent, marka tescili vb." />
                                </div>

                                <div>
                                    <label className={labelClass}>Sizleri diğer projelerden ayıran özellikler nelerdir?</label>
                                    <textarea name="differentiators" value={formData.differentiators} onChange={handleChange} rows={3} className={inputClass} placeholder="Rekabet avantajlarınızı açıklayın..." />
                                </div>
                            </motion.div>
                        )}

                        {/* PAGE 3 - Team Info */}
                        {currentPage === 3 && (
                            <motion.div
                                key="page3"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    Ekip Bilgileri
                                </h3>

                                <div>
                                    <label className={labelClass}>Kurucu Ortaklar Harici Ekipteki Kişi Sayısı</label>
                                    <input type="number" name="teamSize" value={formData.teamSize} onChange={handleChange} className={inputClass} placeholder="0" min="0" />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Kurucu Ortakların Bilgileri <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Ekipteki rolleri, isim-soyisim ve e-posta adreslerini belirtiniz.
                                    </p>
                                    <textarea
                                        name="founders"
                                        value={formData.founders}
                                        onChange={handleChange}
                                        rows={4}
                                        className={inputClass}
                                        placeholder="Örn:
Ahmet Yılmaz - Kurucu Ortak - ahmet@email.com
Mehmet Demir - CTO - mehmet@email.com"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Teknik/AR-GE yetkinliğine sahip kurucu ortak var mı?</label>
                                    <select name="hasTechnicalFounder" value={formData.hasTechnicalFounder} onChange={handleChange} className={inputClass}>
                                        <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                        <option value="Evet" className="bg-[#0a0a0a]">Evet</option>
                                        <option value="Hayır" className="bg-[#0a0a0a]">Hayır</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Şu an girişime ne kadar zaman ayırıyorsunuz?</label>
                                    <select name="weeklyHours" value={formData.weeklyHours} onChange={handleChange} className={inputClass}>
                                        <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                        <option value="Haftada 10 saatten az" className="bg-[#0a0a0a]">Haftada 10 saatten az</option>
                                        <option value="Haftada 10-20 saat" className="bg-[#0a0a0a]">Haftada 10-20 saat</option>
                                        <option value="Haftada 20-40 saat" className="bg-[#0a0a0a]">Haftada 20-40 saat</option>
                                        <option value="Tam zamanlı" className="bg-[#0a0a0a]">Tam zamanlı</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Mentorluk almak istediğiniz alanlar</label>
                                    <input type="text" name="mentorshipAreas" value={formData.mentorshipAreas} onChange={handleChange} className={inputClass} placeholder="Örn: Fikri mülkiyet, iş geliştirme, dijital pazarlama, yatırım" />
                                </div>
                            </motion.div>
                        )}

                        {/* PAGE 4 - Consents */}
                        {currentPage === 4 && (
                            <motion.div
                                key="page4"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    Onaylar ve Tamamlama
                                </h3>

                                <div className="space-y-4">
                                    <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="privacyConsent"
                                            checked={formData.privacyConsent}
                                            onChange={handleChange}
                                            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300 text-sm">
                                            Kişisel verilerin işlenmesinden önce <span className="text-purple-400">Aydınlatma Metni</span>'ni okuduğumu, anladığımı ve kişisel verilerime ilişkin olarak bilgilendirildiğimi kabul ederim. <span className="text-red-500">*</span>
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="dataProcessingConsent"
                                            checked={formData.dataProcessingConsent}
                                            onChange={handleChange}
                                            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300 text-sm">
                                            Aydınlatma'da belirtilen amaçlarla kişisel verilerimin işlenmesine açıkça izin verdiğimi kabul ve beyan ederim. <span className="text-red-500">*</span>
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="communicationConsent"
                                            checked={formData.communicationConsent}
                                            onChange={handleChange}
                                            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300 text-sm">
                                            Ticari elektronik iletilerin gönderilmesine ilişkin İletişim Onay Metni kapsamında T.C. İstanbul Kültür Üniversitesi tarafından ticari elektronik ileti gönderilmesine rıza ve onay verdiğimi bildiririm.
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label className={labelClass}>İletişim Onayı (Tercih Edin)</label>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {["SMS", "Telefon", "E-posta"].map(channel => (
                                            <label key={channel} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.communicationChannels.includes(channel)}
                                                    onChange={() => handleCheckboxArray('communicationChannels', channel)}
                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                                                />
                                                <span className="text-gray-300">{channel}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                    <p className="text-purple-300 text-sm">
                                        <strong>Not:</strong> Pitch Deck (Sunum) dosyanızı başvuru onaylandıktan sonra e-posta ile gönderebilirsiniz.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-orbitron text-sm transition-all ${currentPage === 1
                                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Önceki
                        </button>

                        {currentPage < totalPages ? (
                            <button
                                type="button"
                                onClick={nextPage}
                                disabled={!isCurrentPageValid}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-orbitron text-sm transition-all ${isCurrentPageValid
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
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
                                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-orbitron text-sm transition-all ${isCurrentPageValid && !isSubmitting
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
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
        </section>
    );
};
