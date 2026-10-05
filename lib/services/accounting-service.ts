import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';
import { IntegrationService } from '@/lib/services/integration-service';
import { MOVEMENT_KINDS, VAT_RATES, WITHHOLDING_RATES, computeInvoice, round2, type InvoiceLineInput } from '@/lib/accounting-math';

export { EXPENSE_CATEGORIES, INCOME_CATEGORIES, MOVEMENT_KINDS, VAT_RATES, WITHHOLDING_RATES, computeInvoice, round2 } from '@/lib/accounting-math';

type Actor = UserWithPermissions & { id: string; name: string; email: string };

function can(actor: Actor, action: string) {
    return actor.isSuperAdmin || hasPermission(actor, action, 'finance');
}
function assert(actor: Actor, action: string, label: string) {
    if (!can(actor, action)) throw new DomainError(`${label} için finance:${action} izni gerekir.`, 403);
}
function cleanLines(input: unknown): InvoiceLineInput[] {
    const lines = (Array.isArray(input) ? input : []).slice(0, 100).map((l) => (l && typeof l === 'object' ? (l as Record<string, unknown>) : {}));
    const out = lines
        .map((l) => ({
            description: String(l.description || '').trim().slice(0, 300),
            quantity: Number(l.quantity),
            unit: String(l.unit || 'Adet').slice(0, 20),
            unitPrice: Number(l.unitPrice),
            discountRate: Math.min(100, Math.max(0, Number(l.discountRate) || 0)),
            vatRate: Number(l.vatRate),
        }))
        .filter((l) => l.description);
    for (const l of out) {
        if (!Number.isFinite(l.quantity) || l.quantity <= 0) throw new DomainError(`"${l.description}" için miktar sıfırdan büyük olmalı.`);
        if (!Number.isFinite(l.unitPrice) || l.unitPrice < 0) throw new DomainError(`"${l.description}" için birim fiyat geçersiz.`);
        if (!VAT_RATES.includes(l.vatRate)) throw new DomainError(`KDV oranı ${VAT_RATES.join(', ')} değerlerinden biri olmalı.`);
    }
    if (!out.length) throw new DomainError('Faturada en az bir kalem olmalı.');
    return out;
}
const day = (v: unknown, label: string) => {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new DomainError(`${label} geçersiz.`);
    return new Date(`${v}T12:00:00+03:00`);
};

async function nextInvoiceNumber(issueDate: Date) {
    const year = issueDate.getFullYear();
    const prefix = `IKT${year}`;
    const last = await prisma.salesInvoice.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: 'desc' }, select: { number: true } });
    const seq = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
    // GİB format: 3-letter prefix + year + 9-digit sequence (16 chars)
    return `${prefix}${String(seq).padStart(9, '0')}`;
}

async function invoiceStatusAfterPayment(invoiceId: string) {
    const inv = await prisma.salesInvoice.findUnique({ where: { id: invoiceId }, select: { grandTotal: true, status: true } });
    if (!inv || inv.status === 'CANCELLED' || inv.status === 'DRAFT') return;
    const paid = await prisma.financeMovement.aggregate({ where: { salesInvoiceId: invoiceId, kind: 'COLLECTION' }, _sum: { amount: true } });
    const paidAmount = round2(paid._sum.amount || 0);
    await prisma.salesInvoice.update({ where: { id: invoiceId }, data: { paidAmount, status: paidAmount <= 0 ? 'ISSUED' : paidAmount + 0.009 >= inv.grandTotal ? 'PAID' : 'PARTIALLY_PAID' } });
}

/**
 * Pre-accounting (ön muhasebe): parties, cash / bank accounts, sales invoices with VAT and
 * withholding, collections, payments, expenses and transfers. Official ledgers stay with the
 * accountant; e-invoices are sent through the e-invoice integrator connection when configured.
 */
