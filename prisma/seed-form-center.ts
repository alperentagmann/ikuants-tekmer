/**
 * Creates the initial Form Center content (idempotent, never overwrites):
 *  - KVKK text versions taken from data/kvkk-texts.ts (only if no text with the same title exists)
 *  - One form per public business form, published as v1
 *  - Application campaigns for program / TEKMER / mentor applications
 *
 *   npx tsx prisma/seed-form-center.ts
 */
import { prisma } from '../lib/prisma';
import { KVKK_TEXTS } from '../data/kvkk-texts';
import { FORM_SEEDS } from './form-center-definitions';
import { FormService } from '../lib/services/form-service';
import { defaultWorkflow } from '../lib/services/application-campaign-service';
import type { FormFieldDefinition } from '../lib/forms/schema';

type KvkkKey = keyof typeof KVKK_TEXTS;

const KVKK_CONSENT_TYPES: Record<KvkkKey, string[]> = {
    kvkk1: ['PRIVACY_NOTICE'],
    kvkk2: ['DATA_PROCESSING'],
    kvkk3: ['MARKETING_COMMUNICATION'],
    kvkk4: ['PHOTO_VIDEO_USE'],
};

async function ensureKvkkTexts(): Promise<Record<KvkkKey, string>> {
    const ids = {} as Record<KvkkKey, string>;
    for (const key of Object.keys(KVKK_TEXTS) as KvkkKey[]) {
        const text = KVKK_TEXTS[key];
        const existing = await prisma.kvkkTextVersion.findFirst({
            where: { title: text.title, isPublished: true },
            orderBy: { publishedAt: 'desc' },
        });
        if (existing) {
            ids[key] = existing.id;
            continue;
        }
        const created = await prisma.kvkkTextVersion.create({
            data: {
                title: text.title,
                version: 'v1.0',
                content: text.content,
                consentTypes: JSON.stringify(KVKK_CONSENT_TYPES[key]),
                isPublished: true,
            },
        });
        ids[key] = created.id;
        console.log(`  + KVKK metni: ${text.title}`);
    }
    return ids;
}

function resolveKvkkPlaceholders(fields: FormFieldDefinition[], ids: Record<KvkkKey, string>): FormFieldDefinition[] {
    return fields.map((f) => {
        const ref = f.uiConfig?.kvkkTextId;
        if (ref && ref.startsWith('__kvkk:')) {
            const key = ref.replace('__kvkk:', '') as KvkkKey;
            return { ...f, uiConfig: { ...f.uiConfig, kvkkTextId: ids[key] } };
        }
        return f;
    });
}

export async function seedFormCenter() {
    console.log('Form Merkezi başlangıç içeriği kontrol ediliyor...');
    const kvkkIds = await ensureKvkkTexts();

    let createdForms = 0;
    let createdCampaigns = 0;

    for (const seed of FORM_SEEDS) {
        let form = await prisma.form.findUnique({ where: { slug: seed.slug } });
        if (!form) {
            const fields = resolveKvkkPlaceholders(seed.fields, kvkkIds);
            const { form: created } = await FormService.createForm({
                title: seed.title,
                slug: seed.slug,
                formType: seed.formType,
                description: seed.description || null,
                theme: seed.theme,
                publicPath: seed.publicPath,
                sections: seed.sections,
                fields,
            });
            await prisma.form.update({
                where: { id: created.id },
                data: { successMessage: seed.successMessage, submitLabel: seed.submitLabel || null },
            });
            await FormService.publishDraft(created.id);
            form = created;
            createdForms++;
            console.log(`  + Form: ${seed.title} (v1 yayında)`);
        }

        if (seed.campaign) {
            const existingCampaign = await prisma.applicationCampaign.findUnique({ where: { slug: seed.campaign.slug } });
            if (!existingCampaign) {
                const program = seed.campaign.programSlug
                    ? await prisma.program.findUnique({ where: { slug: seed.campaign.programSlug } })
                    : null;
                if (seed.campaign.programSlug && !program) {
                    console.warn(`  ! "${seed.campaign.programSlug}" programı bulunamadı; kampanya programsız oluşturuldu, admin panelinden bağlayın.`);
                }
                const formOwned = await prisma.applicationCampaign.findFirst({ where: { formId: form.id } });
                await prisma.applicationCampaign.create({
                    data: {
                        name: seed.campaign.name,
                        slug: seed.campaign.slug,
                        applicationType: seed.campaign.applicationType,
                        status: 'OPEN',
                        programId: seed.campaign.applicationType === 'TEKMER' ? null : program?.id || null,
                        formId: formOwned ? null : form.id,
                        publicPath: seed.publicPath,
                        allowedApplicantTypes: JSON.stringify(seed.campaign.allowedApplicantTypes),
                        workflowStages: JSON.stringify(defaultWorkflow(seed.campaign.applicationType)),
                        requiredDocuments: JSON.stringify([]),
                        notificationRecipients: JSON.stringify([]),
                        statusTemplateMap: JSON.stringify({}),
                    },
                });
                createdCampaigns++;
                console.log(`  + Kampanya: ${seed.campaign.name}`);
            }
        }
    }

    console.log(`Form Merkezi: ${createdForms} form, ${createdCampaigns} kampanya oluşturuldu (mevcut kayıtlar korundu).`);
    return { createdForms, createdCampaigns };
}

if (require.main === module) {
    seedFormCenter()
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}
