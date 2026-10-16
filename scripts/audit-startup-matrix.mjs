import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import { load } from './helpers/load-ts.mjs'

const directory = path.resolve(process.argv[2] || '.preview/startup-matrix')
const lighthouse = process.argv[3]
if (!lighthouse) throw Error('Pass the installed Lighthouse CLI path as the second argument')
const variants = ['base', 'analytics', 'scene', 'full']
const runs = Number(process.env.PERFORMANCE_RUNS || 5)
if (!Number.isInteger(runs) || runs < 3 || runs > 9) throw Error('Use between three and nine runs')
const generatedFiles = await Promise.all(['tsconfig.json', 'next-env.d.ts'].map(async file => [file, await readFile(file)]))
const db = await MongoMemoryServer.create({ binary: { version: '7.0.24' }, instance: { ip: '127.0.0.1' } })
const environment = {
  ...process.env,
  MONGODB_URI: db.getUri(), MONGODB_DB_NAME: 'startup_matrix',
  ASMM_LOCAL_PREVIEW: '', NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_Y2ktcGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==',
  CLERK_SECRET_KEY: 'sk_live_ciplaceholdernotarealkey',
  STRIPE_SECRET_KEY: 'sk_test_ciplaceholdernotarealkey',
  STRIPE_WEBHOOK_SECRET: 'whsec_ciplaceholdernotarealsecret',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_ciplaceholdernotarealkey',
}
const result = { startedAt: new Date().toISOString(), scope: 'Interleaved local production-build diagnostics, isolated MongoDB, fake CI-format provider keys. Not production or signed-in provider validation. Informational GETs bypass authentication context; protected/personalized routes do not. Analytics collection endpoints blocked during all audits; script execution remains enabled in the relevant variants. Vercel collection scripts may be unavailable on localhost.', variants, runsPerVariant: runs, checks: [], measurements: [], orders: [] }
const servers = []
const origins = Object.fromEntries(variants.map((variant, i) => [variant, `http://localhost:${3120 + i}`]))
function command(args, env, quiet = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: quiet ? 'ignore' : 'inherit', windowsHide: true })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(Error(`${args[0]} exited with ${code}`)))
  })
}
async function snapshot() { await writeFile(path.join(directory, 'matrix.json'), JSON.stringify(result, null, 2)) }
async function start(variant, env) {
  const port = new URL(origins[variant]).port
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', port, '--hostname', 'localhost'], { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  servers.push(server)
  let log = ''
  server.stdout.on('data', data => { log = (log + data).slice(-2000) })
  server.stderr.on('data', data => { log = (log + data).slice(-2000) })
  let ready = false
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(origins[variant] + '/contact', { redirect: 'manual', signal: AbortSignal.timeout(1000) })).status === 200) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!ready) throw Error(`Could not start ${variant}: ${log}`)
  for (const route of ['/contact', '/proiecte', '/proiecte/mimesiss', '/proiecte/balul-bobocilor', '/proiecte/cortul-imm', '/congres/gallery']) {
    const response = await fetch(origins[variant] + route, { redirect: 'manual' })
    const html = await response.text()
    if (response.status !== 200 || html.includes('id="__next_error__"')) throw Error(`Invalid ${variant} route ${route}: ${response.status}`)
    result.checks.push({ variant, route, status: response.status, redirect: Boolean(response.headers.get('location')) })
  }
  if (variant === 'full') for (const route of ['/api/session', '/dashboard', '/admin', '/api/admin/settings', '/congres/workshops']) {
    const response = await fetch(origins[variant] + route, { redirect: 'manual' })
    const text = await response.text()
    const entry = { variant, route, status: response.status, cacheControl: response.headers.get('cache-control') }
    if (route === '/api/session') {
      entry.signedIn = JSON.parse(text).signedIn
      if (response.status !== 200 || entry.signedIn !== false || entry.cacheControl !== 'private, no-store') throw Error('Session guard invalid')
    }
    if (['/dashboard', '/admin'].includes(route) && ![302, 303, 307].includes(response.status)) throw Error('Missing account redirect')
    if (route === '/api/admin/settings' && response.status !== 401) throw Error('Missing admin API guard')
    if (route === '/congres/workshops' && response.status !== 200) throw Error('Workshop listing failed')
    result.checks.push(entry)
  }
}
async function audit(variant, run) {
  const stem = `${variant}-${run}`
  const prefix = path.join(directory, stem)
  const args = [lighthouse, origins[variant] + '/proiecte', '--preset=perf', '--only-categories=performance', '--output=json', '--output=html', '--output-path=' + prefix, '--chrome-flags=--headless=new --no-first-run --no-default-browser-check --disable-extensions', '--max-wait-for-load=45000', '--max-wait-for-fcp=30000', '--blocked-url-patterns=*google-analytics.com/*collect*', '--blocked-url-patterns=*analytics.google.com/*collect*', '--quiet']
  if (run === 1) args.push('--save-assets')
  await command(args, environment, true)
  const report = JSON.parse(await readFile(prefix + '.report.json', 'utf8'))
  if (report.runtimeError) throw Error(report.runtimeError.message)
  const requests = report.audits['network-requests'].details.items
  const redirects = requests.filter(item => item.statusCode >= 300 && item.statusCode < 400 && item.priority === 'VeryHigh').length
  const clerkDocuments = requests.filter(item => /clerk\./.test(item.url) && item.resourceType === 'Document').length
  if (redirects || clerkDocuments) throw Error('Audit contains an authentication/navigation redirect')
  const sceneAssets = requests.filter(item => /neural-space|photo-[1-4]\.webp/.test(item.url))
  if (['base', 'analytics'].includes(variant) && sceneAssets.some(item => /membrane|photo-[1-4]\.webp|mimesiss-intro-logo/.test(item.url))) throw Error('Disabled scene still loads textures')
  const gaRequests = requests.filter(item => item.url.includes('googletagmanager.com/gtag/js'))
  if (['base', 'scene'].includes(variant) && gaRequests.length) throw Error('Disabled Analytics still loads its script')
  const longTasks = report.audits['long-tasks'].details.items
  const boot = report.audits['bootup-time'].details.items
  const main = report.audits['mainthread-work-breakdown'].details.items
  const measurements = {
    variant, run, report: stem + '.report.html', score: Math.round(report.categories.performance.score * 100),
    lcp: Math.round(report.audits['largest-contentful-paint'].numericValue), fcp: Math.round(report.audits['first-contentful-paint'].numericValue),
    tbt: Math.round(report.audits['total-blocking-time'].numericValue), cls: report.audits['cumulative-layout-shift'].numericValue,
    bytes: report.audits['total-byte-weight'].numericValue, cpu: report.environment.benchmarkIndex, redirects,
    mainThread: Math.round(main.reduce((sum, item) => sum + item.duration, 0)),
    gaExecution: Math.round(boot.filter(item => item.url.includes('googletagmanager')).reduce((sum, item) => sum + item.total, 0)),
    longestTask: Math.round(Math.max(0, ...longTasks.map(item => item.duration))),
    sceneAssets: sceneAssets.map(item => ({ path: new URL(item.url).pathname, bytes: item.transferSize })),
    jsBytes: requests.filter(item => item.resourceType === 'Script').reduce((sum, item) => sum + item.transferSize, 0),
    topTasks: longTasks.slice(0, 8).map(item => ({ url: item.url, duration: Math.round(item.duration), start: Math.round(item.startTime) })),
  }
  result.measurements.push(measurements)
  console.log(JSON.stringify({ variant, run, score: measurements.score, lcp: measurements.lcp, tbt: measurements.tbt, cpu: measurements.cpu }))
  await snapshot()
}
try {
  await mkdir(directory, { recursive: true })
  await mongoose.connect(db.getUri(), { dbName: environment.MONGODB_DB_NAME })
  const models = load('src/models/index.ts', { mongoose, './AppSettings': load('src/models/AppSettings.ts', { mongoose }) })
  await models.AppSettings.create({ workshopVisibleToPublic: false, paymentsEnabled: false })
  await mongoose.disconnect()
  for (const variant of variants) {
    const env = { ...environment, PERFORMANCE_DIAGNOSTIC: variant, NEXT_PUBLIC_BASE_URL: origins[variant] }
    console.log('Building ' + variant)
    await command(['node_modules/next/dist/bin/next', 'build', '--webpack'], env)
    await start(variant, env)
    await snapshot()
  }
  const orders = [['base', 'analytics', 'scene', 'full'], ['full', 'scene', 'analytics', 'base'], ['analytics', 'full', 'base', 'scene'], ['scene', 'base', 'full', 'analytics'], ['full', 'base', 'analytics', 'scene']]
  for (let run = 1; run <= runs; run++) {
    const order = orders[(run - 1) % orders.length]
    result.orders.push(order)
    for (const variant of order) await audit(variant, run)
  }
} catch (error) { result.error = error.message; process.exitCode = 1; console.error(error.message) }
finally {
  for (const server of servers) {
    if (server.exitCode !== null) continue
    const stopped = new Promise(resolve => server.once('exit', resolve))
    server.kill()
    await stopped
  }
  await mongoose.disconnect()
  await db.stop()
  for (const [file, contents] of generatedFiles) await writeFile(file, contents)
  result.finishedAt = new Date().toISOString()
  await snapshot()
}
