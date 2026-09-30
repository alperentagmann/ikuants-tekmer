import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class ReceivableService {
    static async getReceivables(filters?: {
        source?: string;
        status?: string;
        currency?: string;
        search?: string;
        startDate?: Date | string;
        endDate?: Date | string;
        debtor?: string;
        projectId?: string;
        entrepreneurId?: string;
    }) {
        const where: any = {};

        if (filters?.source && filters.source !== 'ALL') {
            where.source = filters.source;
        }
        if (filters?.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters?.currency && filters.currency !== 'ALL') {
            where.currency = filters.currency;
        }
        if (filters?.projectId && filters.projectId !== 'ALL') {
            where.relatedProjectId = filters.projectId;
        }
        if (filters?.entrepreneurId && filters.entrepreneurId !== 'ALL') {
            where.relatedEntrepreneurId = filters.entrepreneurId;
        }
        if (filters?.startDate || filters?.endDate) {
            where.dueDate = {};
            if (filters?.startDate) where.dueDate.gte = new Date(filters.startDate);
            if (filters?.endDate) where.dueDate.lte = new Date(filters.endDate);
        }
        if (filters?.search) {
            where.OR = [
                { debtor: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
                { notes: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const receivables = await prisma.receivable.findMany({
            where,
            include: {
                relatedProject: { select: { id: true, title: true, code: true } },
                relatedEntrepreneur: { select: { id: true, name: true, email: true } },
                relatedOrganization: { select: { id: true, name: true } },
            },
            orderBy: [{ dueDate: 'asc' }],
        });

        const now = new Date();

        // Update overdue status dynamically
        const processed = receivables.map(r => {
            let status = r.status;
            let daysOverdue = 0;

            if (r.remaining > 0 && r.status !== 'CANCELLED' && r.status !== 'WRITTEN_OFF') {
                if (now > r.dueDate) {
                    const diff = Math.abs(now.getTime() - r.dueDate.getTime());
                    daysOverdue = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    if (status !== 'PARTIALLY_PAID') {
                        status = 'OVERDUE';
                    }
                }
            }

            return {
                ...r,
                status,
                daysOverdue,
            };
        });

        // Totals per currency
        const totalsByCurrency: Record<string, {
            currency: string;
            totalAmount: number;
            totalPaid: number;
            totalRemaining: number;
            totalOverdue: number;
            count: number;
        }> = {};

        for (const r of processed) {
            const cur = r.currency || 'TRY';
            if (!totalsByCurrency[cur]) {
                totalsByCurrency[cur] = {
                    currency: cur,
                    totalAmount: 0,
                    totalPaid: 0,
                    totalRemaining: 0,
                    totalOverdue: 0,
                    count: 0,
                };
            }
            totalsByCurrency[cur].totalAmount += r.amount;
            totalsByCurrency[cur].totalPaid += r.paid;
            totalsByCurrency[cur].totalRemaining += r.remaining;
            if (r.status === 'OVERDUE' || r.daysOverdue > 0) {
                totalsByCurrency[cur].totalOverdue += r.remaining;
            }
            totalsByCurrency[cur].count += 1;
        }

        return {
            receivables: processed,
            totalsByCurrency,
            totalCount: processed.length,
        };
    }

    static async createReceivable(data: {
        debtor: string;
        source?: string; // RENT, PROJECT_PAYMENT, SERVICE_FEE, SPONSORSHIP, EVENT, OTHER
        description?: string;
        amount: number;
        currency?: string;
        dueDate: Date | string;
        paid?: number;
        exchangeRate?: number;
        exchangeRateDate?: Date | string;
        sourceCurrency?: string;
        targetCurrency?: string;
        baseCurrencyAmount?: number;
        invoiceNumber?: string;
        documentUrl?: string;
        notes?: string;
        relatedProjectId?: string;
        relatedEntrepreneurId?: string;
        relatedOrganizationId?: string;
    }, actorId?: string) {
        const amount = Number(data.amount);
        const paid = data.paid !== undefined ? Number(data.paid) : 0;
        const remaining = Math.max(0, amount - paid);

        let initialStatus = 'PENDING';
        if (paid >= amount) {
            initialStatus = 'PAID';
        } else if (paid > 0) {
            initialStatus = 'PARTIALLY_PAID';
        } else {
            const dueDateObj = new Date(data.dueDate);
            if (new Date() > dueDateObj) {
                initialStatus = 'OVERDUE';
            }
        }

        const receivable = await prisma.receivable.create({
            data: {
                debtor: data.debtor,
                source: data.source || 'OTHER',
                description: data.description || null,
                amount,
                currency: data.currency || 'TRY',
                dueDate: new Date(data.dueDate),
                paid,
                remaining,
                status: initialStatus,
                exchangeRate: data.exchangeRate ? Number(data.exchangeRate) : null,
                exchangeRateDate: data.exchangeRateDate ? new Date(data.exchangeRateDate) : null,
                sourceCurrency: data.sourceCurrency || null,
                targetCurrency: data.targetCurrency || 'TRY',
                baseCurrencyAmount: data.baseCurrencyAmount ? Number(data.baseCurrencyAmount) : data.exchangeRate ? amount * Number(data.exchangeRate) : null,
                invoiceNumber: data.invoiceNumber || null,
                documentUrl: data.documentUrl || null,
                notes: data.notes || null,
                relatedProjectId: data.relatedProjectId || null,
                relatedEntrepreneurId: data.relatedEntrepreneurId || null,
                relatedOrganizationId: data.relatedOrganizationId || null,
                createdById: actorId || null,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'Receivable',
            entityId: receivable.id,
            newValues: {
                debtor: receivable.debtor,
                source: receivable.source,
                amount: receivable.amount,
                currency: receivable.currency,
            },
        });

        return receivable;
    }

    static async updateReceivable(id: string, data: any, actorId?: string) {
        const existing = await prisma.receivable.findUnique({ where: { id } });
        if (!existing) throw new Error('Alacak kaydı bulunamadı');

        const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
        const paid = data.paid !== undefined ? Number(data.paid) : existing.paid;
        const remaining = Math.max(0, amount - paid);

        let status = data.status || existing.status;
        if (data.paid !== undefined || data.amount !== undefined) {
            if (paid >= amount) {
                status = 'PAID';
            } else if (paid > 0) {
                status = 'PARTIALLY_PAID';
            } else if (new Date() > new Date(data.dueDate || existing.dueDate)) {
                status = 'OVERDUE';
            } else {
                status = 'PENDING';
            }
        }

        const updated = await prisma.receivable.update({
            where: { id },
            data: {
                debtor: data.debtor !== undefined ? data.debtor : undefined,
                source: data.source !== undefined ? data.source : undefined,
                description: data.description !== undefined ? data.description : undefined,
                amount,
                currency: data.currency !== undefined ? data.currency : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                paid,
                remaining,
                status,
                exchangeRate: data.exchangeRate !== undefined ? (data.exchangeRate ? Number(data.exchangeRate) : null) : undefined,
                exchangeRateDate: data.exchangeRateDate ? new Date(data.exchangeRateDate) : undefined,
                invoiceNumber: data.invoiceNumber !== undefined ? data.invoiceNumber : undefined,
                documentUrl: data.documentUrl !== undefined ? data.documentUrl : undefined,
                notes: data.notes !== undefined ? data.notes : undefined,
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
                paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : undefined,
                bankReceiptNo: data.bankReceiptNo !== undefined ? data.bankReceiptNo : undefined,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'Receivable',
            entityId: id,
            oldValues: { amount: existing.amount, paid: existing.paid, status: existing.status },
            newValues: { amount: updated.amount, paid: updated.paid, status: updated.status },
        });

        return updated;
    }

    static async recordPayment(id: string, data: {
        paymentAmount: number;
        paymentDate?: Date | string;
        paymentMethod?: string;
        bankReceiptNo?: string;
        notes?: string;
    }, actorId?: string) {
        const existing = await prisma.receivable.findUnique({ where: { id } });
        if (!existing) throw new Error('Alacak kaydı bulunamadı');

        const newPaid = existing.paid + Number(data.paymentAmount);
        const newRemaining = Math.max(0, existing.amount - newPaid);
        const status = newPaid >= existing.amount ? 'PAID' : 'PARTIALLY_PAID';

        const updated = await prisma.receivable.update({
            where: { id },
            data: {
                paid: newPaid,
                remaining: newRemaining,
                status,
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
                paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
                bankReceiptNo: data.bankReceiptNo || null,
                notes: data.notes ? `${existing.notes || ''}\n[Tahsilat]: ${data.notes}`.trim() : existing.notes,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'ReceivablePayment',
            entityId: id,
            newValues: {
                paidAmount: data.paymentAmount,
                totalPaid: newPaid,
                remaining: newRemaining,
                status,
            },
        });

        return updated;
    }

    static async deleteReceivable(id: string, actorId?: string) {
        const existing = await prisma.receivable.findUnique({ where: { id } });
        if (!existing) throw new Error('Alacak kaydı bulunamadı');

        await prisma.receivable.delete({ where: { id } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'Receivable',
            entityId: id,
            oldValues: { debtor: existing.debtor, amount: existing.amount },
        });

        return { success: true };
    }
}
