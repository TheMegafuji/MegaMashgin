import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'artifacts/browser-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3191',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run test:e2e:serve',
        url: 'http://127.0.0.1:3191/health/ready',
        timeout: 30000,
        reuseExistingServer: false,
      },
});
