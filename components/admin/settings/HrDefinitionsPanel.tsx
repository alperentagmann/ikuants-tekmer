'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, UserRound } from 'lucide-react';
import { api, Alert, Button, Skeleton, TextInput } from '@/components/admin/ui';
import { EMPLOYMENT_TYPES } from '@/lib/hr';

/** SGK status definitions used for internal staff and company personnel (written as text, not codes). */
export function HrDefinitionsPanel() {
    const [items, setItems] = useState<string[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    useEffect(() => {
        let alive = true;
        api<{ sgkStatuses: string[] }>('/api/admin/hr').then((d) => alive && setItems(d.sgkStatuses)).catch((e) => alive && setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Yüklenemedi' }));
        return () => {
            alive = false;
        };
    }, []);

    if (!items) return notice ? <Alert tone="danger">{notice.text}</Alert> : <Skeleton rows={5} />;

    const save = async () => {
        setSaving(true);
        try {
            const d = await api<{ sgkStatuses: string[] }>('/api/admin/hr', { method: 'PUT', json: { sgkStatuses: items } });
            setItems(d.sgkStatuses);
            setNotice({ tone: 'success', text: 'İK tanımları kaydedildi.' });
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0e0e18] p-6">
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
            <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><UserRound className="h-4 w-4 text-primary" /> SGK durum tanımları</h3>
                <p className="mt-1 text-xs text-gray-400">Personel kartlarında (iç ekip ve firma personeli) seçilecek SGK durumları. Kod yerine açıklayıcı tanım yazın; örn. &quot;Stajyer — iş kazası ve meslek hastalığı sigortası&quot;.</p>
            </div>
            <ul className="space-y-2">
                {items.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <TextInput aria-label={`SGK tanımı ${i + 1}`} value={s} onChange={(e) => setItems(items.map((x, k) => (k === i ? e.target.value : x)))} />
                        <Button size="sm" variant="ghost" icon={Trash2} aria-label="Kaldır" onClick={() => setItems(items.filter((_, k) => k !== i))} />
                    </li>
                ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button size="sm" icon={Plus} onClick={() => setItems([...items, ''])}>Tanım ekle</Button>
                <Button type="button" variant="primary" icon={Save} loading={saving} onClick={save}>Kaydet</Button>
            </div>
            <div className="border-t border-white/10 pt-4 text-xs text-gray-400">
                Çalışma türleri: {EMPLOYMENT_TYPES.map((t) => t.label).join(' · ')}
            </div>
        </div>
    );
}
