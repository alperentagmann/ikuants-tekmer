"use client";
import React, { useState, useEffect } from 'react';
import {
    Calendar, Plus, Search, MapPin, Users, QrCode, Clock,
    CheckCircle2, ExternalLink, Trash2, Edit, UserCheck
} from 'lucide-react';

interface EventItem {
    id: string;
    title: string;
    slug: string;
    startDate: string;
    endDate?: string;
    location?: string;
    eventType: string;
    quota?: number;
    coverImage?: string;
    status: string;
    sessions?: Array<{ id: string; title: string; startTime: string }>;
    speakers?: Array<{ id: string; name: string; title?: string }>;
    _count?: { registrations: number };
}

export default function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEventForCheckin, setSelectedEventForCheckin] = useState<EventItem | null>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [checkinLoading, setCheckinLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [location, setLocation] = useState('');
    const [eventType, setEventType] = useState('PHYSICAL');
    const [quota, setQuota] = useState('');
    const [description, setDescription] = useState('');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/events?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [search]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startDate) return;

        try {
            const res = await fetch('/api/admin/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    startDate,
                    location,
                    eventType,
                    quota: quota ? Number(quota) : undefined,
                    description,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setTitle('');
                setStartDate('');
                setLocation('');
                setQuota('');
                setDescription('');
                fetchEvents();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenCheckin = async (event: EventItem) => {
        setSelectedEventForCheckin(event);
        setCheckinLoading(true);
        try {
            const res = await fetch(`/api/admin/events/${event.id}`);
            const data = await res.json();
            if (data.success) {
                setRegistrations(data.event.registrations || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCheckinLoading(false);
        }
    };

    const handlePerformCheckin = async (registrationId: string) => {
        if (!selectedEventForCheckin) return;
        try {
            const res = await fetch(`/api/admin/events/${selectedEventForCheckin.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'checkin', registrationId }),
            });
            const data = await res.json();
            if (data.success) {
                setRegistrations((prev) =>
                    prev.map((r) => (r.id === registrationId ? { ...r, status: 'CHECKED_IN' } : r))
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-primary" />
                        Etkinlik Yönetimi & Katılımcı Check-in
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Çok oturumlu etkinlikler, konuşmacı havuzu, bilet/kayıt yönetimi ve kapı QR check-in operasyonları.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Etkinlik Oluştur
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-between bg-[#090912] p-3 rounded-2xl border border-white/10">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Etkinlik veya mekan ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Etkinlikler yükleniyor...</div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl space-y-3">
                    <Calendar className="w-10 h-10 text-gray-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">Henüz etkinlik oluşturulmadı</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((ev) => (
                        <div
                            key={ev.id}
                            className="bg-[#090912] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-primary/40 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-primary/20 text-primary border border-primary/30">
                                        {ev.eventType}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        {new Date(ev.startDate).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm text-white line-clamp-2">{ev.title}</h3>
                                {ev.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="truncate">{ev.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1 text-gray-300 font-mono">
                                    <Users className="w-3.5 h-3.5 text-primary" />
                                    <span>{ev._count?.registrations || 0} / {ev.quota || '∞'}</span>
                                </div>
                                <button
                                    onClick={() => handleOpenCheckin(ev)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold flex items-center gap-1.5 text-xs transition-all"
                                >
                                    <QrCode className="w-3.5 h-3.5 text-primary" />
                                    Katılımcılar & Check-in
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Yeni Etkinlik Oluştur</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Etkinlik Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Yapay Zeka ve Girişimcilik Zirvesi 2026"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Başlangıç Tarihi *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Format</label>
                                    <select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="PHYSICAL">Fiziksel</option>
                                        <option value="ONLINE">Online</option>
                                        <option value="HYBRID">Hibrit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Mekan / Salon</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Örn: Önder Öztunalı Konferans Salonu"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Kontenjan</label>
                                    <input
                                        type="number"
                                        value={quota}
                                        onChange={(e) => setQuota(e.target.value)}
                                        placeholder="100"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Açıklama & Gündem</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Etkinlik hakkında detaylı bilgi..."
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
                                    Etkinliği Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Check-in Modal */}
            {selectedEventForCheckin && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-start justify-between border-b border-white/10 pb-3">
                            <div>
                                <h3 className="font-orbitron font-bold text-white text-base">{selectedEventForCheckin.title}</h3>
                                <p className="text-gray-400 text-[11px] mt-0.5">Katılımcı Listesi ve Kapı Giriş (Check-in) Yönetimi</p>
                            </div>
                            <button onClick={() => setSelectedEventForCheckin(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {checkinLoading ? (
                            <div className="text-center py-10 font-mono text-gray-400">Katılımcılar yükleniyor...</div>
                        ) : registrations.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Bu etkinliğe henüz kayıtlı katılımcı bulunmuyor.</div>
                        ) : (
                            <div className="space-y-2">
                                {registrations.map((reg) => (
                                    <div
                                        key={reg.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5"
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{reg.fullName}</div>
                                            <div className="text-[10px] text-gray-400">{reg.email} • {reg.phone || '-'}</div>
                                            <div className="text-[9px] font-mono text-primary mt-0.5">Kod: {reg.qrCode}</div>
                                        </div>
                                        <div>
                                            {reg.status === 'CHECKED_IN' ? (
                                                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Giriş Yapıldı
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handlePerformCheckin(reg.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                    Giriş Onayla
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
