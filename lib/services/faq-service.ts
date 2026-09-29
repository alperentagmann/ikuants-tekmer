import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const FaqService = {
    async getPublicFaqs() {
        try {
            const list = await prisma.faqItem.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
            });
            if (list.length > 0) return list;
        } catch {
            // fallback
        }

        // 5 Core Quality Default FAQs based on actual TEKMER structure
        return [
            {
                id: 'faq-1',
                question: 'İKÜANTS TEKMER nedir ve hangi girişimcilere hizmet verir?',
                answer: 'İKÜANTS TEKMER, İstanbul Kültür Üniversitesi bünyesinde KOSGEB iş birliğiyle kurulmuş bir Teknoloji Geliştirme Merkezidir. Ar-Ge, yazılım, yapay zekâ, sağlık teknolojileri, siber güvenlik, havacılık ve derin teknoloji odaklı erken aşama ve büyüme aşamasındaki teknoloji girişimcilerine kuluçka, mentörlük, ofis ve mevzuat destekleri sunar.',
                category: 'GENEL',
                isActive: true,
                sortOrder: 1,
            },
            {
                id: 'faq-2',
                question: 'Kimler başvuru yapabilir ve başvuru kriterleri nelerdir?',
                answer: 'Teknoloji tabanlı bir iş fikri, prototipi veya ticarileşme aşamasında ürünü olan bireysel girişimciler, akademisyenler, üniversite öğrencileri ve tüzel kişiliğini kurmuş teknoloji şirketleri başvuru yapabilir. Başvurular kurul değerlendirmesi ve jüri puanlaması sürecine tabidir.',
                category: 'BASVURU',
                isActive: true,
                sortOrder: 2,
            },
            {
                id: 'faq-3',
                question: 'Programlara nasıl başvurulur ve süreç nasıl işler?',
                answer: 'Başvurular web sitemizdeki başvuru formları (ANTSPARK Ön Kuluçka veya ANTSFIRE Kuluçka) üzerinden online olarak alınır. Ön değerlendirmeyi geçen girişimciler jüri sunumuna davet edilir ve kabul edilen ekipler program başlangıç oryantasyonuna alınır.',
                category: 'BASVURU',
                isActive: true,
                sortOrder: 3,
            },
            {
                id: 'faq-4',
                question: 'Mentörlük ve birebir danışmanlık süreçleri nasıl planlanır?',
                answer: 'Programa kabul edilen girişimcilerin ihtiyaç analizi yapılır; finans, fikri mülkiyet, regülasyon, büyüme ve teknoloji alanlarında ekosistemimizdeki 20+ kıdemli mentörümüzle eşleştirilir ve periyodik takip oturumları gerçekleştirilir.',
                category: 'MENTORLUK',
                isActive: true,
                sortOrder: 4,
            },
            {
                id: 'faq-5',
                question: '5746 sayılı Kanun ve TEKMER kapsamında hangi vergi ve teşvik avantajları sağlanır?',
                answer: 'TEKMER bünyesinde yer alan Ar-Ge ve yazılım projeleri; Gelir Vergisi stopajı teşviki, Ar-Ge ve tasarım indirimi, Sigorta primi desteği, Damga vergisi istisnası ve Gümrük vergisi muafiyeti gibi yasal teşviklerden mevzuata uygun olarak faydalanabilmektedir.',
                category: 'DESTEKLER',
                isActive: true,
                sortOrder: 5,
            },
        ];
    },

    async getAdminFaqs() {
        return prisma.faqItem.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    },

    async createFaq(data: { question: string; answer: string; category?: string; sortOrder?: number }, actor?: any) {
        const item = await prisma.faqItem.create({
            data: {
                question: data.question,
                answer: data.answer,
                category: data.category || 'GENEL',
                sortOrder: data.sortOrder ?? 0,
            },
        });
        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'FaqItem',
            entityId: item.id,
            newValues: item,
        });
        return item;
    },

    async updateFaq(id: string, data: Partial<{ question: string; answer: string; category: string; isActive: boolean; sortOrder: number }>, actor?: any) {
        const item = await prisma.faqItem.update({
            where: { id },
            data,
        });
        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'FaqItem',
            entityId: id,
            newValues: item,
        });
        return item;
    },

    async deleteFaq(id: string, actor?: any) {
        const item = await prisma.faqItem.delete({ where: { id } });
        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'FaqItem',
            entityId: id,
        });
        return item;
    },
};
