import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env['CI'] ? 1 : undefined,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm run start -w @ironwood/api',
      port: 3001,
      reuseExistingServer: !process.env['CI'],
      env: {
        NODE_ENV: 'development',
        PORT: '3001',
        LOG_LEVEL: 'warn',
        AUTHOR_TOKEN: 'demo-author-token',
      },
    },
    {
      command: 'npm run preview -w @ironwood/web -- --strictPort',
      port: 4173,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
