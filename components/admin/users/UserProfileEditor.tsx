'use client';

import React, { useEffect, useState } from 'react';
import { Camera, Save, Trash2, UserRound } from 'lucide-react';
import { api, Alert, Button, Field, Select, TextInput } from '@/components/admin/ui';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { EMPLOYMENT_TYPES } from '@/lib/hr';

export interface StaffProfile {
    id: string;
    name: string;
    title: string | null;
    department: string | null;
    phone: string | null;
    avatarUrl: string | null;
    employmentType?: string | null;
    sgkStatus?: string | null;
    hireDate?: string | null;
}

/** Shared photo + staff fields form (internal users). */
export function UserProfileEditor({ user, departments, onSaved }: { user: StaffProfile; departments: string[]; onSaved: (u: StaffProfile) => void }) {
    const [form, setForm] = useState(() => ({ ...user, hireDate: user.hireDate ? user.hireDate.slice(0, 10) : '' }));
    const [sgkOptions, setSgkOptions] = useState<string[]>([]);
    const [picker, setPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    useEffect(() => {
        let alive = true;
        api<{ sgkStatuses: string[] }>('/api/admin/hr').then((d) => alive && setSgkOptions(d.sgkStatuses)).catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await api(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                json: { name: form.name, title: form.title || '', department: form.department || '', phone: form.phone || '', avatarUrl: form.avatarUrl || '', employmentType: form.employmentType || null, sgkStatus: form.sgkStatus || null, hireDate: form.hireDate || null },
            });
            setNotice({ tone: 'success', text: 'Profil kaydedildi.' });
            onSaved({ ...form, hireDate: form.hireDate || null });
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
        } finally {
            setSaving(false);
        }
    };

    const sgkList = form.sgkStatus && !sgkOptions.includes(form.sgkStatus) ? [form.sgkStatus, ...sgkOptions] : sgkOptions;

    return (
        <div className="space-y-4">
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
            <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-primary/30 to-cyan-500/20">
                    {form.avatarUrl ? <img src={form.avatarUrl} alt={form.name} className="h-full w-full object-cover" /> : <UserRound className="m-auto mt-5 h-10 w-10 text-white/70" />}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" icon={Camera} onClick={() => setPicker(true)}>{form.avatarUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}</Button>
                    {form.avatarUrl && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setForm({ ...form, avatarUrl: null })}>Kaldır</Button>}
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ad soyad" htmlFor="up-name" required><TextInput id="up-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Unvan" htmlFor="up-title"><TextInput id="up-title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Departman" htmlFor="up-dept"><Select id="up-dept" value={form.department || ''} placeholder="Seçin" onChange={(e) => setForm({ ...form, department: e.target.value })} options={Array.from(new Set([...(form.department ? [form.department] : []), ...departments])).map((d) => ({ value: d, label: d }))} /></Field>
                <Field label="Telefon" htmlFor="up-phone"><TextInput id="up-phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Çalışma türü" htmlFor="up-emp"><Select id="up-emp" value={form.employmentType || ''} placeholder="Belirtilmedi" onChange={(e) => setForm({ ...form, employmentType: e.target.value || null })} options={EMPLOYMENT_TYPES} /></Field>
                <Field label="İşe başlama tarihi" htmlFor="up-hire"><TextInput id="up-hire" type="date" value={form.hireDate || ''} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></Field>
                <Field label="SGK durumu" htmlFor="up-sgk" className="sm:col-span-2" hint="Kod yerine tanım olarak seçin; liste Ayarlar › İK Tanımları'ndan düzenlenir.">
                    <Select id="up-sgk" value={form.sgkStatus || ''} placeholder="Belirtilmedi" onChange={(e) => setForm({ ...form, sgkStatus: e.target.value || null })} options={sgkList.map((s) => ({ value: s, label: s }))} />
                </Field>
            </div>
            <div className="flex justify-end">
                <Button variant="primary" icon={Save} loading={saving} disabled={!form.name.trim()} onClick={save}>Profili kaydet</Button>
            </div>
            <MediaPickerModal isOpen={picker} onClose={() => setPicker(false)} onSelect={(url) => { setForm({ ...form, avatarUrl: url }); setPicker(false); }} />
        </div>
    );
}
