"use client";
import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, FileSignature, Pencil, Printer, Wand2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/admin/ui';
import { useApi, useMe, LoadingRows, ErrorState, TableShell, th, td, fmtDate, fmtMoney } from '@/components/admin/ops-kit';
import { RentContractForm } from '@/components/admin/rent/RentContractForm';
import { StatePill } from './shared';

type Overview = {
    assignments: { id: string; state: string; unitLabel: string | null; startDate: string | null; endDate: string | null; place: string; unitType: string | null; area: number | null; contract: { id: string; contractNo: string } | null }[];
    contracts: { id: string; contractNo: string; status: string; startDate: string; endDate: string; monthlyRent: number; totalMonthlyRent: number; currency: string; isWaived: boolean; spaceName: string; daysLeft: number; signed: boolean; organization: { name: string; legalName: string | null; taxNumber: string | null } | null; documents: { id: string; title: string; fileUrl: string; version: number }[] }[] | null;
    activeCards: number | null;
};
const STATE_LABEL: Record<string, string> = { ACTIVE: 'Aktif', UPCOMING: 'Başlamadı', ENDED: 'Sona erdi', CANCELLED: 'İptal' };
const CONTRACT_STATUS: Record<string, string> = { ACTIVE: 'Aktif', SUSPENDED: 'Askıda', WAIVED: 'Kira muaf', EXPIRED: 'Süresi doldu', TERMINATED: 'Feshedildi' };

/** Girişim kartı: firmanın ofis / masa tahsisleri, sözleşmeleri, ıslak imzalı belgeleri ve PDKS kartları tek yerde. */
export function FirmSpaceCard({ entrepreneurId }: { entrepreneurId: string }) {
    const { can } = useMe();
    const q = useApi<{ overview: Overview }>(`/api/admin/placement?entrepreneurId=${entrepreneurId}`);
    const [edit, setEdit] = useState<string | null>(null);
    if (q.error) return <Card padded={false}><ErrorState error={q.error} onRetry={q.reload} /></Card>;
    if (!q.data) return <Card padded={false}><LoadingRows rows={4} /></Card>;
    const o = q.data.overview;
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-400">Buradaki her değişiklik alan yönetimi, kira ve panel ekranlarına aynı anda yansır.</p>
                <div className="flex flex-wrap gap-2">
                    {o.activeCards !== null && <Link href={`/admin/pdks?tab=kartlar`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10"><CreditCard className="h-3.5 w-3.5" aria-hidden /> {o.activeCards} aktif PDKS kartı</Link>}
                    {can('create', 'facilities') && <Link href={`/admin/alan-yonetimi/yerlestir?entrepreneurId=${entrepreneurId}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"><Wand2 className="h-3.5 w-3.5" aria-hidden /> Masa / ofis ve sözleşme ekle</Link>}
                </div>
            </div>
            <Card padded={false}>
                <h3 className="border-b border-white/5 px-4 py-3 text-sm font-semibold text-white">Ofis / masa tahsisleri</h3>
                {o.assignments.length === 0 ? <div className="p-4"><EmptyState title="Tahsis yok" description="“Masa / ofis ve sözleşme ekle” ile tek kayıtta yerleştirin." /></div> : (
                    <TableShell>
                        <thead><tr className="border-b border-white/5"><th className={th}>Yer</th><th className={th}>Masa / yer no</th><th className={th}>Tarih</th><th className={th}>Durum</th><th className={th}>Sözleşme</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {o.assignments.map((a) => (
                                <tr key={a.id}>
                                    <td className={td}>{a.place}<span className="block text-xs text-gray-500">{[a.unitType, a.area ? `${a.area} m²` : null].filter(Boolean).join(' · ')}</span></td>
                                    <td className={td}>{a.unitLabel ?? '—'}</td>
                                    <td className={td}>{fmtDate(a.startDate)} – {a.endDate ? fmtDate(a.endDate) : 'açık uçlu'}</td>
                                    <td className={td}><StatePill state={a.state} label={STATE_LABEL[a.state] ?? a.state} /></td>
                                    <td className={td}>{a.contract ? a.contract.contractNo : <Badge tone="warning">Bağlanmamış</Badge>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </TableShell>
                )}
            </Card>
            {o.contracts && (
                <Card padded={false}>
                    <h3 className="border-b border-white/5 px-4 py-3 text-sm font-semibold text-white">Kira sözleşmeleri</h3>
                    {o.contracts.length === 0 ? <div className="p-4"><EmptyState icon={FileSignature} title="Sözleşme kaydı yok" /></div> : (
                        <ul className="divide-y divide-white/5">
                            {o.contracts.map((c) => (
                                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white">{c.contractNo} <span className="text-gray-500">· {c.spaceName}</span></p>
                                        <p className="text-xs text-gray-500">{fmtDate(c.startDate)} – {fmtDate(c.endDate)} · {c.isWaived ? 'Kira muaf' : `${fmtMoney(c.monthlyRent, c.currency)} + KDV (${fmtMoney(c.totalMonthlyRent, c.currency)})`}{c.organization ? ` · ${c.organization.legalName ?? c.organization.name}${c.organization.taxNumber ? ` · VKN ${c.organization.taxNumber}` : ''}` : ''}</p>
                                    </div>
                                    <Badge tone={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{CONTRACT_STATUS[c.status] ?? c.status}</Badge>
                                    {c.status === 'ACTIVE' && c.daysLeft <= 30 && <Badge tone={c.daysLeft <= 15 ? 'danger' : 'warning'}>{c.daysLeft < 0 ? 'Süresi doldu' : `${c.daysLeft} gün kaldı`}</Badge>}
                                    <Badge tone={c.signed ? 'success' : 'warning'}>{c.signed ? 'Islak imzalı tarama var' : 'Tarama yüklenmedi'}</Badge>
                                    {can('update', 'rent') && <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(c.id)}>Düzenle / belge yükle</Button>}
                                    <a href={`/api/admin/rent/contracts/${c.id}/print`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white"><Printer className="h-3.5 w-3.5" aria-hidden /> Çıktı</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}
            {edit && <RentContractForm contractId={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); q.reload(); }} />}
        </div>
    );
}
