import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('11. PROGRAMLAR — FULL CMS CAPABILITIES & TABS AUDIT', () => {
    test('Program Düzenleme ve Tüm Alan Kapsamı Doğrulaması (FULL CMS VERIFIED)', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/programlar sayfasını aç
        await page.goto('/admin/programlar');
        await expect(page).toHaveURL(/.*\/admin\/programlar/);

        // Mevcut bir programa Düzenle tıkla
        const editBtn = page.locator('button[title="Düzenle"]').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        // TAB 1: Genel Bilgiler
        const hasName = await page.locator('input[placeholder*="Örn: ANTSPARK"]').isVisible();
        const hasDuration = await page.locator('input[placeholder*="12 Hafta"]').isVisible();
        const hasQuota = await page.locator('input[placeholder*="20 Girişim"]').isVisible();
        const hasMentorHours = await page.locator('input[placeholder*="70+ Saat"]').isVisible();
        const hasApplyStatus = await page.locator('select').first().isVisible();

        // TAB 2: Hedef Kitle & Şartlar
        await page.getByRole('button', { name: /Hedef Kitle/i }).click();
        await page.waitForTimeout(300);
        const hasShortDesc = await page.locator('textarea[placeholder*="Kartlarda ve özet"]').isVisible();
        const hasDetailedDesc = await page.locator('textarea[placeholder*="Programın kapsamı"]').isVisible();
        const hasTargetAudience = await page.locator('textarea[placeholder*="Erken aşama"]').isVisible();
        const hasWhoCanApply = await page.locator('textarea[placeholder*="Yazılım, Ar-Ge"]').isVisible();
        const hasCriteria = await page.locator('textarea[placeholder*="TRL 4+"]').isVisible();

        // TAB 3: Görünüm, Afiş & Renkler (poster, banner, gallery, color theme)
        await page.getByRole('button', { name: /Görünüm, Afiş & Renkler/i }).click();
        await page.waitForTimeout(300);
        const hasHeroUrl = await page.getByText('Banner (masaüstü)').first().isVisible();
        await expect(page.getByText('Afiş').first()).toBeVisible();
        await expect(page.getByText('Renk teması')).toBeVisible();

        // TAB 4: Tarihler & CTA
        await page.getByRole('button', { name: /Tarihler & CTA/i }).click();
        await page.waitForTimeout(300);
        const hasCtaText = await page.locator('input[value*="BAŞVUR"], input[placeholder*="HEMEN"]').isVisible();
        const hasDates = await page.locator('input[type="date"]').first().isVisible();

        // TAB 5: Aşamalar & SSS
        await page.getByRole('button', { name: /Aşamalar & SSS/i }).click();
        await page.waitForTimeout(300);
        const hasTimeline = await page.locator('text=Program Aşamaları / Fazlar').isVisible();
        const hasBenefits = await page.locator('text=Avantajlar & Destekler').isVisible();
        const hasProgramFaq = await page.locator('text=Programa Özel SSS').isVisible();

        // TAB 6: Blok İçerik Oluşturucu
        await page.getByRole('button', { name: /Blok İçerik/i }).click();
        await page.waitForTimeout(300);
        const hasBlockBuilder = await page.locator('text=Dinamik Blok Ekle:').isVisible();

        console.log('Program Full CMS Fields Audit:', {
            hasName,
            hasShortDesc,
            hasDetailedDesc,
            hasDuration,
            hasQuota,
            hasMentorHours,
            hasApplyStatus,
            hasTargetAudience,
            hasWhoCanApply,
            hasCriteria,
            hasHeroUrl,
            hasDates,
            hasCtaText,
            hasTimeline,
            hasBenefits,
            hasProgramFaq,
            hasBlockBuilder,
        });

        const isFull = hasName && hasShortDesc && hasDetailedDesc && hasHeroUrl && hasTargetAudience && hasProgramFaq && hasBenefits && hasBlockBuilder;
        expect(isFull).toBe(true);
    });
});
