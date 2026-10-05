'use client';

/**
 * Admin design system primitives. New admin screens use these so headers,
 * buttons, inputs, tabs, empty states and dialogs look the same everywhere.
 */
import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Loader2, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';

export function cx(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- Layout

export function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    breadcrumb,
}: {
    title: string;
    description?: React.ReactNode;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    breadcrumb?: { label: string; href?: string }[];
}) {
    return (
        <div className="mb-6">
            {breadcrumb && breadcrumb.length > 0 && (
                <nav aria-label="Konum" className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    {breadcrumb.map((b, i) => (
                        <React.Fragment key={`${b.label}-${i}`}>
                            {i > 0 && <span aria-hidden="true">/</span>}
                            {b.href ? (
                                <Link href={b.href} className="hover:text-gray-300">{b.label}</Link>
                            ) : (
                                <span className="text-gray-400">{b.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2.5 text-xl font-semibold text-white">
                        {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
                        <span className="truncate">{title}</span>
                    </h1>
                    {description && <p className="mt-1 max-w-3xl text-sm text-gray-400">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}

export function Card({ children, className, padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
    return <div className={cx('glass-card rounded-xl border border-white/10 bg-white/[0.02]', padded && 'p-5', className)}>{children}</div>;
}

export function SectionTitle({ children, actions, hint }: { children: React.ReactNode; actions?: React.ReactNode; hint?: string }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <div>
                <h2 className="text-sm font-semibold text-white">{children}</h2>
                {hint && <p className="text-xs text-gray-500">{hint}</p>}
            </div>
            {actions}
        </div>
    );
}

// ---------------------------------------------------------------- Buttons

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90 border border-primary',
    secondary: 'bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10',
    ghost: 'bg-transparent text-gray-300 hover:bg-white/5 border border-transparent',
    danger: 'bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-600',
};

export function Button({
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    loading,
    children,
    className,
    ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md'; icon?: LucideIcon; loading?: boolean }) {
    return (
        <button
            type="button"
            {...rest}
            disabled={rest.disabled || loading}
            className={cx(
                'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50',
                size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
                BUTTON_VARIANTS[variant],
                className
            )}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" /> : null}
            {children}
        </button>
    );
}

export function LinkButton({ href, children, icon: Icon, variant = 'secondary', size = 'md', target }: { href: string; children: React.ReactNode; icon?: LucideIcon; variant?: ButtonVariant; size?: 'sm' | 'md'; target?: string }) {
    return (
        <Link
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            className={cx(
                'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
                BUTTON_VARIANTS[variant]
            )}
        >
            {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />}
            {children}
        </Link>
    );
}

// ---------------------------------------------------------------- Form controls

export const inputClass =
    'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60';

export function Field({ label, htmlFor, hint, error, required, children, className }: { label: string; htmlFor?: string; hint?: string; error?: string | null; required?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <div className={cx('space-y-1', className)}>
            <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-400">
                {label}
                {required && <span className="text-rose-400"> *</span>}
            </label>
            {children}
            {hint && !error && <p className="text-[11px] text-gray-500">{hint}</p>}
            {error && <p className="text-[11px] text-rose-400" role="alert">{error}</p>}
        </div>
    );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cx(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cx(inputClass, 'min-h-[72px]', props.className)} />;
}

export function Select({ options, placeholder, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
    return (
        <select {...props} className={cx(inputClass, props.className)}>
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0f0f1a]">{o.label}</option>
            ))}
        </select>
    );
}

export function Toggle({ checked, onChange, label, id, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string; disabled?: boolean }) {
    return (
        <label htmlFor={id} className={cx('inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300', disabled && 'cursor-not-allowed opacity-60')}>
            <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <span className="relative h-5 w-9 rounded-full bg-white/10 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" aria-hidden="true" />
            {label}
        </label>
    );
}

// ---------------------------------------------------------------- Feedback

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' }) {
    const tones: Record<string, string> = {
        neutral: 'bg-white/5 text-gray-300 border-white/10',
        success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        danger: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        primary: 'bg-primary/10 text-blue-300 border-primary/30',
    };
    return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium', tones[tone])}>{children}</span>;
}

export function Alert({ tone = 'info', title, children, onClose }: { tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children?: React.ReactNode; onClose?: () => void }) {
    const map = {
        info: { cls: 'border-sky-500/30 bg-sky-500/10 text-sky-200', Icon: Info },
        success: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200', Icon: CheckCircle2 },
        warning: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-200', Icon: AlertTriangle },
        danger: { cls: 'border-rose-500/30 bg-rose-500/10 text-rose-200', Icon: AlertTriangle },
    }[tone];
    return (
        <div className={cx('flex items-start gap-2.5 rounded-lg border p-3 text-sm', map.cls)} role={tone === 'danger' ? 'alert' : 'status'}>
            <map.Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                {title && <div className="font-medium">{title}</div>}
                {children && <div className={cx(title && 'mt-0.5', 'text-[13px] opacity-90')}>{children}</div>}
            </div>
            {onClose && (
                <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100" aria-label="Kapat">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
            {Icon && <Icon className="mb-3 h-8 w-8 text-gray-600" aria-hidden="true" />}
            <p className="text-sm font-medium text-gray-200">{title}</p>
            {description && <p className="mt-1 max-w-md text-xs text-gray-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-2" aria-busy="true" aria-label="Yükleniyor">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------- Tabs

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string; count?: number | null; icon?: LucideIcon }[]; value: T; onChange: (v: T) => void }) {
    return (
        <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-white/10">
            {tabs.map((t) => (
                <button
                    key={t.value}
                    role="tab"
                    type="button"
                    aria-selected={value === t.value}
                    onClick={() => onChange(t.value)}
                    className={cx(
                        '-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
                        value === t.value ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
                    )}
                >
                    {t.icon && <t.icon className="h-4 w-4" aria-hidden="true" />}
                    {t.label}
                    {typeof t.count === 'number' && <span className="rounded bg-white/10 px-1.5 text-[11px] text-gray-300">{t.count}</span>}
                </button>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------- Overlays

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
    return (
        <div className="glass-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} className={cx('glass-panel flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-white/10 bg-[#0d0d17] shadow-2xl sm:rounded-2xl', width)} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">{title}</h2>
                        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Kapat">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div>}
            </div>
        </div>
    );
}

export function Drawer({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="glass-overlay fixed inset-0 z-50 flex justify-end bg-black/45" onClick={onClose}>
            <aside role="dialog" aria-modal="true" aria-label={title} className="glass-panel flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#0d0d17] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-white">{title}</h2>
                        {subtitle && <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>}
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Kapat">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div>}
            </aside>
        </div>
    );
}

// ---------------------------------------------------------------- Data

export function KeyValue({ items }: { items: { label: string; value: React.ReactNode }[] }) {
    return (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {items.map((i) => (
                <div key={i.label} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wide text-gray-500">{i.label}</dt>
                    <dd className="mt-0.5 break-words text-sm text-gray-200">{i.value ?? <span className="text-gray-600">Bilgi girilmemiş</span>}</dd>
                </div>
            ))}
        </dl>
    );
}

export function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' });
}

export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

/** Small fetch helper for admin screens: JSON in/out, throws with the API message. */
export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: { ...(init?.json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(init?.headers || {}) },
        body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
        cache: 'no-store',
    });
    let data: Record<string, unknown> = {};
    try {
        data = await res.json();
    } catch {
        data = {};
    }
    if (!res.ok || data.success === false) {
        const problems = Array.isArray(data.problems) ? ` ${(data.problems as string[]).join(' ')}` : '';
        const err = new Error(String(data.message || data.error || `İstek başarısız (HTTP ${res.status})`) + (problems && !String(data.message || '').includes(problems.trim()) ? problems : '')) as Error & { data?: unknown };
        err.data = data;
        throw err;
    }
    return data as T;
}
