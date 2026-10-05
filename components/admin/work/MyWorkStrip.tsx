'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, CalendarDays, ListTodo, UsersRound } from 'lucide-react';
import { api } from '@/components/admin/ui';

interface Handoff { id: string; status: string; task: { id: string; title: string }; fromUser: { name: string } }

/** "My day" strip: passes waiting for me plus shortcuts to the work tools. */
export function MyWorkStrip() {
    const [pending, setPending] = useState<Handoff[] | null>(null);

    useEffect(() => {
        let alive = true;
        api<{ handoffs: Handoff[] }>('/api/admin/work/handoffs?box=inbox')
            .then((d) => alive && setPending(d.handoffs.filter((h) => h.status === 'PENDING')))
            .catch(() => alive && setPending([]));
        return () => {
            alive = false;
        };
    }, []);

    const links = [
        { href: '/admin/is-takip', label: 'İş Takip Merkezi', icon: ListTodo },
        { href: '/admin/is-planlama', label: 'İş Planlama', icon: CalendarDays },
        { href: '/admin/ekipler', label: 'Ekipler', icon: UsersRound },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className={`rounded-2xl border p-4 ${pending && pending.length ? 'border-fuchsia-500/40 bg-fuchsia-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><ArrowRightLeft className="h-4 w-4 text-fuchsia-300" /> Bana paslanan işler</div>
                {pending === null ? (
                    <p className="mt-1 text-xs text-gray-400">Yükleniyor…</p>
                ) : pending.length === 0 ? (
                    <p className="mt-1 text-xs text-gray-400">Yanıt bekleyen pas yok.</p>
                ) : (
                    <ul className="mt-2 space-y-1">
                        {pending.slice(0, 4).map((h) => (
                            <li key={h.id}><Link href={`/admin/is-takip?tab=inbox&handoffId=${h.id}`} className="text-xs text-gray-200 hover:text-white"><span className="text-fuchsia-300">{h.fromUser.name}</span> → {h.task.title}</Link></li>
                        ))}
                        {pending.length > 4 && <li className="text-[11px] text-gray-400">+{pending.length - 4} pas daha</li>}
                    </ul>
                )}
            </div>
            <div className="flex flex-wrap items-stretch gap-2">
                {links.map((l) => (
                    <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-gray-200 hover:border-primary/40 hover:text-white"><l.icon className="h-4 w-4 text-primary" /> {l.label}</Link>
                ))}
            </div>
        </div>
    );
}
