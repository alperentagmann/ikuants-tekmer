import { PrismaClient } from '@prisma/client';
import { MENTOR_DEFAULTS, PROGRAM_DEFAULTS } from '../data/public-defaults';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { syncRbacDefinitions } from '../lib/rbac-sync';
import { seedFormCenter } from './seed-form-center';
import { seedVerifiedSpaces } from './seed-spaces';
import { seedEmailTemplates } from './seed-email-templates';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding for İKÜANTS TEKMER...');

    // 1. SYSTEM PERMISSIONS
    console.log('Inserting permissions...');
    const permissions = [
        { action: '*', resource: '*', description: 'Tüm yetkiler' },
        { action: 'view', resource: 'dashboard', description: 'Dashboard görüntüleme' },
        { action: 'view', resource: 'analytics', description: 'Analitikleri görme' },
        { action: '*', resource: 'entrepreneurs', description: 'Girişimcileri yönetme' },
        { action: 'view', resource: 'entrepreneurs', description: 'Girişimcileri görme' },
        { action: '*', resource: 'mentors', description: 'Mentörleri yönetme' },
        { action: 'view', resource: 'mentors', description: 'Mentörleri görme' },
        { action: '*', resource: 'programs', description: 'Programları yönetme' },
        { action: 'view', resource: 'programs', description: 'Programları görme' },
        { action: '*', resource: 'news', description: 'Haberleri yönetme' },
        { action: 'view', resource: 'news', description: 'Haberleri görme' },
        { action: '*', resource: 'applications', description: 'Başvuruları yönetme' },
        { action: 'view', resource: 'applications', description: 'Başvuruları görme' },
        { action: 'view_sensitive', resource: 'applications', description: 'Hassas PII verilerini görme' },
        { action: '*', resource: 'forms', description: 'Formları yönetme' },
        { action: '*', resource: 'contacts', description: 'İletişim taleplerini yönetme' },
        { action: '*', resource: 'media', description: 'Medya kütüphanesini yönetme' },
        { action: '*', resource: 'settings', description: 'Ayarları yönetme' },
        { action: 'view', resource: 'audit_logs', description: 'Audit loglarını görme' },
        { action: 'view', resource: 'system_health', description: 'Sistem durumunu görme' },
        { action: '*', resource: 'users', description: 'Kullanıcıları yönetme' },
    ];

    const permMap = new Map<string, string>();
    for (const p of permissions) {
        const record = await prisma.permission.upsert({
            where: { action_resource: { action: p.action, resource: p.resource } },
            update: { description: p.description },
            create: p,
        });
        permMap.set(`${p.action}:${p.resource}`, record.id);
    }

    // 2. ROLES
    console.log('Inserting roles...');
    const superAdminRole = await prisma.role.upsert({
        where: { slug: 'super-admin' },
        update: {},
        create: {
            name: 'Süper Yönetici',
            slug: 'super-admin',
            description: 'Tüm yetkilere tam erişim',
            isSystem: true,
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { slug: 'admin' },
        update: {},
        create: {
            name: 'Yönetici (Admin)',
            slug: 'admin',
            description: 'Operasyonel modüllere tam erişim',
            isSystem: true,
        },
    });

    const editorRole = await prisma.role.upsert({
        where: { slug: 'content-editor' },
        update: {},
        create: {
            name: 'İçerik Editörü',
            slug: 'content-editor',
            description: 'Haber, etkinlik ve medya içeriklerini düzenleme',
            isSystem: true,
        },
    });

    const appManagerRole = await prisma.role.upsert({
        where: { slug: 'application-manager' },
        update: {},
        create: {
            name: 'Başvuru Yöneticisi',
            slug: 'application-manager',
            description: 'Başvuruları inceleme, puanlama ve CRM yönetimi',
            isSystem: true,
        },
    });

    // Link Super Admin to *:*
    const allPermId = permMap.get('*:*');
    if (allPermId) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: allPermId } },
            update: {},
            create: { roleId: superAdminRole.id, permissionId: allPermId },
        });
    }

    // Default roles and their permissions from lib/rbac.ts (additive)
    const rbac = await syncRbacDefinitions(prisma);
    console.log(`RBAC sync: +${rbac.permissionsCreated} permissions, +${rbac.rolesCreated} roles, +${rbac.linksCreated} links`);

    // 3. ROLES & PERMISSIONS READY
    console.log('✅ Permissions and roles seeded successfully.');
    console.log('ℹ️  Security Notice: Hardcoded super admin password in seed has been removed.');
    console.log('👉 To create your initial Super Admin account interactively, run: npm run admin create\n');

    // 4. MENTORS SEED
    console.log('Seeding existing mentors...');
    const initialMentors = MENTOR_DEFAULTS;

    for (let i = 0; i < initialMentors.length; i++) {
        const m = initialMentors[i];
        const existing = await prisma.mentor.findFirst({
            where: { name: m.name, surname: m.surname },
        });
        if (!existing) {
            await prisma.mentor.create({
                data: {
                    ...m,
                    isActive: true,
                    isFeatured: i < 6,
                    sortOrder: i,
                },
            });
        }
    }

    // 5. ENTREPRENEURS SEED
    console.log('Seeding existing entrepreneurs...');
    const initialEntrepreneurs = [
        { name: "Pexa Boru San. A.Ş.", slug: "pexa-boru-san-as", sector: "Sanayi", shortDesc: "Boru ve endüstriyel üretim sanayi çözümleri." },
        { name: "Serazio Danışmanlık İletişim Ve Satış Tic. Ltd. Şti.", slug: "serazio-danismanlik", sector: "E-Ticaret / Marketplace / İç Mimari", shortDesc: "Premium iç mekân markalarını mimarlar ve son kullanıcılarla buluşturan küratörlü pazaryeri platformudur." },
        { name: "Aleaza Development Solutions", slug: "aleaza-development", sector: "Robotik / Güvenlik Teknolojileri", shortDesc: "Güvenlik ve savunma ile iş sağlığı alanlarına yönelik akıllı robotik çözümler geliştirir." },
        { name: "Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.", slug: "ability-pool", sector: "Sosyal Etki / Kurumsal Gönüllülük / SaaS", shortDesc: "Kurumların gönüllülük, bağış ve sosyal sorumluluk süreçlerini dijitalleştiren sosyal etki platformudur." },
        { name: "Atakdx Mühendislik Ve Danışmanlık Hizmetleri Ltd. Şti.", slug: "atakdx-muhendislik", sector: "Mühendislik", shortDesc: "İleri mühendislik ve simülasyon danışmanlık hizmetleri." },
        { name: "MathTalk", slug: "mathtalk", sector: "Eğitim Teknolojileri / Yapay Zekâ", shortDesc: "Doğal dil ile matematik problemlerini anlayıp çözüm üreten AI destekli problem çözüm platformudur." },
        { name: "Palmiye Bilgi Teknolojileri Sanayi ve Ticaret Limited Şirketi", slug: "palmiye-bilgi-teknolojileri", sector: "GovTech / Satınalma Süreç Yazılımı", shortDesc: "Doğrudan temin satınalma süreçlerini tek platformda standartlaştıran ve evrak/rapor üretimi yapan yazılımdır." },
        { name: "Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.", slug: "kulupbirligim", sector: "EdTech / Community Platform / Sponsorluk Ağı", shortDesc: "Üniversite kulüpleri, sponsorlar ve öğrencileri bir araya getiren etkinlik ve sponsorluk ekosistem platformudur." },
        { name: "FiProduct", slug: "fiproduct", sector: "Ürün Geliştirme / VR", shortDesc: "Kültürel mirası 3D modelleme ile yeniden inşa edip VR ortamında interaktif deneyimlere dönüştürür." },
        { name: "İnterfiber Bilişim Teknoloji Ticaret Limited Şirketi", slug: "interfiber-bilisim", sector: "Telekom / İnternet Servis Sağlayıcı / Wi-Fi Çözümleri", shortDesc: "Kurumsal internet altyapısı, 5G destekli yedekli bağlantı ve Wi-Fi portal/reklam entegrasyonu sağlar." },
        { name: "3B Postür ve Hareket Analiz Girişimi", slug: "3b-postur-hareket", sector: "Sağlık Teknolojileri / 3D Analiz", shortDesc: "Radyasyonsuz 3B postür ve hareket analizi ile klinik süreçlere dijital karar destek sunar." },
        { name: "Ung Sağlık Teknolojileri Ürünleri Ve Hiz. San. Tic. Ltd. Şti.", slug: "ung-saglik-teknolojileri", sector: "Dijital Sağlık / Yapay Zekâ / Diş Sağlığı", shortDesc: "TMB ve bruksizm için yapay zekâ destekli klinik karar destek ve hasta takip platformu geliştirir." },
        { name: "Napolion Kahve Ticareti Ve Lojistik Limited Şirketi", slug: "napolion-kahve", sector: "Yazılım", shortDesc: "Teknoloji destekli lojistik ve tedarik çözümleri." },
        { name: "İPDM Plan Proje Destekleme Merkezleri ve Dan. Hiz. Ltd. Şti.", slug: "ipdm-plan-proje", sector: "B2B Yazılım / Ar-Ge Süreç Yönetimi", shortDesc: "Ar-Ge birimleri için süreç, kaynak, risk ve doküman yönetimini bütünleşik sunan yazılımlar geliştirir." },
        { name: "Funexagon Oyun Teknolojileri Sanayi Ve Ticaret A.Ş.", slug: "funexagon-oyun", sector: "Oyun Teknolojileri / DOOH / Yaratıcı Teknolojiler", shortDesc: "Unreal Engine tabanlı oyunlar ve anamorfik DOOH/immersive dijital deneyim çözümleri üretir." },
        { name: "Allesgut Teknoloji Ltd. Şti.", slug: "allesgut-teknoloji", sector: "Sağlık B2B E-Ticaret / Marketplace", shortDesc: "Ecza depoları ile eczaneleri buluşturan B2B dijital sipariş ve tedarik platformu geliştirir." },
        { name: "İlter İç Ve Dış Ltd. Şti.", slug: "ilter-ic-dis", sector: "Yapay Zekâ / Computer Vision / Davranış Analitiği", shortDesc: "Beden dili ve mikro ifadeleri analiz eden yapay zekâ tabanlı platform geliştirir." },
        { name: "İnvo Proje Danışmanlık Hizmetleri Ltd. Şti.", slug: "invo-proje", sector: "FinTech / GovTech / Yapay Zekâ SaaS", shortDesc: "KOBİ’ler için hibe-teşvik eşleştirme, başvuru asistanı ve proje yönetimi sağlayan AI destekli platform sunar." },
        { name: "Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.", slug: "hazir-cevap", sector: "Lojistik Teknolojileri / Mobil SaaS", shortDesc: "Uluslararası taşımacılıkta sürücü takibi, evrak yönetimi ve operasyon dijitalleşmesi sağlayan mobil platform geliştirir." },
        { name: "Altelca Aviation", slug: "altelca-aviation", sector: "Havacılık Teknolojileri / Simülasyon", shortDesc: "Havacılık eğitimine yönelik hareketli uçuş simülatörleri ve ilgili yazılım-donanım entegrasyonları geliştirir." },
        { name: "M-RADS (Medical Reporting and Detection System)", slug: "m-rads", sector: "Sağlıkta Yapay Zekâ / Medikal Görüntüleme", shortDesc: "MRI/CT/USG gibi görüntülerden ön tanı ve raporlama desteği veren çok modaliteli medikal AI karar destek sistemi geliştirir." },
        { name: "Elevatora", slug: "elevatora", sector: "ERP / KOBİ Dijital Dönüşüm", shortDesc: "İmalat ve saha hizmetleri KOBİ’leri için modüler bulut ERP (stok-üretim-CRM-finans-saha) çözümleri sunar." },
        { name: "Fatma Patlar Akbulut (Akfa)", slug: "akfa-guvenlik", sector: "Siber Güvenlik / Yapay Zekâ Güvenliği / RegTech", shortDesc: "LLM’ler için prompt injection/jailbreak/PII sızıntısı gibi riskleri test eden ve EU AI Act uyum araçları sunan platformdur." },
        { name: "Insprefex Yazılım Danışmanlık Anonim Şirketi", slug: "insprefex", sector: "Customer Experience / Analytics / Yapay Zekâ", shortDesc: "NPS/CSAT/CES gibi metrikleri tek havuzda toplayıp analitik ve AI ile müşteri içgörüsü üreten CX platformudur." },
        { name: "Emre Ertürk Ve Oğuzhan Gökduman Ortaklığı", slug: "emre-erturk-oguzhan-gokduman", sector: "Yazılım / Teknoloji", shortDesc: "Yeni eklenen ortaklık girişimi." }
    ];

    for (let i = 0; i < initialEntrepreneurs.length; i++) {
        const ent = initialEntrepreneurs[i];
        const existing = await prisma.entrepreneur.findUnique({ where: { slug: ent.slug } });
        if (!existing) {
            await prisma.entrepreneur.create({
                data: {
                    ...ent,
                    status: 'ACTIVE',
                    isFeatured: i < 6,
                    sortOrder: i,
                },
            });
        }
    }

    // 6. CATEGORIES & NEWS SEED
    console.log('Seeding categories and news...');
    const catEvent = await prisma.category.upsert({ where: { slug: 'etkinlik' }, update: {}, create: { name: 'Etkinlik', slug: 'etkinlik', type: 'EVENT' } });
    const catProgram = await prisma.category.upsert({ where: { slug: 'program' }, update: {}, create: { name: 'Program', slug: 'program', type: 'PROGRAM' } });
    const catAnnouncement = await prisma.category.upsert({ where: { slug: 'duyuru' }, update: {}, create: { name: 'Duyuru', slug: 'duyuru', type: 'NEWS' } });

    const initialNews = [
        {
            title: "ANTSPARK Demoday 2026 Gerçekleştirildi: Girişimcilik Ekosistemi İKÜANTS TEKMER Çatısı Altında Buluştu",
            slug: "antspark-demoday-2026-gerceklestirildi",
            excerpt: "İKÜANTS TEKMER tarafından yürütülen ANTSPARK Ön Kuluçka Programı kapsamında düzenlenen ANTSPARK Demoday 2026, girişimcilik ekosisteminin önemli paydaşlarını bir araya getirdi.",
            content: "İKÜANTS TEKMER tarafından yürütülen ANTSPARK Ön Kuluçka Programı kapsamında düzenlenen ANTSPARK Demoday 2026, girişimcilik ekosisteminin önemli paydaşlarını, yatırımcıları, mentörleri ve kamu temsilcilerini bir araya getirdi.\n\nDemoday etkinliği kapsamında gerçekleştirilen ödül töreninde dereceye giren girişimcilere nakit ödüller ve CMS yazılım destekleri takdim edildi.",
            coverImage: "/images/news/antspark-demoday-2026/05.jpg",
            categoryId: catEvent.id,
            status: "PUBLISHED",
            publishedAt: new Date("2026-02-18"),
            eventDate: "18 Şubat 2026",
            isFeatured: true,
            showOnHome: true,
        },
        {
            title: "İKÜANTS TEKMER Staj Başvuruları Açıldı",
            slug: "ikuants-tekmer-staj-basvurulari-acildi",
            excerpt: "İKÜANTS TEKMER bünyesinde faaliyet gösteren girişimci firmaların stajyer talepleri ile öğrenciler için staj başvuruları açıldı.",
            content: "İKÜANTS TEKMER bünyesinde faaliyet gösteren girişimci firmaların stajyer talepleri ile staj yapmak isteyen öğrenciler için staj başvuruları açıldı.",
            coverImage: "/images/news/staj-basvurulari/01.jpg",
            categoryId: catAnnouncement.id,
            status: "PUBLISHED",
            publishedAt: new Date("2025-02-05"),
            eventDate: "05 Şubat 2025",
            isFeatured: false,
            showOnHome: true,
        },
        {
            title: "TÜBİTAK Proje Destekleri Eğitimi",
            slug: "tubitak-proje-destekleri-egitimi",
            excerpt: "İKÜANTS TEKMER koordinasyonunda TÜBİTAK TEYDEB 1501, 1507 ve 1707 Ar-Ge Destek Programları hakkında çevrim içi eğitim düzenlenecek.",
            content: "İKÜANTS TEKMER koordinasyonunda; ATLAS TEKMER, İstanbul Ticaret Üniversitesi TTO, BTM TEKMER ve Maribor Mühendislik paydaşlığında eğitim düzenlendi.",
            coverImage: "/images/news/tubitak-egitim/01.png",
            categoryId: catAnnouncement.id,
            status: "PUBLISHED",
            publishedAt: new Date("2026-01-27"),
            eventDate: "27 Ocak 2026",
            registrationLink: "https://forms.gle/rCGsZPwatVXRCbqM7",
            isFeatured: true,
            showOnHome: true,
        },
    ];

    for (const newsItem of initialNews) {
        const existing = await prisma.news.findUnique({ where: { slug: newsItem.slug } });
        if (!existing) {
            await prisma.news.create({ data: newsItem });
        }
    }

    // 7. PROGRAMS SEED
    console.log('Seeding programs...');
    const initialPrograms = PROGRAM_DEFAULTS;

    for (const prog of initialPrograms) {
        const existing = await prisma.program.findUnique({ where: { slug: prog.slug } });
        if (!existing) {
            await prisma.program.create({ data: prog });
        }
    }

    // 8. SUPPORTS SEED
    console.log('Seeding supports...');
    const initialSupports = [
        { title: "AR-GE VE TASARIM İNDİRİMİ", description: "Ar-Ge ve yenilik veya tasarım harcamalarının tamamı (%100'ü) kurum kazancının tespitinde indirim konusu yapılmaktadır.", sortOrder: 1 },
        { title: "GELİR VERGİSİ STOPAJI TEŞVİKİ", description: "Teknoloji merkezlerinde çalışan Ar-Ge ve destek personelinin elde ettikleri ücretler üzerinden hesaplanan gelir vergisinin belirli oranları vergiden indirilebilir.", sortOrder: 2 },
        { title: "SİGORTA PRİMİ DESTEĞİ", description: "Teknoloji merkezlerinde çalışan Ar-Ge ve destek personelinin elde ettikleri ücretler üzerinden hesaplanan sigorta primi işveren hissesinin %50'si karşılanmaktadır.", sortOrder: 3 },
        { title: "DAMGA VERGİSİ İSTİSNASI", description: "Ar-Ge ve yenilik faaliyetleri ile ilgili olarak düzenlenen kağıtlar damga vergisinden istisnadır.", sortOrder: 4 },
        { title: "GÜMRÜK VERGİSİ İSTİSNASI", description: "Ar-Ge, yenilik ve tasarım projeleri ile ilgili araştırmalarda kullanılmak üzere ithal edilen eşya gümrük vergisinden ve diğer harcamalardan istisnadır.", sortOrder: 5 },
        { title: "TEMEL BİLİMLER DESTEĞİ", description: "En az lisans derecesine sahip Ar-Ge personeli için asgari ücretin brüt tutarı kadarlık kısmı Bakanlık bütçesinden karşılanır.", sortOrder: 6 },
    ];

    for (const supp of initialSupports) {
        const existing = await prisma.support.findFirst({ where: { title: supp.title } });
        if (!existing) {
            await prisma.support.create({ data: supp });
        }
    }

    // 9. DEFAULT MENUS SEED
    console.log('Seeding default menus...');
    const headerMenuItems = [
        { label: 'Girişimciler', url: '/girisimciler', menuLocation: 'HEADER', sortOrder: 1 },
        { label: 'Mentörler', url: '/mentorler', menuLocation: 'HEADER', sortOrder: 2 },
        { label: 'Programlar', url: '/programlar', menuLocation: 'HEADER', sortOrder: 3 },
        { label: 'Destekler', url: '/destekler', menuLocation: 'HEADER', sortOrder: 4 },
        { label: 'Haberler', url: '/haberler', menuLocation: 'HEADER', sortOrder: 5 },
        { label: 'İletişim', url: '/iletisim', menuLocation: 'HEADER', sortOrder: 6 },
    ];

    for (const item of headerMenuItems) {
        const existing = await prisma.menuItem.findFirst({
            where: { label: item.label, menuLocation: item.menuLocation },
        });
        if (!existing) {
            await prisma.menuItem.create({
                data: {
                    label: item.label,
                    url: item.url,
                    menuLocation: item.menuLocation,
                    sortOrder: item.sortOrder,
                    isActive: true,
                },
            });
        }
    }

    // 10. DEFAULT SITE SETTINGS
    console.log('Seeding default site settings...');
    const defaultSettings = [
        { key: 'site_title', value: 'İKÜANTS TEKMER | İnovasyon ve Teknoloji Merkezi', group: 'GENERAL', description: 'Site başlığı' },
        { key: 'contact_address', value: 'Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14 A Bakırköy 34158 İstanbul', group: 'CONTACT', description: 'Merkez adresi' },
        { key: 'contact_email', value: 'info@ikuantstekmer.com', group: 'CONTACT', description: 'Resmi e-posta adresi' },
        { key: 'contact_phone', value: '(0212) 498 41 62', group: 'CONTACT', description: 'Telefon numarası' },
        { key: 'social_instagram', value: 'https://www.instagram.com/ikuantstekmer/', group: 'SOCIAL', description: 'Instagram profili' },
        { key: 'social_linkedin', value: 'https://www.linkedin.com/company/ikuants-tekmer/', group: 'SOCIAL', description: 'LinkedIn sayfası' },
        { key: 'social_whatsapp', value: 'https://chat.whatsapp.com/LAg3l2cUSFOHBn0miCO9lz', group: 'SOCIAL', description: 'WhatsApp kanalı' },
    ];

    for (const s of defaultSettings) {
        await prisma.siteSetting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }

    // 11. EVALUATION TEMPLATE
    console.log('Seeding evaluation templates...');
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
        where: { name: "İKÜANTS Standart Jüri & Mentör Değerlendirme Matrisi" }
    });

    if (!existingTemplate) {
        await prisma.evaluationTemplate.create({
            data: {
                name: "İKÜANTS Standart Jüri & Mentör Değerlendirme Matrisi",
                description: "Girişim başvuruları için standart 5 boyutlu değerlendirme kriterleri",
                criteria: {
                    create: [
                        { name: "Yenilikçilik ve Özgünlük", maxScore: 10, weight: 1.2, sortOrder: 1 },
                        { name: "Pazar Büyüklüğü ve Ticarileşme Potansiyeli", maxScore: 10, weight: 1.5, sortOrder: 2 },
                        { name: "Ekip Yetkinliği ve Taahhüt", maxScore: 10, weight: 1.3, sortOrder: 3 },
                        { name: "Teknik Uygulanabilirlik (TRL)", maxScore: 10, weight: 1.0, sortOrder: 4 },
                        { name: "TEKMER İhtiyaç / Katma Değer Uyumu", maxScore: 10, weight: 1.0, sortOrder: 5 },
                    ]
                }
            }
        });
    }

    // 12. ENTERPRISE EMAIL TEMPLATES
    console.log('Seeding default email templates...');
    const defaultTemplates = [
        {
            templateKey: 'APPLICATION_RECEIVED',
            name: 'Başvuru Alındı Bildirimi (Başvurana)',
            subject: 'Başvurunuz Alındı: {{applicationNumber}} — {{programName}}',
            htmlBody: '<h2>Sayın {{recipientName}},</h2><p>{{programName}} başvurunuz başarıyla alınmıştır. Başvuru Numaranız: <strong>{{applicationNumber}}</strong></p>',
            variables: JSON.stringify(['recipientName', 'applicationNumber', 'programName']),
        },
        {
            templateKey: 'APPLICATION_NEW_ADMIN',
            name: 'Yeni Başvuru Yönetici Bildirimi',
            subject: '[Yeni Başvuru] {{applicationNumber}} — {{programName}}',
            htmlBody: '<h3>Yeni Başvuru Alındı</h3><p>Başvuran: {{applicantName}} | Program: {{programName}}</p><p><a href="{{actionUrl}}">Başvuruyu İncele</a></p>',
            variables: JSON.stringify(['applicationNumber', 'programName', 'applicantName', 'actionUrl']),
        },
        {
            templateKey: 'TASK_ASSIGNED',
            name: 'Görev Atandı Bildirimi',
            subject: 'Yeni Görev Atandı: {{taskTitle}}',
            htmlBody: '<h3>Sayın {{recipientName}},</h3><p>{{assignerName}} tarafından size yeni bir görev atandı: <strong>{{taskTitle}}</strong></p><p><a href="{{actionUrl}}">Görevi Aç</a></p>',
            variables: JSON.stringify(['recipientName', 'assignerName', 'taskTitle', 'actionUrl']),
        },
        {
            templateKey: 'USER_INVITE',
            name: 'Yönetim Paneli Davet E-postası',
            subject: 'İKÜANTS TEKMER Yönetim Paneline Davet Edildiniz',
            htmlBody: '<h3>Sayın {{recipientName}},</h3><p>İKÜANTS TEKMER Yönetim Paneline <strong>{{roleName}}</strong> olarak davet edildiniz.</p><p><a href="{{actionUrl}}">Hesabınızı Etkinleştirin</a></p>',
            variables: JSON.stringify(['recipientName', 'roleName', 'actionUrl']),
        },
        {
            templateKey: 'PASSWORD_RESET',
            name: 'Şifre Sıfırlama E-postası',
            subject: 'İKÜANTS TEKMER — Şifre Sıfırlama',
            htmlBody: '<h3>Sayın {{recipientName}},</h3><p>Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanabilirsiniz:</p><p><a href="{{actionUrl}}">Şifremi Sıfırla</a></p>',
            variables: JSON.stringify(['recipientName', 'actionUrl']),
        },
        {
            templateKey: 'SECURITY_ALERT',
            name: 'Güvenlik Uyarısı Bildirimi',
            subject: '[Güvenlik Uyarısı] {{alertTitle}}',
            htmlBody: '<h3>Güvenlik Uyarısı</h3><p>{{alertDetails}}</p>',
            variables: JSON.stringify(['alertTitle', 'alertDetails']),
        },
    ];

    for (const t of defaultTemplates) {
        await prisma.emailTemplate.upsert({
            where: { templateKey: t.templateKey },
            update: { name: t.name, subject: t.subject },
            create: t,
        });
    }

    // 13. ENTERPRISE TERMINOLOGY LABELS
    console.log('Seeding default terminology labels...');
    const defaultLabels = [
        { key: 'tasks.title', group: 'MODULES', defaultLabel: 'Görevler', description: 'Görev modülü ana başlığı' },
        { key: 'tasks.create', group: 'BUTTONS', defaultLabel: 'Yeni Görev', description: 'Görev oluşturma butonu' },
        { key: 'tasks.status.todo', group: 'STATUSES', defaultLabel: 'Yapılacak', description: 'To-do durum etiketi' },
        { key: 'tasks.status.in_progress', group: 'STATUSES', defaultLabel: 'Devam Ediyor', description: 'In-progress durum etiketi' },
        { key: 'tasks.status.review', group: 'STATUSES', defaultLabel: 'İncelemede', description: 'Review durum etiketi' },
        { key: 'tasks.status.done', group: 'STATUSES', defaultLabel: 'Tamamlandı', description: 'Done durum etiketi' },
        { key: 'applications.title', group: 'MODULES', defaultLabel: 'Başvurular', description: 'Başvuru modülü ana başlığı' },
        { key: 'applications.status.new', group: 'STATUSES', defaultLabel: 'Yeni Başvuru', description: 'Yeni başvuru durumu' },
        { key: 'applications.status.pre_review', group: 'STATUSES', defaultLabel: 'Ön İnceleme', description: 'Ön inceleme durumu' },
        { key: 'applications.status.under_evaluation', group: 'STATUSES', defaultLabel: 'Değerlendirmede', description: 'Değerlendirme durumu' },
        { key: 'applications.status.accepted', group: 'STATUSES', defaultLabel: 'Kabul Edildi', description: 'Kabul durumu' },
        { key: 'applications.status.rejected', group: 'STATUSES', defaultLabel: 'Reddedildi', description: 'Red durumu' },
        { key: 'entrepreneurs.title', group: 'MODULES', defaultLabel: 'Girişimciler', description: 'Girişimci modülü ana başlığı' },
        { key: 'mentors.title', group: 'MODULES', defaultLabel: 'Mentörler', description: 'Mentör modülü ana başlığı' },
        { key: 'activities.title', group: 'MODULES', defaultLabel: 'Kurumsal Faaliyetler', description: 'Faaliyetler modülü başlığı' },
        { key: 'projects.title', group: 'MODULES', defaultLabel: 'Projeler', description: 'Proje modülü başlığı' },
    ];

    for (const l of defaultLabels) {
        await prisma.terminologyLabel.upsert({
            where: { key: l.key },
            update: { defaultLabel: l.defaultLabel, group: l.group, description: l.description },
            create: l,
        });
    }

    // 14. ENTERPRISE PIPELINE STATUSES
    console.log('Seeding default pipeline statuses...');
    const defaultPipelines = [
        // Applications
        { moduleKey: 'APPLICATION', statusKey: 'NEW', displayLabel: 'Yeni Başvuru', colorCode: '#3b82f6', sortOrder: 1, isInitial: true },
        { moduleKey: 'APPLICATION', statusKey: 'PRE_REVIEW', displayLabel: 'Ön İnceleme', colorCode: '#8b5cf6', sortOrder: 2 },
        { moduleKey: 'APPLICATION', statusKey: 'MISSING_DOCS', displayLabel: 'Eksik Evrak', colorCode: '#f59e0b', sortOrder: 3 },
        { moduleKey: 'APPLICATION', statusKey: 'UNDER_EVALUATION', displayLabel: 'Değerlendirmede', colorCode: '#06b6d4', sortOrder: 4 },
        { moduleKey: 'APPLICATION', statusKey: 'JURY', displayLabel: 'Jüri / Mülakat', colorCode: '#ec4899', sortOrder: 5 },
        { moduleKey: 'APPLICATION', statusKey: 'ACCEPTED', displayLabel: 'Kabul Edildi', colorCode: '#10b981', sortOrder: 6, isTerminal: true },
        { moduleKey: 'APPLICATION', statusKey: 'REJECTED', displayLabel: 'Reddedildi', colorCode: '#ef4444', sortOrder: 7, isTerminal: true },
        { moduleKey: 'APPLICATION', statusKey: 'WAITLIST', displayLabel: 'Yedek Liste', colorCode: '#6b7280', sortOrder: 8 },

        // Tasks
        { moduleKey: 'TASK', statusKey: 'TODO', displayLabel: 'Yapılacak', colorCode: '#64748b', sortOrder: 1, isInitial: true },
        { moduleKey: 'TASK', statusKey: 'IN_PROGRESS', displayLabel: 'Devam Ediyor', colorCode: '#3b82f6', sortOrder: 2 },
        { moduleKey: 'TASK', statusKey: 'REVIEW', displayLabel: 'İncelemede', colorCode: '#f59e0b', sortOrder: 3 },
        { moduleKey: 'TASK', statusKey: 'DONE', displayLabel: 'Tamamlandı', colorCode: '#10b981', sortOrder: 4, isTerminal: true },
        { moduleKey: 'TASK', statusKey: 'CANCELLED', displayLabel: 'İptal Edildi', colorCode: '#94a3b8', sortOrder: 5, isTerminal: true },
    ];

    for (const p of defaultPipelines) {
        await prisma.pipelineStatus.upsert({
            where: { moduleKey_statusKey: { moduleKey: p.moduleKey, statusKey: p.statusKey } },
            update: { displayLabel: p.displayLabel, colorCode: p.colorCode, sortOrder: p.sortOrder },
            create: p,
        });
    }

    // 15. DEFAULT CUSTOM FIELDS
    console.log('Seeding default custom fields...');
    const defaultCustomFields = [
        {
            moduleKey: 'ENTREPRENEUR',
            fieldKey: 'is_exporting',
            label: 'İhracat Yapıyor mu?',
            fieldType: 'BOOLEAN',
            isPublic: true,
            sortOrder: 1,
        },
        {
            moduleKey: 'ENTREPRENEUR',
            fieldKey: 'trl_level',
            label: 'Teknolojik Hazırlık Seviyesi (TRL)',
            fieldType: 'SELECT',
            optionsJson: JSON.stringify(['TRL 1-3 (Fikir/Temel Ar-Ge)', 'TRL 4-6 (Prototip/Doğrulama)', 'TRL 7-9 (Ticarileşme/Saha)']),
            isPublic: true,
            sortOrder: 2,
        },
        {
            moduleKey: 'ENTREPRENEUR',
            fieldKey: 'annual_revenue',
            label: 'Yıllık Ciro (TRY)',
            fieldType: 'CURRENCY',
            viewPermission: 'finance_view',
            editPermission: 'finance_edit',
            isPublic: false,
            sortOrder: 3,
        },
    ];

    for (const cf of defaultCustomFields) {
        await prisma.customFieldDefinition.upsert({
            where: { moduleKey_fieldKey: { moduleKey: cf.moduleKey, fieldKey: cf.fieldKey } },
            update: { label: cf.label, fieldType: cf.fieldType },
            create: cf,
        });
    }

    // Form Center: KVKK texts, public business forms, application campaigns (create-only)
    await seedFormCenter();
    await seedVerifiedSpaces();
    await seedEmailTemplates(prisma);

    console.log('✅ Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
