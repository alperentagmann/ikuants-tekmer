"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Download
} from 'lucide-react';

export interface CalendarEventItem {
    id: string;
    title: string;
    type: 'TASK' | 'TRAINING' | 'EVENT' | 'MEETING' | 'ACTIVITY' | 'RESERVATION' | 'CONTRACT' | 'RENT' | 'FOLLOW_UP';
    startDate: Date | string;
    endDate?: Date | string;
    location?: string;
    status?: string;
    priority?: string;
    url?: string;
}

interface InteractiveCalendarProps {
    events: CalendarEventItem[];
    onEventClick?: (event: CalendarEventItem) => void;
    /** Called with the first and last instant of the visible month so the page can load that range. */
    onMonthChange?: (year: number, month: number) => void;
}

const TYPE_LABEL: Record<CalendarEventItem['type'], string> = { TASK: 'Görev', TRAINING: 'Eğitim', EVENT: 'Etkinlik', MEETING: 'Toplantı', ACTIVITY: 'Faaliyet', RESERVATION: 'Rezervasyon', CONTRACT: 'Sözleşme', RENT: 'Kira', FOLLOW_UP: 'Takip' };

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
    events,
    onEventClick,
    onMonthChange,
}) => {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'AGENDA'>('MONTH');
    const [filterType, setFilterType] = useState<string>('ALL');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const go = (d: Date) => {
        setCurrentDate(d);
        onMonthChange?.(d.getFullYear(), d.getMonth());
    };
    const nextMonth = () => go(new Date(year, month + 1, 1));
    const prevMonth = () => go(new Date(year, month - 1, 1));
    const today = () => go(new Date());

    // Calculate Days for Month Grid
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // In JS 0 is Sunday, Turkish week starts Monday (1)
    const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarCells: Array<{ dayNumber: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < startingDayIndex; i++) {
        calendarCells.push({ dayNumber: null, dateStr: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarCells.push({ dayNumber: day, dateStr: dStr });
    }

    const filteredEvents = events.filter((ev) => {
        if (filterType === 'ALL') return true;
        return ev.type === filterType;
    });

    // Days are bucketed on the Istanbul calendar, not UTC
    const istanbulDay = (d: Date | string) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
    const getEventsForDay = (dateStr: string) => filteredEvents.filter((ev) => istanbulDay(ev.startDate) === dateStr);
    const openEvent = (ev: CalendarEventItem) => {
        if (onEventClick) onEventClick(ev);
        else if (ev.url) router.push(ev.url);
    };

    const getTypeColor = (type: CalendarEventItem['type']) => {
        switch (type) {
            case 'TASK':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'TRAINING':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'EVENT':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'ACTIVITY':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'MEETING':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'RESERVATION':
                return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
            case 'CONTRACT':
                return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            case 'RENT':
                return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'FOLLOW_UP':
                return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const exportToIcs = () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//IKUANTS TEKMER//Operasyon Takvimi//TR\nCALSCALE:GREGORIAN\n";
        filteredEvents.forEach((ev) => {
            const start = new Date(ev.startDate).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
            icsContent += `BEGIN:VEVENT\nSUMMARY:${ev.title}\nDTSTART:${start}\nDESCRIPTION:${ev.type}\nLOCATION:${ev.location || ""}\nEND:VEVENT\n`;
        });
        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ikuants-takvim-${year}-${month + 1}.ics`;
        a.click();
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e0e18] border border-white/10 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-orbitron font-bold text-lg text-white">
                            {monthNames[month]} {year}
                        </h2>
                        <span className="text-[11px] font-mono text-gray-400">
                            Saat Dilimi: Europe/Istanbul (GMT+3)
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Pills */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none"
                    >
                        <option value="ALL">Tüm Kategoriler</option>
                        <option value="TASK">Görevler</option>
                        <option value="TRAINING">Eğitimler</option>
                        <option value="EVENT">Etkinlikler</option>
                        <option value="ACTIVITY">Faaliyetler</option>
                        <option value="RESERVATION">Rezervasyonlar</option>
                        <option value="FOLLOW_UP">Görüşme takipleri</option>
                        <option value="CONTRACT">Sözleşme bitişleri</option>
                        <option value="RENT">Kira vadeleri</option>
                    </select>

                    {/* View Switcher */}
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode('MONTH')}
                            className={`px-3 py-1 text-xs font-mono rounded ${
                                viewMode === 'MONTH' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Ay
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('AGENDA')}
                            className={`px-3 py-1 text-xs font-mono rounded ${
                                viewMode === 'AGENDA' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Ajanda
                        </button>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={today}
                            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                        >
                            Bugün
                        </button>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ICS Export */}
                    <button
                        type="button"
                        onClick={exportToIcs}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-mono transition-colors"
                        title="iCalendar (.ics) İndir"
                    >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">ICS</span>
                    </button>
                </div>
            </div>

            {/* View Mode: Month Grid */}
            {viewMode === 'MONTH' && (
                <div className="rounded-2xl bg-[#0e0e18] border border-white/10 overflow-hidden shadow-xl">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
                        {daysOfWeek.map((d, i) => (
                            <div key={i} className="py-2.5 text-center text-xs font-mono font-semibold text-gray-400">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-white/5 bg-black/20">
                        {calendarCells.map((cell, idx) => {
                            if (!cell.dayNumber || !cell.dateStr) {
                                return <div key={idx} className="min-h-[100px] bg-black/40 p-2" />;
                            }

                            const dayEvents = getEventsForDay(cell.dateStr);
                            const isToday = istanbulDay(new Date()) === cell.dateStr;

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[100px] p-2 transition-colors flex flex-col justify-between ${
                                        isToday ? 'bg-cyan-500/[0.04] ring-1 ring-inset ring-cyan-500/30' : 'hover:bg-white/[0.02]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                            isToday ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30' : 'text-gray-400'
                                        }`}>
                                            {cell.dayNumber}
                                        </span>
                                        {dayEvents.length > 2 && (
                                            <span className="text-[10px] font-mono text-cyan-400">
                                                +{dayEvents.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    {/* Events List for Day */}
                                    <div className="space-y-1 overflow-hidden flex-1">
                                        {dayEvents.slice(0, 3).map((ev) => (
                                            <button
                                                key={ev.id}
                                                type="button"
                                                onClick={() => openEvent(ev)}
                                                className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] truncate block transition-all ${getTypeColor(
                                                    ev.type
                                                )}`}
                                                title={ev.title}
                                            >
                                                {ev.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* View Mode: Agenda List */}
            {viewMode === 'AGENDA' && (
                <div className="rounded-2xl bg-[#0e0e18] border border-white/10 p-4 space-y-3 shadow-xl">
                    {filteredEvents.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500">
                            Bu dönem için planlanmış etkinlik bulunamadı.
                        </div>
                    ) : (
                        filteredEvents.map((ev) => (
                            <div
                                key={ev.id}
                                onClick={() => openEvent(ev)}
                                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getTypeColor(ev.type)}`}>
                                        {TYPE_LABEL[ev.type] || ev.type}
                                    </span>
                                    <div>
                                        <div className="text-sm font-semibold text-white">{ev.title}</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-3 font-mono mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-cyan-400" />
                                                {new Date(ev.startDate).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {ev.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-emerald-400" />
                                                    {ev.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
