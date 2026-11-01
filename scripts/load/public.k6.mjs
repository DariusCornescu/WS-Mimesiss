/* global __ENV */
// Read-only HTTP probe. Does NOT exercise authenticated registration or payment.
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { loadConfiguration } from './guard.mjs'

const config = loadConfiguration(__ENV)
const failures = new Rate('content_failure')
const headers = { 'x-test-run': 'asmm-readonly-load' }
if (__ENV.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = __ENV.VERCEL_AUTOMATION_BYPASS_SECRET
const stages = config.shape === 'smoke'
  ? [{ duration: '30s', target: config.vus }, { duration: '10s', target: 0 }]
  : config.shape === 'spike'
    ? [{ duration: '2m', target: 10 }, { duration: '5s', target: config.vus }, { duration: '1m', target: config.vus }, { duration: '30s', target: 10 }, { duration: '2m', target: 10 }, { duration: '15s', target: 0 }]
    : [{ duration: '2m', target: 10 }, { duration: '2m', target: config.vus }, { duration: '3m', target: config.vus }, { duration: '1m', target: 10 }, { duration: '1m', target: 10 }, { duration: '15s', target: 0 }]

export const options = {
  scenarios: { public_read: { executor: 'ramping-vus', startVUs: 0, stages, gracefulRampDown: '15s', gracefulStop: '15s' } },
  maxRedirects: 0,
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
    content_failure: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
    http_req_duration: [{ threshold: 'p(95)<3000', abortOnFail: true, delayAbortEval: '1m' }, 'p(99)<5000'],
  },
}
function read() {
  return http.get(config.base + '/congres/workshops', { headers, redirects: 0, timeout: '10s', tags: { name: 'workshops-fixture' } })
}
function valid(response) { return response.status === 200 && typeof response.body === 'string' && response.body.includes(config.marker) }
export function setup() {
  if (!valid(read())) throw Error('Preflight failed: expected the seeded synthetic workshop, not login, redirect or an empty page')
}
export default function readWorkshops() {
  const response = read()
  const ok = check(response, { 'synthetic workshop rendered': valid })
  failures.add(!ok)
  // At most ~100 requests/sec at 500 VUs, before response time; no asset fetches.
  sleep(5 + Math.random() * 2)
}
export function handleSummary(data) {
  return { 'stress-http-summary.json': JSON.stringify({ scope: 'read-only workshops page; no authenticated writes', target: config.base, shape: config.shape, vus: config.vus, results: data }, null, 2) }
}
