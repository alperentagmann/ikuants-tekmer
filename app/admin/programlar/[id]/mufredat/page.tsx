"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Layers, Plus, BookOpen, User, Calendar, Clock, CheckCircle2,
    XCircle, ArrowLeft, Users, FileText, Video, Sparkles, Activity
} from 'lucide-react';

interface TrainingItem {
    id: string;
    title: string;
    description?: string;
    objective?: string;
    moduleName?: string;
    weekNumber?: number;
    format: string;
    startDate: string;
    location?: string;
    instructors?: Array<{ id: string; name: string; title?: string; mentor?: { name: string; surname: string } }>;
    _count?: { enrollments: number };
}

export default function ProgramCurriculumPage() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [trainings, setTrainings] = useState<TrainingItem[]>([]);
    const [program, setProgram] = useState<any>(null);
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTrainingForAttendance, setSelectedTrainingForAttendance] = useState<any | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [moduleName, setModuleName] = useState('');
    const [weekNumber, setWeekNumber] = useState('1');
    const [startDate, setStartDate] = useState('');
    const [format, setFormat] = useState('HYBRID');
    const [location, setLocation] = useState('');
    const [objective, setObjective] = useState('');
    const [selectedMentorId, setSelectedMentorId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trainingsRes, progRes, mentorRes] = await Promise.all([
                fetch(`/api/admin/trainings?programId=${programId}`),
                fetch(`/api/admin/programs/${programId}`),
                fetch('/api/admin/mentors'),
            ]);

            const trainingsData = await trainingsRes.json();
            const progData = await progRes.json();
            const mentorData = await mentorRes.json();

            if (trainingsData.success) setTrainings(trainingsData.trainings);
            if (progData.success) setProgram(progData.program);
            if (mentorData.success) setMentors(mentorData.mentors);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [programId]);

    const handleCreateTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startDate) return;

        try {
            const res = await fetch('/api/admin/trainings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId,
                    title,
                    moduleName: moduleName || undefined,
                    weekNumber: Number(weekNumber) || 1,
                    startDate,
                    format,
                    location,
                    objective,
                    instructorIds: selectedMentorId ? [selectedMentorId] : [],
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setTitle('');
                setModuleName('');
                setWeekNumber('1');
                setStartDate('');
                setLocation('');
                setObjective('');
                setSelectedMentorId('');
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDraftActivityFromTraining = async (trainingId: string) => {
        try {
            const res = await fetch('/api/admin/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trainingId,
                    action: 'draft-from-training',
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Eğitim başarıyla Kurumsal Faaliyetler portföyüne aktarıldı!');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/programlar')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                            {program?.name || 'Program Müfredatı'}
                        </div>
                        <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                            <BookOpen className="w-7 h-7 text-primary" />
                            Haftalık Eğitim & Müfredat Stüdyosu
                        </h1>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Eğitim / Modül Ekle
                </button>
            </div>

            {/* Curriculum Timeline & Modules */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Müfredat yükleniyor...</div>
            ) : trainings.length === 0 ? (
                <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl space-y-3">
                    <BookOpen className="w-10 h-10 text-gray-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">Bu programa ait eğitim tanımlanmadı</div>
                    <p className="text-xs text-gray-500">Haftalık modüller, atölyeler ve eğitmen eşleştirmelerini başlatmak için yeni eğitim ekleyin.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trainings.map((tr) => (
                        <div
                            key={tr.id}
                            className="bg-[#090912] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
                        >
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                                        {tr.weekNumber ? `${tr.weekNumber}. Hafta` : 'Modül'}
                                    </span>
                                    {tr.moduleName && (
                                        <span className="text-xs text-gray-400 font-semibold">• {tr.moduleName}</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-base text-white">{tr.title}</h3>
                                {tr.objective && (
                                    <p className="text-xs text-gray-400">{tr.objective}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                                    <div className="flex items-center gap-1.5 font-mono">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        <span>{new Date(tr.startDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                                        <span>{tr.format}</span>
                                    </div>
                                    {tr.instructors && tr.instructors.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-purple-400">
                                            <User className="w-3.5 h-3.5" />
                                            <span>Eğitmen: {tr.instructors[0].name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleDraftActivityFromTraining(tr.id)}
                                    title="Bu eğitimi kurumsal faaliyet portföyüne aktar"
                                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                    <Activity className="w-3.5 h-3.5 text-primary" />
                                    Faaliyete Dönüştür
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Training Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Programa Eğitim / Oturum Ekle</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateTraining} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Eğitim Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Fikri Mülkiyet Hakları ve Patent Başvuru Süreçleri"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Modül Adı</label>
                                    <input
                                        type="text"
                                        value={moduleName}
                                        onChange={(e) => setModuleName(e.target.value)}
                                        placeholder="Örn: Hukuk & Fikri Mülkiyet"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Hafta Numarası</label>
                                    <input
                                        type="number"
                                        value={weekNumber}
                                        onChange={(e) => setWeekNumber(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Eğitim Tarihi & Saati *</label>
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
                                        value={format}
                                        onChange={(e) => setFormat(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="HYBRID">Hibrit</option>
                                        <option value="PHYSICAL">Fiziksel</option>
                                        <option value="ONLINE">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Eğitmen (Mentör Havuzundan)</label>
                                <select
                                    value={selectedMentorId}
                                    onChange={(e) => setSelectedMentorId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                >
                                    <option value="">Eğitmen Seçilmedi</option>
                                    {mentors.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name} {m.surname} - {m.title || m.company}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Kazanımlar ve Eğitim Hedefi</label>
                                <textarea
                                    rows={2}
                                    value={objective}
                                    onChange={(e) => setObjective(e.target.value)}
                                    placeholder="Katılımcıların edineceği bilgi ve yetkinlikler..."
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
                                    Eğitimi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
