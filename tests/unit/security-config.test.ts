// @vitest-environment node
import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'
import { manualPaymentInput, workshopInput } from '@/lib/validation'

async function headers() {
  const rules = await nextConfig.headers!()
  const all = rules.find(rule => rule.source === '/:path*')
  return Object.fromEntries((all?.headers ?? []).map(header => [header.key.toLowerCase(), header.value]))
}

describe('security headers in next.config', () => {
  it('sets the baseline headers on every path', async () => {
    const set = await headers()
    expect(set['x-content-type-options']).toBe('nosniff')
    expect(set['x-frame-options']).toBe('DENY')
    expect(set['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(set['permissions-policy']).toContain('microphone=()')
    expect(set['content-security-policy']).toContain("frame-ancestors 'none'")
  })

  it('hides the framework banner', () => {
    expect(nextConfig.poweredByHeader).toBe(false)
  })

  // Finding: the CSP has no default-src or script-src, so it adds no XSS
  // containment. docs/security-readiness.md already calls it partial.
  it.fails('restricts script sources in the CSP', async () => {
    const policy = (await headers())['content-security-policy']
    expect(policy).toMatch(/(?:default-src|script-src)\s/)
  })
})

describe('manualPaymentInput', () => {
  const base = { clerkId: 'user_1', ticketId: '0123456789abcdef01234567', amount: 5000 }

  it('rejects fractional and non-positive amounts', () => {
    expect(manualPaymentInput.safeParse({ ...base, amount: 50.5 }).success).toBe(false)
    expect(manualPaymentInput.safeParse({ ...base, amount: 0 }).success).toBe(false)
  })

  it('drops unknown fields so they never reach the model', () => {
    const parsed = manualPaymentInput.parse({ ...base, fulfillmentComplete: true, role: 'admin' })
    expect(parsed).not.toHaveProperty('fulfillmentComplete')
  })

  // Finding: currency is any 3 to 8 character string, while every other code
  // path assumes RON. Drop `.fails` once the schema is restricted.
  it.fails('rejects a currency that is not a supported code', () => {
    expect(manualPaymentInput.safeParse({ ...base, currency: 'NOT-CUR' }).success).toBe(false)
  })
})

describe('workshopInput', () => {
  const base = { title: 'Suturi', description: 'Descriere', maxParticipants: 20, wsType: 'workshop' }

  it('accepts an Instagram link', () => {
    expect(workshopInput.safeParse({ ...base, url: 'https://www.instagram.com/p/abc123/' }).success).toBe(true)
  })

  // Finding: the link is only length-limited, so any scheme is stored and later
  // rendered as an href in the admin list. React 19 neutralises javascript: URLs
  // in href, which is the only thing standing in the way. Drop `.fails` once the
  // schema requires https.
  it.fails('rejects a non-https link', () => {
    expect(workshopInput.safeParse({ ...base, url: 'javascript:alert(1)' }).success).toBe(false)
  })
})
