import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    // Cookie notice already answered, so it does not cover buttons in tests (tested separately)
    storageState: 'tests/e2e/helpers/consent-state.json',
    trace: 'on-first-retry',
    screenshot: 'on',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
