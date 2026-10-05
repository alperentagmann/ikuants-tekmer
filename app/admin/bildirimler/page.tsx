'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Skeleton, EmptyState, Toggle, Alert, api, formatDateTime } from '@/components/admin/ui';

interface Item {
    id: string;
    title: string;
    message: string;
    type: string;
    targetUrl: string | null;
    createdAt: string;
    isRead: boolean;
}

const TYPE_LABEL: Record<string, string> = {
    NEW_APPLICATION: 'Başvuru',
    NEW_SUBMISSION: 'Form',
    NEW_CONTACT: 'İletişim',
    NEW_RESERVATION: 'Rezervasyon',
    RESERVATION: 'Rezervasyon',
    TASK_ASSIGNED: 'Görev',
    TASK_DUE: 'Görev',
    APPROVAL_REQUESTED: 'Onay',
    RENT: 'Kira',
    RENT_DUE: 'Kira',
    CONTRACT: 'Sözleşme',
    REPORT: 'Rapor',
    MENTION: 'Bahsedilme',
    SYSTEM_ALERT: 'Sistem',
};

export default function NotificationsPage() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api<{ items: Item[] }>(`/api/admin/notifications?limit=100${unreadOnly ? '&unread=true' : ''}`);
            setItems(data.items);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Bildirimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [unreadOnly]);

    useEffect(() => {
        load();
    }, [load]);

    const open = async (n: Item) => {
        if (!n.isRead) await api('/api/admin/notifications', { method: 'PATCH', json: { ids: [n.id] } });
        if (n.targetUrl) router.push(n.targetUrl);
        else load();
    };

    return (
        <div>
            <PageHeader
                title="Bildirimler"
                icon={Bell}
                description="Yetkinize göre size ve ilgili modüllere gelen bildirimler."
                actions={<Button icon={CheckCheck} onClick={async () => { await api('/api/admin/notifications', { method: 'PATCH', json: { all: true } }); load(); }}>Tümünü okundu yap</Button>}
            />
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}
            <div className="mb-4"><Toggle id="unread" checked={unreadOnly} onChange={setUnreadOnly} label="Yalnız okunmamışlar" /></div>
            {loading ? <Skeleton rows={6} /> : items.length === 0 ? (
                <EmptyState icon={Bell} title="Bildirim yok." />
            ) : (
                <Card padded={false}>
                    <ul className="divide-y divide-white/5">
                        {items.map((n) => (
                            <li key={n.id}>
                                <button type="button" onClick={() => open(n)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] ${n.isRead ? 'opacity-70' : ''}`}>
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-primary'}`} aria-label={n.isRead ? 'Okundu' : 'Okunmamış'} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-white">{n.title}</span>
                                            <Badge>{TYPE_LABEL[n.type] || n.type}</Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-gray-400">{n.message}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-gray-500">{formatDateTime(n.createdAt)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
}
