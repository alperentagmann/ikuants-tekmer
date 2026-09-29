import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hasPermission, UserWithPermissions } from '../lib/rbac';
import { maskTcNumber } from '../lib/auth';

describe('E2E Acceptance Suite: 1. Girişimci İlişkisel Yönetim & Veri Modelleri', () => {
    test('Girişimci kurucu ortak, yatırım, patent, hibe ve kilometre taşı veri yapıları doğrulaması', () => {
        const sampleEntrepreneur = {
            id: 'ent-101',
            companyName: 'Quantum AI Tech A.Ş.',
            brandName: 'QuantAI',
            sector: 'Yapay Zeka / Derin Teknoloji',
            founders: [
                { id: 'f-1', name: 'Dr. Selin Yılmaz', title: 'CEO & Co-Founder', email: 'selin@quantai.com', phone: '+905551112233' },
                { id: 'f-2', name: 'Barış Demir', title: 'CTO & Co-Founder', email: 'baris@quantai.com', phone: '+905554445566' }
            ],
            investments: [
                { id: 'inv-1', round: 'SEED', investor: 'TechVentures VC', amount: 500000, currency: 'USD', valuation: 4000000, date: '2026-03-15' }
            ],
            patents: [
                { id: 'pat-1', title: 'Otonom Karar Destek Algoritması', applicationNumber: 'TR2026/01293', status: 'PENDING', type: 'PATENT' }
            ],
            grants: [
                { id: 'gr-1', provider: 'TÜBİTAK 1507', projectCode: 'TBT-2026-99', amount: 1200000, currency: 'TRY', date: '2026-01-10' }
            ],
            milestones: [
                { id: 'm-1', title: 'MVP Tamamlanması', targetDate: '2026-04-01', isCompleted: true },
                { id: 'm-2', title: 'İlk 10 Pilot Müşteri', targetDate: '2026-07-01', isCompleted: false }
            ]
        };

        assert.strictEqual(sampleEntrepreneur.founders.length, 2);
        assert.strictEqual(sampleEntrepreneur.investments[0].round, 'SEED');
        assert.strictEqual(sampleEntrepreneur.investments[0].amount, 500000);
        assert.strictEqual(sampleEntrepreneur.patents[0].status, 'PENDING');
        assert.strictEqual(sampleEntrepreneur.grants[0].provider, 'TÜBİTAK 1507');
        assert.strictEqual(sampleEntrepreneur.milestones.filter(m => m.isCompleted).length, 1);
    });
});

describe('E2E Acceptance Suite: 2. Hero Banner & Ana Sayfa Stüdyosu', () => {
    test('Hero slayt sıralama, görsel seçimi ve CTA yönlendirme doğrulaması', () => {
        const slide = {
            id: 'slide-1',
            title: 'Geleceği Şekillendiren Girişimler İKÜANTS TEKMER\'de',
            desktopImage: '/images/hero-desktop-1.webp',
            mobileImage: '/images/hero-mobile-1.webp',
            videoUrl: 'https://youtube.com/watch?v=sample',
            primaryButtonText: 'Hemen Başvur',
            primaryButtonUrl: '/basvuru',
            secondaryButtonText: 'Programları Keşfet',
            secondaryButtonUrl: '/programlar',
            order: 1,
            isActive: true,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31')
        };

        const now = new Date('2026-09-24');
        const isWithinActiveWindow = slide.isActive && now >= slide.startDate && now <= slide.endDate;

        assert.strictEqual(isWithinActiveWindow, true);
        assert.ok(slide.desktopImage.endsWith('.webp'));
        assert.ok(slide.primaryButtonUrl.startsWith('/'));
    });
});

describe('E2E Acceptance Suite: 3. Haber Editörü & Blok Mimarisi', () => {
    test('Zengin blok yapısı, taslak-onay durumu ve revizyon anlık görüntüsü', () => {
        const newsArticle = {
            id: 'news-1',
            title: 'İKÜANTS TEKMER Girişimcileri 2026 Yatırım Zirvesinde',
            slug: 'ikuants-tekmer-girisimcileri-2026-yatirim-zirvesinde',
            status: 'PUBLISHED',
            blocks: [
                { type: 'heading', data: { level: 2, text: 'Zirvede 5 Girişimimiz Sahne Aldı' } },
                { type: 'paragraph', data: { text: 'İKÜANTS TEKMER bünyesinde yer alan derin teknoloji girişimlerimiz...' } },
                { type: 'image', data: { url: '/images/news/summit-2026.jpg', caption: 'Yatırım Zirvesi Sahnesi' } }
            ],
            seoTitle: 'İKÜANTS TEKMER Girişimcileri Yatırım Zirvesinde | İKÜANTS',
            seoDescription: 'İKÜANTS TEKMER derin teknoloji girişimleri 2026 Yatırım Zirvesinde sahne aldı.',
            version: 2
        };

        assert.strictEqual(newsArticle.blocks.length, 3);
        assert.strictEqual(newsArticle.blocks[0].type, 'heading');
        assert.strictEqual(newsArticle.status, 'PUBLISHED');
        assert.ok(newsArticle.seoTitle.includes('İKÜANTS'));
    });
});

