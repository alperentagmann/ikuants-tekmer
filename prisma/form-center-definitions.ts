/**
 * Initial Form Center content.
 *
 * These definitions reproduce, question by question, the public forms that were
 * previously hardcoded in React components (same labels, options, required flags,
 * conditions and step structure). They are only used to create the forms once;
 * afterwards the forms are managed from Admin > Form Merkezi and the seed never
 * overwrites them.
 */
import type { FormFieldDefinition, FormSectionDefinition, FieldUiConfig } from '../lib/forms/schema';

type FieldOpts = Partial<FormFieldDefinition> & { icon?: string; rows?: number; ui?: FieldUiConfig; options?: never };

function opts(values: string[]): { label: string; value: string; order: number; active: boolean }[] {
    return values.map((v, i) => ({ label: v, value: v, order: i, active: true }));
}

function labeled(pairs: [string, string][]): { label: string; value: string; order: number; active: boolean }[] {
    return pairs.map(([value, label], i) => ({ label, value, order: i, active: true }));
}

let order = 0;
function field(step: number, fieldKey: string, label: string, fieldType: string, o: FieldOpts = {}, options?: ReturnType<typeof opts>): FormFieldDefinition {
    const { icon, rows, ui, ...rest } = o;
    const uiConfig: FieldUiConfig = { ...(ui || {}) };
    if (icon) uiConfig.icon = icon;
    if (rows) uiConfig.rows = rows;
    return {
        fieldKey,
        label,
        fieldType,
        isRequired: false,
        width: 'FULL',
        stepNumber: step,
        sortOrder: order++,
        options: options || null,
        uiConfig: Object.keys(uiConfig).length ? uiConfig : null,
        ...rest,
    };
}

const req = { isRequired: true };
const half = { width: 'HALF' as const };
const reqHalf = { isRequired: true, width: 'HALF' as const };
const when = (fieldKey: string, value: string) => ({ conditionalRules: { logic: 'ALL' as const, rules: [{ fieldKey, operator: 'equals' as const, value }] } });

/** KVKK consent statements as they appeared under the KvkkCheckboxes component. */
export type KvkkKey = 'kvkk1' | 'kvkk2' | 'kvkk3' | 'kvkk4';

function kvkkConsents(step: number, keys: KvkkKey[]): FormFieldDefinition[] {
    const meta: Record<KvkkKey, { kind: FieldUiConfig['consentKind']; suffix: string; statement: string }> = {
        kvkk1: { kind: 'PRIVACY_NOTICE', suffix: "'ni okudum ve kabul ediyorum.", statement: 'Kişisel Verilerin İşlenmesi Aydınlatma Metni\'ni okudum ve kabul ediyorum.' },
        kvkk2: { kind: 'EXPLICIT_CONSENT', suffix: "'nu okudum ve kabul ediyorum.", statement: 'Kişisel Verilerin Korunması Açık Rıza Formu\'nu okudum ve kabul ediyorum.' },
        kvkk3: { kind: 'MARKETING', suffix: "'ni okudum ve kabul ediyorum.", statement: 'Ticari Elektronik İleti Gönderilmesine İlişkin Onay Metni\'ni okudum ve kabul ediyorum.' },
        kvkk4: { kind: 'PHOTO_VIDEO', suffix: "'ni okudum ve onaylıyorum.", statement: 'Etkinlik Süresince Fotoğraf ve Video Çekimine İlişkin Onay Metni\'ni okudum ve onaylıyorum.' },
    };
    return [
        field(step, 'kvkk_heading', 'Lütfen aşağıdaki metinleri okuyup onaylayınız:', 'HEADING'),
        ...keys.map((key) =>
            field(step, `consent_${key}`, meta[key].statement, 'CONSENT', {
                isRequired: true,
                ui: { consentKind: meta[key].kind, kvkkTextId: `__kvkk:${key}`, linkSuffix: meta[key].suffix },
            })
        ),
    ];
}

export interface FormSeed {
    slug: string;
    title: string;
    formType: string;
    theme: string;
    publicPath: string;
    description?: string;
    submitLabel?: string;
    successMessage: string;
    sections: FormSectionDefinition[];
    fields: FormFieldDefinition[];
    campaign?: {
        slug: string;
        name: string;
        applicationType: string;
        programSlug?: string;
        allowedApplicantTypes: string[];
    };
}

