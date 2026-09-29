"use client";
import React, { useState, useEffect } from 'react';
import {
    CheckSquare, Plus, Filter, Search, Calendar as CalendarIcon,
    Clock, User, AlertCircle, CheckCircle2, MoreVertical,
    MessageSquare, Trash2, ArrowUpDown, ChevronRight, LayoutGrid, List
} from 'lucide-react';

interface TaskItem {
    id: string;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string;
    createdBy?: { name: string };
    assignees?: Array<{ user: { id: string; name: string } }>;
    checklist?: Array<{ id: string; title: string; isCompleted: boolean }>;
    _count?: { comments: number; attachments: number };
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [scope, setScope] = useState<'all' | 'assigned_to_me' | 'my_team' | 'created_by_me' | 'overdue' | 'today'>('all');
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

    // New task form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState('MEDIUM');
    const [newDueDate, setNewDueDate] = useState('');
    const [newChecklist, setNewChecklist] = useState<string[]>(['']);
    const [commentText, setCommentText] = useState('');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (scope) params.append('scope', scope);
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/tasks?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setTasks(data.tasks);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [scope, search]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const validChecklist = newChecklist.filter(c => c.trim().length > 0);
            const res = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc,
                    priority: newPriority,
                    dueDate: newDueDate || undefined,
                    checklist: validChecklist.length > 0 ? validChecklist : undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setNewTitle('');
                setNewDesc('');
                setNewPriority('MEDIUM');
                setNewDueDate('');
                setNewChecklist(['']);
                fetchTasks();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchTasks();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleChecklist = async (checklistItemId: string, isCompleted: boolean) => {
        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: selectedTask?.id, checklistItemId, isCompleted }),
            });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !commentText.trim()) return;

        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: selectedTask.id, comment: commentText }),
            });
            setCommentText('');
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'HIGH': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const columns = [
        { id: 'TODO', title: 'Yapılacak', color: 'border-t-blue-500' },
        { id: 'IN_PROGRESS', title: 'Devam Eden', color: 'border-t-amber-500' },
        { id: 'IN_REVIEW', title: 'İncelemede', color: 'border-t-purple-500' },
        { id: 'COMPLETED', title: 'Tamamlanan', color: 'border-t-emerald-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                        <CheckSquare className="w-7 h-7 text-primary" />
                        Görev & To-Do Yönetimi
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Ekip görev atamaları, Kanban takibi, kontrol listeleri ve operasyonel iş birlikleri.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#090912] border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                                viewMode === 'kanban' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline">Kanban</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                                viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden sm:inline">Liste</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Görev
                    </button>
                </div>
            </div>

            {/* Scope Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090912] p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                        { id: 'all', label: 'Tüm Görevler' },
                        { id: 'assigned_to_me', label: 'Bana Atananlar' },
                        { id: 'my_team', label: 'Ekibimin Görevleri' },
                        { id: 'created_by_me', label: 'Oluşturduklarım' },
                        { id: 'overdue', label: 'Gecikenler' },
                        { id: 'today', label: 'Bugün' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setScope(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                scope === tab.id
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
                        placeholder="Görev ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Kanban / List Views */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Görevler yükleniyor...</div>
            ) : viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {columns.map((col) => {
                        const colTasks = tasks.filter((t) => t.status === col.id);
                        return (
                            <div
                                key={col.id}
                                className={`bg-[#0d0d18] border border-white/10 rounded-2xl p-4 flex flex-col min-h-[500px] border-t-4 ${col.color}`}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                                    <span className="font-semibold text-xs text-white">{col.title}</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                                        {colTasks.length}
                                    </span>
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto">
                                    {colTasks.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => setSelectedTask(t)}
                                            className="p-3.5 rounded-xl bg-[#141424] hover:bg-[#1a1a30] border border-white/5 hover:border-primary/40 cursor-pointer transition-all shadow-sm space-y-2.5"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-xs font-semibold text-white line-clamp-2">{t.title}</h4>
                                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getPriorityColor(t.priority)}`}>
                                                    {t.priority}
                                                </span>
                                            </div>

                                            {t.description && (
                                                <p className="text-[11px] text-gray-400 line-clamp-2">{t.description}</p>
                                            )}

                                            {t.checklist && t.checklist.length > 0 && (
                                                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                                                    <CheckSquare className="w-3 h-3 text-primary" />
                                                    <span>
                                                        {t.checklist.filter(c => c.isCompleted).length} / {t.checklist.length} alt görev
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : 'Tarih yok'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {t._count?.comments ? (
                                                        <span className="flex items-center gap-0.5">
                                                            <MessageSquare className="w-3 h-3" /> {t._count.comments}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div className="text-center py-10 text-[11px] text-gray-600">Bu aşamada görev yok</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-[#090912] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-black/40 text-gray-400 text-[10px] font-mono uppercase border-b border-white/10">
                            <tr>
                                <th className="p-4">Görev</th>
                                <th className="p-4">Öncelik</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4">Son Tarih</th>
                                <th className="p-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.map((t) => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-white">{t.title}</div>
                                        <div className="text-[10px] text-gray-500 line-clamp-1">{t.description || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPriorityColor(t.priority)}`}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={t.status}
                                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                        >
                                            <option value="TODO">Yapılacak</option>
                                            <option value="IN_PROGRESS">Devam Eden</option>
                                            <option value="IN_REVIEW">İncelemede</option>
                                            <option value="COMPLETED">Tamamlandı</option>
                                        </select>
                                    </td>
                                    <td className="p-4 font-mono text-[11px]">
                                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedTask(t)}
                                            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-white transition-colors"
                                        >
                                            Detay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Yeni Görev Oluştur</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-400 mb-1">Görev Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Örn: ANTsPARK 1. Hafta sunumlarının hazırlanması"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Açıklama</label>
                                <textarea
                                    rows={3}
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Göreve ait detaylar ve hedefler..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Öncelik</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="LOW">Düşük</option>
                                        <option value="MEDIUM">Orta</option>
                                        <option value="HIGH">Yüksek</option>
                                        <option value="URGENT">Acil</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Son Tarih</label>
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Kontrol Listesi (Checklist)</label>
                                <div className="space-y-2">
                                    {newChecklist.map((item, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            value={item}
                                            onChange={(e) => {
                                                const updated = [...newChecklist];
                                                updated[idx] = e.target.value;
                                                setNewChecklist(updated);
                                            }}
                                            placeholder={`Alt görev ${idx + 1}...`}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white focus:outline-none"
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setNewChecklist([...newChecklist, ''])}
                                        className="text-[11px] text-primary hover:underline"
                                    >
                                        + Alt görev ekle
                                    </button>
                                </div>
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
                                    Görevi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-start justify-between border-b border-white/10 pb-3">
                            <div>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${getPriorityColor(selectedTask.priority)}`}>
                                    {selectedTask.priority}
                                </span>
                                <h3 className="font-orbitron font-bold text-white text-lg mt-1">{selectedTask.title}</h3>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {selectedTask.description && (
                            <p className="text-gray-300 bg-white/5 p-3 rounded-xl">{selectedTask.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 bg-black/40 p-3 rounded-xl">
                            <div>
                                <span className="text-gray-500 block text-[10px]">Durum:</span>
                                <select
                                    value={selectedTask.status}
                                    onChange={(e) => {
                                        handleStatusChange(selectedTask.id, e.target.value);
                                        setSelectedTask({ ...selectedTask, status: e.target.value as any });
                                    }}
                                    className="bg-black border border-white/10 rounded-lg p-1.5 text-white mt-1 w-full"
                                >
                                    <option value="TODO">Yapılacak</option>
                                    <option value="IN_PROGRESS">Devam Eden</option>
                                    <option value="IN_REVIEW">İncelemede</option>
                                    <option value="COMPLETED">Tamamlandı</option>
                                </select>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-[10px]">Son Tarih:</span>
                                <span className="text-white font-mono mt-1 block">
                                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                                </span>
                            </div>
                        </div>

                        {/* Checklist */}
                        {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-white">Kontrol Listesi</h4>
                                <div className="space-y-1.5">
                                    {selectedTask.checklist.map((c) => (
                                        <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-black/30 cursor-pointer hover:bg-black/50">
                                            <input
                                                type="checkbox"
                                                checked={c.isCompleted}
                                                onChange={(e) => handleToggleChecklist(c.id, e.target.checked)}
                                                className="rounded border-white/20 text-primary focus:ring-0"
                                            />
                                            <span className={c.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}>
                                                {c.title}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="space-y-3 pt-3 border-t border-white/10">
                            <h4 className="font-semibold text-white flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Yorumlar
                            </h4>
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Yorum ekle..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2 text-white focus:outline-none"
                                />
                                <button type="submit" className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold">
                                    Gönder
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
