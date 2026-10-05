'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { api } from '@/components/admin/ui';

export interface PersonOption {
    id: string;
    name: string;
    email?: string;
    title?: string | null;
    department?: string | null;
    avatarUrl?: string | null;
    roles?: string[];
}

let cache: Promise<PersonOption[]> | null = null;

/** Active admins (including the current user), loaded once per page. */
export function usePeople(): PersonOption[] {
    const [people, setPeople] = useState<PersonOption[]>([]);
    useEffect(() => {
        let alive = true;
        if (!cache) cache = api<{ users: PersonOption[] }>('/api/admin/work/targets?includeSelf=1').then((d) => d.users).catch(() => { cache = null; return []; });
        cache.then((u) => alive && setPeople(u));
        return () => {
            alive = false;
        };
    }, []);
    return people;
}

const palette = ['from-violet-500 to-fuchsia-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500'];

export function Avatar({ name, url, size = 28, ring }: { name: string; url?: string | null; size?: number; ring?: boolean }) {
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toLocaleUpperCase('tr-TR')).join('') || '?';
    const color = palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
    const cls = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${color} font-semibold text-white ${ring ? 'ring-2 ring-[#0b0b16]' : ''}`;
    return url ? (
        <img src={url} alt={name} title={name} className={cls} style={{ width: size, height: size }} />
    ) : (
        <span className={cls} style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }} title={name}>{initials}</span>
    );
}

export function AvatarStack({ people, max = 4, size = 26 }: { people: { name: string; avatarUrl?: string | null }[]; max?: number; size?: number }) {
    return (
        <span className="inline-flex items-center -space-x-2">
            {people.slice(0, max).map((p, i) => <Avatar key={`${p.name}-${i}`} name={p.name} url={p.avatarUrl} size={size} ring />)}
            {people.length > max && <span className="inline-flex items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-gray-300 ring-2 ring-[#0b0b16]" style={{ width: size, height: size }}>+{people.length - max}</span>}
        </span>
    );
}

/** Searchable multi-select list of admins. */
export function PeoplePicker({ value, onChange, single, placeholder = 'Kişi ara' }: { value: string[]; onChange: (ids: string[]) => void; single?: boolean; placeholder?: string }) {
    const people = usePeople();
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const s = q.trim().toLocaleLowerCase('tr-TR');
        return s ? people.filter((p) => `${p.name} ${p.title || ''} ${p.department || ''}`.toLocaleLowerCase('tr-TR').includes(s)) : people;
    }, [people, q]);
    const toggle = (id: string) => onChange(single ? (value[0] === id ? [] : [id]) : value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary" />
            </div>
            <ul className="max-h-56 space-y-1 overflow-y-auto">
                {filtered.map((p) => {
                    const on = value.includes(p.id);
                    return (
                        <li key={p.id}>
                            <button type="button" onClick={() => toggle(p.id)} aria-pressed={on} className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${on ? 'border-primary/60 bg-primary/15 text-white' : 'border-white/10 text-gray-300 hover:border-white/25'}`}>
                                <Avatar name={p.name} url={p.avatarUrl} size={24} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate">{p.name}</span>
                                    {(p.title || p.department) && <span className="block truncate text-[11px] text-gray-500">{[p.title, p.department].filter(Boolean).join(' · ')}</span>}
                                </span>
                                {on && <Check className="h-4 w-4 text-primary" />}
                            </button>
                        </li>
                    );
                })}
                {filtered.length === 0 && <li className="px-2 py-3 text-center text-xs text-gray-500">Kişi bulunamadı</li>}
            </ul>
        </div>
    );
}
