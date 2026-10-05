import type { Locator, Page } from '@playwright/test';

/**
 * Clicks a save / delete control and waits until the admin API mutation it triggers has
 * answered. Avoids fixed sleeps, which abort the request when the dev server is still
 * compiling the route and the test navigates away.
 */
export async function clickAndWaitForSave(page: Page, control: Locator, timeout = 30000) {
    const response = page.waitForResponse((r) => r.url().includes('/api/admin/') && r.request().method() !== 'GET', { timeout });
    await control.click();
    return response;
}
