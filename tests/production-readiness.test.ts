import { test, describe } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { prisma, getSafeDatabaseErrorMessage } from '../lib/prisma';
import { EntrepreneurService } from '../lib/services/entrepreneur-service';
import { MentorService } from '../lib/services/mentor-service';
import { verifyPassword } from '../lib/auth';

describe('Production Database & Super Admin Readiness', () => {
    test('getSafeDatabaseErrorMessage sanitizes database error without leaking hostnames or ports', () => {
        const fakeDbError = new Error("Can't reach database server at `localhost:5432`");
        const safe = getSafeDatabaseErrorMessage(fakeDbError);
        assert.strictEqual(safe.isDbError, true);
        assert.strictEqual(
            safe.message,
            'Sistem veritabanına şu anda erişilemiyor. Lütfen daha sonra tekrar deneyin.'
        );
        assert.ok(!safe.message.includes('localhost'), 'Must not leak localhost');
        assert.ok(!safe.message.includes('5432'), 'Must not leak port');
    });

    test('Production Super Admin account (bilgi@ikuantstekmer.com) exists with SUPER_ADMIN role and ACTIVE status', async () => {
        const user = await prisma.user.findUnique({
            where: { email: 'bilgi@ikuantstekmer.com' },
        });
        assert.ok(user, 'bilgi@ikuantstekmer.com must exist in database');
        assert.strictEqual(user.isSuperAdmin, true, 'Must be super admin');
        assert.strictEqual(user.isActive, true, 'Must be active');
        assert.ok(user.passwordHash.startsWith('$2'), 'Password must be securely hashed with bcrypt');
    });

    test('Legacy admin account (admin@ikuantstekmer.com) is disabled (isActive: false) to prevent production access', async () => {
        const legacyUser = await prisma.user.findUnique({
            where: { email: 'admin@ikuantstekmer.com' },
        });
        if (legacyUser) {
            assert.strictEqual(legacyUser.isActive, false, 'Legacy admin must be disabled in production');
        }
    });

    test('Single Source of Truth: Public entrepreneurs match published DB count', async () => {
        const publicList = await EntrepreneurService.getPublicEntrepreneurs();
        const dbPublished = await prisma.entrepreneur.findMany({
            where: { isPublished: true, status: 'ACTIVE', isArchived: false },
        });
        assert.strictEqual(
            publicList.length,
            dbPublished.length,
            `Public list (${publicList.length}) must match published DB records (${dbPublished.length})`
        );
        assert.ok(publicList.length >= 17, 'Expected at least 17 active public entrepreneurs');
    });

    test('Single Source of Truth: Public mentors match active DB count', async () => {
        const publicMentors = await MentorService.getPublicMentors();
        const dbActiveMentors = await prisma.mentor.findMany({
            where: { isActive: true, isArchived: false },
        });
        assert.strictEqual(
            publicMentors.length,
            dbActiveMentors.length,
            `Public mentors (${publicMentors.length}) must match active DB mentors (${dbActiveMentors.length})`
        );
        assert.strictEqual(publicMentors.length, 22, 'Expected exactly 22 mentors in DB and public feed');
    });

    test('Mentors retain complete profile details in DB (images, linkedin, company, title)', async () => {
        const mentors = await MentorService.getPublicMentors();
        mentors.forEach((m) => {
            assert.ok(m.name, 'Mentor has name');
            assert.ok(m.company, `Mentor ${m.name} has company`);
            assert.ok(m.title, `Mentor ${m.name} has title`);
            assert.ok(m.imageUrl, `Mentor ${m.name} has image URL`);
        });
    });
});
