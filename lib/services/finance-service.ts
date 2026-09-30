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

    static async getComprehensiveFinanceReport(filters?: {
        startDate?: Date | string;
        endDate?: Date | string;
        projectId?: string;
        currency?: string;
        category?: string;
        fundingSourceId?: string;
    }) {
        const whereProject: any = {};
        if (filters?.projectId && filters.projectId !== 'ALL') {
            whereProject.id = filters.projectId;
        }

        const projects = await prisma.project.findMany({
            where: whereProject,
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
                    orderBy: { expenseDate: 'asc' },
                },
                invoices: {
                    orderBy: { invoiceDate: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const start = filters?.startDate ? new Date(filters.startDate) : null;
        const end = filters?.endDate ? new Date(filters.endDate) : null;

        // Currencies accumulator
        const totalsByCurrency: Record<string, {
            currency: string;
            totalBudget: number;
            awardedFunding: number;
            receivedFunding: number;
            expectedFunding: number;
            outstandingFunding: number;
            spentExpenses: number;
            committedExpenses: number;
            paidExpenses: number;
            pendingPayments: number;
            remainingBudget: number;
            availableCash: number;
            utilizationRate: number;
        }> = {};

        const getOrCreateCurrency = (cur: string = 'TRY') => {
            if (!totalsByCurrency[cur]) {
                totalsByCurrency[cur] = {
                    currency: cur,
                    totalBudget: 0,
                    awardedFunding: 0,
                    receivedFunding: 0,
                    expectedFunding: 0,
                    outstandingFunding: 0,
                    spentExpenses: 0,
                    committedExpenses: 0,
                    paidExpenses: 0,
                    pendingPayments: 0,
                    remainingBudget: 0,
                    availableCash: 0,
                    utilizationRate: 0,
                };
            }
            return totalsByCurrency[cur];
        };

        const projectSummaries: any[] = [];
        const monthlyCashFlowMap: Record<string, {
            monthKey: string;
            monthLabel: string;
            inflow: Record<string, number>;
            outflow: Record<string, number>;
            net: Record<string, number>;
        }> = {};

        const categoryBreakdownMap: Record<string, {
            category: string;
            label: string;
            amountByCurrency: Record<string, number>;
            count: number;
        }> = {};

        const fundingSourceMap: Record<string, {
            id: string;
            organizationName: string;
            programGrantName: string;
            awardedByCurrency: Record<string, number>;
            receivedByCurrency: Record<string, number>;
            spentByCurrency: Record<string, number>;
        }> = {};

        const missingDocuments: any[] = [];

        const categoryLabels: Record<string, string> = {
            PERSONNEL: 'Personel & Danışmanlık',
            SOFTWARE: 'Yazılım & Lisanslar',
            HARDWARE: 'Donanım & Teçhizat',
            TRAINING: 'Eğitim & Mentorluk',
            EVENT: 'Etkinlik & Tanıtım',
            CONSULTING: 'Danışmanlık & Hizmet',
            TRAVEL: 'Seyahat & Konaklama',
            ACCOMMODATION: 'Konaklama',
            OFFICE: 'Ofis & Ortak Alan',
            SUPPLIES: 'Sarf Malzeme',
            SERVICE_PURCHASE: 'Hizmet Alımı',
            OTHER: 'Diğer / Genel Giderler',
        };

        for (const project of projects) {
            const pCur = project.currency || 'TRY';
            const curBucket = getOrCreateCurrency(pCur);

            const budgetLinesAllocated = project.budgetLines.reduce((acc, bl) => acc + bl.allocatedAmount, 0);
            const projectBudget = project.budgetAmount && project.budgetAmount > 0 ? project.budgetAmount : budgetLinesAllocated;
            curBucket.totalBudget += projectBudget;

            let pAwarded = 0;
            let pReceived = 0;
            let pExpected = 0;

            for (const fs of project.fundingSources) {
                const fsCur = fs.currency || pCur;
                const fsCurBucket = getOrCreateCurrency(fsCur);
                fsCurBucket.awardedFunding += fs.awardedAmount;
                pAwarded += fs.awardedAmount;

                const fsKey = `${fs.organizationName} - ${fs.programGrantName}`;
                if (!fundingSourceMap[fsKey]) {
                    fundingSourceMap[fsKey] = {
                        id: fs.id,
                        organizationName: fs.organizationName,
                        programGrantName: fs.programGrantName,
                        awardedByCurrency: {},
                        receivedByCurrency: {},
                        spentByCurrency: {},
                    };
                }
                fundingSourceMap[fsKey].awardedByCurrency[fsCur] = (fundingSourceMap[fsKey].awardedByCurrency[fsCur] || 0) + fs.awardedAmount;

                for (const r of fs.receipts) {
                    const rCur = r.currency || fsCur;
                    const rCurBucket = getOrCreateCurrency(rCur);

                    if (r.status === 'RECEIVED') {
                        rCurBucket.receivedFunding += r.amount;
                        pReceived += r.amount;
                        fundingSourceMap[fsKey].receivedByCurrency[rCur] = (fundingSourceMap[fsKey].receivedByCurrency[rCur] || 0) + r.amount;

                        // Monthly Cash Flow - Inflow
                        const dateToUse = r.receivedDate || r.expectedDate;
                        if (!start || !end || (dateToUse >= start && dateToUse <= end)) {
                            const d = new Date(dateToUse);
                            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            const mLabel = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
                            if (!monthlyCashFlowMap[mKey]) {
                                monthlyCashFlowMap[mKey] = { monthKey: mKey, monthLabel: mLabel, inflow: {}, outflow: {}, net: {} };
                            }
                            monthlyCashFlowMap[mKey].inflow[rCur] = (monthlyCashFlowMap[mKey].inflow[rCur] || 0) + r.amount;
                        }
                    } else if (r.status === 'EXPECTED' || r.status === 'DELAYED') {
                        rCurBucket.expectedFunding += r.amount;
                        pExpected += r.amount;
                    }
                }
            }

            let pSpent = 0;
            let pCommitted = 0;
            let pPaid = 0;

            const budgetLinesSummary = project.budgetLines.map(bl => {
                let blSpent = 0;
                let blCommitted = 0;
                let blPaid = 0;

                for (const exp of bl.expenses) {
                    if (exp.paymentStatus !== 'REJECTED' && exp.paymentStatus !== 'CANCELLED') {
                        blSpent += exp.totalAmount;
                        if (exp.paymentStatus === 'PAID') {
                            blPaid += exp.totalAmount;
                        } else {
                            blCommitted += exp.totalAmount;
                        }
                    }
                }

                const blRemaining = Math.max(0, bl.allocatedAmount - blSpent);
                const blUtil = bl.allocatedAmount > 0 ? (blSpent / bl.allocatedAmount) * 100 : 0;

                return {
                    id: bl.id,
                    code: bl.code || '-',
                    title: bl.title,
                    category: bl.category,
                    categoryLabel: categoryLabels[bl.category] || bl.category,
                    allocated: bl.allocatedAmount,
                    committed: blCommitted,
                    spent: blSpent,
                    paid: blPaid,
                    remaining: blRemaining,
                    utilizationRate: Number(blUtil.toFixed(1)),
                    currency: bl.currency || pCur,
                };
            });

            for (const exp of project.expenses) {
                if (exp.paymentStatus === 'REJECTED' || exp.paymentStatus === 'CANCELLED') continue;

                // Date filter check on expense
                if (start && exp.expenseDate < start) continue;
                if (end && exp.expenseDate > end) continue;

                const eCur = exp.currency || pCur;
                const eCurBucket = getOrCreateCurrency(eCur);

                eCurBucket.spentExpenses += exp.totalAmount;
                pSpent += exp.totalAmount;

                if (exp.paymentStatus === 'PAID') {
                    eCurBucket.paidExpenses += exp.totalAmount;
                    pPaid += exp.totalAmount;

                    // Monthly Cash Flow - Outflow
                    const pDate = exp.paymentDate || exp.expenseDate;
                    const d = new Date(pDate);
                    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const mLabel = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
                    if (!monthlyCashFlowMap[mKey]) {
                        monthlyCashFlowMap[mKey] = { monthKey: mKey, monthLabel: mLabel, inflow: {}, outflow: {}, net: {} };
                    }
                    monthlyCashFlowMap[mKey].outflow[eCur] = (monthlyCashFlowMap[mKey].outflow[eCur] || 0) + exp.totalAmount;
                } else {
                    eCurBucket.committedExpenses += exp.totalAmount;
                    eCurBucket.pendingPayments += exp.totalAmount;
                    pCommitted += exp.totalAmount;
                }

                // Category breakdown
                const cat = exp.category || 'OTHER';
                if (!categoryBreakdownMap[cat]) {
                    categoryBreakdownMap[cat] = {
                        category: cat,
                        label: categoryLabels[cat] || cat,
                        amountByCurrency: {},
                        count: 0,
                    };
                }
                categoryBreakdownMap[cat].amountByCurrency[eCur] = (categoryBreakdownMap[cat].amountByCurrency[eCur] || 0) + exp.totalAmount;
                categoryBreakdownMap[cat].count += 1;

                // Check missing documents
                const missingItems: string[] = [];
                if (!exp.invoiceDocUrl && !exp.receiptDocUrl) missingItems.push('Fatura / Fiş Belgesi Eksik');
                if (!exp.invoiceNumber && exp.totalAmount > 500) missingItems.push('Fatura No Girilmemiş');
                if (exp.paymentStatus === 'PAID' && !exp.paymentDate) missingItems.push('Ödeme Tarihi Eksik');

                if (missingItems.length > 0) {
                    missingDocuments.push({
                        id: exp.id,
                        type: 'EXPENSE',
                        vendor: exp.supplierVendor,
                        description: exp.description,
                        projectTitle: project.title,
                        amount: exp.totalAmount,
                        currency: eCur,
                        paymentStatus: exp.paymentStatus,
                        date: exp.expenseDate,
                        missingItems,
                    });
                }
            }

            const pRemaining = Math.max(0, projectBudget - pSpent);
            const pAvailableCash = pReceived - pPaid;
            const pUtil = projectBudget > 0 ? (pSpent / projectBudget) * 100 : 0;

            projectSummaries.push({
                projectId: project.id,
                projectTitle: project.title,
                projectCode: project.code || '-',
                currency: pCur,
                totalBudget: projectBudget,
                awardedFunding: pAwarded,
                receivedFunding: pReceived,
                expectedFunding: pExpected,
                outstandingFunding: Math.max(0, pAwarded - pReceived),
                spent: pSpent,
                committed: pCommitted,
                paid: pPaid,
                pendingPayment: pCommitted,
                remainingBudget: pRemaining,
                availableCash: pAvailableCash,
                utilizationRate: Number(pUtil.toFixed(1)),
                budgetLines: budgetLinesSummary,
            });
        }

        // Finalize currency totals
        for (const cur of Object.keys(totalsByCurrency)) {
            const b = totalsByCurrency[cur];
            b.outstandingFunding = Math.max(0, b.awardedFunding - b.receivedFunding);
            b.remainingBudget = Math.max(0, b.totalBudget - b.spentExpenses);
            b.availableCash = b.receivedFunding - b.paidExpenses;
            b.utilizationRate = b.totalBudget > 0 ? Number(((b.spentExpenses / b.totalBudget) * 100).toFixed(1)) : 0;
        }

        // Finalize Cash Flow
        const sortedCashFlow = Object.values(monthlyCashFlowMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
        for (const cf of sortedCashFlow) {
            const allCurs = new Set([...Object.keys(cf.inflow), ...Object.keys(cf.outflow)]);
            for (const c of allCurs) {
                const inf = cf.inflow[c] || 0;
                const outf = cf.outflow[c] || 0;
                cf.net[c] = inf - outf;
            }
        }

        // Fetch Exchange Rates
        const exchangeRates = await prisma.exchangeRate.findMany({
            orderBy: { rateDate: 'desc' },
            take: 20,
        });

        return {
            totalsByCurrency,
            budgetVsActual: projectSummaries.map(p => ({
                projectId: p.projectId,
                title: p.projectTitle,
                code: p.projectCode,
                currency: p.currency,
                budget: p.totalBudget,
                spent: p.spent,
                paid: p.paid,
                committed: p.committed,
                remaining: p.remainingBudget,
                utilizationRate: p.utilizationRate,
            })),
            monthlyCashFlow: sortedCashFlow,
            expenseByCategory: Object.values(categoryBreakdownMap).sort((a, b) => {
                const sumA = Object.values(a.amountByCurrency).reduce((x, y) => x + y, 0);
                const sumB = Object.values(b.amountByCurrency).reduce((x, y) => x + y, 0);
                return sumB - sumA;
            }),
            fundingSourcesBreakdown: Object.values(fundingSourceMap),
            projectFinancialSummaries: projectSummaries,
            missingDocuments,
            exchangeRates,
            meta: {
                totalProjects: projects.length,
                generatedAt: new Date().toISOString(),
                filtersApplied: filters || {},
            }
        };
    }

    static async getInvoiceRegister(filters?: {
        startDate?: Date | string;
        endDate?: Date | string;
        projectId?: string;
        vendorName?: string;
        paymentStatus?: string;
        currency?: string;
        documentStatus?: string;
        search?: string;
    }) {
        const where: any = {};

        if (filters?.projectId && filters.projectId !== 'ALL') {
            where.projectId = filters.projectId;
        }
        if (filters?.vendorName) {
            where.vendorName = { contains: filters.vendorName, mode: 'insensitive' };
        }
        if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
            where.status = filters.paymentStatus;
        }
        if (filters?.currency && filters.currency !== 'ALL') {
            where.currency = filters.currency;
        }
        if (filters?.startDate || filters?.endDate) {
            where.invoiceDate = {};
            if (filters?.startDate) where.invoiceDate.gte = new Date(filters.startDate);
            if (filters?.endDate) where.invoiceDate.lte = new Date(filters.endDate);
        }
        if (filters?.search) {
            where.OR = [
                { vendorName: { contains: filters.search, mode: 'insensitive' } },
                { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
                { notes: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const invoices = await prisma.invoiceRecord.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        code: true,
                    },
                },
                expense: {
                    include: {
                        fundingSource: {
                            select: {
                                id: true,
                                organizationName: true,
                                programGrantName: true,
                            },
                        },
                        budgetLine: {
                            select: {
                                id: true,
                                title: true,
                                code: true,
                            },
                        },
                    },
                },
                entrepreneur: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { invoiceDate: 'desc' },
        });

        // Filter documentStatus if requested (HAS_DOCUMENT, MISSING_DOCUMENT)
        let filteredInvoices = invoices;
        if (filters?.documentStatus === 'HAS_DOCUMENT') {
            filteredInvoices = invoices.filter(inv => !!inv.documentUrl);
        } else if (filters?.documentStatus === 'MISSING_DOCUMENT') {
            filteredInvoices = invoices.filter(inv => !inv.documentUrl);
        }

        // Totals per currency
        const totalsByCurrency: Record<string, { net: number; vat: number; gross: number; count: number }> = {};
        for (const inv of filteredInvoices) {
            const cur = inv.currency || 'TRY';
            if (!totalsByCurrency[cur]) {
                totalsByCurrency[cur] = { net: 0, vat: 0, gross: 0, count: 0 };
            }
            totalsByCurrency[cur].net += inv.netAmount;
            totalsByCurrency[cur].vat += inv.taxVatAmount;
            totalsByCurrency[cur].gross += inv.grossAmount;
            totalsByCurrency[cur].count += 1;
        }

        return {
            invoices: filteredInvoices.map(inv => ({
                id: inv.id,
                expenseId: inv.expenseId,
                supplier: inv.vendorName,
                invoiceNo: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                projectTitle: inv.project?.title || '-',
                projectCode: inv.project?.code || '-',
                fundingSource: inv.expense?.fundingSource ? `${inv.expense.fundingSource.organizationName} - ${inv.expense.fundingSource.programGrantName}` : '-',
                budgetLine: inv.expense?.budgetLine?.title || '-',
                net: inv.netAmount,
                VAT: inv.taxVatAmount,
                gross: inv.grossAmount,
                currency: inv.currency,
                paymentStatus: inv.status,
                paymentDate: inv.paymentDate,
                documentUrl: inv.documentUrl,
                documentStatus: inv.documentUrl ? 'HAS_DOCUMENT' : 'MISSING_DOCUMENT',
                notes: inv.notes,
            })),
            totalsByCurrency,
            totalCount: filteredInvoices.length,
        };
    }
}

