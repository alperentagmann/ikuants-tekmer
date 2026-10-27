"use client";
/**
 * Operasyon ekranları (alan yönetimi, PDKS, sözleşmeler, panel) için ui.tsx üzerine ince katman:
 * veri yükleme, form durumu, etiketli alanlar, durum göstergeleri ve tablo sınıfları.
 * Görsel dil components/admin/ui.tsx ile aynıdır.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import { api, Alert, Badge, Button, Field, Select, Skeleton, TextArea, TextInput, cx } from '@/components/admin/ui';

// ─── Veri ────────────────────────────────────────────────────────────────────

export type LoadError = { message: string; status: number };

function toLoadError(e: unknown): LoadError {
    const err = e as Error & { data?: { status?: number } };
    const m = /HTTP (\d{3})/.exec(err.message || '');
    const msg = err.message || 'Bağlantı hatası.';
    const status = m ? Number(m[1]) : /yetki/i.test(msg) ? 403 : /Oturum/i.test(msg) ? 401 : 0;
    return { message: msg, status };
}

/** GET + yeniden yükleme. Hızlı filtre değişiminde yalnız son isteğin sonucu uygulanır. */
export function useApi<T>(url: string | null) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<LoadError | null>(null);
    const [loading, setLoading] = useState(true);
    const seq = useRef(0);
    const load = useCallback(async () => {
        if (!url) return;
        const mine = ++seq.current;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(url, { cache: 'no-store' });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || body.success === false) throw Object.assign(new Error(body.message || body.error || 'İstek başarısız.'), { statusCode: res.status });
            if (mine === seq.current) setData(body as T);
        } catch (e) {
            if (mine === seq.current) {
                const status = (e as { statusCode?: number }).statusCode ?? 0;
                setError({ ...toLoadError(e), ...(status ? { status } : {}) });
            }
        } finally {
            if (mine === seq.current) setLoading(false);
        }
    }, [url]);
    useEffect(() => { load(); }, [load]);
    return { data, error, loading, reload: load };
}

type Me = { id: string; name: string; isSuperAdmin: boolean; permissions: string[] };
let meCache: Promise<Me | null> | null = null;
/** Arayüz ipucu: yetkisiz düğmeleri gizler. Yetkiyi sunucu ayrıca uygular. */
export function useMe() {
    const [me, setMe] = useState<Me | null>(null);
    useEffect(() => {
        meCache ??= fetch('/api/admin/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => (d.success ? d.user : null)).catch(() => null);
        meCache.then(setMe);
    }, []);
    const can = useCallback((action: string, resource: string) => {
        if (!me) return false;
        if (me.isSuperAdmin) return true;
        return me.permissions.some((p) => {
            const [a, r] = p.split(':');
            return (a === action || a === '*') && (r === resource || r === '*');
        });
    }, [me]);
    return { me, can };
}

/** Basit form durumu: değerler + alan hataları + gönderim. */
export function useForm<T extends Record<string, string>>(initial: T) {
    const [values, setValues] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const set = useCallback((k: keyof T, v: string) => {
        setValues((p) => ({ ...p, [k]: v }));
        setErrors((e) => (e[k as string] ? { ...e, [k as string]: '' } : e));
    }, []);
    const bind = (k: keyof T) => ({
        value: values[k] ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value),
        error: errors[k as string] || undefined,
    });
    const submit = async (fn: () => Promise<void>, onError?: (e: Error & { data?: { fieldErrors?: Record<string, string> } }) => void) => {
        setSaving(true);
        try {
            await fn();
        } catch (e) {
            const err = e as Error & { data?: { fieldErrors?: Record<string, string> } };
            if (err.data?.fieldErrors) setErrors(err.data.fieldErrors);
            onError?.(err);
        } finally {
            setSaving(false);
        }
    };
    return { values, setValues, set, bind, errors, setErrors, saving, submit };
}

export { api };

