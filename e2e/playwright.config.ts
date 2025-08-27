import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'WEB_PORT=3100 API_PORT=8100 NEXT_PUBLIC_API_BASE=http://localhost:8100 NEXT_PUBLIC_E2E_AUTH_BYPASS=1 DATABASE_URL=sqlite:///test_onboard_api.db bash ../scripts/e2e_start_prod.sh',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  reporter: [ ['html', { open: 'never' }], ['list'] ],
  outputDir: 'test-results',
};

export default config;
