"use client";
import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Mail, Phone, Building2, Linkedin,
    UserCheck, Rocket, GraduationCap, Briefcase, Filter, Trash2,
    Shield, CheckCircle2, AlertCircle, X, ExternalLink, UserPlus, Building
} from 'lucide-react';

export default function UnifiedDirectoryPage() {
    const [currentTab, setCurrentTab] = useState<'people' | 'companies' | 'mentors' | 'stakeholders'>('people');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Create Person Modal
    const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
    const [personForm, setPersonForm] = useState({
        firstName: '',
        lastName: '',
        title: '',
        email: '',
        phone: '',
        linkedin: '',
        city: 'İstanbul',
        notes: ''
    });

    // Create Organization Modal
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const [orgForm, setOrgForm] = useState({
        displayName: '',
        legalName: '',
        organizationType: 'COMPANY',
        sector: 'Yazılım / Teknoloji',
        email: '',
        phone: '',
        taxNumber: '',
        taxOffice: '',
        city: 'İstanbul',
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('tab', currentTab);
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/directory?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.items || []);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Rehber verileri yüklenirken bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentTab, search]);

    const handleCreatePerson = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/persons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(personForm)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Kişi kaydı oluşturulamadı');
            }

            const personName = data.person?.fullName || data.item?.fullName || `${personForm.firstName} ${personForm.lastName}`;
            setFeedback({ type: 'success', message: `${personName} başarıyla rehbere eklendi.` });
            setIsPersonModalOpen(false);
            setPersonForm({ firstName: '', lastName: '', title: '', email: '', phone: '', linkedin: '', city: 'İstanbul', notes: '' });
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgForm)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Kurum kaydı oluşturulamadı');
            }

            const orgName = data.organization?.displayName || data.item?.displayName || orgForm.displayName;
            setFeedback({ type: 'success', message: `${orgName} başarıyla rehbere eklendi.` });
            setIsOrgModalOpen(false);
            setOrgForm({ displayName: '', legalName: '', organizationType: 'COMPANY', sector: 'Yazılım / Teknoloji', email: '', phone: '', taxNumber: '', taxOffice: '', city: 'İstanbul', notes: '' });
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                        <Users className="w-4 h-4" />
                        <span>Merkezi İKÜANTS TEKMER Rehberi</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kişi & Kurum Rehberi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerçek kişiler, tüzel şirketler, mentör uzmanlıkları ve ekosistem paydaşlarının 360° merkezi dizini.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        id="add-person-btn"
                        onClick={() => setIsPersonModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>+ Yeni Kişi Ekle</span>
                    </button>
                    <button
                        id="add-org-btn"
                        onClick={() => setIsOrgModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                    >
                        <Building2 className="w-4 h-4" />
                        <span>+ Yeni Şirket / Kurum</span>
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filter Tabs & Search */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                        { id: 'people', label: 'Gerçek Kişiler' },
                        { id: 'companies', label: 'Şirketler & Kurumlar' },
                        { id: 'mentors', label: 'Mentörler' },
                        { id: 'stakeholders', label: 'Paydaşlar' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                currentTab === tab.id
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                        id="directory-search"
                        type="text"
                        placeholder="Ad, unvan, e-posta veya kurum ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-slate-400">Rehber yükleniyor...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                    <Users className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">Rehberde eşleşen kayıt bulunamadı</div>
                    <p className="text-xs text-slate-400">Farklı bir arama yapabilir veya yeni bir kayıt ekleyebilirsiniz.</p>
                </div>
            ) : (
                <>
                    {/* TAB 1: PEOPLE */}
                    {currentTab === 'people' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-primary/40 transition-all shadow-xl group relative"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-primary/20">
                                                {p.firstName?.[0] || p.fullName?.[0] || 'K'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{p.fullName}</div>
                                                <div className="text-xs text-slate-400">{p.title || 'Ekosistem Üyesi'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Memberships & Roles */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.memberships?.map((m: any) => (
                                            <span key={m.id} className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                                {m.organization?.displayName || m.organization?.legalName}: {m.role}
                                            </span>
                                        ))}
                                        {p.mentorProfile && (
                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                                Mentör
                                            </span>
                                        )}
                                        {p.founderRoles?.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                Kurucu ({p.founderRoles.length})
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                                        {p.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                <a href={`mailto:${p.email}`} className="hover:text-primary transition-colors truncate">
                                                    {p.email}
                                                </a>
                                            </div>
                                        )}
                                        {p.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                <span>{p.phone}</span>
                                            </div>
                                        )}
                                        {p.linkedin && (
                                            <div className="flex items-center gap-2">
                                                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                                                <a href={p.linkedin} target="_blank" rel="noreferrer" className="hover:underline truncate text-blue-400">
                                                    LinkedIn Profili
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 2: COMPANIES & ORGANIZATIONS */}
                    {currentTab === 'companies' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((org) => (
                                <div
                                    key={org.id}
                                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-primary/40 transition-all shadow-xl group relative"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-sm text-white">{org.displayName || org.legalName}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{org.legalName}</div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                            {org.organizationType}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
                                        <Building className="w-4 h-4 text-primary" />
                                        <span>{org.sector || 'Teknoloji / Girişim'}</span>
                                        <span className="ml-auto font-mono text-[10px] text-slate-400">
                                            {org._count?.personnel || 0} Personel
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                                        {org.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                <a href={`mailto:${org.email}`} className="hover:text-primary transition-colors truncate">
                                                    {org.email}
                                                </a>
                                            </div>
                                        )}
                                        {org.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                <span>{org.phone}</span>
                                            </div>
                                        )}
                                        {org.taxNumber && (
                                            <div className="text-[11px] font-mono text-slate-500">
                                                VN: {org.taxNumber} {org.taxOffice ? `(${org.taxOffice})` : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 3: MENTORS */}
                    {currentTab === 'mentors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((m) => (
                                <div
                                    key={m.id}
                                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-xl group relative"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-sm text-white">{m.name} {m.surname}</div>
                                            <div className="text-xs text-purple-300 mt-0.5">{m.title || 'Uzman Mentör'}</div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            {m._count?.mentorSessions || 0} Görüşme
                                        </span>
                                    </div>

                                    {m.company && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
                                            <Building2 className="w-3.5 h-3.5 text-purple-400" />
                                            <span>{m.company}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1 text-xs text-slate-400">
                                        {m.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                <a href={`mailto:${m.email}`} className="hover:text-primary transition-colors truncate">
                                                    {m.email}
                                                </a>
                                            </div>
                                        )}
                                        {m.linkedin && (
                                            <div className="flex items-center gap-2">
                                                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                                                <a href={m.linkedin} target="_blank" rel="noreferrer" className="hover:underline truncate text-blue-400">
                                                    LinkedIn Profili
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 4: STAKEHOLDERS */}
                    {currentTab === 'stakeholders' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((s) => (
                                <div
                                    key={s.id}
                                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-emerald-500/40 transition-all shadow-xl"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="font-bold text-sm text-white">
                                            {s.person?.fullName || s.organization?.displayName || 'Paydaş'}
                                        </div>
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                            {s.stakeholderType}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">{s.notes || 'İş birliği ortağı'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Create Person Modal */}
            {isPersonModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base">Rehbere Yeni Kişi Ekle</h3>
                            <button onClick={() => setIsPersonModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreatePerson} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Ad *</label>
                                    <input
                                        id="person-first-name"
                                        type="text"
                                        required
                                        value={personForm.firstName}
                                        onChange={(e) => setPersonForm({ ...personForm, firstName: e.target.value })}
                                        placeholder="Örn: Ahmet"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Soyad *</label>
                                    <input
                                        id="person-last-name"
                                        type="text"
                                        required
                                        value={personForm.lastName}
                                        onChange={(e) => setPersonForm({ ...personForm, lastName: e.target.value })}
                                        placeholder="Örn: Yılmaz"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Unvan / Rol</label>
                                <input
                                    type="text"
                                    value={personForm.title}
                                    onChange={(e) => setPersonForm({ ...personForm, title: e.target.value })}
                                    placeholder="Örn: CEO / Kurucu Ortak"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">E-posta</label>
                                    <input
                                        id="person-email"
                                        type="email"
                                        value={personForm.email}
                                        onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })}
                                        placeholder="ahmet@example.com"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Telefon</label>
                                    <input
                                        id="person-phone"
                                        type="text"
                                        value={personForm.phone}
                                        onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })}
                                        placeholder="+90 555 000 0000"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">LinkedIn Profili</label>
                                <input
                                    type="url"
                                    value={personForm.linkedin}
                                    onChange={(e) => setPersonForm({ ...personForm, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/in/..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPersonModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-person-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 cursor-pointer"
                                >
                                    Kişiyi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Org Modal */}
            {isOrgModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base">Rehbere Yeni Kurum / Şirket Ekle</h3>
                            <button onClick={() => setIsOrgModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Kurum / Şirket Adı *</label>
                                <input
                                    id="org-display-name"
                                    type="text"
                                    required
                                    value={orgForm.displayName}
                                    onChange={(e) => setOrgForm({ ...orgForm, displayName: e.target.value })}
                                    placeholder="Örn: ABC Teknoloji"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Resmi Ticari Unvan</label>
                                <input
                                    type="text"
                                    value={orgForm.legalName}
                                    onChange={(e) => setOrgForm({ ...orgForm, legalName: e.target.value })}
                                    placeholder="Örn: ABC Teknoloji ve Yazılım A.Ş."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Kurum Türü</label>
                                    <select
                                        value={orgForm.organizationType}
                                        onChange={(e) => setOrgForm({ ...orgForm, organizationType: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="COMPANY">Şirket (A.Ş. / Ltd.)</option>
                                        <option value="UNIVERSITY">Üniversite / Enstitü</option>
                                        <option value="PUBLIC_INSTITUTION">Kamu Kurumu</option>
                                        <option value="INVESTOR">Yatırım Fonu / Melek Ağ</option>
                                        <option value="NGO">STK / Dernek</option>
                                        <option value="PARTNER">Paydaş / Partner</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Sektör</label>
                                    <input
                                        type="text"
                                        value={orgForm.sector}
                                        onChange={(e) => setOrgForm({ ...orgForm, sector: e.target.value })}
                                        placeholder="Yazılım, AI, Biyoteknoloji..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Vergi No</label>
                                    <input
                                        type="text"
                                        value={orgForm.taxNumber}
                                        onChange={(e) => setOrgForm({ ...orgForm, taxNumber: e.target.value })}
                                        placeholder="1234567890"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Vergi Dairesi</label>
                                    <input
                                        type="text"
                                        value={orgForm.taxOffice}
                                        onChange={(e) => setOrgForm({ ...orgForm, taxOffice: e.target.value })}
                                        placeholder="Kadıköy VD"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOrgModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-org-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 cursor-pointer"
                                >
                                    Kurumu Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
