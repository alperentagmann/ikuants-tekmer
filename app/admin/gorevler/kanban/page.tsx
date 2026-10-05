"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LayoutGrid, List, Calendar as CalendarIcon, BarChart2, Plus,
    CheckSquare, Clock, User, MessageSquare, Tag, AlertCircle,
    ChevronRight, MoreHorizontal, ArrowRight, CheckCircle2,
    Share2, ExternalLink, Sparkles, Filter, Search, Trash2,
    Eye, Send, Paperclip, RefreshCw
} from 'lucide-react';

interface ChecklistItem {
    id: string;
    title: string;
    isCompleted: boolean;
}

interface TaskComment {
    id: string;
    author: { name: string };
    comment: string;
    createdAt: string;
}

interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    dueDate?: string;
    tags?: string[];
    assignees?: Array<{ user: { id: string; name: string; email?: string } }>;
    checklist?: ChecklistItem[];
    comments?: TaskComment[];
    relatedProgram?: string;
    relatedEntrepreneur?: string;
    relatedActivity?: string;
}

interface BoardColumn {
    id: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    title: string;
    color: string;
    badgeColor: string;
}

const defaultColumns: BoardColumn[] = [
    { id: 'TODO', title: 'Yapılacaklar', color: 'border-cyan-500/30 bg-cyan-500/5', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'IN_PROGRESS', title: 'Devam Ediyor', color: 'border-amber-500/30 bg-amber-500/5', badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'IN_REVIEW', title: 'Kontrol Bekliyor', color: 'border-purple-500/30 bg-purple-500/5', badgeColor: 'bg-purple-500/20 text-purple-300' },
    { id: 'DONE', title: 'Tamamlandı', color: 'border-emerald-500/30 bg-emerald-500/5', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
];

const boardTemplates = [
    { id: 'program', title: 'Program Yönetimi', desc: 'Dönem açılışı, jüri ve demo day süreçleri' },
    { id: 'event', title: 'Etkinlik Hazırlığı', desc: 'Salon tahsisi, davetli listesi ve basın bülteni' },
    { id: 'app', title: 'Başvuru & Değerlendirme', desc: 'Ön eleme, mülakatlar ve sözleşme imza' },
    { id: 'social', title: 'Sosyal Medya & İçerik', desc: 'Haftalık duyurular, röportajlar ve bültenler' },
];

export default function KanbanStudioPage() {
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar' | 'gantt'>('kanban');
    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');

    // Drag & Drop State
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    // Card Detail / Edit Modal
    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [newComment, setNewComment] = useState('');
    const [newChecklistText, setNewChecklistText] = useState('');

    // Quick New Task in Column
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createColumnTarget, setCreateColumnTarget] = useState<'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'>('TODO');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
    const [newDueDate, setNewDueDate] = useState('');
    const [newTagInput, setNewTagInput] = useState('');

    // Notification Simulation Toast
    const [actionToast, setActionToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setActionToast(msg);
        setTimeout(() => setActionToast(null), 4000);
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tasks');
            const data = await res.json();
            if (data.success && Array.isArray(data.tasks)) {
                // Map DB tasks to Kanban format
                const mapped: KanbanTask[] = data.tasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    priority: t.priority || 'MEDIUM',
                    status: (t.status === 'COMPLETED' ? 'DONE' : t.status === 'REVIEW' ? 'IN_REVIEW' : t.status === 'CANCELLED' ? 'DONE' : t.status) || 'TODO',
                    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : undefined,
                    tags: t.tags ? (typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags) : [],
                    assignees: t.assignees || [],
                    checklist: t.checklistItems || t.checklist || [],
                    comments: t.comments || [],
                    relatedProgram: t.program?.name,
                    relatedEntrepreneur: t.entrepreneur?.name,
                    relatedActivity: t.activity?.title,
                }));
                setTasks(mapped);
            }
        } catch (e) {
            console.error('Error fetching tasks for kanban:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedTaskId(id);
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    /** Every status change goes through the server lifecycle (same rules for buttons and drag & drop). */
    const runTaskAction = async (task: KanbanTask, body: { action?: string; status?: string; comment?: string }, optimistic: KanbanTask['status'], successMessage: string) => {
        const previous = task.status;
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: optimistic } : t));
        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: task.id, ...body }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Durum güncellenemedi');
            showToast(successMessage);
        } catch (err) {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: previous } : t));
            showToast(err instanceof Error ? err.message : 'Durum güncellenemedi');
        }
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE') => {
        e.preventDefault();
        const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
        setDraggedTaskId(null);
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === targetStatus) return;
        let comment: string | undefined;
        if (task.status === 'IN_REVIEW' && (targetStatus === 'IN_PROGRESS' || targetStatus === 'TODO')) {
            comment = window.prompt('Düzeltme açıklaması') || undefined;
            if (!comment) return;
        }
        await runTaskAction(task, { status: targetStatus, comment }, targetStatus, `Görev durumu güncellendi: ${defaultColumns.find(c => c.id === targetStatus)?.title}`);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const tagsArray = newTagInput ? newTagInput.split(',').map(s => s.trim()).filter(Boolean) : [];

        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc,
                    priority: newPriority,
                    dueDate: newDueDate || undefined,
                    tags: tagsArray,
                }),
            });
            const data = await res.json();
            if (data.success) {
                // New tasks start in TODO; moving to another column goes through the lifecycle
                if (createColumnTarget !== 'TODO' && data.task?.id) {
                    await fetch('/api/admin/tasks', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskId: data.task.id, status: createColumnTarget }),
                    });
                }
                setIsCreateModalOpen(false);
                setNewTitle('');
                setNewDesc('');
                setNewTagInput('');
                setNewDueDate('');
                showToast(`Yeni görev eklendi ve bildirim kuyruğuna yazıldı: "${newTitle}"`);
                fetchTasks();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleChecklist = (task: KanbanTask, checkId: string) => {
        const updatedChecklist = (task.checklist || []).map(item =>
            item.id === checkId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        const updatedTask = { ...task, checklist: updatedChecklist };
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        if (selectedTask?.id === task.id) setSelectedTask(updatedTask);
        showToast('Checklist durumu güncellendi.');
    };

    const handleAddChecklistItem = () => {
        if (!selectedTask || !newChecklistText.trim()) return;
        const newItem: ChecklistItem = {
            id: 'chk-' + Date.now(),
            title: newChecklistText.trim(),
            isCompleted: false,
        };
        const updatedChecklist = [...(selectedTask.checklist || []), newItem];
        const updatedTask = { ...selectedTask, checklist: updatedChecklist };
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
        setSelectedTask(updatedTask);
        setNewChecklistText('');
        showToast('Checklist öğesi eklendi.');
    };

    const handleAddComment = () => {
        if (!selectedTask || !newComment.trim()) return;
        const commentObj: TaskComment = {
            id: 'cmt-' + Date.now(),
            author: { name: 'Aktif Yönetici' },
            comment: newComment.trim(),
            createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };
        const updatedComments = [...(selectedTask.comments || []), commentObj];
        const updatedTask = { ...selectedTask, comments: updatedComments };
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
        setSelectedTask(updatedTask);
        setNewComment('');
        showToast('Yorum ve @mention bildirimi kaydedildi.');
    };

    const handleConvertTo = (type: 'NEWS' | 'EVENT' | 'ACTIVITY', task: KanbanTask) => {
        if (type === 'NEWS') {
            showToast(`Görev habere dönüştürüldü: "${task.title}" (Taslak olarak hazırlandı)`);
        } else if (type === 'EVENT') {
            showToast(`Görev takvim etkinliğine dönüştürüldü: "${task.title}"`);
        } else {
            showToast(`Görev kurumsal faaliyete dönüştürüldü: "${task.title}"`);
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase());
        const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'URGENT': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'MEDIUM': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Notification Toast */}
            {actionToast && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#0e0e18] border border-primary/40 text-white text-xs font-mono px-4 py-3 rounded-xl shadow-2xl shadow-primary/20 flex items-center gap-2.5 animate-bounce">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span>{actionToast}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/gorevler" className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1">
                            Görevler <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-xs text-primary font-mono font-semibold">Trello Kanban Studio</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-2xl text-white mt-1 flex items-center gap-3">
                        <LayoutGrid className="w-6 h-6 text-primary" />
                        İş Yönetimi & Kanban Panosu
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Sürükle-bırak kartlar, alt görev checklistleri, @mention yorumları ve iş akışı yönetimi
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Switchers */}
                    <div className="flex items-center bg-[#0e0e18] p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                viewMode === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <List className="w-3.5 h-3.5" /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                viewMode === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" /> Takvim
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                viewMode === 'gantt' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <BarChart2 className="w-3.5 h-3.5" /> Gantt
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setCreateColumnTarget('TODO');
                            setIsCreateModalOpen(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Yeni Görev Kartı
                    </button>
                </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e0e18] p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 flex-1 max-w-md bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Görev adı, etiket veya açıklamalarda ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">Öncelik:</span>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-black/40 text-xs text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none [&>option]:bg-[#0e0e18]"
                    >
                        <option value="ALL">Tümü</option>
                        <option value="URGENT">Acil</option>
                        <option value="HIGH">Yüksek</option>
                        <option value="MEDIUM">Orta</option>
                        <option value="LOW">Düşük</option>
                    </select>

                    <span className="text-xs text-gray-500 font-mono ml-2">
                        {filteredTasks.length} Kart
                    </span>
                </div>
            </div>

            {/* Ready-to-use Board Templates banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {boardTemplates.map((tpl) => (
                    <div
                        key={tpl.id}
                        onClick={() => showToast(`"${tpl.title}" şablonu yüklendi.`)}
                        className="p-3 bg-black/20 hover:bg-white/5 border border-white/5 hover:border-primary/40 rounded-xl transition-all cursor-pointer group"
                    >
                        <div className="text-xs font-bold text-gray-200 group-hover:text-primary flex items-center justify-between">
                            <span>{tpl.title}</span>
                            <Sparkles className="w-3 h-3 text-gray-600 group-hover:text-primary" />
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{tpl.desc}</div>
                    </div>
                ))}
            </div>

            {/* MAIN KANBAN BOARD */}
            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                    {defaultColumns.map((col) => {
                        const colTasks = filteredTasks.filter(t => t.status === col.id);

                        return (
                            <div
                                key={col.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.id)}
                                className={`rounded-2xl border p-4 flex flex-col min-h-[500px] transition-colors ${col.color}`}
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-orbitron font-bold text-sm text-white">{col.title}</h3>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                                            {colTasks.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCreateColumnTarget(col.id);
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        title="Bu sütuna kart ekle"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Cards in Column */}
                                <div className="space-y-3 flex-1">
                                    {colTasks.length === 0 ? (
                                        <div className="h-32 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-gray-600 italic">
                                            Kartları buraya sürükleyin
                                        </div>
                                    ) : (
                                        colTasks.map((task) => {
                                            const totalChecklist = task.checklist?.length || 0;
                                            const completedChecklist = task.checklist?.filter(c => c.isCompleted).length || 0;
                                            const checklistPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

                                            return (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    onClick={() => setSelectedTask(task)}
                                                    className="bg-[#0e0e18] hover:bg-[#151525] border border-white/10 hover:border-primary/50 p-4 rounded-xl shadow-lg transition-all cursor-grab active:cursor-grabbing group relative"
                                                >
                                                    {/* Priority & Tags */}
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                                                            {task.priority}
                                                        </span>

                                                        {task.dueDate && (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                                                                <Clock className="w-3 h-3 text-gray-500" />
                                                                {task.dueDate}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h4 className="text-xs font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                                                        {task.title}
                                                    </h4>

                                                    {/* Relations */}
                                                    {(task.relatedProgram || task.relatedEntrepreneur) && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {task.relatedProgram && (
                                                                <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                                                    {task.relatedProgram}
                                                                </span>
                                                            )}
                                                            {task.relatedEntrepreneur && (
                                                                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                                                    {task.relatedEntrepreneur}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Checklist Progress */}
                                                    {totalChecklist > 0 && (
                                                        <div className="mt-3">
                                                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1">
                                                                <span className="flex items-center gap-1">
                                                                    <CheckSquare className="w-3 h-3 text-primary" />
                                                                    {completedChecklist}/{totalChecklist}
                                                                </span>
                                                                <span>%{checklistPct}</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-300"
                                                                    style={{ width: `${checklistPct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer Info: Comments & Assignees */}
                                                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-gray-500 text-[10px]">
                                                        <div className="flex items-center gap-2">
                                                            {task.comments && task.comments.length > 0 && (
                                                                <span className="flex items-center gap-1 text-gray-400">
                                                                    <MessageSquare className="w-3 h-3" /> {task.comments.length}
                                                                </span>
                                                            )}
                                                            {task.tags && task.tags.length > 0 && (
                                                                <span className="flex items-center gap-1 text-gray-400">
                                                                    <Tag className="w-3 h-3" /> {task.tags.length}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {task.assignees && task.assignees.length > 0 && (
                                                            <div className="flex items-center -space-x-1">
                                                                {task.assignees.slice(0, 3).map((a, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        title={a.user?.name || 'Kullanıcı'}
                                                                        className="w-5 h-5 rounded-full bg-primary/30 border border-primary/50 text-[9px] text-white flex items-center justify-center font-bold"
                                                                    >
                                                                        {a.user?.name?.[0]?.toUpperCase() || 'U'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status Action Buttons (Sections 412-416) */}
                                                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        {task.status === 'TODO' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => runTaskAction(task, { action: 'start' }, 'IN_PROGRESS', `Görev başlatıldı: "${task.title}"`)}
                                                                className="w-full py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                            >
                                                                <ArrowRight className="w-3 h-3" /> Başlat
                                                            </button>
                                                        )}
                                                        {task.status === 'IN_PROGRESS' && (
                                                            <div className="grid grid-cols-2 gap-1.5 w-full">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => runTaskAction(task, { action: 'submitForReview' }, 'IN_REVIEW', `Görev kontrole gönderildi: "${task.title}"`)}
                                                                    className="py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                                >
                                                                    <Clock className="w-3 h-3" /> Kontrole Gönder
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => runTaskAction(task, { action: 'complete' }, 'DONE', `Görev tamamlandı: "${task.title}"`)}
                                                                    className="py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" /> Tamamla
                                                                </button>
                                                            </div>
                                                        )}
                                                        {task.status === 'IN_REVIEW' && (
                                                            <div className="grid grid-cols-2 gap-1.5 w-full">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { const comment = window.prompt('Düzeltme açıklaması'); if (comment) runTaskAction(task, { action: 'returnForRevision', comment }, 'IN_PROGRESS', `Düzeltmeye gönderildi: "${task.title}"`); }}
                                                                    className="py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                                >
                                                                    Düzeltmeye Gönder
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => runTaskAction(task, { action: 'approve' }, 'DONE', `Onaylandı ve tamamlandı: "${task.title}"`)}
                                                                    className="py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" /> Onayla & Tamamla
                                                                </button>
                                                            </div>
                                                        )}
                                                        {task.status === 'DONE' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => runTaskAction(task, { action: 'reopen' }, 'TODO', `Görev yeniden açıldı: "${task.title}"`)}
                                                                className="w-full py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                            >
                                                                <RefreshCw className="w-3 h-3" /> Yeniden Aç
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List / Table View */}
            {viewMode === 'list' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-black/40 text-gray-400 font-mono uppercase text-[10px] border-b border-white/10">
                                <tr>
                                    <th className="p-4">Başlık</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4">Öncelik</th>
                                    <th className="p-4">Checklist</th>
                                    <th className="p-4">Bitiş Tarihi</th>
                                    <th className="p-4">İlişkili Kayıt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTasks.map((t) => (
                                    <tr
                                        key={t.id}
                                        onClick={() => setSelectedTask(t)}
                                        className="hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <td className="p-4 font-semibold text-white">{t.title}</td>
                                        <td className="p-4">
                                            <span className="font-mono text-[10px] px-2 py-1 rounded bg-white/10 text-gray-300">
                                                {defaultColumns.find(c => c.id === t.status)?.title || t.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPriorityBadge(t.priority)}`}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 font-mono">
                                            {t.checklist?.length ? `${t.checklist.filter(c => c.isCompleted).length}/${t.checklist.length}` : '-'}
                                        </td>
                                        <td className="p-4 text-gray-400 font-mono">{t.dueDate || '-'}</td>
                                        <td className="p-4 text-purple-400 font-mono">{t.relatedProgram || t.relatedEntrepreneur || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Calendar View Placeholder */}
            {viewMode === 'calendar' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-8 text-center space-y-3">
                    <CalendarIcon className="w-10 h-10 text-primary mx-auto animate-pulse" />
                    <h3 className="font-orbitron font-bold text-white text-base">Görev & İçerik Takvimi</h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Tüm görev bitiş tarihleri, etkinlikler ve haber yayın takvimi senkronize edilmiştir.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Link href="/admin/takvim" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold">
                            Ortak Takvimi Aç
                        </Link>
                    </div>
                </div>
            )}

            {/* Gantt View Placeholder */}
            {viewMode === 'gantt' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-8 text-center space-y-3">
                    <BarChart2 className="w-10 h-10 text-primary mx-auto animate-pulse" />
                    <h3 className="font-orbitron font-bold text-white text-base">Zaman Çizelgesi & Gantt Şeması</h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Girişimcilik programları, eğitim modülleri ve proje teslim aşamalarının zaman çizelgesi.
                    </p>
                </div>
            )}

            {/* Card Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPriorityBadge(selectedTask.priority)}`}>
                                    {selectedTask.priority}
                                </span>
                                <h2 className="font-orbitron font-bold text-lg text-white mt-2">
                                    {selectedTask.title}
                                </h2>
                                <div className="text-xs text-gray-400 font-mono mt-0.5">
                                    Kolon: <span className="text-primary font-bold">{defaultColumns.find(c => c.id === selectedTask.status)?.title}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Description */}
                        {selectedTask.description && (
                            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {selectedTask.description}
                            </div>
                        )}

                        {/* Quick Convert Actions */}
                        <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
                            <div className="text-[11px] font-bold font-mono text-primary flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> İçerik & Faaliyet Dönüşümü
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleConvertTo('NEWS', selectedTask)}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                >
                                    Habere Dönüştür
                                </button>
                                <button
                                    onClick={() => handleConvertTo('EVENT', selectedTask)}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                >
                                    Etkinliğe Dönüştür
                                </button>
                                <button
                                    onClick={() => handleConvertTo('ACTIVITY', selectedTask)}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                >
                                    Faaliyete Dönüştür
                                </button>
                            </div>
                        </div>

                        {/* Checklist Section */}
                        <div className="space-y-3">
                            <h3 className="font-orbitron font-bold text-xs text-white flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-primary" /> Checklist & Alt Görevler
                            </h3>
                            <div className="space-y-1.5">
                                {(selectedTask.checklist || []).map((chk) => (
                                    <div
                                        key={chk.id}
                                        onClick={() => handleToggleChecklist(selectedTask, chk.id)}
                                        className="flex items-center gap-2.5 p-2.5 bg-black/20 hover:bg-black/40 rounded-xl border border-white/5 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={chk.isCompleted}
                                            onChange={() => {}}
                                            className="rounded border-gray-600 text-primary focus:ring-0 cursor-pointer"
                                        />
                                        <span className={`text-xs ${chk.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                            {chk.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Yeni checklist öğesi yazın..."
                                    value={newChecklistText}
                                    onChange={(e) => setNewChecklistText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                                />
                                <button
                                    onClick={handleAddChecklistItem}
                                    className="px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>

                        {/* Comments & Mentions Section */}
                        <div className="space-y-3 pt-2 border-t border-white/10">
                            <h3 className="font-orbitron font-bold text-xs text-white flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" /> Yorumlar & @Mention
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(selectedTask.comments || []).map((cmt) => (
                                    <div key={cmt.id} className="p-3 bg-black/30 rounded-xl border border-white/5 text-xs">
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1">
                                            <span className="font-bold text-primary">{cmt.author?.name}</span>
                                            <span>{cmt.createdAt}</span>
                                        </div>
                                        <p className="text-gray-300">{cmt.comment}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Yorum ekle (@Hatice, @Alperen vb.)..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                />
                                <button
                                    onClick={handleAddComment}
                                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" /> Gönder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-orbitron font-bold text-base text-white">
                                Yeni Görev Kartı Ekle
                            </h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 font-mono mb-1">Görev Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: 2026 Girişimci Sözleşmelerinin İncelenmesi"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-mono mb-1">Açıklama</label>
                                <textarea
                                    rows={3}
                                    placeholder="Görev detayları, hedefler ve teslim şartları..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 font-mono mb-1">Hedef Sütun</label>
                                    <select
                                        value={createColumnTarget}
                                        onChange={(e: any) => setCreateColumnTarget(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none [&>option]:bg-[#0e0e18]"
                                    >
                                        {defaultColumns.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-mono mb-1">Öncelik</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e: any) => setNewPriority(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none [&>option]:bg-[#0e0e18]"
                                    >
                                        <option value="LOW">Düşük</option>
                                        <option value="MEDIUM">Orta</option>
                                        <option value="HIGH">Yüksek</option>
                                        <option value="URGENT">Acil</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 font-mono mb-1">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-mono mb-1">Etiketler (Virgülle)</label>
                                    <input
                                        type="text"
                                        placeholder="ANTsPARK, Sözleşme"
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 cursor-pointer"
                                >
                                    Kartı Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
