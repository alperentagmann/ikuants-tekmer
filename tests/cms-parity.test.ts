import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma';
import { BoardService } from '../lib/services/board-service';
import { TeamService } from '../lib/services/team-service';
import { PartnerService } from '../lib/services/partner-service';
import { FacilityService } from '../lib/services/facility-service';
import { ServiceItemService } from '../lib/services/service-item-service';
import { LegislationService } from '../lib/services/legislation-service';
import { FaqService } from '../lib/services/faq-service';
import { AboutService } from '../lib/services/about-service';

describe('CMS Parity & Content Management Suite', () => {

    test('1. Board Member CRUD, filtration by boardType and public visibility', async () => {
        const testName = `Test Board Member ${Date.now()}`;
        
        // Create
        const created = await BoardService.createBoardMember({
            fullName: testName,
            title: 'Danışma Kurulu Test Üyesi',
            boardType: 'DANISMA',
            organization: 'Test Org',
            isActive: true,
            isPublished: true,
            sortOrder: 999,
        });
        assert.ok(created.id, 'Board member must be created with ID');
        assert.equal(created.fullName, testName);

        // Public visibility check
        const publicList = await BoardService.getPublicBoardMembers('DANISMA');
        const found = publicList.find(m => m.id === created.id);
        assert.ok(found, 'Created board member must be present in public feed');

        // Update
        const updated = await BoardService.updateBoardMember(created.id, {
            title: 'Güncellenmiş Unvan',
            isActive: false,
        });
        assert.equal(updated.title, 'Güncellenmiş Unvan');

        // Public check when inactive
        const publicListAfter = await BoardService.getPublicBoardMembers('DANISMA');
        const foundAfter = publicListAfter.find(m => m.id === created.id);
        assert.equal(foundAfter, undefined, 'Inactive board member must not appear in public feed');

        // Cleanup
        await BoardService.deleteBoardMember(created.id);
    });

    test('2. Team Member CRUD and public synchronization', async () => {
        const testName = `Test Team Member ${Date.now()}`;

        // Create
        const created = await TeamService.createTeamMember({
            fullName: testName,
            title: 'Kuluçka Yöneticisi',
            department: 'YÖNETİM',
            email: 'test.team@ikuantstekmer.com',
            phone: '0212 498 00 00',
            bio: 'Test biyografi metni',
            isActive: true,
        });
        assert.ok(created.id);

        // Public check
        const publicTeam = await TeamService.getPublicTeamMembers();
        const found = publicTeam.find(t => t.id === created.id);
        assert.ok(found, 'Team member must be visible in public list');

        // Delete cleanup
        await TeamService.deleteTeamMember(created.id);
        const publicTeamAfter = await TeamService.getPublicTeamMembers();
        assert.ok(!publicTeamAfter.some(t => t.id === created.id));
    });

    test('3. Partner & Collaboration CRUD', async () => {
        const testName = `Test Partner ${Date.now()}`;

        const created = await PartnerService.createPartner({
            name: testName,
            logoUrl: '/images/test-partner.png',
            description: 'Stratejik partnerlik açıklaması',
            websiteUrl: 'https://testpartner.com',
            partnerGroup: 'STAKEHOLDER',
            isActive: true,
        });
        assert.ok(created.id);

        const publicPartners = await PartnerService.getPublicPartners('STAKEHOLDER');
        assert.ok(publicPartners.some(p => p.id === created.id));

        // Cleanup
        await PartnerService.deletePartner(created.id);
    });

    test('4. Facility & Usage Areas CRUD', async () => {
        const testTitle = `Test Studio ${Date.now()}`;

        const created = await FacilityService.createFacility({
            title: testTitle,
            description: 'Tam donanımlı ses ve video kayıt stüdyosu',
            facilityType: 'STUDIO',
            featuresJson: JSON.stringify(['4K Kameralar', 'Akustik Panel']),
            iconName: 'Monitor',
            isActive: true,
        });
        assert.ok(created.id);

        const publicFacilities = await FacilityService.getPublicFacilities('STUDIO');
        assert.ok(publicFacilities.some(f => f.id === created.id));

        // Cleanup
        await FacilityService.deleteFacility(created.id);
    });

    test('5. Services (Hizmetlerimiz) CRUD', async () => {
        const testTitle = `Test Service ${Date.now()}`;

        const created = await ServiceItemService.createService({
            title: testTitle,
            description: 'Girişimcilere özel altyapı ve mentorluk hizmeti',
            detailsJson: JSON.stringify(['Hizmet detayı 1', 'Hizmet detayı 2']),
            highlight: '2026 Yeni Destek Paketi',
            colorGradient: 'from-purple-500 to-pink-500',
            isActive: true,
        });
        assert.ok(created.id);

        const publicServices = await ServiceItemService.getPublicServices();
        assert.ok(publicServices.some(s => s.id === created.id));

        // Cleanup
        await ServiceItemService.deleteService(created.id);
    });

    test('6. Legislation (Mevzuat) CRUD and category filtration', async () => {
        const testTitle = `5746 Sayılı Kanun Uygulama Test Tebliği ${Date.now()}`;

        const created = await LegislationService.createLegislation({
            title: testTitle,
            description: 'Ar-Ge ve yenilik teşvikleri mevzuatı',
            category: 'TEBLIG',
            externalUrl: 'https://resmigazete.gov.tr/test',
            isActive: true,
        });
        assert.ok(created.id);

        const publicLeg = await LegislationService.getPublicLegislations('TEBLIG');
        assert.ok(publicLeg.some(l => l.id === created.id));

        // Cleanup
        await LegislationService.deleteLegislation(created.id);
    });

    test('7. FAQ (SSS) CRUD and categories', async () => {
        const testQ = `Test Sorusu ${Date.now()}?`;

        const created = await FaqService.createFaq({
            question: testQ,
            answer: 'Bu bir test cevabıdır.',
            category: 'GENEL',
            sortOrder: 100,
        });
        assert.ok(created.id);

        const publicFaqs = await FaqService.getPublicFaqs();
        assert.ok(publicFaqs.some(f => f.id === created.id));

        // Cleanup
        await FaqService.deleteFaq(created.id);
    });

    test('8. Hakkımızda Structured Content Storage & Retrieval', async () => {
        const initial = await AboutService.getAboutContent();
        assert.ok(initial.title, 'Initial about content title must exist');

        const updated = await AboutService.updateAboutContent({
            ...initial,
            subtitle: 'İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi - Güncel',
        });
        assert.equal(updated.subtitle, 'İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi - Güncel');

        const reloaded = await AboutService.getAboutContent();
        assert.equal(reloaded.subtitle, 'İstanbul Kültür Üniversitesi Teknoloji Geliştirme Merkezi - Güncel');
    });

});
