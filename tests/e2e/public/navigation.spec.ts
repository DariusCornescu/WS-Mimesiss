import { expect, horizontalOverflow, test } from '../support/fixtures'

// Viewports are set explicitly so every browser project exercises both the
// desktop navigation and the mobile menu instead of skipping one of them.

test.describe('desktop navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('primary links are visible and mark the current page', async ({ page }) => {
    await page.goto('/despre')
    const nav = page.getByRole('navigation', { name: 'Navigație principală', exact: true })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Despre noi' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Deschide meniul' })).toBeHidden()

    await nav.getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page')
  })

  test('congress pages expose the congress sub-navigation', async ({ page }) => {
    await page.goto('/congres/program')
    const congress = page.getByRole('navigation', { name: 'Navigație congres' })
    await expect(congress).toBeVisible()
    await expect(congress.getByRole('link', { name: 'Program' })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens as a modal, locks scroll and closes with Escape returning focus', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Navigație principală', exact: true })).toBeHidden()

    const toggle = page.getByRole('button', { name: 'Deschide meniul' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()

    const dialog = page.getByRole('dialog', { name: 'Navigație mobilă' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('button[aria-controls="association-menu"]')).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    expect(await dialog.evaluate(panel => panel.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    const reopened = page.getByRole('button', { name: 'Deschide meniul' })
    await expect(reopened).toBeFocused()
    await expect(reopened).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('congress group expands and choosing a link navigates and closes the menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Deschide meniul' }).click()
    const dialog = page.getByRole('dialog', { name: 'Navigație mobilă' })

    const congress = dialog.getByRole('button', { name: 'MIMESISS' })
    await expect(congress).toHaveAttribute('aria-expanded', 'false')
    await congress.click()
    await expect(congress).toHaveAttribute('aria-expanded', 'true')

    await dialog.getByRole('link', { name: 'Program' }).click()
    await expect(page).toHaveURL(/\/congres\/program$/)
    await expect(dialog).toBeHidden()
    await expect(page.locator('h1')).toBeVisible()
  })
})
