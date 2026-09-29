"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Mail, Calendar, Building2, User, Clock, Check, X, MessageSquare, AlertCircle } from 'lucide-react';

export default function AdminIletisimPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'MESSAGE' | 'MEETING' | 'VISIT'>('all');
    const [selectedContact, setSelectedContact] = useState<any | null>(null);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const url = activeTab === 'all' ? '/api/admin/contacts' : `/api/admin/contacts?type=${activeTab}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setContacts(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [activeTab]);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/contacts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchContacts();
                if (selectedContact?.id === id) {
                    setSelectedContact({ ...selectedContact, status });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'fullName',
            header: 'Kişi / Gönderen',
            render: (item) => (
                <div>
                    <div className="font-semibold text-white">{item.fullName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{item.email}</div>
                </div>
            ),
        },
        {
            key: 'requestType',
            header: 'Talep Türü',
            render: (item) => (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400">
                    {item.requestType === 'MESSAGE' ? 'Mesaj' :
                     item.requestType === 'MEETING' ? 'Toplantı Talebi' : 'Merkez Ziyareti'}
                </span>
            ),
        },
        {
            key: 'topicOrCompany',
            header: 'Konu / Şirket',
            render: (item) => (
                <span className="text-gray-300">
                    {item.meetingTopic || item.visitTopic || item.company || '-'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Durum',
            render: (item) => <StatusBadge status={item.status} />,
        },
        {
            key: 'createdAt',
            header: 'Tarih',
            render: (item) => (
                <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">İletişim & Randevu Talepleri (CRM)</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        /iletisim sayfasından gelen mesajlar, toplantı rezervasyonları ve merkez ziyaretleri
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-[#0e0e18] p-1 rounded-xl border border-white/10 text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setActiveTab('MESSAGE')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'MESSAGE' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Mesajlar
                    </button>
                    <button
                        onClick={() => setActiveTab('MEETING')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'MEETING' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Toplantılar
                    </button>
                    <button
                        onClick={() => setActiveTab('VISIT')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'VISIT' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Ziyaretler
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                data={contacts}
                columns={columns}
                searchPlaceholder="İsim, e-posta veya konu ara..."
                exportFileName="ikuants-talepler"
                onRowClick={(item) => setSelectedContact(item)}
            />

            {/* Detail Drawer / Modal */}
            {selectedContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-xl bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                                <h3 className="font-orbitron font-bold text-lg">{selectedContact.fullName}</h3>
                                <div className="text-xs font-mono text-gray-400">{selectedContact.email} • {selectedContact.phone || '-'}</div>
                            </div>
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {selectedContact.company && (
                            <div className="text-xs text-gray-300">
                                <span className="font-mono text-gray-500">Kuruluş / Şirket:</span> {selectedContact.company}
                            </div>
                        )}

                        {selectedContact.message && (
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs leading-relaxed text-gray-200">
                                <div className="font-mono text-gray-500 text-[10px] mb-1 font-bold uppercase">Mesaj İçeriği</div>
                                {selectedContact.message}
                            </div>
                        )}

                        {(selectedContact.meetingDate || selectedContact.visitDate) && (
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/30 border border-white/5 text-xs font-mono">
                                <div>
                                    <span className="text-gray-500">Talep Edilen Tarih:</span> {selectedContact.meetingDate || selectedContact.visitDate}
                                </div>
                                <div>
                                    <span className="text-gray-500">Saat / Grup:</span> {selectedContact.meetingTime || selectedContact.visitTime || selectedContact.groupSize || '-'}
                                </div>
                            </div>
                        )}

                        {/* Status Change Buttons */}
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-xs font-mono text-gray-400">
                                Durum: <StatusBadge status={selectedContact.status} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleUpdateStatus(selectedContact.id, 'CONFIRMED')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                                >
                                    Onayla
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedContact.id, 'RESPONDED')}
                                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors"
                                >
                                    Yanıtlandı
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedContact.id, 'CANCELLED')}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                                >
                                    İptal Et
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
