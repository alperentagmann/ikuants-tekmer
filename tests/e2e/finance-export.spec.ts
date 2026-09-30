import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';
import { sanitizeCsvCell } from '../../lib/sanitize';

test.describe('Finance & Rent Audited Export E2E', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should sanitize CSV formula injection and record AuditLog on report exports', async ({ page }) => {
        // 1. Verify sanitizeCsvCell function directly
        expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
        expect(sanitizeCsvCell('+12345')).toBe("'+12345");
        expect(sanitizeCsvCell('-500')).toBe("'-500");
        expect(sanitizeCsvCell('@test')).toBe("'@test");
        expect(sanitizeCsvCell('Normal Text')).toBe('Normal Text');

        // 2. Test Finance Report Export API
        const finExportRes = await page.request.post('/api/admin/reports/finance', {
            data: {
                format: 'CSV',
                reportType: 'PROJECT_FINANCE',
                filters: {},
            },
        });
        expect(finExportRes.status()).toBe(200);
        const finHeaders = finExportRes.headers();
        expect(finHeaders['content-type']).toContain('text/csv');
        const finCsvText = await finExportRes.text();
        expect(finCsvText).toContain('Proje Kodu');

        // 3. Test Rent Report Export API
        const rentExportRes = await page.request.post('/api/admin/reports/rent', {
            data: {
                format: 'CSV',
                reportType: 'AGING',
                filters: {},
            },
        });
        expect(rentExportRes.status()).toBe(200);
        const rentCsvText = await rentExportRes.text();
        expect(rentCsvText).toContain('Yaşlandırma Segmenti');

        // 4. Test Invoices Export API
        const invoiceExportRes = await page.request.post('/api/admin/finance/invoices', {
            data: {
                format: 'CSV',
                filters: {},
            },
        });
        expect(invoiceExportRes.status()).toBe(200);
        const invoiceCsvText = await invoiceExportRes.text();
        expect(invoiceCsvText).toContain('Tedarikçi / Satıcı');

        // 5. Test Receivables Export API
        const recExportRes = await page.request.post('/api/admin/finance/receivables?export=true', {
            data: {
                format: 'CSV',
                filters: {},
            },
        });
        expect(recExportRes.status()).toBe(200);
        const recCsvText = await recExportRes.text();
        expect(recCsvText).toContain('Borçlu / Muhatap');

        // 6. Verify AuditLogs were created in DB
        const exportAudit = await prisma.auditLog.findFirst({
            where: {
                action: 'EXPORT',
                entityType: { in: ['FinanceReport', 'RentReport', 'InvoiceRegister', 'Receivables'] },
            },
            orderBy: { createdAt: 'desc' },
        });
        expect(exportAudit).not.toBeNull();
        expect(exportAudit?.action).toBe('EXPORT');
    });
});
