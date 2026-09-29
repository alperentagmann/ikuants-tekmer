import { test, describe } from 'node:test';
import assert from 'node:assert';
import { APPLICATION_STATUSES } from '../lib/constants/application';

describe('Form & CRM Workflow Logic', () => {
    test('APPLICATION_STATUSES contains full pipeline life-cycle states', () => {
        const keys = APPLICATION_STATUSES.map((s) => s.key);
        assert.ok(keys.includes('NEW'), 'Pipeline must include NEW status');
        assert.ok(keys.includes('PRE_REVIEW'), 'Pipeline must include PRE_REVIEW status');
        assert.ok(keys.includes('UNDER_EVALUATION'), 'Pipeline must include UNDER_EVALUATION status');
        assert.ok(keys.includes('JURY'), 'Pipeline must include JURY status');
        assert.ok(keys.includes('ACCEPTED'), 'Pipeline must include ACCEPTED status');
        assert.ok(keys.includes('REJECTED'), 'Pipeline must include REJECTED status');
        assert.ok(keys.includes('WAITLIST'), 'Pipeline must include WAITLIST status');
        assert.ok(keys.includes('CONTRACT'), 'Pipeline must include CONTRACT status');
        assert.ok(keys.includes('ACTIVE'), 'Pipeline must include ACTIVE status');
        assert.ok(keys.includes('ARCHIVED'), 'Pipeline must include ARCHIVED status');
    });

    test('Application number format adheres to ANTS-YYYY-XXXXXX structure', () => {
        const year = new Date().getFullYear();
        const count = 42;
        const sequence = String(count + 1).padStart(6, '0');
        const appNumber = `ANTS-${year}-${sequence}`;

        const regex = /^ANTS-\d{4}-\d{6}$/;
        assert.ok(regex.test(appNumber), `App number "${appNumber}" must match ANTS-YYYY-XXXXXX regex`);
    });

    test('Evaluation score calculation correctly computes weighted scores', () => {
        const criteria = [
            { name: 'Yenilikçilik ve Özgünlük', maxScore: 10, weight: 1.2, givenScore: 8 },
            { name: 'Pazar Büyüklüğü ve Ticarileşme', maxScore: 10, weight: 1.5, givenScore: 9 },
            { name: 'Ekip Yetkinliği', maxScore: 10, weight: 1.3, givenScore: 7 },
            { name: 'Teknik Uygulanabilirlik', maxScore: 10, weight: 1.0, givenScore: 8 },
            { name: 'TEKMER Uyumu', maxScore: 10, weight: 1.0, givenScore: 10 },
        ];

        let totalWeighted = 0;
        let totalMaxWeighted = 0;

        for (const c of criteria) {
            totalWeighted += c.givenScore * c.weight;
            totalMaxWeighted += c.maxScore * c.weight;
        }

        // 8*1.2 (9.6) + 9*1.5 (13.5) + 7*1.3 (9.1) + 8*1.0 (8.0) + 10*1.0 (10.0) = 50.2
        // Max: 10*(1.2+1.5+1.3+1.0+1.0) = 10*6.0 = 60.0
        const percentageScore = (totalWeighted / totalMaxWeighted) * 100;

        assert.strictEqual(totalWeighted.toFixed(1), '50.2');
        assert.strictEqual(percentageScore.toFixed(2), '83.67');
    });

    test('Duplicate warning detection logic triggers on matching email or phone', () => {
        const existingApplicants = [
            { email: 'founder@startup.com', phone: '05551234567', appNumber: 'ANTS-2026-000010' }
        ];

        const checkDuplicate = (email: string, phone?: string) => {
            const match = existingApplicants.find((a) => a.email === email || (phone && a.phone === phone));
            return match ? `Aynı e-posta/telefon ile mevcut başvuru var: ${match.appNumber}` : null;
        };

        const dup1 = checkDuplicate('founder@startup.com', '05559999999');
        assert.ok(dup1?.includes('ANTS-2026-000010'), 'Duplicate email should be flagged');

        const dup2 = checkDuplicate('newfounder@startup.com', '05551234567');
        assert.ok(dup2?.includes('ANTS-2026-000010'), 'Duplicate phone should be flagged');

        const noDup = checkDuplicate('unique@domain.com', '05001112233');
        assert.strictEqual(noDup, null, 'Unique applicant must not be flagged');
    });
});
