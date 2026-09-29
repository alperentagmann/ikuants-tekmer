/**
 * İKÜANTS TEKMER — Contract & Document Lifecycle Service
 * 
 * Manages contracts, MOUs, incubation agreements, renewal alerts,
 * and multi-version document annexes.
 */

import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateContractInput {
    title: string;
    contractNumber: string;
    contractType: string;
    partyA?: string;
    partyB: string;
    partyBContactEmail?: string;
    partyBContactPhone?: string;
    startDate: Date;
    endDate?: Date;
    autoRenew?: boolean;
    renewalReminderDays?: number;
    responsibleUserId?: string;
    sensitivityClass?: string;
    documentUrl?: string;
    termsSummary?: string;
    notes?: string;
}

export class ContractService {
    /**
     * Get contracts with filter parameters
     */
    static async getContracts(filters?: {
        contractType?: string;
        status?: string;
        search?: string;
    }) {
        const where: any = {};
        if (filters?.contractType && filters.contractType !== 'ALL') {
            where.contractType = filters.contractType;
        }
        if (filters?.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { contractNumber: { contains: filters.search, mode: 'insensitive' } },
                { partyB: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return prisma.contract.findMany({
            where,
            include: {
                responsibleUser: { select: { id: true, name: true, email: true } },
                documents: { orderBy: { version: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create new contract record
     */
    static async createContract(input: CreateContractInput, actorId: string) {
        const contract = await prisma.contract.create({
            data: {
                title: input.title,
                contractNumber: input.contractNumber,
                contractType: input.contractType,
                partyA: input.partyA || 'İKÜANTS TEKMER',
                partyB: input.partyB,
                partyBContactEmail: input.partyBContactEmail,
                partyBContactPhone: input.partyBContactPhone,
                startDate: input.startDate,
                endDate: input.endDate,
                autoRenew: input.autoRenew || false,
                renewalReminderDays: input.renewalReminderDays || 30,
                responsibleUserId: input.responsibleUserId,
                sensitivityClass: input.sensitivityClass || 'CONFIDENTIAL',
                documentUrl: input.documentUrl,
                termsSummary: input.termsSummary,
                notes: input.notes,
                status: 'ACTIVE',
            },
            include: {
                responsibleUser: true,
                documents: true,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE_CONTRACT',
            entityType: 'Contract',
            entityId: contract.id,
            diff: JSON.stringify({ number: contract.contractNumber, partyB: contract.partyB }),
        });

        return contract;
    }

    /**
     * Attach a new document version to contract
     */
    static async attachDocument(params: {
        contractId: string;
        title: string;
        fileUrl: string;
        fileSize?: number;
        mimeType?: string;
        actorId: string;
    }) {
        const existingDocs = await prisma.contractDocument.findMany({
            where: { contractId: params.contractId },
            orderBy: { version: 'desc' },
        });

        const nextVersion = existingDocs.length > 0 ? existingDocs[0].version + 1 : 1;

        // Mark previous current as false
        await prisma.contractDocument.updateMany({
            where: { contractId: params.contractId },
            data: { isCurrent: false },
        });

        const newDoc = await prisma.contractDocument.create({
            data: {
                contractId: params.contractId,
                title: params.title,
                fileUrl: params.fileUrl,
                fileSize: params.fileSize || 0,
                mimeType: params.mimeType,
                version: nextVersion,
                isCurrent: true,
            },
        });

        await logAuditEvent({
            actorId: params.actorId,
            action: 'ATTACH_CONTRACT_DOCUMENT',
            entityType: 'ContractDocument',
            entityId: newDoc.id,
            diff: `Added document version v${nextVersion}: ${params.title}`,
        });

        return newDoc;
    }

    /**
     * Check expiring contracts for automated alerts
     */
    static async checkExpiringContracts() {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return prisma.contract.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: now,
                    lte: thirtyDaysFromNow,
                },
                isRenewalAlertSent: false,
            },
            include: {
                responsibleUser: true,
            },
        });
    }
}
