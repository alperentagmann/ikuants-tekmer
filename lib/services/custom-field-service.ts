import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { hasPermission, UserWithPermissions } from '@/lib/rbac';

export const SUPPORTED_FIELD_TYPES = [
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'CURRENCY',
    'DATE',
    'DATETIME',
    'BOOLEAN',
    'SELECT',
    'MULTI_SELECT',
    'USER',
    'ORGANIZATION',
    'URL',
    'EMAIL',
    'PHONE',
    'FILE',
    'RELATION',
] as const;

export type SupportedFieldType = typeof SUPPORTED_FIELD_TYPES[number];

export interface CreateCustomFieldInput {
    moduleKey: string; // ENTREPRENEUR, MENTOR, TASK, ACTIVITY, APPLICATION, PROJECT
    fieldKey: string;
    label: string;
    fieldType?: string;
    placeholder?: string;
    description?: string;
    isRequired?: boolean;
    defaultValue?: string;
    optionsJson?: string;
    viewPermission?: string;
    editPermission?: string;
    isPublic?: boolean;
    sortOrder?: number;
    actorId?: string;
}

export class CustomFieldService {
    /**
     * Get field definitions for a module
     */
    static async getDefinitions(moduleKey: string, caller?: UserWithPermissions | null) {
        const definitions = await prisma.customFieldDefinition.findMany({
            where: { moduleKey, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });

        if (!caller || caller.isSuperAdmin) {
            return definitions;
        }

        // Filter by viewPermission if set
        return definitions.filter((def) => {
            if (!def.viewPermission) return true;
            return hasPermission(caller, def.viewPermission, moduleKey.toLowerCase());
        });
    }

    /**
     * Create a new custom field definition
     */
    static async createDefinition(input: CreateCustomFieldInput) {
        const fieldKey = input.fieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        const existing = await prisma.customFieldDefinition.findUnique({
            where: {
                moduleKey_fieldKey: {
                    moduleKey: input.moduleKey,
                    fieldKey,
                },
            },
        });

        if (existing) {
            throw new Error(`"${input.moduleKey}" modülünde "${fieldKey}" alan anahtarı zaten tanımlanmış.`);
        }

        const normalizedType = input.fieldType ? input.fieldType.toUpperCase() : 'TEXT';

        const created = await prisma.customFieldDefinition.create({
            data: {
                moduleKey: input.moduleKey,
                fieldKey,
                label: input.label,
                fieldType: normalizedType,
                placeholder: input.placeholder,
                description: input.description,
                isRequired: input.isRequired || false,
                defaultValue: input.defaultValue,
                optionsJson: input.optionsJson,
                viewPermission: input.viewPermission,
                editPermission: input.editPermission,
                isPublic: input.isPublic || false,
                sortOrder: input.sortOrder || 0,
            },
        });

        await logAuditEvent({
            actorId: input.actorId,
            action: 'CREATE',
            entityType: 'CustomFieldDefinition',
            entityId: created.id,
            diff: `Created custom field "${input.label}" (${fieldKey}, type: ${normalizedType}) for module ${input.moduleKey}`,
        });

        return created;
    }

    /**
     * Update custom field definition
     */
    static async updateDefinition(id: string, data: Partial<CreateCustomFieldInput>, actorId?: string) {
        const updated = await prisma.customFieldDefinition.update({
            where: { id },
            data: {
                label: data.label,
                fieldType: data.fieldType ? data.fieldType.toUpperCase() : undefined,
                placeholder: data.placeholder,
                description: data.description,
                isRequired: data.isRequired,
                defaultValue: data.defaultValue,
                optionsJson: data.optionsJson,
                viewPermission: data.viewPermission,
                editPermission: data.editPermission,
                isPublic: data.isPublic,
                sortOrder: data.sortOrder,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'CustomFieldDefinition',
            entityId: id,
            diff: `Updated custom field ${updated.fieldKey} on module ${updated.moduleKey}`,
        });

        return updated;
    }

    /**
     * Delete custom field definition
     */
    static async deleteDefinition(id: string, actorId?: string) {
        const field = await prisma.customFieldDefinition.findUnique({ where: { id } });
        if (!field) throw new Error('Özel alan tanımı bulunamadı.');

        await prisma.customFieldDefinition.delete({ where: { id } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'CustomFieldDefinition',
            entityId: id,
            diff: `Deleted custom field ${field.fieldKey} from module ${field.moduleKey}`,
        });

        return { success: true };
    }

    /**
     * Get values for an entity with server-side field-level permissions
     */
    static async getFieldValues(moduleKey: string, entityId: string, caller?: UserWithPermissions | null) {
        const definitions = await this.getDefinitions(moduleKey, caller);
        const defIds = definitions.map((d) => d.id);

        const values = await prisma.customFieldValue.findMany({
            where: {
                entityId,
                definitionId: { in: defIds },
            },
            include: { definition: true },
        });

        const resultMap: Record<string, any> = {};
        for (const def of definitions) {
            // Check viewPermission
            if (caller && !caller.isSuperAdmin && def.viewPermission) {
                if (!hasPermission(caller, def.viewPermission, moduleKey.toLowerCase())) {
                    continue; // Skip restricted field
                }
            }

            const valRecord = values.find((v) => v.definitionId === def.id);
            if (valRecord) {
                if (valRecord.jsonValue) {
                    try {
                        resultMap[def.fieldKey] = JSON.parse(valRecord.jsonValue);
                    } catch {
                        resultMap[def.fieldKey] = valRecord.textValue;
                    }
                } else if (valRecord.numValue !== null && valRecord.numValue !== undefined) {
                    resultMap[def.fieldKey] = valRecord.numValue;
                } else if (valRecord.dateValue) {
                    resultMap[def.fieldKey] = valRecord.dateValue;
                } else {
                    resultMap[def.fieldKey] = valRecord.textValue;
                }
            } else {
                resultMap[def.fieldKey] = def.defaultValue || null;
            }
        }

        return {
            definitions,
            values: resultMap,
        };
    }

    /**
     * Save custom field values for an entity with server-side validation and editPermission checks
     */
    static async saveFieldValues(
        moduleKey: string,
        entityId: string,
        values: Record<string, any>,
        actorId?: string,
        caller?: UserWithPermissions | null
    ) {
        const definitions = await prisma.customFieldDefinition.findMany({
            where: { moduleKey, isActive: true },
        });

        for (const def of definitions) {
            if (!(def.fieldKey in values)) continue;

            // Server-side editPermission check
            if (caller && !caller.isSuperAdmin && def.editPermission) {
                if (!hasPermission(caller, def.editPermission, moduleKey.toLowerCase())) {
                    continue; // Disallow updating restricted field
                }
            }

            const rawVal = values[def.fieldKey];

            // Required validation
            if (def.isRequired && (rawVal === undefined || rawVal === null || rawVal === '')) {
                throw new Error(`"${def.label}" alanı zorunludur.`);
            }

            let textValue: string | null = null;
            let numValue: number | null = null;
            let dateValue: Date | null = null;
            let jsonValue: string | null = null;

            if (rawVal !== undefined && rawVal !== null) {
                const type = def.fieldType.toUpperCase();

                if (type === 'NUMBER' || type === 'CURRENCY') {
                    if (typeof rawVal === 'number') {
                        numValue = rawVal;
                        textValue = String(rawVal);
                    } else {
                        const parsed = parseFloat(String(rawVal));
                        if (!isNaN(parsed)) {
                            numValue = parsed;
                            textValue = String(parsed);
                        }
                    }
                } else if (type === 'DATE' || type === 'DATETIME') {
                    if (rawVal instanceof Date) {
                        dateValue = rawVal;
                        textValue = rawVal.toISOString();
                    } else if (typeof rawVal === 'string' && rawVal.trim()) {
                        const parsedDate = new Date(rawVal);
                        if (!isNaN(parsedDate.getTime())) {
                            dateValue = parsedDate;
                            textValue = parsedDate.toISOString();
                        }
                    }
                } else if (type === 'BOOLEAN') {
                    const isBool = rawVal === true || rawVal === 'true' || rawVal === 1 || rawVal === '1';
                    textValue = isBool ? 'true' : 'false';
                } else if (
                    type === 'SELECT' ||
                    type === 'MULTI_SELECT' ||
                    type === 'USER' ||
                    type === 'ORGANIZATION' ||
                    type === 'FILE' ||
                    type === 'RELATION'
                ) {
                    if (Array.isArray(rawVal) || typeof rawVal === 'object') {
                        jsonValue = JSON.stringify(rawVal);
                    } else {
                        textValue = String(rawVal);
                    }
                } else if (type === 'EMAIL') {
                    textValue = String(rawVal).trim().toLowerCase();
                    if (textValue && !textValue.includes('@')) {
                        throw new Error(`"${def.label}" geçerli bir e-posta adresi olmalıdır.`);
                    }
                } else if (type === 'URL') {
                    textValue = String(rawVal).trim();
                } else {
                    // TEXT, TEXTAREA, PHONE
                    textValue = String(rawVal);
                }
            }

            await prisma.customFieldValue.upsert({
                where: {
                    definitionId_entityId: {
                        definitionId: def.id,
                        entityId,
                    },
                },
                update: {
                    textValue,
                    numValue,
                    dateValue,
                    jsonValue,
                },
                create: {
                    definitionId: def.id,
                    entityId,
                    textValue,
                    numValue,
                    dateValue,
                    jsonValue,
                },
            });
        }

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: moduleKey,
            entityId,
            diff: `Updated custom field values for ${moduleKey} ID ${entityId}`,
        });

        return { success: true };
    }
}
