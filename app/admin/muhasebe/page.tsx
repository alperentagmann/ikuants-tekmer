'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Banknote, BookOpenCheck, Building2, Calculator, FileText, Landmark, Pencil, Plus, Printer, Receipt, Search, Send, Trash2, Wallet, XCircle } from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Select, Skeleton, Tabs, TextArea, TextInput, formatDate } from '@/components/admin/ui';
import { InvoiceEditor, emptyLine, type InvoiceDraft } from '@/components/admin/accounting/InvoiceEditor';

type Tab = 'summary' | 'invoices' | 'parties' | 'accounts' | 'movements' | 'vat';
interface Month { month: number; invoiced: number; collected: number; expenses: number; outputVat: number; inputVat: number; withheldVat: number; payableVat: number }
interface Summary {
    year: number; months: Month[];
    totals: { invoiced: number; collected: number; expenses: number; receivable: number; overdue: number; cash: number };
    accounts: { id: string; name: string; kind: string; currency: string; balance: number }[];
    expenseByCategory: { category: string; amount: number }[];
}
interface Meta { movementKinds: Record<string, { label: string; sign: number }>; expenseCategories: string[]; incomeCategories: string[] }
interface Perms { create: boolean; update: boolean; approve: boolean }
interface Party { id: string; kind: string; name: string; taxNumber: string | null; taxOffice: string | null; email: string | null; phone: string | null; address: string | null; iban: string | null; notes: string | null; invoiced: number; collected: number; receivable: number; paidOut: number }
interface Account { id: string; name: string; kind: string; currency: string; bankName: string | null; iban: string | null; openingBalance: number; balance: number }
interface InvoiceRow { id: string; number: string; issueDate: string; dueDate: string | null; currency: string; status: string; grandTotal: number; paidAmount: number; eInvoiceStatus: string; party: { id: string; name: string } }
interface Movement { id: string; kind: string; amount: number; currency: string; date: string; category: string | null; description: string | null; documentNo: string | null; account: { id: string; name: string }; party: { id: string; name: string } | null; salesInvoice: { id: string; number: string } | null }

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const INV_STATUS: Record<string, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }> = {
    DRAFT: { label: 'Taslak', tone: 'neutral' }, ISSUED: { label: 'Kesildi', tone: 'info' }, PARTIALLY_PAID: { label: 'Kısmi tahsil', tone: 'warning' }, PAID: { label: 'Tahsil edildi', tone: 'success' }, CANCELLED: { label: 'İptal', tone: 'danger' },
};
const EINV: Record<string, string> = { NONE: '—', PENDING_EXTERNAL_CONFIGURATION: 'Entegratör bekleniyor', QUEUED: 'Gönderim kuyruğunda', SENT: 'Gönderildi', ACCEPTED: 'Kabul edildi', REJECTED: 'Reddedildi' };
const ACCOUNT_KIND: Record<string, string> = { CASH: 'Kasa', BANK: 'Banka', POS: 'POS', OTHER: 'Diğer' };
const money = (n: number, c = 'TRY') => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c === 'TRY' ? '₺' : c}`;
const today = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

function Kpi({ icon: Icon, label, value, tone = 'text-white', hint }: { icon: typeof Wallet; label: string; value: string; tone?: string; hint?: string }) {
    return (
        <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
            <div className="flex items-center gap-2 text-xs text-gray-400"><Icon className="h-4 w-4 text-primary" /> {label}</div>
            <div className={`mt-2 font-mono text-xl font-bold ${tone}`}>{value}</div>
            {hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
        </Card>
    );
}

/** Pre-accounting: invoices, parties, cash / bank, movements and VAT in one place. */
export default function AccountingPage() {
    const [tab, setTab] = useState<Tab>('summary');
    const [year, setYear] = useState(new Date().getFullYear());
    const [summary, setSummary] = useState<Summary | null>(null);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [perms, setPerms] = useState<Perms>({ create: false, update: false, approve: false });
    const [parties, setParties] = useState<Party[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [invFilter, setInvFilter] = useState({ status: '', search: '' });
    const [movFilter, setMovFilter] = useState({ accountId: '', kind: '' });
    const [editor, setEditor] = useState<InvoiceDraft | null>(null);
    const [partyForm, setPartyForm] = useState<Partial<Party> | null>(null);
    const [accountForm, setAccountForm] = useState<Partial<Account> | null>(null);
    const [movForm, setMovForm] = useState<{ kind: string; accountId: string; targetAccountId: string; partyId: string; salesInvoiceId: string; amount: string; date: string; category: string; description: string; documentNo: string } | null>(null);
    const [statement, setStatement] = useState<{ party: Party; lines: { date: string; type: string; description: string; debit: number; credit: number; balance: number }[]; balance: number } | null>(null);
    const [cancelFor, setCancelFor] = useState<InvoiceRow | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [busy, setBusy] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    const loadSummary = useCallback(async () => {
        const d = await api<{ summary: Summary; perms: Perms; meta: Meta }>(`/api/admin/accounting?view=summary&year=${year}`);
        setSummary(d.summary);
        setPerms(d.perms);
        setMeta(d.meta);
    }, [year]);
    const loadParties = useCallback(async () => setParties((await api<{ parties: Party[] }>('/api/admin/accounting?view=parties')).parties), []);
    const loadAccounts = useCallback(async () => setAccounts((await api<{ accounts: Account[] }>('/api/admin/accounting?view=accounts')).accounts), []);
    const loadInvoices = useCallback(async () => {
        const q = new URLSearchParams({ view: 'invoices' });
        if (invFilter.status) q.set('status', invFilter.status);
        if (invFilter.search) q.set('search', invFilter.search);
        setInvoices((await api<{ invoices: InvoiceRow[] }>(`/api/admin/accounting?${q}`)).invoices);
    }, [invFilter]);
    const loadMovements = useCallback(async () => {
        const q = new URLSearchParams({ view: 'movements' });
        if (movFilter.accountId) q.set('accountId', movFilter.accountId);
        if (movFilter.kind) q.set('kind', movFilter.kind);
        setMovements((await api<{ movements: Movement[] }>(`/api/admin/accounting?${q}`)).movements);
    }, [movFilter]);

    const reloadAll = useCallback(async () => {
        try {
            await Promise.all([loadSummary(), loadParties(), loadAccounts(), loadInvoices(), loadMovements()]);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Muhasebe verisi yüklenemedi' });
        }
    }, [loadSummary, loadParties, loadAccounts, loadInvoices, loadMovements]);

    useEffect(() => {
        const t = setTimeout(reloadAll, 0);
        return () => clearTimeout(t);
    }, [reloadAll]);

    const act = async (key: string, json: Record<string, unknown>, ok: string, after?: () => void) => {
        setBusy(key);
        try {
            await api('/api/admin/accounting', { method: 'POST', json });
            setNotice({ tone: 'success', text: ok });
            after?.();
            await reloadAll();
            return true;
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
            return false;
        } finally {
            setBusy(null);
        }
    };

    const openInvoices = useMemo(() => invoices.filter((i) => ['ISSUED', 'PARTIALLY_PAID'].includes(i.status)), [invoices]);
    const maxBar = useMemo(() => Math.max(1, ...(summary?.months || []).map((m) => Math.max(m.invoiced, m.collected, m.expenses))), [summary]);

    const editInvoice = async (id: string) => {
        try {
            const { invoice } = await api<{ invoice: { id: string; partyId: string; issueDate: string; dueDate: string | null; currency: string; withholdingRate: number; notes: string | null; sourceType: string | null; lines: { description: string; quantity: number; unit: string; unitPrice: number; discountRate: number; vatRate: number }[] } }>(`/api/admin/accounting?view=invoice&id=${id}`);
            setEditor({ id: invoice.id, partyId: invoice.partyId, issueDate: invoice.issueDate.slice(0, 10), dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '', currency: invoice.currency, withholdingRate: String(invoice.withholdingRate), notes: invoice.notes || '', sourceType: invoice.sourceType || '', lines: invoice.lines.map((l) => ({ description: l.description, quantity: String(l.quantity), unit: l.unit, unitPrice: String(l.unitPrice), discountRate: String(l.discountRate), vatRate: String(l.vatRate) })) });
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Fatura açılamadı' });
        }
    };

    if (!summary || !meta) return <Skeleton rows={8} />;
    const noSetup = accounts.length === 0 || parties.length === 0;

    return (
        <div className="space-y-5">
            <PageHeader
                title="Ön Muhasebe"
                icon={Calculator}
                description="Satış faturaları, cari hesaplar, kasa & banka, tahsilat, ödeme ve KDV özeti. Resmî defterler mali müşavirde kalır; buradaki kayıtlar ona temiz veri sağlar."
                actions={
                    <>
                        <Select aria-label="Yıl" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={[0, 1, 2].map((k) => ({ value: String(new Date().getFullYear() - k), label: String(new Date().getFullYear() - k) }))} />
                        {perms.create && <Button variant="primary" icon={Plus} disabled={!parties.length} onClick={() => setEditor({ partyId: '', issueDate: today(), dueDate: '', currency: 'TRY', withholdingRate: '0', notes: '', sourceType: '', lines: [emptyLine()] })}>Fatura</Button>}
                    </>
                }
            />
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
            {noSetup && perms.create && (
                <Alert tone="info" title="Başlarken">
                    Önce en az bir kasa / banka hesabı ve bir cari (müşteri / tedarikçi) ekleyin.{' '}
                    {accounts.length === 0 && <button type="button" className="underline" onClick={() => setAccountForm({ kind: 'BANK', currency: 'TRY', openingBalance: 0 })}>Hesap ekle</button>}{' '}
                    {parties.length === 0 && <button type="button" className="underline" onClick={() => setPartyForm({ kind: 'CUSTOMER' })}>Cari ekle</button>}
                </Alert>
            )}

            <Tabs<Tab> value={tab} onChange={setTab} tabs={[
                { value: 'summary', label: 'Özet', icon: BookOpenCheck },
                { value: 'invoices', label: 'Satış faturaları', icon: Receipt, count: invoices.length || null },
                { value: 'parties', label: 'Cariler', icon: Building2, count: parties.length || null },
                { value: 'accounts', label: 'Kasa & Banka', icon: Landmark, count: accounts.length || null },
                { value: 'movements', label: 'Hareketler', icon: ArrowLeftRight },
                { value: 'vat', label: 'KDV özeti', icon: FileText },
            ]} />

            {tab === 'summary' && (
                <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        <Kpi icon={Receipt} label={`${year} faturalanan`} value={money(summary.totals.invoiced)} />
                        <Kpi icon={ArrowDownLeft} label="Tahsilat & gelir" value={money(summary.totals.collected)} tone="text-emerald-300" />
                        <Kpi icon={ArrowUpRight} label="Ödeme & gider" value={money(summary.totals.expenses)} tone="text-rose-300" />
                        <Kpi icon={Wallet} label="Açık alacak" value={money(summary.totals.receivable)} />
                        <Kpi icon={XCircle} label="Vadesi geçen" value={money(summary.totals.overdue)} tone={summary.totals.overdue ? 'text-amber-300' : 'text-white'} />
                        <Kpi icon={Banknote} label="Nakit (TRY hesaplar)" value={money(summary.totals.cash)} />
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <Card>
                            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white">Aylık akış <span className="flex gap-3 text-[11px] font-normal text-gray-400"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />Fatura</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Tahsilat</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" />Gider</span></span></div>
                            <div className="flex h-48 items-end gap-2">
                                {summary.months.map((m) => (
                                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                                        <div className="flex h-40 w-full items-end justify-center gap-0.5">
                                            {[['bg-primary', m.invoiced], ['bg-emerald-400', m.collected], ['bg-rose-400', m.expenses]].map(([cls, v], i) => (
                                                <div key={i} className={`w-1/4 rounded-t ${cls}`} style={{ height: `${(Number(v) / maxBar) * 100}%`, minHeight: Number(v) ? 2 : 0 }} title={money(Number(v))} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-gray-500">{MONTHS[m.month - 1]}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card>
                            <div className="mb-3 text-sm font-semibold text-white">Hesap bakiyeleri</div>
                            {summary.accounts.length === 0 ? <p className="text-xs text-gray-500">Hesap yok.</p> : (
                                <ul className="space-y-2">
                                    {summary.accounts.map((a) => <li key={a.id} className="flex items-center justify-between text-sm"><span className="text-gray-300">{a.name} <span className="text-[11px] text-gray-500">{ACCOUNT_KIND[a.kind]}</span></span><span className={`font-mono ${a.balance < 0 ? 'text-rose-300' : 'text-white'}`}>{money(a.balance, a.currency)}</span></li>)}
                                </ul>
                            )}
                            {summary.expenseByCategory.length > 0 && (
                                <>
                                    <div className="mb-2 mt-5 text-sm font-semibold text-white">Gider dağılımı</div>
                                    <ul className="space-y-1.5">
                                        {summary.expenseByCategory.slice(0, 6).map((c) => (
                                            <li key={c.category}>
                                                <div className="flex justify-between text-xs text-gray-400"><span>{c.category}</span><span className="font-mono">{money(c.amount)}</span></div>
                                                <div className="mt-0.5 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-rose-400/80" style={{ width: `${(c.amount / summary.expenseByCategory[0].amount) * 100}%` }} /></div>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            )}

            {tab === 'invoices' && (
                <div className="space-y-3">
                    <Card padded={false}>
                        <div className="flex flex-col gap-2 p-3 md:flex-row">
                            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" /><TextInput aria-label="Fatura ara" className="pl-9" value={invFilter.search} placeholder="Fatura no veya cari ara" onChange={(e) => setInvFilter({ ...invFilter, search: e.target.value })} /></div>
                            <Select aria-label="Durum" className="md:w-52" value={invFilter.status} placeholder="Tüm durumlar" onChange={(e) => setInvFilter({ ...invFilter, status: e.target.value })} options={Object.entries(INV_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
                        </div>
                    </Card>
                    {invoices.length === 0 ? <Card><EmptyState icon={Receipt} title="Fatura yok" description="Kira, hizmet veya makine kullanımı için satış faturası oluşturun." /></Card> : (
                        <Card padded={false} className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Cari</th><th className="px-4 py-3">Tarih / vade</th><th className="px-4 py-3 text-right">Tutar</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">e-Fatura</th><th className="px-4 py-3">İşlemler</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {invoices.map((i) => {
                                        const overdue = i.dueDate && new Date(i.dueDate) < new Date() && ['ISSUED', 'PARTIALLY_PAID'].includes(i.status);
                                        return (
                                            <tr key={i.id} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-3 font-mono text-xs text-white">{i.number}</td>
                                                <td className="px-4 py-3 text-gray-200">{i.party.name}</td>
                                                <td className={`px-4 py-3 text-xs ${overdue ? 'text-rose-300' : 'text-gray-400'}`}>{formatDate(i.issueDate)}{i.dueDate ? ` → ${formatDate(i.dueDate)}` : ''}{overdue ? ' (vadesi geçti)' : ''}</td>
                                                <td className="px-4 py-3 text-right font-mono text-xs text-gray-100">{money(i.grandTotal, i.currency)}{i.paidAmount > 0 && i.status !== 'PAID' && <div className="text-[10px] text-emerald-300">tahsil: {money(i.paidAmount, i.currency)}</div>}</td>
                                                <td className="px-4 py-3"><Badge tone={INV_STATUS[i.status]?.tone || 'neutral'}>{INV_STATUS[i.status]?.label || i.status}</Badge></td>
                                                <td className="px-4 py-3 text-[11px] text-gray-400">{EINV[i.eInvoiceStatus] || i.eInvoiceStatus}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {i.status === 'DRAFT' && perms.create && <Button size="sm" variant="ghost" icon={Pencil} onClick={() => editInvoice(i.id)}>Düzenle</Button>}
                                                        {i.status === 'DRAFT' && perms.approve && <Button size="sm" variant="primary" icon={Send} loading={busy === `issue-${i.id}`} onClick={() => window.confirm('Fatura kesilsin mi? Kesilen fatura düzenlenemez.') && act(`issue-${i.id}`, { action: 'issue_invoice', id: i.id }, 'Fatura kesildi.')}>Faturayı kes</Button>}
                                                        {['ISSUED', 'PARTIALLY_PAID'].includes(i.status) && perms.create && <Button size="sm" variant="success" icon={ArrowDownLeft} onClick={() => setMovForm({ kind: 'COLLECTION', accountId: accounts[0]?.id || '', targetAccountId: '', partyId: i.party.id, salesInvoiceId: i.id, amount: String(Math.round((i.grandTotal - i.paidAmount) * 100) / 100), date: today(), category: '', description: '', documentNo: '' })}>Tahsilat</Button>}
                                                        {i.status !== 'DRAFT' && <Link href={`/admin/muhasebe/fatura/${i.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-200 hover:border-primary/50"><Printer className="h-3.5 w-3.5" />Yazdır</Link>}
                                                        {i.status !== 'CANCELLED' && i.paidAmount === 0 && perms.approve && <Button size="sm" variant="ghost" icon={Trash2} aria-label={i.status === 'DRAFT' ? 'Taslağı sil' : 'İptal et'} onClick={() => { setCancelFor(i); setCancelReason(''); }} />}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </div>
            )}

            {tab === 'parties' && (
                <div className="space-y-3">
                    {perms.create && <div className="flex justify-end"><Button variant="primary" icon={Plus} onClick={() => setPartyForm({ kind: 'CUSTOMER' })}>Yeni cari</Button></div>}
                    {parties.length === 0 ? <Card><EmptyState icon={Building2} title="Cari yok" description="Girişimciler, kiracılar, tedarikçiler ve kurumlar." /></Card> : (
                        <Card padded={false} className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Cari</th><th className="px-4 py-3">Tür</th><th className="px-4 py-3">VKN</th><th className="px-4 py-3 text-right">Faturalanan</th><th className="px-4 py-3 text-right">Alacak</th><th className="px-4 py-3" /></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {parties.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-3"><div className="font-medium text-white">{p.name}</div><div className="text-[11px] text-gray-500">{[p.email, p.phone].filter(Boolean).join(' · ')}</div></td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{p.kind === 'CUSTOMER' ? 'Müşteri' : p.kind === 'SUPPLIER' ? 'Tedarikçi' : 'Müşteri & tedarikçi'}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.taxNumber || '—'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs">{money(p.invoiced)}</td>
                                            <td className={`px-4 py-3 text-right font-mono text-xs ${p.receivable > 0 ? 'text-amber-300' : 'text-gray-400'}`}>{money(p.receivable)}</td>
                                            <td className="px-4 py-3"><div className="flex justify-end gap-1.5"><Button size="sm" variant="ghost" icon={BookOpenCheck} onClick={async () => setStatement(await api(`/api/admin/accounting?view=statement&partyId=${p.id}`))}>Ekstre</Button>{perms.update && <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setPartyForm(p)}>Düzenle</Button>}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </div>
            )}

            {tab === 'accounts' && (
                <div className="space-y-3">
                    {perms.create && (
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button icon={ArrowLeftRight} disabled={accounts.length < 2} onClick={() => setMovForm({ kind: 'TRANSFER', accountId: accounts[0]?.id || '', targetAccountId: accounts[1]?.id || '', partyId: '', salesInvoiceId: '', amount: '', date: today(), category: '', description: '', documentNo: '' })}>Virman</Button>
                            <Button icon={ArrowUpRight} disabled={!accounts.length} onClick={() => setMovForm({ kind: 'EXPENSE', accountId: accounts[0]?.id || '', targetAccountId: '', partyId: '', salesInvoiceId: '', amount: '', date: today(), category: meta.expenseCategories[0], description: '', documentNo: '' })}>Gider / ödeme</Button>
                            <Button icon={ArrowDownLeft} disabled={!accounts.length} onClick={() => setMovForm({ kind: 'INCOME', accountId: accounts[0]?.id || '', targetAccountId: '', partyId: '', salesInvoiceId: '', amount: '', date: today(), category: meta.incomeCategories[0], description: '', documentNo: '' })}>Gelir / tahsilat</Button>
                            <Button variant="primary" icon={Plus} onClick={() => setAccountForm({ kind: 'BANK', currency: 'TRY', openingBalance: 0 })}>Yeni hesap</Button>
                        </div>
                    )}
                    {accounts.length === 0 ? <Card><EmptyState icon={Landmark} title="Hesap yok" description="Kasa, banka ve POS hesaplarınızı ekleyin." /></Card> : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {accounts.map((a) => (
                                <Card key={a.id} className="relative overflow-hidden">
                                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/20 blur-2xl" />
                                    <div className="flex items-start justify-between gap-2">
                                        <div><div className="flex items-center gap-2 font-semibold text-white">{a.kind === 'CASH' ? <Wallet className="h-4 w-4 text-amber-300" /> : <Landmark className="h-4 w-4 text-cyan-300" />}{a.name}</div><div className="text-[11px] text-gray-500">{ACCOUNT_KIND[a.kind]}{a.bankName ? ` · ${a.bankName}` : ''}</div></div>
                                        {perms.update && <button type="button" aria-label="Düzenle" className="rounded p-1 text-gray-500 hover:text-white" onClick={() => setAccountForm(a)}><Pencil className="h-4 w-4" /></button>}
                                    </div>
                                    <div className={`mt-3 font-mono text-2xl font-bold ${a.balance < 0 ? 'text-rose-300' : 'text-white'}`}>{money(a.balance, a.currency)}</div>
                                    {a.iban && <div className="mt-1 font-mono text-[11px] text-gray-500">{a.iban.replace(/(.{4})/g, '$1 ').trim()}</div>}
                                    <button type="button" className="mt-3 text-xs text-primary hover:underline" onClick={() => { setMovFilter({ accountId: a.id, kind: '' }); setTab('movements'); }}>Hareketleri gör →</button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'movements' && (
                <div className="space-y-3">
                    <Card padded={false}>
                        <div className="flex flex-col gap-2 p-3 md:flex-row">
                            <Select aria-label="Hesap" value={movFilter.accountId} placeholder="Tüm hesaplar" onChange={(e) => setMovFilter({ ...movFilter, accountId: e.target.value })} options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
                            <Select aria-label="Tür" value={movFilter.kind} placeholder="Tüm türler" onChange={(e) => setMovFilter({ ...movFilter, kind: e.target.value })} options={Object.entries(meta.movementKinds).map(([value, k]) => ({ value, label: k.label }))} />
                        </div>
                    </Card>
                    {movements.length === 0 ? <Card><EmptyState icon={ArrowLeftRight} title="Hareket yok" /></Card> : (
                        <Card padded={false} className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Tür</th><th className="px-4 py-3">Hesap</th><th className="px-4 py-3">Açıklama</th><th className="px-4 py-3 text-right">Tutar</th><th /></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {movements.map((m) => {
                                        const sign = meta.movementKinds[m.kind]?.sign || 1;
                                        return (
                                            <tr key={m.id} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-3 text-xs text-gray-400">{formatDate(m.date)}</td>
                                                <td className="px-4 py-3"><Badge tone={sign > 0 ? 'success' : 'danger'}>{meta.movementKinds[m.kind]?.label || m.kind}</Badge></td>
                                                <td className="px-4 py-3 text-xs text-gray-300">{m.account.name}</td>
                                                <td className="px-4 py-3 text-xs text-gray-300">{[m.party?.name, m.salesInvoice?.number, m.category, m.description, m.documentNo ? `Belge: ${m.documentNo}` : null].filter(Boolean).join(' · ') || '—'}</td>
                                                <td className={`px-4 py-3 text-right font-mono text-xs ${sign > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{sign > 0 ? '+' : '−'}{money(m.amount, m.currency)}</td>
                                                <td className="px-2">{perms.approve && <button type="button" aria-label="Hareketi sil" className="rounded p-1 text-gray-600 hover:text-rose-300" onClick={() => window.confirm('Hareket silinsin mi? Bağlı fatura tahsilatı güncellenir.') && act(`dm-${m.id}`, { action: 'delete_movement', id: m.id }, 'Hareket silindi.')}><Trash2 className="h-4 w-4" /></button>}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </div>
            )}

            {tab === 'vat' && (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Ay</th><th className="px-4 py-3 text-right">Hesaplanan KDV</th><th className="px-4 py-3 text-right">Tevkif edilen</th><th className="px-4 py-3 text-right">İndirilecek KDV</th><th className="px-4 py-3 text-right">Tahmini ödenecek / devreden</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {summary.months.map((m) => (
                                <tr key={m.month}>
                                    <td className="px-4 py-2.5 text-gray-200">{MONTHS[m.month - 1]} {year}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs">{money(m.outputVat)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs text-amber-300">{money(m.withheldVat)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs">{money(m.inputVat)}</td>
                                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${m.payableVat >= 0 ? 'text-white' : 'text-emerald-300'}`}>{m.payableVat >= 0 ? money(m.payableVat) : `${money(-m.payableVat)} devreden`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="px-4 py-3 text-[11px] text-gray-500">Hesaplanan KDV kesilen satış faturalarından, indirilecek KDV Finans › Faturalar ekranındaki gelen faturalardan alınır. Bilgi amaçlıdır; beyanname mali müşavir tarafından hazırlanır.</p>
                </Card>
            )}

            {editor && <InvoiceEditor draft={editor} parties={parties} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); setNotice({ tone: 'success', text: 'Fatura taslağı kaydedildi. Kontrol edip "Faturayı kes" ile kesebilirsiniz.' }); setTab('invoices'); await reloadAll(); }} />}

            <Modal open={Boolean(partyForm)} onClose={() => setPartyForm(null)} title={partyForm?.id ? 'Cariyi düzenle' : 'Yeni cari'} size="lg"
                footer={<><Button onClick={() => setPartyForm(null)}>Vazgeç</Button><Button variant="primary" loading={busy === 'party'} onClick={() => partyForm && act('party', { action: 'save_party', ...partyForm }, 'Cari kaydedildi.', () => setPartyForm(null))}>Kaydet</Button></>}>
                {partyForm && (
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Unvan / ad" htmlFor="p-name" required className="md:col-span-2"><TextInput id="p-name" value={partyForm.name || ''} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} /></Field>
                        <Field label="Tür" htmlFor="p-kind"><Select id="p-kind" value={partyForm.kind || 'CUSTOMER'} onChange={(e) => setPartyForm({ ...partyForm, kind: e.target.value })} options={[{ value: 'CUSTOMER', label: 'Müşteri' }, { value: 'SUPPLIER', label: 'Tedarikçi' }, { value: 'BOTH', label: 'Müşteri & tedarikçi' }]} /></Field>
                        <Field label="Vergi kimlik no (10 hane)" htmlFor="p-vkn" hint="T.C. kimlik numarası bu alana girilmez."><TextInput id="p-vkn" inputMode="numeric" value={partyForm.taxNumber || ''} onChange={(e) => setPartyForm({ ...partyForm, taxNumber: e.target.value })} /></Field>
                        <Field label="Vergi dairesi" htmlFor="p-vd"><TextInput id="p-vd" value={partyForm.taxOffice || ''} onChange={(e) => setPartyForm({ ...partyForm, taxOffice: e.target.value })} /></Field>
                        <Field label="IBAN" htmlFor="p-iban"><TextInput id="p-iban" value={partyForm.iban || ''} placeholder="TR.." onChange={(e) => setPartyForm({ ...partyForm, iban: e.target.value })} /></Field>
                        <Field label="E-posta" htmlFor="p-mail"><TextInput id="p-mail" type="email" value={partyForm.email || ''} onChange={(e) => setPartyForm({ ...partyForm, email: e.target.value })} /></Field>
                        <Field label="Telefon" htmlFor="p-phone"><TextInput id="p-phone" value={partyForm.phone || ''} onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })} /></Field>
                        <Field label="Adres" htmlFor="p-addr" className="md:col-span-2"><TextArea id="p-addr" rows={2} value={partyForm.address || ''} onChange={(e) => setPartyForm({ ...partyForm, address: e.target.value })} /></Field>
                        <Field label="Not" htmlFor="p-notes" className="md:col-span-2"><TextArea id="p-notes" rows={2} value={partyForm.notes || ''} onChange={(e) => setPartyForm({ ...partyForm, notes: e.target.value })} /></Field>
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(accountForm)} onClose={() => setAccountForm(null)} title={accountForm?.id ? 'Hesabı düzenle' : 'Yeni kasa / banka hesabı'}
                footer={<><Button onClick={() => setAccountForm(null)}>Vazgeç</Button><Button variant="primary" loading={busy === 'account'} onClick={() => accountForm && act('account', { action: 'save_account', ...accountForm }, 'Hesap kaydedildi.', () => setAccountForm(null))}>Kaydet</Button></>}>
                {accountForm && (
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Hesap adı" htmlFor="a-name" required className="md:col-span-2"><TextInput id="a-name" value={accountForm.name || ''} placeholder="Örn: Ziraat TL hesabı" onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} /></Field>
                        <Field label="Tür" htmlFor="a-kind"><Select id="a-kind" value={accountForm.kind || 'BANK'} onChange={(e) => setAccountForm({ ...accountForm, kind: e.target.value })} options={Object.entries(ACCOUNT_KIND).map(([value, label]) => ({ value, label }))} /></Field>
                        <Field label="Para birimi" htmlFor="a-cur"><Select id="a-cur" value={accountForm.currency || 'TRY'} disabled={Boolean(accountForm.id)} onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })} options={['TRY', 'USD', 'EUR', 'GBP'].map((c) => ({ value: c, label: c }))} /></Field>
                        <Field label="Banka" htmlFor="a-bank"><TextInput id="a-bank" value={accountForm.bankName || ''} onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })} /></Field>
                        <Field label="IBAN" htmlFor="a-iban"><TextInput id="a-iban" value={accountForm.iban || ''} onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })} /></Field>
                        <Field label="Açılış bakiyesi" htmlFor="a-open" className="md:col-span-2"><TextInput id="a-open" type="number" step="0.01" value={accountForm.openingBalance ?? 0} onChange={(e) => setAccountForm({ ...accountForm, openingBalance: Number(e.target.value) })} /></Field>
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(movForm)} onClose={() => setMovForm(null)} title={movForm ? ({ COLLECTION: 'Tahsilat', INCOME: 'Gelir / tahsilat', EXPENSE: 'Gider', PAYMENT: 'Ödeme', TRANSFER: 'Virman' } as Record<string, string>)[movForm.kind] : ''}
                footer={<><Button onClick={() => setMovForm(null)}>Vazgeç</Button><Button variant="primary" loading={busy === 'mov'} onClick={() => movForm && act('mov', { action: 'add_movement', ...movForm, amount: Number(movForm.amount) }, 'Hareket kaydedildi.', () => setMovForm(null))}>Kaydet</Button></>}>
                {movForm && (
                    <div className="grid gap-3 md:grid-cols-2">
                        {!['COLLECTION', 'TRANSFER'].includes(movForm.kind) && (
                            <Field label="Tür" htmlFor="m-kind" className="md:col-span-2"><Select id="m-kind" value={movForm.kind} onChange={(e) => setMovForm({ ...movForm, kind: e.target.value, category: e.target.value === 'INCOME' ? meta.incomeCategories[0] : meta.expenseCategories[0] })} options={[{ value: 'INCOME', label: 'Diğer gelir' }, { value: 'EXPENSE', label: 'Gider' }, { value: 'PAYMENT', label: 'Cariye ödeme' }]} /></Field>
                        )}
                        <Field label={movForm.kind === 'TRANSFER' ? 'Çıkış hesabı' : 'Hesap'} htmlFor="m-acc"><Select id="m-acc" value={movForm.accountId} onChange={(e) => setMovForm({ ...movForm, accountId: e.target.value })} options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))} /></Field>
                        {movForm.kind === 'TRANSFER' && <Field label="Giriş hesabı" htmlFor="m-target"><Select id="m-target" value={movForm.targetAccountId} onChange={(e) => setMovForm({ ...movForm, targetAccountId: e.target.value })} options={accounts.filter((a) => a.id !== movForm.accountId).map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))} /></Field>}
                        <Field label="Tutar" htmlFor="m-amount" required><TextInput id="m-amount" type="number" min={0} step="0.01" value={movForm.amount} onChange={(e) => setMovForm({ ...movForm, amount: e.target.value })} /></Field>
                        <Field label="Tarih" htmlFor="m-date"><TextInput id="m-date" type="date" value={movForm.date} onChange={(e) => setMovForm({ ...movForm, date: e.target.value })} /></Field>
                        {movForm.kind === 'COLLECTION' && <Field label="Fatura" htmlFor="m-inv"><Select id="m-inv" value={movForm.salesInvoiceId} onChange={(e) => setMovForm({ ...movForm, salesInvoiceId: e.target.value })} options={openInvoices.map((i) => ({ value: i.id, label: `${i.number} · ${i.party.name} · kalan ${money(i.grandTotal - i.paidAmount, i.currency)}` }))} /></Field>}
                        {['PAYMENT', 'INCOME', 'EXPENSE'].includes(movForm.kind) && <Field label="Cari (opsiyonel)" htmlFor="m-party"><Select id="m-party" value={movForm.partyId} placeholder="Seçilmedi" onChange={(e) => setMovForm({ ...movForm, partyId: e.target.value })} options={parties.map((p) => ({ value: p.id, label: p.name }))} /></Field>}
                        {['INCOME', 'EXPENSE', 'PAYMENT'].includes(movForm.kind) && <Field label="Kategori" htmlFor="m-cat"><Select id="m-cat" value={movForm.category} onChange={(e) => setMovForm({ ...movForm, category: e.target.value })} options={(movForm.kind === 'INCOME' ? meta.incomeCategories : meta.expenseCategories).map((c) => ({ value: c, label: c }))} /></Field>}
                        <Field label="Belge no" htmlFor="m-doc"><TextInput id="m-doc" value={movForm.documentNo} placeholder="Dekont / makbuz no" onChange={(e) => setMovForm({ ...movForm, documentNo: e.target.value })} /></Field>
                        <Field label="Açıklama" htmlFor="m-desc" className="md:col-span-2"><TextInput id="m-desc" value={movForm.description} onChange={(e) => setMovForm({ ...movForm, description: e.target.value })} /></Field>
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(cancelFor)} onClose={() => setCancelFor(null)} title={cancelFor?.status === 'DRAFT' ? 'Taslağı sil' : `Faturayı iptal et: ${cancelFor?.number || ''}`}
                footer={<><Button onClick={() => setCancelFor(null)}>Vazgeç</Button><Button variant="danger" loading={busy === 'cancel'} disabled={!cancelReason.trim()} onClick={() => cancelFor && act('cancel', { action: 'cancel_invoice', id: cancelFor.id, reason: cancelReason }, cancelFor.status === 'DRAFT' ? 'Taslak silindi.' : 'Fatura iptal edildi.', () => setCancelFor(null))}>{cancelFor?.status === 'DRAFT' ? 'Sil' : 'İptal et'}</Button></>}>
                <Field label="Neden" htmlFor="c-reason" required><TextArea id="c-reason" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} /></Field>
                {cancelFor?.status !== 'DRAFT' && <p className="mt-2 text-[11px] text-gray-500">e-Fatura gönderildiyse iptal / iade süreci ayrıca entegratör üzerinden yapılmalıdır.</p>}
            </Modal>

            <Modal open={Boolean(statement)} onClose={() => setStatement(null)} title={`Cari ekstre: ${statement?.party.name || ''}`} size="xl" footer={<Button onClick={() => window.print()} icon={Printer}>Yazdır</Button>}>
                {statement && (
                    statement.lines.length === 0 ? <EmptyState icon={BookOpenCheck} title="Hareket yok" /> : (
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-[11px] uppercase text-gray-500"><tr><th className="py-2">Tarih</th><th className="py-2">Açıklama</th><th className="py-2 text-right">Borç</th><th className="py-2 text-right">Alacak</th><th className="py-2 text-right">Bakiye</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {statement.lines.map((l, i) => <tr key={i}><td className="py-2 text-xs text-gray-400">{formatDate(l.date)}</td><td className="py-2 text-xs text-gray-200">{l.description}</td><td className="py-2 text-right font-mono text-xs">{l.debit ? money(l.debit) : ''}</td><td className="py-2 text-right font-mono text-xs text-emerald-300">{l.credit ? money(l.credit) : ''}</td><td className="py-2 text-right font-mono text-xs font-semibold">{money(l.balance)}</td></tr>)}
                            </tbody>
                            <tfoot><tr className="border-t border-white/10"><td colSpan={4} className="py-2 text-right text-xs text-gray-400">Güncel bakiye</td><td className="py-2 text-right font-mono font-bold text-white">{money(statement.balance)}</td></tr></tfoot>
                        </table>
                    )
                )}
            </Modal>
        </div>
    );
}
