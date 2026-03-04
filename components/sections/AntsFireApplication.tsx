"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, User, Building2, Flame, Target, Rocket,
    ChevronRight, ChevronLeft, Check, Upload, HelpCircle,
    PieChart, DollarSign, Users, Briefcase
} from "lucide-react";

// --- Types ---

type FormData = {
    // 1. Şirket
    hasCompany: string;
    companyName: string;
    companyTitle: string;
    foundationYear: string;
    mersisNo: string;
    tradeRegistryNo: string;
    partnersNames: string;
    website: string;
    companyEmail: string;
    companyPhone: string;
    taxNumber: string;
    taxOffice: string;
    companyAddress: string;
    naceCode: string;

    tekmerAcceptanceDate: string;
    rentContractDate: string;
    deskOfficeNo: string;
    rentAmount: string;

    sector: string;
    tekmerClusters: string[]; // AI, Cloud, Mobility etc. (Multi-select)
    employeeCount: string;

    // 2. Kurucu / Yetkili Kişi
    founderName: string;
    tcNo: string;
    birthDate: string;
    educationStatus: string;
    founderContact: string; // Email / Phone combined or separate. User asked for "E-posta / Telefon"
    founderPhone: string;
    founderRole: string; // CEO/CTO/COO
    weeklyHours: string; // 10-20, 20-30, 30+

    // 3. Ürün/Ar-Ge
    productShortDesc: string; // 150-300 chars
    problemDefinition: string;
    solutionDifference: string;
    trlLevel: string; // 1-9
    demoLink: string;
    randdProjectSummary: string; // Scope, method, output, calendar
    // File uploads are tricky in purely client-side without storage. 
    // We will use state to hold the File object but for the email/API we might only be able to send name or need FormData.
    // For this implementation, we'll simulate file selection and ask for a link fallback if needed.

    // 4. Pazar
    targetCustomer: string; // ICP
    marketSize: string; // TAM/SAM/SOM
    competitors: string; // 3-5 competitors
    gtmPlan: string; // Channel, sales process

    // 5. Traction & Finans
    hasPilot: string; // Evet/Hayır
    revenueStatus: string; // 0, 1-50k, 50k+
    financialSummary: string; // Last 12 months revenue/expense
    runway: string; // 0-3, 3-6, 6-12, 12+
    investmentHistory: string;

    // 6. Dosyalar (File objects not easy to JSON.stringy for existing API)
    // We will skip actual file upload implementation to API for now and ask for Links or just keep UI placeholders.
    // Better approach: Ask for Drive/Doc links for large files to ensure delivery.
    pitchDeckLink: string;
    founderCvLink: string;

    // 7. İhtiyaç
    selectedModules: string[];
    bottlenecks: string; // 3 critical bottlenecks
    goals: string; // 3 goals

    // 8. Taahhüt
    privacyConsent: boolean;
    termsConsent: boolean;
};

const initialFormData: FormData = {
    hasCompany: "",
    companyName: "",
    companyTitle: "",
    foundationYear: "",
    mersisNo: "",
    tradeRegistryNo: "",
    partnersNames: "",
    website: "",
    companyEmail: "",
    companyPhone: "",
    taxNumber: "",
    taxOffice: "",
    companyAddress: "",
    naceCode: "",

    tekmerAcceptanceDate: "",
    rentContractDate: "",
    deskOfficeNo: "",
    rentAmount: "",

    sector: "",
    tekmerClusters: [],
    employeeCount: "",

    founderName: "",
    tcNo: "",
    birthDate: "",
    educationStatus: "",
    founderContact: "",
    founderPhone: "",
    founderRole: "",
    weeklyHours: "",

    productShortDesc: "",
    problemDefinition: "",
    solutionDifference: "",
    trlLevel: "",
    demoLink: "",
    randdProjectSummary: "",

    targetCustomer: "",
    marketSize: "",
    competitors: "",
    gtmPlan: "",

    hasPilot: "",
    revenueStatus: "",
    financialSummary: "",
    runway: "",
    investmentHistory: "",

    pitchDeckLink: "",
    founderCvLink: "",

    selectedModules: [],
    bottlenecks: "",
    goals: "",

    privacyConsent: false,
    termsConsent: false,
};

