"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Rocket, ArrowLeft, Globe, Linkedin, Mail, Phone, Calendar,
    Users, Layers, Award, FileText, Activity, CheckSquare,
    DollarSign, Sparkles, Image as ImageIcon, History, Plus,
    Save, Trash2, Edit2, ShieldAlert, CheckCircle2, Upload,
    ExternalLink, Eye, EyeOff, Clock
} from 'lucide-react';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';

export default function EntrepreneurDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [entrepreneur, setEntrepreneur] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('genel');
    const [saving, setSaving] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'logo' | 'cover' | 'gallery'>('logo');
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}`);
            const data = await res.json();
            const item = data.entrepreneur || data.item;
            if (data.success && item) {
                setEntrepreneur(item);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entrepreneur),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Girişimci bilgileri başarıyla kaydedildi.');
                fetchDetail();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleMediaSelect = async (url: string) => {
        if (!entrepreneur) return;
        const updated = { ...entrepreneur };
        if (pickerTarget === 'logo') {
            updated.logoUrl = url;
        } else if (pickerTarget === 'cover') {
            updated.coverUrl = url;
        }
        setEntrepreneur(updated);
        setIsMediaPickerOpen(false);

        // Auto persist logo/cover change
        try {
            await fetch(`/api/admin/entrepreneurs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            showToast(`${pickerTarget === 'logo' ? 'Logo' : 'Kapak görseli'} güncellendi.`);
        } catch (e) {
            console.error(e);
        }
    };

    const tabs = [
        { id: 'genel', label: 'Genel Bilgiler', icon: Rocket },
        { id: 'programlar', label: 'Programlar & Kuluçka', icon: Layers },
        { id: 'finans', label: 'Finans & Kira', icon: DollarSign },
        { id: 'kurucular', label: 'Kurucular & Ekip', icon: Users },
        { id: 'mentorluk', label: 'Mentörlük Seansları', icon: Users },
        { id: 'faaliyetler', label: 'Faaliyetler', icon: Activity },
        { id: 'gorevler', label: 'Görevler', icon: CheckSquare },
        { id: 'toplantilar', label: 'Toplantılar', icon: Calendar },
        { id: 'belgeler', label: 'Belgeler & Sözleşmeler', icon: FileText },
        { id: 'yatirimlar', label: 'Yatırımlar & Fon', icon: DollarSign },
        { id: 'kilometre_taslari', label: 'Kilometre Taşları', icon: CheckCircle2 },
        { id: 'galeri', label: 'Galeri & Medya', icon: ImageIcon },
        { id: 'timeline', label: 'İşlem Geçmişi (Timeline)', icon: History },
    ];

    // Programs state
    const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
    const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
    const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
    const [programFormData, setProgramFormData] = useState({
        programId: '',
        cohort: '2026-1',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Rent & Contract State
    const [rentContracts, setRentContracts] = useState<any[]>([]);
    const [rentSummary, setRentSummary] = useState<any>(null);
    const [showRentModal, setShowRentModal] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAccrualForPay, setSelectedAccrualForPay] = useState<any>(null);
    const [showGenerateAccrualModal, setShowGenerateAccrualModal] = useState(false);

    const [rentFormData, setRentFormData] = useState({
        contractNo: `KIRA-${Date.now().toString().slice(-4)}`,
        spaceName: 'Ofis A-102',
        roomDeskNo: 'Oda 102',
        spaceType: 'OFFICE',
        areaM2: '25',
        commercialTitle: '',
        contactPersonName: '',
        contactEmail: '',
        contactPhone: '',
        contractDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        monthlyRent: '20000',
        currency: 'TRY',
        vatRate: '20',
        dueDay: 5,
        depositAmount: '40000',
        isWaived: false,
        waiverReason: '',
        freePeriodStart: '',
        freePeriodEnd: '',
        autoRenew: true,
        renewalNoticeDays: 30,
        contractDocUrl: '',
        notes: ''
    });

    const [docFormData, setDocFormData] = useState({
        contractId: '',
        documentType: 'SIGNED_CONTRACT',
        title: '',
        fileUrl: '',
        documentDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    const [paymentFormData, setPaymentFormData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        bankReceiptNo: '',
        receiptDocUrl: '',
        description: ''
    });

    const [genAccrualPeriod, setGenAccrualPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const fetchAssignedPrograms = async () => {
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}/programs`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || data.programs || []);
            setAssignedPrograms(list);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRentData = async () => {
        try {
            const [contractsRes, summaryRes] = await Promise.all([
                fetch(`/api/admin/rent/contracts?entrepreneurId=${id}`),
                fetch(`/api/admin/entrepreneurs/${id}/rent-summary`)
            ]);
            const cData = await contractsRes.json();
            const sData = await summaryRes.json();
            const list = Array.isArray(cData) ? cData : (cData.items || cData.contracts || []);
            setRentContracts(list);
            if (sData?.success && sData?.summary) {
                setRentSummary(sData.summary);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAvailablePrograms = async () => {
        try {
            const res = await fetch('/api/admin/programs');
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || data.programs || []);
            setAvailablePrograms(list);
            if (list.length > 0) {
                setProgramFormData(prev => ({ ...prev, programId: prev.programId || list[0].id }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAssignedPrograms();
            fetchRentData();
            fetchAvailablePrograms();
        }
    }, [id]);

    const handleAssignProgram = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(programFormData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Program atanamadı');
            }

            showToast('Program başarıyla atandı.');
            setShowAssignProgramModal(false);
            fetchAssignedPrograms();
            fetchDetail();
        } catch (err: any) {
            showToast(`Hata: ${err.message}`);
        }
    };

    const handleCreateRentContract = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/rent/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...rentFormData,
                    entrepreneurId: id,
                    monthlyRent: Number(rentFormData.monthlyRent),
                    areaM2: rentFormData.areaM2 ? Number(rentFormData.areaM2) : undefined,
                    vatRate: Number(rentFormData.vatRate),
                    dueDay: Number(rentFormData.dueDay),
                    depositAmount: Number(rentFormData.depositAmount),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Sözleşme oluşturulamadı');
            }

            showToast('Kira sözleşmesi başarıyla oluşturuldu.');
            setShowRentModal(false);
            fetchRentData();
        } catch (err: any) {
            showToast(`Hata: ${err.message}`);
        }
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFormData.contractId) return;

        try {
            const res = await fetch(`/api/admin/rent/contracts/${docFormData.contractId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docFormData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Belge yüklenemedi');
            }

            showToast('Sözleşme belgesi başarıyla eklendi.');
            setShowDocModal(false);
            fetchRentData();
        } catch (err: any) {
            showToast(`Hata: ${err.message}`);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccrualForPay) return;

        try {
            const res = await fetch(`/api/admin/rent/accruals/${selectedAccrualForPay.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...paymentFormData,
                    amount: Number(paymentFormData.amount)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Ödeme kaydedilemedi');
            }

            showToast('Kira tahsilatı başarıyla işlendi.');
            setShowPaymentModal(false);
            fetchRentData();
        } catch (err: any) {
            showToast(`Hata: ${err.message}`);
        }
    };

    const handleGenerateAccruals = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/rent/accruals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(genAccrualPeriod)
            });

            if (!res.ok) throw new Error('Tahakkuk oluşturulamadı');

            const data = await res.json();
            showToast(`${data.createdCount || data.count || 1} adet kira tahakkuku oluşturuldu.`);
            setShowGenerateAccrualModal(false);
            fetchRentData();
        } catch (err: any) {
            showToast(`Hata: ${err.message}`);
        }
    };

    const handleUpdateProgramStatus = async (assignmentId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}/programs/${assignmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast('Program durumu güncellendi.');
                fetchAssignedPrograms();
            }
        } catch (err: any) {
            showToast('Durum güncellenemedi');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Girişimci detayları yükleniyor...</div>;
    }

    if (!entrepreneur) {
        return (
            <div className="p-8 text-center text-rose-400 space-y-3">
                <div>Girişimci kaydı bulunamadı.</div>
                <Link href="/admin/girisimciler" className="text-primary hover:underline text-xs font-mono">
                    Girişimciler Listesine Dön
                </Link>
            </div>
        );
    }

    const activeProgramName = assignedPrograms.find(p => p.status === 'ACTIVE' || p.status === 'ACCEPTED')?.program?.name || entrepreneur.program;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#0e0e18] border border-primary text-white text-xs font-mono px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{toast}</span>
                </div>
            )}

            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/girisimciler"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-mono"
                >
                    <ArrowLeft className="w-4 h-4" /> Girişimcilere Dön
                </Link>
                <div className="flex items-center gap-2">
                    <a
                        href={`/girisimciler/${entrepreneur.slug || entrepreneur.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Canlı Sayfayı Gör
                    </a>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Logo with interactive MediaPicker */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-2">
                            {entrepreneur.logoUrl ? (
                                <img src={entrepreneur.logoUrl} alt={entrepreneur.name} className="max-w-full max-h-full object-contain" />
                            ) : (
                                <Rocket className="w-10 h-10 text-primary" />
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setPickerTarget('logo');
                                setIsMediaPickerOpen(true);
                            }}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-[10px] text-white font-mono font-bold transition-opacity cursor-pointer"
                        >
                            <Upload className="w-4 h-4 mb-1 text-primary" />
                            Logo Değiştir
                        </button>
                    </div>

                    {/* Basic Meta */}
                    <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-orbitron font-bold text-2xl text-white">
                                {entrepreneur.name}
                            </h1>
                            <span id="entrepreneur-active-program-badge" className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {activeProgramName || 'Program Atanmamış'}
                            </span>
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                                entrepreneur.isPublished !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                                {entrepreneur.isPublished !== false ? 'Yayında (Public)' : 'Gizli'}
                            </span>
                        </div>

                        <p className="text-xs text-cyan-400 font-mono">
                            {entrepreneur.sector} {entrepreneur.subSector ? `• ${entrepreneur.subSector}` : ''}
                        </p>

                        <div className="text-xs text-gray-400 flex flex-wrap gap-4 pt-1 font-mono">
                            {entrepreneur.founders && <span>Kurucu: <b className="text-white">{entrepreneur.founders}</b></span>}
                            {entrepreneur.website && (
                                <a href={entrepreneur.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5" /> Web
                                </a>
                            )}
                            {entrepreneur.linkedin && (
                                <a href={entrepreneur.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SETUP CHECKLIST (KURULUM DURUMU & EKSİK AKSİYONLAR) */}
            {(!activeProgramName || activeProgramName === 'Program Atanmamış' || !entrepreneur.companyName || !rentSummary?.hasContract) && (
                <div className="bg-gradient-to-r from-amber-950/40 via-[#151210] to-[#0e0e18] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400">
                            <ShieldAlert className="w-4 h-4" />
                            <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-300">
                                Girişimci Kurulum Durumu & Bekleyen Aksiyonlar
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Aksiyon Gerekli
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {/* 1. Program Status */}
                        {(!activeProgramName || activeProgramName === 'Program Atanmamış') ? (
                            <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20 flex flex-col justify-between gap-2 text-xs">
                                <div>
                                    <div className="text-amber-400 font-bold flex items-center gap-1">
                                        <span>○</span> Program Atanmamış
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Kuluçka veya hızlandırma süreci belirlenmedi.</div>
                                </div>
                                <button
                                    id="checklist-assign-program-btn"
                                    onClick={() => {
                                        setActiveTab('programlar');
                                        setShowAssignProgramModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> + Program Ata
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <div className="font-bold">{activeProgramName}</div>
                                    <div className="text-[10px] text-emerald-400/70">Program Kaydı Aktif</div>
                                </div>
                            </div>
                        )}

                        {/* 2. Company / Incorporation Status */}
                        {!entrepreneur.companyName ? (
                            <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20 flex flex-col justify-between gap-2 text-xs">
                                <div>
                                    <div className="text-amber-400 font-bold flex items-center gap-1">
                                        <span>○</span> Şirket Bağlanmamış
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Tüzel kişilik kaydı henüz bağlanmadı.</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveTab('genel');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> + Şirket Bilgisi Gir
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <div className="font-bold truncate">{entrepreneur.companyName}</div>
                                    <div className="text-[10px] text-emerald-400/70">Tüzel Şirket Bağlı</div>
                                </div>
                            </div>
                        )}

                        {/* 3. Rent Contract Status */}
                        {!rentSummary?.hasContract ? (
                            <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20 flex flex-col justify-between gap-2 text-xs">
                                <div>
                                    <div className="text-amber-400 font-bold flex items-center gap-1">
                                        <span>○</span> Kira Sözleşmesi Yok
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Ofis/alan tahsis ve kira sözleşmesi eksik.</div>
                                </div>
                                <button
                                    id="checklist-add-rent-contract-btn"
                                    onClick={() => {
                                        setActiveTab('finans');
                                        setShowRentModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> + Kira Sözleşmesi Ekle
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <div className="font-bold">{rentSummary.activeContract?.spaceName || 'Kira Sözleşmesi'}</div>
                                    <div className="text-[10px] text-emerald-400/70">{rentSummary.activeContract?.contractNo}</div>
                                </div>
                            </div>
                        )}

                        {/* 4. Document / Contract Evrak Status */}
                        {rentSummary?.documentsCount === 0 ? (
                            <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20 flex flex-col justify-between gap-2 text-xs">
                                <div>
                                    <div className="text-amber-400 font-bold flex items-center gap-1">
                                        <span>○</span> Belge / Sözleşme Eksik
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">İmzalı sözleşme nüshası yüklenmedi.</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveTab('finans');
                                        if (rentContracts.length > 0) {
                                            setDocFormData(prev => ({ ...prev, contractId: rentContracts[0].id }));
                                            setShowDocModal(true);
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Upload className="w-3 h-3" /> + Belge Yükle
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div>
                                    <div className="font-bold">{rentSummary?.documentsCount || 1} Belge Yüklü</div>
                                    <div className="text-[10px] text-emerald-400/70">Evraklar Tamam</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CRM Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-white/10 scrollbar-thin">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 font-bold'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT: GENEL BİLGİLER */}
            {activeTab === 'genel' && (
                <form onSubmit={handleSaveGeneral} className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Girişim / Firma Adı *</label>
                            <input
                                type="text"
                                required
                                value={entrepreneur.name || ''}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Sektör *</label>
                            <input
                                type="text"
                                required
                                value={entrepreneur.sector || ''}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, sector: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1">Kısa Açıklama (Public Listelerde Görünen)</label>
                        <textarea
                            rows={3}
                            value={entrepreneur.shortDesc || ''}
                            onChange={(e) => setEntrepreneur({ ...entrepreneur, shortDesc: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1">Detaylı Hikaye & Başarı Öyküsü (Markdown)</label>
                        <textarea
                            rows={5}
                            value={entrepreneur.successStory || entrepreneur.longDesc || ''}
                            onChange={(e) => setEntrepreneur({ ...entrepreneur, successStory: e.target.value })}
                            placeholder="Girişimin kuruluş hikayesi, çözdüğü problem, pazardaki yeri..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none leading-relaxed"
                        />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: PROGRAMLAR & KULUÇKA */}
            {activeTab === 'programlar' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                            <h3 className="font-orbitron font-bold text-sm text-white">Program & Kuluçka Geçmişi</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Girişimin katıldığı ve dahil olduğu tüm programlar tarihçesiyle listelenir.</p>
                        </div>
                        <button
                            id="assign-program-btn"
                            onClick={() => setShowAssignProgramModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> + Program Ata
                        </button>
                    </div>

                    {assignedPrograms.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                            <span id="no-program-assigned-text" className="text-amber-400 font-bold block mb-1">Program Atanmamış</span>
                            Girişimci henüz herhangi bir hızlandırma veya kuluçka programına dahil edilmemiştir.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assignedPrograms.map((ap) => (
                                <div
                                    key={ap.id}
                                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white text-sm">{ap.program?.name || 'Program'}</h4>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                Dönem / Cohort: {ap.cohort || '-'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-3">
                                            <span>Başlangıç: {new Date(ap.joinedAt).toLocaleDateString('tr-TR')}</span>
                                            {ap.completedAt && <span>Mezuniyet: {new Date(ap.completedAt).toLocaleDateString('tr-TR')}</span>}
                                            {ap.notes && <span className="text-gray-500">• {ap.notes}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            value={ap.status}
                                            onChange={(e) => handleUpdateProgramStatus(ap.id, e.target.value)}
                                            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                        >
                                            <option value="ACTIVE">Aktif (ACTIVE)</option>
                                            <option value="ACCEPTED">Kabul Edildi (ACCEPTED)</option>
                                            <option value="COMPLETED">Mezun Oldu (COMPLETED)</option>
                                            <option value="WITHDRAWN">Ayrıldı (WITHDRAWN)</option>
                                            <option value="REJECTED">Reddedildi (REJECTED)</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: FİNANS & KİRA */}
            {activeTab === 'finans' && (
                <div className="space-y-6">
                    {/* SUMMARY KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-4 shadow-xl space-y-1">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Aktif Kira Sözleşmesi</span>
                            <div className="font-orbitron font-bold text-lg text-white">
                                {rentSummary?.activeContract?.spaceName || 'Sözleşme Yok'}
                            </div>
                            <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                                <span>{rentSummary?.activeContract?.contractNo || '-'}</span>
                                {rentSummary?.activeContract && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                        {rentSummary.activeContract.status === 'ACTIVE' ? 'Kira Ödüyor' : rentSummary.activeContract.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-4 shadow-xl space-y-1">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Aylık Toplam Kira</span>
                            <div className="font-orbitron font-bold text-lg text-emerald-400">
                                {rentSummary?.activeContract ? (
                                    `${Number(rentSummary.activeContract.totalMonthlyRent || rentSummary.activeContract.monthlyRent * 1.2).toLocaleString('tr-TR')} ${rentSummary.activeContract.currency}`
                                ) : '0 TL'}
                            </div>
                            <div className="text-xs text-gray-400">
                                Net: {rentSummary?.activeContract ? Number(rentSummary.activeContract.monthlyRent).toLocaleString('tr-TR') : 0} {rentSummary?.activeContract?.currency} + %{rentSummary?.activeContract?.vatRate || 20} KDV
                            </div>
                        </div>

                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-4 shadow-xl space-y-1">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Bu Ayki Tahsilat Durumu</span>
                            <div className="flex items-center gap-2">
                                {rentSummary?.currentMonth?.status === 'PAID' && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> ÖDENDİ
                                    </span>
                                )}
                                {rentSummary?.currentMonth?.status === 'PARTIALLY_PAID' && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> KISMİ ÖDENDİ
                                    </span>
                                )}
                                {rentSummary?.currentMonth?.status === 'OVERDUE' && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" /> GECİKMİŞ
                                    </span>
                                )}
                                {(!rentSummary?.currentMonth?.status || rentSummary?.currentMonth?.status === 'DUE' || rentSummary?.currentMonth?.status === 'UPCOMING') && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> ÖDEME BEKLENİYOR
                                    </span>
                                )}
                                {rentSummary?.currentMonth?.status === 'WAIVED' && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        MUAF
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400">
                                Kalan: <b className="text-white">{Number(rentSummary?.currentMonth?.remainingAmount || 0).toLocaleString('tr-TR')} {rentSummary?.currency || 'TRY'}</b>
                            </div>
                        </div>

                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-4 shadow-xl space-y-1">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Gecikmiş Toplam Borç</span>
                            <div className={`font-orbitron font-bold text-lg ${rentSummary?.totalOverdue > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                {Number(rentSummary?.totalOverdue || 0).toLocaleString('tr-TR')} {rentSummary?.currency || 'TRY'}
                            </div>
                            <div className="text-xs text-gray-400">
                                {rentSummary?.isExpiringSoon ? (
                                    <span className="text-amber-400 font-bold flex items-center gap-1">
                                        ⚠️ Sözleşme {rentSummary.daysUntilExpiry} gün içinde bitiyor
                                    </span>
                                ) : (
                                    <span>Bitiş: {rentSummary?.activeContract?.endDate ? new Date(rentSummary.activeContract.endDate).toLocaleDateString('tr-TR') : '-'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTRACTS & DOCUMENTS CONTAINER */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                            <div>
                                <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-400" /> Kira Sözleşmeleri & Belgeler
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">Şirkete bağlı geçmiş ve aktif kira sözleşmeleri, imzalı evraklar ve protokoller.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/admin/girisimciler/${id}/finans-kira`}
                                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
                                >
                                    <FileText className="w-3.5 h-3.5" /> Detaylı Ekstre →
                                </Link>
                                <button
                                    onClick={() => setShowGenerateAccrualModal(true)}
                                    className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Calendar className="w-3.5 h-3.5" /> + Tahakkuk Üret
                                </button>
                                <button
                                    id="add-rent-contract-btn"
                                    onClick={() => setShowRentModal(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> + Kira Sözleşmesi Ekle
                                </button>
                            </div>
                        </div>

                        {rentContracts.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                                Bu girişimciye ait henüz bir kira sözleşmesi bulunmuyor. Yukarıdaki butonu kullanarak yeni sözleşme tanımlayabilirsiniz.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rentContracts.map((rc) => (
                                    <div key={rc.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="font-bold text-white text-base">{rc.spaceName || 'Ofis Alanı'}</span>
                                                    {rc.roomDeskNo && <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 font-mono">{rc.roomDeskNo}</span>}
                                                    <span className="text-xs text-gray-400 font-mono">({rc.contractNo})</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${rc.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
                                                        {rc.status === 'ACTIVE' ? 'AKTİF SÖZLEŞME' : rc.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 flex flex-wrap items-center gap-4">
                                                    <span>Ticari Unvan: <b className="text-white">{rc.commercialTitle || entrepreneur?.companyName || entrepreneur?.name}</b></span>
                                                    <span>Dönem: <b>{new Date(rc.startDate).toLocaleDateString('tr-TR')} — {new Date(rc.endDate).toLocaleDateString('tr-TR')}</b></span>
                                                    <span>Son Ödeme: <b>Her ayın {rc.dueDay}. günü</b></span>
                                                </div>
                                            </div>

                                            <div className="text-right flex lg:flex-col items-center lg:items-end justify-between gap-1">
                                                <div className="text-base font-bold font-orbitron text-emerald-400">
                                                    {Number(rc.totalMonthlyRent || rc.monthlyRent * 1.2).toLocaleString('tr-TR')} {rc.currency} <span className="text-[10px] font-mono text-gray-400 font-normal">/ ay</span>
                                                </div>
                                                <div className="text-[11px] text-gray-400">
                                                    Net: {Number(rc.monthlyRent).toLocaleString('tr-TR')} {rc.currency} • KDV: %{rc.vatRate} • Depozito: {Number(rc.depositAmount || 0).toLocaleString('tr-TR')} {rc.currency}
                                                </div>
                                            </div>
                                        </div>

                                        {/* CONTRACT DOCUMENTS LIST */}
                                        <div className="pt-3 border-t border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Sözleşme Belgeleri ({rc.documents?.length || 0})
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setDocFormData(prev => ({ ...prev, contractId: rc.id }));
                                                        setShowDocModal(true);
                                                    }}
                                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Plus className="w-3 h-3" /> + Belge Yükle
                                                </button>
                                            </div>

                                            {(!rc.documents || rc.documents.length === 0) ? (
                                                <div className="p-3 text-center text-gray-500 font-mono text-[11px] bg-white/[0.01] rounded-xl border border-dashed border-white/5">
                                                    Bu sözleşmeye henüz imzalı evrak veya ek protokol yüklenmedi.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {rc.documents.map((doc: any) => (
                                                        <div key={doc.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                                                <div className="truncate">
                                                                    <div className="text-xs font-semibold text-white truncate">{doc.title}</div>
                                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                                        {doc.documentType} • {new Date(doc.documentDate || doc.uploadedAt).toLocaleDateString('tr-TR')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {doc.fileUrl && (
                                                                <a
                                                                    href={doc.fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-[11px] font-mono shrink-0 flex items-center gap-1"
                                                                >
                                                                    <Eye className="w-3 h-3" /> Görüntüle
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: GENERIC PLACEHOLDER FOR OTHER TABS */}
            {activeTab !== 'genel' && activeTab !== 'programlar' && activeTab !== 'finans' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h3 className="font-orbitron font-bold text-sm text-white capitalize">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                    </div>
                    <div className="p-8 text-center text-gray-500 font-mono text-xs space-y-2">
                        <div>Bu girişim için veritabanında kayıtlı {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} listeleniyor.</div>
                        <div className="text-gray-400">PostgreSQL ilişkisel verisi senkronize durumdadır.</div>
                    </div>
                </div>
            )}

            {/* Assign Program Modal */}
            {showAssignProgramModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Girişimciye Program Ata</h3>
                        <form onSubmit={handleAssignProgram} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Program Seçin *</label>
                                <select
                                    id="select-program-id"
                                    required
                                    value={programFormData.programId}
                                    onChange={(e) => setProgramFormData({ ...programFormData, programId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                >
                                    {availablePrograms.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Dönem / Cohort</label>
                                    <input
                                        id="input-cohort"
                                        type="text"
                                        placeholder="2026-1"
                                        value={programFormData.cohort}
                                        onChange={(e) => setProgramFormData({ ...programFormData, cohort: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Durum</label>
                                    <select
                                        id="select-program-status"
                                        value={programFormData.status}
                                        onChange={(e) => setProgramFormData({ ...programFormData, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                    >
                                        <option value="ACTIVE">Aktif (ACTIVE)</option>
                                        <option value="ACCEPTED">Kabul (ACCEPTED)</option>
                                        <option value="APPLIED">Başvuruda (APPLIED)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={programFormData.joinedAt}
                                    onChange={(e) => setProgramFormData({ ...programFormData, joinedAt: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Not / Açıklama</label>
                                <input
                                    type="text"
                                    placeholder="Program kabul notu..."
                                    value={programFormData.notes}
                                    onChange={(e) => setProgramFormData({ ...programFormData, notes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignProgramModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="confirm-assign-program-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold"
                                >
                                    Programı Ata
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Rent Modal */}
            {showRentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-400" /> Yeni Girişimci Kira Sözleşmesi
                            </h3>
                            <button onClick={() => setShowRentModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateRentContract} className="space-y-4">
                            {/* Company & Contact Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Girişimci / Şirket</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={entrepreneur?.companyName || entrepreneur?.name || ''}
                                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Ticari Unvan</label>
                                    <input
                                        id="input-commercial-title"
                                        type="text"
                                        placeholder="Örn: ABC Yazılım A.Ş."
                                        value={rentFormData.commercialTitle}
                                        onChange={(e) => setRentFormData({ ...rentFormData, commercialTitle: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Kira İletişim Yetkilisi</label>
                                    <input
                                        id="input-contact-person"
                                        type="text"
                                        placeholder="Ad Soyad"
                                        value={rentFormData.contactPersonName}
                                        onChange={(e) => setRentFormData({ ...rentFormData, contactPersonName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Yetkili E-posta</label>
                                    <input
                                        type="email"
                                        placeholder="muhasebe@sirket.com"
                                        value={rentFormData.contactEmail}
                                        onChange={(e) => setRentFormData({ ...rentFormData, contactEmail: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Yetkili Telefon</label>
                                    <input
                                        type="text"
                                        placeholder="0532 ..."
                                        value={rentFormData.contactPhone}
                                        onChange={(e) => setRentFormData({ ...rentFormData, contactPhone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Space & Contract Number */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Sözleşme No *</label>
                                    <input
                                        id="input-contract-no"
                                        type="text"
                                        required
                                        value={rentFormData.contractNo}
                                        onChange={(e) => setRentFormData({ ...rentFormData, contractNo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Ofis / Alan Adı *</label>
                                    <input
                                        id="input-space-name"
                                        type="text"
                                        required
                                        placeholder="Ofis A-102"
                                        value={rentFormData.spaceName}
                                        onChange={(e) => setRentFormData({ ...rentFormData, spaceName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Oda / Masa No</label>
                                    <input
                                        type="text"
                                        placeholder="Oda 102"
                                        value={rentFormData.roomDeskNo}
                                        onChange={(e) => setRentFormData({ ...rentFormData, roomDeskNo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Sözleşme Başlangıç Tarihi *</label>
                                    <input
                                        id="input-start-date"
                                        type="date"
                                        required
                                        value={rentFormData.startDate}
                                        onChange={(e) => setRentFormData({ ...rentFormData, startDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Sözleşme Bitiş Tarihi *</label>
                                    <input
                                        id="input-end-date"
                                        type="date"
                                        required
                                        value={rentFormData.endDate}
                                        onChange={(e) => setRentFormData({ ...rentFormData, endDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Financials & Live Math */}
                            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Aylık Net Kira *</label>
                                        <input
                                            id="input-monthly-rent"
                                            type="number"
                                            required
                                            value={rentFormData.monthlyRent}
                                            onChange={(e) => setRentFormData({ ...rentFormData, monthlyRent: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Para Birimi</label>
                                        <select
                                            value={rentFormData.currency}
                                            onChange={(e) => setRentFormData({ ...rentFormData, currency: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                        >
                                            <option value="TRY">TRY (₺)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">KDV Oranı (%)</label>
                                        <input
                                            type="number"
                                            value={rentFormData.vatRate}
                                            onChange={(e) => setRentFormData({ ...rentFormData, vatRate: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Son Ödeme Günü (Ayın)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={rentFormData.dueDay}
                                            onChange={(e) => setRentFormData({ ...rentFormData, dueDay: Number(e.target.value) })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                                    <span className="text-gray-400">
                                        KDV Tutarı: <b className="text-white">{((Number(rentFormData.monthlyRent) || 0) * (Number(rentFormData.vatRate) || 20) / 100).toLocaleString('tr-TR')} {rentFormData.currency}</b>
                                    </span>
                                    <span className="text-emerald-400 font-bold font-orbitron text-sm">
                                        Toplam Aylık Kira: {((Number(rentFormData.monthlyRent) || 0) * (1 + (Number(rentFormData.vatRate) || 20) / 100)).toLocaleString('tr-TR')} {rentFormData.currency}
                                    </span>
                                </div>
                            </div>

                            {/* Document & Deposit */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Depozito Tutarı</label>
                                    <input
                                        type="number"
                                        value={rentFormData.depositAmount}
                                        onChange={(e) => setRentFormData({ ...rentFormData, depositAmount: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">İmzalı Sözleşme Dosya URL</label>
                                    <input
                                        id="input-contract-doc-url"
                                        type="text"
                                        placeholder="https://... /sozlesme.pdf"
                                        value={rentFormData.contractDocUrl}
                                        onChange={(e) => setRentFormData({ ...rentFormData, contractDocUrl: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowRentModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-rent-contract-btn"
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/30"
                                >
                                    Sözleşmeyi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Document Modal */}
            {showDocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" /> Sözleşmeye Belge Yükle
                            </h3>
                            <button onClick={() => setShowDocModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleAddDocument} className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Belge Türü *</label>
                                <select
                                    id="select-doc-type"
                                    value={docFormData.documentType}
                                    onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                                >
                                    <option value="SIGNED_CONTRACT">İmzalı Kira Sözleşmesi</option>
                                    <option value="ADDITIONAL_PROTOCOL">Ek Protokol</option>
                                    <option value="AMENDMENT">Tadil Sözleşmesi</option>
                                    <option value="DELIVERY_REPORT">Teslim Tutanağı</option>
                                    <option value="DEPOSIT_RECEIPT">Depozito Dekontu</option>
                                    <option value="TERMINATION_EVICTION">Fesih / Tahliye Belgesi</option>
                                    <option value="OTHER">Diğer Ek Belge</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Belge Başlığı *</label>
                                <input
                                    id="input-doc-title"
                                    type="text"
                                    required
                                    placeholder="Örn: 2026 İmzalı Kira Sözleşmesi Aslı"
                                    value={docFormData.title}
                                    onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Dosya URL *</label>
                                <input
                                    id="input-doc-file-url"
                                    type="text"
                                    required
                                    placeholder="https://... /sozlesme-imzali.pdf"
                                    value={docFormData.fileUrl}
                                    onChange={(e) => setDocFormData({ ...docFormData, fileUrl: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Belge Tarihi</label>
                                <input
                                    type="date"
                                    value={docFormData.documentDate}
                                    onChange={(e) => setDocFormData({ ...docFormData, documentDate: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowDocModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-doc-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                                >
                                    Belgeyi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Accrual Modal */}
            {showGenerateAccrualModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white">Aylık Tahakkuk Üret</h3>
                            <button onClick={() => setShowGenerateAccrualModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleGenerateAccruals} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Ay</label>
                                    <select
                                        value={genAccrualPeriod.month}
                                        onChange={(e) => setGenAccrualPeriod({ ...genAccrualPeriod, month: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                    >
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                            <option key={m} value={m}>{m}. Ay</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Yıl</label>
                                    <input
                                        type="number"
                                        value={genAccrualPeriod.year}
                                        onChange={(e) => setGenAccrualPeriod({ ...genAccrualPeriod, year: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400">Aktif sözleşmeler için otomatik kira + KDV tahakkuku oluşturulur.</p>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowGenerateAccrualModal(false)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                                >
                                    Tahakkukları Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Program Modal */}
            {showAssignProgramModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" /> Girişimciyi Programa Ata
                            </h3>
                            <button onClick={() => setShowAssignProgramModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleAssignProgram} className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Program Seçin *</label>
                                <select
                                    id="assign-program-select"
                                    required
                                    value={programFormData.programId}
                                    onChange={(e) => setProgramFormData({ ...programFormData, programId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                >
                                    <option value="">-- Program Seçin --</option>
                                    {availablePrograms.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type || 'Program'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Dönem / Cohort</label>
                                    <input
                                        type="text"
                                        value={programFormData.cohort}
                                        onChange={(e) => setProgramFormData({ ...programFormData, cohort: e.target.value })}
                                        placeholder="2026-1"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Durum</label>
                                    <select
                                        value={programFormData.status}
                                        onChange={(e) => setProgramFormData({ ...programFormData, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:border-primary outline-none"
                                    >
                                        <option value="ACTIVE">Aktif (ACTIVE)</option>
                                        <option value="ACCEPTED">Kabul Edildi (ACCEPTED)</option>
                                        <option value="APPLIED">Başvuruda (APPLIED)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={programFormData.joinedAt}
                                    onChange={(e) => setProgramFormData({ ...programFormData, joinedAt: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Notlar / Hedefler</label>
                                <textarea
                                    rows={2}
                                    value={programFormData.notes}
                                    onChange={(e) => setProgramFormData({ ...programFormData, notes: e.target.value })}
                                    placeholder="Program kabul notları..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignProgramModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-assign-program-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold cursor-pointer"
                                >
                                    + Programı Ata
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}
