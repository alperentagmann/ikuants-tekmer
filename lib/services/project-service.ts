import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateProjectInput {
    title: string;
    slug?: string;
    code?: string;
    description?: string;
    projectType?: string;
    budgetAmount?: number;
    currency?: string;
    fundingAgency?: string;
    startDate: string | Date;
    endDate?: string | Date;
    status?: string;
    programId?: string;
    entrepreneurId?: string;
    organizationId?: string;
    createdById: string;
    milestones?: Array<{ title: string; description?: string; targetDate: string | Date; deliverable?: string }>;
    risks?: Array<{ riskTitle: string; riskLevel: string; probability?: string; mitigationPlan?: string }>;
    budgetItems?: Array<{ category: string; title: string; plannedAmount: number; currency?: string }>;
}

export const ProjectService = {
    async getProjects(params?: { projectType?: string; status?: string; search?: string }) {
        const where: any = {};
        if (params?.projectType) where.projectType = params.projectType;
        if (params?.status) where.status = params.status;
        if (params?.search) {
            where.OR = [
                { title: { contains: params.search } },
                { code: { contains: params.search } },
                { description: { contains: params.search } },
            ];
        }

        return prisma.project.findMany({
            where,
            include: {
                program: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true } },
                organization: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                milestones: { orderBy: { targetDate: 'asc' } },
                risks: true,
                budgetItems: true,
            },
            orderBy: { startDate: 'desc' },
        });
    },

    async getProjectById(id: string) {
        return prisma.project.findUnique({
            where: { id },
            include: {
                program: true,
                entrepreneur: true,
                organization: true,
                creator: { select: { id: true, name: true, email: true } },
                milestones: { orderBy: { targetDate: 'asc' } },
                risks: true,
                budgetItems: true,
            },
        });
    },

    async createProject(input: CreateProjectInput, actor?: { id: string; name?: string }) {
        const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

        const project = await prisma.project.create({
            data: {
                title: input.title,
                slug,
                code: input.code,
                description: input.description,
                projectType: input.projectType || 'KOSGEB',
                budgetAmount: input.budgetAmount ? Number(input.budgetAmount) : null,
                currency: input.currency || 'TRY',
                fundingAgency: input.fundingAgency,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                status: input.status || 'ACTIVE',
                programId: input.programId,
                entrepreneurId: input.entrepreneurId,
                organizationId: input.organizationId,
                createdById: input.createdById,
                milestones: input.milestones
                    ? {
                          create: input.milestones.map((m, idx) => ({
                              title: m.title,
                              description: m.description,
                              targetDate: new Date(m.targetDate),
                              deliverable: m.deliverable,
                              sortOrder: idx + 1,
                          })),
                      }
                    : undefined,
                risks: input.risks
                    ? {
                          create: input.risks.map((r) => ({
                              riskTitle: r.riskTitle,
                              riskLevel: r.riskLevel || 'MEDIUM',
                              probability: r.probability || 'MEDIUM',
                              mitigationPlan: r.mitigationPlan,
                          })),
                      }
                    : undefined,
                budgetItems: input.budgetItems
                    ? {
                          create: input.budgetItems.map((b) => ({
                              category: b.category,
                              title: b.title,
                              plannedAmount: Number(b.plannedAmount),
                              currency: b.currency || 'TRY',
                          })),
                      }
                    : undefined,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Project',
                entityId: project.id,
                diff: `Kurumsal proje oluşturuldu: ${project.title}`,
            });
        }

        return project;
    },
};
