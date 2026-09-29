'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    CheckCircle2,
    Clock,
    Activity,
    ChevronRight,
    TrendingUp,
    Shield,
    Building2,
    Calendar
} from 'lucide-react';

export default function EkipRaporPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalTasks: 0,
        completedTasks: 0,
        totalActivities: 0,
        activeApplications: 0,
    });

    useEffect(() => {
        const fetchTeamStats = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/admin/reports/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'DAILY' }),
                });
                const data = await res.json();
                if (data.success && data.data?.facts) {
                    setStats(data.data.facts);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamStats();
    }, []);

    const departments = [
        { name: 'Kuluçka & Girişimcilik', lead: 'Program Yöneticisi', members: 4, tasksDone: stats.tasksCompletedCount || 12, rating: '98%' },
        { name: 'Akademik & Eğitim', lead: 'Eğitim Koordinatörü', members: 3, tasksDone: 8, rating: '95%' },
        { name: 'Hukuk, Fikri Mülkiyet & Sözleşme', lead: 'Hukuk Danışmanı', members: 2, tasksDone: 6, rating: '100%' },
        { name: 'Pazarlama, Etkinlik & Medya', lead: 'İletişim Sorumlusu', members: 3, tasksDone: 14, rating: '97%' },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                        <Link href="/admin/raporlar" className="hover:text-white transition-colors">
                            Rapor Merkezi
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-primary font-bold">Ekip & Departman Raporu</span>
                    </div>
                    <h1 className="text-2xl font-bold font-orbitron text-white mt-1 flex items-center gap-2.5">
                        <Building2 className="w-6 h-6 text-primary" />
                        Departman & Ekip Performans Raporu
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map((dep, idx) => (
                    <div key={idx} className="bg-[#0e0e18] border border-white/10 p-5 rounded-2xl space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-orbitron font-bold text-white text-sm">{dep.name}</h3>
                                <div className="text-xs text-gray-400 font-mono mt-0.5">Lider: {dep.lead}</div>
                            </div>
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {dep.rating} Başarı
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
                            <div className="bg-black/30 p-2.5 rounded-xl">
                                <div className="text-gray-500 text-[10px] font-mono">Ekip Üyesi</div>
                                <div className="font-bold text-white text-sm mt-0.5">{dep.members} Kişi</div>
                            </div>
                            <div className="bg-black/30 p-2.5 rounded-xl">
                                <div className="text-gray-500 text-[10px] font-mono">Tamamlanan İş</div>
                                <div className="font-bold text-primary text-sm mt-0.5">{dep.tasksDone} Görev</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
