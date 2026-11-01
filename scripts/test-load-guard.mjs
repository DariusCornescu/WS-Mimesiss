import test from 'node:test'
import assert from 'node:assert/strict'
import { loadConfiguration } from './load/guard.mjs'
const fixture = { STRESS_BASE_URL: 'http://127.0.0.1:3100', STRESS_EXPECTED_TEXT: 'Synthetic event fixture' }
test('local smoke has conservative defaults', () => {
  assert.equal(loadConfiguration(fixture).vus, 10)
  assert.equal(loadConfiguration(fixture).shape, 'smoke')
})
test('production and credential-bearing targets are forbidden', () => {
  for (const origin of ['https://asmm.ro', 'https://www.asmm.ro', 'https://mimesiss.ro', 'https://ws-mimesiss.vercel.app', 'https://user:secret@example.com', 'https://example.com?x=1', 'https://example.com/path']) {
    assert.throws(() => loadConfiguration({ ...fixture, STRESS_BASE_URL: origin }))
  }
})
test('remote runs require explicit origin, isolation and coordination', () => {
  const remote = { ...fixture, STRESS_BASE_URL: 'https://staging.example.com', STRESS_APPROVED_ORIGIN: 'https://staging.example.com', STRESS_ISOLATED_BACKENDS: 'yes', STRESS_PROVIDER_APPROVAL: 'yes' }
  assert.equal(loadConfiguration(remote).base, remote.STRESS_BASE_URL)
  for (const key of ['STRESS_APPROVED_ORIGIN', 'STRESS_ISOLATED_BACKENDS', 'STRESS_PROVIDER_APPROVAL']) assert.throws(() => loadConfiguration({ ...remote, [key]: '' }))
})
test('caps, shape and fixture marker are checked', () => {
  for (const count of ['0', '-1', '501', 'Infinity', '1.5', 'abc']) assert.throws(() => loadConfiguration({ ...fixture, STRESS_VUS: count }))
  assert.throws(() => loadConfiguration({ ...fixture, STRESS_VUS: '500' }))
  assert.equal(loadConfiguration({ ...fixture, STRESS_VUS: '400', STRESS_SHAPE: 'ramp' }).vus, 400)
  assert.throws(() => loadConfiguration({ ...fixture, STRESS_SHAPE: 'unknown' }))
  assert.throws(() => loadConfiguration({ ...fixture, STRESS_EXPECTED_TEXT: '' }))
})
