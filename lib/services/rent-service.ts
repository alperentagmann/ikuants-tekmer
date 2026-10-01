import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class RentService {
    static async getRentContracts(filters?: { entrepreneurId?: string; status?: string }) {
        const where: any = {};
        if (filters?.entrepreneurId) where.entrepreneurId = filters.entrepreneurId;
        if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

        return prisma.rentContract.findMany({
            where,
            include: {
                entrepreneur: { select: { id: true, name: true, logoUrl: true, sector: true, email: true, phone: true } },
                facility: { select: { id: true, title: true, facilityType: true } },
                documents: { orderBy: { uploadedAt: 'desc' } },
                accruals: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 3 },
            },
            orderBy: [{ startDate: 'desc' }],
        });
    }

    static async createRentContract(data: {
        entrepreneurId: string;
        spaceFacilityId?: string;
        spaceName: string;
        roomDeskNo?: string;
        areaM2?: number;
        spaceType?: string;
        contractNo: string;
        contractDate?: Date | string;
        startDate: Date | string;
        endDate: Date | string;
        commercialTitle?: string;
        contactPersonName?: string;
        contactEmail?: string;
        contactPhone?: string;
        monthlyRent: number;
        currency?: string;
        vatRate?: number;
        dueDay?: number;
        depositAmount?: number;
        isWaived?: boolean;
        freePeriodStart?: Date | string | null;
        freePeriodEnd?: Date | string | null;
        waiverReason?: string;
        autoRenew?: boolean;
        renewalNoticeDays?: number;
        contractDocUrl?: string;
        notes?: string;
    }, actorId?: string) {
        const netRent = Number(data.monthlyRent) || 0;
        const vatRate = data.vatRate !== undefined ? Number(data.vatRate) : 20;
        const vatAmount = (netRent * vatRate) / 100;
        const totalMonthlyRent = netRent + vatAmount;

        const contract = await prisma.rentContract.create({
            data: {
                entrepreneurId: data.entrepreneurId,
                spaceFacilityId: data.spaceFacilityId || null,
                spaceName: data.spaceName,
                roomDeskNo: data.roomDeskNo || null,
                areaM2: data.areaM2 ? Number(data.areaM2) : null,
                spaceType: data.spaceType || 'OFFICE',
                contractNo: data.contractNo,
                contractDate: data.contractDate ? new Date(data.contractDate) : new Date(),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                commercialTitle: data.commercialTitle || null,
                contactPersonName: data.contactPersonName || null,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                monthlyRent: netRent,
                currency: data.currency || 'TRY',
                vatRate: vatRate,
                vatAmount: vatAmount,
                totalMonthlyRent: totalMonthlyRent,
                dueDay: data.dueDay !== undefined ? Number(data.dueDay) : 5,
                depositAmount: data.depositAmount !== undefined ? Number(data.depositAmount) : 0,
                isWaived: data.isWaived || false,
                freePeriodStart: data.freePeriodStart ? new Date(data.freePeriodStart) : null,
                freePeriodEnd: data.freePeriodEnd ? new Date(data.freePeriodEnd) : null,
                waiverReason: data.waiverReason || null,
                autoRenew: data.autoRenew || false,
                renewalNoticeDays: data.renewalNoticeDays ? Number(data.renewalNoticeDays) : 30,
                status: 'ACTIVE',
                contractDocUrl: data.contractDocUrl || null,
                notes: data.notes || null,
                createdById: actorId || null,
            },
            include: {
                entrepreneur: { select: { name: true } },
                documents: true,
            },
        });

        // If a contractDocUrl was provided during creation, create the initial signed document record
        if (data.contractDocUrl) {
            await prisma.rentContractDocument.create({
                data: {
                    contractId: contract.id,
                    documentType: 'SIGNED_CONTRACT',
                    title: 'İmzalı Kira Sözleşmesi',
                    fileUrl: data.contractDocUrl,
                    documentDate: new Date(data.startDate),
                    uploadedById: actorId || null,
                },
            });
        }

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'RentContract',
            entityId: contract.id,
            newValues: {
                contractNo: contract.contractNo,
                entrepreneur: contract.entrepreneur.name,
                monthlyRent: contract.monthlyRent,
                totalMonthlyRent: contract.totalMonthlyRent,
            },
        });

        return contract;
    }

    static async addContractDocument(contractId: string, data: {
        documentType: string;
        title: string;
        fileUrl: string;
        documentDate?: Date | string;
        description?: string;
        version?: number;
    }, actorId?: string) {
        const contract = await prisma.rentContract.findUnique({
            where: { id: contractId },
            include: { entrepreneur: true },
        });
        if (!contract) throw new Error('Kira sözleşmesi bulunamadı');

        const doc = await prisma.rentContractDocument.create({
            data: {
                contractId,
                documentType: data.documentType || 'SIGNED_CONTRACT',
                title: data.title,
                fileUrl: data.fileUrl,
                documentDate: data.documentDate ? new Date(data.documentDate) : new Date(),
                description: data.description || null,
                version: data.version || 1,
                uploadedById: actorId || null,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'RentContractDocument',
            entityId: doc.id,
            newValues: {
                contractNo: contract.contractNo,
                documentType: doc.documentType,
                title: doc.title,
            },
        });

        return doc;
    }

    static async getContractDocuments(contractId: string) {
        return prisma.rentContractDocument.findMany({
            where: { contractId },
            orderBy: [{ documentDate: 'desc' }, { createdAt: 'desc' }],
        });
    }

    static async deleteContractDocument(documentId: string, actorId?: string) {
        const doc = await prisma.rentContractDocument.findUnique({
            where: { id: documentId },
            include: { contract: true },
        });
        if (!doc) throw new Error('Sözleşme belgesi bulunamadı');

        await prisma.rentContractDocument.delete({ where: { id: documentId } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'RentContractDocument',
            entityId: documentId,
            oldValues: { title: doc.title, contractNo: doc.contract.contractNo },
        });

        return { success: true };
    }

    static async getEntrepreneurRentSummary(entrepreneurId: string) {
        const contracts = await prisma.rentContract.findMany({
            where: { entrepreneurId },
            include: {
                documents: { orderBy: { uploadedAt: 'desc' } },
                accruals: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    include: { payments: { orderBy: { paymentDate: 'desc' } } },
                },
            },
            orderBy: [{ startDate: 'desc' }],
        });

        const activeContract = contracts.find(c => c.status === 'ACTIVE') || contracts[0] || null;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // Current month accrual
        const currentAccrual = activeContract?.accruals.find(a => a.year === currentYear && a.month === currentMonth) || null;

        // Total overdue across all contracts & accruals
        let totalOverdue = 0;
        let totalPaidAllTime = 0;
        let lastPaymentDate: Date | null = null;

        for (const c of contracts) {
            for (const a of c.accruals) {
                if (a.remainingAmount > 0 && a.status !== 'WAIVED' && a.status !== 'CANCELLED') {
                    if (now > a.dueDate) {
                        totalOverdue += a.remainingAmount;
                    }
                }
                totalPaidAllTime += a.paidAmount;
                for (const p of a.payments) {
                    if (!lastPaymentDate || p.paymentDate > lastPaymentDate) {
                        lastPaymentDate = p.paymentDate;
                    }
                }
            }
        }

        // Expiry alert calculation
        let daysUntilExpiry: number | null = null;
        let isExpiringSoon = false;
        if (activeContract) {
            const diffTime = activeContract.endDate.getTime() - now.getTime();
            daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 60 && daysUntilExpiry >= 0) {
                isExpiringSoon = true;
            }
        }

        return {
            hasContract: contracts.length > 0,
            activeContract,
            allContracts: contracts,
            currentMonth: {
                periodLabel: `${currentMonth}/${currentYear}`,
                accrual: currentAccrual,
                status: currentAccrual ? currentAccrual.status : (activeContract ? 'UPCOMING' : 'NO_CONTRACT'),
                dueAmount: currentAccrual ? currentAccrual.totalDue : (activeContract ? activeContract.totalMonthlyRent : 0),
                paidAmount: currentAccrual ? currentAccrual.paidAmount : 0,
                remainingAmount: currentAccrual ? currentAccrual.remainingAmount : 0,
            },
            totalOverdue,
            totalPaidAllTime,
            lastPaymentDate,
            daysUntilExpiry,
            isExpiringSoon,
            currency: activeContract?.currency || 'TRY',
            documentsCount: contracts.reduce((acc, c) => acc + c.documents.length, 0),
        };
    }

    static async updateRentContract(id: string, data: any, actorId?: string) {
        const existing = await prisma.rentContract.findUnique({ where: { id } });
        if (!existing) throw new Error('Kira sözleşmesi bulunamadı');

        const updated = await prisma.rentContract.update({
            where: { id },
            data: {
                spaceName: data.spaceName !== undefined ? data.spaceName : undefined,
                monthlyRent: data.monthlyRent !== undefined ? Number(data.monthlyRent) : undefined,
                vatRate: data.vatRate !== undefined ? Number(data.vatRate) : undefined,
                dueDay: data.dueDay !== undefined ? Number(data.dueDay) : undefined,
                status: data.status !== undefined ? data.status : undefined,
                isWaived: data.isWaived !== undefined ? data.isWaived : undefined,
                notes: data.notes !== undefined ? data.notes : undefined,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'RentContract',
            entityId: id,
            oldValues: { status: existing.status, monthlyRent: existing.monthlyRent },
            newValues: { status: updated.status, monthlyRent: updated.monthlyRent },
        });

        return updated;
    }

    static async generateMonthlyAccruals(year: number, month: number, actorId?: string) {
        const activeContracts = await prisma.rentContract.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: { entrepreneur: true },
        });

        const monthNames = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const periodLabel = `${monthNames[month - 1]} ${year}`;

        const createdAccruals = [];

        for (const contract of activeContracts) {
            // Check if already created
            const existing = await prisma.rentAccrual.findUnique({
                where: {
                    contractId_year_month: {
                        contractId: contract.id,
                        year,
                        month,
                    },
                },
            });

            if (existing) continue;

            const baseAmount = contract.monthlyRent;
            const vatAmount = (baseAmount * contract.vatRate) / 100;
            const totalDue = contract.isWaived ? 0 : baseAmount + vatAmount;

            // Calculate due date (e.g. 5th of that month)
            const dueDate = new Date(year, month - 1, contract.dueDay, 23, 59, 59);

            const now = new Date();
            let initialStatus = 'UPCOMING';
            if (contract.isWaived) {
                initialStatus = 'WAIVED';
            } else if (now > dueDate) {
                initialStatus = 'OVERDUE';
            } else {
                initialStatus = 'DUE';
            }

            const accrual = await prisma.rentAccrual.create({
                data: {
                    contractId: contract.id,
                    entrepreneurId: contract.entrepreneurId,
                    year,
                    month,
                    periodLabel,
                    baseAmount,
                    vatAmount,
                    totalDue,
                    paidAmount: 0,
                    remainingAmount: totalDue,
                    currency: contract.currency,
                    dueDate,
                    status: initialStatus,
                },
            });

            createdAccruals.push(accrual);
        }

        if (createdAccruals.length > 0) {
            await logAuditEvent({
                actorId,
                action: 'CREATE',
                entityType: 'RentAccrualBatch',
                entityId: `${year}-${month}`,
                newValues: { period: periodLabel, count: createdAccruals.length },
            });
        }

        return { periodLabel, count: createdAccruals.length, accruals: createdAccruals };
    }

    static async getRentAccruals(filters?: {
        year?: number;
        month?: number;
        status?: string;
        entrepreneurId?: string;
    }) {
        const where: any = {};
        if (filters?.year) where.year = Number(filters.year);
        if (filters?.month) where.month = Number(filters.month);
        if (filters?.entrepreneurId) where.entrepreneurId = filters.entrepreneurId;
        if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

        const now = new Date();

        const accruals = await prisma.rentAccrual.findMany({
            where,
            include: {
                contract: { select: { contractNo: true, spaceName: true, dueDay: true } },
                entrepreneur: { select: { id: true, name: true, logoUrl: true, email: true, phone: true } },
                payments: { orderBy: { paymentDate: 'desc' } },
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }, { dueDate: 'asc' }],
        });

        // Compute real-time daysOverdue for any unpaid past-due items
        return accruals.map(acc => {
            let daysOverdue = 0;
            let status = acc.status;

            if (acc.remainingAmount > 0 && acc.status !== 'WAIVED' && acc.status !== 'CANCELLED') {
                if (now > acc.dueDate) {
                    const diffTime = Math.abs(now.getTime() - acc.dueDate.getTime());
                    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (status !== 'PARTIALLY_PAID') {
                        status = 'OVERDUE';
                    }
                }
            }

            return {
                ...acc,
                daysOverdue,
                status,
            };
        });
    }

    static async recordRentPayment(accrualId: string, data: {
        amount: number;
        paymentDate?: Date | string;
        paymentMethod?: string;
        bankReceiptNo?: string;
        receiptDocUrl?: string;
        description?: string;
    }, actorId?: string) {
        const accrual = await prisma.rentAccrual.findUnique({
            where: { id: accrualId },
            include: { entrepreneur: true, contract: true },
        });
        if (!accrual) throw new Error('Kira tahakkuk kaydı bulunamadı');

        const paymentAmount = Number(data.amount);
        if (paymentAmount <= 0) throw new Error('Ödeme tutarı 0’dan büyük olmalıdır');

        const payment = await prisma.rentPayment.create({
            data: {
                accrualId,
                entrepreneurId: accrual.entrepreneurId,
                amount: paymentAmount,
                currency: accrual.currency,
                paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
                paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
                bankReceiptNo: data.bankReceiptNo || null,
                receiptDocUrl: data.receiptDocUrl || null,
                description: data.description || null,
                receivedById: actorId || null,
            },
        });

        const newPaidAmount = accrual.paidAmount + paymentAmount;
        const newRemainingAmount = Math.max(0, accrual.totalDue - newPaidAmount);

        let newStatus = 'PAID';
        if (newRemainingAmount === 0) {
            newStatus = 'PAID';
        } else if (newRemainingAmount > 0 && newPaidAmount > 0) {
            newStatus = 'PARTIALLY_PAID';
        } else if (new Date() > accrual.dueDate) {
            newStatus = 'OVERDUE';
        }

        await prisma.rentAccrual.update({
            where: { id: accrualId },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'RentPayment',
            entityId: payment.id,
            newValues: {
                entrepreneur: accrual.entrepreneur.name,
                period: accrual.periodLabel,
                paymentAmount,
                newRemainingAmount,
                status: newStatus,
            },
        });

        return { payment, newPaidAmount, newRemainingAmount, status: newStatus };
    }

    static async getRentDashboardStats() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const allAccruals = await prisma.rentAccrual.findMany({
            include: { entrepreneur: true },
        });

        let thisMonthTotalDue = 0;
        let thisMonthPaid = 0;
        let thisMonthRemaining = 0;
        let totalOverdueAmount = 0;
        let overdueCount = 0;
        const activeContractsCount = await prisma.rentContract.count({ where: { status: 'ACTIVE' } });

        for (const a of allAccruals) {
            if (a.year === currentYear && a.month === currentMonth) {
                thisMonthTotalDue += a.totalDue;
                thisMonthPaid += a.paidAmount;
                thisMonthRemaining += a.remainingAmount;
            }

            if (a.remainingAmount > 0 && a.status !== 'WAIVED' && a.status !== 'CANCELLED') {
                if (now > a.dueDate) {
                    totalOverdueAmount += a.remainingAmount;
                    overdueCount++;
                }
            }
        }

        const collectionRate = thisMonthTotalDue > 0 ? (thisMonthPaid / thisMonthTotalDue) * 100 : 0;

        return {
            currentPeriod: `${currentMonth}/${currentYear}`,
            thisMonthTotalDue,
            thisMonthPaid,
            thisMonthRemaining,
            totalOverdueAmount,
            overdueCount,
            activeContractsCount,
            collectionRate: Number(collectionRate.toFixed(1)),
        };
    }

    static async getReminderRules() {
        let rules = await prisma.rentReminderRule.findMany({
            orderBy: { daysOffset: 'asc' },
        });

        // Seed default rules if none exist
        if (rules.length === 0) {
            await prisma.rentReminderRule.createMany({
                data: [
                    {
                        ruleName: 'Vadeden 3 Gün Önce Nazik Hatırlatma',
                        daysOffset: -3,
                        triggerType: 'BEFORE_DUE',
                        emailSubject: 'Kira Ödeme Hatırlatması — {{period}}',
                        emailTemplateBody: 'Sayın {{companyName}},\n\n{{period}} dönemi ofis kira ödemenizin vadesi 3 gün sonra ({{dueDate}}) dolacaktır. Bilgilerinize sunarız.',
                        isActive: true,
                    },
                    {
                        ruleName: 'Vade Günü Hatırlatması',
                        daysOffset: 0,
                        triggerType: 'ON_DUE',
                        emailSubject: 'Bugün Son Ödeme Günü — {{period}} Kirası',
                        emailTemplateBody: 'Sayın {{companyName}},\n\n{{period}} dönemi ofis kiranızın son ödeme günü bugündür. Toplam Tutar: {{amount}} TL. Kalan: {{remainingAmount}} TL.',
                        isActive: true,
                    },
                    {
                        ruleName: '3 Gün Gecikme Bildirimi',
                        daysOffset: 3,
                        triggerType: 'OVERDUE',
                        emailSubject: 'Gecikmiş Kira Bildirimi — {{period}}',
                        emailTemplateBody: 'Sayın {{companyName}},\n\n{{period}} dönemi kiranız 3 gün gecikmededir. Lütfen en kısa sürede ödeme dekontunuzu iletiniz.',
                        isActive: true,
                    },
                    {
                        ruleName: '7 Gün İkinci Gecikme Uyarısı',
                        daysOffset: 7,
                        triggerType: 'OVERDUE',
                        emailSubject: 'ÖNEMLİ: 2. Gecikme Uyarısı — {{period}}',
                        emailTemplateBody: 'Sayın {{companyName}},\n\n{{period}} dönemi kiranız 7 gündür ödenmemiştir. Yönetim ile iletişime geçiniz.',
                        isActive: true,
                    },
                ],
            });
            rules = await prisma.rentReminderRule.findMany({ orderBy: { daysOffset: 'asc' } });
        }

        return rules;
    }

    static async getRentReminderRules() {
        return this.getReminderRules();
    }

    static async upsertRentReminderRule(data: {
        id?: string;
        ruleName: string;
        daysOffset: number;
        triggerType: string;
        emailSubject: string;
        emailTemplateBody: string;
        isActive?: boolean;
    }, actorId?: string) {
        let rule;
        if (data.id) {
            rule = await prisma.rentReminderRule.update({
                where: { id: data.id },
                data: {
                    ruleName: data.ruleName,
                    daysOffset: data.daysOffset,
                    triggerType: data.triggerType,
                    emailSubject: data.emailSubject,
                    emailTemplateBody: data.emailTemplateBody,
                    isActive: data.isActive ?? true,
                },
            });
        } else {
            rule = await prisma.rentReminderRule.create({
                data: {
                    ruleName: data.ruleName,
                    daysOffset: data.daysOffset,
                    triggerType: data.triggerType,
                    emailSubject: data.emailSubject,
                    emailTemplateBody: data.emailTemplateBody,
                    isActive: data.isActive ?? true,
                },
            });
        }

        await logAuditEvent({
            actorId,
            action: data.id ? 'UPDATE' : 'CREATE',
            entityType: 'RentReminderRule',
            entityId: rule.id,
            newValues: rule,
        });

        return rule;
    }

    static async processRentReminders(actorId?: string) {
        const rules = await this.getReminderRules();
        const activeRules = rules.filter(r => r.isActive);
        const accruals = await this.getRentAccruals({ status: 'ALL' });

        const now = new Date();
        const dispatchedReminders = [];

        for (const acc of accruals) {
            if (acc.remainingAmount <= 0 || acc.status === 'WAIVED' || acc.status === 'CANCELLED') continue;

            const daysDiff = Math.round((now.getTime() - acc.dueDate.getTime()) / (1000 * 60 * 60 * 24));

            for (const rule of activeRules) {
                if (daysDiff === rule.daysOffset) {
                    // Check if a reminder has already been enqueued today for this accrual and rule
                    const existingReminder = await prisma.emailOutbox.findFirst({
                        where: {
                            entityType: 'RentAccrual',
                            entityId: acc.id,
                            templateKey: `RENT_REMINDER_${rule.id}`,
                            createdAt: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            },
                        },
                    });

                    if (existingReminder) continue;

                    // Render template variables
                    const body = rule.emailTemplateBody
                        .replace(/{{companyName}}/g, acc.entrepreneur.name)
                        .replace(/{{period}}/g, acc.periodLabel)
                        .replace(/{{amount}}/g, acc.totalDue.toLocaleString('tr-TR'))
                        .replace(/{{paidAmount}}/g, acc.paidAmount.toLocaleString('tr-TR'))
                        .replace(/{{remainingAmount}}/g, acc.remainingAmount.toLocaleString('tr-TR'))
                        .replace(/{{dueDate}}/g, new Date(acc.dueDate).toLocaleDateString('tr-TR'));

                    const subject = rule.emailSubject
                        .replace(/{{companyName}}/g, acc.entrepreneur.name)
                        .replace(/{{period}}/g, acc.periodLabel);

                    // Add to EmailOutbox simulation
                    await prisma.emailOutbox.create({
                        data: {
                            recipientEmail: acc.entrepreneur.email || 'muhasebe@girisimci.com',
                            recipientName: acc.entrepreneur.name,
                            subject,
                            htmlBody: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
                            textBody: body,
                            templateKey: `RENT_REMINDER_${rule.id}`,
                            status: 'PENDING',
                            entityType: 'RentAccrual',
                            entityId: acc.id,
                        },
                    });

                    // Update last reminder on accrual
                    await prisma.rentAccrual.update({
                        where: { id: acc.id },
                        data: {
                            lastReminderSentAt: now,
                            reminderCount: { increment: 1 },
                        },
                    });

                    dispatchedReminders.push({
                        entrepreneur: acc.entrepreneur.name,
                        period: acc.periodLabel,
                        rule: rule.ruleName,
                    });
                }
            }
        }

        if (dispatchedReminders.length > 0) {
            await logAuditEvent({
                actorId,
                action: 'PROCESS',
                entityType: 'RentReminderBatch',
                entityId: 'auto-reminders',
                newValues: { count: dispatchedReminders.length, reminders: dispatchedReminders },
            });
        }

        return { count: dispatchedReminders.length, reminders: dispatchedReminders };
    }

    static async getRentReport(filters?: {
        startDate?: Date | string;
        endDate?: Date | string;
        year?: number;
        month?: number;
        currency?: string;
        entrepreneurId?: string;
    }) {
        const whereAccrual: any = {};
        if (filters?.year) whereAccrual.year = Number(filters.year);
        if (filters?.month) whereAccrual.month = Number(filters.month);
        if (filters?.entrepreneurId && filters.entrepreneurId !== 'ALL') {
            whereAccrual.entrepreneurId = filters.entrepreneurId;
        }
        if (filters?.currency && filters.currency !== 'ALL') {
            whereAccrual.currency = filters.currency;
        }
        if (filters?.startDate || filters?.endDate) {
            whereAccrual.dueDate = {};
            if (filters?.startDate) whereAccrual.dueDate.gte = new Date(filters.startDate);
            if (filters?.endDate) whereAccrual.dueDate.lte = new Date(filters.endDate);
        }

        const now = new Date();

        const [contracts, accruals, payments] = await Promise.all([
            prisma.rentContract.findMany({
                include: {
                    entrepreneur: { select: { id: true, name: true, logoUrl: true, email: true, phone: true } },
                    facility: { select: { id: true, title: true } },
                },
                orderBy: { startDate: 'desc' },
            }),
            prisma.rentAccrual.findMany({
                where: whereAccrual,
                include: {
                    contract: { select: { id: true, contractNo: true, spaceName: true, monthlyRent: true, dueDay: true } },
                    entrepreneur: { select: { id: true, name: true, email: true, phone: true } },
                    payments: true,
                },
                orderBy: [{ year: 'desc' }, { month: 'desc' }, { dueDate: 'asc' }],
            }),
            prisma.rentPayment.findMany({
                include: {
                    accrual: { select: { periodLabel: true, contractId: true } },
                    entrepreneur: { select: { id: true, name: true } },
                },
                orderBy: { paymentDate: 'desc' },
            }),
        ]);

        // Totals per currency
        const totalsByCurrency: Record<string, {
            currency: string;
            totalAccrued: number;
            totalCollected: number;
            remainingDue: number;
            overdueDue: number;
            collectionRate: number;
            partialPaidAmount: number;
            waivedAmount: number;
        }> = {};

        const getOrCreateCur = (cur: string = 'TRY') => {
            if (!totalsByCurrency[cur]) {
                totalsByCurrency[cur] = {
                    currency: cur,
                    totalAccrued: 0,
                    totalCollected: 0,
                    remainingDue: 0,
                    overdueDue: 0,
                    collectionRate: 0,
                    partialPaidAmount: 0,
                    waivedAmount: 0,
                };
            }
            return totalsByCurrency[cur];
        };

        // Aging buckets
        // 1: Vadesi Gelmemiş (due > now || daysOverdue <= 0)
        // 2: 1-7 Gün (1 <= days <= 7)
        // 3: 8-30 Gün (8 <= days <= 30)
        // 4: 31-60 Gün (31 <= days <= 60)
        // 5: 61-90 Gün (61 <= days <= 90)
        // 6: 90+ Gün (days > 90)
        const agingBuckets = {
            NOT_DUE: { key: 'NOT_DUE', label: 'Vadesi Gelmemiş', entrepreneurs: new Set<string>(), amountByCurrency: {} as Record<string, number>, count: 0 },
            DAYS_1_7: { key: 'DAYS_1_7', label: '1–7 Gün', entrepreneurs: new Set<string>(), amountByCurrency: {} as Record<string, number>, count: 0 },
            DAYS_8_30: { key: 'DAYS_8_30', label: '8–30 Gün', entrepreneurs: new Set<string>(), amountByCurrency: {} as Record<string, number>, count: 0 },
            DAYS_31_60: { key: 'DAYS_31_60', label: '31–60 Gün', entrepreneurs: new Set<string>(), amountByCurrency: {} as Record<string, number>, count: 0 },
            DAYS_61_90: { key: 'DAYS_61_90', label: '61–90 Gün', entrepreneurs: new Set<string>(), amountByCurrency: {} as Record<string, number>, count: 0 },
            DAYS_90_PLUS: { key: 'DAYS_90_PLUS', label: '90+ Gün', entrepreneurs: new Set<string>(), amountByCurrency: {} as Record<string, number>, count: 0 },
        };

        let partialPaymentsCount = 0;
        let upcomingDueCount = 0;
        const upcomingDueDateLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const monthlyTrendMap: Record<string, {
            monthKey: string;
            monthLabel: string;
            accrualByCurrency: Record<string, number>;
            collectionByCurrency: Record<string, number>;
        }> = {};

        const processedAccruals = accruals.map(acc => {
            const cur = acc.currency || 'TRY';
            const curBucket = getOrCreateCur(cur);

            curBucket.totalAccrued += acc.totalDue;
            curBucket.totalCollected += acc.paidAmount;
            curBucket.remainingDue += acc.remainingAmount;

            if (acc.status === 'WAIVED') {
                curBucket.waivedAmount += acc.baseAmount;
            }

            let daysOverdue = 0;
            let status = acc.status;

            if (acc.remainingAmount > 0 && acc.status !== 'WAIVED' && acc.status !== 'CANCELLED') {
                if (now > acc.dueDate) {
                    const diffTime = Math.abs(now.getTime() - acc.dueDate.getTime());
                    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    curBucket.overdueDue += acc.remainingAmount;
                    if (status !== 'PARTIALLY_PAID') {
                        status = 'OVERDUE';
                    }
                } else if (acc.dueDate <= upcomingDueDateLimit) {
                    upcomingDueCount += 1;
                }

                // Categorize into aging bucket
                let bucketKey: keyof typeof agingBuckets = 'NOT_DUE';
                if (daysOverdue <= 0) {
                    bucketKey = 'NOT_DUE';
                } else if (daysOverdue <= 7) {
                    bucketKey = 'DAYS_1_7';
                } else if (daysOverdue <= 30) {
                    bucketKey = 'DAYS_8_30';
                } else if (daysOverdue <= 60) {
                    bucketKey = 'DAYS_31_60';
                } else if (daysOverdue <= 90) {
                    bucketKey = 'DAYS_61_90';
                } else {
                    bucketKey = 'DAYS_90_PLUS';
                }

                agingBuckets[bucketKey].entrepreneurs.add(acc.entrepreneurId);
                agingBuckets[bucketKey].amountByCurrency[cur] = (agingBuckets[bucketKey].amountByCurrency[cur] || 0) + acc.remainingAmount;
                agingBuckets[bucketKey].count += 1;
            }

            if (acc.status === 'PARTIALLY_PAID' || (acc.paidAmount > 0 && acc.remainingAmount > 0)) {
                partialPaymentsCount += 1;
                curBucket.partialPaidAmount += acc.paidAmount;
            }

            // Monthly Trend data
            const mKey = `${acc.year}-${String(acc.month).padStart(2, '0')}`;
            if (!monthlyTrendMap[mKey]) {
                monthlyTrendMap[mKey] = {
                    monthKey: mKey,
                    monthLabel: acc.periodLabel,
                    accrualByCurrency: {},
                    collectionByCurrency: {},
                };
            }
            monthlyTrendMap[mKey].accrualByCurrency[cur] = (monthlyTrendMap[mKey].accrualByCurrency[cur] || 0) + acc.totalDue;
            monthlyTrendMap[mKey].collectionByCurrency[cur] = (monthlyTrendMap[mKey].collectionByCurrency[cur] || 0) + acc.paidAmount;

            return {
                id: acc.id,
                contractId: acc.contractId,
                contractNo: acc.contract.contractNo,
                spaceName: acc.contract.spaceName,
                entrepreneurId: acc.entrepreneurId,
                entrepreneurName: acc.entrepreneur.name,
                year: acc.year,
                month: acc.month,
                periodLabel: acc.periodLabel,
                baseAmount: acc.baseAmount,
                vatAmount: acc.vatAmount,
                totalDue: acc.totalDue,
                paidAmount: acc.paidAmount,
                remainingAmount: acc.remainingAmount,
                currency: acc.currency,
                dueDate: acc.dueDate,
                status,
                daysOverdue,
                reminderCount: acc.reminderCount,
                lastReminderSentAt: acc.lastReminderSentAt,
            };
        });

        // Compute Collection Rates
        for (const cur of Object.keys(totalsByCurrency)) {
            const b = totalsByCurrency[cur];
            b.collectionRate = b.totalAccrued > 0 ? Number(((b.totalCollected / b.totalAccrued) * 100).toFixed(1)) : 0;
        }

        // Contract Stats
        const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
        const waivedContracts = contracts.filter(c => c.isWaived || c.status === 'WAIVED');
        const freePeriodContracts = contracts.filter(c => {
            if (!c.freePeriodStart || !c.freePeriodEnd) return false;
            return now >= c.freePeriodStart && now <= c.freePeriodEnd;
        });

        // Contracts expiring in 60 days
        const expiringLimitDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const expiringContracts = activeContracts.filter(c => {
            return c.endDate >= now && c.endDate <= expiringLimitDate;
        }).map(c => ({
            id: c.id,
            contractNo: c.contractNo,
            entrepreneurName: c.entrepreneur.name,
            spaceName: c.spaceName,
            endDate: c.endDate,
            daysLeft: Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            monthlyRent: c.monthlyRent,
            currency: c.currency,
        }));

        // Format Aging Report
        const formattedAging = Object.values(agingBuckets).map(b => ({
            key: b.key,
            label: b.label,
            entrepreneurCount: b.entrepreneurs.size,
            itemCount: b.count,
            amountByCurrency: b.amountByCurrency,
        }));

        const sortedTrend = Object.values(monthlyTrendMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

        return {
            totalsByCurrency,
            activeContractsCount: activeContracts.length,
            waivedContractsCount: waivedContracts.length,
            freePeriodContractsCount: freePeriodContracts.length,
            partialPaymentsCount,
            upcomingDueCount,
            expiringContractsCount: expiringContracts.length,
            expiringContracts,
            agingReport: formattedAging,
            monthlyTrend: sortedTrend,
            accruals: processedAccruals,
            contractsSummary: contracts.map(c => ({
                id: c.id,
                contractNo: c.contractNo,
                entrepreneurId: c.entrepreneurId,
                entrepreneurName: c.entrepreneur.name,
                spaceName: c.spaceName,
                monthlyRent: c.monthlyRent,
                currency: c.currency,
                vatRate: c.vatRate,
                dueDay: c.dueDay,
                isWaived: c.isWaived,
                status: c.status,
                startDate: c.startDate,
                endDate: c.endDate,
            })),
            meta: {
                totalAccruals: accruals.length,
                totalPayments: payments.length,
                generatedAt: new Date().toISOString(),
            }
        };
    }

    static async getEntrepreneurStatement(entrepreneurId: string) {
        const entrepreneur = await prisma.entrepreneur.findUnique({
            where: { id: entrepreneurId },
            include: {
                rentContracts: {
                    orderBy: { startDate: 'desc' },
                },
                rentAccruals: {
                    include: {
                        contract: true,
                        payments: true,
                    },
                    orderBy: [{ year: 'asc' }, { month: 'asc' }, { dueDate: 'asc' }],
                },
                rentPayments: {
                    include: {
                        accrual: true,
                    },
                    orderBy: { paymentDate: 'asc' },
                },
                invoices: {
                    orderBy: { invoiceDate: 'desc' },
                },
            },
        });

        if (!entrepreneur) throw new Error('Girişimci bulunamadı');

        const now = new Date();

        // Build Chronological Ledger Items (DEBIT: Accrual, CREDIT: Payment)
        type StatementItem = {
            id: string;
            date: Date;
            type: 'ACCRUAL' | 'PAYMENT' | 'WAIVER';
            description: string;
            referenceNo?: string;
            debitAmount: number; // Borç
            creditAmount: number; // Alacak / Tahsilat
            balance: number; // Bakiye
            currency: string;
            status: string;
            daysOverdue?: number;
            documentUrl?: string;
        };

        const rawTransactions: Array<{
            id: string;
            date: Date;
            type: 'ACCRUAL' | 'PAYMENT' | 'WAIVER';
            description: string;
            referenceNo?: string;
            debitAmount: number;
            creditAmount: number;
            currency: string;
            status: string;
            daysOverdue?: number;
            documentUrl?: string;
        }> = [];

        // 1. Accruals
        for (const acc of entrepreneur.rentAccruals) {
            let daysOverdue = 0;
            if (acc.remainingAmount > 0 && acc.status !== 'WAIVED' && acc.status !== 'CANCELLED') {
                if (now > acc.dueDate) {
                    const diffTime = Math.abs(now.getTime() - acc.dueDate.getTime());
                    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            rawTransactions.push({
                id: `acc-${acc.id}`,
                date: acc.dueDate,
                type: acc.status === 'WAIVED' ? 'WAIVER' : 'ACCRUAL',
                description: `${acc.periodLabel} Kira Tahakkuku (${acc.contract.spaceName})`,
                referenceNo: acc.contract.contractNo,
                debitAmount: acc.status === 'WAIVED' ? 0 : acc.totalDue,
                creditAmount: 0,
                currency: acc.currency,
                status: acc.status,
                daysOverdue,
            });
        }

        // 2. Payments
        for (const p of entrepreneur.rentPayments) {
            rawTransactions.push({
                id: `pay-${p.id}`,
                date: p.paymentDate,
                type: 'PAYMENT',
                description: `${p.accrual?.periodLabel || 'Kira'} Tahsilatı (${p.paymentMethod || 'BANK'})`,
                referenceNo: p.bankReceiptNo || '-',
                debitAmount: 0,
                creditAmount: p.amount,
                currency: p.currency,
                status: 'COMPLETED',
                documentUrl: p.receiptDocUrl || undefined,
            });
        }

        // Sort chronologically
        rawTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate running balance per currency
        const balancesByCurrency: Record<string, number> = {};
        const statementItems: StatementItem[] = [];

        for (const tx of rawTransactions) {
            const cur = tx.currency || 'TRY';
            if (balancesByCurrency[cur] === undefined) {
                balancesByCurrency[cur] = 0;
            }

            // Running balance = previous balance + debit (borç artar) - credit (ödenince azalır)
            balancesByCurrency[cur] = balancesByCurrency[cur] + tx.debitAmount - tx.creditAmount;

            statementItems.push({
                ...tx,
                balance: balancesByCurrency[cur],
            });
        }

        // Totals per currency
        const summaryByCurrency: Record<string, { totalAccrued: number; totalPaid: number; balanceDue: number }> = {};
        for (const acc of entrepreneur.rentAccruals) {
            const cur = acc.currency || 'TRY';
            if (!summaryByCurrency[cur]) {
                summaryByCurrency[cur] = { totalAccrued: 0, totalPaid: 0, balanceDue: 0 };
            }
            summaryByCurrency[cur].totalAccrued += acc.totalDue;
            summaryByCurrency[cur].totalPaid += acc.paidAmount;
            summaryByCurrency[cur].balanceDue += acc.remainingAmount;
        }

        return {
            entrepreneur: {
                id: entrepreneur.id,
                name: entrepreneur.name,
                logoUrl: entrepreneur.logoUrl,
                sector: entrepreneur.sector,
                email: entrepreneur.email,
                phone: entrepreneur.phone,
            },
            contracts: entrepreneur.rentContracts,
            summaryByCurrency,
            statementItems: statementItems.reverse(), // latest first for display, with running balance computed
            invoices: entrepreneur.invoices,
        };
    }
}

