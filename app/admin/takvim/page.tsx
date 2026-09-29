"use client";
import React, { useState, useEffect } from 'react';
import { InteractiveCalendar } from '@/components/admin/InteractiveCalendar';
import { Calendar as CalendarIcon, Download, Plus, Filter, RefreshCw } from 'lucide-react';

export default function CalendarPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCalendarItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/calendar');
            const data = await res.json();
            if (data.success) {
                setItems(data.items);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarItems();
    }, []);

    const exportToICS = () => {
        if (items.length === 0) return;
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//IKUANTS TEKMER//Operasyonel Takvim//TR\nCALSCALE:GREGORIAN\n";

        items.forEach((item) => {
            const startDate = new Date(item.startDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
            const endDate = item.endDate
                ? new Date(item.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
                : startDate;

            icsContent += `BEGIN:VEVENT\nSUMMARY:${item.title}\nDTSTART:${startDate}\nDTEND:${endDate}\nDESCRIPTION:${item.description || ''}\nLOCATION:${item.location || ''}\nEND:VEVENT\n`;
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `ikuants-tekmer-takvim-${new Date().toISOString().slice(0, 10)}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                        <CalendarIcon className="w-7 h-7 text-primary" />
                        Ortak Kurumsal Takvim
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Eğitimler, etkinlikler, görev teslim tarihleri, toplantılar ve kurumsal faaliyetlerin birleşik ajandası.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCalendarItems}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
                        title="Yenile"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={exportToICS}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                        <Download className="w-4 h-4 text-primary" />
                        Takvimi İndir (.ics)
                    </button>
                </div>
            </div>

            {/* Calendar Container */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Takvim yükleniyor...</div>
            ) : (
                <InteractiveCalendar events={items} />
            )}
        </div>
    );
}
