import { defineConfig, devices } from '@playwright/test'

const SITE_URL = 'https://mariachielcuis.com'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Never reuse a manually-started dev server: it was launched without the
    // test env (NEXT_PUBLIC_SITE_URL etc.) and may serve a stale .next build,
    // which makes canonical/robots/llms/contact tests fail spuriously. Always
    // spawn our own so `env` below and a fresh build actually apply.
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000/es',
    reuseExistingServer: false,
    timeout: 180_000,
    // NEXT_PUBLIC_SITE_URL makes canonical/robots/sitemap assert the prod URL.
    // RESEND_API_KEY/CONTACT_TO_EMAIL are cleared so the contact-form test
    // exercises the 'email not configured' fallback instead of sending.
    env: {
      NEXT_PUBLIC_SITE_URL: SITE_URL,
      RESEND_API_KEY: '',
      CONTACT_TO_EMAIL: '',
    },
  },
})
