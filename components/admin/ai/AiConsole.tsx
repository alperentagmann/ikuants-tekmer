'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Send, Loader2, Check, X, RotateCcw, ShieldAlert, ExternalLink, HelpCircle, Info } from 'lucide-react';
import type { EngineResponse } from '@/lib/ai/engine';
import type { AiContext, EntityRef, ResultCard } from '@/lib/ai/types';
import { api, Badge, cx } from '@/components/admin/ui';

type Exchange = {
    id: string;
    prompt: string;
    response?: EngineResponse;
    error?: string;
    undone?: string;
    cancelled?: boolean;
};

const RISK_LABEL: Record<string, { label: string; tone: 'neutral' | 'warning' | 'danger' | 'info' }> = {
    LOW: { label: 'Düşük risk', tone: 'neutral' },
    MEDIUM: { label: 'Orta risk', tone: 'info' },
    HIGH: { label: 'Yüksek risk', tone: 'warning' },
    CRITICAL: { label: 'Kritik', tone: 'danger' },
};

/** Derives the record the user is looking at from the current URL, for "bu / buna" references. */
function pageContext(): Pick<AiContext, 'route' | 'entityType' | 'entityId'> {
    if (typeof window === 'undefined') return {};
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    const uuid = '([0-9a-f-]{36})';
    const patterns: [RegExp, string][] = [
        [new RegExp(`^/admin/basvurular/${uuid}`), 'Application'],
        [new RegExp(`^/admin/girisimciler/${uuid}`), 'Entrepreneur'],
        [new RegExp(`^/admin/form-builder/${uuid}`), 'Form'],
    ];
    for (const [re, type] of patterns) {
        const m = pathname.match(re);
        if (m) return { route: pathname, entityType: type, entityId: m[1] };
    }
    if (params.get('personId')) return { route: pathname, entityType: 'Person', entityId: params.get('personId') };
    if (params.get('organizationId')) return { route: pathname, entityType: 'Organization', entityId: params.get('organizationId') };
    return { route: pathname };
}

