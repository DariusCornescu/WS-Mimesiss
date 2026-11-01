import { expect, firstPartyHeaders, test } from '../support/fixtures'

// Anonymous requests against the running build. Every request here is refused
// before any database write or payment processing can happen.

test.describe.configure({ mode: 'serial' })

test('anonymous callers cannot read a participant profile', async ({ request }) => {
  const response = await request.get('/api/users/user_e2e_not_a_real_id', { headers: firstPartyHeaders(), maxRedirects: 0 })
  expect(response.status()).toBe(401)
  expect(await response.json()).toEqual({ error: 'Unauthorized' })
})

test('anonymous callers are stopped at the proxy for admin APIs', async ({ request }) => {
  const response = await request.get('/api/admin/users', { headers: firstPartyHeaders(), maxRedirects: 0 })
  expect(response.status()).toBe(401)
})

test('cross-origin writes are refused before reaching the handler', async ({ request }) => {
  const response = await request.post('/api/auth/complete-profile', {
    maxRedirects: 0,
    headers: { ...firstPartyHeaders(), origin: 'https://cross-origin.invalid', 'content-type': 'application/json' },
    data: { firstName: 'Ana', lastName: 'Test', userType: 'student' },
  })
  expect(response.status()).toBe(403)
})

test('payment webhook rejects an unsigned event', async ({ request }) => {
  const response = await request.post('/api/payments/webhook', {
    maxRedirects: 0,
    headers: { ...firstPartyHeaders(), 'content-type': 'application/json' },
    data: { id: 'evt_e2e_unsigned', type: 'payment_intent.succeeded', data: { object: { id: 'pi_e2e_unsigned' } } },
  })
  expect(response.status()).toBe(400)
  expect(await response.json()).toEqual({ error: 'No signature' })
})
