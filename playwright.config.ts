import { defineConfig, devices, type PlaywrightTestProject } from '@playwright/test'
import { resolveAuthConfig, resolveTestTarget } from './tests/e2e/support/target'

// Throws before any browser starts when E2E_BASE_URL is missing, points at
// production or at an unknown host. There is deliberately no webServer: tests
// run against an already running production build (`npm run build && npm start`)
// or a preview deployment.
const target = resolveTestTarget(process.env.E2E_BASE_URL)
const auth = resolveAuthConfig(process.env, target)
const isCI = Boolean(process.env.CI)
const artifacts = './.preview/test-suite'

// Software WebGL for headless Chromium on machines without a GPU.
const SWIFTSHADER_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']

const PUBLIC_DIR = './tests/e2e/public'
// API boundary checks do not depend on the browser engine; run them once.
const ENGINE_INDEPENDENT = /api-boundaries\.spec\.ts$/

const projects: PlaywrightTestProject[] = [
  {
    name: 'chromium',
    testDir: PUBLIC_DIR,
    use: { ...devices['Desktop Chrome'], launchOptions: { args: SWIFTSHADER_ARGS } },
  },
  {
    name: 'webkit',
    testDir: PUBLIC_DIR,
    testIgnore: ENGINE_INDEPENDENT,
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'mobile-webkit',
    testDir: PUBLIC_DIR,
    testIgnore: ENGINE_INDEPENDENT,
    use: { ...devices['iPhone 14'] },
  },
]

if (auth) {
  projects.push({
    name: 'authenticated',
    testDir: './tests/e2e/authenticated',
    testMatch: /\.spec\.ts$/,
    use: { ...devices['Desktop Chrome'] },
  })
}

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: `${artifacts}/test-results`,
  globalSetup: auth ? './tests/e2e/authenticated/global-setup.ts' : undefined,
  fullyParallel: true,
  forbidOnly: isCI,
  // No retries: a flaky result must surface as a failure.
  retries: 0,
  // Previews share real backing services; keep traffic to one browser at a time.
  workers: target.kind === 'preview' ? 1 : isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    [isCI ? 'github' : 'list'],
    ['html', { open: 'never', outputFolder: `${artifacts}/playwright-report` }],
  ],
  use: {
    baseURL: target.origin,
    locale: 'ro-RO',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects,
})
