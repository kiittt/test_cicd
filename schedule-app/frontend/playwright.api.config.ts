import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/api',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/api', open: 'never' }],
  ],
  use: {
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:8080',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
})