export function ResultCardView({ card }: { card: ResultCard }) {
    const tone = card.status === 'success' ? 'border-emerald-500/30 bg-emerald-950/20' : card.status === 'warning' ? 'border-amber-500/30 bg-amber-950/20' : card.status === 'empty' ? 'border-white/10 bg-white/[0.02]' : 'border-sky-500/20 bg-sky-950/10';
    return (
        <div className={cx('rounded-xl border p-3 space-y-2.5', tone)}>
            <div className="text-sm font-semibold text-white">{card.title}</div>
            {card.summary && <p className="text-xs text-gray-300 whitespace-pre-line">{card.summary}</p>}
            {card.fields && card.fields.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {card.fields.map((f) => (
                        <div key={f.label} className="min-w-0">
                            <dt className="text-gray-500">{f.label}</dt>
                            <dd className="text-gray-100 break-words whitespace-pre-line">{f.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {card.table && card.table.rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-xs">
                        <thead className="bg-white/5 text-gray-400">
                            <tr>{card.table.columns.map((c) => <th key={c} className="px-2.5 py-1.5 text-left font-medium whitespace-nowrap">{c}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {card.table.rows.map((r, i) => (
                                <tr key={i} className="text-gray-200 hover:bg-white/[0.03]">
                                    {r.cells.map((c, j) => (
                                        <td key={j} className="px-2.5 py-1.5 align-top">
                                            {j === 0 && r.href ? <Link href={r.href} className="text-blue-300 hover:underline">{c}</Link> : c}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {card.table && card.table.rows.length === 0 && card.status !== 'empty' && <p className="text-xs text-gray-500">Kayıt yok.</p>}
            {card.links && card.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {card.links.map((l) => (
                        <Link key={l.href + l.label} href={l.href} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200 hover:border-primary/40 hover:text-white">
                            <ExternalLink className="h-3 w-3" /> {l.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export function AiConsole({ variant = 'full', suggestions, onChanged }: { variant?: 'hero' | 'full' | 'drawer'; suggestions?: string[]; onChanged?: () => void }) {
    const [prompt, setPrompt] = useState('');
    const [busy, setBusy] = useState<string | null>(null);
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [lastEntity, setLastEntity] = useState<EntityRef | null>(null);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (variant !== 'hero') endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [exchanges, variant]);

    const update = (id: string, patch: Partial<Exchange>) => setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const remember = (entity?: EntityRef | null) => {
        if (entity) setLastEntity(entity);
    };

    const submit = useCallback(
        async (text?: string) => {
            const value = (text ?? prompt).trim();
            if (!value || busy) return;
            const id = `${Date.now()}`;
            setExchanges((prev) => (variant === 'hero' ? [{ id, prompt: value }] : [...prev, { id, prompt: value }]));
            setPrompt('');
            setBusy('chat');
            try {
                const data = await api<{ response: EngineResponse }>('/api/admin/ai/chat', {
                    method: 'POST',
                    json: { prompt: value, context: { ...pageContext(), lastEntity: lastEntity ? { type: lastEntity.type, id: lastEntity.id, label: lastEntity.label } : null } },
                });
                update(id, { response: data.response });
                if (data.response.type === 'result') remember(data.response.entity);
            } catch (e) {
                update(id, { error: e instanceof Error ? e.message : 'Komut işlenemedi' });
            } finally {
                setBusy(null);
            }
        },
        [prompt, busy, variant, lastEntity]
    );

    const confirm = async (ex: Exchange) => {
        if (ex.response?.type !== 'confirm') return;
        setBusy(ex.id);
        try {
            const data = await api<{ response: EngineResponse }>('/api/admin/ai/execute', { method: 'POST', json: { changeSetId: ex.response.changeSetId } });
            update(ex.id, { response: data.response });
            if (data.response.type === 'executed') remember(data.response.entity);
            onChanged?.();
        } catch (e) {
            update(ex.id, { error: e instanceof Error ? e.message : 'İşlem çalıştırılamadı' });
        } finally {
            setBusy(null);
        }
    };

    const cancel = async (ex: Exchange) => {
        if (ex.response?.type !== 'confirm') return;
        setBusy(ex.id);
        try {
            await api('/api/admin/ai/cancel', { method: 'POST', json: { changeSetId: ex.response.changeSetId } });
            update(ex.id, { cancelled: true });
        } catch (e) {
            update(ex.id, { error: e instanceof Error ? e.message : 'İptal edilemedi' });
        } finally {
            setBusy(null);
        }
    };

    const undo = async (ex: Exchange) => {
        if (ex.response?.type !== 'executed') return;
        setBusy(ex.id);
        try {
            const data = await api<{ message: string }>('/api/admin/ai/undo', { method: 'POST', json: { changeSetId: ex.response.changeSetId } });
            update(ex.id, { undone: data.message || 'İşlem geri alındı.' });
            onChanged?.();
        } catch (e) {
            update(ex.id, { error: e instanceof Error ? e.message : 'Geri alma başarısız' });
        } finally {
            setBusy(null);
        }
    };

    const chips = suggestions || [];
    const input = (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-2 focus-within:border-primary transition-colors">
            <label htmlFor="ai-command-input" className="sr-only">AI komutu</label>
            <input
                id="ai-command-input"
                type="text"
                value={prompt}
                maxLength={4000}
                autoComplete="off"
                placeholder="Örn: Bekleyen TEKMER başvurularını göster"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                    }
                }}
                className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            <button
                id="ai-command-submit-btn"
                type="button"
                onClick={() => submit()}
                disabled={busy === 'chat' || !prompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-50"
            >
                {busy === 'chat' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Çalıştır</span>
            </button>
        </div>
    );

    return (
        <div className={cx('flex flex-col gap-3', variant === 'drawer' && 'h-full')}>
            {variant !== 'drawer' && input}
            {chips.length > 0 && exchanges.length === 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500">Öneriler:</span>
                    {chips.map((c) => (
                        <button key={c} type="button" onClick={() => submit(c)} className="rounded-xl border border-white/5 bg-white/5 px-3 py-1 text-[11px] text-gray-300 hover:border-primary/30 hover:bg-primary/20 hover:text-white">
                            {c}
                        </button>
                    ))}
                </div>
            )}

            <div className={cx('space-y-3', variant === 'drawer' && 'flex-1 overflow-y-auto pr-1')} aria-live="polite">
                {exchanges.map((ex) => (
                    <div key={ex.id} className="space-y-2">
                        {variant !== 'hero' && <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary/20 px-3 py-2 text-xs text-white">{ex.prompt}</div>}
                        {!ex.response && !ex.error && <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Komut yorumlanıyor…</div>}
                        {ex.error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200">{ex.error}</div>}
                        {ex.response && <ResponseView ex={ex} busy={busy === ex.id} onConfirm={() => confirm(ex)} onCancel={() => cancel(ex)} onUndo={() => undo(ex)} onSuggestion={(s) => submit(s)} />}
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            {variant === 'drawer' && input}
            {lastEntity && variant !== 'hero' && (
                <p className="text-[11px] text-gray-500">
                    Bağlam: <Link href={lastEntity.href} className="text-gray-300 hover:underline">{lastEntity.label}</Link> — &quot;bu&quot;, &quot;buna&quot; ifadeleri bu kayda uygulanır.
                </p>
            )}
        </div>
    );
}

function ResponseView({ ex, busy, onConfirm, onCancel, onUndo, onSuggestion }: { ex: Exchange; busy: boolean; onConfirm: () => void; onCancel: () => void; onUndo: () => void; onSuggestion: (s: string) => void }) {
    const r = ex.response!;
    if (r.type === 'result') return <ResultCardView card={r.card} />;
    if (r.type === 'clarify' || r.type === 'help') {
        return (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-gray-200">
                    {r.type === 'clarify' ? <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />}
                    <span>{r.message}</span>
                </div>
                {r.suggestions && r.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {r.suggestions.map((s) => (
                            <button key={s} type="button" onClick={() => onSuggestion(s)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300 hover:text-white">{s}</button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    if (r.type === 'denied') {
        return (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {r.message}
            </div>
        );
    }
    if (r.type === 'confirm') {
        const risk = RISK_LABEL[r.risk] || RISK_LABEL.MEDIUM;
        return (
            <div className="rounded-2xl border border-primary/40 bg-[#090814] p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> <span>AI Operasyon Planı & Önizleme</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Badge tone={risk.tone}>{risk.label}</Badge>
                        <Badge tone={r.undoable ? 'neutral' : 'warning'}>{r.undoable ? 'Geri alınabilir' : 'Geri alınamaz'}</Badge>
                    </div>
                </div>
                <ResultCardView card={r.preview} />
                {ex.cancelled ? (
                    <p className="text-xs text-gray-400">İşlem iptal edildi; hiçbir değişiklik yapılmadı.</p>
                ) : (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <button type="button" onClick={onCancel} disabled={busy} className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:text-white disabled:opacity-50">
                            <X className="h-3.5 w-3.5" /> Vazgeç
                        </button>
                        <button id="ai-confirm-execute-btn" type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-primary/20 disabled:opacity-50">
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Onayla ve Uygula
                        </button>
                    </div>
                )}
            </div>
        );
    }
    // executed
    return (
        <div className="space-y-2">
            <ResultCardView card={r.card} />
            {ex.undone ? (
                <p className="text-xs text-amber-200">↺ {ex.undone}</p>
            ) : r.undoable ? (
                <div className="flex justify-end">
                    <button id="ai-undo-btn" type="button" onClick={onUndo} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50">
                        <RotateCcw className={cx('h-3.5 w-3.5', busy && 'animate-spin')} /> Geri Al
                    </button>
                </div>
            ) : (
                <p className="text-[11px] text-gray-500">Bu işlem AI üzerinden geri alınamaz; gerekirse ilgili ekrandan düzeltin.</p>
            )}
        </div>
    );
}
