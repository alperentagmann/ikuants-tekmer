import React from 'react';

interface StatusBadgeProps {
    status: string;
    label?: string;
    variant?: 'default' | 'outline' | 'dot';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
    // Application statuses
    NEW: { label: 'Yeni Başvuru', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dotColor: 'bg-blue-400' },
    PRE_REVIEW: { label: 'Ön İnceleme', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', dotColor: 'bg-purple-400' },
    MISSING_DOCS: { label: 'Eksik Evrak', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-400' },
    UNDER_EVALUATION: { label: 'Değerlendirmede', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dotColor: 'bg-amber-400' },
    JURY: { label: 'Jüri Değerlendirmesi', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', dotColor: 'bg-indigo-400' },
    INTERVIEW: { label: 'Mülakat', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', dotColor: 'bg-cyan-400' },
    ACCEPTED: { label: 'Kabul Edildi', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' },
    REJECTED: { label: 'Reddedildi', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dotColor: 'bg-rose-400' },
    WAITLIST: { label: 'Bekleme Listesi', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dotColor: 'bg-orange-400' },
    CONTRACT: { label: 'Sözleşme Süreci', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', dotColor: 'bg-teal-400' },

    // General statuses
    ACTIVE: { label: 'Aktif', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' },
    PASSIVE: { label: 'Pasif', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', dotColor: 'bg-zinc-400' },
    GRADUATED: { label: 'Mezun', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dotColor: 'bg-blue-400' },
    DRAFT: { label: 'Taslak', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', dotColor: 'bg-zinc-400' },
    PUBLISHED: { label: 'Yayında', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' },
    SCHEDULED: { label: 'Planlandı', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', dotColor: 'bg-purple-400' },
    ARCHIVED: { label: 'Arşiv', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', dotColor: 'bg-zinc-400' },
    OPEN: { label: 'Başvuru Açık', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' },
    CLOSED: { label: 'Başvuru Kapalı', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dotColor: 'bg-rose-400' },
    UPCOMING: { label: 'Yakında', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dotColor: 'bg-amber-400' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, variant = 'default' }) => {
    const config = STATUS_CONFIG[status] || {
        label: status,
        color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
        dotColor: 'bg-zinc-400',
    };

    const displayText = label || config.label;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
            {displayText}
        </span>
    );
};
