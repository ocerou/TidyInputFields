import { defineConfig } from '@playwright/test'

// En local, Edge installé sur le poste (pas de navigateur à télécharger) ; en CI, le Chromium de Playwright.
// Deux serveurs : le catalogue de test (5180) et le site de documentation (5181).
export default defineConfig({
  testDir: 'tests/e2e',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5180',
    channel: process.env.CI ? undefined : 'msedge',
    // La documentation suit la langue du navigateur : les tests la lisent en anglais.
    locale: 'en-US',
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5180',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run docs',
      url: 'http://localhost:5181',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