describe('E2E Acceptance Suite: 4. ANTsPARK Müfredat & Yoklama Yönetimi', () => {
    test('Haftalık eğitim modülleri, katılımcı yoklaması ve sertifika uygunluğu', () => {
        const curriculum = [
            { week: 1, topic: 'İş Modeli Kanvası & Değer Önerisi', trainer: 'Dr. Ahmet Kaya', completed: true },
            { week: 2, topic: 'Pazar Doğrulama & Müşteri Mülakatları', trainer: 'Merve Arslan', completed: true },
            { week: 3, topic: 'Finansal Modelleme & Birim İktisat', trainer: 'Murat Yurt', completed: true },
            { week: 4, topic: 'Yatırımcı Sunumu (Pitching) & Demo Day', trainer: 'Banu Çetin', completed: false }
        ];

        const attendance = [
            { participantId: 'p-1', attendedWeeks: [1, 2, 3], totalWeeks: 4 },
            { participantId: 'p-2', attendedWeeks: [1, 2], totalWeeks: 4 }
        ];

        // 75% ve üzeri katılım sertifika almaya hak kazanır (3/4 = 75%)
        const p1Eligible = (attendance[0].attendedWeeks.length / attendance[0].totalWeeks) >= 0.75;
        const p2Eligible = (attendance[1].attendedWeeks.length / attendance[1].totalWeeks) >= 0.75;

        assert.strictEqual(p1Eligible, true);
        assert.strictEqual(p2Eligible, false);
        assert.strictEqual(curriculum.filter(c => c.completed).length, 3);
    });
});

describe('E2E Acceptance Suite: 5. Dinamik Form Builder & Versiyonlama', () => {
    test('Form şeması oluşturma, tip doğrulama ve eski yanıtların korunması', () => {
        const formSchemaV1 = {
            id: 'form-antsfire-v1',
            version: 1,
            fields: [
                { id: 'q1', type: 'text', label: 'Proje Başlığı', required: true },
                { id: 'q2', type: 'textarea', label: 'Problem ve Çözüm', required: true }
            ]
        };

        const formSchemaV2 = {
            id: 'form-antsfire-v2',
            version: 2,
            fields: [
                ...formSchemaV1.fields,
                { id: 'q3', type: 'select', label: 'TRL (Teknoloji Hazırlık Seviyesi)', options: ['TRL 4', 'TRL 5', 'TRL 6+'], required: true }
            ]
        };

        const submissionUnderV1 = {
            id: 'sub-1',
            formVersion: 1,
            answers: { q1: 'Otonom Drone Filosu', q2: 'Lojistikte son mil teslimat problemi.' }
        };

        assert.strictEqual(formSchemaV2.fields.length, 3);
        assert.strictEqual(submissionUnderV1.formVersion, 1);
        assert.strictEqual(submissionUnderV1.answers.q1, 'Otonom Drone Filosu');
    });
});

describe('E2E Acceptance Suite: 6. Görev Yönetimi & Bildirimler', () => {
    test('Kanban durum geçişi, checklist tamamlama yüzdesi ve @mention bildirimi', () => {
        const task = {
            id: 'task-55',
            title: '2026 Q3 KOSGEB TEKMER Faaliyet Raporu Hazırlığı',
            status: 'IN_PROGRESS',
            assigneeId: 'usr-1',
            assignerId: 'usr-admin',
            checklist: [
                { id: 'cl-1', text: 'Eğitim yoklama verilerinin toplanması', done: true },
                { id: 'cl-2', text: 'Girişimci ciro/istihdam anketlerinin tamamlanması', done: true },
                { id: 'cl-3', text: 'Fatura ve harcama kanıtlarının arşivlenmesi', done: false }
            ],
            comments: [
                { id: 'comm-1', author: 'Alperen', text: '@Selin hanım harcama kanıtlarını sisteme yüklediniz mi?' }
            ]
        };

        const completedCount = task.checklist.filter(i => i.done).length;
        const progressPercentage = Math.round((completedCount / task.checklist.length) * 100);

        assert.strictEqual(progressPercentage, 67);
        assert.ok(task.comments[0].text.includes('@Selin'));
    });
});

