'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, Building2, Crown, Mail, Save, Send, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { api, Alert, Badge, Button, Skeleton, TextInput, Toggle } from '@/components/admin/ui';

type Reason = 'INSTITUTION' | 'SUPER_ADMIN' | 'ADMIN' | 'PERMISSION' | 'RULE' | 'ENV' | 'EXTRA';
interface GlobalRule { institutionEmails: string[]; notifyAdmins: boolean; mutedUserIds: string[] }
interface Person { id: string; name: string; email: string; isSuperAdmin: boolean; isAdmin: boolean; roles: string[]; muted: boolean }
interface EventRow {
    key: string;
    label: string;
    description: string;
    perm: [string, string];
    rule: { notifyPermissionHolders: boolean; extraEmails: string[] };
    recipients: { email: string; name: string; reason: Reason }[];
}

const REASON: Record<Reason, { label: string; tone: 'primary' | 'info' | 'neutral' | 'warning' }> = {
    INSTITUTION: { label: 'Kurum e-postası', tone: 'primary' },
    SUPER_ADMIN: { label: 'Süper Yönetici', tone: 'primary' },
    ADMIN: { label: 'Admin (kişisel)', tone: 'info' },
    PERMISSION: { label: 'Modül yetkilisi', tone: 'info' },
    RULE: { label: 'Ek adres', tone: 'neutral' },
    ENV: { label: 'Sunucu ayarı', tone: 'warning' },
    EXTRA: { label: 'Form / kampanya', tone: 'neutral' },
};

/**
 * Who receives alert e-mails. Every alert goes to the institution mailbox(es) and all super admins;
 * admin-role users get them at their personal e-mail (each can be switched off); per event,
 * module permission holders and extra addresses can be added.
 */
export function AlertRulesPanel() {
    const [events, setEvents] = useState<EventRow[] | null>(null);
    const [emailsText, setEmailsText] = useState<Record<string, string>>({});
    const [smtp, setSmtp] = useState(false);
    const [global, setGlobal] = useState<GlobalRule>({ institutionEmails: [], notifyAdmins: true, mutedUserIds: [] });
    const [institutionText, setInstitutionText] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const d = await api<{ events: EventRow[]; smtpConfigured: boolean; global: GlobalRule; people: Person[] }>('/api/admin/alerts');
            setEvents(d.events);
            setSmtp(d.smtpConfigured);
            setGlobal(d.global);
            setInstitutionText(d.global.institutionEmails.join(', '));
            setPeople(d.people);
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
            await api('/api/admin/alerts', { method: 'PUT', json: { rules, global: { ...global, institutionEmails: institutionText } } });
            setNotice({ tone: 'success', text: 'Bildirim alıcıları ve kuralları kaydedildi.' });
            await load();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
        } finally {
            setSaving(false);
        }
    };

    const sendTest = async () => {
        setTesting(true);
        try {
            const r = await api<{ queued: number; recipients: string[]; smtpConfigured: boolean }>('/api/admin/alerts', { method: 'POST' });
            setNotice({
                tone: 'success',
                text: r.smtpConfigured
                    ? `Test e-postası ${r.queued} adrese gönderildi: ${r.recipients.join(', ')}`
                    : `Test e-postası ${r.queued} adres için outbox'a eklendi (${r.recipients.join(', ')}). SMTP tanımlanınca gönderilir.`,
            });
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Test e-postası oluşturulamadı' });
        } finally {
            setTesting(false);
        }
    };

    const toggleMute = (id: string, receive: boolean) =>
        setGlobal((g) => ({ ...g, mutedUserIds: receive ? g.mutedUserIds.filter((x) => x !== id) : [...g.mutedUserIds, id] }));
    const personStatus = (p: Person) => {
        if (p.isSuperAdmin) return { text: 'Her uyarıyı alır', tone: 'primary' as const };
        if (global.mutedUserIds.includes(p.id)) return { text: 'E-posta kapalı', tone: 'neutral' as const };
        if (p.isAdmin && global.notifyAdmins) return { text: 'Her uyarıyı alır', tone: 'info' as const };
        return { text: 'Yalnız yetkili olduğu modüller', tone: 'neutral' as const };
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
                <p>Tüm uyarılar <strong>her zaman Süper Yöneticilere</strong> ve tanımlı <strong>kurum e-postasına</strong> gider; bu kural kapatılamaz. Admin rolündeki kişiler kişisel e-postalarından bilgilendirilir. İlgili modülü görme yetkisi olanlar olay bazında eklenebilir.</p>
            </div>

            <section className="glass-card space-y-4 rounded-xl border border-white/10 p-4" aria-labelledby="alert-recipients-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 id="alert-recipients-title" className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-primary" /> Uyarı e-postası alıcıları</h3>
                        <p className="text-xs text-gray-400">Başvuru, iletişim, kira gecikmesi, sözleşme ve poliçe yenileme uyarılarının hepsi aşağıdaki adreslere gider.</p>
                    </div>
                    <Button type="button" variant="secondary" icon={Send} loading={testing} onClick={sendTest}>Test e-postası gönder</Button>
                </div>
                <label className="block space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-300"><Building2 className="h-3.5 w-3.5" /> Kurum e-postası (her uyarıyı alır)</span>
                    <TextInput value={institutionText} placeholder="ör. bilgi@ikuantstekmer.com — birden fazlaysa virgülle ayırın" onChange={(e) => setInstitutionText(e.target.value)} />
                </label>
                <Toggle id="alert-notify-admins" checked={global.notifyAdmins} onChange={(v) => setGlobal({ ...global, notifyAdmins: v })} label="Admin rolündeki kullanıcılar her uyarıyı kişisel e-postalarına alsın" />
                <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full min-w-[560px] text-left text-xs">
                        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-gray-500">
                            <tr><th className="px-3 py-2">Kişi</th><th className="px-3 py-2">E-posta</th><th className="px-3 py-2">Rol</th><th className="px-3 py-2">Durum</th><th className="px-3 py-2 text-right">E-posta alsın</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {people.map((p) => {
                                const st = personStatus(p);
                                return (
                                    <tr key={p.id}>
                                        <td className="px-3 py-2 text-gray-100">{p.name}</td>
                                        <td className="px-3 py-2 text-gray-300">{p.email}</td>
                                        <td className="px-3 py-2 text-gray-400">{p.isSuperAdmin ? 'Süper Yönetici' : p.roles.join(', ') || '—'}</td>
                                        <td className="px-3 py-2"><Badge tone={st.tone}>{st.text}</Badge></td>
                                        <td className="px-3 py-2 text-right">
                                            {p.isSuperAdmin
                                                ? <span className="text-[11px] text-gray-500">Kapatılamaz</span>
                                                : <Toggle id={`alert-person-${p.id}`} checked={!global.mutedUserIds.includes(p.id)} onChange={(v) => toggleMute(p.id, v)} label={global.mutedUserIds.includes(p.id) ? 'Kapalı' : 'Açık'} />}
                                        </td>
                                    </tr>
                                );
                            })}
                            {people.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">Rolü olan aktif kullanıcı yok.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <p className="text-[11px] text-gray-500">Kişisel e-posta adresleri kullanıcı hesabından gelir; değiştirmek için <Link href="/admin/kullanicilar" className="text-primary hover:underline">Kullanıcılar</Link> ekranını kullanın. Değişiklikler “Kuralları kaydet” ile uygulanır.</p>
            </section>

            <h3 className="pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Olay bazında ek alıcılar</h3>
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
                            label="Modül yetkililerine de gönder"
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
