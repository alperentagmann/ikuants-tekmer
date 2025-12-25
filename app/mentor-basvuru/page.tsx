"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Send, User, Mail, Phone, Briefcase, Linkedin,
    GraduationCap, Target, Check, Award, MapPin, Clock, FileText
} from "lucide-react";
import Link from "next/link";

const expertiseAreas = [
    "Yazılım/Endüstriler",
    "Yenilikçi Teknolojiler",
    "Yeni Medya Tasarımı",
    "Oyun (Game Development)",
    "Fintech",
    "Edtech",
    "Animasyon",
    "UI/UX Tasarım",
    "Yapay Zeka",
    "Bilgi ve İletişim Teknolojileri",
    "Yazılım",
    "Dijitalleşme",
    "Elektrik/Elektronik",
    "Robotik",
    "Makina",
    "Kimya",
    "Biyoteknoloji",
    "Nanoteknoloji",
    "Genetik",
    "Enerji/Yenilenebilir Enerji",
    "Havacılık",
    "Savunma",
    "Sağ/Tıbbi Cihaz/Medikal",
    "Finans",
    "Yönetim/Organizasyon",
    "Hukuk",
    "Fikri Mülkiyet",
    "İşletme",
    "İnsan Kaynakları",
    "Pazarlama"
];

const educationLevels = [
    "Lise",
    "Ön Lisans",
    "Lisans",
    "Yüksek Lisans",
    "Doktora ve Üstü",
    "Diğer"
];

const mentorQualities = [
    "Danışman gibi yön gösteren",
    "Koç gibi sorularla yönlendiren",
    "Rol model olan",
    "Gönüllü destekçi",
    "Diğer"
];

const initialFormData = {
    // Kişisel Bilgiler
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    city: "",

    // Eğitim ve Profesyonel Deneyim
    educationLevel: "",
    university: "",
    experienceYears: "",
    currentPosition: "",
    careerSummary: "",

    // Uzmanlık Alanları
    expertise: [] as string[],
    expertiseDescription: "",

    // Mentorluk Deneyimi
    hasMentorExperience: "",
    mentorCount: "",
    mentorAreas: "",
    hasCertificate: "",
    certificateDetails: "",
    mentorMeaning: "",

    // Eğitmen Bilgileri
    trainingTopics: "",

    // Motivasyon ve Ek Bilgiler
    motivation: "",
    idealMentor: [] as string[],
    availability: "",
    hasFinancialExpectation: "",
    hourlyRate: "",

    // Onay
    kvkkConsent: false
};