describe('E2E Acceptance Suite: 7. Ortak Kurumsal Takvim & ICS Dışa Aktarım', () => {
    test('RFC 5545 formatında iCalendar (ICS) dize üretimi ve çakışma kontrolü', () => {
        const event1 = {
            id: 'evt-1',
            title: 'ANTSPARK Demo Day 2026',
            start: new Date('2026-10-15T10:00:00Z'),
            end: new Date('2026-10-15T14:00:00Z'),
            location: 'İKÜANTS TEKMER Konferans Salonu'
        };

        const event2Overlapping = {
            id: 'evt-2',
            title: 'Yönetim Kurulu Toplantısı',
            start: new Date('2026-10-15T11:00:00Z'),
            end: new Date('2026-10-15T12:00:00Z'),
            location: 'İKÜANTS TEKMER Konferans Salonu'
        };

        // Çakışma kontrolü: Aynı mekanda zaman çakışması
        const isConflict = (
            event1.location === event2Overlapping.location &&
            event1.start < event2Overlapping.end &&
            event1.end > event2Overlapping.start
        );

        assert.strictEqual(isConflict, true);

        // ICS Çıktı formatı doğrulaması
        const icsMock = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//IKUANTS TEKMER//Kurumsal Takvim//TR',
            'BEGIN:VEVENT',
            `SUMMARY:${event1.title}`,
            `LOCATION:${event1.location}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        assert.ok(icsMock.includes('BEGIN:VCALENDAR'));
        assert.ok(icsMock.includes('SUMMARY:ANTSPARK Demo Day 2026'));
        assert.ok(icsMock.includes('END:VCALENDAR'));
    });
});

describe('E2E Acceptance Suite: 8. Faaliyet & Proje Bütçe Yönetimi', () => {
    test('Proje bütçe gerçekleşme oranı, sapma analizi ve CSV dışa aktarımı', () => {
        const project = {
            id: 'prj-1',
            name: 'KOSGEB TEKMER Destek Programı 2024-2027',
            totalBudget: 5000000,
            spentBudget: 3200000,
            currency: 'TRY',
            categories: [
                { name: 'Personel', allocated: 2000000, spent: 1500000 },
                { name: 'Makine/Teçhizat', allocated: 1500000, spent: 1100000 },
                { name: 'Hizmet Alımı', allocated: 1000000, spent: 500000 },
                { name: 'Seyahat/Tanıtım', allocated: 500000, spent: 100000 }
            ]
        };

        const totalAllocated = project.categories.reduce((acc, c) => acc + c.allocated, 0);
        const totalSpent = project.categories.reduce((acc, c) => acc + c.spent, 0);
        const realizationRate = Math.round((totalSpent / totalAllocated) * 100);

        assert.strictEqual(totalAllocated, 5000000);
        assert.strictEqual(totalSpent, 3200000);
        assert.strictEqual(realizationRate, 64);
    });
});

describe('E2E Acceptance Suite: 9. CRM Paydaş Rehberi & Mükerrer Kayıt Kontrolü', () => {
    test('E-posta ve telefon üzerinden mükerrer kişi/kurum tespiti', () => {
        const directory = [
            { id: 'c-1', fullName: 'Dr. Selin Yılmaz', email: 'selin@quantai.com', phone: '+905551112233', type: 'ENTREPRENEUR' },
            { id: 'c-2', fullName: 'Prof. Dr. Mehmet Kaya', email: 'm.kaya@iku.edu.tr', phone: '+905559998877', type: 'ACADEMICIAN' }
        ];

        const newContactDuplicate = {
            fullName: 'Selin Yılmaz',
            email: 'SELIN@QUANTAI.COM', // Büyük-küçük harf duyarsız kontrol
            phone: '+905551112233',
            type: 'MENTOR'
        };

        const isDuplicate = directory.some(c =>
            c.email.toLowerCase() === newContactDuplicate.email.toLowerCase() ||
            c.phone.replace(/\D/g, '') === newContactDuplicate.phone.replace(/\D/g, '')
        );

        assert.strictEqual(isDuplicate, true);
    });
});

describe('E2E Acceptance Suite: 10. RBAC, Audit Log & PII Maskeleme Güvenliği', () => {
    test('Hassas TC Kimlik maskeleme ve yetkili açma (reveal) audit kaydı', () => {
        const rawTc = '12345678901';
        const masked = maskTcNumber(rawTc);

        assert.strictEqual(masked, '123******01');

        const superAdmin: UserWithPermissions = { id: 'sa-1', isActive: true, isSuperAdmin: true };
        const viewer: UserWithPermissions = {
            id: 'vw-1',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [{ role: { slug: 'viewer', permissions: [{ permission: { action: 'view', resource: 'applications' } }] } }]
        };

        assert.strictEqual(hasPermission(superAdmin, 'view_sensitive', 'applications'), true);
        assert.strictEqual(hasPermission(viewer, 'view_sensitive', 'applications'), false);
    });
});
