import { PrismaClient } from '@prisma/client';

/**
 * Communication templates used by the email center composer. Create-only: existing
 * templates (possibly edited by staff) are never overwritten. Variables are filled
 * from the linked record; anything that cannot be resolved must be completed by the user.
 */
const COMPOSE_TEMPLATES = [
    {
        templateKey: 'COMPOSE_APPLICATION_RECEIVED',
        name: 'Başvuru alındı bilgilendirmesi',
        subject: '{{program.name}} başvurunuz alındı — {{application.reference}}',
        body: 'Sayın {{person.fullName}},\n\n{{program.name}} kapsamındaki {{application.reference}} numaralı başvurunuz tarafımıza ulaşmış ve değerlendirme sürecine alınmıştır.\n\nSüreçle ilgili güncellemeler bu e-posta adresi üzerinden paylaşılacaktır.\n\nSaygılarımızla,\nİKÜANTS TEKMER',
        variables: ['person.fullName', 'program.name', 'application.reference'],
    },
    {
        templateKey: 'COMPOSE_INTERVIEW_INVITE',
        name: 'Mülakat daveti',
        subject: '{{program.name}} değerlendirme mülakatı daveti',
        body: 'Sayın {{person.fullName}},\n\n{{program.name}} başvurunuz ön değerlendirmeyi geçmiş olup değerlendirme mülakatına davet edilmektesiniz.\n\nMülakat tarihi ve yeri: [tarih, saat ve yeri yazın]\n\nKatılım durumunuzu bu e-postayı yanıtlayarak teyit etmenizi rica ederiz.\n\nSaygılarımızla,\nİKÜANTS TEKMER',
        variables: ['person.fullName', 'program.name'],
    },
    {
        templateKey: 'COMPOSE_RENT_REMINDER',
        name: 'Kira ödeme hatırlatması',
        subject: '{{organization.name}} — {{rent.period}} dönemi kira bilgilendirmesi',
        body: 'Sayın {{person.fullName}},\n\n{{organization.name}} adına {{rent.period}} dönemi kira ödemesinde {{rent.remainingAmount}} tutarında bakiye bulunmaktadır.\n\nSon ödeme tarihi: {{rent.dueDate}}\n\nÖdemenizi gerçekleştirdiyseniz bu mesajı dikkate almayınız.\n\nSaygılarımızla,\nİKÜANTS TEKMER',
        variables: ['person.fullName', 'organization.name', 'rent.period', 'rent.remainingAmount', 'rent.dueDate'],
    },
    {
        templateKey: 'COMPOSE_RESERVATION_CONFIRMED',
        name: 'Rezervasyon onayı',
        subject: 'Rezervasyon talebiniz onaylandı — {{space.name}}',
        body: 'Sayın {{person.fullName}},\n\n{{space.name}} için oluşturduğunuz rezervasyon talebi onaylanmıştır.\n\nTarih: {{reservation.date}}\nSaat: {{reservation.time}}\n\nSaygılarımızla,\nİKÜANTS TEKMER',
        variables: ['person.fullName', 'space.name', 'reservation.date', 'reservation.time'],
    },
    {
        templateKey: 'COMPOSE_MEETING_INVITE',
        name: 'Toplantı daveti',
        subject: 'Toplantı daveti — İKÜANTS TEKMER',
        body: 'Sayın {{person.fullName}},\n\nİKÜANTS TEKMER olarak sizinle bir toplantı planlamak istiyoruz. Uygun olduğunuz gün ve saatleri paylaşabilir misiniz?\n\nSaygılarımızla,\nİKÜANTS TEKMER',
        variables: ['person.fullName'],
    },
];

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

export async function seedEmailTemplates(prisma: PrismaClient) {
    let created = 0;
    for (const t of COMPOSE_TEMPLATES) {
        const exists = await prisma.emailTemplate.findUnique({ where: { templateKey: t.templateKey } });
        if (exists) continue;
        await prisma.emailTemplate.create({
            data: { templateKey: t.templateKey, name: t.name, subject: t.subject, textBody: t.body, htmlBody: escape(t.body), variables: JSON.stringify(t.variables), isSystem: false },
        });
        created++;
    }
    return { created };
}
