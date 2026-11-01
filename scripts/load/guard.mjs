export function loadConfiguration(env) {
  const base = env.STRESS_BASE_URL || ''
  // Exact origins only: no credentials, query strings, fragments or redirects.
  if (!/^https?:\/\/[a-z0-9.-]+(?::[0-9]+)?$/.test(base)) throw Error('Set STRESS_BASE_URL to an exact origin without trailing slash')
  const host = base.replace(/^https?:\/\//, '').split(':')[0]
  if (/(^|\.)(asmm\.ro|mimesiss\.ro)$/.test(host) || host === 'ws-mimesiss.vercel.app') throw Error('Production targets are forbidden')
  const local = host === '127.0.0.1' || host === 'localhost'
  if (!local && (!base.startsWith('https://') || env.STRESS_APPROVED_ORIGIN !== base || env.STRESS_ISOLATED_BACKENDS !== 'yes' || env.STRESS_PROVIDER_APPROVAL !== 'yes')) {
    throw Error('Remote runs require exact approved origin, isolated backends and provider coordination')
  }
  const vus = Number(env.STRESS_VUS || '10')
  if (!Number.isInteger(vus) || vus < 1 || vus > 500) throw Error('STRESS_VUS must be between 1 and 500')
  const shape = env.STRESS_SHAPE || 'smoke'
  if (!['smoke', 'ramp', 'spike'].includes(shape)) throw Error('Choose smoke, ramp or spike')
  if (shape === 'smoke' && vus > 10) throw Error('Smoke is limited to 10 users')
  const marker = env.STRESS_EXPECTED_TEXT || ''
  if (marker.length < 12) throw Error('Set a unique synthetic page marker (at least 12 characters)')
  return { base, vus, shape, marker }
}
