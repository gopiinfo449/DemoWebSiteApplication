import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { env } from './env';

dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/tests',
  /* demowebshop.tricentis.com takes 5-16s per page/request, so the defaults (30s test, 5s expect) are too short. */
  timeout: 120_000,
  expect: { timeout: 15_000 },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    /* Set UPDATE_ZEPHYR=true to push results to Zephyr Scale after the run. See tests/reporters/zephyr-reporter.ts */
    ...(process.env.UPDATE_ZEPHYR === 'true' ? [['./tests/reporters/zephyr-reporter.ts'] as const] : []),
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: env.playwrightDocs.baseURL,

    /* Headed locally, headless in CI (GitHub runners have no display). */
    headless: !!process.env.CI,

    /* Per-action and per-navigation limits; the Register click alone can take ~16s on the demo site. */
    actionTimeout: 30_000,
    navigationTimeout: 30_000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