export default function MentorBasvuruPage() {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleExpertiseChange = (area: string) => {
        setFormData(prev => ({
            ...prev,
            expertise: prev.expertise.includes(area)
                ? prev.expertise.filter(a => a !== area)
                : [...prev.expertise, area]
        }));
    };

    const handleQualityChange = (quality: string) => {
        setFormData(prev => ({
            ...prev,
            idealMentor: prev.idealMentor.includes(quality)
                ? prev.idealMentor.filter(q => q !== quality)
                : [...prev.idealMentor, quality]
        }));
    };

    const validateForm = () => {
        const { fullName, email, phone, city, educationLevel, university, experienceYears, currentPosition, careerSummary,
            expertise, expertiseDescription, hasMentorExperience, mentorAreas, hasCertificate, mentorMeaning,
            motivation, idealMentor, availability, hasFinancialExpectation, kvkkConsent } = formData;

        if (!fullName || !email || !phone || !city) return false;
        if (!educationLevel || !university || !experienceYears || !currentPosition || !careerSummary) return false;
        if (expertise.length === 0 || !expertiseDescription) return false;

        if (!hasMentorExperience) return false;
        if (hasMentorExperience === "Evet" && !mentorAreas) return false;

        if (!hasCertificate) return false;

        if (!mentorMeaning || !motivation || !availability) return false;
        if (idealMentor.length === 0) return false;

        if (!hasFinancialExpectation) return false;

        if (!kvkkConsent) return false;

        return true;
    };

    const isFormValid = validateForm();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/basvuru', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, formType: 'mentor' })
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

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:bg-white/10 p-4 text-white outline-none transition-all";
    const labelClass = "flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold mb-2";
    const sectionClass = "p-6 rounded-xl bg-white/[0.02] border border-white/5";

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
                            Mentör başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.
                        </p>
                        <Link
                            href="/mentorler"
                            className="inline-block px-8 py-3 bg-primary/20 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all font-semibold"
                        >
                            Mentörlere Dön
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">MENTÖR BAŞVURUSU</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        Mentör Olmak İster Misiniz?
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Deneyimlerinizi genç girişimcilerle paylaşın, geleceği birlikte şekillendirin.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    <div className="h-1 w-full bg-gradient-to-r from-primary to-purple-600 absolute top-0 left-0" />

                    <div className="space-y-10">
                        {/* BÖLÜM 1: Kişisel Bilgiler */}
                        <div className={sectionClass}>
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Kişisel Bilgiler
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Adınız ve Soyadınız *</label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>E-Posta Adresiniz *</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Cep Telefon Numaranız *</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+90 5XX XXX XX XX" required />
                                </div>
                                <div>
                                    <label className={labelClass}>LinkedIn Profiliniz veya Kişisel Web Siteniz</label>
                                    <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputClass} placeholder="https://..." />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}><MapPin className="w-4 h-4 text-primary" /> Bulunduğunuz Şehir / Ülke *</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} required />
                                </div>
                            </div>
                        </div>

                        {/* BÖLÜM 2: Eğitim ve Profesyonel Deneyim */}
                        <div className={sectionClass}>
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                Eğitim ve Profesyonel Deneyim
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>En Yüksek Eğitim Düzeyiniz *</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {educationLevels.map((level) => (
                                            <label key={level} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                                <input
                                                    type="radio"
                                                    name="educationLevel"
                                                    value={level}
                                                    checked={formData.educationLevel === level}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 accent-primary"
                                                />
                                                <span className="text-sm text-gray-300">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Mezun Olduğunuz Üniversite ve Bölüm *</label>
                                    <input type="text" name="university" value={formData.university} onChange={handleChange} className={inputClass} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Profesyonel Deneyim Süreniz *</label>
                                        <input type="text" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className={inputClass} placeholder="Örn: 10 yıl" required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Mevcut veya Son İş Unvanınız ve Çalıştığınız Kurum *</label>
                                        <input type="text" name="currentPosition" value={formData.currentPosition} onChange={handleChange} className={inputClass} required />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Kariyer Özetiniz *</label>
                                    <textarea name="careerSummary" value={formData.careerSummary} onChange={handleChange} rows={4} className={inputClass} placeholder="Profesyonel geçmişinizi özetleyen kısa bir metin yazınız (en fazla 200 kelime)." required />
                                </div>
                            </div>
                        </div>

                        {/* BÖLÜM 3: Uzmanlık Alanları */}
                        <div className={sectionClass}>
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Uzmanlık Alanları ve TEKMER Uyumu
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">
                                İKÜANTS TEKMER'in odaklandığı temalar aşağıdadır. Lütfen uzmanlık alanlarınızı seçin ve açıklayın.
                            </p>
                            <div>
                                <label className={labelClass}>Girişimcilere Katkı Sağlayabileceğiniz Uzmanlık Alanlarınız *</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto">
                                    {expertiseAreas.map((area) => (
                                        <label key={area} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all text-xs">
                                            <input
                                                type="checkbox"
                                                checked={formData.expertise.includes(area)}
                                                onChange={() => handleExpertiseChange(area)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className="text-gray-300">{area}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6">
                                <label className={labelClass}>Seçtiğiniz Alanlardaki Deneyiminizi Açıklayınız *</label>
                                <textarea name="expertiseDescription" value={formData.expertiseDescription} onChange={handleChange} rows={3} className={inputClass} placeholder="Uzmanlık alanlarındaki deneyiminizi kısaca paylaşınız." required />
                            </div>
                        </div>

                        {/* BÖLÜM 4: Mentorluk Deneyimi */}
                        <div className={sectionClass}>
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Mentorluk Deneyimi
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>Daha Önce Mentorlük Deneyiminiz Oldu mu? *</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                            <input type="radio" name="hasMentorExperience" value="Evet" checked={formData.hasMentorExperience === "Evet"} onChange={handleChange} className="accent-primary" />
                                            <span className="text-gray-300">Evet</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                            <input type="radio" name="hasMentorExperience" value="Hayır" checked={formData.hasMentorExperience === "Hayır"} onChange={handleChange} className="accent-primary" />
                                            <span className="text-gray-300">Hayır</span>
                                        </label>
                                    </div>
                                </div>
                                {formData.hasMentorExperience === "Evet" && (
                                    <>
                                        <div>
                                            <label className={labelClass}>Kaç girişimciye veya şirkete mentorlük yaptınız?</label>
                                            <input type="text" name="mentorCount" value={formData.mentorCount} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Mentorlük Yaptığınız Alanlar ve Süreler *</label>
                                            <textarea name="mentorAreas" value={formData.mentorAreas} onChange={handleChange} rows={3} className={inputClass} placeholder="Örnek: Edtech startuplara 2 yıl mentörlük, iş geliştirme ve dijital pazarlama uzmanı." />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className={labelClass}>Mentorlük Sertifikanız Var mı? *</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                            <input type="radio" name="hasCertificate" value="Evet" checked={formData.hasCertificate === "Evet"} onChange={handleChange} className="accent-primary" />
                                            <span className="text-gray-300">Evet</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                            <input type="radio" name="hasCertificate" value="Hayır" checked={formData.hasCertificate === "Hayır"} onChange={handleChange} className="accent-primary" />
                                            <span className="text-gray-300">Hayır</span>
                                        </label>
                                    </div>
                                </div>
                                {formData.hasCertificate === "Evet" && (
                                    <div>
                                        <label className={labelClass}>Sertifikanın adı, veren kurum ve tarih bilgilerini paylaşınız</label>
                                        <input type="text" name="certificateDetails" value={formData.certificateDetails} onChange={handleChange} className={inputClass} />
                                    </div>
                                )}
                                <div>
                                    <label className={labelClass}>Mentorlük Kavramı Sizin İçin Ne Anlam İfade Ediyor? *</label>
                                    <textarea name="mentorMeaning" value={formData.mentorMeaning} onChange={handleChange} rows={3} className={inputClass} placeholder="Lütfen kendi bakış açınızdan mentorluğu tanımlayınız." required />
                                </div>
                            </div>
                        </div>

                        {/* BÖLÜM 5: Eğitmen Bilgileri (Opsiyonel) */}
                        <div className={sectionClass}>
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Eğitmen Olarak Yer Almak İstiyorsanız
                            </h2>
                            <div>
                                <label className={labelClass}>Hangi konu başlıklarında eğitim verebileceğinizi ve her bir eğitimin ortalama süresini (saat olarak) belirtiniz</label>
                                <textarea name="trainingTopics" value={formData.trainingTopics} onChange={handleChange} rows={3} className={inputClass} placeholder="Örn: Dijital Pazarlama (3 saat), Startup Finansmanı (2 saat)..." />
                            </div>
                        </div>

                        {/* BÖLÜM 6: Motivasyon ve Ek Bilgiler */}
                        <div className={sectionClass}>
                            <h2 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" />
                                Motivasyon ve Ek Bilgiler
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>İKÜANTS TEKMER'de Mentor Olarak Görev Almak İçin Motivasyonunuz Nedir? *</label>
                                    <textarea name="motivation" value={formData.motivation} onChange={handleChange} rows={3} className={inputClass} placeholder="Bu programa katılma isteğinizi ve hedeflerinizi bizimle paylaşın." required />
                                </div>
                                <div>
                                    <label className={labelClass}>Sizce İyi Bir Mentor Nasıl Olmalıdır? *</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {mentorQualities.map((quality) => (
                                            <label key={quality} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.idealMentor.includes(quality)}
                                                    onChange={() => handleQualityChange(quality)}
                                                    className="w-4 h-4 accent-primary"
                                                />
                                                <span className="text-sm text-gray-300">{quality}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}><Clock className="w-4 h-4 text-primary" /> Mentorlüğe Zaman Ayırabileceğiniz Süre *</label>
                                    <textarea name="availability" value={formData.availability} onChange={handleChange} rows={2} className={inputClass} placeholder="Kuluçka Programları Ortalama 12 Hafta Sürmektedir. Kuluçka programının tamamında minimum 8 saat mentorlük beklenmektedir." required />
                                </div>
                                <div>
                                    <label className={labelClass}>Sunmak İstediğiniz Mentorluk hizmetinizden maddi beklentiniz var mı? *</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                            <input type="radio" name="hasFinancialExpectation" value="Evet" checked={formData.hasFinancialExpectation === "Evet"} onChange={handleChange} className="accent-primary" />
                                            <span className="text-gray-300">Evet</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                            <input type="radio" name="hasFinancialExpectation" value="Hayır (Gönüllülük Esaslı)" checked={formData.hasFinancialExpectation === "Hayır (Gönüllülük Esaslı)"} onChange={handleChange} className="accent-primary" />
                                            <span className="text-gray-300">Hayır (Gönüllülük Esaslı)</span>
                                        </label>
                                    </div>
                                </div>
                                {formData.hasFinancialExpectation === "Evet" && (
                                    <div>
                                        <label className={labelClass}>Evet ise saatlik net ücret beklentinizi belirtiniz</label>
                                        <input type="text" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className={inputClass} placeholder="Örn: 500 TL/saat" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* KVKK Onayı */}
                        <div className="space-y-4">
                            <label className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                                <input
                                    type="checkbox"
                                    name="kvkkConsent"
                                    checked={formData.kvkkConsent}
                                    onChange={handleChange}
                                    className="w-5 h-5 accent-primary mt-0.5"
                                    required
                                />
                                <span className="text-sm text-gray-300">
                                    Bu başvuru formunda ve eklerinde vermiş olduğum kişisel bilgilerimin, üniversite bünyesinde oluşturulacak mentor veri havuzunda saklanmasını, yapay zekâ destekli sistemler aracılığıyla analiz edilmesini, girişimci eşleştirme süreçlerinde kullanılmasını ve gerekli görülmesi hâlinde mentorluk talebinde bulunan diğer kurum ve kuruluşlarla paylaşılmasını 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında bilgilendirildiğimi kabul ederek açık rıza ile onaylıyorum. <span className="text-red-500">*</span>
                                </span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={`w-full py-5 rounded-lg font-orbitron font-bold tracking-widest flex items-center justify-center gap-3 transition-all ${isFormValid && !isSubmitting
                                ? 'bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 shadow-lg shadow-primary/30'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    GÖNDERİLİYOR...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    BAŞVURUYU GÖNDER
                                </>
                            )}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
