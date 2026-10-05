/**
 * Visual themes for public forms. Each theme reproduces the classes of the page
 * the form lives on, so forms managed from the Form Center keep the original look.
 */
export interface FormTheme {
    key: string;
    input: string;
    label: string;
    help: string;
    sectionTitle: string;
    sectionIcon: string;
    subHeading: string;
    grid: string;
    error: string;
    option: string;
    checkbox: string;
    checkGroup: string;
    checkGroupItem: string;
    radioCard: string;
    radioCardWrap: string;
    consentCard: string;
    consentText: string;
    consentLink: string;
    note: string;
    noteText: string;
    highlight: string;
    highlightInput: string;
    moduleCard: string;
    moduleCode: string;
    moduleTitle: string;
    required: string;
}

const darkBase = {
    help: 'text-xs text-gray-500 mb-2',
    error: 'mt-1 text-xs text-red-400',
    option: 'bg-[#0a0a0a]',
    subHeading: 'text-sm font-bold uppercase tracking-wider mt-4 mb-2',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    required: 'text-red-500',
    consentText: 'text-gray-300 text-sm',
    highlight: 'space-y-2 p-6 rounded-xl border',
    moduleTitle: 'text-xs text-gray-300',
};

export const FORM_THEMES: Record<string, FormTheme> = {
    antspark: {
        key: 'antspark',
        ...darkBase,
        input: 'w-full bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:bg-white/10 p-4 text-white outline-none transition-all',
        label: 'flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold mb-2',
        sectionTitle: 'font-orbitron text-xl text-white mb-6 flex items-center gap-2',
        sectionIcon: 'w-5 h-5 text-purple-400',
        subHeading: 'text-purple-400 font-bold uppercase text-xs tracking-wider mt-4 mb-2',
        checkbox: 'mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500',
        checkGroup: 'flex flex-wrap gap-4 mt-2',
        checkGroupItem: 'flex items-center gap-2 cursor-pointer text-gray-300',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-4 text-center rounded-lg border-2 border-white/10 text-gray-400 peer-checked:border-purple-500 peer-checked:bg-purple-500/10 peer-checked:text-purple-400 transition-all font-semibold',
        consentCard: 'flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer',
        consentLink: 'text-purple-400 hover:underline font-bold text-left',
        note: 'p-4 rounded-lg bg-purple-500/10 border border-purple-500/30',
        noteText: 'text-purple-300 text-sm',
        highlight: 'space-y-2 p-6 rounded-xl border bg-purple-500/10 border-purple-500/30',
        highlightInput: 'w-full bg-black/50 border border-purple-500/30 rounded-lg p-4 text-white outline-none focus:border-purple-500 transition-all',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-purple-500/40',
        moduleCode: 'block text-xs font-mono text-purple-400',
    },
    antsfire: {
        key: 'antsfire',
        ...darkBase,
        input: 'w-full bg-white/5 border border-white/10 rounded-lg focus:border-orange-500 focus:bg-white/10 p-3 text-white outline-none transition-all text-sm',
        label: 'flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 mt-4',
        sectionTitle: 'text-2xl font-orbitron text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/10',
        sectionIcon: 'w-6 h-6 text-orange-500',
        subHeading: 'text-orange-400 font-bold mb-4 uppercase text-xs tracking-wider mt-8 pt-6 border-t border-white/10',
        grid: 'grid md:grid-cols-2 gap-4',
        checkbox: 'accent-orange-500 w-4 h-4',
        checkGroup: 'grid grid-cols-2 lg:grid-cols-3 gap-2 bg-white/5 p-3 rounded-lg border border-white/10',
        checkGroupItem: 'flex items-center gap-2 cursor-pointer hover:text-orange-400 transition-colors text-xs text-gray-300',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-3 text-center rounded-lg border-2 border-white/10 text-gray-400 peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 transition-all font-semibold text-sm',
        consentCard: 'flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        consentLink: 'text-orange-400 hover:underline font-bold text-left',
        note: 'p-4 rounded-lg bg-orange-500/10 border border-orange-500/30',
        noteText: 'text-orange-300 text-sm',
        highlight: 'space-y-2 p-6 rounded-xl border bg-orange-500/10 border-orange-500/30',
        highlightInput: 'w-full bg-black/50 border border-orange-500/30 rounded-lg p-3 text-white outline-none focus:border-orange-500 transition-all text-sm',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-orange-500/40 transition-colors',
        moduleCode: 'block text-xs font-mono text-orange-400',
    },
    glowup: {
        key: 'glowup',
        input: 'w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-cyan-500 focus:bg-white dark:focus:bg-white/10 p-4 text-black dark:text-white outline-none transition-all',
        label: 'flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold mb-2',
        help: 'text-xs text-black/50 dark:text-gray-500 mb-2',
        sectionTitle: 'font-orbitron text-xl text-black dark:text-white mb-6 flex items-center gap-2',
        sectionIcon: 'w-5 h-5 text-cyan-500',
        subHeading: 'text-lg font-bold text-black dark:text-white mt-6 mb-2',
        grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
        error: 'mt-1 text-xs text-red-500',
        option: 'bg-white dark:bg-[#0a0a0a]',
        checkbox: 'w-5 h-5 accent-cyan-500',
        checkGroup: 'grid grid-cols-1 md:grid-cols-2 gap-3 mt-2',
        checkGroupItem: 'flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer text-sm text-black/80 dark:text-gray-300',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-4 text-center rounded-lg border-2 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-500 transition-all font-semibold',
        consentCard: 'flex items-start gap-3',
        consentText: 'text-sm font-medium text-gray-900 dark:text-gray-300',
        consentLink: 'text-cyan-500 hover:underline font-bold text-left',
        note: 'p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30',
        noteText: 'text-cyan-700 dark:text-cyan-300 text-sm',
        highlight: 'space-y-2 p-6 rounded-xl border bg-cyan-500/5 border-cyan-500/20',
        highlightInput: 'w-full bg-white dark:bg-black/50 border border-cyan-500/30 rounded-lg p-4 text-black dark:text-white outline-none focus:border-cyan-500 transition-all',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer',
        moduleCode: 'block text-xs font-mono text-cyan-500',
        moduleTitle: 'text-xs text-black/70 dark:text-gray-300',
        required: 'text-red-500',
    },
    site: {
        key: 'site',
        input: 'w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:border-secondary p-4 text-black dark:text-white outline-none transition-all',
        label: 'flex items-center gap-2 text-sm uppercase tracking-wider text-black/70 dark:text-gray-400 font-bold',
        help: 'text-xs text-black/50 dark:text-gray-500 mb-1',
        sectionTitle: 'text-xl text-black dark:text-white font-orbitron font-semibold mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-center gap-2',
        sectionIcon: 'w-5 h-5 text-primary',
        subHeading: 'text-lg font-bold text-black dark:text-white flex items-center gap-2 mt-6 mb-4',
        grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
        error: 'mt-1 text-xs text-red-500',
        option: '',
        checkbox: 'mt-1 w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 outline-none',
        checkGroup: 'flex flex-wrap gap-4 mt-2',
        checkGroupItem: 'flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-4 text-center rounded-lg border-2 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all font-semibold',
        consentCard: 'flex items-start gap-3',
        consentText: 'text-sm font-medium text-gray-900 dark:text-gray-300',
        consentLink: 'text-primary hover:underline font-bold transition-all text-left',
        note: 'p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20',
        noteText: 'text-black/70 dark:text-gray-300 text-sm',
        highlight: 'space-y-2 p-6 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20',
        highlightInput: 'w-full bg-white dark:bg-black/50 border border-primary/30 rounded-lg p-4 text-black dark:text-white outline-none focus:border-primary transition-all',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer',
        moduleCode: 'block text-xs font-mono text-primary',
        moduleTitle: 'text-xs text-black/70 dark:text-gray-300',
        required: 'text-red-500',
    },
    mentor: {
        key: 'mentor',
        ...darkBase,
        input: 'w-full bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:bg-white/10 p-4 text-white outline-none transition-all',
        label: 'flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400 font-bold mb-2',
        sectionTitle: 'font-orbitron text-xl text-white mb-6 flex items-center gap-2',
        sectionIcon: 'w-5 h-5 text-primary',
        subHeading: 'text-primary font-bold uppercase text-xs tracking-wider mt-4 mb-2',
        checkbox: 'w-4 h-4 accent-[#7000ff]',
        checkGroup: 'grid grid-cols-1 md:grid-cols-2 gap-2 mt-2',
        checkGroupItem: 'flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer text-sm text-gray-300 hover:border-primary/40',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-4 text-center rounded-lg border-2 border-white/10 text-gray-400 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all font-semibold',
        consentCard: 'flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        consentLink: 'text-primary hover:underline font-bold text-left',
        note: 'p-4 rounded-lg bg-primary/10 border border-primary/30',
        noteText: 'text-gray-300 text-sm',
        highlight: 'space-y-2 p-6 rounded-xl bg-white/[0.02] border border-white/5',
        highlightInput: 'w-full bg-white/5 border border-white/10 rounded-lg focus:border-primary p-4 text-white outline-none transition-all',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        moduleCode: 'block text-xs font-mono text-primary',
    },
    contact: {
        key: 'contact',
        input: 'w-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-lg focus:border-primary focus:bg-white dark:focus:bg-[#222] p-3 text-black dark:text-white outline-none transition-all text-sm [&>option]:bg-white dark:[&>option]:bg-[#1a1a1a] [&>option]:text-black dark:[&>option]:text-white',
        label: 'text-xs uppercase tracking-wider text-black/70 dark:text-gray-500 font-bold',
        help: 'text-xs text-black/50 dark:text-gray-500',
        sectionTitle: 'text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2',
        sectionIcon: 'w-5 h-5 text-primary',
        subHeading: 'text-sm font-bold text-black dark:text-white mt-2',
        grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        error: 'mt-1 text-xs text-red-500',
        option: '',
        checkbox: 'mt-1 w-4 h-4 accent-primary',
        checkGroup: 'flex flex-wrap gap-3 mt-1',
        checkGroupItem: 'flex items-center gap-2 cursor-pointer text-sm text-black/80 dark:text-gray-300',
        radioCardWrap: 'grid grid-cols-3 gap-2',
        radioCard: 'w-full p-3 text-center rounded-lg border border-gray-300 dark:border-white/10 text-sm text-gray-600 dark:text-gray-400 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all font-semibold',
        consentCard: 'flex items-start gap-3',
        consentText: 'text-xs text-black/70 dark:text-gray-400',
        consentLink: 'text-primary hover:underline font-bold text-left',
        note: 'p-3 rounded-lg bg-primary/5 border border-primary/20',
        noteText: 'text-xs text-black/70 dark:text-gray-400',
        highlight: 'space-y-2 p-4 rounded-xl border border-primary/20 bg-primary/5',
        highlightInput: 'w-full bg-white dark:bg-black/50 border border-primary/30 rounded-lg p-3 text-black dark:text-white outline-none focus:border-primary text-sm',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer',
        moduleCode: 'block text-xs font-mono text-primary',
        moduleTitle: 'text-xs text-black/70 dark:text-gray-300',
        required: 'text-red-500',
    },
    'internship-student': {
        key: 'internship-student',
        ...darkBase,
        input: 'w-full bg-white/5 border border-white/10 rounded-lg focus:border-green-500 focus:bg-white/10 p-3 text-white outline-none transition-all text-sm',
        label: 'flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 mt-4',
        sectionTitle: 'text-2xl font-orbitron text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/10',
        sectionIcon: 'w-6 h-6 text-green-500',
        subHeading: 'text-green-400 font-bold mb-2 uppercase text-xs tracking-wider mt-6',
        grid: 'grid md:grid-cols-2 gap-4',
        checkbox: 'accent-green-500 w-4 h-4',
        checkGroup: 'grid grid-cols-2 lg:grid-cols-3 gap-2 bg-white/5 p-3 rounded-lg border border-white/10',
        checkGroupItem: 'flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-green-400',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-3 text-center rounded-lg border-2 border-white/10 text-gray-400 peer-checked:border-green-500 peer-checked:bg-green-500/10 peer-checked:text-green-400 transition-all font-semibold text-sm',
        consentCard: 'flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        consentLink: 'text-green-400 hover:underline font-bold text-left',
        note: 'p-4 rounded-lg bg-green-500/10 border border-green-500/30',
        noteText: 'text-green-300 text-sm',
        highlightInput: 'w-full bg-black/50 border border-green-500/30 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        moduleCode: 'block text-xs font-mono text-green-400',
    },
    'internship-company': {
        key: 'internship-company',
        ...darkBase,
        input: 'w-full bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:bg-white/10 p-3 text-white outline-none transition-all text-sm',
        label: 'flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 mt-4',
        sectionTitle: 'text-2xl font-orbitron text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/10',
        sectionIcon: 'w-6 h-6 text-blue-500',
        subHeading: 'text-blue-400 font-bold mb-2 uppercase text-xs tracking-wider mt-6',
        grid: 'grid md:grid-cols-2 gap-4',
        checkbox: 'accent-blue-500 w-4 h-4',
        checkGroup: 'grid grid-cols-2 lg:grid-cols-3 gap-2 bg-white/5 p-3 rounded-lg border border-white/10',
        checkGroupItem: 'flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-blue-400',
        radioCardWrap: 'flex gap-4',
        radioCard: 'w-full p-3 text-center rounded-lg border-2 border-white/10 text-gray-400 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-400 transition-all font-semibold text-sm',
        consentCard: 'flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        consentLink: 'text-blue-400 hover:underline font-bold text-left',
        note: 'p-4 rounded-lg bg-blue-500/10 border border-blue-500/30',
        noteText: 'text-blue-300 text-sm',
        highlightInput: 'w-full bg-black/50 border border-blue-500/30 rounded-lg p-3 text-white outline-none focus:border-blue-500 text-sm',
        moduleCard: 'flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer',
        moduleCode: 'block text-xs font-mono text-blue-400',
    },
};

