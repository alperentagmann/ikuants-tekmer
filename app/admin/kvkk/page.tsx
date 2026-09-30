'use client';

import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    FileText,
    Users,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    AlertCircle,
    X,
    Eye,
    EyeOff,
    Download,
    History,
    FileCode,
    RefreshCw
} from 'lucide-react';

interface KvkkConsent {
    id: string;
    personName: string;
    personEmail?: string;
    personPhone?: string;
    dataSubjectType: string;
    consentType: string;
    textVersion?: string;
    status: string;
    consentedAt: string;
    withdrawnAt?: string;
    withdrawalReason?: string;
    sourceForm?: string;
    ipAddress?: string;
    notes?: string;
}

interface KvkkVersion {
    id: string;
    consentType: string;
    version: string;
    title: string;
    content: string;
    summary?: string;
    isActive: boolean;
    publishedAt: string;
}

export default function KvkkManagementPage() {
    const [consents, setConsents] = useState<KvkkConsent[]>([]);
    const [versions, setVersions] = useState<KvkkVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'CONSENTS' | 'VERSIONS'>('CONSENTS');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
    const [showSensitive, setShowSensitive] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal state for adding new consent
    const [showAddModal, setShowAddModal] = useState(false);
    const [newConsent, setNewConsent] = useState({
        personName: '',
        personEmail: '',
        personPhone: '',
        dataSubjectType: 'ENTREPRENEUR',
        consentType: 'EXPLICIT_CONSENT',
        textVersion: 'v1.0',
        sourceForm: 'ADMIN_MANUAL',
        notes: ''
    });

    // Modal state for adding new version
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [newVersion, setNewVersion] = useState({
        consentType: 'EXPLICIT_CONSENT',
        version: 'v1.1',
        title: '',
        content: '',
        summary: ''
    });

    // Withdrawal modal
    const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
    const [withdrawReason, setWithdrawReason] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedType !== 'ALL') params.append('consentType', selectedType);
            if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/admin/kvkk?${params.toString()}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || []);
            setConsents(list);

            const verRes = await fetch('/api/admin/kvkk/versions');
            const verData = await verRes.json();
            if (Array.isArray(verData)) {
                setVersions(verData);
            }
        } catch {
            setFeedback({ type: 'error', message: 'KVKK verileri yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedType, selectedStatus]);

    const handleCreateConsent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/kvkk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConsent)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Rıza kaydı eklenemedi');
            }

            setFeedback({ type: 'success', message: 'KVKK Açık Rıza / İzin kaydı başarıyla oluşturuldu.' });
            setShowAddModal(false);
            setNewConsent({
                personName: '',
                personEmail: '',
                personPhone: '',
                dataSubjectType: 'ENTREPRENEUR',
                consentType: 'EXPLICIT_CONSENT',
                textVersion: 'v1.0',
                sourceForm: 'ADMIN_MANUAL',
                notes: ''
            });
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Kayıt başarısız.' });
        }
    };

    const handleCreateVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/kvkk/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVersion)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Sürüm oluşturulamadı');
            }

            setFeedback({ type: 'success', message: 'Yeni KVKK Metin Sürümü başarıyla yayınlandı.' });
            setShowVersionModal(false);
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Sürüm ekleme başarısız.' });
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawTargetId) return;

        try {
            const res = await fetch(`/api/admin/kvkk/${withdrawTargetId}/withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: withdrawReason })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Geri çekme başarısız');
            }

            setFeedback({ type: 'success', message: 'İzin başarıyla geri çekildi (WITHDRAWN) ve loglandı.' });
            setWithdrawTargetId(null);
            setWithdrawReason('');
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Geri çekilemedi.' });
        }
    };

    const maskEmail = (email?: string) => {
        if (!email) return '-';
        if (showSensitive) return email;
        const [user, domain] = email.split('@');
        if (!domain) return '***';
        return `${user.substring(0, 2)}***@${domain}`;
    };

    const maskPhone = (phone?: string) => {
        if (!phone) return '-';
        if (showSensitive) return phone;
        return `${phone.substring(0, 4)}***${phone.substring(phone.length - 2)}`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Hukuki Uyum & Veri Güvenliği</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">KVKK & Veri İzinleri Merkezi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Aydınlatma metinleri, açık rıza onayları, iletişim izinleri ve sürüm geçmişinin yasal denetim kaydı.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSensitive(!showSensitive)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${showSensitive ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                    >
                        {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{showSensitive ? 'Verileri Maskele' : 'Hassas Verileri Göster'}</span>
                    </button>

                    <button
                        id="new-consent-btn"
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-950/40 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Yeni Rıza / İzin Kaydı</span>
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

            {/* Navigation Tabs */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <button
                    onClick={() => setActiveTab('CONSENTS')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === 'CONSENTS' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                    <Users className="w-4 h-4" />
                    <span>Veri İzinleri & Rıza Kayıtları ({consents.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('VERSIONS')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === 'VERSIONS' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                    <FileCode className="w-4 h-4" />
                    <span>Aydınlatma Metin Sürümleri ({versions.length})</span>
                </button>
            </div>

            {activeTab === 'CONSENTS' && (
                <div className="space-y-4">
                    {/* Filters and Search Bar */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                id="kvkk-search"
                                type="text"
                                placeholder="Kişi adı, e-posta veya telefon ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="ALL">Tüm İzin Türleri</option>
                                <option value="EXPLICIT_CONSENT">Açık Rıza Metni</option>
                                <option value="CLARIFICATION_TEXT">Aydınlatma Metni</option>
                                <option value="COMMUNICATION_CONSENT">Ticari Elektronik İleti</option>
                                <option value="MEDIA_CONSENT">Görsel / Video İzni</option>
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="ALL">Tüm Durumlar</option>
                                <option value="ACTIVE">Geçerli (ACTIVE)</option>
                                <option value="WITHDRAWN">Geri Çekildi (WITHDRAWN)</option>
                                <option value="EXPIRED">Süresi Doldu (EXPIRED)</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 text-sm">Veriler yükleniyor...</div>
                        ) : consents.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 text-sm">
                                Henüz kayıtlı KVKK rıza / izin kaydı bulunmuyor.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="px-5 py-4">Veri Sahibi</th>
                                            <th className="px-5 py-4">Taraf Türü</th>
                                            <th className="px-5 py-4">İzin Türü & Sürüm</th>
                                            <th className="px-5 py-4">Kaynak / Form</th>
                                            <th className="px-5 py-4">Onay Tarihi</th>
                                            <th className="px-5 py-4">Durum</th>
                                            <th className="px-5 py-4 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {consents.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-white">{item.fullName || item.personName}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                        {maskEmail(item.email || item.personEmail)}
                                                    </div>
                                                    {(item.phone || item.personPhone) && (
                                                        <div className="text-xs text-slate-500 font-mono">
                                                            {maskPhone(item.phone || item.personPhone)}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                                                        {item.subjectType || item.dataSubjectType}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-white text-xs">{item.consentType || 'EXPLICIT_CONSENT'}</div>
                                                    <div className="text-[11px] text-indigo-400 mt-0.5 font-mono">
                                                        Metin Sürümü: {item.textVersion?.version || item.textVersion || 'v1.0'}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                                                    {item.sourceForm || 'MANUAL'}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="text-xs text-white">
                                                        {new Date(item.consentedAt).toLocaleDateString('tr-TR')}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {new Date(item.consentedAt).toLocaleTimeString('tr-TR')}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                        {item.status === 'ACTIVE' ? 'Geçerli' : item.status === 'WITHDRAWN' ? 'Geri Çekildi' : item.status}
                                                    </span>
                                                    {item.withdrawnAt && (
                                                        <div className="text-[10px] text-rose-400/80 mt-1">
                                                            {new Date(item.withdrawnAt).toLocaleDateString('tr-TR')}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                                    {item.status === 'ACTIVE' && (
                                                        <button
                                                            id={`withdraw-btn-${item.id}`}
                                                            onClick={() => setWithdrawTargetId(item.id)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
                                                        >
                                                            İzni Geri Çek
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'VERSIONS' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowVersionModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Yeni Metin Sürümü Ekle</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {versions.map((ver) => (
                            <div key={ver.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold">
                                            {ver.version}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ver.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {ver.isActive ? 'Aktif Sürüm' : 'Arşiv Sürüm'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-white text-sm mt-1">{ver.title}</h4>
                                    <p className="text-xs text-indigo-400 mt-0.5 font-medium">{ver.consentType}</p>
                                    <p className="text-xs text-slate-300 mt-3 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                                        {ver.content}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                                    <span>Yayın Tarihi: {new Date(ver.publishedAt).toLocaleDateString('tr-TR')}</span>
                                    <span>İzlenebilirlik: Korunuyor</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Consent Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-lg font-bold text-white">Manuel Rıza / İzin Kaydı Ekle</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateConsent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Veri Sahibi Ad Soyad *</label>
                                <input
                                    id="consent-person-name"
                                    type="text"
                                    required
                                    placeholder="Örn: Ahmet Yılmaz"
                                    value={newConsent.personName}
                                    onChange={(e) => setNewConsent({ ...newConsent, personName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">E-Posta</label>
                                    <input
                                        id="consent-person-email"
                                        type="email"
                                        placeholder="ahmet@example.com"
                                        value={newConsent.personEmail}
                                        onChange={(e) => setNewConsent({ ...newConsent, personEmail: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon</label>
                                    <input
                                        id="consent-person-phone"
                                        type="text"
                                        placeholder="+90 5XX XXX XX XX"
                                        value={newConsent.personPhone}
                                        onChange={(e) => setNewConsent({ ...newConsent, personPhone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Taraf Türü</label>
                                    <select
                                        value={newConsent.dataSubjectType}
                                        onChange={(e) => setNewConsent({ ...newConsent, dataSubjectType: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="APPLICANT">Başvuru Sahibi</option>
                                        <option value="ENTREPRENEUR">Girişimci</option>
                                        <option value="MENTOR">Mentor</option>
                                        <option value="VISITOR">Ziyaretçi</option>
                                        <option value="STAKEHOLDER">Paydaş</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">İzin Türü</label>
                                    <select
                                        value={newConsent.consentType}
                                        onChange={(e) => setNewConsent({ ...newConsent, consentType: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="EXPLICIT_CONSENT">Açık Rıza Metni</option>
                                        <option value="CLARIFICATION_TEXT">Aydınlatma Metni</option>
                                        <option value="COMMUNICATION_CONSENT">Ticari Elektronik İleti</option>
                                        <option value="MEDIA_CONSENT">Görsel / Video İzni</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="save-consent-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdrawal Reason Modal */}
            {withdrawTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-2">İzni Geri Çekme (Opt-Out)</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Bu işlem yasal audit log&apos;a işlenecek ve ilgili kişinin izni WITHDRAWN durumuna getirilecektir.
                        </p>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Geri Çekme Gerekçesi / Not</label>
                                <textarea
                                    id="withdraw-reason"
                                    required
                                    rows={3}
                                    placeholder="Kullanıcı e-posta yoluyla iznini geri çekmek istediğini iletti..."
                                    value={withdrawReason}
                                    onChange={(e) => setWithdrawReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWithdrawTargetId(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    id="confirm-withdraw-btn"
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                                >
                                    Onayla ve Geri Çek
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
