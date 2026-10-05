'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, CheckSquare, FileStack, Phone } from 'lucide-react';
import { api, Alert, Badge, Drawer, KeyValue, Skeleton, formatDate } from '@/components/admin/ui';
import type { Record360 } from '@/lib/services/record-360-service';

/** Person / organization 360° drawer with related records and quick actions. */
export function Record360Drawer({ target, onClose }: { target: { type: 'Person' | 'Organization'; id: string } | null; onClose: () => void }) {
    const [record, setRecord] = useState<Record360 | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!target) return;
        let cancelled = false;
        const t = setTimeout(async () => {
            setRecord(null);
            setError(null);
            try {
                const d = await api<{ record: Record360 }>(`/api/admin/crm/360?type=${target.type}&id=${target.id}`);
                if (!cancelled) setRecord(d.record);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : '360° görünüm alınamadı');
            }
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [target]);

    const relationParam = target ? `${target.type === 'Person' ? 'personId' : 'organizationId'}=${target.id}` : '';
    const emailHref = record ? `/admin/eposta-merkezi?tab=compose&entityType=${record.type}&entityId=${record.id}&name=${encodeURIComponent(record.title)}${record.email ? `&to=${encodeURIComponent(record.email)}` : ''}` : '#';

    return (
        <Drawer open={Boolean(target)} onClose={onClose} title={record?.title || '360° Görünüm'} subtitle={record?.subtitle || (target?.type === 'Person' ? 'Kişi' : 'Kurum')}>
            {error && <Alert tone="danger">{error}</Alert>}
            {!record && !error && <Skeleton rows={6} />}
            {record && (
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        <Link href={emailHref} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-200 hover:text-white"><Mail className="h-3.5 w-3.5" /> E-posta</Link>
                        <Link href={`/admin/gorevler?action=create&${relationParam}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-200 hover:text-white"><CheckSquare className="h-3.5 w-3.5" /> Görev oluştur</Link>
                        <Link href={`/admin/dokumanlar?entityType=${record.type}&entityId=${record.id}&action=upload`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-200 hover:text-white"><FileStack className="h-3.5 w-3.5" /> Doküman ekle</Link>
                    </div>
                    <KeyValue items={[
                        { label: 'E-posta', value: record.email || 'Bilgi girilmemiş' },
                        { label: 'Telefon', value: record.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{record.phone}</span> : 'Bilgi girilmemiş' },
                        ...record.facts.map((f) => ({ label: f.label, value: f.value })),
                    ]} />
                    {record.sections.length === 0 && <p className="text-sm text-gray-500">Bu kayda bağlı başka kayıt yok.</p>}
                    {record.sections.map((s) => (
                        <section key={s.key}>
                            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label} <Badge>{s.items.length}</Badge></h4>
                            <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                                {s.items.map((i) => (
                                    <li key={`${s.key}-${i.id}`}>
                                        <Link href={i.href} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-white/[0.03]">
                                            <span className="min-w-0">
                                                <span className="block truncate text-gray-100">{i.title}</span>
                                                {i.subtitle && <span className="block truncate text-[11px] text-gray-500">{i.subtitle}</span>}
                                            </span>
                                            <span className="shrink-0 text-right text-[11px] text-gray-500">
                                                {i.status && <span className="block">{i.status}</span>}
                                                {i.date && <span className="block">{formatDate(i.date)}</span>}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </Drawer>
    );
}
