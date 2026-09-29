import { prisma } from '@/lib/prisma';

export interface ImpactAnalysisResult {
    entityType: string;
    entityId: string;
    entityName: string;
    totalAffectedCount: number;
    impacts: Array<{
        targetType: string;
        targetId: string;
        targetTitle: string;
        relationship: string;
    }>;
}

export class ImpactAnalysisService {
    /**
     * Analyze potential impact before renaming or archiving an entity
     */
    static async analyzeImpact(entityType: string, entityId: string): Promise<ImpactAnalysisResult> {
        const impacts: Array<{ targetType: string; targetId: string; targetTitle: string; relationship: string }> = [];
        let entityName = 'Bilinmeyen Kayıt';

        if (entityType.toUpperCase() === 'PROGRAM') {
            const program = await prisma.program.findUnique({
                where: { id: entityId },
                include: {
                    trainings: true,
                    applications: true,
                    mentorPrograms: { include: { mentor: true } },
                    projects: true,
                    tasks: true,
                },
            });

            if (program) {
                entityName = program.name;

                for (const t of program.trainings) {
                    impacts.push({ targetType: 'Training', targetId: t.id, targetTitle: t.title, relationship: 'Müfredat Eğitimi' });
                }
                for (const a of program.applications) {
                    impacts.push({ targetType: 'Application', targetId: a.id, targetTitle: a.applicationNumber, relationship: 'Kayıtlı Başvuru' });
                }
                for (const mp of program.mentorPrograms) {
                    impacts.push({ targetType: 'Mentor', targetId: mp.mentor.id, targetTitle: `${mp.mentor.name} ${mp.mentor.surname}`, relationship: 'Eşleşen Mentör' });
                }
                for (const p of program.projects) {
                    impacts.push({ targetType: 'Project', targetId: p.id, targetTitle: p.title, relationship: 'Bağlı Proje' });
                }
            }
        } else if (entityType.toUpperCase() === 'MENTOR') {
            const mentor = await prisma.mentor.findUnique({
                where: { id: entityId },
                include: {
                    mentorPrograms: { include: { program: true } },
                    mentorSessions: true,
                    trainings: { include: { training: true } },
                },
            });

            if (mentor) {
                entityName = `${mentor.name} ${mentor.surname}`;

                for (const mp of mentor.mentorPrograms) {
                    impacts.push({ targetType: 'Program', targetId: mp.program.id, targetTitle: mp.program.name, relationship: 'Görevli Olduğu Program' });
                }
                for (const s of mentor.mentorSessions) {
                    impacts.push({ targetType: 'MentorSession', targetId: s.id, targetTitle: s.topic, relationship: 'Planlı/Tamamlanan Seans' });
                }
                for (const ti of mentor.trainings) {
                    impacts.push({ targetType: 'Training', targetId: ti.training.id, targetTitle: ti.training.title, relationship: 'Eğitmenlik' });
                }
            }
        } else if (entityType.toUpperCase() === 'ENTREPRENEUR') {
            const entrepreneur = await prisma.entrepreneur.findUnique({
                where: { id: entityId },
                include: {
                    mentorSessions: true,
                    projects: true,
                    tasks: true,
                },
            });

            if (entrepreneur) {
                entityName = entrepreneur.name;

                for (const s of entrepreneur.mentorSessions) {
                    impacts.push({ targetType: 'MentorSession', targetId: s.id, targetTitle: s.topic, relationship: 'Mentorluk Görüşmesi' });
                }
                for (const p of entrepreneur.projects) {
                    impacts.push({ targetType: 'Project', targetId: p.id, targetTitle: p.title, relationship: 'Hibe/Proje Kaydı' });
                }
                for (const t of entrepreneur.tasks) {
                    impacts.push({ targetType: 'Task', targetId: t.id, targetTitle: t.title, relationship: 'İlişkili Görev' });
                }
            }
        }

        return {
            entityType,
            entityId,
            entityName,
            totalAffectedCount: impacts.length,
            impacts,
        };
    }
}
