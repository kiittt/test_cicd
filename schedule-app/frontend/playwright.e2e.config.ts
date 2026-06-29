import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/e2e', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'cd ../backend && rm -f /tmp/schedule-app-e2e.db /tmp/schedule-app-e2e.db-shm /tmp/schedule-app-e2e.db-wal && GOPROXY=https://goproxy.cn,direct DATABASE_DSN=/tmp/schedule-app-e2e.db SERVER_ADDR=:18083 go run ./cmd/server',
      url: 'http://localhost:18083/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command:
        'VITE_API_BASE_URL=http://localhost:18083 npm run dev -- --host 127.0.0.1 --port 5175',
      url: 'http://127.0.0.1:5175',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
})
