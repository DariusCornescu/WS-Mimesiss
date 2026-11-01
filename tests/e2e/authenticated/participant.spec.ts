import { clerk } from '@clerk/testing/playwright'
import { expect, firstPartyHeaders, target, test } from '../support/fixtures'
import { resolveAuthConfig } from '../support/target'

// Opt-in only (E2E_AUTHENTICATED=1, preview target, development-instance keys).
// Fixture requirements, all on the preview's isolated database:
//   - the +clerk_test user exists in the development auth instance;
//   - that user has a completed profile document with role "user".
// Read-only: no registration, checkout or ticket mutation happens here.

const resolved = resolveAuthConfig(process.env, target)
if (!resolved) throw new Error('Authenticated tests require E2E_AUTHENTICATED=1')
const auth = resolved

test.describe.configure({ mode: 'serial' })

test.afterEach(async ({ page }) => {
  await clerk.signOut({ page }).catch(() => undefined)
})

test('participant reaches the dashboard and only their own profile', async ({ page }) => {
  await page.goto('/auth/login')
  await clerk.signIn({ page, emailAddress: auth.email })

  await page.goto('/dashboard')
  await expect(page).toHaveURL(new RegExp(`^${target.origin.replace(/\./g, '\\.')}/dashboard$`))
  await expect(page.getByRole('heading', { level: 1, name: /Bine ai venit/ })).toBeVisible()

  const readOwnId = () => page.evaluate(() => (window as unknown as { Clerk?: { user?: { id?: string } } }).Clerk?.user?.id)
  await expect.poll(readOwnId, { message: 'signed-in user id' }).toMatch(/^user_/)
  const ownId = await readOwnId()

  const own = await page.request.get(`/api/users/${ownId}`, { headers: firstPartyHeaders(), maxRedirects: 0 })
  expect(own.status()).toBe(200)
  expect((await own.json()).clerkId).toBe(ownId)

  const other = await page.request.get('/api/users/user_e2e_someone_else', { headers: firstPartyHeaders(), maxRedirects: 0 })
  expect(other.status()).toBe(403)
})

test('participant without the admin role is sent to the unauthorized page', async ({ page }) => {
  await page.goto('/auth/login')
  await clerk.signIn({ page, emailAddress: auth.email })

  await page.goto('/admin')
  await expect(page).toHaveURL(/\/unauthorized$/)
})
