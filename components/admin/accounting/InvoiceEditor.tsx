'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Alert, Button, Field, Modal, Select, TextArea, TextInput, api } from '@/components/admin/ui';
import { VAT_RATES, WITHHOLDING_RATES, computeInvoice } from '@/lib/accounting-math';

export interface EditorLine { description: string; quantity: string; unit: string; unitPrice: string; discountRate: string; vatRate: string }
export interface InvoiceDraft {
    id?: string;
    partyId: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    withholdingRate: string;
    notes: string;
    sourceType: string;
    lines: EditorLine[];
}

export const emptyLine = (): EditorLine => ({ description: '', quantity: '1', unit: 'Adet', unitPrice: '', discountRate: '0', vatRate: '20' });
const money = (n: number, c: string) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
const WH_LABEL: Record<number, string> = { 0: 'Tevkifat yok', 0.2: '2/10', 0.3: '3/10', 0.4: '4/10', 0.5: '5/10', 0.7: '7/10', 0.9: '9/10', 1: '10/10' };

/** Sales invoice editor with live VAT / withholding totals; saves as draft. */
export function InvoiceEditor({ draft, parties, onClose, onSaved }: { draft: InvoiceDraft; parties: { id: string; name: string }[]; onClose: () => void; onSaved: (id: string) => void }) {
    const [d, setD] = useState<InvoiceDraft>(draft);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totals = useMemo(() => {
        const lines = d.lines
            .filter((l) => l.description.trim() && Number(l.quantity) > 0 && l.unitPrice !== '')
            .map((l) => ({ description: l.description, quantity: Number(l.quantity), unit: l.unit, unitPrice: Number(l.unitPrice) || 0, discountRate: Number(l.discountRate) || 0, vatRate: Number(l.vatRate) }));
        return computeInvoice(lines, Number(d.withholdingRate) || 0);
    }, [d]);

    const setLine = (i: number, patch: Partial<EditorLine>) => setD({ ...d, lines: d.lines.map((l, k) => (k === i ? { ...l, ...patch } : l)) });

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await api<{ id: string }>('/api/admin/accounting', {
                method: 'POST',
                json: {
                    action: 'save_invoice', ...d,
                    dueDate: d.dueDate || null,
                    lines: d.lines.filter((l) => l.description.trim()).map((l) => ({ description: l.description, quantity: Number(l.quantity), unit: l.unit, unitPrice: Number(l.unitPrice), discountRate: Number(l.discountRate) || 0, vatRate: Number(l.vatRate) })),
                },
            });
            onSaved(res.id);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open onClose={onClose} title={d.id ? 'Fatura taslağını düzenle' : 'Yeni satış faturası'} size="xl"
            footer={<><Button onClick={onClose}>Vazgeç</Button><Button variant="primary" icon={Save} loading={saving} disabled={!d.partyId || totals.lines.length === 0} onClick={save}>Taslak olarak kaydet</Button></>}>
            <div className="space-y-4">
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Cari" htmlFor="inv-party" required className="md:col-span-2"><Select id="inv-party" value={d.partyId} placeholder="Cari seçin" onChange={(e) => setD({ ...d, partyId: e.target.value })} options={parties.map((p) => ({ value: p.id, label: p.name }))} /></Field>
                    <Field label="Fatura tarihi" htmlFor="inv-date" required><TextInput id="inv-date" type="date" value={d.issueDate} onChange={(e) => setD({ ...d, issueDate: e.target.value })} /></Field>
                    <Field label="Vade" htmlFor="inv-due"><TextInput id="inv-due" type="date" value={d.dueDate} onChange={(e) => setD({ ...d, dueDate: e.target.value })} /></Field>
                    <Field label="Para birimi" htmlFor="inv-cur"><Select id="inv-cur" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} options={['TRY', 'USD', 'EUR', 'GBP'].map((c) => ({ value: c, label: c }))} /></Field>
                    <Field label="KDV tevkifatı" htmlFor="inv-wh"><Select id="inv-wh" value={d.withholdingRate} onChange={(e) => setD({ ...d, withholdingRate: e.target.value })} options={WITHHOLDING_RATES.map((r) => ({ value: String(r), label: WH_LABEL[r] || String(r) }))} /></Field>
                    <Field label="Kaynak" htmlFor="inv-src"><Select id="inv-src" value={d.sourceType} placeholder="Belirtilmedi" onChange={(e) => setD({ ...d, sourceType: e.target.value })} options={[{ value: 'RENT', label: 'Kira' }, { value: 'MACHINE', label: 'Makine kullanımı' }, { value: 'RESERVATION', label: 'Alan kullanımı' }, { value: 'SERVICE', label: 'Hizmet' }, { value: 'OTHER', label: 'Diğer' }]} /></Field>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[820px] text-sm">
                        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-gray-500">
                            <tr><th className="px-2 py-2 text-left">Açıklama</th><th className="w-20 px-2 py-2">Miktar</th><th className="w-24 px-2 py-2">Birim</th><th className="w-32 px-2 py-2">Birim fiyat</th><th className="w-20 px-2 py-2">İsk. %</th><th className="w-24 px-2 py-2">KDV %</th><th className="w-32 px-2 py-2 text-right">Tutar</th><th className="w-10" /></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {d.lines.map((l, i) => {
                                const net = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discountRate) || 0) / 100);
                                return (
                                    <tr key={i}>
                                        <td className="px-2 py-1.5"><TextInput aria-label="Açıklama" value={l.description} placeholder="Örn: Ofis kirası — Ekim 2026" onChange={(e) => setLine(i, { description: e.target.value })} /></td>
                                        <td className="px-2 py-1.5"><TextInput aria-label="Miktar" type="number" min={0} step="0.01" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} /></td>
                                        <td className="px-2 py-1.5"><TextInput aria-label="Birim" value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} /></td>
                                        <td className="px-2 py-1.5"><TextInput aria-label="Birim fiyat" type="number" min={0} step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} /></td>
                                        <td className="px-2 py-1.5"><TextInput aria-label="İskonto" type="number" min={0} max={100} value={l.discountRate} onChange={(e) => setLine(i, { discountRate: e.target.value })} /></td>
                                        <td className="px-2 py-1.5"><Select aria-label="KDV" value={l.vatRate} onChange={(e) => setLine(i, { vatRate: e.target.value })} options={VAT_RATES.map((r) => ({ value: String(r), label: `%${r}` }))} /></td>
                                        <td className="px-2 py-1.5 text-right font-mono text-xs text-gray-200">{money(Math.round(net * 100) / 100, d.currency)}</td>
                                        <td className="px-1"><button type="button" aria-label="Kalemi sil" className="rounded p-1 text-gray-500 hover:text-rose-300" onClick={() => setD({ ...d, lines: d.lines.length > 1 ? d.lines.filter((_, k) => k !== i) : [emptyLine()] })}><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Button size="sm" icon={Plus} onClick={() => setD({ ...d, lines: [...d.lines, emptyLine()] })}>Kalem ekle</Button>

                <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                    <Field label="Not / açıklama (faturada görünür)" htmlFor="inv-notes"><TextArea id="inv-notes" rows={4} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} /></Field>
                    <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                        <div className="flex justify-between text-gray-400"><span>Ara toplam</span><span className="font-mono">{money(totals.subtotal, d.currency)}</span></div>
                        {totals.discountTotal > 0 && <div className="flex justify-between text-gray-400"><span>İskonto</span><span className="font-mono">−{money(totals.discountTotal, d.currency)}</span></div>}
                        <div className="flex justify-between text-gray-400"><span>KDV</span><span className="font-mono">{money(totals.vatTotal, d.currency)}</span></div>
                        {totals.withholdingTotal > 0 && <div className="flex justify-between text-amber-300"><span>KDV tevkifatı ({WH_LABEL[Number(d.withholdingRate)]})</span><span className="font-mono">−{money(totals.withholdingTotal, d.currency)}</span></div>}
                        <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white"><span>Ödenecek</span><span className="font-mono">{money(totals.grandTotal, d.currency)}</span></div>
                    </div>
                </div>
                <p className="text-[11px] text-gray-500">Taslak kaydedildikten sonra &quot;Faturayı kes&quot; ile resmî fatura numarası verilir ve fatura kilitlenir. e-Fatura gönderimi, Entegrasyon Merkezi&apos;nde e-Fatura entegratörü bağlandığında yapılır.</p>
            </div>
        </Modal>
    );
}
