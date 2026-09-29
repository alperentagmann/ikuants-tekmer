export interface ApplicationStatus {
    key: string;
    label: string;
    color: string;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
    { key: 'NEW', label: 'Yeni Başvuru', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
    { key: 'PRE_REVIEW', label: 'Ön İnceleme', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
    { key: 'MISSING_DOCS', label: 'Eksik Evrak', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
    { key: 'UNDER_EVALUATION', label: 'Değerlendirmede', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
    { key: 'JURY', label: 'Jüri Değerlendirmesi', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
    { key: 'INTERVIEW', label: 'Görüşme / Mülakat', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
    { key: 'ACCEPTED', label: 'Kabul Edildi', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
    { key: 'REJECTED', label: 'Reddedildi', color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
    { key: 'WAITLIST', label: 'Bekleme Listesi', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
    { key: 'CONTRACT', label: 'Sözleşme Süreci', color: 'bg-teal-500/10 text-teal-500 border-teal-500/30' },
    { key: 'ACTIVE', label: 'Aktif Girişim', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
    { key: 'ARCHIVED', label: 'Arşiv', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
];
