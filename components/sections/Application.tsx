"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, User, Mail, Phone, Building2, GraduationCap, FileText, Users, ClipboardList, Target, Check } from "lucide-react";

export const Application = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        university: "",
        projectName: "",
        teamSize: "",
        projectSummary: "",
        expectations: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        return formData.fullName &&
            formData.email &&
            formData.phone &&
            formData.projectName &&
            formData.teamSize &&
            formData.projectSummary &&
            formData.expectations;
    };
    const isFormValid = validateForm();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    if (isSubmitted) {
        return (
            <section id="application" className="py-24 relative">
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
                            İKÜANTS TEKMER başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.
                        </p>
                        <button
                            onClick={() => { setIsSubmitted(false); setFormData({ fullName: "", email: "", phone: "", companyName: "", university: "", projectName: "", teamSize: "", projectSummary: "", expectations: "" }); }}
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
        <section id="application" className="py-24 relative bg-[#050510]">
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
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER ailesine katılmak için aşağıdaki formu doldurun. Size en kısa sürede dönüş yapacağız.
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onSubmit={handleSubmit}
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />

                    <div className="space-y-8">
                        {/* Row 1: Name & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <User className="w-4 h-4 text-primary" />
                                    Adınız Soyadınız <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all"
                                    placeholder="Örn: Ahmet Yılmaz"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <Mail className="w-4 h-4 text-primary" />
                                    E-posta Adresiniz <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all"
                                    placeholder="ornek@email.com"
                                />
                            </div>
                        </div>

                        {/* Row 2: Phone & Company */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <Phone className="w-4 h-4 text-primary" />
                                    Telefon Numaranız <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all"
                                    placeholder="+90 501 234 56 78"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    Firma Adı (Varsa)
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all"
                                    placeholder="Şirket veya marka adı"
                                />
                            </div>
                        </div>

                        {/* Row 3: University & Project Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <GraduationCap className="w-4 h-4 text-primary" />
                                    Üniversite / Bölüm (Varsa)
                                </label>
                                <input
                                    type="text"
                                    name="university"
                                    value={formData.university}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all"
                                    placeholder="Örn: İstanbul Kültür Üniversitesi / Bilgisayar Müh."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Proje Adı <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="projectName"
                                    required
                                    value={formData.projectName}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all"
                                    placeholder="Projenizin adı"
                                />
                            </div>
                        </div>

                        {/* Row 4: Team Size */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                <Users className="w-4 h-4 text-primary" />
                                Proje Ekibi Kaç Kişiden Oluşuyor? <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="teamSize"
                                required
                                value={formData.teamSize}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all cursor-pointer"
                            >
                                <option value="" className="bg-[#0a0a0a]">Seçiniz...</option>
                                <option value="1" className="bg-[#0a0a0a]">1 Kişi (Solo)</option>
                                <option value="2" className="bg-[#0a0a0a]">2 Kişi</option>
                                <option value="3" className="bg-[#0a0a0a]">3 Kişi</option>
                                <option value="4" className="bg-[#0a0a0a]">4 Kişi</option>
                                <option value="5+" className="bg-[#0a0a0a]">5+ Kişi</option>
                            </select>
                        </div>

                        {/* Project Summary */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                <ClipboardList className="w-4 h-4 text-primary" />
                                Proje Özeti <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Şirket profili, takım bilgisi, problem tanımı ve çözüm önerisi, pazar bilgisi ve finansal beklentilerden bahsedilmelidir.
                            </p>
                            <textarea
                                name="projectSummary"
                                required
                                rows={5}
                                value={formData.projectSummary}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all resize-none"
                                placeholder="Projenizi detaylı bir şekilde açıklayın..."
                            />
                        </div>

                        {/* Expectations */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold">
                                <Target className="w-4 h-4 text-primary" />
                                Beklentileriniz Nelerdir? <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Neden İKÜANTS TEKMER bünyesinde olmak istediğinizi anlatın.
                            </p>
                            <textarea
                                name="expectations"
                                required
                                rows={4}
                                value={formData.expectations}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg focus:border-secondary focus:bg-white/10 p-4 text-white outline-none transition-all resize-none"
                                placeholder="TEKMER'den beklentileriniz ve hedefleriniz..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={`w-full py-5 bg-gradient-to-r from-primary to-purple-600 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-3 group transition-all ${!isFormValid || isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-primary/90 hover:to-purple-600/90 shadow-[0_0_30px_rgba(112,0,255,0.3)] hover:shadow-[0_0_50px_rgba(112,0,255,0.5)]'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    GÖNDERİLİYOR...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    BAŞVURUYU GÖNDER
                                </>
                            )}
                        </button>
                    </div>
                </motion.form>
            </div>
        </section>
    );
};
