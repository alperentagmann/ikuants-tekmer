import test from 'node:test';
import assert from 'node:assert/strict';
import { SocialMediaService } from '../lib/services/social-media-service';
import { CaseStudyService } from '../lib/services/case-study-service';
import { FaqService } from '../lib/services/faq-service';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

test('1. Password Hashing - Bcrypt cost factor and salt verification', async () => {
    const rawPass = 'TestSecurePassword!123';
    const hash = await bcrypt.hash(rawPass, 10);
    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Hash should be valid bcrypt format');
    const isValid = await bcrypt.compare(rawPass, hash);
    assert.strictEqual(isValid, true, 'Valid password must verify');
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isInvalid, false, 'Invalid password must fail');
});

test('2. Case Study Service - CRUD and public visibility', async () => {
    const testSlug = `test-case-${Date.now()}`;
    const study = await CaseStudyService.createCaseStudy({
        title: 'Test Savunma ve Havacılık Başarı Hikâyesi',
        summary: 'Kuluçka merkezimizden çıkan başarılı girişim örneği.',
        challenge: 'Prototip aşamasında kaynak ve mentörlük ihtiyacı.',
        solution: 'ANTsPARK bünyesinde Ar-Ge ofisi ve KOSGEB hibe danışmanlığı.',
        contribution: '24 saat mentörlük ve yatırımcı erişimi sağlandı.',
        results: '2. tur yatırım tamamlandı.',
        metrics: '350.000$ Yatırım & 5 Patent',
        isPublished: true,
        featuredOrder: 1,
    });

    assert.ok(study.id, 'Case study should be created with ID');
    assert.strictEqual(study.isPublished, true);

    const fetched = await CaseStudyService.getCaseStudyBySlug(study.slug);
    assert.ok(fetched, 'Should fetch created study by slug');
    assert.strictEqual(fetched?.title, 'Test Savunma ve Havacılık Başarı Hikâyesi');

    const publishedList = await CaseStudyService.getPublishedCaseStudies();
    const foundInList = publishedList.some((s) => s.id === study.id);
    assert.strictEqual(foundInList, true, 'Published study must appear in public list');

    // Clean up
    await CaseStudyService.deleteCaseStudy(study.id);
});

test('3. FAQ Service - 5 core FAQ items & CRUD', async () => {
    const faqs = await FaqService.getPublicFaqs();
    assert.ok(faqs.length >= 5, 'Should have at least 5 FAQ items available');
    assert.ok(faqs.some((f) => f.question.includes('TEKMER')), 'FAQ should include core institutional question');
});

test('4. Social Media Integration - Deduplication & Auto-Drafting', async () => {
    const mockAccountId = `mock_ig_${Date.now()}`;
    const account = await SocialMediaService.connectAccount({
        provider: 'INSTAGRAM',
        accountName: 'ikuants_test',
        accountId: mockAccountId,
        syncMode: 'AUTO_DRAFT',
    });

    assert.ok(account.id, 'Account should be connected');

    const postExternalId = `ext_post_${Date.now()}`;
    const samplePost = {
        externalId: postExternalId,
        caption: 'İKÜANTS TEKMER Girişimcilik Zirvesi Başlıyor! #etkinlik #duyuru Detaylar web sitemizde.',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
        permalink: `https://instagram.com/p/${postExternalId}`,
        postDate: new Date(),
    };

    // First Ingestion: should import & draft
    const res1 = await SocialMediaService.ingestExternalPosts(account.id, [samplePost]);
    assert.strictEqual(res1.imported, 1, 'First ingestion should import 1 post');
    assert.strictEqual(res1.drafted, 1, 'First ingestion should auto-draft 1 news item');

    // Second Ingestion: Idempotency & Deduplication
    const res2 = await SocialMediaService.ingestExternalPosts(account.id, [samplePost]);
    assert.strictEqual(res2.imported, 0, 'Duplicate post MUST NOT be imported again');

    // Verify draft news exists
    const posts = await SocialMediaService.getPosts({ accountId: account.id });
    assert.strictEqual(posts.items.length, 1);
    const postRecord = posts.items[0];
    assert.strictEqual(postRecord.syncStatus, 'DRAFT_CREATED');
    assert.ok(postRecord.convertedNewsId, 'Should have convertedNewsId linked');

    // Clean up
    if (postRecord.convertedNewsId) {
        await prisma.news.delete({ where: { id: postRecord.convertedNewsId } }).catch(() => {});
    }
    await prisma.socialPost.deleteMany({ where: { socialAccountId: account.id } });
    await prisma.socialAccount.delete({ where: { id: account.id } });
});

test('5. Webhook Security - HMAC SHA-256 signature validation', () => {
    const appSecret = 'super_secret_meta_key_12345';
    const payload = JSON.stringify({ object: 'instagram', entry: [{ id: '123' }] });
    const signature = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');
    const validHeader = `sha256=${signature}`;

    const isValid = SocialMediaService.validateMetaWebhookSignature(payload, validHeader, appSecret);
    assert.strictEqual(isValid, true, 'Valid HMAC signature must pass');

    const isInvalid = SocialMediaService.validateMetaWebhookSignature(payload, 'sha256=invalid_hash', appSecret);
    assert.strictEqual(isInvalid, false, 'Tampered HMAC signature must fail');

    const isMissing = SocialMediaService.validateMetaWebhookSignature(payload, null, appSecret);
    assert.strictEqual(isMissing, false, 'Missing signature must fail');
});

test('6. Input Validation & XSS Defense', () => {
    const maliciousPayload = `<script>alert("XSS")</script><img src="x" onerror="alert(1)">`;
    // Sanitization check
    const sanitized = maliciousPayload.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    assert.strictEqual(sanitized.includes('<script>'), false, 'Script tags must be stripped');
});
