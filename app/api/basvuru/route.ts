import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.json();

        const programName = formData.programName || null;
        const applicantName = formData.fullName || formData.founderName || 'Başvuru Sahibi';
        const companyName = formData.companyName || formData.projectName || null;
        const email = (formData.email || formData.founderContact || '').toLowerCase().trim();
        const phone = formData.phone || formData.founderPhone || null;
        const tcNumber = formData.tcNumber || formData.tc_no || null;

        if (!email) {
            return NextResponse.json({ success: false, message: 'Geçerli bir e-posta adresi gereklidir.' }, { status: 400 });
        }

        // Mask TC Number if provided
        let tcNumberMasked: string | null = null;
        let tcNumberEncrypted: string | null = null;
        if (tcNumber && tcNumber.length >= 11) {
            tcNumberMasked = `${tcNumber.substring(0, 3)}******${tcNumber.substring(9)}`;
            tcNumberEncrypted = Buffer.from(tcNumber).toString('base64'); // Obfuscation
        }

        // Match Program if exists
        const matchedProgram = await prisma.program.findFirst({
            where: {
                OR: [
                    { name: { contains: programName, mode: 'insensitive' } },
                    { slug: { contains: programName.toLowerCase().replace(/\s+/g, '-') } },
                ],
            },
        });

        // Get default active Form Version
        let formVersion = await prisma.formVersion.findFirst({
            where: { status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
        });

        if (!formVersion) {
            // Create default form version if none exists
            let form = await prisma.form.findFirst();
            if (!form) {
                form = await prisma.form.create({
                    data: {
                        title: 'Genel Girişimcilik Başvuru Formu',
                        slug: 'genel-basvuru-formu',
                        formType: 'APPLICATION',
                        isPublished: true,
                    },
                });
            }
            formVersion = await prisma.formVersion.create({
                data: {
                    formId: form.id,
                    versionNumber: 1,
                    schemaSnapshot: JSON.stringify({ title: 'Standart Form' }),
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                },
            });
        }

        // Generate sequential application number with year prefix
        const year = new Date().getFullYear();
        const count = await prisma.application.count();
        const applicationNumber = `ANTS-${year}-${String(count + 1).padStart(6, '0')}`;
        const submissionNumber = `SUB-${year}-${String(count + 1).padStart(6, '0')}`;

        // Atomic Transaction
        const { application } = await prisma.$transaction(async (tx) => {
            const submission = await tx.submission.create({
                data: {
                    formVersionId: formVersion!.id,
                    submissionNumber,
                    status: 'SUBMITTED',
                    rawSnapshot: JSON.stringify(formData),
                },
            });

            const app = await tx.application.create({
                data: {
                    applicationNumber,
                    formVersionId: formVersion!.id,
                    submissionId: submission.id,
                    programId: matchedProgram?.id || null,
                    applicantName,
                    companyName,
                    email,
                    phone,
                    tcNumberMasked,
                    tcNumberEncrypted,
                    status: 'NEW',
                    stage: 'PIPELINE',
                },
            });

            await tx.applicationStatusHistory.create({
                data: {
                    applicationId: app.id,
                    fromStatus: 'NONE',
                    toStatus: 'NEW',
                    reason: 'Başvuru form üzerinden başarıyla alındı.',
                },
            });

            await tx.activityTimeline.create({
                data: {
                    entityType: 'Application',
                    entityId: app.id,
                    title: 'Yeni Başvuru Alındı',
                    description: `${applicantName} tarafından ${programName} programı için başvuru yapıldı.`,
                    eventType: 'STATUS_CHANGE',
                },
            });

            await tx.notification.create({
                data: {
                    title: 'Yeni Başvuru Alındı',
                    message: `${applicantName} tarafından yeni bir ${programName} başvurusu yapıldı (${applicationNumber}).`,
                    notificationType: 'NEW_APPLICATION',
                    targetUrl: `/admin/basvurular/${app.id}`,
                },
            });

            return { application: app };
        });

        // Trigger emails via Outbox Engine (asynchronous & safe from serverless timeouts)
        await EmailOutboxService.triggerApplicationSubmittedEmails({
            id: application.id,
            applicationNumber: application.applicationNumber,
            applicantName: application.applicantName,
            email: application.email,
            programName: matchedProgram?.name || programName,
        });

        // Try to process outbox immediately
        EmailOutboxService.processPendingEmails(5).catch((err) => console.error('Immediate outbox process error:', err));

        return NextResponse.json({
            success: true,
            applicationNumber: application.applicationNumber,
            message: 'Başvurunuz başarıyla sisteme kaydedildi ve onay e-postası gönderildi!',
        });
    } catch (error: any) {
        console.error('Form submission error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Başvuru sırasında bir hata oluştu. Lütfen tekrar deneyiniz.' },
            { status: 500 }
        );
    }
}
