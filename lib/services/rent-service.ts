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
                accruals: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 3 },
            },
            orderBy: [{ startDate: 'desc' }],
        });
    }

    static async createRentContract(data: {
        entrepreneurId: string;
        spaceFacilityId?: string;
        spaceName: string;
        contractNo: string;
        startDate: Date | string;
        endDate: Date | string;
        monthlyRent: number;
        currency?: string;
        vatRate?: number;
        dueDay?: number;
        depositAmount?: number;
        isWaived?: boolean;
        freePeriodStart?: Date | string | null;
        freePeriodEnd?: Date | string | null;
        contractDocUrl?: string;
        notes?: string;
    }, actorId?: string) {
        const contract = await prisma.rentContract.create({
            data: {
                entrepreneurId: data.entrepreneurId,
                spaceFacilityId: data.spaceFacilityId || null,
                spaceName: data.spaceName,
                contractNo: data.contractNo,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                monthlyRent: Number(data.monthlyRent),
                currency: data.currency || 'TRY',
                vatRate: data.vatRate !== undefined ? Number(data.vatRate) : 20,
                dueDay: data.dueDay !== undefined ? Number(data.dueDay) : 5,
                depositAmount: data.depositAmount !== undefined ? Number(data.depositAmount) : 0,
                isWaived: data.isWaived || false,
                freePeriodStart: data.freePeriodStart ? new Date(data.freePeriodStart) : null,
                freePeriodEnd: data.freePeriodEnd ? new Date(data.freePeriodEnd) : null,
                status: 'ACTIVE',
                contractDocUrl: data.contractDocUrl || null,
                notes: data.notes || null,
                createdById: actorId || null,
            },
            include: {
                entrepreneur: { select: { name: true } },
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'RentContract',
            entityId: contract.id,
            newValues: {
                contractNo: contract.contractNo,
                entrepreneur: contract.entrepreneur.name,
                monthlyRent: contract.monthlyRent,
            },
        });

        return contract;
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
}
