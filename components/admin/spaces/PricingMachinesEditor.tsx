'use client';

import React from 'react';
import { Cpu, Plus, Trash2, X } from 'lucide-react';
import { Button, Field, Select, TextInput } from '@/components/admin/ui';
import { isMachineType, type FacilityPricing, type MachineInfo } from '@/lib/machines';

/**
 * Tariff and machine list of a space. Meeting rooms stay free by default; machines are priced
 * by quote until an hourly tariff is entered. Technical values should come from a real source.
 */
export function PricingMachinesEditor({
    spaceType,
    pricing,
    machines,
    onChange,
}: {
    spaceType: string;
    pricing: FacilityPricing;
    machines: MachineInfo[];
    onChange: (patch: { pricing?: FacilityPricing; machines?: MachineInfo[] }) => void;
}) {
    const machine = isMachineType(spaceType);
    const setPricing = (patch: Partial<FacilityPricing>) => onChange({ pricing: { ...pricing, ...patch } });
    const setMachine = (i: number, patch: Partial<MachineInfo>) => onChange({ machines: machines.map((m, k) => (k === i ? { ...m, ...patch } : m)) });

    return (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Kullanım tarifesi</div>
            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Ücretlendirme" htmlFor="p-model">
                    <Select id="p-model" value={pricing.model} onChange={(e) => setPricing({ model: e.target.value as FacilityPricing['model'] })} options={[{ value: 'FREE', label: 'Ücretsiz' }, { value: 'QUOTE', label: 'Fiyat teklifi ile' }, { value: 'HOURLY', label: 'Saatlik ücret' }]} />
                </Field>
                {pricing.model === 'HOURLY' && (
                    <Field label="Saatlik ücret (₺, KDV hariç)" htmlFor="p-rate">
                        <TextInput id="p-rate" type="number" min={0} step="0.01" value={pricing.hourlyRate ?? ''} onChange={(e) => setPricing({ hourlyRate: e.target.value === '' ? null : Number(e.target.value) })} />
                    </Field>
                )}
                <Field label="Tarife notu (public)" htmlFor="p-note" className={pricing.model === 'HOURLY' ? '' : 'sm:col-span-2'}>
                    <TextInput id="p-note" value={pricing.note || ''} placeholder="Örn: Malzeme ücreti ayrıca hesaplanır." onChange={(e) => setPricing({ note: e.target.value || null })} />
                </Field>
            </div>

            {(machine || machines.length > 0) && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Makineler</div>
                        <Button size="sm" icon={Plus} onClick={() => onChange({ machines: [...machines, { name: '', role: null, specs: [], sourceUrl: null }] })}>Makine ekle</Button>
                    </div>
                    {machines.length === 0 && <p className="text-xs text-gray-500">Henüz makine eklenmedi.</p>}
                    {machines.map((m, i) => (
                        <div key={i} className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4 shrink-0 text-primary" />
                                <TextInput aria-label="Makine adı" value={m.name} placeholder="Makine adı / modeli" onChange={(e) => setMachine(i, { name: e.target.value })} />
                                <TextInput aria-label="Görev" value={m.role || ''} placeholder="Görev (ör. Lazer kesim)" onChange={(e) => setMachine(i, { role: e.target.value || null })} />
                                <Button size="sm" variant="ghost" icon={Trash2} aria-label="Makineyi kaldır" onClick={() => onChange({ machines: machines.filter((_, k) => k !== i) })} />
                            </div>
                            {m.specs.map((s, j) => (
                                <div key={j} className="flex items-center gap-2 pl-6">
                                    <TextInput aria-label="Özellik" value={s.label} placeholder="Özellik (ör. Çalışma alanı)" onChange={(e) => setMachine(i, { specs: m.specs.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)) })} />
                                    <TextInput aria-label="Değer" value={s.value} placeholder="Değer (ör. 600×400 mm)" onChange={(e) => setMachine(i, { specs: m.specs.map((x, k) => (k === j ? { ...x, value: e.target.value } : x)) })} />
                                    <button type="button" className="rounded p-1 text-gray-500 hover:text-rose-300" aria-label="Özelliği kaldır" onClick={() => setMachine(i, { specs: m.specs.filter((_, k) => k !== j) })}><X className="h-4 w-4" /></button>
                                </div>
                            ))}
                            <div className="flex flex-wrap items-center gap-2 pl-6">
                                <Button size="sm" variant="ghost" icon={Plus} onClick={() => setMachine(i, { specs: [...m.specs, { label: '', value: '' }] })}>Teknik özellik</Button>
                                <TextInput aria-label="Kaynak bağlantısı" value={m.sourceUrl || ''} placeholder="Kaynak (üretici sayfası, https://...)" onChange={(e) => setMachine(i, { sourceUrl: e.target.value || null })} />
                            </div>
                        </div>
                    ))}
                    <p className="text-[11px] text-gray-500">Yalnız doğrulanmış teknik bilgileri girin; bilinmeyen değerleri boş bırakın.</p>
                </div>
            )}
        </div>
    );
}
