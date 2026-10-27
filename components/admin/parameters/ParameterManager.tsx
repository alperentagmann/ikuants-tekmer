"use client";
import { useState } from 'react';
import { Plus, Power, PowerOff, Save } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/admin/ui';
import { api, useApi, useForm, LInput, LTextArea, LoadingRows, ErrorState, TableShell, th, td } from '@/components/admin/ops-kit';

type Param = { id: string; category: string; key: string; label: string; value: string | null; description: string | null; sortOrder: number; isActive: boolean; updatedAt: string };
type Category = { label: string; kind: 'options' | 'number' | 'text'; description: string; keys?: { key: string; label: string; unit?: string }[] };

/**
 * Bir parametre kategorisini yönetir: seçenek listesi (ekle / pasife al), sayısal eşik veya uzun metin (belge şablonu).
 * Kayıt silinmez. Sistem ve parametre ekranı aynı bileşeni kullanır.
 */
export function ParameterManager({ category, canManage, onChanged, notify }: { category: string; canManage: boolean; onChanged?: () => void; notify: { success: (m: string) => void; error: (m: string) => void } }) {
    const list = useApi<{ parameters: Param[]; categories: Record<string, Category> }>(`/api/admin/parameters?category=${category}&inactive=1`);
    const cat = list.data?.categories[category];
    const f = useForm({ key: '', label: '' });
    const [busy, setBusy] = useState<string | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const changed = () => { list.reload(); onChanged?.(); };

    const add = () => f.submit(async () => {
        await api('/api/admin/parameters', { method: 'POST', json: { category, key: f.values.key, label: f.values.label, sortOrder: (list.data?.parameters.length ?? 0) * 10 } });
        notify.success('Seçenek eklendi.');
        f.setValues({ key: '', label: '' });
        changed();
    }, (e) => { if (!e.data?.fieldErrors) notify.error(e.message); });

    const toggle = async (p: Param) => {
        setBusy(p.id);
        try {
            await api(`/api/admin/parameters/${p.id}`, { method: 'PATCH', json: { isActive: !p.isActive } });
            notify.success(p.isActive ? 'Pasife alındı.' : 'Etkinleştirildi.');
            changed();
        } catch (e) { notify.error((e as Error).message); } finally { setBusy(null); }
    };

    const saveValue = async (key: string, label: string, existing?: Param) => {
        const value = values[key] ?? existing?.value ?? '';
        setBusy(key);
        try {
            if (existing) await api(`/api/admin/parameters/${existing.id}`, { method: 'PATCH', json: { value, expectedUpdatedAt: existing.updatedAt } });
            else await api('/api/admin/parameters', { method: 'POST', json: { category, key, label, value } });
            notify.success('Kaydedildi.');
            changed();
        } catch (e) { notify.error((e as Error).message); } finally { setBusy(null); }
    };

    if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />;
    if (!list.data || !cat) return <LoadingRows rows={3} />;
    const rows = list.data.parameters;

    if (cat.kind === 'number' || cat.kind === 'text') {
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-400">{cat.description}</p>
                {(cat.keys ?? []).map((k) => {
                    const existing = rows.find((r) => r.key === k.key);
                    const common = { disabled: !canManage, value: values[k.key] ?? existing?.value ?? '', hint: existing ? undefined : cat.kind === 'number' ? 'Henüz girilmedi — geçici varsayılan kullanılıyor' : 'Henüz girilmedi' };
                    return (
                        <div key={k.key} className="flex flex-wrap items-end gap-2">
                            {cat.kind === 'number'
                                ? <LInput label={`${k.label}${k.unit ? ` (${k.unit})` : ''}`} type="number" min="0" className="w-60" {...common} onChange={(e) => setValues((v) => ({ ...v, [k.key]: e.target.value }))} />
                                : <LTextArea label={k.label} rows={12} className="w-full" {...common} onChange={(e) => setValues((v) => ({ ...v, [k.key]: e.target.value }))} />}
                            {canManage && <Button icon={Save} onClick={() => saveValue(k.key, k.label, existing)} loading={busy === k.key}>Kaydet</Button>}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">{cat.description}</p>
            {rows.length === 0 ? <EmptyState title="Henüz seçenek yok" description={canManage ? 'Aşağıdan ilk seçeneği ekleyin.' : 'Yetkili bir kullanıcının seçenek eklemesi gerekiyor.'} /> : (
                <TableShell>
                    <thead><tr className="border-b border-white/5"><th className={th}>Ad</th><th className={th}>Anahtar</th><th className={th}>Durum</th>{canManage && <th className={th}><span className="sr-only">İşlem</span></th>}</tr></thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.map((p) => (
                            <tr key={p.id} className={p.isActive ? '' : 'opacity-60'}>
                                <td className={td}>{p.label}</td>
                                <td className={`${td} font-mono text-xs text-gray-400`}>{p.key}</td>
                                <td className={td}><Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Aktif' : 'Pasif'}</Badge></td>
                                {canManage && <td className={`${td} text-right`}>
                                    <Button size="sm" variant="ghost" icon={p.isActive ? PowerOff : Power} onClick={() => toggle(p)} loading={busy === p.id} aria-label={`${p.label} ${p.isActive ? 'pasife al' : 'etkinleştir'}`}>{p.isActive ? 'Pasife al' : 'Etkinleştir'}</Button>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            )}
            {canManage && (
                <form onSubmit={(e) => { e.preventDefault(); add(); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <LInput label="Seçenek adı" required {...f.bind('label')} />
                    <LInput label="Anahtar" required placeholder="ör. TUR_A" hint="Harf, rakam, - ve _" {...f.bind('key')} />
                    <Button type="submit" icon={Plus} loading={f.saving}>Ekle</Button>
                </form>
            )}
        </div>
    );
}
