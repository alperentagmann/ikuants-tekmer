"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { InteractiveCalendar, type CalendarEventItem } from '@/components/admin/InteractiveCalendar';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

/** First instant of a month in Istanbul (UTC+3, no DST). */
const monthStart = (year: number, month: number) => new Date(`${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00+03:00`);

export default function CalendarPage() {
    const [items, setItems] = useState<CalendarEventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visible, setVisible] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Load the visible month plus a week on both sides for the agenda view
            const start = new Date(monthStart(visible.year, visible.month).getTime() - 7 * 86400000);
            const end = new Date(monthStart(visible.month === 11 ? visible.year + 1 : visible.year, (visible.month + 1) % 12).getTime() + 7 * 86400000);
            const res = await fetch(`/api/admin/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Takvim yüklenemedi');
            setItems(data.items);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Takvim yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [visible]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="flex items-center gap-3 font-orbitron text-2xl font-bold text-white">
                        <CalendarIcon className="h-7 w-7 text-primary" />
                        Ortak Kurumsal Takvim
                    </h1>
                    <p className="mt-1 text-xs text-gray-400">Görev terminleri, eğitimler, etkinlikler, rezervasyonlar, görüşme takipleri, sözleşme bitişleri ve kira vadeleri. Yalnızca yetkili olduğunuz modüller gösterilir.</p>
                </div>
                <button type="button" onClick={load} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-gray-300 hover:text-white" title="Yenile" aria-label="Yenile">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}
            <InteractiveCalendar events={items} onMonthChange={(year, month) => setVisible({ year, month })} />
        </div>
    );
}
