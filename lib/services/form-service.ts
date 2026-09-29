import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

import { FormFieldInput } from '@/lib/types/form';
export type { FormFieldInput };


export const FormService = {
    async getPublishedFormBySlug(slug: string) {
        const form = await prisma.form.findUnique({
            where: { slug },
            include: {
                versions: {
                    where: { status: 'PUBLISHED' },
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: {
                        fields: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });

        if (!form || form.isArchived || form.versions.length === 0) return null;

        const latestPublishedVersion = form.versions[0];

        return {
            formId: form.id,
            title: form.title,
            slug: form.slug,
            description: form.description,
            versionId: latestPublishedVersion.id,
            versionNumber: latestPublishedVersion.versionNumber,
            successMessage: form.successMessage,
            fields: latestPublishedVersion.fields.map((f: any) => ({
                id: f.id,
                fieldKey: f.fieldKey,
                label: f.label,
                fieldType: f.fieldType,
                placeholder: f.placeholder,
                helpText: f.helpText,
                isRequired: f.isRequired,
                defaultValue: f.defaultValue,
                validationRules: f.validationRules ? JSON.parse(f.validationRules) : null,
                conditionalRules: f.conditionalRules ? JSON.parse(f.conditionalRules) : null,
                options: f.options ? JSON.parse(f.options) : [],
                stepNumber: f.stepNumber,
                stepTitle: f.stepTitle,
                width: f.width,
                sortOrder: f.sortOrder,
            })),
        };
    },

    async getAdminForms() {
        return prisma.form.findMany({
            where: { isArchived: false },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    include: {
                        _count: { select: { submissions: true, applications: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    async getFormVersionDetails(versionId: string) {
        const version = await prisma.formVersion.findUnique({
            where: { id: versionId },
            include: {
                form: true,
                fields: { orderBy: { sortOrder: 'asc' } },
            },
        });

        if (!version) return null;

        return {
            ...version,
            fields: version.fields.map((f: any) => ({
                ...f,
                validationRules: f.validationRules ? JSON.parse(f.validationRules) : null,
                conditionalRules: f.conditionalRules ? JSON.parse(f.conditionalRules) : null,
                options: f.options ? JSON.parse(f.options) : [],
            })),
        };
    },

    async createFormWithVersion(params: {
        title: string;
        slug: string;
        description?: string;
        formType?: string;
        fields: FormFieldInput[];
        publishImmediately?: boolean;
        actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const form = await prisma.form.create({
            data: {
                title: params.title,
                slug: params.slug,
                description: params.description,
                formType: params.formType || 'APPLICATION',
                isPublished: params.publishImmediately || false,
            },
        });

        const version = await prisma.formVersion.create({
            data: {
                formId: form.id,
                versionNumber: 1,
                status: params.publishImmediately ? 'PUBLISHED' : 'DRAFT',
                publishedAt: params.publishImmediately ? new Date() : null,
                publishedById: params.publishImmediately ? params.actor?.id : null,
                schemaSnapshot: JSON.stringify(params.fields),
                fields: {
                    create: params.fields.map((f, idx) => ({
                        id: f.id || crypto.randomUUID(), // Immutable UUID
                        fieldKey: f.fieldKey,
                        label: f.label,
                        fieldType: f.fieldType,
                        placeholder: f.placeholder,
                        helpText: f.helpText,
                        isRequired: f.isRequired ?? false,
                        defaultValue: f.defaultValue,
                        validationRules: f.validationRules ? JSON.stringify(f.validationRules) : null,
                        conditionalRules: f.conditionalRules ? JSON.stringify(f.conditionalRules) : null,
                        options: f.options ? JSON.stringify(f.options) : null,
                        stepNumber: f.stepNumber ?? 1,
                        stepTitle: f.stepTitle,
                        width: f.width || 'FULL',
                        sortOrder: f.sortOrder ?? idx,
                    })),
                },
            },
        });

        await logAuditEvent({
            actorId: params.actor?.id,
            actorEmail: params.actor?.email,
            actorName: params.actor?.name,
            action: 'CREATE',
            entityType: 'Form',
            entityId: form.id,
            diff: `Created form "${form.title}" with version v1 (${params.fields.length} fields)`,
            ipAddress: params.actor?.ip,
            userAgent: params.actor?.userAgent,
        });

        return { form, version };
    },

    async createNewFormVersion(params: {
        formId: string;
        fields: FormFieldInput[];
        publishImmediately?: boolean;
        actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const form = await prisma.form.findUnique({
            where: { id: params.formId },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        });
        if (!form) throw new Error('Form not found');

        const latestVersionNumber = form.versions[0]?.versionNumber || 0;
        const nextVersionNumber = latestVersionNumber + 1;

        const newVersion = await prisma.formVersion.create({
            data: {
                formId: params.formId,
                versionNumber: nextVersionNumber,
                status: params.publishImmediately ? 'PUBLISHED' : 'DRAFT',
                publishedAt: params.publishImmediately ? new Date() : null,
                publishedById: params.publishImmediately ? params.actor?.id : null,
                schemaSnapshot: JSON.stringify(params.fields),
                fields: {
                    create: params.fields.map((f, idx) => ({
                        id: f.id || crypto.randomUUID(), // Preserve existing UUIDs or assign new
                        fieldKey: f.fieldKey,
                        label: f.label,
                        fieldType: f.fieldType,
                        placeholder: f.placeholder,
                        helpText: f.helpText,
                        isRequired: f.isRequired ?? false,
                        defaultValue: f.defaultValue,
                        validationRules: f.validationRules ? JSON.stringify(f.validationRules) : null,
                        conditionalRules: f.conditionalRules ? JSON.stringify(f.conditionalRules) : null,
                        options: f.options ? JSON.stringify(f.options) : null,
                        stepNumber: f.stepNumber ?? 1,
                        stepTitle: f.stepTitle,
                        width: f.width || 'FULL',
                        sortOrder: f.sortOrder ?? idx,
                    })),
                },
            },
        });

        if (params.publishImmediately) {
            // Unpublish previous versions
            await prisma.formVersion.updateMany({
                where: { formId: params.formId, id: { not: newVersion.id }, status: 'PUBLISHED' },
                data: { status: 'ARCHIVED' },
            });
            await prisma.form.update({
                where: { id: params.formId },
                data: { isPublished: true },
            });
        }

        await logAuditEvent({
            actorId: params.actor?.id,
            actorEmail: params.actor?.email,
            actorName: params.actor?.name,
            action: params.publishImmediately ? 'PUBLISH' : 'CREATE',
            entityType: 'FormVersion',
            entityId: newVersion.id,
            diff: `Created form version v${nextVersionNumber} for "${form.title}" (${params.fields.length} fields)`,
            ipAddress: params.actor?.ip,
            userAgent: params.actor?.userAgent,
        });

        return newVersion;
    }
};
