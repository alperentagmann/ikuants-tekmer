import { notFound, redirect } from 'next/navigation';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { AccountingService } from '@/lib/services/accounting-service';
import { SettingService } from '@/lib/services/setting-service';
import { resolvePublicSettings } from '@/lib/site-settings';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

const money = (n: number, c: string) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
const date = (d: Date | null) => (d ? d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—');
const WH: Record<number, string> = { 0.2: '2/10', 0.3: '3/10', 0.4: '4/10', 0.5: '5/10', 0.7: '7/10', 0.9: '9/10', 1: '10/10' };

/** Printable sales invoice (A4). Shown inside the admin area; requires finance:view. */
export default async function InvoicePrintPage({ params }: Props) {
    const user = await getCurrentAdminUser().catch(() => null);
    if (!user) redirect('/admin/login');
    if (!hasPermission(user, 'view', 'finance')) notFound();
    const { id } = await params;
    const inv = await AccountingService.getInvoice(id).catch(() => null);
    if (!inv || inv.status === 'DRAFT') notFound();
    const s = resolvePublicSettings(await SettingService.getPublicSettings());

    return (
        <div className="mx-auto max-w-[210mm] bg-white p-10 text-[13px] text-gray-900 shadow-2xl print:max-w-none print:p-0 print:shadow-none">
            <style>{'@media print { body { background: white !important; } aside, header, nav, .no-print, .admin-glass-field { display: none !important; } main { padding: 0 !important; max-width: none !important; } }'}</style>
            <div className="no-print mb-6 flex justify-end"><PrintButton /></div>
            <div className="flex items-start justify-between border-b-2 border-gray-900 pb-5">
                <div>
                    <img src={s.logoUrl} alt={s.siteName} className="mb-2 h-12 w-auto" />
                    <div className="font-bold">{s.siteName}</div>
                    <div className="max-w-xs text-xs text-gray-600">{s.address}</div>
                    <div className="text-xs text-gray-600">{s.phone} · {s.email}</div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold tracking-wide">FATURA</div>
                    {inv.status === 'CANCELLED' && <div className="mt-1 inline-block rounded border-2 border-red-600 px-2 text-sm font-bold text-red-600">İPTAL</div>}
                    <table className="ml-auto mt-2 text-xs">
                        <tbody>
                            <tr><td className="pr-3 text-gray-500">Fatura no</td><td className="font-mono font-semibold">{inv.number}</td></tr>
                            <tr><td className="pr-3 text-gray-500">Tarih</td><td>{date(inv.issueDate)}</td></tr>
                            <tr><td className="pr-3 text-gray-500">Vade</td><td>{date(inv.dueDate)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-5 rounded border border-gray-300 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sayın</div>
                <div className="font-semibold">{inv.party.name}</div>
                {inv.party.address && <div className="text-xs text-gray-600">{inv.party.address}</div>}
                <div className="text-xs text-gray-600">{[inv.party.taxOffice ? `V.D.: ${inv.party.taxOffice}` : null, inv.party.taxNumber ? `VKN: ${inv.party.taxNumber}` : null].filter(Boolean).join(' · ')}</div>
            </div>

            <table className="mt-5 w-full border-collapse text-xs">
                <thead>
                    <tr className="border-y-2 border-gray-900 text-left">
                        <th className="py-2">#</th><th className="py-2">Açıklama</th><th className="py-2 text-right">Miktar</th><th className="py-2 text-right">Birim fiyat</th><th className="py-2 text-right">İsk.</th><th className="py-2 text-right">KDV</th><th className="py-2 text-right">Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    {inv.lines.map((l, i) => (
                        <tr key={l.id} className="border-b border-gray-200">
                            <td className="py-2 pr-2 text-gray-500">{i + 1}</td>
                            <td className="py-2">{l.description}</td>
                            <td className="py-2 text-right">{l.quantity.toLocaleString('tr-TR')} {l.unit}</td>
                            <td className="py-2 text-right font-mono">{money(l.unitPrice, inv.currency)}</td>
                            <td className="py-2 text-right">{l.discountRate ? `%${l.discountRate}` : '—'}</td>
                            <td className="py-2 text-right">%{l.vatRate}</td>
                            <td className="py-2 text-right font-mono">{money(l.lineNet, inv.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-4 flex justify-end">
                <table className="w-72 text-xs">
                    <tbody>
                        <tr><td className="py-1 text-gray-600">Ara toplam</td><td className="py-1 text-right font-mono">{money(inv.subtotal, inv.currency)}</td></tr>
                        {inv.discountTotal > 0 && <tr><td className="py-1 text-gray-600">İskonto</td><td className="py-1 text-right font-mono">−{money(inv.discountTotal, inv.currency)}</td></tr>}
                        <tr><td className="py-1 text-gray-600">Hesaplanan KDV</td><td className="py-1 text-right font-mono">{money(inv.vatTotal, inv.currency)}</td></tr>
                        {inv.withholdingTotal > 0 && <tr><td className="py-1 text-gray-600">KDV tevkifatı ({WH[inv.withholdingRate] || inv.withholdingRate})</td><td className="py-1 text-right font-mono">−{money(inv.withholdingTotal, inv.currency)}</td></tr>}
                        <tr className="border-t-2 border-gray-900 text-sm font-bold"><td className="py-2">Ödenecek tutar</td><td className="py-2 text-right font-mono">{money(inv.grandTotal, inv.currency)}</td></tr>
                    </tbody>
                </table>
            </div>

            {inv.notes && <div className="mt-6 whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-700">{inv.notes}</div>}
            <p className="mt-10 border-t border-gray-200 pt-3 text-[10px] text-gray-500">
                Bu belge İKÜANTS TEKMER ön muhasebe sisteminden oluşturulmuştur. e-Fatura / e-Arşiv kapsamındaki işlemlerde geçerli belge, entegratör aracılığıyla düzenlenen elektronik faturadır.
            </p>
        </div>
    );
}
