"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, CornerDownLeft } from 'lucide-react';
import { NAV_SECTIONS, canSee } from './nav-config';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    user?: { isSuperAdmin?: boolean; permissions?: string[] } | null;
}

type Item = { key: string; label: string; sub?: string | null; group: string; url: string };
type SearchResult = { id: string; type: string; category: string; title: string; subtitle?: string | null; url: string };

/** Ctrl+K: searches records the user may see and the modules in their menu. */
export function CommandPalette({ isOpen, onClose, user }: CommandPaletteProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const pages = useMemo<Item[]>(
        () => NAV_SECTIONS.flatMap((s) => s.items.filter((i) => canSee(user, i.perm)).map((i) => ({ key: i.href, label: i.title, group: 'Sayfalar', url: i.href }))),
        [user]
    );

    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(t);
    }, [isOpen]);

    useEffect(() => {
        const q = query.trim();
        if (!isOpen || q.length < 2) return;
        const controller = new AbortController();
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: controller.signal, cache: 'no-store' });
                const data = await res.json();
                setResults(Array.isArray(data.results) ? data.results : []);
                setActive(0);
            } catch {
                if (!controller.signal.aborted) setResults([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 200);
        return () => {
            controller.abort();
            clearTimeout(t);
        };
    }, [query, isOpen]);

    const q = query.trim().toLocaleLowerCase('tr');
    const items: Item[] = [
        ...(q.length >= 2 ? results.map((r) => ({ key: `${r.type}:${r.id}`, label: r.title, sub: r.subtitle, group: r.category, url: r.url })) : []),
        ...pages.filter((p) => !q || p.label.toLocaleLowerCase('tr').includes(q)).slice(0, q ? 8 : 12),
    ];

    const close = () => {
        setQuery('');
        setResults([]);
        onClose();
    };
    const go = (item: Item) => {
        close();
        router.push(item.url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm" onClick={close}>
            <div role="dialog" aria-modal="true" aria-label="Ara" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0e0e18] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <Search className="h-5 w-5 shrink-0 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        placeholder="Kişi, girişim, başvuru, form, görev veya sayfa arayın…"
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (e.target.value.trim().length < 2) setResults([]);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setActive((a) => Math.min(items.length - 1, a + 1));
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setActive((a) => Math.max(0, a - 1));
                            } else if (e.key === 'Enter' && items[active]) {
                                e.preventDefault();
                                go(items[active]);
                            } else if (e.key === 'Escape') {
                                close();
                            }
                        }}
                        className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                        aria-label="Arama"
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    <button type="button" onClick={close} className="rounded-lg p-1 text-gray-400 hover:text-white" aria-label="Kapat">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <ul className="max-h-96 overflow-y-auto p-2" role="listbox">
                    {items.length === 0 ? (
                        <li className="p-8 text-center text-sm text-gray-500">{loading ? 'Aranıyor…' : 'Sonuç bulunamadı.'}</li>
                    ) : (
                        items.map((item, i) => (
                            <li key={item.key} role="option" aria-selected={i === active}>
                                <button
                                    type="button"
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => go(item)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm text-white">{item.label}</span>
                                        {item.sub && <span className="block truncate text-[11px] text-gray-500">{item.sub}</span>}
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2 text-[11px] text-gray-500">
                                        {item.group}
                                        {i === active && <CornerDownLeft className="h-3 w-3" />}
                                    </span>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
                <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-4 py-2 text-[11px] text-gray-500">
                    <span>Yalnızca yetkili olduğunuz kayıtlar listelenir.</span>
                    <span>↑↓ seç · Enter aç · Esc kapat</span>
                </div>
            </div>
        </div>
    );
}
