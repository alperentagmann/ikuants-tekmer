import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class FinanceService {
    static async getProjectFinanceLedger(projectId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                fundingSources: {
                    include: {
                        receipts: true,
                    },
                },
                budgetLines: {
                    include: {
                        expenses: true,
                    },
                },
                expenses: {
                    include: {
                        fundingSource: true,
                        budgetLine: true,
                        invoices: true,
                    },
                    orderBy: { expenseDate: 'desc' },
                },
                invoices: {
                    orderBy: { invoiceDate: 'desc' },
                },
            },
        });

        if (!project) throw new Error('Proje bulunamadı');

        // Total Approved Budget (From Project or Sum of Budget Lines)
        const budgetLinesAllocated = project.budgetLines.reduce((acc, line) => acc + line.allocatedAmount, 0);
        const totalApprovedBudget = project.budgetAmount && project.budgetAmount > 0 ? project.budgetAmount : budgetLinesAllocated;

        // Total Awarded Funding
        const totalAwardedFunding = project.fundingSources.reduce((acc, fs) => acc + fs.awardedAmount, 0);

        // Received Funding vs Expected Funding
        let totalReceivedFunding = 0;
        let totalExpectedFunding = 0;

        for (const fs of project.fundingSources) {
            for (const r of fs.receipts) {
                if (r.status === 'RECEIVED') {
                    totalReceivedFunding += r.amount;
                } else if (r.status === 'EXPECTED' || r.status === 'DELAYED') {
                    totalExpectedFunding += r.amount;
                }
            }
        }

        // Project Expenses breakdown:
        // SPENT: Total amount of all confirmed / approved / paid expenses
        // PAID: Total amount of expenses marked as PAID
        // COMMITTED: Total amount of expenses submitted / approved but not yet marked PAID (pending payment)
        let totalSpent = 0;
        let totalPaid = 0;
        let totalCommitted = 0;

        for (const exp of project.expenses) {
            if (exp.paymentStatus !== 'REJECTED' && exp.paymentStatus !== 'CANCELLED') {
                totalSpent += exp.totalAmount;
                if (exp.paymentStatus === 'PAID') {
                    totalPaid += exp.totalAmount;
                } else {
                    totalCommitted += exp.totalAmount;
                }
            }
        }

        // Remaining Budget: Approved Budget - Total Spent
        const remainingBudget = Math.max(0, totalApprovedBudget - totalSpent);

        // Available Cash: Received Funding - Total Paid
        const availableCash = totalReceivedFunding - totalPaid;

        // Budget Usage Ratio
        const budgetUsageRate = totalApprovedBudget > 0 ? (totalSpent / totalApprovedBudget) * 100 : 0;

        return {
            projectId: project.id,
            projectTitle: project.title,
            projectCode: project.code,
            currency: project.currency || 'TRY',
            totalApprovedBudget,
            totalAwardedFunding,
            totalReceivedFunding,
            totalExpectedFunding,
            unreceivedFunding: Math.max(0, totalAwardedFunding - totalReceivedFunding),
            totalSpent,
            totalCommitted,
            totalPaid,
            pendingPayment: totalCommitted,
            remainingBudget,
            availableCash,
            budgetUsageRate: Number(budgetUsageRate.toFixed(1)),
            fundingSources: project.fundingSources,
            budgetLines: project.budgetLines,
            expenses: project.expenses,
            invoices: project.invoices,
        };
    }

    static async addFundingSource(projectId: string, data: {
        organizationName: string;
        programGrantName: string;
        awardedAmount: number;
        currency?: string;
        agreementNo?: string;
        agreementDate?: Date | string;
        expectedStartDate?: Date | string;
        expectedEndDate?: Date | string;
        description?: string;
        documentUrl?: string;
    }, actorId?: string) {
        const source = await prisma.fundingSource.create({
            data: {
                projectId,
                organizationName: data.organizationName,
                programGrantName: data.programGrantName,
                awardedAmount: Number(data.awardedAmount),
                currency: data.currency || 'TRY',
                agreementNo: data.agreementNo || null,
                agreementDate: data.agreementDate ? new Date(data.agreementDate) : null,
                expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
                expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
                description: data.description || null,
                documentUrl: data.documentUrl || null,
                status: 'ACTIVE',
                createdById: actorId || null,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'FundingSource',
            entityId: source.id,
            newValues: { organization: source.organizationName, amount: source.awardedAmount },
        });

        return source;
    }

    static async addFundingReceipt(fundingSourceId: string, data: {
        installmentNo?: string;
        amount: number;
        currency?: string;
        expectedDate: Date | string;
        receivedDate?: Date | string | null;
        status?: string;
        bankReferenceNo?: string;
        description?: string;
        receiptDocUrl?: string;
    }, actorId?: string) {
        const receipt = await prisma.fundingReceipt.create({
            data: {
                fundingSourceId,
                installmentNo: data.installmentNo || null,
                amount: Number(data.amount),
                currency: data.currency || 'TRY',
                expectedDate: new Date(data.expectedDate),
                receivedDate: data.receivedDate ? new Date(data.receivedDate) : data.status === 'RECEIVED' ? new Date() : null,
                status: data.status || 'EXPECTED',
                bankReferenceNo: data.bankReferenceNo || null,
                description: data.description || null,
                receiptDocUrl: data.receiptDocUrl || null,
                receivedById: actorId || null,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'FundingReceipt',
            entityId: receipt.id,
            newValues: { amount: receipt.amount, status: receipt.status },
        });

        return receipt;
    }

    static async createBudgetLine(projectId: string, data: {
        code?: string;
        title: string;
        category?: string;
        allocatedAmount: number;
        currency?: string;
        notes?: string;
    }, actorId?: string) {
        const budgetLine = await prisma.projectBudgetLine.create({
            data: {
                projectId,
                code: data.code || null,
                title: data.title,
                category: data.category || 'PERSONNEL',
                allocatedAmount: Number(data.allocatedAmount),
                currency: data.currency || 'TRY',
                notes: data.notes || null,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'ProjectBudgetLine',
            entityId: budgetLine.id,
            newValues: { title: budgetLine.title, amount: budgetLine.allocatedAmount },
        });

        return budgetLine;
    }

    static async addProjectExpense(projectId: string, data: {
        fundingSourceId?: string;
        budgetLineId?: string;
        expenseDate?: Date | string;
        category?: string;
        supplierVendor: string;
        description: string;
        amount: number; // net
        vatAmount?: number;
        totalAmount?: number; // gross
        currency?: string;
        paymentStatus?: string;
        paymentDate?: Date | string | null;
        paymentMethod?: string;
        invoiceNumber?: string;
        invoiceDate?: Date | string | null;
        invoiceDocUrl?: string;
        receiptDocUrl?: string;
        notes?: string;
    }, actorId?: string) {
        const net = Number(data.amount);
        const vat = data.vatAmount !== undefined ? Number(data.vatAmount) : 0;
        const total = data.totalAmount !== undefined ? Number(data.totalAmount) : net + vat;

        // Prevent duplicate invoice entry if vendor + invoiceNumber given
        if (data.supplierVendor && data.invoiceNumber) {
            const existing = await prisma.projectExpense.findFirst({
                where: {
                    supplierVendor: data.supplierVendor,
                    invoiceNumber: data.invoiceNumber,
                    projectId,
                },
            });
            if (existing) {
                throw new Error(`Bu tedarikçi (${data.supplierVendor}) ve fatura numarası (${data.invoiceNumber}) ile daha önce bir harcama kaydedilmiş.`);
            }
        }

        const expense = await prisma.projectExpense.create({
            data: {
                projectId,
                fundingSourceId: data.fundingSourceId || null,
                budgetLineId: data.budgetLineId || null,
                expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
                category: data.category || 'OTHER',
                supplierVendor: data.supplierVendor,
                description: data.description,
                amount: net,
                vatAmount: vat,
                totalAmount: total,
                currency: data.currency || 'TRY',
                paymentStatus: data.paymentStatus || 'PENDING',
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
                paymentMethod: data.paymentMethod || null,
                invoiceNumber: data.invoiceNumber || null,
                invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
                invoiceDocUrl: data.invoiceDocUrl || null,
                receiptDocUrl: data.receiptDocUrl || null,
                notes: data.notes || null,
                createdById: actorId || null,
            },
        });

        // Automatically create InvoiceRecord if invoice details provided
        if (data.invoiceNumber) {
            await prisma.invoiceRecord.create({
                data: {
                    expenseId: expense.id,
                    projectId,
                    vendorName: data.supplierVendor,
                    invoiceNumber: data.invoiceNumber,
                    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
                    netAmount: net,
                    taxVatAmount: vat,
                    grossAmount: total,
                    currency: data.currency || 'TRY',
                    status: expense.paymentStatus === 'PAID' ? 'PAID' : 'RECORDED',
                    paymentDate: expense.paymentDate,
                    documentUrl: data.invoiceDocUrl || null,
                    createdById: actorId || null,
                },
            });
        }

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'ProjectExpense',
            entityId: expense.id,
            newValues: {
                vendor: expense.supplierVendor,
                totalAmount: expense.totalAmount,
                status: expense.paymentStatus,
            },
        });

        return expense;
    }

    static async updateExpenseStatus(expenseId: string, status: string, actorId?: string) {
        const existing = await prisma.projectExpense.findUnique({ where: { id: expenseId } });
        if (!existing) throw new Error('Harcama kaydı bulunamadı');

        const updateData: any = { paymentStatus: status };
        if (status === 'PAID' && !existing.paymentDate) {
            updateData.paymentDate = new Date();
        }
        if (status === 'APPROVED') {
            updateData.approvedById = actorId || null;
            updateData.approvedAt = new Date();
        }

        const updated = await prisma.projectExpense.update({
            where: { id: expenseId },
            data: updateData,
        });

        // Update corresponding invoice if exists
        await prisma.invoiceRecord.updateMany({
            where: { expenseId },
            data: { status: status === 'PAID' ? 'PAID' : status === 'APPROVED' ? 'APPROVED' : 'RECORDED' },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'ProjectExpense',
            entityId: expenseId,
            oldValues: { paymentStatus: existing.paymentStatus },
            newValues: { paymentStatus: updated.paymentStatus },
        });

        return updated;
    }

    static async getGeneralFinanceDashboard() {
        const projects = await prisma.project.findMany({
            include: {
                fundingSources: { include: { receipts: true } },
                expenses: true,
            },
        });

        let totalBudgetAllProjects = 0;
        let totalReceivedAllProjects = 0;
        let totalSpentAllProjects = 0;
        let totalPaidAllProjects = 0;
        let totalCommittedAllProjects = 0;

        for (const p of projects) {
            totalBudgetAllProjects += p.budgetAmount || 0;
            for (const fs of p.fundingSources) {
                for (const r of fs.receipts) {
                    if (r.status === 'RECEIVED') {
                        totalReceivedAllProjects += r.amount;
                    }
                }
            }
            for (const exp of p.expenses) {
                if (exp.paymentStatus !== 'REJECTED' && exp.paymentStatus !== 'CANCELLED') {
                    totalSpentAllProjects += exp.totalAmount;
                    if (exp.paymentStatus === 'PAID') {
                        totalPaidAllProjects += exp.totalAmount;
                    } else {
                        totalCommittedAllProjects += exp.totalAmount;
                    }
                }
            }
        }

        // Recent Invoices
        const recentInvoices = await prisma.invoiceRecord.findMany({
            take: 5,
            orderBy: { invoiceDate: 'desc' },
            include: {
                project: { select: { title: true } },
                entrepreneur: { select: { name: true } },
            },
        });

        // Recent Expenses
        const recentExpenses = await prisma.projectExpense.findMany({
            take: 5,
            orderBy: { expenseDate: 'desc' },
            include: {
                project: { select: { title: true } },
            },
        });

        return {
            totalBudgetAllProjects,
            totalReceivedAllProjects,
            totalSpentAllProjects,
            totalPaidAllProjects,
            totalCommittedAllProjects,
            availableCashAllProjects: totalReceivedAllProjects - totalPaidAllProjects,
            remainingBudgetAllProjects: Math.max(0, totalBudgetAllProjects - totalSpentAllProjects),
            projectsCount: projects.length,
            recentInvoices,
            recentExpenses,
        };
    }
}
