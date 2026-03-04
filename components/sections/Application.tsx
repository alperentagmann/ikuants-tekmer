"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Send, User, Mail, Phone, Building2, Calendar, FileText, Users,
    ClipboardList, Target, Check, ArrowRight, ArrowLeft, Link as LinkIcon,
    Briefcase, Sparkles, Globe, MapPin, PenTool, TrendingUp, Clock, Monitor,
    Milestone, Scaling, Timer
} from "lucide-react";

export const Application = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Kişisel / Yetkili Bilgileri
        authorizedPerson: "",
        tcNo: "",
        birthDate: "",
        educationStatus: "",
        phone: "",
        email: "",

        // Firma Bilgileri
        hasCompany: "",
        companyName: "",
        companyTitle: "",
        foundationDate: "",
        mersisNo: "",
        tradeRegistryNo: "",
        partnersNames: "",
        companyWebsite: "",
        companyEmail: "",
        companyPhone: "",
        taxOffice: "",
        taxNumber: "",
        companyAddress: "",
        naceCode: "",

        // Page 2
        projectName: "",
        projectSummary: "",
        teamInfo: "",
        projectTheme: "",
        projectContribution: "",
        projectDifference: "",
        projectOutputs: "",
        targetMarket: "",
        projectTimeline: "",
        scalability: "",
        expectations: "",
        workspacePreference: "",
        requestedDuration: "",
        argeQuality: "",
        presentationLink: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isStep1Valid = () => {
        return formData.hasCompany && formData.authorizedPerson && formData.tcNo && formData.birthDate && formData.email && formData.phone;
    };

    const isStep2Valid = () => {
        return formData.projectName &&
            formData.projectSummary &&
            formData.teamInfo &&
            formData.projectTheme &&
            formData.projectContribution &&
            formData.projectDifference &&
            formData.projectOutputs &&
            formData.targetMarket &&
            formData.projectTimeline &&
            formData.scalability &&
            formData.expectations &&
            formData.workspacePreference &&
            formData.requestedDuration &&
            formData.argeQuality &&
            formData.presentationLink;
    };

    const handleNext = () => {
        if (isStep1Valid()) setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStep2Valid()) return;
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
                window.scrollTo({ top: 0, behavior: "smooth" });
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

    if (isSubmitted) {
        return (
            <section id="application" className="py-24 relative bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-green-500/30 p-12 rounded-2xl text-center shadow-lg dark:shadow-none"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="font-orbitron font-bold text-3xl text-black dark:text-white mb-4">Başvurunuz Alındı!</h2>
                        <p className="text-black/70 dark:text-gray-400 mb-6">
                            İKÜANTS TEKMER başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.
                        </p>
                        <button
                            onClick={() => {
                                setIsSubmitted(false);
                                setStep(1);
                                setFormData({
                                    authorizedPerson: "", tcNo: "", birthDate: "", educationStatus: "", email: "", phone: "",
                                    hasCompany: "", companyName: "", companyTitle: "", foundationDate: "", mersisNo: "", tradeRegistryNo: "",
                                    partnersNames: "", companyWebsite: "", companyEmail: "", companyPhone: "", taxOffice: "", taxNumber: "",
                                    companyAddress: "", naceCode: "",
                                    projectName: "", projectSummary: "", teamInfo: "", projectTheme: "", projectContribution: "", projectDifference: "",
                                    projectOutputs: "", targetMarket: "", projectTimeline: "", scalability: "", expectations: "", workspacePreference: "", requestedDuration: "", argeQuality: "", presentationLink: ""
                                });
                            }}
                            className="px-8 py-3 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all font-semibold"
                        >
                            Yeni Başvuru
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section id="application" className="py-24 relative bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">BAŞVURU FORMU</span>
                    </h2>
                    <p className="text-black/70 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER ailesine katılmak için aşağıdaki formu doldurun.
                    </p>
                    {/* Stepper Indicator */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
                        <div className={`h-1 w-16 rounded ${step >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>2</div>
                    </div>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`form-step-${step}`} // Re-animate when step changes
                    className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden shadow-lg dark:shadow-none"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />

                    {step === 1 && (
                        <div className="space-y-8">
                            <h3 className="text-xl text-black dark:text-white font-orbitron font-semibold mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                                Adım 1: Kişisel ve Şirket Bilgileri
                            </h3>

                            <div className="space-y-4 p-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    Şirketiniz Var Mı? <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <input type="radio" name="hasCompany" value="Evet" checked={formData.hasCompany === "Evet"} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-full p-4 text-center rounded-lg border-2 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all font-semibold">Evet</div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input type="radio" name="hasCompany" value="Hayır" checked={formData.hasCompany === "Hayır"} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-full p-4 text-center rounded-lg border-2 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all font-semibold">Hayır</div>
                                    </label>
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 mt-6 mb-4"><User className="w-5 h-5 text-primary" /> Yetkili Kişi Bilgileri</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                        Yetkili Kişi <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="authorizedPerson" required value={formData.authorizedPerson} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" placeholder="Ad Soyad" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                        T.C. Kimlik No <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="tcNo" maxLength={11} required value={formData.tcNo} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" placeholder="11 Haneli T.C. Kimlik Numarası" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        Doğum Tarihi <span className="text-red-500">*</span>
                                    </label>
                                    <input type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                        Eğitim Durumu
                                    </label>
                                    <select name="educationStatus" value={formData.educationStatus} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all">
                                        <option value="">Seçiniz</option>
                                        <option value="Önlisans">Önlisans</option>
                                        <option value="Lisans">Lisans</option>
                                        <option value="Yüksek Lisans">Yüksek Lisans</option>
                                        <option value="Doktora">Doktora</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                        <Phone className="w-4 h-4 text-primary" />
                                        Telefon <span className="text-red-500">*</span>
                                    </label>
                                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" placeholder="+90 501 234 56 78" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                        <Mail className="w-4 h-4 text-primary" />
                                        E-posta <span className="text-red-500">*</span>
                                    </label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" placeholder="ornek@email.com" />
                                </div>
                            </div>

                            {formData.hasCompany === "Evet" && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-6 border-t border-gray-200 dark:border-white/10">
                                    <h4 className="text-lg font-bold text-black dark:text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Şirket Detayları</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma Adı/Girişim Adı <span className="text-red-500">*</span></label>
                                            <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma Ünvanı</label>
                                            <input type="text" name="companyTitle" value={formData.companyTitle} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma Kuruluş Tarihi</label>
                                            <input type="date" name="foundationDate" value={formData.foundationDate} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Ortakların Adı</label>
                                            <input type="text" name="partnersNames" value={formData.partnersNames} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" placeholder="Örn: Ahmet Yılmaz, Ayşe Demir" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Ticaret Sicil No</label>
                                            <input type="text" name="tradeRegistryNo" value={formData.tradeRegistryNo} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma Mersis NO</label>
                                            <input type="text" name="mersisNo" value={formData.mersisNo} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma V.D. (Vergi Dairesi)</label>
                                            <input type="text" name="taxOffice" value={formData.taxOffice} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma VKN.</label>
                                            <input type="text" name="taxNumber" value={formData.taxNumber} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma Telefon</label>
                                            <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma E-Mail</label>
                                            <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Firma Web Sitesi</label>
                                            <input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">Nace Kodu</label>
                                            <input type="text" name="naceCode" value={formData.naceCode} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                Firma Adresi
                                            </label>
                                            <textarea name="companyAddress" rows={2} value={formData.companyAddress} onChange={handleChange} className="w-full resize-none bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!isStep1Valid()}
                                className={`w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-3 group transition-all ${!isStep1Valid() ? 'opacity-50 cursor-not-allowed' : 'hover:from-primary/90 hover:to-purple-600/90 shadow-lg'}`}
                            >
                                SONRAKİ ADIM <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8">
                            <h3 className="text-xl text-black dark:text-white font-orbitron font-semibold mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-center justify-between">
                                <span>Adım 2: Proje Bilgileri</span>
                                <button type="button" onClick={handleBack} className="text-sm text-primary flex items-center gap-1 hover:underline">
                                    <ArrowLeft className="w-4 h-4" /> Geri Dön
                                </button>
                            </h3>

                            {/* Project Name & Theme */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <FileText className="w-4 h-4 text-primary" /> Proje Adı <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="projectName" required value={formData.projectName} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <PenTool className="w-4 h-4 text-primary" /> Proje Teması <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="projectTheme" placeholder="Makina, Yazılım, Dijitalleşme vb." required value={formData.projectTheme} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none" />
                                </div>
                            </div>

                            {/* Team Info */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <Users className="w-4 h-4 text-primary" /> Projeyi Yürütecek Ekip Hakkında Bilgi <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-black/50 dark:text-gray-500 mb-1">Partner olarak mı, çalışan olarak mı yer alınacak? Ekip üyelerinin rolleri nelerdir?</p>
                                <textarea name="teamInfo" required rows={3} value={formData.teamInfo} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                            </div>

                            {/* Project Summary */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <ClipboardList className="w-4 h-4 text-primary" /> Proje Özeti <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-black/50 dark:text-gray-500 mb-1">Şirket profili, takım bilgisi, problem tanımı ve çözüm önerisi, pazar bilgisi ve finansal beklentilerden bahsedilmelidir.</p>
                                <textarea name="projectSummary" required rows={4} value={formData.projectSummary} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                            </div>

                            {/* Contribution & Difference */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Globe className="w-4 h-4 text-primary" /> Gelişmeye Katkısı <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-black/50 dark:text-gray-500 mb-1">Ulusal ve uluslararası bazda katkısı ne olacaktır?</p>
                                    <textarea name="projectContribution" required rows={3} value={formData.projectContribution} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Sparkles className="w-4 h-4 text-primary" /> Mevcut Ürünlerden Farkı <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-black/50 dark:text-gray-500 mb-1">Geliştirilecek ürünün farklılığını açıklayınız.</p>
                                    <textarea name="projectDifference" required rows={3} value={formData.projectDifference} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                                </div>
                            </div>

                            {/* Outputs and Market */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Milestone className="w-4 h-4 text-primary" /> Çıktılar ve Kullanım Alanları <span className="text-red-500">*</span>
                                    </label>
                                    <textarea name="projectOutputs" required rows={3} value={formData.projectOutputs} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <TrendingUp className="w-4 h-4 text-primary" /> Hedef Müşteri ve Pazar <span className="text-red-500">*</span>
                                    </label>
                                    <textarea name="targetMarket" required rows={3} value={formData.targetMarket} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                                </div>
                            </div>

                            {/* Timeline & Scalability */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Clock className="w-4 h-4 text-primary" /> Proje Faaliyet-Zaman Planı <span className="text-red-500">*</span>
                                    </label>
                                    <textarea name="projectTimeline" required rows={3} value={formData.projectTimeline} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Scaling className="w-4 h-4 text-primary" /> Ölçeklenebilirlik <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-black/50 dark:text-gray-500 mb-1">Ticarileşme potansiyelini açıklayınız.</p>
                                    <textarea name="scalability" required rows={3} value={formData.scalability} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                                </div>
                            </div>

                            {/* Options and Dropdowns */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Monitor className="w-4 h-4 text-primary" /> Alan İhtiyacı <span className="text-red-500">*</span>
                                    </label>
                                    <select name="workspacePreference" required value={formData.workspacePreference} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none">
                                        <option value="">Seçiniz</option>
                                        <option value="Açık Alan / Masa">Açık Alan / Masa</option>
                                        <option value="Kapalı Ofis">Kapalı Ofis</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Timer className="w-4 h-4 text-primary" /> Talep Edilen Süre <span className="text-red-500">*</span>
                                    </label>
                                    <select name="requestedDuration" required value={formData.requestedDuration} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none">
                                        <option value="">Seçiniz</option>
                                        <option value="6 Ay">6 Ay</option>
                                        <option value="1 Yıl">1 Yıl</option>
                                        <option value="1.5 Yıl">1.5 Yıl</option>
                                        <option value="2 Yıl">2 Yıl</option>
                                        <option value="Daha Uzun">Daha Uzun</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                        <Target className="w-4 h-4 text-primary" /> AR-GE Niteliği <span className="text-red-500">*</span>
                                    </label>
                                    <select name="argeQuality" required value={formData.argeQuality} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none">
                                        <option value="">Seçiniz</option>
                                        <option value="Temel Araştırma">Temel Araştırma</option>
                                        <option value="Uygulamalı Araştırma">Uygulamalı Araştırma</option>
                                        <option value="Deneysel Geliştirme">Deneysel Geliştirme</option>
                                    </select>
                                </div>
                            </div>

                            {/* Expectations */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <Target className="w-4 h-4 text-primary" /> Beklentileriniz Nelerdir? <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-black/50 dark:text-gray-500 mb-1">Neden İKÜANTS TEKMER bünyesinde yer almak istiyorsunuz?</p>
                                <textarea name="expectations" required rows={3} value={formData.expectations} onChange={handleChange} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-black dark:text-white outline-none resize-none" />
                            </div>

                            {/* Presentation Link */}
                            <div className="space-y-2 p-6 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-black dark:text-white font-bold">
                                    <LinkIcon className="w-4 h-4 text-primary" /> Sunum Dosyası Bağlantısı <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-black/60 dark:text-gray-400 mb-2">Başvuru değerlendirmesi için projenizin sunumunu (Pitch Deck) Google Drive, Dropbox veya WeTransfer gibi bir platforma yükleyerek bağlantısını buraya kopyalayınız. (Erişim izninin açık olduğundan emin olun.)</p>
                                <input type="url" name="presentationLink" required value={formData.presentationLink} onChange={handleChange} className="w-full bg-white dark:bg-black/50 border border-primary/30 rounded-lg p-4 text-black dark:text-white outline-none focus:border-primary transition-all" placeholder="https://drive.google.com/..." />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!isStep2Valid() || isSubmitting}
                                className={`w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-3 group transition-all ${!isStep2Valid() || isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-primary/90 hover:to-purple-600/90 shadow-[0_0_30px_rgba(112,0,255,0.3)] hover:shadow-[0_0_50px_rgba(112,0,255,0.5)]'}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        GÖNDERİLİYOR...
                                    </>
                                ) : (
                                    <>
                                        BAŞVURUYU TAMAMLA VE GÖNDER <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.form>
            </div>
        </section>
    );
};
