import { test as base, expect, type Page } from '@playwright/test'
import { resolveTestTarget } from './target'

export const target = resolveTestTarget(process.env.E2E_BASE_URL)

// Applied only to first-party requests on preview deployments, never forwarded
// to third parties.
const previewBypass = target.kind === 'preview' ? process.env.E2E_PREVIEW_BYPASS_SECRET || '' : ''

const ANALYTICS_HOST = /(^|\.)(google-analytics\.com|googletagmanager\.com|vercel-insights\.com|vercel-scripts\.com)$/

export function firstPartyHeaders(): Record<string, string> {
  return previewBypass ? { 'x-vercel-protection-bypass': previewBypass } : {}
}

export const test = base.extend<{ pageErrors: Error[] }>({
  context: async ({ context }, provide) => {
    await context.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.origin === target.origin) {
        // Test traffic must not show up in analytics.
        if (url.pathname.startsWith('/_vercel/insights') || url.pathname.startsWith('/_vercel/speed-insights')) {
          return route.abort()
        }
        if (previewBypass) {
          const response = await route.fetch({
            headers: { ...route.request().headers(), ...firstPartyHeaders() },
            maxRedirects: 0,
          })
          return route.fulfill({ response })
        }
        return route.continue()
      }
      if (ANALYTICS_HOST.test(url.hostname)) return route.abort()
      // A loopback build runs with placeholder provider keys, so every
      // off-origin request is blocked to keep the run hermetic.
      if (target.kind === 'loopback') return route.abort()
      return route.continue()
    })
    await provide(context)
  },
  pageErrors: async ({ page }, provide) => {
    const errors: Error[] = []
    page.on('pageerror', error => errors.push(error))
    await provide(errors)
  },
})

export { expect }

/**
 * Uncaught first-party errors fail the test. On loopback the authentication
 * provider is intentionally unreachable, so only its own load errors are
 * tolerated there; on previews every uncaught error counts.
 */
export function unexpectedErrors(errors: Error[]): string[] {
  return errors
    .filter(error => !(target.kind === 'loopback' && /clerk/i.test(`${error.message}\n${error.stack ?? ''}`)))
    .map(error => error.message)
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth
  })
}
