import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeStaffProfile } from '@/lib/hr';
import {
    validateTcChecksum,
    maskTcNumber,
    hashTcNumber,
    encryptTcNumber,
    decryptTcNumber,
} from '@/lib/security/identity-security';

export interface PersonMembershipInput {
    organizationId?: string;
    role?: string;
    department?: string;
    position?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    isPrimaryContact?: boolean;
    isFinanceContact?: boolean;
    isLegalContact?: boolean;
    isAuthorizedSignatory?: boolean;
    employmentType?: string | null;
    sgkStatus?: string | null;
    isRdStaff?: boolean;
    status?: string;
}

export interface PersonPrivacyInput {
    informationNoticeProvided?: boolean;
    informationNoticeVersion?: string;
    informationNoticeDate?: string | Date;
    explicitConsentRequired?: boolean;
    explicitConsentGiven?: boolean;
    explicitConsentDate?: string | Date;
    explicitConsentVersion?: string;
    legalBasis?: string; // CONSENT, CONTRACT, LEGAL_OBLIGATION, RIGHT_PROTECTION, LEGITIMATE_INTEREST, PUBLICIZED, OTHER
    emailPermission?: boolean;
    smsPermission?: boolean;
    callPermission?: boolean;
    status?: string; // ACTIVE, REVOKED
    notes?: string;
}

export interface CreatePersonInput {
    firstName: string;
    lastName: string;
    fullName?: string;
    title?: string;
    salutation?: string;
    avatarUrl?: string;
    birthDate?: string | Date | null;
    nationality?: string;
    isTurkishCitizen?: boolean;
    tcNumber?: string | null;
    workEmail?: string | null;
    personalEmail?: string | null;
    primaryEmailType?: 'WORK' | 'PERSONAL';
    email?: string | null;
    workPhone?: string | null;
    extension?: string | null;
    phone?: string | null;
    secondaryPhone?: string | null;
    linkedin?: string | null;
    websiteUrl?: string | null;
    country?: string;
    city?: string | null;
    state?: string | null;
    address?: string | null;
    postalCode?: string | null;
    notes?: string | null;
    tags?: string[];
    businessRoles?: string[];
    dataSource?: string;
    status?: string;
    userId?: string | null;
    
    // Organization relation
    organizationId?: string | null;
    newOrganization?: {
        displayName: string;
        legalName?: string;
        orgType?: string;
        sector?: string;
        taxNumber?: string;
        taxOffice?: string;
        city?: string;
        email?: string;
        phone?: string;
    } | null;
    membership?: PersonMembershipInput | null;

    // Privacy & KVKK
    privacy?: PersonPrivacyInput | null;

