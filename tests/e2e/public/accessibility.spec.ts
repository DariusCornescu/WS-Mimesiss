import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '../support/fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Key public entry points. Every WCAG A/AA violation fails the test; nothing is
// excluded or downgraded here.
for (const path of ['/', '/congres', '/contact']) {
  test(`${path} has no automatically detectable WCAG A/AA violations`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: 'load' })
    await expect(page.locator('h1')).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    if (results.violations.length) {
      await testInfo.attach('axe-violations.json', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      })
    }
    const summary = results.violations.map(v => `${v.id} (${v.impact ?? 'unknown'}): ${v.nodes.length} node(s) — ${v.help}`)
    expect(summary).toEqual([])
  })
}

test('mobile menu dialog has no WCAG A/AA violations while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Deschide meniul' }).click()
  await expect(page.getByRole('dialog', { name: 'Navigație mobilă' })).toBeVisible()

  const results = await new AxeBuilder({ page }).include('#association-menu').withTags(WCAG_TAGS).analyze()
  expect(results.violations.map(v => `${v.id}: ${v.help}`)).toEqual([])
})
