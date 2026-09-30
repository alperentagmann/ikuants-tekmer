"use client";
import React, { useState, useEffect } from 'react';
import {
    Building2, Users, Award, Briefcase, Handshake,
    HelpCircle, Scale, Plus, Edit2, Trash2, Save,
    Check, X, Search, ArrowUpDown, Eye, ExternalLink,
    Upload, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';

type TabType = 'genel' | 'kurullar' | 'ekip' | 'partnerler' | 'kullanim-alanlari' | 'hizmetlerimiz' | 'mevzuat' | 'sss';

export default function HakkimizdaAdminPage() {
    const [activeTab, setActiveTab] = useState<TabType>('genel');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // -------------------------------------------------------------
    // TAB 1: GENEL METİNLER
    // -------------------------------------------------------------
    const [aboutContent, setAboutContent] = useState<any>({
        badgeText: 'HAKKIMIZDA',
        title: '',
        subtitle: '',
        description: '',
        tekmerNedirTitle: '',
        tekmerNedirText: '',
        visionTitle: '',
        visionText: '',
        missionTitle: '',
        missionText: '',
        ctaTitle: '',
        ctaText: '',
        ctaButtonLabel: '',
        ctaButtonLink: '',
    });

    const loadAboutContent = async () => {
        try {
            const res = await fetch('/api/admin/about');
            const data = await res.json();
            if (data.success && data.content) {
                setAboutContent(data.content);
            }
        } catch {
            showToast('Genel metinler yüklenirken hata oluştu', 'error');
        }
    };

    const saveAboutContent = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/about', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aboutContent),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Hakkımızda metinleri başarıyla kaydedildi.');
            } else {
                showToast(data.error || 'Kaydetme başarısız', 'error');
            }
        } catch {
            showToast('Kaydetme sırasında bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // TAB 2: KURULLAR (YÖNETİM, DEĞERLENDİRME, DANIŞMA)
    // -------------------------------------------------------------
    const [boardMembers, setBoardMembers] = useState<any[]>([]);
    const [boardModalOpen, setBoardModalOpen] = useState(false);
    const [editingBoardMember, setEditingBoardMember] = useState<any | null>(null);

    const loadBoardMembers = async () => {
        try {
            const res = await fetch('/api/admin/board-members');
            const data = await res.json();
            if (data.success) setBoardMembers(data.members || []);
        } catch {
            showToast('Kurul üyeleri yüklenemedi', 'error');
        }
    };

    const saveBoardMember = async (memberData: any) => {
        try {
            const url = editingBoardMember?.id
                ? `/api/admin/board-members/${editingBoardMember.id}`
                : '/api/admin/board-members';
            const method = editingBoardMember?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingBoardMember ? 'Kurul üyesi güncellendi' : 'Yeni kurul üyesi eklendi');
                setBoardModalOpen(false);
                setEditingBoardMember(null);
                loadBoardMembers();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deleteBoardMember = async (id: string) => {
        if (!confirm('Bu kurul üyesini silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/board-members/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Kurul üyesi silindi');
                loadBoardMembers();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // -------------------------------------------------------------
    // TAB 3: EKİP ÜYELERİ
    // -------------------------------------------------------------
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [editingTeamMember, setEditingTeamMember] = useState<any | null>(null);

    const loadTeamMembers = async () => {
        try {
            const res = await fetch('/api/admin/team-members');
            const data = await res.json();
            if (data.success) setTeamMembers(data.team || []);
        } catch {
            showToast('Ekip üyeleri yüklenemedi', 'error');
        }
    };

    const saveTeamMember = async (memberData: any) => {
        try {
            const url = editingTeamMember?.id
                ? `/api/admin/team-members/${editingTeamMember.id}`
                : '/api/admin/team-members';
            const method = editingTeamMember?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingTeamMember ? 'Ekip üyesi güncellendi' : 'Yeni ekip üyesi eklendi');
                setTeamModalOpen(false);
                setEditingTeamMember(null);
                loadTeamMembers();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deleteTeamMember = async (id: string) => {
        if (!confirm('Bu ekip üyesini silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/team-members/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Ekip üyesi silindi');
                loadTeamMembers();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // -------------------------------------------------------------
    // TAB 4: PARTNERLER / İŞ BİRLİKLERİ
    // -------------------------------------------------------------
    const [partners, setPartners] = useState<any[]>([]);
    const [partnerModalOpen, setPartnerModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any | null>(null);

    const loadPartners = async () => {
        try {
            const res = await fetch('/api/admin/partners');
            const data = await res.json();
            if (data.success) setPartners(data.partners || []);
        } catch {
            showToast('Partnerler yüklenemedi', 'error');
        }
    };

    const savePartner = async (partnerData: any) => {
        try {
            const url = editingPartner?.id
                ? `/api/admin/partners/${editingPartner.id}`
                : '/api/admin/partners';
            const method = editingPartner?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partnerData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingPartner ? 'Partner güncellendi' : 'Yeni partner eklendi');
                setPartnerModalOpen(false);
                setEditingPartner(null);
                loadPartners();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deletePartner = async (id: string) => {
        if (!confirm('Bu partneri silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Partner silindi');
                loadPartners();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // -------------------------------------------------------------
    // TAB 5: KULLANIM ALANLARI / TESİSLER
    // -------------------------------------------------------------
    const [facilities, setFacilities] = useState<any[]>([]);
    const [facilityModalOpen, setFacilityModalOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<any | null>(null);

    const loadFacilities = async () => {
        try {
            const res = await fetch('/api/admin/facilities');
            const data = await res.json();
            if (data.success) setFacilities(data.facilities || []);
        } catch {
            showToast('Tesisler yüklenemedi', 'error');
        }
    };

    const saveFacility = async (facilityData: any) => {
        try {
            const url = editingFacility?.id
                ? `/api/admin/facilities/${editingFacility.id}`
                : '/api/admin/facilities';
            const method = editingFacility?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facilityData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingFacility ? 'Kullanım alanı güncellendi' : 'Yeni kullanım alanı eklendi');
                setFacilityModalOpen(false);
                setEditingFacility(null);
                loadFacilities();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deleteFacility = async (id: string) => {
        if (!confirm('Bu kullanım alanını silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/facilities/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Kullanım alanı silindi');
                loadFacilities();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // -------------------------------------------------------------
    // TAB 6: HİZMETLERİMİZ
    // -------------------------------------------------------------
    const [services, setServices] = useState<any[]>([]);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);

    const loadServices = async () => {
        try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();
            if (data.success) setServices(data.services || []);
        } catch {
            showToast('Hizmetler yüklenemedi', 'error');
        }
    };

    const saveService = async (serviceData: any) => {
        try {
            const url = editingService?.id
                ? `/api/admin/services/${editingService.id}`
                : '/api/admin/services';
            const method = editingService?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingService ? 'Hizmet güncellendi' : 'Yeni hizmet eklendi');
                setServiceModalOpen(false);
                setEditingService(null);
                loadServices();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deleteService = async (id: string) => {
        if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Hizmet silindi');
                loadServices();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // -------------------------------------------------------------
    // TAB 7: MEVZUAT
    // -------------------------------------------------------------
    const [legislations, setLegislations] = useState<any[]>([]);
    const [legislationModalOpen, setLegislationModalOpen] = useState(false);
    const [editingLegislation, setEditingLegislation] = useState<any | null>(null);

    const loadLegislations = async () => {
        try {
            const res = await fetch('/api/admin/legislations');
            const data = await res.json();
            if (data.success) setLegislations(data.legislations || []);
        } catch {
            showToast('Mevzuat belgeleri yüklenemedi', 'error');
        }
    };

    const saveLegislation = async (legData: any) => {
        try {
            const url = editingLegislation?.id
                ? `/api/admin/legislations/${editingLegislation.id}`
                : '/api/admin/legislations';
            const method = editingLegislation?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(legData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingLegislation ? 'Mevzuat belgesi güncellendi' : 'Yeni mevzuat belgesi eklendi');
                setLegislationModalOpen(false);
                setEditingLegislation(null);
                loadLegislations();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deleteLegislation = async (id: string) => {
        if (!confirm('Bu mevzuat belgesini silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/legislations/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Mevzuat belgesi silindi');
                loadLegislations();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // -------------------------------------------------------------
    // TAB 8: SSS (FAQ)
    // -------------------------------------------------------------
    const [faqs, setFaqs] = useState<any[]>([]);
    const [faqModalOpen, setFaqModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<any | null>(null);

    const loadFaqs = async () => {
        try {
            const res = await fetch('/api/admin/faqs');
            const data = await res.json();
            if (data.success) setFaqs(data.faqs || []);
        } catch {
            showToast('SSS soruları yüklenemedi', 'error');
        }
    };

    const saveFaq = async (faqData: any) => {
        try {
            const url = editingFaq?.id
                ? `/api/admin/faqs/${editingFaq.id}`
                : '/api/admin/faqs';
            const method = editingFaq?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(faqData),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingFaq ? 'Soru güncellendi' : 'Yeni soru eklendi');
                setFaqModalOpen(false);
                setEditingFaq(null);
                loadFaqs();
            } else {
                showToast(data.error || 'İşlem başarısız', 'error');
            }
        } catch {
            showToast('Hata oluştu', 'error');
        }
    };

    const deleteFaq = async (id: string) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Soru silindi');
                loadFaqs();
            }
        } catch {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    // Initial load
    useEffect(() => {
        loadAboutContent();
        loadBoardMembers();
        loadTeamMembers();
        loadPartners();
        loadFacilities();
        loadServices();
        loadLegislations();
        loadFaqs();
    }, []);

    const tabs = [
        { id: 'genel' as TabType, label: 'Genel Metinler', icon: Building2, count: null },
        { id: 'kurullar' as TabType, label: 'Kurul Üyeleri', icon: Award, count: boardMembers.length },
        { id: 'ekip' as TabType, label: 'Ekip Üyeleri', icon: Users, count: teamMembers.length },
        { id: 'partnerler' as TabType, label: 'İş Birlikleri', icon: Handshake, count: partners.length },
        { id: 'kullanim-alanlari' as TabType, label: 'Kullanım Alanları', icon: Briefcase, count: facilities.length },
        { id: 'hizmetlerimiz' as TabType, label: 'Hizmetlerimiz', icon: Sparkles, count: services.length },
        { id: 'mevzuat' as TabType, label: 'Mevzuat', icon: Scale, count: legislations.length },
        { id: 'sss' as TabType, label: 'SSS (FAQ)', icon: HelpCircle, count: faqs.length },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0d1a] border border-white/10 p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold mb-1">
                        <Building2 className="w-4 h-4" />
                        <span>MERKEZİ CMS YÖNETİMİ</span>
                    </div>
                    <h1 className="text-2xl font-bold font-orbitron text-white">
                        Hakkımızda & Kurumsal İçerik Stüdyosu
                    </h1>
                    <p className="text-sm text-gray-400">
                        Public sitedeki tüm kurumsal metinleri, kurulları, ekibi, partnerleri, hizmetleri ve mevzuatları buradan yönetin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/hakkimizda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-gray-300 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Public Sayfayı Gör
                    </a>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xl transition-all ${
                    toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                }`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">Kapat</button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-[#0e0e1a] border border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.count !== null && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab 1: GENEL METİNLER */}
            {activeTab === 'genel' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h2 className="text-lg font-bold text-white font-orbitron">Genel Tanıtım & Kurumsal Metinler</h2>
                        <button
                            onClick={saveAboutContent}
                            disabled={loading}
                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Badge / Üst Etiket</label>
                                <input
                                    type="text"
                                    value={aboutContent.badgeText || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, badgeText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Ana Başlık</label>
                                <input
                                    type="text"
                                    value={aboutContent.title || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Alt Başlık</label>
                                <input
                                    type="text"
                                    value={aboutContent.subtitle || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, subtitle: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Genel Tanıtım Paragrafı</label>
                                <textarea
                                    rows={4}
                                    value={aboutContent.description || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">TEKMER Nedir? (Başlık & Açıklama)</label>
                                <textarea
                                    rows={3}
                                    value={aboutContent.tekmerNedirText || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, tekmerNedirText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Vizyon Metni</label>
                                <textarea
                                    rows={3}
                                    value={aboutContent.visionText || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, visionText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Misyon Metni</label>
                                <textarea
                                    rows={3}
                                    value={aboutContent.missionText || ''}
                                    onChange={e => setAboutContent({ ...aboutContent, missionText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: KURUL ÜYELERİ */}
            {activeTab === 'kurullar' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">Kurul Üyeleri Yönetimi</h2>
                            <p className="text-xs text-gray-400">Yönetim Kurulu, Değerlendirme Kurulu ve Danışma Kurulu üyeleri</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingBoardMember({
                                    fullName: '',
                                    title: '',
                                    organization: 'İKÜANTS TEKMER',
                                    duty: 'Üye',
                                    boardType: 'YONETIM',
                                    imageUrl: '',
                                    sortOrder: boardMembers.length + 1,
                                    isActive: true,
                                    isPublished: true,
                                });
                                setBoardModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Kurul Üyesi Ekle
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boardMembers.map((member) => (
                            <div key={member.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                                <div className="flex items-start gap-3 mb-3">
                                    {member.imageUrl ? (
                                        <img src={member.imageUrl} alt={member.fullName} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary">
                                            {member.fullName.slice(0, 2)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-white truncate">{member.fullName}</h3>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                                                {member.boardType}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{member.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${member.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {member.isActive ? 'Aktif / Yayında' : 'Pasif'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingBoardMember(member);
                                                setBoardModalOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteBoardMember(member.id)}
                                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 3: EKİP ÜYELERİ */}
            {activeTab === 'ekip' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">Ekip Üyeleri Yönetimi</h2>
                            <p className="text-xs text-gray-400">TEKMER idari ve teknik kadrosu</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingTeamMember({
                                    fullName: '',
                                    title: '',
                                    department: 'YÖNETİM',
                                    bio: '',
                                    email: '',
                                    phone: '',
                                    linkedin: '',
                                    imageUrl: '',
                                    sortOrder: teamMembers.length + 1,
                                    isActive: true,
                                });
                                setTeamModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Ekip Üyesi Ekle
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamMembers.map((member) => (
                            <div key={member.id} className="bg-black/30 border border-white/10 rounded-xl p-5 flex items-start gap-4">
                                {member.imageUrl ? (
                                    <img src={member.imageUrl} alt={member.fullName} className="w-16 h-16 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-xl text-primary">
                                        {member.fullName.slice(0, 2)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-bold text-white">{member.fullName}</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingTeamMember(member);
                                                    setTeamModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteTeamMember(member.id)}
                                                className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-primary font-medium mt-0.5">{member.title}</p>
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{member.bio}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <span>{member.email}</span>
                                        <span>{member.phone}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 4: İŞ BİRLİKLERİ / PARTNERLER */}
            {activeTab === 'partnerler' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">İş Birlikleri & Çözüm Ortakları</h2>
                            <p className="text-xs text-gray-400">Stratejik partnerler, logolar ve iş birliği kapsamları</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingPartner({
                                    name: '',
                                    logoUrl: '',
                                    description: '',
                                    websiteUrl: '',
                                    linkedinUrl: '',
                                    partnerGroup: 'STAKEHOLDER',
                                    sortOrder: partners.length + 1,
                                    isActive: true,
                                });
                                setPartnerModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Partner Ekle
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {partners.map((partner) => (
                            <div key={partner.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                    <div className="h-16 bg-white rounded-lg flex items-center justify-center p-2 mb-3">
                                        <img src={partner.logoUrl} alt={partner.name} className="max-h-full object-contain" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1">{partner.name}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-3 mb-3">{partner.description}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <span className="text-[10px] text-gray-400 font-mono">{partner.partnerGroup}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingPartner(partner);
                                                setPartnerModalOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deletePartner(partner.id)}
                                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 5: KULLANIM ALANLARI */}
            {activeTab === 'kullanim-alanlari' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">Kullanım Alanları & Tesisler</h2>
                            <p className="text-xs text-gray-400">Stüdyolar, ortak çalışma alanları ve teknik donanımlar</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingFacility({
                                    title: '',
                                    description: '',
                                    facilityType: 'STUDIO',
                                    featuresJson: '[]',
                                    iconName: 'Building2',
                                    sortOrder: facilities.length + 1,
                                    isActive: true,
                                });
                                setFacilityModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Alan / Stüdyo Ekle
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {facilities.map((fac) => (
                            <div key={fac.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-primary font-mono">{fac.facilityType}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${fac.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {fac.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2">{fac.title}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-3 mb-3">{fac.description}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                                    <button
                                        onClick={() => {
                                            setEditingFacility(fac);
                                            setFacilityModalOpen(true);
                                        }}
                                        className="p-1.5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteFacility(fac.id)}
                                        className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 6: HİZMETLERİMİZ */}
            {activeTab === 'hizmetlerimiz' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">Hizmetlerimiz Yönetimi</h2>
                            <p className="text-xs text-gray-400">Girişimcilere sunulan kurumsal destek ve hizmetler</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingService({
                                    title: '',
                                    description: '',
                                    detailsJson: '[]',
                                    highlight: '',
                                    iconName: 'Building2',
                                    colorGradient: 'from-purple-500 to-pink-500',
                                    sortOrder: services.length + 1,
                                    isActive: true,
                                });
                                setServiceModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Hizmet Ekle
                        </button>
                    </div>

                    <div className="space-y-3">
                        {services.map((service) => (
                            <div key={service.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white">{service.title}</h3>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{service.description}</p>
                                    {service.highlight && (
                                        <span className="inline-block text-[10px] text-primary mt-1">{service.highlight}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingService(service);
                                            setServiceModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteService(service.id)}
                                        className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 7: MEVZUAT */}
            {activeTab === 'mevzuat' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">Mevzuat & Yasal Belgeler</h2>
                            <p className="text-xs text-gray-400">Kanunlar, yönetmelikler ve resmi yönergeler</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingLegislation({
                                    title: '',
                                    description: '',
                                    category: 'YONETMELIK',
                                    externalUrl: '',
                                    fileUrl: '',
                                    sortOrder: legislations.length + 1,
                                    isActive: true,
                                });
                                setLegislationModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Mevzuat Ekle
                        </button>
                    </div>

                    <div className="space-y-3">
                        {legislations.map((leg) => (
                            <div key={leg.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Scale className="w-5 h-5 text-primary" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-white">{leg.title}</h3>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                                                {leg.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{leg.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingLegislation(leg);
                                            setLegislationModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteLegislation(leg.id)}
                                        className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 8: SSS (FAQ) */}
            {activeTab === 'sss' && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white font-orbitron">Sıkça Sorulan Sorular (SSS)</h2>
                            <p className="text-xs text-gray-400">Kategori bazlı sorular ve public accordion cevapları</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingFaq({
                                    question: '',
                                    answer: '',
                                    category: 'GENEL',
                                    sortOrder: faqs.length + 1,
                                    isActive: true,
                                });
                                setFaqModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Soru Ekle
                        </button>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <div key={faq.id} className="bg-black/30 border border-white/10 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                                                {faq.category}
                                            </span>
                                            <h3 className="text-sm font-bold text-white">{faq.question}</h3>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">{faq.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingFaq(faq);
                                                setFaqModalOpen(true);
                                            }}
                                            className="p-2 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteFaq(faq.id)}
                                            className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL: Kurul Üyesi Ekle / Düzenle */}
            {boardModalOpen && editingBoardMember && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingBoardMember.id ? 'Kurul Üyesini Düzenle' : 'Yeni Kurul Üyesi Ekle'}
                            </h3>
                            <button onClick={() => setBoardModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Kurul Türü</label>
                                <select
                                    value={editingBoardMember.boardType || 'YONETIM'}
                                    onChange={e => setEditingBoardMember({ ...editingBoardMember, boardType: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                >
                                    <option value="YONETIM">Yönetim Kurulu</option>
                                    <option value="DEGERLENDIRME">Değerlendirme Kurulu</option>
                                    <option value="DANISMA">Danışma Kurulu</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    value={editingBoardMember.fullName || ''}
                                    onChange={e => setEditingBoardMember({ ...editingBoardMember, fullName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Unvan & Açıklama</label>
                                <input
                                    type="text"
                                    value={editingBoardMember.title || ''}
                                    onChange={e => setEditingBoardMember({ ...editingBoardMember, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Kurum / Organizasyon</label>
                                <input
                                    type="text"
                                    value={editingBoardMember.organization || ''}
                                    onChange={e => setEditingBoardMember({ ...editingBoardMember, organization: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Fotoğraf URL</label>
                                <input
                                    type="text"
                                    value={editingBoardMember.imageUrl || ''}
                                    onChange={e => setEditingBoardMember({ ...editingBoardMember, imageUrl: e.target.value })}
                                    placeholder="/images/ornek.jpg"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingBoardMember.isActive !== false}
                                        onChange={e => setEditingBoardMember({ ...editingBoardMember, isActive: e.target.checked })}
                                        className="rounded border-white/20"
                                    />
                                    Aktif ve Public Sayfada Göster
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setBoardModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => saveBoardMember(editingBoardMember)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Ekip Üyesi Ekle / Düzenle */}
            {teamModalOpen && editingTeamMember && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingTeamMember.id ? 'Ekip Üyesini Düzenle' : 'Yeni Ekip Üyesi Ekle'}
                            </h3>
                            <button onClick={() => setTeamModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    value={editingTeamMember.fullName || ''}
                                    onChange={e => setEditingTeamMember({ ...editingTeamMember, fullName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Pozisyon / Görev</label>
                                <input
                                    type="text"
                                    value={editingTeamMember.title || ''}
                                    onChange={e => setEditingTeamMember({ ...editingTeamMember, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Kısa Biyografi</label>
                                <textarea
                                    rows={3}
                                    value={editingTeamMember.bio || ''}
                                    onChange={e => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">E-Posta</label>
                                    <input
                                        type="email"
                                        value={editingTeamMember.email || ''}
                                        onChange={e => setEditingTeamMember({ ...editingTeamMember, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        value={editingTeamMember.phone || ''}
                                        onChange={e => setEditingTeamMember({ ...editingTeamMember, phone: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">LinkedIn Profili</label>
                                <input
                                    type="text"
                                    value={editingTeamMember.linkedin || ''}
                                    onChange={e => setEditingTeamMember({ ...editingTeamMember, linkedin: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Fotoğraf URL</label>
                                <input
                                    type="text"
                                    value={editingTeamMember.imageUrl || ''}
                                    onChange={e => setEditingTeamMember({ ...editingTeamMember, imageUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setTeamModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => saveTeamMember(editingTeamMember)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Partner Ekle / Düzenle */}
            {partnerModalOpen && editingPartner && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingPartner.id ? 'Partneri Düzenle' : 'Yeni Partner Ekle'}
                            </h3>
                            <button onClick={() => setPartnerModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Firma / Kurum Adı</label>
                                <input
                                    type="text"
                                    value={editingPartner.name || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Logo URL</label>
                                <input
                                    type="text"
                                    value={editingPartner.logoUrl || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, logoUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">İş Birliği Açıklaması</label>
                                <textarea
                                    rows={3}
                                    value={editingPartner.description || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Web Sitesi</label>
                                <input
                                    type="text"
                                    value={editingPartner.websiteUrl || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, websiteUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">LinkedIn Profili</label>
                                <input
                                    type="text"
                                    value={editingPartner.linkedinUrl || ''}
                                    onChange={e => setEditingPartner({ ...editingPartner, linkedinUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setPartnerModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => savePartner(editingPartner)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Soru Ekle / Düzenle (FAQ) */}
            {faqModalOpen && editingFaq && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingFaq.id ? 'Soruyu Düzenle' : 'Yeni SSS Ekle'}
                            </h3>
                            <button onClick={() => setFaqModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Kategori</label>
                                <input
                                    type="text"
                                    value={editingFaq.category || 'GENEL'}
                                    onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Soru</label>
                                <input
                                    type="text"
                                    value={editingFaq.question || ''}
                                    onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Cevap</label>
                                <textarea
                                    rows={4}
                                    value={editingFaq.answer || ''}
                                    onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setFaqModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => saveFaq(editingFaq)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Kullanım Alanı Ekle / Düzenle */}
            {facilityModalOpen && editingFacility && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingFacility.id ? 'Kullanım Alanını Düzenle' : 'Yeni Kullanım Alanı Ekle'}
                            </h3>
                            <button onClick={() => setFacilityModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Alan Türü</label>
                                <select
                                    value={editingFacility.facilityType || 'STUDIO'}
                                    onChange={e => setEditingFacility({ ...editingFacility, facilityType: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                >
                                    <option value="STUDIO">Stüdyo</option>
                                    <option value="WORK_AREA">Çalışma Alanı</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Başlık</label>
                                <input
                                    type="text"
                                    value={editingFacility.title || ''}
                                    onChange={e => setEditingFacility({ ...editingFacility, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Açıklama</label>
                                <textarea
                                    rows={3}
                                    value={editingFacility.description || ''}
                                    onChange={e => setEditingFacility({ ...editingFacility, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setFacilityModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => saveFacility(editingFacility)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Hizmet Ekle / Düzenle */}
            {serviceModalOpen && editingService && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingService.id ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
                            </h3>
                            <button onClick={() => setServiceModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Hizmet Başlığı</label>
                                <input
                                    type="text"
                                    value={editingService.title || ''}
                                    onChange={e => setEditingService({ ...editingService, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Kısa Açıklama</label>
                                <textarea
                                    rows={2}
                                    value={editingService.description || ''}
                                    onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Vurgu / Rozet Metni</label>
                                <input
                                    type="text"
                                    value={editingService.highlight || ''}
                                    onChange={e => setEditingService({ ...editingService, highlight: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setServiceModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => saveService(editingService)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Mevzuat Ekle / Düzenle */}
            {legislationModalOpen && editingLegislation && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121222] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingLegislation.id ? 'Mevzuatı Düzenle' : 'Yeni Mevzuat Belgesi Ekle'}
                            </h3>
                            <button onClick={() => setLegislationModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Kategori</label>
                                <select
                                    value={editingLegislation.category || 'YONETMELIK'}
                                    onChange={e => setEditingLegislation({ ...editingLegislation, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                >
                                    <option value="KANUN">Kanun</option>
                                    <option value="YONETMELIK">Yönetmelik</option>
                                    <option value="KARARNAME">Kararname</option>
                                    <option value="TEBLIG">Tebliğ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Mevzuat Başlığı</label>
                                <input
                                    type="text"
                                    value={editingLegislation.title || ''}
                                    onChange={e => setEditingLegislation({ ...editingLegislation, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Açıklama</label>
                                <textarea
                                    rows={2}
                                    value={editingLegislation.description || ''}
                                    onChange={e => setEditingLegislation({ ...editingLegislation, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Belge Linki (PDF / Resmi Gazete URL)</label>
                                <input
                                    type="text"
                                    value={editingLegislation.externalUrl || ''}
                                    onChange={e => setEditingLegislation({ ...editingLegislation, externalUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setLegislationModalOpen(false)}
                                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-xs hover:bg-white/10"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => saveLegislation(editingLegislation)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
