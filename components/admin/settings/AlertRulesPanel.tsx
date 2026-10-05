'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, Crown, Mail, Save, ShieldCheck, UserCheck } from 'lucide-react';
import { api, Alert, Badge, Button, Skeleton, TextInput, Toggle } from '@/components/admin/ui';

type Reason = 'SUPER_ADMIN' | 'PERMISSION' | 'RULE' | 'ENV' | 'EXTRA';
interface EventRow {
    key: string;
    label: string;
    description: string;
    perm: [string, string];
    rule: { notifyPermissionHolders: boolean; extraEmails: string[] };
    recipients: { email: string; name: string; reason: Reason }[];
}

const REASON: Record<Reason, { label: string; tone: 'primary' | 'info' | 'neutral' | 'warning' }> = {
    SUPER_ADMIN: { label: 'Süper Yönetici', tone: 'primary' },
    PERMISSION: { label: 'Yetkili admin', tone: 'info' },
    RULE: { label: 'Ek adres', tone: 'neutral' },
    ENV: { label: 'Sunucu ayarı', tone: 'warning' },
    EXTRA: { label: 'Form / kampanya', tone: 'neutral' },
};

/**
 * Who receives e-mail and in-app alerts for incoming work. Super admins are always included;
 * admins with the module permission are included unless switched off; extra addresses can be added.
 */
export function AlertRulesPanel() {
    const [events, setEvents] = useState<EventRow[] | null>(null);
    const [emailsText, setEmailsText] = useState<Record<string, string>>({});
    const [smtp, setSmtp] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const d = await api<{ events: EventRow[]; smtpConfigured: boolean }>('/api/admin/alerts');
            setEvents(d.events);
            setSmtp(d.smtpConfigured);
            setEmailsText(Object.fromEntries(d.events.map((e) => [e.key, e.rule.extraEmails.join(', ')])));
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Bildirim kuralları yüklenemedi' });
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    if (!events) return <Skeleton rows={6} />;

    const save = async () => {
        setSaving(true);
        try {
            const rules = Object.fromEntries(events.map((e) => [e.key, { notifyPermissionHolders: e.rule.notifyPermissionHolders, extraEmails: emailsText[e.key] || '' }]));
            await api('/api/admin/alerts', { method: 'PUT', json: { rules } });
            setNotice({ tone: 'success', text: 'Bildirim kuralları kaydedildi.' });
            await load();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
            <Alert tone={smtp ? 'success' : 'warning'} title={smtp ? 'E-posta gönderimi aktif' : 'E-posta sağlayıcısı tanımlı değil'}>
                {smtp
                    ? 'Bildirim e-postaları oluşturulduğu anda gönderilir; başarısız olanlar outbox üzerinden yeniden denenir.'
                    : 'Bildirimler oluşturulur ve E-Posta Merkezi › Outbox\'ta "Beklemede" olarak saklanır. SMTP bilgileri sunucuya girildiğinde otomatik gönderilir. Uygulama içi bildirimler her durumda çalışır.'}
            </Alert>
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-gray-200">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Başvuru, iletişim, form, rezervasyon ve fiyat teklifi gibi gelen işlerin bildirimi <strong>her zaman tüm Süper Yöneticilere</strong> gider; bu kural kapatılamaz. İlgili modülü görme yetkisi olan adminler de varsayılan olarak bilgilendirilir.</p>
            </div>

            {events.map((ev, i) => (
                <div key={ev.key} className="glass-card space-y-3 rounded-xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-white"><BellRing className="h-4 w-4 text-primary" /> {ev.label}</div>
                            <p className="text-xs text-gray-400">{ev.description} · yetki: <code className="text-gray-300">{ev.perm[1]}:{ev.perm[0]}</code></p>
                        </div>
                        <Toggle
                            id={`alert-${ev.key}`}
                            checked={ev.rule.notifyPermissionHolders}
                            onChange={(v) => setEvents(events.map((x, k) => (k === i ? { ...x, rule: { ...x.rule, notifyPermissionHolders: v } } : x)))}
                            label="Yetkili adminlere de gönder"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-gray-500" />
                        <TextInput aria-label={`${ev.label} ek e-posta adresleri`} value={emailsText[ev.key] || ''} placeholder="Ek adresler (virgülle ayırın), ör. muhasebe@ikuantstekmer.com" onChange={(e) => setEmailsText({ ...emailsText, [ev.key]: e.target.value })} />
                    </div>
                    <div>
                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500"><UserCheck className="h-3.5 w-3.5" /> Şu an bildirim alacak kişiler ({ev.recipients.length})</div>
                        <div className="flex flex-wrap gap-1.5">
                            {ev.recipients.map((r) => (
                                <span key={r.email} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-gray-300">
                                    {r.name !== 'İKÜANTS TEKMER' ? r.name : r.email} <Badge tone={REASON[r.reason].tone}>{REASON[r.reason].label}</Badge>
                                </span>
                            ))}
                            {ev.recipients.length === 0 && <span className="text-xs text-rose-300">Alıcı yok — en az bir aktif Süper Yönetici olmalı.</span>}
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[11px] text-gray-500"><ShieldCheck className="h-3.5 w-3.5" /> Değişiklikler denetim kaydına yazılır. E-postalara T.C. kimlik no gibi hassas veriler eklenmez.</p>
                <Button type="button" variant="primary" icon={Save} loading={saving} onClick={save}>Kuralları kaydet</Button>
            </div>
        </div>
    );
}