// ---------------------------------------------------------------------------
// ANTSPARK — program application (components/sections/AntsApplication.tsx)
// ---------------------------------------------------------------------------
order = 0;
const antspark: FormSeed = {
    slug: 'antspark-basvuru-formu',
    title: 'ANTSPARK Ön Kuluçka Programı Başvuru Formu',
    formType: 'PROGRAM_APPLICATION',
    theme: 'antspark',
    publicPath: '/antspark-basvuru',
    submitLabel: 'Başvuruyu Gönder',
    successMessage: 'ANTSPARK Ön Kuluçka Programı başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.',
    sections: [
        { stepNumber: 1, title: 'Kişisel Bilgiler' },
        { stepNumber: 2, title: 'Proje Bilgileri' },
        { stepNumber: 3, title: 'Ekip Bilgileri' },
        { stepNumber: 4, title: 'Onaylar ve Tamamlama' },
    ],
    fields: [
        field(1, 'projectName', 'Girişiminizin Adı', 'TEXT', { ...reqHalf, placeholder: 'Örn: Girişim Adı', ui: { systemKey: 'company_name' } }),
        field(1, 'fullName', 'Adınız Soyadınız', 'TEXT', { ...reqHalf, placeholder: 'Örn: Ahmet Yılmaz', ui: { systemKey: 'applicant_name' } }),
        field(1, 'projectRole', 'Projedeki Göreviniz', 'SELECT', reqHalf, opts(['Kurucu Ortak', 'CEO', 'CTO', 'COO', 'Diğer'])),
        field(1, 'phone', 'Telefon Numaranız', 'PHONE', { ...reqHalf, placeholder: '+90 5XX XXX XX XX' }),
        field(1, 'email', 'E-posta Adresiniz', 'EMAIL', { ...reqHalf, placeholder: 'ornek@email.com' }),
        field(1, 'birthDate', 'Doğum Tarihiniz', 'DATE', half),
        field(1, 'gender', 'Cinsiyet', 'SELECT', half, opts(['Erkek', 'Kadın', 'Belirtmek İstemiyorum'])),
        field(1, 'education', 'Eğitim Durumunuz', 'SELECT', half, opts(['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora'])),
        field(1, 'faculty', 'Fakülte / Yüksekokul', 'TEXT', { ...half, placeholder: 'Örn: Mühendislik Fakültesi' }),
        field(1, 'department', 'Bölüm/Program', 'TEXT', { ...half, placeholder: 'Örn: Bilgisayar Mühendisliği' }),
        field(1, 'city', 'Şehir', 'TEXT', { ...half, placeholder: 'Örn: İstanbul' }),
        field(1, 'linkedin', 'LinkedIn Hesabınız', 'URL', { ...half, placeholder: 'https://linkedin.com/in/...' }),

        field(2, 'sectors', 'Projenizin İlgili Olduğu Sektör(ler)', 'TEXT', { ...req, placeholder: 'Örn: Teknoloji, Fintech, Eğitim' }),
        field(2, 'tekmerThemes', 'İKÜ ANTS TEKMER temalarıyla hangi sektör ile buluşmaktasınız?', 'TEXT', { placeholder: 'Örn: Yenilikçi Teknolojiler, Geliştirme, Sinerji' }),
        field(2, 'projectSummary', 'Projenizi Bir Cümle ile Özetleyiniz', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Projenizi tek cümlede açıklayın...' }),
        field(2, 'problemToSolve', 'Girişiminiz ile Çözmeyi Planladığınız Problem', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Hangi problemi çözmeyi hedefliyorsunuz?' }),
        field(2, 'whySolveProblem', 'Bu problemi neden çözmek istediniz?', 'TEXTAREA', { rows: 2, placeholder: 'Motivasyonunuz nedir?' }),
        field(2, 'projectStage', 'Girişiminizin Aşaması', 'SELECT', reqHalf, opts(['Fikir Aşaması', 'Prototip Aşaması', 'MVP Aşaması', 'Büyüme Aşaması'])),
        field(2, 'hasMVP', "İlk MVP'niz Çıktı mı?", 'SELECT', half, opts(['Evet', 'Hayır'])),
        field(2, 'solutionDescription', 'Ürününüz/Hizmetiniz hangi sorunu nasıl çözüyor?', 'TEXTAREA', { ...req, rows: 4, placeholder: 'Teknik altyapı dahil detaylı açıklama...' }),
        field(2, 'targetAudience', 'Müşteri / Hedef Kitleniz Kimdir?', 'TEXTAREA', { rows: 2, placeholder: 'Hedef kitlenizi tanımlayın...' }),
        field(2, 'marketingStrategy', 'Pazarlama Stratejiniz Nedir?', 'TEXTAREA', { rows: 3, placeholder: 'Pazarlama planınızı açıklayın...' }),
        field(2, 'projectWebsite', 'Girişiminizin Web Sitesi / LinkedIn Hesabı', 'TEXT', { placeholder: "URL veya 'Yok'" }),
        field(2, 'yearlyGoals', 'Girişiminizin 1 Yıllık Hedefleri Nelerdir?', 'TEXTAREA', { rows: 3, placeholder: '1 yıllık hedeflerinizi listeleyin...' }),
        field(2, 'previousCompetitions', 'Daha Önce Başka Bir Yarışmaya Katıldınız mı?', 'SELECT', half, opts(['Evet', 'Hayır'])),
        field(2, 'hasInvestment', 'Girişiminizde yatırım aldınız mı?', 'SELECT', half, opts(['Evet', 'Hayır'])),
        field(2, 'intellectualProperty', 'Girişiminizin FSMH (Fikri Mülkiyet) Süreçleri', 'TEXT', { placeholder: 'Patent, marka tescili vb.' }),
        field(2, 'differentiators', 'Sizleri diğer projelerden ayıran özellikler nelerdir?', 'TEXTAREA', { rows: 3, placeholder: 'Rekabet avantajlarınızı açıklayın...' }),

        field(3, 'teamSize', 'Kurucu Ortaklar Harici Ekipteki Kişi Sayısı', 'NUMBER', { placeholder: '0', validationRules: { min: 0 } }),
        field(3, 'founders', 'Kurucu Ortakların Bilgileri', 'TEXTAREA', {
            ...req,
            rows: 4,
            helpText: 'Ekipteki rolleri, isim-soyisim ve e-posta adreslerini belirtiniz.',
            placeholder: 'Örn:\nAhmet Yılmaz - Kurucu Ortak - ahmet@email.com\nMehmet Demir - CTO - mehmet@email.com',
        }),
        field(3, 'hasTechnicalFounder', 'Teknik/AR-GE yetkinliğine sahip kurucu ortak var mı?', 'SELECT', {}, opts(['Evet', 'Hayır'])),
        field(3, 'weeklyHours', 'Şu an girişime ne kadar zaman ayırıyorsunuz?', 'SELECT', {}, opts(['Haftada 10 saatten az', 'Haftada 10-20 saat', 'Haftada 20-40 saat', 'Tam zamanlı'])),
        field(3, 'mentorshipAreas', 'Mentorluk almak istediğiniz alanlar', 'TEXT', { placeholder: 'Örn: Fikri mülkiyet, iş geliştirme, dijital pazarlama, yatırım' }),

        field(4, 'privacyConsent', "Kişisel verilerin işlenmesinden önce Aydınlatma Metni'ni okuduğumu, anladığımı ve kişisel verilerime ilişkin olarak bilgilendirildiğimi kabul ederim.", 'CONSENT', {
            ...req,
            ui: { consentKind: 'PRIVACY_NOTICE', kvkkTextId: '__kvkk:kvkk1', linkLabel: 'Aydınlatma Metni', linkSuffix: "'ni okuduğumu, anladığımı ve kişisel verilerime ilişkin olarak bilgilendirildiğimi kabul ederim." },
        }),
        field(4, 'dataProcessingConsent', "Aydınlatma'da belirtilen amaçlarla kişisel verilerimin işlenmesine açıkça izin verdiğimi kabul ve beyan ederim.", 'CONSENT', { ...req, ui: { consentKind: 'EXPLICIT_CONSENT' } }),
        field(4, 'communicationConsent', 'Ticari elektronik iletilerin gönderilmesine ilişkin İletişim Onay Metni kapsamında T.C. İstanbul Kültür Üniversitesi tarafından ticari elektronik ileti gönderilmesine rıza ve onay verdiğimi bildiririm.', 'CONSENT', { ui: { consentKind: 'MARKETING' } }),
        field(4, 'communicationChannels', 'İletişim Onayı (Tercih Edin)', 'CHECKBOX_GROUP', { ui: { consentChannels: true } }, opts(['SMS', 'Telefon', 'E-posta'])),
        field(4, 'pitchDeckNote', 'Not:', 'DESCRIPTION', { helpText: 'Pitch Deck (Sunum) dosyanızı başvuru onaylandıktan sonra e-posta ile gönderebilirsiniz.' }),
    ],
    campaign: { slug: 'antspark-basvuru', name: 'ANTSPARK Ön Kuluçka Programı Başvurusu', applicationType: 'PROGRAM', programSlug: 'antspark-on-kulucka', allowedApplicantTypes: ['PERSON', 'TEAM'] },
};

// ---------------------------------------------------------------------------
// ANTSFire — program application (components/sections/AntsFireApplication.tsx)
// ---------------------------------------------------------------------------
order = 0;
const antsfire: FormSeed = {
    slug: 'antsfire-basvuru-formu',
    title: 'ANTSFire Kuluçka Programı Başvuru Formu',
    formType: 'PROGRAM_APPLICATION',
    theme: 'antsfire',
    publicPath: '/antsfire-basvuru',
    submitLabel: 'Başvuruyu Tamamla',
    successMessage: 'ANTSFire Kuluçka Programı başvurunuz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    sections: [
        { stepNumber: 1, title: 'Şirket ve Kurucu Bilgileri' },
        { stepNumber: 2, title: 'Ürün ve Ar-Ge' },
        { stepNumber: 3, title: 'Pazar ve Rekabet' },
        { stepNumber: 4, title: 'Finans ve Dosyalar' },
        { stepNumber: 5, title: 'İhtiyaç Analizi' },
    ],
    fields: [
        field(1, 'hasCompany', 'Şirketiniz Var Mı?', 'RADIO', req, opts(['Evet', 'Hayır'])),
        field(1, 'companyName', 'Firma Adı/Girişim Adı', 'TEXT', { ...reqHalf, placeholder: 'Resmi Ünvan', ...when('hasCompany', 'Evet'), ui: { systemKey: 'company_name' } }),
        field(1, 'companyTitle', 'Firma Ünvanı', 'TEXT', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'foundationYear', 'Firma Kuruluş Tarihi', 'DATE', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'mersisNo', 'Firma Mersis NO', 'TEXT', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'tradeRegistryNo', 'Ticaret Sicil No', 'TEXT', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'partnersNames', 'Ortakların Adı', 'TEXT', { ...half, placeholder: 'Ahmet Yılmaz, Ayşe Demir', ...when('hasCompany', 'Evet') }),
        field(1, 'website', 'Firma Web Sitesi', 'URL', { ...half, placeholder: 'https://', ...when('hasCompany', 'Evet') }),
        field(1, 'companyEmail', 'Firma E-Mail', 'EMAIL', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'companyPhone', 'Firma Telefon', 'PHONE', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'taxNumber', 'Firma VKN.', 'TEXT', { ...reqHalf, placeholder: '10 Haneli', ...when('hasCompany', 'Evet') }),
        field(1, 'taxOffice', 'Firma V.D. (Vergi Dairesi)', 'TEXT', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'naceCode', 'Nace Kodu', 'TEXT', { ...half, ...when('hasCompany', 'Evet') }),
        field(1, 'companyAddress', 'Firma Adresi', 'TEXTAREA', { rows: 2, ...when('hasCompany', 'Evet') }),
        field(1, 'sector', 'Sektör', 'SELECT', reqHalf, opts(['SaaS', 'Fintech', 'Healthtech', 'Deeptech', 'Agritech', 'Gaming', 'E-ticaret', 'Diğer'])),
        field(1, 'employeeCount', 'Çalışan Sayısı', 'NUMBER', { ...reqHalf, validationRules: { min: 0 } }),
        field(1, 'tekmerClusters', 'TEKMER Küme (Çoklu Seçim)', 'CHECKBOX_GROUP', { ...req, validationRules: { minSelections: 1 } }, opts([
            'Yapay Zeka (AI)', 'Bulut Bilişim (Cloud)', 'Mobilite', 'Gömülü Sistemler', 'Yeni Medya', 'Fintech', 'Healthtech', 'Oyun', 'Siber Güvenlik', 'Diğer',
        ])),
        field(1, 'founderHeading', 'Yetkili Kişi Bilgileri', 'HEADING'),
        field(1, 'founderName', 'Yetkili Kişi', 'TEXT', { ...reqHalf, ui: { systemKey: 'applicant_name' } }),
        field(1, 'tcNo', 'T.C. Kimlik No', 'TC_NO', reqHalf),
        field(1, 'birthDate', 'Doğum Tarihi', 'DATE', reqHalf),
        field(1, 'educationStatus', 'Eğitim Durumu', 'SELECT', reqHalf, opts(['Önlisans', 'Lisans', 'Yüksek Lisans', 'Doktora', 'Diğer'])),
        field(1, 'founderPhone', 'Telefon', 'PHONE', { ...reqHalf, placeholder: '+90 ...' }),
        field(1, 'founderContact', 'E-Mail', 'EMAIL', { ...reqHalf, placeholder: 'mail@ornek.com', ui: { systemKey: 'applicant_email' } }),
        field(1, 'founderRole', 'Rol', 'SELECT', reqHalf, opts(['CEO', 'CTO', 'COO', 'Kurucu Ortak'])),
        field(1, 'weeklyHours', 'Haftalık Zaman', 'SELECT', reqHalf, labeled([['10-20 Saat', '10-20 Saat'], ['20-30 Saat', '20-30 Saat'], ['30+ Saat', '30+ Saat (Tam Zamanlı)']])),

        field(2, 'productShortDesc', 'Ürün Kısa Tanımı (150-300 karakter)', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Ürününüzü bir asansör konuşması kıvamında anlatın.', validationRules: { maxLength: 300 } }),
        field(2, 'problemDefinition', 'Problem Tanımı', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Hangi sorunu çözüyorsunuz?' }),
        field(2, 'solutionDifference', 'Çözümün Farklılığı', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Rakiplerden ve mevcut çözümlerden farkınız ne?' }),
        field(2, 'trlLevel', 'TRL Seviyesi', 'SELECT', reqHalf, labeled([['1-3', 'TRL 1-3 (Fikir/Konsept)'], ['4-5', 'TRL 4-5 (Prototip)'], ['6-7', 'TRL 6-7 (MVP/Demo)'], ['8-9', 'TRL 8-9 (Ticarileşme)']])),
        field(2, 'demoLink', 'Demo / MVP Linki', 'URL', { ...half, placeholder: 'https://' }),
        field(2, 'randdProjectSummary', 'Ar-Ge Projesi Özeti', 'TEXTAREA', { ...req, rows: 4, placeholder: 'Projenin Ar-Ge niteliği, yöntem, beklenen çıktılar ve takvim...' }),

        field(3, 'targetCustomer', 'Hedef Müşteri (ICP)', 'TEXT', { ...reqHalf, placeholder: 'İdeal müşteri profiliniz kim?' }),
        field(3, 'marketSize', 'Pazar Büyüklüğü', 'TEXT', { ...reqHalf, placeholder: 'TAM, SAM, SOM değerlerini giriniz' }),
        field(3, 'competitors', 'Rakipler', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Başlıca 3-5 rakibiniz' }),
        field(3, 'gtmPlan', 'Pazara Giriş Stratejisi (GTM)', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Satış kanalları, pazarlama, dağıtım...' }),

        field(4, 'hasPilot', 'Pilot / LOI Var Mı?', 'SELECT', reqHalf, labeled([['Yok', 'Yok'], ['Var', 'Var (Pilot/LOI)']])),
        field(4, 'revenueStatus', 'Aylık Gelir Durumu', 'SELECT', reqHalf, labeled([['0', '0 (Gelir Yok)'], ['1-50k', '1 TL - 50.000 TL'], ['50k+', '50.000 TL +']])),
        field(4, 'runway', 'Runway (Kasa Ömrü)', 'SELECT', reqHalf, opts(['0-3 Ay', '3-6 Ay', '6-12 Ay', '12+ Ay'])),
        field(4, 'investmentHistory', 'Önceki Yatırım/Hibe', 'TEXT', { ...half, placeholder: 'TÜBİTAK vb.' }),
        field(4, 'financialSummary', 'Son 12 Ay Finansal Özet', 'TEXTAREA', { rows: 2, placeholder: 'Tahmini gelir/gider özeti...' }),
        field(4, 'pitchDeckLink', 'Pitch Deck Linki (PDF)', 'URL', { ...reqHalf, placeholder: 'https://...' }),
        field(4, 'founderCvLink', "Kurucu CV'leri Linki", 'URL', { ...reqHalf, placeholder: 'https://...' }),

        field(5, 'bottlenecks', 'En Kritik 3 Darboğazınız', 'TEXTAREA', { ...req, rows: 3, placeholder: '1. ...\n2. ...\n3. ...' }),
        field(5, 'goals', '12 Ay Sonunda 3 Ana Hedef', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Ölçülebilir hedefler giriniz.' }),
        field(5, 'selectedModules', 'İhtiyaç Duyulan Modüller (Çoklu Seçim)', 'CHECKBOX_GROUP', { ...req, validationRules: { minSelections: 1 }, ui: { appearance: 'module-cards' } }, labeled([
            ['M01', 'İş Modeli ve Strateji'], ['M02', 'Müşteri Keşfi ve Doğrulama'], ['M03', 'B2B Satış Sistemi'], ['M04', 'Dijital Pazarlama ve Büyüme'],
            ['M05', 'Finans ve Nakit Akışı'], ['M06', 'Hukuk, Sözleşmeler ve IP'], ['M07', 'Ürün ve Hedef Yol Haritası'], ['M08', 'Regülasyon ve Uygunluk'],
            ['M09', 'Pitch Deck ve Yatırım'], ['M10', 'Data Room Hazırlığı'], ['M11', 'Operasyonel Ölçekleme'], ['M12', 'Liderlik ve Ekip Yönetimi'],
        ])),
        ...kvkkConsents(5, ['kvkk1', 'kvkk2', 'kvkk3', 'kvkk4']),
        field(5, 'termsConsent', 'Çıkar çelişkisi bulunmadığını ve paylaştığım bilgilerin doğruluğunu beyan ederim.', 'CONSENT', { ...req, ui: { consentKind: 'TERMS' } }),
    ],
    campaign: { slug: 'antsfire-basvuru', name: 'ANTSFire Kuluçka Programı Başvurusu', applicationType: 'PROGRAM', programSlug: 'antsfire-kulucka', allowedApplicantTypes: ['ENTREPRENEUR', 'ORGANIZATION'] },
};

// ---------------------------------------------------------------------------
// Glow Up Ideathon (app/glowup-basvuru/page.tsx)
// ---------------------------------------------------------------------------
order = 0;
const glowup: FormSeed = {
    slug: 'glowup-ideathon-basvuru-formu',
    title: 'Glow Up Ideathon Başvuru Formu',
    formType: 'PROGRAM_APPLICATION',
    theme: 'glowup',
    publicPath: '/glowup-basvuru',
    submitLabel: 'Başvuruyu Gönder',
    successMessage: 'Glow Up Ideathon başvurunuz başarıyla alındı. Başvuru sonuçları e-posta ile bildirilecektir.',
    sections: [
        { stepNumber: 1, title: 'Takım Bilgileri' },
        { stepNumber: 2, title: 'Proje Detayları' },
        { stepNumber: 3, title: 'Onaylar' },
    ],
    fields: [
        field(1, 'teamName', 'Takım Adı', 'TEXT', { ...reqHalf, icon: 'Sparkles', placeholder: 'Örn: Innovation Squad', ui: { systemKey: 'company_name' } }),
        field(1, 'teamSize', 'Takım Kişi Sayısı', 'SELECT', { ...reqHalf, icon: 'Users', defaultValue: '3' }, labeled([['3', '3 Kişi'], ['4', '4 Kişi'], ['5', '5 Kişi']])),
        field(1, 'leaderHeading', 'Takım Lideri Bilgileri', 'HEADING'),
        field(1, 'leaderName', 'Ad Soyad', 'TEXT', { ...reqHalf, icon: 'User', ui: { systemKey: 'applicant_name' } }),
        field(1, 'leaderEmail', 'E-posta', 'EMAIL', { ...reqHalf, icon: 'Mail' }),
        field(1, 'leaderPhone', 'Telefon', 'PHONE', { ...reqHalf, icon: 'Phone', placeholder: '+90 5XX XXX XX XX' }),
        field(1, 'leaderUniversity', 'Üniversite', 'TEXT', { ...reqHalf, icon: 'GraduationCap' }),
        field(1, 'leaderDepartment', 'Bölüm', 'TEXT', { ...reqHalf, icon: 'GraduationCap' }),
        field(1, 'teamMembersNote', '', 'DESCRIPTION', { helpText: '* Diğer takım üyelerinin bilgileri etkinlik günü alınacaktır.' }),

        field(2, 'projectName', 'Proje/Fikir Adı', 'TEXT', { ...req, icon: 'FileText' }),
        field(2, 'theme', 'İlgili Tema(lar)', 'CHECKBOX_GROUP', { ...req, icon: 'Target', validationRules: { minSelections: 1 } }, opts([
            'Yapay Zekâ & Bulut Bilişim', 'Mobilite & Gömülü Sistemler', 'Yeni Medya & Animasyon', 'Oyun Geliştirme & Mobil Uygulamalar',
            'Eğitim Teknolojileri', 'Sağlık Teknolojileri & Biyoteknoloji', 'Fintech', 'Sürdürülebilirlik & Çevre Teknolojileri',
        ])),
        field(2, 'projectSummary', 'Proje Özeti', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Projenizi bir paragrafta özetleyin...' }),
        field(2, 'problemDescription', 'Çözmek İstediğiniz Problem', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Hangi problemi çözmeyi hedefliyorsunuz?' }),
        field(2, 'solutionDescription', 'Çözüm Öneriniz', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Bu problemi nasıl çözeceksiniz?' }),
        field(2, 'targetAudience', 'Hedef Kitleniz', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Ürün/hizmetinizin hedef kitlesi kimdir?' }),

        ...kvkkConsents(3, ['kvkk1', 'kvkk2', 'kvkk3', 'kvkk4']),
        field(3, 'resultsNote', 'Not:', 'DESCRIPTION', { helpText: "Başvuru sonuçları e-posta ile bildirilecektir. İlk 3'e giren takımlar İKÜANTS TEKMER Ön Kuluçka Programına doğrudan katılım hakkı kazanacaktır." }),
    ],
    campaign: { slug: 'glowup-ideathon-basvuru', name: 'Glow Up Ideathon Başvurusu', applicationType: 'IDEATHON', programSlug: 'glow-up-ideathon', allowedApplicantTypes: ['TEAM'] },
};

// ---------------------------------------------------------------------------
// TEKMER placement application (components/sections/Application.tsx, /basvuru)
// ---------------------------------------------------------------------------
order = 0;
const tekmer: FormSeed = {
    slug: 'tekmer-yer-edinme-basvuru-formu',
    title: 'İKÜANTS TEKMER Yer Edinme Başvuru Formu',
    formType: 'TEKMER_APPLICATION',
    theme: 'site',
    publicPath: '/basvuru',
    submitLabel: 'BAŞVURUYU TAMAMLA VE GÖNDER',
    successMessage: 'İKÜANTS TEKMER başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.',
    sections: [
        { stepNumber: 1, title: 'Adım 1: Kişisel ve Şirket Bilgileri' },
        { stepNumber: 2, title: 'Adım 2: Proje Bilgileri' },
    ],
    fields: [
        field(1, 'hasCompany', 'Şirketiniz Var Mı?', 'RADIO', { ...req, icon: 'Building2', ui: { highlight: true } }, opts(['Evet', 'Hayır'])),
        field(1, 'authorizedHeading', 'Yetkili Kişi Bilgileri', 'HEADING', { icon: 'User' }),
        field(1, 'authorizedPerson', 'Yetkili Kişi', 'TEXT', { ...reqHalf, placeholder: 'Ad Soyad', ui: { systemKey: 'applicant_name' } }),
        field(1, 'tcNo', 'T.C. Kimlik No', 'TC_NO', { ...reqHalf, placeholder: '11 Haneli T.C. Kimlik Numarası' }),
        field(1, 'birthDate', 'Doğum Tarihi', 'DATE', { ...reqHalf, icon: 'Calendar' }),
        field(1, 'educationStatus', 'Eğitim Durumu', 'SELECT', { ...half, placeholder: 'Seçiniz' }, opts(['Önlisans', 'Lisans', 'Yüksek Lisans', 'Doktora', 'Diğer'])),
        field(1, 'phone', 'Telefon', 'PHONE', { ...reqHalf, icon: 'Phone', placeholder: '+90 501 234 56 78' }),
        field(1, 'email', 'E-posta', 'EMAIL', { ...reqHalf, icon: 'Mail', placeholder: 'ornek@email.com' }),
        field(1, 'companyHeading', 'Şirket Detayları', 'HEADING', { icon: 'Briefcase', ...when('hasCompany', 'Evet') }),
        field(1, 'companyName', 'Firma Adı/Girişim Adı', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet'), ui: { systemKey: 'company_name' } }),
        field(1, 'companyTitle', 'Firma Ünvanı', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'foundationDate', 'Firma Kuruluş Tarihi', 'DATE', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'partnersNames', 'Ortakların Adı', 'TEXT', { ...half, placeholder: 'Örn: Ahmet Yılmaz, Ayşe Demir', ...when('hasCompany', 'Evet') }),
        field(1, 'tradeRegistryNo', 'Ticaret Sicil No', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'mersisNo', 'Firma Mersis NO', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'taxOffice', 'Firma V.D. (Vergi Dairesi)', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'taxNumber', 'Firma VKN.', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'companyPhone', 'Firma Telefon', 'PHONE', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'companyEmail', 'Firma E-Mail', 'EMAIL', { ...reqHalf, ...when('hasCompany', 'Evet'), ui: { systemKey: 'company_email' } }),
        field(1, 'companyWebsite', 'Firma Web Sitesi', 'URL', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'naceCode', 'Nace Kodu', 'TEXT', { ...reqHalf, ...when('hasCompany', 'Evet') }),
        field(1, 'companyAddress', 'Firma Adresi', 'TEXTAREA', { icon: 'MapPin', rows: 2, ...when('hasCompany', 'Evet') }),

        field(2, 'projectName', 'Proje Adı', 'TEXT', { ...reqHalf, icon: 'FileText' }),
        field(2, 'projectTheme', 'Proje Teması', 'TEXT', { ...reqHalf, icon: 'PenTool', placeholder: 'Makina, Yazılım, Dijitalleşme vb.' }),
        field(2, 'teamInfo', 'Projeyi Yürütecek Ekip Hakkında Bilgi', 'TEXTAREA', { ...req, icon: 'Users', rows: 3, helpText: 'Partner olarak mı, çalışan olarak mı yer alınacak? Ekip üyelerinin rolleri nelerdir?' }),
        field(2, 'projectSummary', 'Proje Özeti', 'TEXTAREA', { ...req, icon: 'ClipboardList', rows: 4, helpText: 'Şirket profili, takım bilgisi, problem tanımı ve çözüm önerisi, pazar bilgisi ve finansal beklentilerden bahsedilmelidir.' }),
        field(2, 'projectContribution', 'Gelişmeye Katkısı', 'TEXTAREA', { ...reqHalf, icon: 'Globe', rows: 3, helpText: 'Ulusal ve uluslararası bazda katkısı ne olacaktır?' }),
        field(2, 'projectDifference', 'Mevcut Ürünlerden Farkı', 'TEXTAREA', { ...reqHalf, icon: 'Sparkles', rows: 3, helpText: 'Geliştirilecek ürünün farklılığını açıklayınız.' }),
        field(2, 'projectOutputs', 'Çıktılar ve Kullanım Alanları', 'TEXTAREA', { ...reqHalf, icon: 'Milestone', rows: 3 }),
        field(2, 'targetMarket', 'Hedef Müşteri ve Pazar', 'TEXTAREA', { ...reqHalf, icon: 'TrendingUp', rows: 3 }),
        field(2, 'projectTimeline', 'Proje Faaliyet-Zaman Planı', 'TEXTAREA', { ...reqHalf, icon: 'Clock', rows: 3 }),
        field(2, 'scalability', 'Ölçeklenebilirlik', 'TEXTAREA', { ...reqHalf, icon: 'Scaling', rows: 3, helpText: 'Ticarileşme potansiyelini açıklayınız.' }),
        field(2, 'workspacePreference', 'Alan İhtiyacı', 'SELECT', { ...reqHalf, icon: 'Monitor', placeholder: 'Seçiniz' }, opts(['Açık Alan / Masa', 'Kapalı Ofis'])),
        field(2, 'requestedDuration', 'Talep Edilen Süre', 'SELECT', { ...reqHalf, icon: 'Timer', placeholder: 'Seçiniz' }, opts(['6 Ay', '1 Yıl', '1.5 Yıl', '2 Yıl', 'Daha Uzun'])),
        field(2, 'argeQuality', 'AR-GE Niteliği', 'SELECT', { ...reqHalf, icon: 'Target', placeholder: 'Seçiniz' }, opts(['Temel Araştırma', 'Uygulamalı Araştırma', 'Deneysel Geliştirme'])),
        field(2, 'expectations', 'Beklentileriniz Nelerdir?', 'TEXTAREA', { ...req, icon: 'Target', rows: 3, helpText: 'Neden İKÜANTS TEKMER bünyesinde yer almak istiyorsunuz?' }),
        field(2, 'presentationLink', 'Sunum Dosyası Bağlantısı', 'URL', {
            ...req,
            icon: 'Link',
            placeholder: 'https://drive.google.com/...',
            helpText: 'Başvuru değerlendirmesi için projenizin sunumunu (Pitch Deck) Google Drive, Dropbox veya WeTransfer gibi bir platforma yükleyerek bağlantısını buraya kopyalayınız. (Erişim izninin açık olduğundan emin olun.)',
            ui: { highlight: true },
        }),
        ...kvkkConsents(2, ['kvkk1', 'kvkk2', 'kvkk3', 'kvkk4']),
    ],
    campaign: { slug: 'tekmer-yer-edinme', name: 'İKÜANTS TEKMER Yer Edinme Başvurusu', applicationType: 'TEKMER', allowedApplicantTypes: ['PERSON', 'ORGANIZATION', 'ENTREPRENEUR'] },
};

// ---------------------------------------------------------------------------
// Mentor application (app/mentor-basvuru/page.tsx)
// ---------------------------------------------------------------------------
order = 0;
const mentor: FormSeed = {
    slug: 'mentor-basvuru-formu',
    title: 'Mentör Başvuru Formu',
    formType: 'MENTOR_APPLICATION',
    theme: 'mentor',
    publicPath: '/mentor-basvuru',
    submitLabel: 'BAŞVURUYU GÖNDER',
    successMessage: 'Mentör başvurunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.',
    sections: [
        { stepNumber: 1, title: 'Kişisel Bilgiler' },
        { stepNumber: 2, title: 'Eğitim ve Profesyonel Deneyim' },
        { stepNumber: 3, title: 'Uzmanlık Alanları ve TEKMER Uyumu', description: "İKÜANTS TEKMER'in odaklandığı temalar aşağıdadır. Lütfen uzmanlık alanlarınızı seçin ve açıklayın." },
        { stepNumber: 4, title: 'Mentorluk Deneyimi' },
        { stepNumber: 5, title: 'Eğitmen Olarak Yer Almak İstiyorsanız' },
        { stepNumber: 6, title: 'Motivasyon ve Ek Bilgiler' },
    ],
    fields: [
        field(1, 'fullName', 'Adınız ve Soyadınız', 'TEXT', { ...reqHalf, ui: { systemKey: 'applicant_name' } }),
        field(1, 'email', 'E-Posta Adresiniz', 'EMAIL', reqHalf),
        field(1, 'phone', 'Cep Telefon Numaranız', 'PHONE', { ...reqHalf, placeholder: '+90 5XX XXX XX XX' }),
        field(1, 'linkedin', 'LinkedIn Profiliniz veya Kişisel Web Siteniz', 'URL', { ...half, placeholder: 'https://...' }),
        field(1, 'city', 'Bulunduğunuz Şehir / Ülke', 'TEXT', { ...req, icon: 'MapPin' }),

        field(2, 'educationLevel', 'En Yüksek Eğitim Düzeyiniz', 'RADIO', req, opts(['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora ve Üstü', 'Diğer'])),
        field(2, 'university', 'Mezun Olduğunuz Üniversite ve Bölüm', 'TEXT', req),
        field(2, 'experienceYears', 'Profesyonel Deneyim Süreniz', 'TEXT', { ...reqHalf, placeholder: 'Örn: 10 yıl' }),
        field(2, 'currentPosition', 'Mevcut veya Son İş Unvanınız ve Çalıştığınız Kurum', 'TEXT', { ...reqHalf, ui: { systemKey: 'company_name' } }),
        field(2, 'careerSummary', 'Kariyer Özetiniz', 'TEXTAREA', { ...req, rows: 4, placeholder: 'Profesyonel geçmişinizi özetleyen kısa bir metin yazınız (en fazla 200 kelime).' }),

        field(3, 'expertise', 'Girişimcilere Katkı Sağlayabileceğiniz Uzmanlık Alanlarınız', 'CHECKBOX_GROUP', { ...req, validationRules: { minSelections: 1 } }, opts([
            'Yazılım/Endüstriler', 'Yenilikçi Teknolojiler', 'Yeni Medya Tasarımı', 'Oyun (Game Development)', 'Fintech', 'Edtech', 'Animasyon', 'UI/UX Tasarım',
            'Yapay Zeka', 'Bilgi ve İletişim Teknolojileri', 'Yazılım', 'Dijitalleşme', 'Elektrik/Elektronik', 'Robotik', 'Makina', 'Kimya', 'Biyoteknoloji',
            'Nanoteknoloji', 'Genetik', 'Enerji/Yenilenebilir Enerji', 'Havacılık', 'Savunma', 'Sağ/Tıbbi Cihaz/Medikal', 'Finans', 'Yönetim/Organizasyon',
            'Hukuk', 'Fikri Mülkiyet', 'İşletme', 'İnsan Kaynakları', 'Pazarlama',
        ])),
        field(3, 'expertiseDescription', 'Seçtiğiniz Alanlardaki Deneyiminizi Açıklayınız', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Uzmanlık alanlarındaki deneyiminizi kısaca paylaşınız.' }),

        field(4, 'hasMentorExperience', 'Daha Önce Mentorlük Deneyiminiz Oldu mu?', 'RADIO', req, opts(['Evet', 'Hayır'])),
        field(4, 'mentorCount', 'Kaç girişimciye veya şirkete mentorlük yaptınız?', 'TEXT', { ...half, ...when('hasMentorExperience', 'Evet') }),
        field(4, 'mentorAreas', 'Mentorlük Yaptığınız Alanlar ve Süreler', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Örnek: Edtech startuplara 2 yıl mentörlük, iş geliştirme ve dijital pazarlama uzmanı.', ...when('hasMentorExperience', 'Evet') }),
        field(4, 'hasCertificate', 'Mentorlük Sertifikanız Var mı?', 'RADIO', req, opts(['Evet', 'Hayır'])),
        field(4, 'certificateDetails', 'Sertifikanın adı, veren kurum ve tarih bilgilerini paylaşınız', 'TEXT', when('hasCertificate', 'Evet')),
        field(4, 'mentorMeaning', 'Mentorlük Kavramı Sizin İçin Ne Anlam İfade Ediyor?', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Lütfen kendi bakış açınızdan mentorluğu tanımlayınız.' }),

        field(5, 'trainingTopics', 'Hangi konu başlıklarında eğitim verebileceğinizi ve her bir eğitimin ortalama süresini (saat olarak) belirtiniz', 'TEXTAREA', { rows: 3, placeholder: 'Örn: Dijital Pazarlama (3 saat), Startup Finansmanı (2 saat)...' }),

        field(6, 'motivation', "İKÜANTS TEKMER'de Mentor Olarak Görev Almak İçin Motivasyonunuz Nedir?", 'TEXTAREA', { ...req, rows: 3, placeholder: 'Bu programa katılma isteğinizi ve hedeflerinizi bizimle paylaşın.' }),
        field(6, 'idealMentor', 'Sizce İyi Bir Mentor Nasıl Olmalıdır?', 'CHECKBOX_GROUP', { ...req, validationRules: { minSelections: 1 } }, opts(['Danışman gibi yön gösteren', 'Koç gibi sorularla yönlendiren', 'Rol model olan', 'Gönüllü destekçi', 'Diğer'])),
        field(6, 'availability', 'Mentorlüğe Zaman Ayırabileceğiniz Süre', 'TEXTAREA', { ...req, icon: 'Clock', rows: 2, placeholder: 'Kuluçka Programları Ortalama 12 Hafta Sürmektedir. Kuluçka programının tamamında minimum 8 saat mentorlük beklenmektedir.' }),
        field(6, 'hasFinancialExpectation', 'Sunmak İstediğiniz Mentorluk hizmetinizden maddi beklentiniz var mı?', 'RADIO', req, opts(['Evet', 'Hayır (Gönüllülük Esaslı)'])),
        field(6, 'hourlyRate', 'Evet ise saatlik net ücret beklentinizi belirtiniz', 'TEXT', { placeholder: 'Örn: 500 TL/saat', ...when('hasFinancialExpectation', 'Evet') }),
        ...kvkkConsents(6, ['kvkk1', 'kvkk2', 'kvkk3', 'kvkk4']),
        field(6, 'kvkkConsent', 'Bu başvuru formunda ve eklerinde vermiş olduğum kişisel bilgilerimin, üniversite bünyesinde oluşturulacak mentor veri havuzunda saklanmasını, yapay zekâ destekli sistemler aracılığıyla analiz edilmesini, girişimci eşleştirme süreçlerinde kullanılmasını ve gerekli görülmesi hâlinde mentorluk talebinde bulunan diğer kurum ve kuruluşlarla paylaşılmasını 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında bilgilendirildiğimi kabul ederek açık rıza ile onaylıyorum.', 'CONSENT', { ...req, ui: { consentKind: 'EXPLICIT_CONSENT' } }),
    ],
    campaign: { slug: 'mentor-basvuru', name: 'Mentör Başvurusu', applicationType: 'MENTOR', allowedApplicantTypes: ['PERSON'] },
};

// ---------------------------------------------------------------------------
// Contact (components/sections/Contact.tsx) — three request types
// ---------------------------------------------------------------------------
const meetingTopics = ['Girişimcilik Danışmanlığı', 'Proje Değerlendirmesi', 'Mentorluk Görüşmesi', 'Yatırım Görüşmesi', 'İş Birliği Önerisi', 'Teknik Destek', 'Diğer'];
const visitTopics = ['TEKMER Tanıtım Turu', 'Kuluçka Programı Bilgilendirme', 'Coworking Alan İnceleme', 'Laboratuvar Ziyareti', 'Etkinlik Mekanı İnceleme', 'Kurumsal Ziyaret', 'Diğer'];
const hosts = ['Hatice Tuğsavul', 'Alperen Tağman', 'Tüm TEKMER Ekibi'];
const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

order = 0;
const contactMessage: FormSeed = {
    slug: 'iletisim-mesaj-formu',
    title: 'İletişim — Mesaj Formu',
    formType: 'CONTACT',
    theme: 'contact',
    publicPath: '/iletisim',
    submitLabel: 'GÖNDER',
    successMessage: 'Mesajınız alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    sections: [{ stepNumber: 1, title: 'Mesaj Gönder' }],
    fields: [
        field(1, 'name', 'Ad Soyad', 'TEXT', { ...reqHalf, placeholder: 'John Doe', ui: { systemKey: 'applicant_name' } }),
        field(1, 'email', 'E-Posta', 'EMAIL', { ...reqHalf, placeholder: 'email@example.com' }),
        field(1, 'phone', 'Telefon Numarası', 'PHONE', { ...reqHalf, placeholder: '+90 5XX XXX XX XX' }),
        field(1, 'company', 'Kuruluş / Şirket', 'TEXT', { ...half, placeholder: 'Şirket adı (opsiyonel)', ui: { systemKey: 'company_name' } }),
        field(1, 'message', 'Mesaj İçeriği', 'TEXTAREA', { ...req, rows: 4, placeholder: 'Girişimim hakkında bilgi almak istiyorum...', ui: { systemKey: 'message' } }),
    ],
};

order = 0;
const contactMeeting: FormSeed = {
    slug: 'iletisim-toplanti-formu',
    title: 'İletişim — Toplantı Talebi',
    formType: 'CONTACT_MEETING',
    theme: 'contact',
    publicPath: '/iletisim',
    submitLabel: 'RANDEVU AL',
    successMessage: 'Toplantı talebiniz alındı. Uygunluk durumuna göre sizinle iletişime geçeceğiz.',
    sections: [{ stepNumber: 1, title: 'Toplantı Talebi' }],
    fields: [
        field(1, 'name', 'Ad Soyad', 'TEXT', { ...reqHalf, ui: { systemKey: 'applicant_name' } }),
        field(1, 'email', 'E-Posta', 'EMAIL', reqHalf),
        field(1, 'phone', 'Telefon', 'PHONE', { ...reqHalf, placeholder: '+90 5XX XXX XX XX' }),
        field(1, 'company', 'Şirket / Kurum', 'TEXT', { ...half, ui: { systemKey: 'company_name' } }),
        field(1, 'topic', 'Toplantı Konusu', 'SELECT', { ...reqHalf, placeholder: 'Konu Seçin', ui: { systemKey: 'meeting_topic' } }, opts(meetingTopics)),
        field(1, 'meetWith', 'Toplantıyı kiminle gerçekleştirmek istersiniz?', 'SELECT', { ...reqHalf, placeholder: 'Kişi Seçin', ui: { systemKey: 'meet_with' } }, opts(hosts)),
        field(1, 'date', 'Tarih', 'DATE', { ...reqHalf, ui: { systemKey: 'meeting_date' } }),
        field(1, 'time', 'Saat', 'SELECT', { ...reqHalf, placeholder: 'Saat Seçin', ui: { systemKey: 'meeting_time' } }, opts(timeSlots)),
        field(1, 'notes', 'Ek Notlar', 'TEXTAREA', { rows: 2, placeholder: 'Toplantı hakkında eklemek istediğiniz bilgiler...', ui: { systemKey: 'message' } }),
    ],
};

order = 0;
const contactVisit: FormSeed = {
    slug: 'iletisim-ziyaret-formu',
    title: 'İletişim — Ziyaret Talebi',
    formType: 'CONTACT_VISIT',
    theme: 'contact',
    publicPath: '/iletisim',
    submitLabel: 'ZİYARET RANDEVUSU AL',
    successMessage: 'Ziyaret talebiniz alındı. Uygunluk durumuna göre sizinle iletişime geçeceğiz.',
    sections: [{ stepNumber: 1, title: 'Ziyaret Talebi' }],
    fields: [
        field(1, 'name', 'Ad Soyad', 'TEXT', { ...reqHalf, ui: { systemKey: 'applicant_name' } }),
        field(1, 'email', 'E-Posta', 'EMAIL', reqHalf),
        field(1, 'phone', 'Telefon', 'PHONE', { ...reqHalf, placeholder: '+90 5XX XXX XX XX' }),
        field(1, 'company', 'Şirket / Kurum', 'TEXT', { ...half, ui: { systemKey: 'company_name' } }),
        field(1, 'topic', 'Ziyaret Konusu', 'SELECT', { ...reqHalf, placeholder: 'Konu Seçin', ui: { systemKey: 'visit_topic' } }, opts(visitTopics)),
        field(1, 'groupSize', 'Kişi Sayısı', 'NUMBER', { ...reqHalf, placeholder: '1', validationRules: { min: 1, max: 20 }, ui: { systemKey: 'group_size' } }),
        field(1, 'visitWho', "Merkez'de kimi ziyaret edeceksiniz?", 'SELECT', { ...req, placeholder: 'Kişi Seçin', ui: { systemKey: 'visit_who' } }, opts(hosts)),
        field(1, 'date', 'Tarih', 'DATE', { ...reqHalf, ui: { systemKey: 'visit_date' } }),
        field(1, 'time', 'Saat', 'SELECT', { ...reqHalf, placeholder: 'Saat Seçin', ui: { systemKey: 'visit_time' } }, opts(timeSlots)),
        field(1, 'notes', 'Ek Notlar', 'TEXTAREA', { rows: 2, placeholder: 'Ziyaret hakkında eklemek istediğiniz bilgiler...', ui: { systemKey: 'message' } }),
    ],
};

// ---------------------------------------------------------------------------
// Internship forms (components/sections/StudentInternshipForm.tsx, CompanyInternshipForm.tsx)
// ---------------------------------------------------------------------------
order = 0;
const internshipStudent: FormSeed = {
    slug: 'staj-ogrenci-basvuru-formu',
    title: 'Staj Programı — Öğrenci Başvuru Formu',
    formType: 'INTERNSHIP_APPLICATION',
    theme: 'internship-student',
    publicPath: '/staj-programi',
    submitLabel: 'Başvuruyu Gönder',
    successMessage: 'Staj başvurunuz alındı. Uygun pozisyonlar için sizinle iletişime geçeceğiz.',
    sections: [
        { stepNumber: 1, title: 'Bireysel ve Eğitim Bilgileri' },
        { stepNumber: 2, title: 'Staj Tercihleri ve Nitelikler' },
    ],
    fields: [
        field(1, 'adSoyad', 'Ad Soyad', 'TEXT', { ...reqHalf, ui: { systemKey: 'applicant_name' } }),
        field(1, 'yetkiliKisiIletisim', 'Yetkili Kişi / İletişim', 'TEXT', { ...reqHalf, placeholder: 'Referans veya Ek İletişim vs.' }),
        field(1, 'universite', 'Üniversite', 'TEXT', reqHalf),
        field(1, 'bolum', 'Bölüm', 'TEXT', reqHalf),
        field(1, 'sinifTercihi', 'Sınıf Tercihi', 'TEXT', { ...reqHalf, placeholder: 'Örn: 3. Sınıf, 4. Sınıf' }),
        field(1, 'eposta', 'E-posta', 'EMAIL', reqHalf),
        field(1, 'telefon', 'Telefon', 'PHONE', reqHalf),

        field(2, 'stajTuru', 'Staj Türü (Zorunlu / Gönüllü)', 'SELECT', reqHalf, opts(['Zorunlu', 'Gönüllü'])),
        field(2, 'stajSuresi', 'Staj Süresi', 'TEXT', { ...reqHalf, placeholder: 'Örn: 2 Ay vb.' }),
        field(2, 'haftalikGunSayisi', 'Haftalık Çalışma Gün Sayısı', 'NUMBER', { ...reqHalf, placeholder: 'Örn: 3', validationRules: { min: 1, max: 7 } }),
        field(2, 'calismaModeli', 'Çalışma Modeli (Fiziki / Hibrit / Uzaktan)', 'SELECT', reqHalf, opts(['Fiziki', 'Hibrit', 'Uzaktan'])),
        field(2, 'dahaOnceStajYapildiMi', 'Daha Önce Staj Yaptınız mı?', 'SELECT', reqHalf, opts(['Evet', 'Hayır'])),
        field(2, 'istenilenAlanlar', 'Staj yapmak istediğiniz alan(lar) hangileridir?', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Yazılım, Pazarlama vb.' }),
        field(2, 'teknikBeceriler', 'Varsa teknik becerilerinizi veya kullandığınız programları kısaca belirtiniz.', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Python, Adobe Suite vb.' }),
        field(2, 'deneyimKazanmakIstenenKonular', 'Staj sürecinde özellikle hangi konularda deneyim kazanmak istersiniz?', 'TEXTAREA', { ...req, rows: 2 }),
        field(2, 'deneyimBilgisi', 'Deneyim Bilgisi', 'TEXTAREA', { rows: 2, placeholder: 'Geçmiş tecrübelerinizden kısaca bahsediniz...' }),
        field(2, 'girisimlerdeStajNedeni', 'İKÜANTS TEKMER bünyesindeki girişimlerde staj yapmak isteme nedeniniz?', 'TEXTAREA', { ...req, rows: 3 }),
        ...kvkkConsents(2, ['kvkk1', 'kvkk2', 'kvkk3']),
    ],
};

order = 0;
const internshipCompany: FormSeed = {
    slug: 'staj-sirket-talep-formu',
    title: 'Staj Programı — Şirket Stajyer Talep Formu',
    formType: 'INTERNSHIP_APPLICATION',
    theme: 'internship-company',
    publicPath: '/staj-programi',
    submitLabel: 'Çağrıyı Gönder',
    successMessage: 'Stajyer talebiniz alındı. Uygun adaylar için sizinle iletişime geçeceğiz.',
    sections: [
        { stepNumber: 1, title: 'İlk Kurulum ve İletişim' },
        { stepNumber: 2, title: 'Staj ve Beklentiler' },
    ],
    fields: [
        field(1, 'firmaUnvani', 'Firma Unvanı', 'TEXT', { ...reqHalf, placeholder: 'Firma adını giriniz', ui: { systemKey: 'company_name' } }),
        field(1, 'yetkiliKisiIletisim', 'Yetkili Kişi / İletişim', 'TEXT', { ...reqHalf, placeholder: 'Ad Soyad, Telefon/E-posta vb.', ui: { systemKey: 'applicant_name' } }),
        field(1, 'tekmerStatusu', 'TEKMER Statüsü (Ofis / Masa)', 'SELECT', reqHalf, opts(['Ofis', 'Masa'])),
        field(1, 'stajyerSayisi', 'Talep Edilen Stajyer Sayısı', 'NUMBER', { ...reqHalf, placeholder: 'Sayı giriniz', validationRules: { min: 1 } }),
        field(1, 'agirlikliGorevAlanlari', 'Stajyerin ağırlıklı olarak görev alacağı alan(lar) nelerdir?', 'TEXTAREA', { ...req, rows: 2, placeholder: 'Örn: Yazılım Geliştirme, Ürün Testleri vb.' }),
        field(1, 'arananTemelBeceriler', 'Aranan Temel Beceriler', 'CHECKBOX_GROUP', { ...req, validationRules: { minSelections: 1 } }, opts(['Ar-Ge', 'Yazılım', 'İş Geliştirme', 'Pazarlama', 'Diğer'])),

        field(2, 'stajTuru', 'Staj Türü (Zorunlu / Gönüllü)', 'SELECT', reqHalf, opts(['Zorunlu', 'Gönüllü', 'Fark Etmez'])),
        field(2, 'stajSuresiVeGun', 'Staj Süresi ve Haftalık Gün Sayısı', 'TEXT', { ...reqHalf, placeholder: 'Örn: 2 Ay, Haftada 3 Gün' }),
        field(2, 'uygunBolumler', 'Uygun Olduğunu Düşündüğünüz Bölüm/Bölümler', 'TEXT', { ...reqHalf, placeholder: 'Örn: Bilgisayar Müh, İşletme vb.' }),
        field(2, 'sinifTercihi', 'Sınıf Tercihi', 'TEXT', { ...reqHalf, placeholder: 'Örn: 3. veya 4. Sınıf' }),
        field(2, 'temelBilgiVeBeceriler', 'Stajyer adayında bulunmasını beklediğiniz temel bilgi ve beceriler nelerdir?', 'TEXTAREA', { ...req, rows: 2 }),
        field(2, 'gorevAlacagiAlanlar', 'Stajyerin Görev Alacağı Alanlar', 'TEXTAREA', { ...req, rows: 2, placeholder: '(Pazarlama, Ar-Ge vb... detaylı)' }),
        field(2, 'yapilacakCalismalar', 'Staj Süresince Yapacağı Çalışmalar (Kısa Açıklama)', 'TEXTAREA', { ...req, rows: 3, placeholder: 'Örn: Proje süreçlerine destek verecek, kodlama yapacak...' }),
        field(2, 'calismaModeli', 'Çalışma Modeli (Fiziki / Hibrit / Uzaktan)', 'SELECT', reqHalf, opts(['Fiziki', 'Hibrit', 'Uzaktan'])),
        field(2, 'saglananImkanlar', 'Sağlanan İmkânlar', 'TEXT', { ...reqHalf, placeholder: '(Ücret, Yemek, Ulaşım vb.)' }),
        field(2, 'mulakatDurumu', 'CV İncelemesi / Mülakat Yapılacak mı?', 'SELECT', req, opts(['Evet (CV İncelemesi ve Mülakat)', 'Sadece CV İncelemesi', 'Hayır'])),
        ...kvkkConsents(2, ['kvkk1', 'kvkk2', 'kvkk3']),
    ],
};

// ---------------------------------------------------------------------------
// Event registration (app/haberler/page.tsx RSVP section)
// ---------------------------------------------------------------------------
order = 0;
const eventRegistration: FormSeed = {
    slug: 'etkinlik-kayit-formu',
    title: 'Etkinlik Kayıt Formu',
    formType: 'EVENT_REGISTRATION',
    theme: 'site',
    publicPath: '/haberler',
    submitLabel: 'Kaydımı Oluştur',
    successMessage: 'Etkinlik kaydınız alındı.',
    sections: [{ stepNumber: 1, title: 'Etkinlik Kaydı', description: 'Bilgilerinizi girerek etkinliğe katılım kaydınızı oluşturun.' }],
    fields: [
        field(1, 'name', 'Ad Soyad', 'TEXT', { ...req, placeholder: 'Adınız ve soyadınız', ui: { systemKey: 'applicant_name' } }),
        field(1, 'email', 'E-posta', 'EMAIL', { ...req, placeholder: 'ornek@email.com' }),
        field(1, 'phone', 'Telefon', 'PHONE', { ...req, placeholder: '0555 123 4567' }),
        ...kvkkConsents(1, ['kvkk1', 'kvkk2', 'kvkk3', 'kvkk4']),
    ],
};

// ---------------------------------------------------------------------------
// Space reservation requester details (app/kullanim-alanlari/page.tsx modal)
// Scheduling inputs (space, date, time, participants) remain system fields.
// ---------------------------------------------------------------------------
order = 0;
const reservationRequest: FormSeed = {
    slug: 'rezervasyon-talep-formu',
    title: 'Ortak Kullanım Alanı Rezervasyon Talep Formu',
    formType: 'RESERVATION_REQUEST',
    theme: 'reservation',
    publicPath: '/kullanim-alanlari',
    submitLabel: 'Rezervasyon Talebi Gönder',
    successMessage: 'Rezervasyon talebiniz alındı. Ekibimiz uygunluğu kontrol ederek size dönüş yapacaktır.',
    sections: [{ stepNumber: 1, title: 'Talep Sahibi Bilgileri' }],
    fields: [
        field(1, 'requesterName', 'Ad Soyad', 'TEXT', { ...reqHalf, placeholder: 'Örn: Ayşe Demir', ui: { systemKey: 'applicant_name' } }),
        field(1, 'requesterOrganization', 'Şirket / Kurum Adı', 'TEXT', { ...half, placeholder: 'Örn: ABC Teknoloji A.Ş.', ui: { systemKey: 'company_name' } }),
        field(1, 'requesterEmail', 'E-Posta', 'EMAIL', { ...reqHalf, placeholder: 'Örn: ayse@example.com' }),
        field(1, 'requesterPhone', 'Telefon Numarası', 'PHONE', { ...half, placeholder: 'Örn: 0532 000 00 00' }),
        field(1, 'purpose', 'Kullanım Amacı', 'SELECT', { ...req, ui: { systemKey: 'purpose' } }, opts(['Toplantı', 'Sunum', 'Eğitim', 'Çekim', 'Prototipleme', 'AR/VR Çalışması', 'Etkinlik', 'Mentörlük Görüşmesi', 'Girişimci Görüşmesi', 'Diğer'])),
        field(1, 'notes', 'Ek Açıklama / Not (Opsiyonel)', 'TEXTAREA', { rows: 3, placeholder: 'İhtiyaç duyabileceğiniz özel ekipman veya notlarınızı belirtebilirsiniz...', ui: { systemKey: 'message' } }),
        field(1, 'kvkkConsent', "KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin bu kapsamda işlenmesine onay veriyorum.", 'CONSENT', {
            ...req,
            ui: { consentKind: 'PRIVACY_NOTICE', kvkkTextId: '__kvkk:kvkk1', linkLabel: 'KVKK Aydınlatma Metni', linkSuffix: "'ni okudum ve kişisel verilerimin bu kapsamda işlenmesine onay veriyorum." },
        }),
    ],
};

// ---------------------------------------------------------------------------
// Machine park price quote (app/kullanim-alanlari "Fiyat Teklifi Talep Et")
// ---------------------------------------------------------------------------
order = 0;
const machineQuote: FormSeed = {
    slug: 'makine-fiyat-teklifi',
    title: 'Makine Kullanımı Fiyat Teklifi Talebi',
    formType: 'QUOTE_REQUEST',
    theme: 'reservation',
    publicPath: '/kullanim-alanlari',
    submitLabel: 'Teklif Talebi Gönder',
    successMessage: 'Fiyat teklifi talebiniz alındı. Ekibimiz kullanım detaylarınızı inceleyip teklifi e-posta ile iletecektir.',
    sections: [{ stepNumber: 1, title: 'Kullanım Bilgileri' }],
    fields: [
        field(1, 'requesterName', 'Ad Soyad', 'TEXT', { ...reqHalf, placeholder: 'Örn: Ayşe Demir', ui: { systemKey: 'applicant_name' } }),
        field(1, 'requesterOrganization', 'Şirket / Kurum Adı', 'TEXT', { ...half, placeholder: 'Örn: ABC Teknoloji A.Ş.', ui: { systemKey: 'company_name' } }),
        field(1, 'requesterEmail', 'E-Posta', 'EMAIL', { ...reqHalf, placeholder: 'Örn: ayse@example.com' }),
        field(1, 'requesterPhone', 'Telefon Numarası', 'PHONE', { ...half, placeholder: 'Örn: 0532 000 00 00' }),
        field(1, 'machine', 'Makine / Hizmet', 'SELECT', { ...req }, opts(['Lazer Kesim Atölyesi', 'Elektronik Dizgi (SMT) Hattı', '3D Baskı — Bambu Lab H2D', 'Diğer'])),
        field(1, 'usageType', 'Kullanım Amacı', 'SELECT', { ...reqHalf }, opts(['Prototip', 'Küçük seri üretim', 'Eğitim / deneme', 'Diğer'])),
        field(1, 'estimatedHours', 'Tahmini Kullanım Süresi (saat)', 'NUMBER', { ...reqHalf, placeholder: 'Örn: 3', validationRules: { min: 1, max: 500 } }),
        field(1, 'quantity', 'Adet / Parça Sayısı', 'NUMBER', { ...half, placeholder: 'Örn: 25', validationRules: { min: 1, max: 100000 } }),
        field(1, 'deadline', 'İstenen Teslim Tarihi', 'DATE', { ...half }),
        field(1, 'material', 'Malzeme / Teknik Bilgi', 'TEXT', { placeholder: 'Örn: 3 mm pleksi · PLA filament · 2 katmanlı PCB, 0603 komponentler' }),
        field(1, 'reservationReference', 'Rezervasyon Numarası (varsa)', 'TEXT', { ...half, placeholder: 'REZ-2026-XXXXXX' }),
        field(1, 'details', 'İş Detayları', 'TEXTAREA', { ...req, rows: 4, placeholder: 'Ne üretmek istediğinizi, ölçüleri ve varsa dosya formatını (DXF, STL, Gerber vb.) kısaca anlatın. Dosyaları teklif sürecinde e-posta ile paylaşabilirsiniz.', ui: { systemKey: 'message' } }),
        field(1, 'kvkkConsent', "KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin bu kapsamda işlenmesine onay veriyorum.", 'CONSENT', {
            ...req,
            ui: { consentKind: 'PRIVACY_NOTICE', kvkkTextId: '__kvkk:kvkk1', linkLabel: 'KVKK Aydınlatma Metni', linkSuffix: "'ni okudum ve kişisel verilerimin bu kapsamda işlenmesine onay veriyorum." },
        }),
    ],
};

export const FORM_SEEDS: FormSeed[] = [
    antspark,
    antsfire,
    glowup,
    tekmer,
    mentor,
    contactMessage,
    contactMeeting,
    contactVisit,
    internshipStudent,
    internshipCompany,
    eventRegistration,
    reservationRequest,
    machineQuote,
];
