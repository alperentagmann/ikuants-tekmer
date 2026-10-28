"use client";
import { useState } from 'react';
import { FileText, FileUp } from 'lucide-react';
import { Alert, Badge } from '@/components/admin/ui';
import { LInput, LSelect, fmtDate } from '@/components/admin/ops-kit';

type Doc = { id: string; title: string; documentType: string; fileUrl: string; version: number; documentDate?: string; uploadedAt: string };
const TYPES = [
    { value: 'SIGNED_CONTRACT', label: 'Islak imzalı sözleşme' },
    { value: 'ADDITIONAL_PROTOCOL', label: 'Ek protokol' },
    { value: 'AMENDMENT', label: 'Tadil / zeyilname' },
    { value: 'DELIVERY_REPORT', label: 'Teslim tutanağı' },
    { value: 'DEPOSIT_RECEIPT', label: 'Depozito makbuzu' },
    { value: 'TERMINATION_NOTICE', label: 'Fesih bildirimi' },
    { value: 'OTHER', label: 'Diğer' },
];
const label = (t: string) => TYPES.find((x) => x.value === t)?.label ?? t;

/** Sözleşme belgeleri: taranmış ıslak imzalı sözleşme ve ekleri. Yeni yükleme yeni sürüm olur; eski belge silinmez. */
export function ContractDocuments({ contractId, documents, canUpload, onUploaded }: { contractId: string; documents: Doc[]; canUpload: boolean; onUploaded: () => void }) {
    const [type, setType] = useState('SIGNED_CONTRACT');
    const [date, setDate] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
    const upload = async (file: File | undefined) => {
        if (!file) return;
        setBusy(true); setMsg(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('documentType', type);
            if (date) fd.append('documentDate', date);
            const res = await fetch(`/api/admin/rent/contracts/${contractId}/signed-document`, { method: 'POST', body: fd });
            const j = await res.json();
            if (!res.ok || !j.success) throw new Error(j.message || 'Belge yüklenemedi');
            setMsg({ tone: 'success', text: `${label(type)} yüklendi (sürüm ${j.document.version}).` });
            onUploaded();
        } catch (e) { setMsg({ tone: 'danger', text: (e as Error).message }); } finally { setBusy(false); }
    };
    return (
        <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Belgeler (ıslak imzalı tarama ve ekler)</legend>
            {documents.length === 0 ? <p className="mb-3 text-sm text-amber-300">Henüz taranmış belge yok.</p> : (
                <ul className="mb-3 divide-y divide-white/5 rounded-lg border border-white/10">
                    {documents.map((d) => (
                        <li key={d.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-400" aria-hidden />
                            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{d.title}</a>
                            <Badge>{label(d.documentType)}</Badge><Badge>v{d.version}</Badge>
                            <span className="ml-auto text-xs text-gray-500">{fmtDate(d.documentDate ?? d.uploadedAt)}</span>
                        </li>
                    ))}
                </ul>
            )}
            {canUpload && (
                <div className="flex flex-wrap items-end gap-3">
                    <LSelect label="Belge türü" className="w-56" options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
                    <LInput label="Belge tarihi" type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">
                        <FileUp className="h-4 w-4" aria-hidden /> {busy ? 'Yükleniyor…' : 'Tarama yükle (PDF / JPG / PNG)'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff" className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                </div>
            )}
            {msg && <div className="mt-2"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
        </fieldset>
    );
}
