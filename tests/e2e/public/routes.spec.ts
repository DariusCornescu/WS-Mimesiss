import { expect, horizontalOverflow, test, unexpectedErrors } from '../support/fixtures'

// Public, read-only pages. Content is settings- and database-driven, so the
// checks target structure rather than copy.
const routes = [
  '/',
  '/despre',
  '/proiecte',
  '/contact',
  '/congres',
  '/congres/info',
  '/congres/program',
  '/congres/workshops',
  '/congres/editii',
  '/congres/gallery',
  '/congres/reg',
  '/congres/ghid',
  '/politica-de-confidentialitate',
  '/termeni-si-conditii',
]

for (const path of routes) {
  test(`${path} renders one heading, landmarks and no horizontal overflow`, async ({ page, pageErrors }) => {
    const response = await page.goto(path, { waitUntil: 'load' })
    expect(response?.status(), 'document status').toBe(200)
    expect(new URL(page.url()).pathname, 'no redirect away from public page').toBe(path)

    await expect(page.locator('html')).toHaveAttribute('lang', 'ro')
    await expect(page).toHaveTitle(/\S/)

    const headings = page.locator('h1')
    await expect(headings).toHaveCount(1)
    await expect(headings).toBeVisible()
    await expect(headings).toHaveText(/\S/)

    await expect(page.getByRole('banner').first()).toBeVisible()
    await expect(page.locator('main#site-main')).toBeVisible()

    expect(await horizontalOverflow(page), 'horizontal overflow in CSS px').toBeLessThanOrEqual(1)
    expect(unexpectedErrors(pageErrors)).toEqual([])
  })
}
