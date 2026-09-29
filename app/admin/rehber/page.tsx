"use client";
import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Mail, Phone, Building2, Linkedin,
    UserCheck, Rocket, GraduationCap, Briefcase, Filter, Trash2
} from 'lucide-react';

interface ContactRecord {
    id: string;
    fullName: string;
    title?: string;
    email?: string;
    phone?: string;
    contactType: string;
    linkedin?: string;
    notes?: string;
    organization?: { name: string; sector?: string };
}

export default function DirectoryPage() {
    const [contacts, setContacts] = useState<ContactRecord[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [contactType, setContactType] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [type, setType] = useState('PARTNER');
    const [organizationId, setOrganizationId] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [notes, setNotes] = useState('');

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (contactType) params.append('contactType', contactType);

            const res = await fetch(`/api/admin/directory?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setContacts(data.contacts);
                setOrganizations(data.organizations);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [search, contactType]);

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) return;

        try {
            const res = await fetch('/api/admin/directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    title,
                    email,
                    phone,
                    contactType: type,
                    organizationId: organizationId || undefined,
                    linkedin,
                    notes,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setFullName('');
                setTitle('');
                setEmail('');
                setPhone('');
                setLinkedin('');
                setNotes('');
                fetchContacts();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (!confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) return;
        try {
            await fetch(`/api/admin/directory?id=${id}`, { method: 'DELETE' });
            fetchContacts();
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeBadge = (t: string) => {
        switch (t) {
            case 'MENTOR': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">Mentör</span>;
            case 'ENTREPRENEUR': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">Girişimci</span>;
            case 'INSTRUCTOR': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Eğitmen</span>;
            case 'ACADEMIC': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Akademisyen</span>;
            case 'INVESTOR': return <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">Yatırımcı</span>;
            default: return <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-gray-500/20 text-gray-400 border border-gray-500/30">İş Ortağı</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-primary" />
                        Paydaş & Kişi Rehberi
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Mentörler, girişimciler, eğitmenler, akademisyenler, yatırımcılar ve kurum temsilcileri tek merkezi havuzda.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Kişi Ekle
                </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090912] p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                        { id: '', label: 'Tümü' },
                        { id: 'MENTOR', label: 'Mentörler' },
                        { id: 'ENTREPRENEUR', label: 'Girişimciler' },
                        { id: 'INSTRUCTOR', label: 'Eğitmenler' },
                        { id: 'ACADEMIC', label: 'Akademisyenler' },
                        { id: 'INVESTOR', label: 'Yatırımcılar' },
                        { id: 'PARTNER', label: 'Paydaş / Kurum' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setContactType(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                contactType === tab.id
                                    ? 'bg-primary/20 text-primary border border-primary/40'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Ad, unvan, e-posta veya kurum..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Contacts Grid */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Rehber yükleniyor...</div>
            ) : contacts.length === 0 ? (
                <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl space-y-3">
                    <Users className="w-10 h-10 text-gray-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">Rehberde eşleşen kişi bulunamadı</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts.map((c) => (
                        <div
                            key={c.id}
                            className="bg-[#090912] border border-white/10 rounded-2xl p-4 space-y-3 hover:border-primary/40 transition-all group relative"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-semibold text-sm text-white">{c.fullName}</div>
                                    <div className="text-xs text-gray-400">{c.title || '-'}</div>
                                </div>
                                <div>{getTypeBadge(c.contactType)}</div>
                            </div>

                            {c.organization && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-xl">
                                    <Building2 className="w-3.5 h-3.5 text-primary" />
                                    <span>{c.organization.name}</span>
                                </div>
                            )}

                            <div className="space-y-1 text-xs text-gray-400">
                                {c.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                                        <a href={`mailto:${c.email}`} className="hover:text-primary transition-colors truncate">
                                            {c.email}
                                        </a>
                                    </div>
                                )}
                                {c.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                                        <span>{c.phone}</span>
                                    </div>
                                )}
                                {c.linkedin && (
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                                        <a href={c.linkedin} target="_blank" rel="noreferrer" className="hover:underline truncate text-blue-400">
                                            LinkedIn Profili
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={() => handleDeleteContact(c.id)}
                                    className="text-gray-500 hover:text-rose-400 p-1.5 transition-colors"
                                    title="Kişiyi Sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Contact Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Rehbere Yeni Kişi Ekle</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-400 mb-1">Ad Soyad *</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Örn: Dr. Ahmet Yılmaz"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Rol / Tür</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="MENTOR">Mentör</option>
                                        <option value="ENTREPRENEUR">Girişimci</option>
                                        <option value="INSTRUCTOR">Eğitmen</option>
                                        <option value="ACADEMIC">Akademisyen</option>
                                        <option value="INVESTOR">Yatırımcı</option>
                                        <option value="PARTNER">İş Ortağı / Temsilci</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Unvan</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Örn: Kurucu Ortak / CEO"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">E-posta</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ahmet@sirket.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+90 555 000 00 00"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Bağlı Olduğu Kurum</label>
                                <select
                                    value={organizationId}
                                    onChange={(e) => setOrganizationId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                >
                                    <option value="">Seçilmedi</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">LinkedIn Profili</label>
                                <input
                                    type="url"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Notlar & İletişim Geçmişi</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Kişiye özel notlar..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
