'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Minus, Plus, Search, X } from 'lucide-react';
import { PERMISSION_MODULES, actionLabel, moduleOf, resourceLabel } from '@/lib/permission-catalog';

export interface CatalogPermission {
    id: string;
    action: string;
    resource: string;
    description: string | null;
}

export type OverrideState = 'inherit' | 'grant' | 'deny';

type Props =
    | { mode: 'role'; catalog: CatalogPermission[]; selected: Set<string>; onToggle: (id: string, on: boolean) => void; readOnly?: boolean }
    | { mode: 'user'; catalog: CatalogPermission[]; inherited: Set<string>; overrides: Map<string, OverrideState>; onChange: (id: string, state: OverrideState) => void; readOnly?: boolean };

const ACTION_ORDER = ['*', 'view', 'view_all', 'create', 'edit', 'update', 'delete', 'approve', 'publish', 'export', 'manage', 'assign', 'assign_role'];
const order = (a: string) => {
    const i = ACTION_ORDER.indexOf(a);
    return i === -1 ? 100 : i;
};

/**
 * Permission matrix grouped by module. In "role" mode each cell is a checkbox; in "user" mode a
 * cell cycles inherit → grant → deny, showing what the user's roles already allow.
 */
export function PermissionMatrix(props: Props) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState<Set<string>>(() => new Set(PERMISSION_MODULES.map((m) => m.key)));

    const grouped = useMemo(() => {
        const q = query.trim().toLocaleLowerCase('tr-TR');
        const byResource = new Map<string, CatalogPermission[]>();
        for (const p of props.catalog) {
            if (p.resource === '*') continue;
            const hay = `${resourceLabel(p.resource)} ${p.resource} ${actionLabel(p.action)} ${p.description || ''}`.toLocaleLowerCase('tr-TR');
            if (q && !hay.includes(q)) continue;
            byResource.set(p.resource, [...(byResource.get(p.resource) || []), p]);
        }
        const modules = [...PERMISSION_MODULES, { key: 'other', label: 'Diğer', resources: [] as string[] }];
        return modules
            .map((m) => ({ ...m, rows: Array.from(byResource.entries()).filter(([r]) => moduleOf(r) === m.key).map(([resource, perms]) => ({ resource, perms: perms.sort((a, b) => order(a.action) - order(b.action)) })) }))
            .filter((m) => m.rows.length > 0);
    }, [props.catalog, query]);

    const cell = (p: CatalogPermission) => {
        const title = p.description || `${resourceLabel(p.resource)} — ${actionLabel(p.action)}`;
        if (props.mode === 'role') {
            const on = props.selected.has(p.id);
            return (
                <button
                    key={p.id}
                    type="button"
                    disabled={props.readOnly}
                    onClick={() => props.onToggle(p.id, !on)}
                    title={title}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-colors disabled:cursor-default ${on ? 'border-primary/60 bg-primary/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200'}`}
                >
                    {on ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />} {actionLabel(p.action)}
                </button>
            );
        }
        const state = props.overrides.get(p.id) || 'inherit';
        const inherited = props.inherited.has(p.id);
        const next: Record<OverrideState, OverrideState> = { inherit: 'grant', grant: 'deny', deny: 'inherit' };
        const style =
            state === 'grant' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200' : state === 'deny' ? 'border-rose-500/60 bg-rose-500/15 text-rose-200 line-through' : inherited ? 'border-primary/40 bg-primary/10 text-gray-200' : 'border-white/10 text-gray-500';
        const icon = state === 'grant' ? <Plus className="h-3 w-3" /> : state === 'deny' ? <X className="h-3 w-3" /> : inherited ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />;
        const stateText = state === 'grant' ? 'kişisel olarak verildi' : state === 'deny' ? 'kişisel olarak engellendi' : inherited ? 'rolden geliyor' : 'yok';
        return (
            <button key={p.id} type="button" disabled={props.readOnly} onClick={() => props.onChange(p.id, next[state])} title={`${title} · ${stateText}`} aria-label={`${resourceLabel(p.resource)} ${actionLabel(p.action)}: ${stateText}`} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-colors disabled:cursor-default ${style}`}>
                {icon} {actionLabel(p.action)}
            </button>
        );
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="İzin ara (ör. fatura, görev, yayınla)" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary" />
            </div>
            {props.mode === 'user' && (
                <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Rolden geliyor</span>
                    <span className="inline-flex items-center gap-1"><Plus className="h-3 w-3 text-emerald-400" /> Kişisel olarak verildi</span>
                    <span className="inline-flex items-center gap-1"><X className="h-3 w-3 text-rose-400" /> Kişisel olarak engellendi</span>
                    <span>Tıklayarak değiştirin: rol varsayılanı → ver → engelle</span>
                </div>
            )}
            {grouped.map((m) => (
                <div key={m.key} className="rounded-xl border border-white/10">
                    <button type="button" onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(m.key)) n.delete(m.key); else n.add(m.key); return n; })} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">
                        {m.label} <ChevronDown className={`h-4 w-4 transition-transform ${open.has(m.key) ? '' : '-rotate-90'}`} />
                    </button>
                    {open.has(m.key) && (
                        <div className="divide-y divide-white/5 border-t border-white/10">
                            {m.rows.map((row) => (
                                <div key={row.resource} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
                                    <div className="w-44 shrink-0 text-sm text-white">{resourceLabel(row.resource)}<div className="font-mono text-[10px] text-gray-500">{row.resource}</div></div>
                                    <div className="flex flex-wrap gap-1.5">{row.perms.map(cell)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {grouped.length === 0 && <p className="py-6 text-center text-xs text-gray-500">Eşleşen izin yok.</p>}
        </div>
    );
}