// --- Options ---

const TEKMER_CLUSTERS = [
    "Yapay Zeka (AI)", "Bulut Bilişim (Cloud)", "Mobilite",
    "Gömülü Sistemler", "Yeni Medya", "Fintech", "Healthtech",
    "Oyun", "Siber Güvenlik", "Diğer"
];

const MODULES = [
    { code: "M01", title: "İş Modeli ve Strateji" },
    { code: "M02", title: "Müşteri Keşfi ve Doğrulama" },
    { code: "M03", title: "B2B Satış Sistemi" },
    { code: "M04", title: "Dijital Pazarlama ve Büyüme" },
    { code: "M05", title: "Finans ve Nakit Akışı" },
    { code: "M06", title: "Hukuk, Sözleşmeler ve IP" },
    { code: "M07", title: "Ürün ve Hedef Yol Haritası" },
    { code: "M08", title: "Regülasyon ve Uygunluk" },
    { code: "M09", title: "Pitch Deck ve Yatırım" },
    { code: "M10", title: "Data Room Hazırlığı" },
    { code: "M11", title: "Operasyonel Ölçekleme" },
    { code: "M12", title: "Liderlik ve Ekip Yönetimi" },
];

export const AntsFireApplication = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalPages = 5; // Increased pages to accommodate more fields

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleArrayToggle = (name: 'tekmerClusters' | 'selectedModules', value: string) => {
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
                    programName: "ANTSFire",
                    fullName: formData.founderName,
                    email: formData.founderContact, // Sending contact info to standard fields for fallback
                    projectName: formData.companyName
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
            alert('Bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg focus:border-orange-500 focus:bg-white/10 p-3 text-white outline-none transition-all text-sm";
    const labelClass = "flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 mt-4";
    const sectionTitleClass = "text-2xl font-orbitron text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/10";

    if (isSubmitted) {
        return (
            <section className="py-24 bg-[#050510]">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-orange-500/30 p-12 rounded-2xl">
                        <Check className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                        <h2 className="font-orbitron font-bold text-3xl text-white mb-4">Başvurunuz Alındı!</h2>
                        <p className="text-gray-400 mb-6">ANTSFire Kuluçka Programı başvurunuz bize ulaştı. Değerlendirme sürecimiz başlamıştır.</p>
                        <button onClick={() => window.location.href = '/antsfire'} className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-all font-orbitron">
                            Program Sayfasına Dön
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-24 relative bg-[#050510] min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-900/10 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-400 font-bold">ANTSFIRE BAŞVURU</span>
                    </div>
                </motion.div>

                {/* Stepper */}
                <div className="flex justify-between mb-8 max-w-3xl mx-auto px-4">
                    {[1, 2, 3, 4, 5].map(step => (
                        <div key={step} className={`flex flex-col items-center gap-2 ${currentPage >= step ? 'text-orange-400' : 'text-gray-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${currentPage >= step ? 'border-orange-500 bg-orange-500/20' : 'border-gray-800 bg-gray-900'}`}>
                                {step}
                            </div>
                            <span className="text-[10px] font-mono hidden md:block uppercase tracking-widest">
                                {step === 1 && "Şirket"}
                                {step === 2 && "Ürün"}
                                {step === 3 && "Pazar"}
                                {step === 4 && "Finans"}
                                {step === 5 && "İhtiyaç"}
                            </span>
                        </div>
                    ))}
                </div>

                <motion.div
                    className="bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-2xl relative overflow-hidden min-h-[600px] flex flex-col"
                >
                    <div className="flex-grow">
                        <AnimatePresence mode="wait">
                            {/* PAGE 1: COMPANY & FOUNDER */}
                            {currentPage === 1 && (
                                <motion.div key="p1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <h3 className={sectionTitleClass}><Building2 className="text-orange-500" /> Şirket ve Kurucu Bilgileri</h3>

                                    <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10 mb-8">
                                        <label className={labelClass}>Şirketiniz Var Mı? *</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="hasCompany" value="Evet" checked={formData.hasCompany === "Evet"} onChange={handleChange} className="sr-only peer" />
                                                <div className="w-full p-3 text-center rounded-lg border border-white/10 text-gray-400 peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 transition-all text-sm font-bold">Evet</div>
                                            </label>
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="hasCompany" value="Hayır" checked={formData.hasCompany === "Hayır"} onChange={handleChange} className="sr-only peer" />
                                                <div className="w-full p-3 text-center rounded-lg border border-white/10 text-gray-400 peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 transition-all text-sm font-bold">Hayır</div>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.hasCompany === "Evet" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 mb-8">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>Firma Adı/Girişim Adı *</label>
                                                    <input required name="companyName" value={formData.companyName} onChange={handleChange} className={inputClass} placeholder="Resmi Ünvan" />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma Ünvanı</label>
                                                    <input name="companyTitle" value={formData.companyTitle} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma Kuruluş Tarihi *</label>
                                                    <input required type="date" name="foundationYear" value={formData.foundationYear} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma Mersis NO</label>
                                                    <input name="mersisNo" value={formData.mersisNo} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Ticaret Sicil No</label>
                                                    <input name="tradeRegistryNo" value={formData.tradeRegistryNo} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Ortakların Adı</label>
                                                    <input name="partnersNames" value={formData.partnersNames} onChange={handleChange} className={inputClass} placeholder="Ahmet Yılmaz, Ayşe Demir" />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma Web Sitesi</label>
                                                    <input type="url" name="website" value={formData.website} onChange={handleChange} className={inputClass} placeholder="https://" />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma E-Mail</label>
                                                    <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma Telefon</label>
                                                    <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma VKN. *</label>
                                                    <input required name="taxNumber" value={formData.taxNumber} onChange={handleChange} className={inputClass} placeholder="10 Haneli" />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Firma V.D. (Vergi Dairesi)</label>
                                                    <input name="taxOffice" value={formData.taxOffice} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Nace Kodu</label>
                                                    <input name="naceCode" value={formData.naceCode} onChange={handleChange} className={inputClass} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className={labelClass}>Firma Adresi</label>
                                                    <textarea name="companyAddress" rows={2} value={formData.companyAddress} onChange={handleChange} className={inputClass} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Sektör *</label>
                                            <select required name="sector" value={formData.sector} onChange={handleChange} className={inputClass}>
                                                <option className="bg-[#050510]" value="">Seçiniz...</option>
                                                <option className="bg-[#050510]" value="SaaS">SaaS</option>
                                                <option className="bg-[#050510]" value="Fintech">Fintech</option>
                                                <option className="bg-[#050510]" value="Healthtech">Healthtech</option>
                                                <option className="bg-[#050510]" value="Deeptech">Deeptech</option>
                                                <option className="bg-[#050510]" value="Agritech">Agritech</option>
                                                <option className="bg-[#050510]" value="Gaming">Gaming</option>
                                                <option className="bg-[#050510]" value="E-ticaret">E-ticaret</option>
                                                <option className="bg-[#050510]" value="Diğer">Diğer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Çalışan Sayısı *</label>
                                            <input required type="number" name="employeeCount" value={formData.employeeCount} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>TEKMER Küme (Çoklu Seçim) *</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 bg-white/5 p-3 rounded-lg border border-white/10">
                                            {TEKMER_CLUSTERS.map(c => (
                                                <label key={c} className="flex items-center gap-2 cursor-pointer hover:text-orange-400 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.tekmerClusters.includes(c)}
                                                        onChange={() => handleArrayToggle('tekmerClusters', c)}
                                                        className="accent-orange-500 w-4 h-4"
                                                    />
                                                    <span className="text-xs text-gray-300">{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h4 className="text-orange-400 font-bold mb-4 uppercase text-xs tracking-wider">TEKMER Ofis / Sözleşme Bilgileri</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>TEKMER Kabul Tarihi</label>
                                                <input type="date" name="tekmerAcceptanceDate" value={formData.tekmerAcceptanceDate} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Kira Kontrat Tarihi</label>
                                                <input type="date" name="rentContractDate" value={formData.rentContractDate} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Masa / Ofis No</label>
                                                <input type="text" name="deskOfficeNo" value={formData.deskOfficeNo} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Kira Tutarı</label>
                                                <input type="text" name="rentAmount" value={formData.rentAmount} onChange={handleChange} className={inputClass} placeholder="Örn: 5000 TL" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h4 className="text-orange-400 font-bold mb-4 uppercase text-xs tracking-wider">Yetkili Kişi Bilgileri</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Yetkili Kişi *</label>
                                                <input required name="founderName" value={formData.founderName} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>T.C. Kimlik No *</label>
                                                <input required name="tcNo" maxLength={11} value={formData.tcNo} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Doğum Tarihi *</label>
                                                <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Eğitim Durumu *</label>
                                                <select required name="educationStatus" value={formData.educationStatus} onChange={handleChange} className={inputClass}>
                                                    <option className="bg-[#050510]" value="">Seçiniz</option>
                                                    <option className="bg-[#050510]" value="Önlisans">Önlisans</option>
                                                    <option className="bg-[#050510]" value="Lisans">Lisans</option>
                                                    <option className="bg-[#050510]" value="Yüksek Lisans">Yüksek Lisans</option>
                                                    <option className="bg-[#050510]" value="Doktora">Doktora</option>
                                                    <option className="bg-[#050510]" value="Diğer">Diğer</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Telefon *</label>
                                                <input required type="tel" name="founderPhone" value={formData.founderPhone} onChange={handleChange} className={inputClass} placeholder="+90 ..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>E-Mail *</label>
                                                <input required type="email" name="founderContact" value={formData.founderContact} onChange={handleChange} className={inputClass} placeholder="mail@ornek.com" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Rol *</label>
                                                <select required name="founderRole" value={formData.founderRole} onChange={handleChange} className={inputClass}>
                                                    <option className="bg-[#050510]" value="">Seçiniz</option>
                                                    <option className="bg-[#050510]" value="CEO">CEO</option>
                                                    <option className="bg-[#050510]" value="CTO">CTO</option>
                                                    <option className="bg-[#050510]" value="COO">COO</option>
                                                    <option className="bg-[#050510]" value="Kurucu Ortak">Kurucu Ortak</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Haftalık Zaman *</label>
                                                <select required name="weeklyHours" value={formData.weeklyHours} onChange={handleChange} className={inputClass}>
                                                    <option className="bg-[#050510]" value="">Seçiniz</option>
                                                    <option className="bg-[#050510]" value="10-20 Saat">10-20 Saat</option>
                                                    <option className="bg-[#050510]" value="20-30 Saat">20-30 Saat</option>
                                                    <option className="bg-[#050510]" value="30+ Saat">30+ Saat (Tam Zamanlı)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PAGE 2: PRODUCT & R&D */}
                            {currentPage === 2 && (
                                <motion.div key="p2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <h3 className={sectionTitleClass}><Rocket className="text-orange-500" /> Ürün ve Ar-Ge</h3>

                                    <div>
                                        <label className={labelClass}>Ürün Kısa Tanımı (150-300 karakter) *</label>
                                        <textarea required name="productShortDesc" value={formData.productShortDesc} onChange={handleChange} rows={2} maxLength={300} className={inputClass} placeholder="Ürününüzü bir asansör konuşması kıvamında anlatın." />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Problem Tanımı *</label>
                                            <textarea required name="problemDefinition" value={formData.problemDefinition} onChange={handleChange} rows={3} className={inputClass} placeholder="Hangi sorunu çözüyorsunuz?" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Çözümün Farklılığı *</label>
                                            <textarea required name="solutionDifference" value={formData.solutionDifference} onChange={handleChange} rows={3} className={inputClass} placeholder="Rakiplerden ve mevcut çözümlerden farkınız ne?" />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>TRL Seviyesi *</label>
                                            <select required name="trlLevel" value={formData.trlLevel} onChange={handleChange} className={inputClass}>
                                                <option className="bg-[#050510]" value="">Seçiniz...</option>
                                                <option className="bg-[#050510]" value="1-3">TRL 1-3 (Fikir/Konsept)</option>
                                                <option className="bg-[#050510]" value="4-5">TRL 4-5 (Prototip)</option>
                                                <option className="bg-[#050510]" value="6-7">TRL 6-7 (MVP/Demo)</option>
                                                <option className="bg-[#050510]" value="8-9">TRL 8-9 (Ticarileşme)</option>
                                            </select>
                                            <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                                                <span className="text-orange-400">TRL:</span> Teknoloji Hazırlık Seviyesi (Technology Readiness Level)
                                            </p>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Demo / MVP Linki</label>
                                            <input type="url" name="demoLink" value={formData.demoLink} onChange={handleChange} className={inputClass} placeholder="https://" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Ar-Ge Projesi Özeti *</label>
                                        <textarea required name="randdProjectSummary" value={formData.randdProjectSummary} onChange={handleChange} rows={4} className={inputClass} placeholder="Projenin Ar-Ge niteliği, yöntem, beklenen çıktılar ve takvim..." />
                                    </div>
                                </motion.div>
                            )}

                            {/* PAGE 3: MARKET & TRACTION */}
                            {currentPage === 3 && (
                                <motion.div key="p3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <h3 className={sectionTitleClass}><PieChart className="text-orange-500" /> Pazar ve Rekabet</h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Hedef Müşteri (ICP) *</label>
                                            <input required name="targetCustomer" value={formData.targetCustomer} onChange={handleChange} className={inputClass} placeholder="İdeal müşteri profiliniz kim?" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Pazar Büyüklüğü *</label>
                                            <input required name="marketSize" value={formData.marketSize} onChange={handleChange} className={inputClass} placeholder="TAM, SAM, SOM değerlerini giriniz" />
                                            <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                                                <span className="text-orange-400">TAM:</span> Toplam Pazar | <span className="text-orange-400">SAM:</span> Erişilebilir Pazar | <span className="text-orange-400">SOM:</span> Hedef Pazar
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Rakipler *</label>
                                        <textarea required name="competitors" value={formData.competitors} onChange={handleChange} rows={2} className={inputClass} placeholder="Başlıca 3-5 rakibiniz" />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Pazara Giriş Stratejisi (GTM) *</label>
                                        <textarea required name="gtmPlan" value={formData.gtmPlan} onChange={handleChange} rows={3} className={inputClass} placeholder="Satış kanalları, pazarlama, dağıtım..." />
                                    </div>
                                </motion.div>
                            )}

                            {/* PAGE 4: FINANCE & FILES */}
                            {currentPage === 4 && (
                                <motion.div key="p4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <h3 className={sectionTitleClass}><DollarSign className="text-orange-500" /> Finans ve Dosyalar</h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Pilot / LOI Var Mı? *</label>
                                            <select required name="hasPilot" value={formData.hasPilot} onChange={handleChange} className={inputClass}>
                                                <option className="bg-[#050510]" value="">Seçiniz</option>
                                                <option className="bg-[#050510]" value="Yok">Yok</option>
                                                <option className="bg-[#050510]" value="Var">Var (Pilot/LOI)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Aylık Gelir Durumu *</label>
                                            <select required name="revenueStatus" value={formData.revenueStatus} onChange={handleChange} className={inputClass}>
                                                <option className="bg-[#050510]" value="">Seçiniz</option>
                                                <option className="bg-[#050510]" value="0">0 (Gelir Yok)</option>
                                                <option className="bg-[#050510]" value="1-50k">1 TL - 50.000 TL</option>
                                                <option className="bg-[#050510]" value="50k+">50.000 TL +</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Runway (Kasa Ömrü) *</label>
                                            <select required name="runway" value={formData.runway} onChange={handleChange} className={inputClass}>
                                                <option className="bg-[#050510]" value="">Seçiniz</option>
                                                <option className="bg-[#050510]" value="0-3 Ay">0-3 Ay</option>
                                                <option className="bg-[#050510]" value="3-6 Ay">3-6 Ay</option>
                                                <option className="bg-[#050510]" value="6-12 Ay">6-12 Ay</option>
                                                <option className="bg-[#050510]" value="12+ Ay">12+ Ay</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Önceki Yatırım/Hibe</label>
                                            <input name="investmentHistory" value={formData.investmentHistory} onChange={handleChange} className={inputClass} placeholder="TÜBİTAK vb." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Son 12 Ay Finansal Özet</label>
                                        <textarea name="financialSummary" value={formData.financialSummary} onChange={handleChange} rows={2} className={inputClass} placeholder="Tahmini gelir/gider özeti..." />
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h4 className="text-orange-400 font-bold mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Upload className="w-4 h-4" /> Dosyalar (Link Olarak)</h4>
                                        <div className="p-4 bg-orange-900/10 border border-orange-500/20 rounded-lg mb-4 text-xs text-orange-200">
                                            Dosyalarınızı Google Drive, Dropbox vb. bir bulut servisine yükleyip <strong>herkese açık</strong> linklerini buraya yapıştırınız.
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Pitch Deck Linki (PDF) *</label>
                                                <input required type="url" name="pitchDeckLink" value={formData.pitchDeckLink} onChange={handleChange} className={inputClass} placeholder="https://..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Kurucu CV'leri Linki *</label>
                                                <input required type="url" name="founderCvLink" value={formData.founderCvLink} onChange={handleChange} className={inputClass} placeholder="https://..." />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PAGE 5: NEEDS & GOALS */}
                            {currentPage === 5 && (
                                <motion.div key="p5" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <h3 className={sectionTitleClass}><Target className="text-orange-500" /> İhtiyaç Analizi</h3>

                                    <div>
                                        <label className={labelClass}>En Kritik 3 Darboğazınız *</label>
                                        <textarea required name="bottlenecks" value={formData.bottlenecks} onChange={handleChange} rows={3} className={inputClass} placeholder="1. ...&#10;2. ...&#10;3. ..." />
                                    </div>

                                    <div>
                                        <label className={labelClass}>12 Ay Sonunda 3 Ana Hedef *</label>
                                        <textarea required name="goals" value={formData.goals} onChange={handleChange} rows={3} className={inputClass} placeholder="Ölçülebilir hedefler giriniz." />
                                    </div>

                                    <div className="mt-4">
                                        <label className={labelClass}>İhtiyaç Duyulan Modüller (Çoklu Seçim) *</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {MODULES.map(mod => (
                                                <label key={mod.code} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 border border-transparent hover:border-white/10 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.selectedModules.includes(mod.code)}
                                                        onChange={() => handleArrayToggle('selectedModules', mod.code)}
                                                        className="w-4 h-4 mt-0.5 accent-orange-500"
                                                    />
                                                    <div>
                                                        <span className="text-xs font-bold text-orange-400 block">{mod.code}</span>
                                                        <span className="text-sm text-gray-300">{mod.title}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-white/10 space-y-4">
                                        <label className="flex gap-3 items-start cursor-pointer group">
                                            <input required type="checkbox" name="privacyConsent" checked={formData.privacyConsent} onChange={handleChange} className="mt-1 accent-orange-500" />
                                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                KVKK Aydınlatma Metni'ni okudum, kişisel verilerimin işlenmesini, gizlilik ilkelerini ve <a href="#" className="underline text-orange-400">Katılım Şartları</a>'nı kabul ediyorum.
                                            </span>
                                        </label>
                                        <label className="flex gap-3 items-start cursor-pointer group">
                                            <input required type="checkbox" name="termsConsent" checked={formData.termsConsent} onChange={handleChange} className="mt-1 accent-orange-500" />
                                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                Çıkar çelişkisi bulunmadığını ve paylaştığım bilgilerin doğruluğunu beyan ederim.
                                            </span>
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
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
                                disabled={isSubmitting || !formData.privacyConsent || !formData.termsConsent}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                {isSubmitting ? "Gönderiliyor..." : "Başvuruyu Tamamla"} <Send className="w-4 h-4" />
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
                </motion.div>
            </div>
        </section>
    );
}