FORM_THEMES.reservation = {
    ...FORM_THEMES.site,
    key: 'reservation',
    input: 'w-full bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:border-primary outline-none [&>option]:bg-white dark:[&>option]:bg-[#0c0c16]',
    label: 'block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1.5',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3.5',
    consentCard: 'flex items-start gap-2.5 cursor-pointer pt-2 border-t border-gray-100 dark:border-white/10',
    consentText: 'text-xs text-gray-600 dark:text-gray-400',
    checkbox: 'mt-0.5 rounded border-gray-300 dark:border-white/20 text-primary focus:ring-primary',
    consentLink: 'text-primary hover:underline font-semibold',
};

export const FORM_THEME_OPTIONS = [
    { value: 'site', label: 'Site (açık/koyu)' },
    { value: 'antspark', label: 'ANTSPARK (mor)' },
    { value: 'antsfire', label: 'ANTSFire (turuncu)' },
    { value: 'glowup', label: 'Glow Up (camgöbeği)' },
    { value: 'mentor', label: 'Mentör (koyu)' },
    { value: 'contact', label: 'İletişim' },
    { value: 'internship-student', label: 'Staj — Öğrenci (yeşil)' },
    { value: 'internship-company', label: 'Staj — Şirket (mavi)' },
    { value: 'reservation', label: 'Rezervasyon penceresi' },
];

export function getFormTheme(key: string | null | undefined): FormTheme {
    return FORM_THEMES[key || 'site'] || FORM_THEMES.site;
}