/** Sayfa içi bildirim (başarı / hata). `node` sayfanın üstünde gösterilir; 5 sn sonra kapanır. */
export function useNotice() {
    const [msg, setMsg] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(() => setMsg(null), 5000);
        return () => clearTimeout(t);
    }, [msg]);
    const node = msg ? <div className="fixed bottom-4 right-4 z-[80] w-[min(92vw,26rem)]"><Alert tone={msg.tone} onClose={() => setMsg(null)}>{msg.text}</Alert></div> : null;
    return { node, success: (text: string) => setMsg({ tone: 'success', text }), error: (text: string) => setMsg({ tone: 'danger', text }) };
}

// ─── Etiketli alanlar ────────────────────────────────────────────────────────

type Common = { label: string; error?: string; hint?: string; required?: boolean; className?: string };

export function LInput({ label, error, hint, required, className, ...rest }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
    const id = useId();
    return <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}><TextInput id={id} required={required} aria-invalid={Boolean(error)} {...rest} /></Field>;
}
export function LSelect({ label, error, hint, required, className, options, placeholder, ...rest }: Common & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
    const id = useId();
    return <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}><Select id={id} required={required} aria-invalid={Boolean(error)} options={options} placeholder={placeholder} {...rest} /></Field>;
}
export function LTextArea({ label, error, hint, required, className, ...rest }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const id = useId();
    return <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}><TextArea id={id} required={required} aria-invalid={Boolean(error)} rows={2} {...rest} /></Field>;
}

// ─── Durumlar ────────────────────────────────────────────────────────────────

export function LoadingRows({ rows = 5 }: { rows?: number }) {
    return <div className="p-4"><Skeleton rows={rows} /></div>;
}

export function ErrorState({ error, onRetry }: { error: LoadError; onRetry?: () => void }) {
    if (error.status === 401 || error.status === 403) {
        return (
            <div className="px-6 py-12 text-center">
                <Lock className="mx-auto h-8 w-8 text-amber-300/80" aria-hidden />
                <p className="mt-3 text-sm font-medium text-gray-200">Bu alanı görüntüleme yetkiniz yok</p>
                <p className="mt-1 text-sm text-gray-500">Erişim gerekiyorsa sistem yöneticinizden ilgili rolü talep edin.</p>
            </div>
        );
    }
    return (
        <div className="px-6 py-10 text-center" role="alert">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-300/80" aria-hidden />
            <p className="mt-3 text-sm text-rose-200">{error.message}</p>
            {onRetry && <Button className="mt-4" icon={RefreshCw} onClick={onRetry}>Tekrar dene</Button>}
        </div>
    );
}

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
export const Pill = Badge;

export function Stat({ label, value, hint, tone = 'default' }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
    const toneCls = { default: 'text-white', good: 'text-emerald-300', warn: 'text-amber-300', bad: 'text-rose-300' }[tone];
    return (
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
            <p className="truncate text-xs text-gray-400">{label}</p>
            <p className={cx('mt-1 truncate text-lg font-semibold tabular-nums tracking-tight sm:text-xl', toneCls)}>{value}</p>
            {hint && <p className="mt-0.5 truncate text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'warn' | 'bad' }) {
    const v = Math.max(0, Math.min(100, value));
    const cls = tone === 'bad' ? 'bg-rose-400' : tone === 'warn' ? 'bg-amber-400' : 'bg-primary';
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
            <div className={cx('h-full rounded-full transition-[width] duration-500', cls)} style={{ width: `${v}%` }} />
        </div>
    );
}

/** Tablo kabuğu — yatay kaydırma mobilde sayfayı taşırmaz. */
export function TableShell({ children }: { children: React.ReactNode }) {
    return <div className="relative overflow-x-auto"><table className="w-full text-sm">{children}</table></div>;
}
export const th = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap';
export const td = 'px-4 py-3 align-middle text-gray-200';

// ─── Biçimlendirme ───────────────────────────────────────────────────────────

export function fmtMoney(n: number | null | undefined, currency = 'TRY') {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);
}
export function fmtDate(d: string | Date | null | undefined, withTime = false) {
    if (!d) return '—';
    const x = typeof d === 'string' ? new Date(d) : d;
    return x.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
}
export function toDateInput(d: string | Date | null | undefined) {
    if (!d) return '';
    const x = typeof d === 'string' ? new Date(d) : d;
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export const fmtNum = (n: number | null | undefined, digits = 1) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits }).format(n));
