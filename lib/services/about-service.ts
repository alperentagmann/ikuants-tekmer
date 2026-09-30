import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface AboutContentData {
    badgeText?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    tekmerNedirTitle?: string;
    tekmerNedirText?: string;
    visionTitle?: string;
    visionText?: string;
    missionTitle?: string;
    missionText?: string;
    features?: Array<{ title: string; desc: string; icon?: string }>;
    stats?: Array<{ value: string; label: string }>;
    ctaTitle?: string;
    ctaText?: string;
    ctaButtonLabel?: string;
    ctaButtonLink?: string;
}

const ABOUT_SETTINGS_KEY = 'content_about_page';

export const AboutService = {
    async getAboutContent(): Promise<AboutContentData> {
        try {
            const setting = await prisma.siteSetting.findUnique({
                where: { key: ABOUT_SETTINGS_KEY },
            });

            if (setting && setting.value) {
                return JSON.parse(setting.value);
            }
        } catch (error) {
            console.error('Error fetching about content:', error);
        }

        // Return default structured content
        return {
            badgeText: 'HAKKIMIZDA',
            title: 'Geleceğin Teknolojilerini Bugünden Şekillendiriyoruz',
            subtitle: 'İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi',
            description: 'İKÜANTS TEKMER, girişimcilik ekosistemine yön veren, yenilikçi fikirleri katma değerli ürün ve hizmetlere dönüştüren dinamik bir inovasyon üssüdür.',
            tekmerNedirTitle: 'TEKMER Nedir?',
            tekmerNedirText: 'TEKMER (Teknoloji Geliştirme Merkezi), KOSGEB iş birliği ve İstanbul Kültür Üniversitesi güvencesiyle kurulan, erken aşama ve büyüme odaklı girişimcilere kuluçka, ortak çalışma alanları, mentörlük, finansmana erişim ve 5746 sayılı kanun kapsamında vergi muafiyetleri sunan ileri teknoloji merkezidir.',
            visionTitle: 'Vizyonumuz',
            visionText: 'Türkiye’nin ve bölgenin en etkin derin teknoloji ve inovasyon ekosistemlerinden biri haline gelerek, küresel ölçekte rekabet edebilen unicorn ve sürdürülebilir teknoloji girişimleri yetiştirmek.',
            missionTitle: 'Misyonumuz',
            missionText: 'Girişimcilere uçtan uca altyapı, akademik ve sektörel mentörlük, yatırımcı ağları ve yasal teşvik destekleri sunarak fikirlerin ticarileşme ve ölçeklenme yolculuklarını hızlandırmak.',
            features: [
                { title: 'Modern Ofis & Stüdyolar', desc: 'Podcast, AR/VR ve sanal çekim stüdyoları ile tam donanımlı çalışma alanları.' },
                { title: '20+ Kıdemli Mentör', desc: 'Alanında uzman lider mentörlerle birebir danışmanlık ve strateji geliştirme.' },
                { title: 'Vergi ve Teşvik Avantajları', desc: '5746 sayılı Kanun kapsamında stopaj, SGK, gümrük ve Ar-Ge indirimleri.' },
                { title: 'Yatırımcı ve Demo Day', desc: 'Melek yatırım ağları ve fonlarla girişimcileri doğrudan buluşturan köprü.' },
            ],
            stats: [
                { value: '23+', label: 'Aktif Girişim' },
                { value: '20+', label: 'Uzman Mentör' },
                { value: '1.200 m²', label: 'Modern Altyapı' },
                { value: '5+', label: 'Destek Programı' },
            ],
            ctaTitle: 'Siz de Bu Ekosistemin Bir Parçası Olun',
            ctaText: 'Fikrinizi veya şirketinizi İKÜANTS TEKMER bünyesine taşıyın, geleceği birlikte inşa edelim.',
            ctaButtonLabel: 'Hemen Başvur',
            ctaButtonLink: '/basvuru',
        };
    },

    async updateAboutContent(data: AboutContentData, actor?: any) {
        const jsonValue = JSON.stringify(data);

        const setting = await prisma.siteSetting.upsert({
            where: { key: ABOUT_SETTINGS_KEY },
            update: {
                value: jsonValue,
                group: 'PAGE_ABOUT',
                description: 'Hakkımızda sayfası içerik yönetimi',
            },
            create: {
                key: ABOUT_SETTINGS_KEY,
                value: jsonValue,
                group: 'PAGE_ABOUT',
                description: 'Hakkımızda sayfası içerik yönetimi',
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'AboutContent',
            entityId: setting.id,
            newValues: data,
        });

        return data;
    }
};