export const AccountingService = {
    // ------------------------------------------------------------------ parties (cari)
    async listParties(search?: string) {
        const parties = await prisma.financeParty.findMany({
            where: { isActive: true, ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { taxNumber: { contains: search } }] } : {}) },
            orderBy: { name: 'asc' },
            take: 500,
        });
        const ids = parties.map((p) => p.id);
        const [inv, mov] = await Promise.all([
            prisma.salesInvoice.groupBy({ by: ['partyId'], where: { partyId: { in: ids }, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] } }, _sum: { grandTotal: true, paidAmount: true } }),
            prisma.financeMovement.groupBy({ by: ['partyId', 'kind'], where: { partyId: { in: ids }, kind: { in: ['PAYMENT'] } }, _sum: { amount: true } }),
        ]);
        return parties.map((p) => {
            const i = inv.find((x) => x.partyId === p.id);
            const invoiced = round2(i?._sum.grandTotal || 0);
            const collected = round2(i?._sum.paidAmount || 0);
            const paidOut = round2(mov.filter((m) => m.partyId === p.id).reduce((a, m) => a + (m._sum.amount || 0), 0));
            return { ...p, invoiced, collected, receivable: round2(invoiced - collected), paidOut };
        });
    },

    async saveParty(input: Record<string, unknown> & { id?: string }, actor: Actor) {
        assert(actor, input.id ? 'update' : 'create', 'Cari kaydı');
        const name = String(input.name || '').trim();
        if (name.length < 2) throw new DomainError('Cari adı zorunludur.');
        const taxNumber = String(input.taxNumber || '').replace(/\s/g, '');
        if (taxNumber && !/^\d{10}$/.test(taxNumber)) throw new DomainError('Vergi kimlik numarası 10 haneli olmalıdır. (T.C. kimlik numarası bu alana girilmez.)');
        const iban = String(input.iban || '').replace(/\s/g, '').toUpperCase();
        if (iban && !/^TR\d{24}$/.test(iban)) throw new DomainError('IBAN TR ile başlayan 26 karakter olmalıdır.');
        const data = {
            kind: ['CUSTOMER', 'SUPPLIER', 'BOTH'].includes(String(input.kind)) ? String(input.kind) : 'CUSTOMER',
            name, taxNumber: taxNumber || null,
            taxOffice: String(input.taxOffice || '').trim() || null,
            email: String(input.email || '').trim() || null,
            phone: String(input.phone || '').trim() || null,
            address: String(input.address || '').trim() || null,
            iban: iban || null,
            organizationId: typeof input.organizationId === 'string' && input.organizationId ? input.organizationId : null,
            notes: String(input.notes || '').trim() || null,
        };
        const row = input.id ? await prisma.financeParty.update({ where: { id: input.id }, data }) : await prisma.financeParty.create({ data: { ...data, createdById: actor.id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'FinanceParty', entityId: row.id, newValues: { name, kind: data.kind } });
        return row;
    },

    /** Statement (cari ekstre): invoices as debit, collections as credit, supplier payments listed separately. */
    async statement(partyId: string) {
        const party = await prisma.financeParty.findUnique({ where: { id: partyId } });
        if (!party) throw new DomainError('Cari bulunamadı.', 404);
        const [invoices, movements] = await Promise.all([
            prisma.salesInvoice.findMany({ where: { partyId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] } }, select: { id: true, number: true, issueDate: true, dueDate: true, grandTotal: true } }),
            prisma.financeMovement.findMany({ where: { partyId }, include: { account: { select: { name: true } }, salesInvoice: { select: { number: true } } } }),
        ]);
        const rows = [
            ...invoices.map((i) => ({ date: i.issueDate, type: 'INVOICE', description: `Satış faturası ${i.number}`, debit: i.grandTotal, credit: 0, ref: i.id })),
            ...movements.filter((m) => m.kind === 'COLLECTION').map((m) => ({ date: m.date, type: 'COLLECTION', description: `Tahsilat (${m.account.name})${m.salesInvoice ? ` · ${m.salesInvoice.number}` : ''}${m.description ? ` · ${m.description}` : ''}`, debit: 0, credit: m.amount, ref: m.id })),
            ...movements.filter((m) => m.kind === 'PAYMENT').map((m) => ({ date: m.date, type: 'PAYMENT', description: `Ödeme (${m.account.name})${m.description ? ` · ${m.description}` : ''}`, debit: m.amount, credit: 0, ref: m.id })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());
        let balance = 0;
        const lines = rows.map((r) => {
            balance = round2(balance + r.debit - r.credit);
            return { ...r, balance };
        });
        return { party, lines, balance };
    },

    // ------------------------------------------------------------------ cash / bank accounts
    async listAccounts() {
        const accounts = await prisma.financeAccount.findMany({ where: { isActive: true }, orderBy: [{ kind: 'asc' }, { name: 'asc' }] });
        const sums = await prisma.financeMovement.groupBy({ by: ['accountId', 'kind'], where: { accountId: { in: accounts.map((a) => a.id) } }, _sum: { amount: true } });
        return accounts.map((a) => {
            const delta = sums.filter((s) => s.accountId === a.id).reduce((acc, s) => acc + (MOVEMENT_KINDS[s.kind]?.sign || 0) * (s._sum.amount || 0), 0);
            return { ...a, balance: round2(a.openingBalance + delta) };
        });
    },

    async saveAccount(input: Record<string, unknown> & { id?: string }, actor: Actor) {
        assert(actor, input.id ? 'update' : 'create', 'Kasa / banka hesabı');
        const name = String(input.name || '').trim();
        if (!name) throw new DomainError('Hesap adı zorunludur.');
        const iban = String(input.iban || '').replace(/\s/g, '').toUpperCase();
        if (iban && !/^TR\d{24}$/.test(iban)) throw new DomainError('IBAN TR ile başlayan 26 karakter olmalıdır.');
        const data = {
            name,
            kind: ['CASH', 'BANK', 'POS', 'OTHER'].includes(String(input.kind)) ? String(input.kind) : 'BANK',
            currency: ['TRY', 'USD', 'EUR', 'GBP'].includes(String(input.currency)) ? String(input.currency) : 'TRY',
            bankName: String(input.bankName || '').trim() || null,
            iban: iban || null,
            openingBalance: round2(Number(input.openingBalance) || 0),
        };
        const row = input.id ? await prisma.financeAccount.update({ where: { id: input.id }, data }) : await prisma.financeAccount.create({ data: { ...data, createdById: actor.id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'FinanceAccount', entityId: row.id, newValues: data });
        return row;
    },

    // ------------------------------------------------------------------ movements
    async listMovements(params: { accountId?: string; partyId?: string; kind?: string; from?: string; to?: string; limit?: number }) {
        return prisma.financeMovement.findMany({
            where: {
                ...(params.accountId ? { accountId: params.accountId } : {}),
                ...(params.partyId ? { partyId: params.partyId } : {}),
                ...(params.kind ? { kind: params.kind } : {}),
                ...(params.from || params.to ? { date: { ...(params.from ? { gte: new Date(`${params.from}T00:00:00+03:00`) } : {}), ...(params.to ? { lte: new Date(`${params.to}T23:59:59+03:00`) } : {}) } } : {}),
            },
            include: { account: { select: { id: true, name: true, currency: true } }, party: { select: { id: true, name: true } }, salesInvoice: { select: { id: true, number: true } } },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: Math.min(1000, params.limit || 300),
        });
    },

    async addMovement(input: Record<string, unknown>, actor: Actor) {
        assert(actor, 'create', 'Kasa / banka hareketi');
        const kind = String(input.kind || '');
        if (!['COLLECTION', 'PAYMENT', 'INCOME', 'EXPENSE', 'TRANSFER'].includes(kind)) throw new DomainError('Geçersiz hareket türü.');
        const amount = round2(Number(input.amount));
        if (!Number.isFinite(amount) || amount <= 0) throw new DomainError('Tutar sıfırdan büyük olmalı.');
        const date = day(input.date, 'Tarih');
        const account = await prisma.financeAccount.findUnique({ where: { id: String(input.accountId || '') } });
        if (!account || !account.isActive) throw new DomainError('Kasa / banka hesabı seçin.');
        const base = { amount, currency: account.currency, date, description: String(input.description || '').trim().slice(0, 300) || null, documentNo: String(input.documentNo || '').trim().slice(0, 60) || null, category: String(input.category || '').trim().slice(0, 60) || null, createdById: actor.id };

        if (kind === 'TRANSFER') {
            const target = await prisma.financeAccount.findUnique({ where: { id: String(input.targetAccountId || '') } });
            if (!target || target.id === account.id) throw new DomainError('Virman için farklı bir hedef hesap seçin.');
            if (target.currency !== account.currency) throw new DomainError('Farklı para birimli hesaplar arasında virman yapılamaz.');
            const groupId = crypto.randomUUID();
            await prisma.$transaction([
                prisma.financeMovement.create({ data: { ...base, kind: 'TRANSFER_OUT', accountId: account.id, transferGroupId: groupId } }),
                prisma.financeMovement.create({ data: { ...base, kind: 'TRANSFER_IN', accountId: target.id, transferGroupId: groupId } }),
            ]);
            await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'FinanceMovement', entityId: groupId, newValues: { kind, amount, from: account.name, to: target.name } });
            return { transferGroupId: groupId };
        }

        let salesInvoiceId: string | null = null;
        let partyId = typeof input.partyId === 'string' && input.partyId ? input.partyId : null;
        if (kind === 'COLLECTION' && input.salesInvoiceId) {
            const inv = await prisma.salesInvoice.findUnique({ where: { id: String(input.salesInvoiceId) } });
            if (!inv || !['ISSUED', 'PARTIALLY_PAID'].includes(inv.status)) throw new DomainError('Tahsilat yalnız kesilmiş ve ödenmemiş faturaya bağlanabilir.');
            const remaining = round2(inv.grandTotal - inv.paidAmount);
            if (amount > remaining + 0.009) throw new DomainError(`Tahsilat faturanın kalan tutarını (${remaining.toLocaleString('tr-TR')} ${inv.currency}) aşamaz.`);
            if (inv.currency !== account.currency) throw new DomainError('Fatura ve hesap para birimi aynı olmalı.');
            salesInvoiceId = inv.id;
            partyId = inv.partyId;
        }
        const purchaseInvoiceId = kind === 'PAYMENT' && typeof input.purchaseInvoiceId === 'string' && input.purchaseInvoiceId ? input.purchaseInvoiceId : null;
        const row = await prisma.financeMovement.create({ data: { ...base, kind, accountId: account.id, partyId, salesInvoiceId, purchaseInvoiceId } });
        if (salesInvoiceId) await invoiceStatusAfterPayment(salesInvoiceId);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'FinanceMovement', entityId: row.id, newValues: { kind, amount, account: account.name, salesInvoiceId, partyId } });
        return row;
    },

    async deleteMovement(id: string, actor: Actor) {
        assert(actor, 'approve', 'Hareket silme');
        const m = await prisma.financeMovement.findUnique({ where: { id } });
        if (!m) throw new DomainError('Hareket bulunamadı.', 404);
        const ids = m.transferGroupId ? (await prisma.financeMovement.findMany({ where: { transferGroupId: m.transferGroupId }, select: { id: true } })).map((x) => x.id) : [id];
        await prisma.financeMovement.deleteMany({ where: { id: { in: ids } } });
        if (m.salesInvoiceId) await invoiceStatusAfterPayment(m.salesInvoiceId);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'FinanceMovement', entityId: id, oldValues: { kind: m.kind, amount: m.amount, date: m.date } });
    },

    // ------------------------------------------------------------------ sales invoices
    async listInvoices(params: { status?: string; partyId?: string; search?: string }) {
        return prisma.salesInvoice.findMany({
            where: {
                ...(params.status ? { status: params.status } : {}),
                ...(params.partyId ? { partyId: params.partyId } : {}),
                ...(params.search ? { OR: [{ number: { contains: params.search, mode: 'insensitive' } }, { party: { name: { contains: params.search, mode: 'insensitive' } } }] } : {}),
            },
            include: { party: { select: { id: true, name: true } } },
            orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
            take: 500,
        });
    },

    async getInvoice(id: string) {
        const inv = await prisma.salesInvoice.findUnique({ where: { id }, include: { party: true, lines: { orderBy: { sortOrder: 'asc' } }, movements: { include: { account: { select: { name: true } } }, orderBy: { date: 'asc' } } } });
        if (!inv) throw new DomainError('Fatura bulunamadı.', 404);
        return inv;
    },

    async saveDraft(input: Record<string, unknown> & { id?: string }, actor: Actor) {
        assert(actor, 'create', 'Fatura taslağı');
        const party = await prisma.financeParty.findUnique({ where: { id: String(input.partyId || '') } });
        if (!party) throw new DomainError('Cari seçin.');
        const issueDate = day(input.issueDate, 'Fatura tarihi');
        const dueDate = input.dueDate ? day(input.dueDate, 'Vade tarihi') : null;
        if (dueDate && dueDate < issueDate) throw new DomainError('Vade tarihi fatura tarihinden önce olamaz.');
        const withholdingRate = WITHHOLDING_RATES.includes(Number(input.withholdingRate)) ? Number(input.withholdingRate) : 0;
        const totals = computeInvoice(cleanLines(input.lines), withholdingRate);
        const data = {
            partyId: party.id, issueDate, dueDate,
            currency: ['TRY', 'USD', 'EUR', 'GBP'].includes(String(input.currency)) ? String(input.currency) : 'TRY',
            withholdingRate, subtotal: totals.subtotal, discountTotal: totals.discountTotal, vatTotal: totals.vatTotal, withholdingTotal: totals.withholdingTotal, grandTotal: totals.grandTotal,
            notes: String(input.notes || '').trim().slice(0, 2000) || null,
            sourceType: ['RENT', 'RESERVATION', 'MACHINE', 'SERVICE', 'OTHER'].includes(String(input.sourceType)) ? String(input.sourceType) : null,
            sourceId: typeof input.sourceId === 'string' && input.sourceId ? input.sourceId : null,
        };
        if (input.id) {
            const existing = await prisma.salesInvoice.findUnique({ where: { id: input.id } });
            if (!existing) throw new DomainError('Fatura bulunamadı.', 404);
            if (existing.status !== 'DRAFT') throw new DomainError('Kesilmiş fatura düzenlenemez; iptal edip yenisini oluşturun.');
            await prisma.$transaction([
                prisma.salesInvoiceLine.deleteMany({ where: { invoiceId: existing.id } }),
                prisma.salesInvoice.update({ where: { id: existing.id }, data: { ...data, lines: { create: totals.lines } } }),
            ]);
            await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'SalesInvoice', entityId: existing.id, newValues: { grandTotal: totals.grandTotal, lines: totals.lines.length } });
            return { id: existing.id };
        }
        const row = await prisma.salesInvoice.create({ data: { ...data, number: `TASLAK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, status: 'DRAFT', createdById: actor.id, lines: { create: totals.lines } } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'SalesInvoice', entityId: row.id, newValues: { party: party.name, grandTotal: totals.grandTotal } });
        return { id: row.id };
    },

    /** DRAFT → ISSUED: assigns the official sequence number and locks the invoice. */
    async issue(id: string, actor: Actor) {
        assert(actor, 'approve', 'Fatura kesme');
        const inv = await prisma.salesInvoice.findUnique({ where: { id }, include: { party: true } });
        if (!inv) throw new DomainError('Fatura bulunamadı.', 404);
        if (inv.status !== 'DRAFT') throw new DomainError('Yalnız taslak fatura kesilebilir.');
        const integrator = await prisma.integrationConnection.findFirst({ where: { provider: 'GIB_EINVOICE', status: 'ACTIVE' } });
        const number = await nextInvoiceNumber(inv.issueDate);
        const updated = await prisma.salesInvoice.update({
            where: { id },
            data: {
                number, status: 'ISSUED', issuedAt: new Date(),
                // Never claimed as sent: without an active integrator the e-invoice waits for configuration
                eInvoiceStatus: integrator ? 'QUEUED' : 'PENDING_EXTERNAL_CONFIGURATION',
            },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'APPROVE', entityType: 'SalesInvoice', entityId: id, newValues: { number, grandTotal: inv.grandTotal, party: inv.party.name } });
        void IntegrationService.dispatch('invoice.issued', { invoiceId: id, number, grandTotal: inv.grandTotal, currency: inv.currency });
        return updated;
    },

    async cancel(id: string, reason: string, actor: Actor) {
        assert(actor, 'approve', 'Fatura iptali');
        if (!reason?.trim()) throw new DomainError('İptal nedenini yazın.');
        const inv = await prisma.salesInvoice.findUnique({ where: { id } });
        if (!inv) throw new DomainError('Fatura bulunamadı.', 404);
        if (inv.status === 'CANCELLED') throw new DomainError('Fatura zaten iptal.');
        if (inv.paidAmount > 0) throw new DomainError('Tahsilatı olan fatura iptal edilemez; önce tahsilatı geri alın.');
        if (inv.status === 'DRAFT') {
            await prisma.salesInvoice.delete({ where: { id } });
        } else {
            await prisma.salesInvoice.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date(), notes: [inv.notes, `İptal nedeni: ${reason.trim()}`].filter(Boolean).join('\n') } });
        }
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: inv.status === 'DRAFT' ? 'DELETE' : 'UPDATE', entityType: 'SalesInvoice', entityId: id, oldValues: { status: inv.status, number: inv.number }, newValues: { status: 'CANCELLED', reason } });
    },

    // ------------------------------------------------------------------ dashboard & VAT
    async summary(year: number) {
        const from = new Date(`${year}-01-01T00:00:00+03:00`);
        const to = new Date(`${year}-12-31T23:59:59+03:00`);
        const now = new Date();
        const [invoices, movements, purchases, accounts] = await Promise.all([
            prisma.salesInvoice.findMany({ where: { status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] }, issueDate: { gte: from, lte: to } }, select: { issueDate: true, grandTotal: true, vatTotal: true, withholdingTotal: true, subtotal: true, discountTotal: true, paidAmount: true, dueDate: true, status: true } }),
            prisma.financeMovement.findMany({ where: { date: { gte: from, lte: to }, kind: { in: ['COLLECTION', 'INCOME', 'PAYMENT', 'EXPENSE'] } }, select: { date: true, kind: true, amount: true, category: true } }),
            prisma.invoiceRecord.findMany({ where: { invoiceDate: { gte: from, lte: to }, status: { not: 'CANCELLED' } }, select: { invoiceDate: true, netAmount: true, taxVatAmount: true, grossAmount: true } }),
            AccountingService.listAccounts(),
        ]);
        const months = Array.from({ length: 12 }, (_, m) => ({ month: m + 1, invoiced: 0, collected: 0, expenses: 0, outputVat: 0, inputVat: 0, withheldVat: 0 }));
        const monthOf = (d: Date) => Number(new Date(d.getTime() + 3 * 3600000).toISOString().slice(5, 7)) - 1;
        for (const i of invoices) {
            const m = months[monthOf(i.issueDate)];
            m.invoiced += i.grandTotal;
            m.outputVat += i.vatTotal;
            m.withheldVat += i.withholdingTotal;
        }
        for (const mv of movements) {
            const m = months[monthOf(mv.date)];
            if (mv.kind === 'COLLECTION' || mv.kind === 'INCOME') m.collected += mv.amount;
            else m.expenses += mv.amount;
        }
        for (const p of purchases) months[monthOf(p.invoiceDate)].inputVat += p.taxVatAmount;
        const open = await prisma.salesInvoice.findMany({ where: { status: { in: ['ISSUED', 'PARTIALLY_PAID'] } }, select: { grandTotal: true, paidAmount: true, dueDate: true } });
        const receivable = round2(open.reduce((a, i) => a + i.grandTotal - i.paidAmount, 0));
        const overdue = round2(open.filter((i) => i.dueDate && i.dueDate < now).reduce((a, i) => a + i.grandTotal - i.paidAmount, 0));
        const expenseByCategory = new Map<string, number>();
        for (const mv of movements) if (mv.kind === 'EXPENSE' || mv.kind === 'PAYMENT') expenseByCategory.set(mv.category || 'Diğer', (expenseByCategory.get(mv.category || 'Diğer') || 0) + mv.amount);
        return {
            year,
            months: months.map((m) => ({ ...m, invoiced: round2(m.invoiced), collected: round2(m.collected), expenses: round2(m.expenses), outputVat: round2(m.outputVat), inputVat: round2(m.inputVat), withheldVat: round2(m.withheldVat), payableVat: round2(m.outputVat - m.withheldVat - m.inputVat) })),
            totals: {
                invoiced: round2(months.reduce((a, m) => a + m.invoiced, 0)),
                collected: round2(months.reduce((a, m) => a + m.collected, 0)),
                expenses: round2(months.reduce((a, m) => a + m.expenses, 0)),
                receivable, overdue,
                cash: round2(accounts.filter((a) => a.currency === 'TRY').reduce((a, x) => a + x.balance, 0)),
            },
            accounts: accounts.map((a) => ({ id: a.id, name: a.name, kind: a.kind, currency: a.currency, balance: a.balance })),
            expenseByCategory: Array.from(expenseByCategory.entries()).map(([category, amount]) => ({ category, amount: round2(amount) })).sort((a, b) => b.amount - a.amount),
        };
    },
};
