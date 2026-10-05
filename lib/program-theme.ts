import type { CSSProperties } from 'react';

/**
 * Per-program visual theme. Stored as JSON on Program.themeJson; older programs that only
 * have a Tailwind gradient in `colorCode` ("from-orange-500 to-red-600") are mapped to hex.
 */
export interface ProgramTheme {
    primary: string;
    secondary: string;
    accent: string;
    buttonStyle: 'gradient' | 'solid' | 'outline';
    radius: 'md' | 'xl' | 'full';
    textOnPrimary: string;
}

export const DEFAULT_PROGRAM_THEME: ProgramTheme = {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#22d3ee',
    buttonStyle: 'gradient',
    radius: 'xl',
    textOnPrimary: '#ffffff',
};

export const PROGRAM_THEME_PRESETS: { name: string; theme: Partial<ProgramTheme> }[] = [
    { name: 'Mor & Pembe', theme: { primary: '#7c3aed', secondary: '#ec4899', accent: '#f0abfc' } },
    { name: 'Ateş', theme: { primary: '#f97316', secondary: '#dc2626', accent: '#fdba74' } },
    { name: 'Okyanus', theme: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#67e8f9' } },
    { name: 'Orman', theme: { primary: '#10b981', secondary: '#059669', accent: '#6ee7b7' } },
    { name: 'Gün batımı', theme: { primary: '#f59e0b', secondary: '#ec4899', accent: '#fde68a' } },
    { name: 'Gül', theme: { primary: '#ec4899', secondary: '#e11d48', accent: '#fbcfe8' } },
    { name: 'Gece mavisi', theme: { primary: '#4f46e5', secondary: '#0ea5e9', accent: '#a5b4fc' } },
    { name: 'Kurumsal', theme: { primary: '#1e3a8a', secondary: '#0f766e', accent: '#93c5fd', buttonStyle: 'solid' } },
];

const TAILWIND_HEX: Record<string, string> = {
    'purple-500': '#a855f7', 'purple-600': '#9333ea', 'pink-500': '#ec4899', 'orange-500': '#f97316', 'red-600': '#dc2626',
    'red-500': '#ef4444', 'cyan-500': '#06b6d4', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'rose-600': '#e11d48',
    'green-500': '#22c55e', 'emerald-500': '#10b981', 'indigo-500': '#6366f1', 'yellow-400': '#facc15', 'amber-500': '#f59e0b',
    'teal-500': '#14b8a6', 'sky-500': '#0ea5e9', 'violet-500': '#8b5cf6', 'fuchsia-500': '#d946ef',
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHexColor = (v: unknown): v is string => typeof v === 'string' && HEX_RE.test(v);

/** Known slugs keep their historical colors when no theme was saved. */
const SLUG_FALLBACK: Record<string, Partial<ProgramTheme>> = {
    antspark: { primary: '#a855f7', secondary: '#ec4899' },
    antsfire: { primary: '#f97316', secondary: '#dc2626' },
    'glow-up-ideathon': { primary: '#06b6d4', secondary: '#3b82f6' },
};

export function resolveProgramTheme(program: { themeJson?: string | null; theme?: unknown; colorCode?: string | null; slug?: string | null }): ProgramTheme {
    let stored: Partial<ProgramTheme> = {};
    const raw = program.theme ?? program.themeJson;
    if (raw && typeof raw === 'object') stored = raw as Partial<ProgramTheme>;
    else if (typeof raw === 'string') {
        try {
            stored = JSON.parse(raw);
        } catch {
            stored = {};
        }
    }
    let fromCode: Partial<ProgramTheme> = {};
    const m = (program.colorCode || '').match(/from-([a-z]+-\d{3}).*?to-([a-z]+-\d{3})/);
    if (m && TAILWIND_HEX[m[1]] && TAILWIND_HEX[m[2]]) fromCode = { primary: TAILWIND_HEX[m[1]], secondary: TAILWIND_HEX[m[2]] };
    const slug = (program.slug || '').toLowerCase();
    const bySlug = Object.entries(SLUG_FALLBACK).find(([k]) => slug.startsWith(k))?.[1] || {};
    const merged = { ...DEFAULT_PROGRAM_THEME, ...bySlug, ...fromCode };
    return {
        primary: isHexColor(stored.primary) ? stored.primary : merged.primary,
        secondary: isHexColor(stored.secondary) ? stored.secondary : merged.secondary,
        accent: isHexColor(stored.accent) ? stored.accent : merged.accent,
        textOnPrimary: isHexColor(stored.textOnPrimary) ? stored.textOnPrimary : merged.textOnPrimary,
        buttonStyle: stored.buttonStyle && ['gradient', 'solid', 'outline'].includes(stored.buttonStyle) ? stored.buttonStyle : merged.buttonStyle,
        radius: stored.radius && ['md', 'xl', 'full'].includes(stored.radius) ? stored.radius : merged.radius,
    };
}

/** Sanitizes a theme coming from the admin editor before it is stored. */
export function sanitizeProgramTheme(input: unknown): string | null {
    if (!input || typeof input !== 'object') return null;
    const t = resolveProgramTheme({ theme: input });
    return JSON.stringify(t);
}

export function themeButtonStyle(t: ProgramTheme, variant: 'primary' | 'secondary' = 'primary'): CSSProperties {
    const radius = t.radius === 'full' ? '9999px' : t.radius === 'md' ? '0.5rem' : '0.875rem';
    if (variant === 'secondary') return { borderRadius: radius, border: `1.5px solid ${t.primary}`, color: t.primary, background: 'transparent' };
    if (t.buttonStyle === 'outline') return { borderRadius: radius, border: `2px solid ${t.primary}`, color: t.primary, background: 'transparent' };
    if (t.buttonStyle === 'solid') return { borderRadius: radius, background: t.primary, color: t.textOnPrimary };
    return { borderRadius: radius, backgroundImage: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: t.textOnPrimary };
}

export function hexWithAlpha(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0');
    return `#${full}${a}`;
}