    // Contextual Profiles
    createMentorProfile?: boolean;
    mentorTitle?: string;
    mentorExpertise?: string[];
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {
    id: string;
}

export const PersonService = {
    async getPersons(params?: {
        search?: string;
        businessRole?: string;
        organizationId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        if (params?.status) {
            where.status = params.status;
        } else {
            where.status = { not: 'ARCHIVED' };
        }

        if (params?.search) {
            where.OR = [
                { fullName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { workEmail: { contains: params.search, mode: 'insensitive' } },
                { phone: { contains: params.search, mode: 'insensitive' } },
                { workPhone: { contains: params.search, mode: 'insensitive' } },
                { title: { contains: params.search, mode: 'insensitive' } },
                { city: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params?.businessRole) {
            where.businessRoles = { contains: params.businessRole };
        }

        if (params?.organizationId) {
            where.memberships = {
                some: {
                    organizationId: params.organizationId,
                },
            };
        }

        const items = await prisma.person.findMany({
            where,
            include: {
                memberships: {
                    include: {
                        organization: true,
                    },
                    orderBy: { isPrimaryContact: 'desc' },
                },
                mentors: {
                    select: { id: true, title: true, isArchived: true, expertiseAreas: true },
                },
                founders: {
                    include: {
                        entrepreneur: {
                            select: { id: true, name: true, status: true },
                        },
                    },
                },
                stakeholders: {
                    include: {
                        organization: {
                            select: { id: true, name: true, orgType: true },
                        },
                    },
                },
                user: {
                    select: { id: true, email: true, name: true, isSuperAdmin: true, isActive: true },
                },
            },
            orderBy: { fullName: 'asc' },
            take: params?.limit || 100,
            skip: params?.offset || 0,
        });

        const total = await prisma.person.count({ where });

        // Ensure sensitive fields (tcNumberEncrypted, tcNumberHash) are NEVER returned in list!
        const sanitized = items.map((p) => {
            const { tcNumberEncrypted, tcNumberHash, ...safe } = p as any;
            return safe;
        });

        return { items: sanitized, total };
    },

    async getPersonById(id: string) {
        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                memberships: {
                    include: {
                        organization: true,
                    },
                    orderBy: { isPrimaryContact: 'desc' },
                },
                mentors: {
                    include: {
                        mentorPrograms: {
                            include: { program: true },
                        },
                        mentorSessions: {
                            include: { entrepreneur: true },
                            orderBy: { sessionDate: 'desc' },
                        },
                    },
                },
                founders: {
                    include: {
                        entrepreneur: {
                            include: {
                                programAssignments: {
                                    include: { program: true },
                                },
                            },
                        },
                    },
                },
                stakeholders: {
                    include: {
                        organization: true,
                    },
                },
                user: {
                    select: { id: true, email: true, name: true, isSuperAdmin: true, isActive: true },
                },
                assignedRentContracts: {
                    include: {
                        entrepreneur: true,
                    },
                },
                kvkkConsents: {
                    include: {
                        textVersion: true,
                    },
                    orderBy: { consentedAt: 'desc' },
                },
            },
        });

        if (!person) return null;

        // Fetch recent interactions / meetings involving this person
        const interactions = await prisma.dailyInteraction.findMany({
            where: {
                OR: [
                    { contactName: { contains: person.fullName, mode: 'insensitive' } },
                    { email: person.email ? { equals: person.email, mode: 'insensitive' } : undefined },
                    { mentorId: person.mentors[0]?.id },
                ],
            },
            orderBy: { date: 'desc' },
            take: 20,
        });

        // Strip encrypted string and raw hash from standard view (authorized reveal handles decryption)
        const { tcNumberEncrypted, tcNumberHash, ...safePerson } = person as any;

        return {
            ...safePerson,
            hasTcNumber: Boolean(person.tcNumberMasked),
            interactions,
        };
    },

    async checkTcDuplicate(tcNumber: string, excludePersonId?: string) {
        const hash = hashTcNumber(tcNumber);
        if (!hash) return null;

        const existing = await prisma.person.findFirst({
            where: {
                tcNumberHash: hash,
                id: excludePersonId ? { not: excludePersonId } : undefined,
            },
            select: {
                id: true,
                fullName: true,
                tcNumberMasked: true,
                status: true,
            },
        });

        return existing;
    },

    async findPotentialDuplicates(params: {
        name?: string;
        email?: string;
        phone?: string;
        tcNumber?: string;
        excludeId?: string;
    }) {
        const checks: any[] = [];

        if (params.tcNumber && params.tcNumber.trim().length === 11) {
            const hash = hashTcNumber(params.tcNumber.trim());
            if (hash) {
                checks.push({ tcNumberHash: hash });
            }
        }

        if (params.email && params.email.trim() !== '') {
            const cleanEmail = params.email.trim();
            checks.push({ email: { equals: cleanEmail, mode: 'insensitive' } });
            checks.push({ workEmail: { equals: cleanEmail, mode: 'insensitive' } });
            checks.push({ personalEmail: { equals: cleanEmail, mode: 'insensitive' } });
        }

        if (params.phone && params.phone.trim().length >= 7) {
            const cleanPhone = params.phone.replace(/[^0-9]/g, '');
            if (cleanPhone.length >= 7) {
                checks.push({ phone: { contains: cleanPhone.slice(-7) } });
                checks.push({ workPhone: { contains: cleanPhone.slice(-7) } });
            }
        }

        if (params.name && params.name.trim().length >= 3) {
            checks.push({ fullName: { contains: params.name.trim(), mode: 'insensitive' } });
        }

        if (checks.length === 0) return [];

        const where: any = { OR: checks };
        if (params.excludeId) {
            where.id = { not: params.excludeId };
        }

        const matches = await prisma.person.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                title: true,
                tcNumberMasked: true,
                status: true,
                memberships: {
                    select: {
                        role: true,
                        organization: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            take: 5,
        });

        return matches;
    },

    async createPerson(input: CreatePersonInput, actor?: { id: string; name?: string }) {
        const fullName = input.fullName || `${input.firstName} ${input.lastName}`.trim();

        // 1. Validate & process T.C. Kimlik if provided
        let tcNumberMasked: string | null = null;
        let tcNumberEncrypted: string | null = null;
        let tcNumberHash: string | null = null;

        if (input.tcNumber && input.tcNumber.trim() !== '') {
            const validation = validateTcChecksum(input.tcNumber);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            const duplicate = await this.checkTcDuplicate(input.tcNumber);
            if (duplicate) {
                throw new Error(
                    `Bu kimlik bilgisiyle eşleşen mevcut bir kişi kaydı bulunuyor: ${duplicate.fullName} (${duplicate.tcNumberMasked || 'Maskeli'})`
                );
            }

            tcNumberMasked = maskTcNumber(input.tcNumber);
            tcNumberEncrypted = encryptTcNumber(input.tcNumber);
            tcNumberHash = hashTcNumber(input.tcNumber);
        }

        // 2. Primary email resolution
        let resolvedPrimaryEmail = input.email || null;
        if (!resolvedPrimaryEmail) {
            if (input.primaryEmailType === 'PERSONAL' && input.personalEmail) {
                resolvedPrimaryEmail = input.personalEmail;
            } else if (input.workEmail) {
                resolvedPrimaryEmail = input.workEmail;
            } else if (input.personalEmail) {
                resolvedPrimaryEmail = input.personalEmail;
            }
        }

        // 3. Primary phone resolution
        let resolvedPrimaryPhone = input.phone || null;
        if (!resolvedPrimaryPhone) {
            if (input.workPhone) {
                resolvedPrimaryPhone = input.workPhone;
            }
        }

        // 4. Construct privacy & consent JSON structure
        let privacyConsentsJson: string | null = null;
        if (input.privacy) {
            const p = input.privacy;
            const privacyData = {
                informationNoticeProvided: Boolean(p.informationNoticeProvided),
                informationNoticeVersion: p.informationNoticeVersion || 'v1.0',
                informationNoticeDate: p.informationNoticeDate || new Date().toISOString(),
                explicitConsentRequired: Boolean(p.explicitConsentRequired),
                explicitConsentGiven: Boolean(p.explicitConsentGiven),
                explicitConsentDate: p.explicitConsentDate || (p.explicitConsentGiven ? new Date().toISOString() : null),
                explicitConsentVersion: p.explicitConsentVersion || 'v1.0',
                legalBasis: p.legalBasis || 'CONSENT',
                emailPermission: Boolean(p.emailPermission),
                smsPermission: Boolean(p.smsPermission),
                callPermission: Boolean(p.callPermission),
                status: p.status || 'ACTIVE',
                notes: p.notes || null,
                history: [
                    {
                        date: new Date().toISOString(),
                        action: 'INITIAL_REGISTRATION',
                        actor: actor?.name || 'Sistem / Admin',
                        details: `Kişi kaydıyla birlikte KVKK tercihleri oluşturuldu (Hukuki Dayanak: ${p.legalBasis || 'CONSENT'})`,
                    },
                ],
            };
            privacyConsentsJson = JSON.stringify(privacyData);
        }

        // 5. Atomic transaction to create Person, Organization (if new), Membership, and contextual profiles
        const result = await prisma.$transaction(async (tx) => {
            const person = await tx.person.create({
                data: {
                    firstName: input.firstName.trim(),
                    lastName: input.lastName.trim(),
                    fullName,
                    title: input.title || null,
                    salutation: input.salutation || null,
                    avatarUrl: input.avatarUrl || null,
                    birthDate: input.birthDate ? new Date(input.birthDate) : null,
                    nationality: input.nationality || 'TC',
                    isTurkishCitizen: input.isTurkishCitizen !== undefined ? input.isTurkishCitizen : true,
                    tcNumberMasked,
                    tcNumberEncrypted,
                    tcNumberHash,
                    email: resolvedPrimaryEmail,
                    workEmail: input.workEmail || null,
                    personalEmail: input.personalEmail || null,
                    primaryEmailType: input.primaryEmailType || 'WORK',
                    phone: resolvedPrimaryPhone,
                    workPhone: input.workPhone || null,
                    extension: input.extension || null,
                    secondaryPhone: input.secondaryPhone || null,
                    linkedin: input.linkedin || null,
                    websiteUrl: input.websiteUrl || null,
                    country: input.country || 'Türkiye',
                    city: input.city || null,
                    state: input.state || null,
                    address: input.address || null,
                    postalCode: input.postalCode || null,
                    notes: input.notes || null,
                    tags: input.tags ? JSON.stringify(input.tags) : null,
                    businessRoles: input.businessRoles ? JSON.stringify(input.businessRoles) : JSON.stringify(['SIRKET_PERSONELI']),
                    dataSource: input.dataSource || 'MANUAL_ADMIN',
                    privacyConsents: privacyConsentsJson,
                    status: input.status || 'ACTIVE',
                    userId: input.userId || null,
                },
            });

            // Handle Organization linking: either existing organizationId or newOrganization
            let targetOrgId = input.organizationId;
            if (!targetOrgId && input.newOrganization && input.newOrganization.displayName) {
                const newOrg = await tx.organization.create({
                    data: {
                        name: input.newOrganization.displayName.trim(),
                        legalName: input.newOrganization.legalName || input.newOrganization.displayName.trim(),
                        orgType: input.newOrganization.orgType || 'COMPANY',
                        sector: input.newOrganization.sector || null,
                        taxNumber: input.newOrganization.taxNumber || null,
                        taxOffice: input.newOrganization.taxOffice || null,
                        city: input.newOrganization.city || input.city || 'İstanbul',
                        email: input.newOrganization.email || null,
                        phone: input.newOrganization.phone || null,
                        status: 'ACTIVE',
                    },
                });
                targetOrgId = newOrg.id;
            }

            if (targetOrgId) {
                const m = input.membership || {};
                await tx.personOrganizationMembership.create({
                    data: {
                        personId: person.id,
                        organizationId: targetOrgId,
                        role: m.role || 'EMPLOYEE',
                        department: m.department || null,
                        position: m.position || input.title || null,
                        startDate: m.startDate ? new Date(m.startDate) : new Date(),
                        endDate: m.endDate ? new Date(m.endDate) : null,
                        isPrimaryContact: m.isPrimaryContact !== undefined ? m.isPrimaryContact : true,
                        isFinanceContact: Boolean(m.isFinanceContact),
                        isLegalContact: Boolean(m.isLegalContact),
                        isAuthorizedSignatory: Boolean(m.isAuthorizedSignatory),
                        ...sanitizeStaffProfile({ employmentType: m.employmentType, sgkStatus: m.sgkStatus }),
                        isRdStaff: Boolean(m.isRdStaff),
                        status: m.status || 'ACTIVE',
                    },
                });
            }

            // Contextual Mentor Profile if requested
            if (input.createMentorProfile || (input.businessRoles && input.businessRoles.includes('MENTOR'))) {
                const existingMentor = await tx.mentor.findFirst({
                    where: { personId: person.id },
                });
                if (!existingMentor) {
                    await tx.mentor.create({
                        data: {
                            personId: person.id,
                            name: person.firstName, surname: person.lastName, company: (input.newOrganization?.displayName || "İKÜANTS TEKMER"),
                            title: input.mentorTitle || input.title || 'Mentör',
                            email: person.email,
                            phone: person.phone,
                            linkedin: person.linkedin,
                            expertiseAreas: input.mentorExpertise ? JSON.stringify(input.mentorExpertise) : '[]',
                            isActive: true,
                        },
                    });
                }
            }

            return person;
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Person',
                entityId: result.id,
                diff: `Kişi & Kurum Rehberine eklendi: ${result.fullName} (Durum: ${result.status})`,
            });
        }

        // Return safe person without encrypted payload
        const { tcNumberEncrypted: _enc, tcNumberHash: _hash, ...safe } = result;
        return safe;
    },

    async updatePerson(input: UpdatePersonInput, actor?: { id: string; name?: string }) {
        const existing = await prisma.person.findUnique({ where: { id: input.id } });
        if (!existing) throw new Error('Kişi bulunamadı.');

        const fullName = input.fullName || 
            (input.firstName || input.lastName ? `${input.firstName || existing.firstName} ${input.lastName || existing.lastName}`.trim() : existing.fullName);

        // T.C. Kimlik update handling
        let tcNumberMasked = existing.tcNumberMasked;
        let tcNumberEncrypted = existing.tcNumberEncrypted;
        let tcNumberHash = existing.tcNumberHash;

        if (input.tcNumber !== undefined) {
            if (input.tcNumber && input.tcNumber.trim() !== '') {
                // If value changed or was plain (not masked)
                if (!input.tcNumber.includes('*')) {
                    const validation = validateTcChecksum(input.tcNumber);
                    if (!validation.isValid) {
                        throw new Error(validation.message);
                    }

                    const duplicate = await this.checkTcDuplicate(input.tcNumber, existing.id);
                    if (duplicate) {
                        throw new Error(
                            `Bu kimlik bilgisiyle eşleşen mevcut başka bir kişi kaydı bulunuyor: ${duplicate.fullName} (${duplicate.tcNumberMasked || 'Maskeli'})`
                        );
                    }

                    tcNumberMasked = maskTcNumber(input.tcNumber);
                    tcNumberEncrypted = encryptTcNumber(input.tcNumber);
                    tcNumberHash = hashTcNumber(input.tcNumber);
                }
            } else {
                // Empty string removes TC
                tcNumberMasked = null;
                tcNumberEncrypted = null;
                tcNumberHash = null;
            }
        }

        // Privacy consents update handling
        let privacyConsentsJson = existing.privacyConsents;
        if (input.privacy) {
            let currentData: any = {};
            try {
                if (existing.privacyConsents) currentData = JSON.parse(existing.privacyConsents);
            } catch {
                currentData = {};
            }

            const p = input.privacy;
            const history = Array.isArray(currentData.history) ? currentData.history : [];
            history.unshift({
                date: new Date().toISOString(),
                action: 'PRIVACY_UPDATED',
                actor: actor?.name || 'Sistem / Admin',
                details: `KVKK tercihleri güncellendi (İletişim İzni E-Posta: ${p.emailPermission ? 'EVET' : 'HAYIR'}, SMS: ${p.smsPermission ? 'EVET' : 'HAYIR'})`,
            });

            currentData = {
                ...currentData,
                informationNoticeProvided: p.informationNoticeProvided !== undefined ? Boolean(p.informationNoticeProvided) : currentData.informationNoticeProvided,
                informationNoticeVersion: p.informationNoticeVersion || currentData.informationNoticeVersion || 'v1.0',
                informationNoticeDate: p.informationNoticeDate || currentData.informationNoticeDate || new Date().toISOString(),
                explicitConsentRequired: p.explicitConsentRequired !== undefined ? Boolean(p.explicitConsentRequired) : currentData.explicitConsentRequired,
                explicitConsentGiven: p.explicitConsentGiven !== undefined ? Boolean(p.explicitConsentGiven) : currentData.explicitConsentGiven,
                explicitConsentDate: p.explicitConsentDate || currentData.explicitConsentDate,
                explicitConsentVersion: p.explicitConsentVersion || currentData.explicitConsentVersion,
                legalBasis: p.legalBasis || currentData.legalBasis || 'CONSENT',
                emailPermission: p.emailPermission !== undefined ? Boolean(p.emailPermission) : currentData.emailPermission,
                smsPermission: p.smsPermission !== undefined ? Boolean(p.smsPermission) : currentData.smsPermission,
                callPermission: p.callPermission !== undefined ? Boolean(p.callPermission) : currentData.callPermission,
                status: p.status || currentData.status || 'ACTIVE',
                notes: p.notes !== undefined ? p.notes : currentData.notes,
                history,
            };

            privacyConsentsJson = JSON.stringify(currentData);
        }

        const updated = await prisma.person.update({
            where: { id: input.id },
            data: {
                firstName: input.firstName ?? existing.firstName,
                lastName: input.lastName ?? existing.lastName,
                fullName,
                title: input.title !== undefined ? input.title : existing.title,
                salutation: input.salutation !== undefined ? input.salutation : existing.salutation,
                avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl,
                birthDate: input.birthDate !== undefined ? (input.birthDate ? new Date(input.birthDate) : null) : existing.birthDate,
                nationality: input.nationality ?? existing.nationality,
                isTurkishCitizen: input.isTurkishCitizen !== undefined ? input.isTurkishCitizen : existing.isTurkishCitizen,
                tcNumberMasked,
                tcNumberEncrypted,
                tcNumberHash,
                email: input.email !== undefined ? input.email : existing.email,
                workEmail: input.workEmail !== undefined ? input.workEmail : existing.workEmail,
                personalEmail: input.personalEmail !== undefined ? input.personalEmail : existing.personalEmail,
                primaryEmailType: input.primaryEmailType ?? existing.primaryEmailType,
                phone: input.phone !== undefined ? input.phone : existing.phone,
                workPhone: input.workPhone !== undefined ? input.workPhone : existing.workPhone,
                extension: input.extension !== undefined ? input.extension : existing.extension,
                secondaryPhone: input.secondaryPhone !== undefined ? input.secondaryPhone : existing.secondaryPhone,
                linkedin: input.linkedin !== undefined ? input.linkedin : existing.linkedin,
                websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl : existing.websiteUrl,
                city: input.city !== undefined ? input.city : existing.city,
                state: input.state !== undefined ? input.state : existing.state,
                country: input.country !== undefined ? input.country : existing.country,
                address: input.address !== undefined ? input.address : existing.address,
                postalCode: input.postalCode !== undefined ? input.postalCode : existing.postalCode,
                notes: input.notes !== undefined ? input.notes : existing.notes,
                tags: input.tags ? JSON.stringify(input.tags) : existing.tags,
                businessRoles: input.businessRoles ? JSON.stringify(input.businessRoles) : existing.businessRoles,
                dataSource: input.dataSource ?? existing.dataSource,
                privacyConsents: privacyConsentsJson,
                status: input.status ?? existing.status,
            },
        });

        // Staff details of the company link (role, department, employment type, SGK status, R&D flag)
        if (input.organizationId && input.membership) {
            const m = input.membership;
            const link = await prisma.personOrganizationMembership.findFirst({ where: { personId: updated.id, organizationId: input.organizationId } });
            const data = {
                role: m.role || undefined,
                department: m.department !== undefined ? m.department || null : undefined,
                position: m.position !== undefined ? m.position || null : undefined,
                isPrimaryContact: m.isPrimaryContact,
                isFinanceContact: m.isFinanceContact,
                isLegalContact: m.isLegalContact,
                isAuthorizedSignatory: m.isAuthorizedSignatory,
                ...sanitizeStaffProfile({ employmentType: m.employmentType, sgkStatus: m.sgkStatus }),
                isRdStaff: m.isRdStaff,
            };
            if (link) await prisma.personOrganizationMembership.update({ where: { id: link.id }, data });
            else await prisma.personOrganizationMembership.create({ data: { ...data, role: m.role || 'EMPLOYEE', personId: updated.id, organizationId: input.organizationId, status: 'ACTIVE' } });
        }

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'UPDATE',
                entityType: 'Person',
                entityId: updated.id,
                diff: `Kişi güncellendi: ${updated.fullName}`,
            });
        }

        const { tcNumberEncrypted: _enc, tcNumberHash: _hash, ...safe } = updated;
        return safe;
    },

    async revealIdentity(personId: string, actor: { id: string; name?: string; canViewSensitive: boolean }) {
        if (!actor.canViewSensitive) {
            throw new Error('403_FORBIDDEN: Bu hassas kimlik verisini görüntüleme yetkiniz bulunmamaktadır (person:identity:view gerekli).');
        }

        const person = await prisma.person.findUnique({
            where: { id: personId },
            select: {
                id: true,
                fullName: true,
                tcNumberEncrypted: true,
                tcNumberMasked: true,
            },
        });

        if (!person) {
            throw new Error('Kişi bulunamadı.');
        }

        if (!person.tcNumberEncrypted) {
            return {
                id: person.id,
                fullName: person.fullName,
                tcNumber: null,
                message: 'Bu kişiye ait kayıtlı kimlik bilgisi bulunmuyor.',
            };
        }

        const decrypted = decryptTcNumber(person.tcNumberEncrypted);

        // Record Audit Log without storing plaintext T.C.!
        await logAuditEvent({
            actorId: actor.id,
            actorName: actor.name,
            action: 'SENSITIVE_FIELD_VIEWED',
            entityType: 'Person',
            entityId: person.id,
            diff: `Hassas alan (T.C. Kimlik No) yetkili kullanıcı tarafından görüntülendi (Kişi: ${person.fullName})`,
        });

        return {
            id: person.id,
            fullName: person.fullName,
            tcNumber: decrypted,
            masked: person.tcNumberMasked,
        };
    },

    async revokeConsent(
        personId: string,
        reason?: string,
        actor?: { id: string; name?: string }
    ) {
        const existing = await prisma.person.findUnique({ where: { id: personId } });
        if (!existing) throw new Error('Kişi bulunamadı.');

        let currentData: any = {};
        try {
            if (existing.privacyConsents) currentData = JSON.parse(existing.privacyConsents);
        } catch {
            currentData = {};
        }

        const history = Array.isArray(currentData.history) ? currentData.history : [];
        history.unshift({
            date: new Date().toISOString(),
            action: 'CONSENT_REVOKED',
            actor: actor?.name || 'Sistem / Admin',
            details: `Kişi iletişim iznini geri çekti (Gerekçe: ${reason || 'Belirtilmedi'})`,
        });

        const updatedData = {
            ...currentData,
            status: 'REVOKED',
            emailPermission: false,
            smsPermission: false,
            callPermission: false,
            revokedAt: new Date().toISOString(),
            revocationReason: reason || null,
            history,
        };

        const updated = await prisma.person.update({
            where: { id: personId },
            data: {
                privacyConsents: JSON.stringify(updatedData),
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'REVOKE_CONSENT',
                entityType: 'Person',
                entityId: personId,
                diff: `Kişi iletişim izni geri çekildi (REVOKED): ${existing.fullName}`,
            });
        }

        return updated;
    },

    async deletePerson(id: string, actor?: { id: string; name?: string }) {
        const existing = await prisma.person.findUnique({ where: { id } });
        if (!existing) throw new Error('Kişi bulunamadı.');

        const archived = await prisma.person.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'Person',
                entityId: id,
                diff: `Kişi arşivlendi: ${existing.fullName}`,
            });
        }

        return archived;
    },
};
