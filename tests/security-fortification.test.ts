import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SecurityCenterService } from '../lib/services/security-center-service';
import { maskTcNumber, maskPhone, maskEmail } from '../lib/utils';
import { prisma } from '../lib/prisma';

describe('4. Security Center & PII Fortification', () => {
    test('PII Masking utilities protect sensitive citizen data', () => {
        const maskedTc = maskTcNumber('12345678901');
        assert.strictEqual(maskedTc, '123******01', 'TC Number must show only first 3 and last 3 digits');

        const maskedPhone = maskPhone('05321234567');
        assert.ok(maskedPhone.includes('***'), 'Phone number must be masked in center');

        const maskedEmail = maskEmail('ahmet.yilmaz@example.com');
        assert.ok(maskedEmail.includes('***'), 'Email username must be masked in center');
    });

    test('SecurityCenterService records security events and calculates metrics', async () => {
        const event = await SecurityCenterService.logSecurityEvent({
            eventType: 'TEST_SUSPICIOUS_LOGIN',
            severity: 'HIGH',
            userEmail: 'attacker@example.com',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 Test Browser',
            details: { reason: 'Exceeded maximum login attempts' },
        });

        assert.ok(event.id, 'Security event must be recorded');
        assert.strictEqual(event.severity, 'HIGH');
        assert.strictEqual(event.isResolved, false);

        const overview = await SecurityCenterService.getSecurityOverview();
        assert.ok(overview.totalUsers >= 1, 'Total users metric exists');
        assert.ok(overview.recentEvents.some((e: any) => e.id === event.id), 'Newly recorded event is in list');

        // Resolve event
        await SecurityCenterService.resolveEvent(event.id);
        const resolved = await prisma.securityEvent.findUnique({ where: { id: event.id } });
        assert.strictEqual(resolved?.isResolved, true, 'Event must be marked as resolved');

        // Cleanup
        await prisma.securityEvent.delete({ where: { id: event.id } });
    });
});
