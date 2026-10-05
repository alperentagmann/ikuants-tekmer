'use client';

import React, { useState, useEffect } from 'react';
import { MyWorkStrip } from '@/components/admin/work/MyWorkStrip';
import Link from 'next/link';
import {
    Sun,
    CheckCircle2,
    Clock,
    Calendar,
    FileText,
    Bell,
    AlertCircle,
    Plus,
    Share2,
    ArrowRight,
    Star,
    Video,
    Trash2,
    CheckSquare,
    ExternalLink
} from 'lucide-react';

export default function BenimGunumPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'TODOS' | 'INTERACTIONS' | 'NOTES' | 'REMINDERS'>('TODOS');
    const [todayInteractions, setTodayInteractions] = useState<any[]>([]);

    const fetchInteractionsData = async () => {
        try {
            const res = await fetch('/api/admin/interactions');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTodayInteractions(data);
            }
        } catch {
            // handle
        }
    };

    useEffect(() => {
        fetchInteractionsData();
    }, []);

    // To-Do Form State
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoPriority, setNewTodoPriority] = useState('MEDIUM');
    const [newTodoCategory, setNewTodoCategory] = useState('GENERAL');

    // Note Form State
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);

    // Reminder Form State
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [newReminderTime, setNewReminderTime] = useState('');
    const [showReminderModal, setShowReminderModal] = useState(false);

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/workspace/my-day');
            const data = await res.json();
            if (data.success) {
                setSummary(data);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Çalışma alanı verileri yüklenirken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const handleCreateTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoTitle.trim()) return;
        try {
            const res = await fetch('/api/admin/workspace/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTodoTitle,
                    priority: newTodoPriority,
                    category: newTodoCategory,
                    dueDate: new Date().toISOString(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewTodoTitle('');
                fetchSummary();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Görev eklenemedi.' });
        }
    };

    const handleToggleTodo = async (id: string) => {
        try {
            await fetch('/api/admin/workspace/todos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchSummary();
        } catch {
            // handle error
        }
    };

    const handleConvertToTask = async (id: string) => {
        try {
            const res = await fetch('/api/admin/workspace/todos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'CONVERT_TO_TASK' }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: 'Kişisel To-Do genel görev sistemine aktarıldı.' });
                fetchSummary();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Dönüştürme başarısız oldu.' });
        }
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/workspace/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newNoteTitle,
                    content: newNoteContent,
                    isShared: false,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewNoteTitle('');
                setNewNoteContent('');
                setShowNoteModal(false);
                fetchSummary();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Not kaydedilemedi.' });
        }
    };

    const handleCreateReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/workspace/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newReminderTitle,
                    remindAt: newReminderTime || new Date(Date.now() + 3600000).toISOString(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewReminderTitle('');
                setNewReminderTime('');
                setShowReminderModal(false);
                fetchSummary();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Hatırlatma kaydedilemedi.' });
        }
    };

    const todayStr = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Sun className="w-4 h-4" />
                        <span>Kişisel Çalışma Alanı</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Benim Günüm</h1>
                    <p className="text-slate-400 text-sm mt-1">{todayStr}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowReminderModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>Hatırlat</span>
                    </button>
                    <button
                        onClick={() => setShowNoteModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>Hızlı Not</span>
                    </button>
                    <Link
                        href="/admin/raporlar/gunluk"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-950/40"
                    >
                        <span>Günlük Rapor Oluştur</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            <MyWorkStrip />

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-slate-400 font-medium">Bugünkü To-Do</span>
                    <p className="text-2xl font-bold text-white mt-1">{summary?.summaryStats?.totalTodayTodos || 0}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-rose-400 font-medium">Geciken Görevler</span>
                    <p className="text-2xl font-bold text-rose-300 mt-1">{summary?.summaryStats?.totalOverdueTodos || 0}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-cyan-400 font-medium">Bugünkü Toplantılar</span>
                    <p className="text-2xl font-bold text-cyan-300 mt-1">{summary?.summaryStats?.totalTodayMeetings || 0}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-amber-400 font-medium">Bekleyen Onaylar</span>
                    <p className="text-2xl font-bold text-amber-300 mt-1">{summary?.summaryStats?.totalPendingApprovals || 0}</p>
                </div>
            </div>

            {/* Main Grid: Left side Today's To-Do & Actions, Right side Calendar & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Interactive Hub */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                        <button
                            onClick={() => setActiveTab('TODOS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'TODOS' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Kişisel To-Do</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('INTERACTIONS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'INTERACTIONS' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Görüşmeler & Ziyaretler ({todayInteractions.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('NOTES')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'NOTES' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Hızlı Notlar</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('REMINDERS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'REMINDERS' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Hatırlatmalar</span>
                        </button>
                    </div>

                    {/* Tab: Kişisel To-Do */}
                    {activeTab === 'TODOS' && (
                        <div className="space-y-4">
                            {/* Quick Add Bar */}
                            <form onSubmit={handleCreateTodo} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="+ Yeni bir to-do yazıp Enter'a basın..."
                                    value={newTodoTitle}
                                    onChange={(e) => setNewTodoTitle(e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors"
                                >
                                    Ekle
                                </button>
                            </form>

                            {/* To-Do List */}
                            <div className="space-y-2">
                                {summary?.todayTodos?.map((todo: any) => (
                                    <div
                                        key={todo.id}
                                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between group hover:border-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleToggleTodo(todo.id)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${todo.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 hover:border-cyan-500'}`}
                                            >
                                                {todo.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </button>
                                            <span className={`text-sm ${todo.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                                {todo.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${todo.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {todo.priority}
                                            </span>
                                            {!todo.convertedTaskId && (
                                                <button
                                                    onClick={() => handleConvertToTask(todo.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-xs text-cyan-400 hover:underline px-2 py-1 transition-opacity"
                                                >
                                                    Göreve Dönüştür
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(!summary?.todayTodos || summary.todayTodos.length === 0) && (
                                    <p className="text-slate-500 text-xs text-center py-6">Bugün için bekleyen özel to-do bulunmuyor.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Görüşmeler & Ziyaretler */}
                    {activeTab === 'INTERACTIONS' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Bugünkü Görüşmeler & Ziyaretçi Kayıtları</span>
                                <Link
                                    href="/admin/gorusmeler"
                                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                                >
                                    <span>Tüm Görüşmeleri Aç</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="space-y-2">
                                {todayInteractions.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-white">{item.personName}</span>
                                                {item.organizationName && (
                                                    <span className="text-xs text-slate-400">• {item.organizationName}</span>
                                                )}
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    {item.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 mt-1">{item.subject}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {item.followUpDate && (
                                                <span className="text-[10px] text-amber-400 font-medium">
                                                    Takip: {new Date(item.followUpDate).toLocaleDateString('tr-TR')}
                                                </span>
                                            )}
                                            <Link
                                                href="/admin/gorusmeler"
                                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                                            >
                                                Detay
                                            </Link>
                                        </div>
                                    </div>
                                ))}

                                {todayInteractions.length === 0 && (
                                    <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                                        <p className="text-slate-500 text-xs">Bugün için kaydedilmiş görüşme veya ziyaret bulunmuyor.</p>
                                        <Link
                                            href="/admin/gorusmeler"
                                            className="inline-block mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                                        >
                                            + Yeni Görüşme Kaydı Oluştur
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'NOTES' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {summary?.personalNotes?.map((note: any) => (
                                <div key={note.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold text-white text-sm mb-2">{note.title}</h4>
                                        <p className="text-slate-300 text-xs line-clamp-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                    <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                                        <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
                                        {note.isShared && <span className="text-cyan-400">Paylaşımlı</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Hatırlatmalar */}
                    {activeTab === 'REMINDERS' && (
                        <div className="space-y-3">
                            {summary?.activeReminders?.map((rem: any) => (
                                <div key={rem.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                        <div>
                                            <p className="text-sm font-medium text-white">{rem.title}</p>
                                            <span className="text-xs text-slate-400">{new Date(rem.remindAt).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right 1 Col: Meetings, Quick Actions & Recent Items */}
                <div className="space-y-6">
                    {/* Today's Meetings & Teams Links */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <span>Bugünkü Oturumlar & Toplantılar</span>
                        </h3>

                        <div className="space-y-3">
                            {summary?.todayEvents?.map((ev: any) => (
                                <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-white truncate">{ev.title}</span>
                                    <span className="text-[11px] text-slate-400">{new Date(ev.startDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {ev.location || 'Online'}</span>
                                    {ev.onlineMeetingUrl && (
                                        <a
                                            href={ev.onlineMeetingUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold mt-1"
                                        >
                                            <Video className="w-3.5 h-3.5" />
                                            <span>Teams&apos;te Katıl</span>
                                        </a>
                                    )}
                                </div>
                            ))}

                            {(!summary?.todayEvents || summary.todayEvents.length === 0) && (
                                <p className="text-slate-500 text-xs">Bugün planlanmış oturum bulunmuyor.</p>
                            )}
                        </div>
                    </div>

                    {/* Son Görüntülenenler & Favoriler */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span>Son Ziyaret Edilenler</span>
                        </h3>

                        <div className="space-y-2">
                            {summary?.recentItems?.slice(0, 5).map((rec: any) => (
                                <Link
                                    key={rec.id}
                                    href={rec.url}
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors border border-slate-800/50"
                                >
                                    <span className="truncate">{rec.title}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                                </Link>
                            ))}

                            {(!summary?.recentItems || summary.recentItems.length === 0) && (
                                <p className="text-slate-500 text-xs">Henüz geçmiş kayıt bulunmuyor.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full">
                        <h3 className="text-lg font-bold text-white mb-4">Hızlı Not Ekle</h3>
                        <form onSubmit={handleCreateNote} className="space-y-4">
                            <input
                                type="text"
                                required
                                placeholder="Not Başlığı"
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                            <textarea
                                required
                                rows={5}
                                placeholder="Not içeriğinizi buraya yazın..."
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNoteModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
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
