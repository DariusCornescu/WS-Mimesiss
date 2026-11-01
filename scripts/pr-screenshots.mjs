// Before/after screenshots for pull requests. See docs/pr-screenshots.md.
//
// Boots the working tree (and optionally another git ref) as `next dev` against a
// seeded in-memory MongoDB, captures pages or sections with Playwright, and can
// publish the images to the `pr-assets` branch for embedding in a PR description.
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseArgs, parseEnv } from 'node:util'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mongoose from 'mongoose'
import { chromium } from '@playwright/test'
import loadConfig from 'next/dist/server/config.js'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'
import { seedPreviewDatabase } from './helpers/preview-seed.mjs'

const { values: options } = parseArgs({ options: {
  before: { type: 'string' },
  shots: { type: 'string' },
  out: { type: 'string', default: '.preview/screenshots' },
  publish: { type: 'string' },
  empty: { type: 'boolean', default: false },
} })

const root = process.cwd()
const out = path.resolve(root, options.out)
const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim()
const DB_NAME = 'pr_screenshots'

const defaultShots = [
  { name: 'home', path: '/', device: 'desktop' },
  { name: 'home-mobile', path: '/', device: 'mobile' },
  { name: 'despre', path: '/despre', device: 'desktop' },
  { name: 'proiecte', path: '/proiecte', device: 'desktop' },
]
const shots = options.shots ? JSON.parse(readFileSync(path.resolve(root, options.shots), 'utf8')) : defaultShots
const viewports = { desktop: { width: 1440, height: 900, deviceScaleFactor: 1 }, mobile: { width: 375, height: 812, deviceScaleFactor: 2 } }

// Clerk needs a well-formed key even for signed-out pages. Prefer the staging test
// keys when they exist; otherwise fall back to the same placeholders the isolated
// build uses.
function clerkKeys() {
  const staging = path.join(root, '.env.staging.local')
  if (existsSync(staging)) {
    const env = parseEnv(readFileSync(staging, 'utf8'))
    if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') && env.CLERK_SECRET_KEY?.startsWith('sk_test_')) {
      return { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY: env.CLERK_SECRET_KEY }
    }
  }
  return { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_Y2ktcGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==', CLERK_SECRET_KEY: 'sk_live_ciplaceholdernotarealkey' }
}

async function startServer(cwd, port, mongoUri) {
  const env = { ...process.env, ...clerkKeys(), MONGODB_URI: mongoUri, MONGODB_DB_NAME: DB_NAME, ASMM_LOCAL_PREVIEW: '',
    NEXT_PUBLIC_BASE_URL: `http://localhost:${port}`, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' }
  if (cwd === root) {
    // A separate distDir keeps this run from colliding with an `npm run dev` in the same checkout.
    const configuration = await loadConfig.default(PHASE_DEVELOPMENT_SERVER, root)
    configuration.distDir = '.preview/pr-screenshots/dev'
    configuration.distDirRoot = '.preview/pr-screenshots'
    // unstable_cache entries persist on disk and would show the previous run's data.
    rmSync(path.join(root, '.preview/pr-screenshots/dev/cache/fetch-cache'), { recursive: true, force: true })
    env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(configuration)
  }
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', 'localhost', '--port', String(port)],
    { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  let log = ''
  child.stdout.on('data', chunk => { log += chunk })
  child.stderr.on('data', chunk => { log += chunk })
  return { child, port, log: () => log }
}

async function waitForServer(server, timeoutMs = 240_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) throw Error(`Server on ${server.port} exited:\n${server.log().slice(-2000)}`)
    try {
      const response = await fetch(`http://localhost:${server.port}/`)
      if (response.ok) return
    } catch { /* not listening yet */ }
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  throw Error(`Server on ${server.port} did not become ready:\n${server.log().slice(-2000)}`)
}

function checkoutRef(ref) {
  const dir = path.join(tmpdir(), `asmm-pr-screenshots-${Date.now()}`)
  execFileSync('git', ['worktree', 'add', '--detach', dir, ref], { stdio: 'ignore' })
  symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  return dir
}

async function launchBrowser() {
  for (const channel of [process.env.PR_SCREENSHOTS_CHANNEL, undefined, 'chrome', 'msedge']) {
    try { return await chromium.launch(channel ? { channel } : {}) } catch { /* try the next one */ }
  }
  throw Error('No Chromium-based browser found. Run `npx playwright install chromium` or set PR_SCREENSHOTS_CHANNEL.')
}

async function capture(browser, baseUrl, label) {
  const saved = []
  for (const shot of shots) {
    const viewport = viewports[shot.device ?? 'desktop']
    const page = await browser.newPage({ viewport, deviceScaleFactor: viewport.deviceScaleFactor, reducedMotion: 'reduce' })
    await page.goto(baseUrl + shot.path, { waitUntil: 'networkidle', timeout: 120_000 })
    // Settle entrance animations, unstick the header so it does not cover sections, hide the dev overlay.
    await page.addStyleTag({ content: '[data-entrance] { opacity: 1 !important; transform: none !important; } header { position: static !important; } nextjs-portal { display: none !important; }' })
    const file = path.join(out, `${label}-${shot.name}.png`)
    const selectors = [shot.selector].flat().filter(Boolean)
    const selector = selectors.length ? await firstPresent(page, selectors) : null
    if (selectors.length && !selector) console.warn(`${label}/${shot.name}: none of ${selectors.join(', ')} found, capturing the full page`)
    if (selector) {
      const element = page.locator(selector).first()
      await element.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await element.screenshot({ path: file })
    } else {
      await page.screenshot({ path: file, fullPage: true })
    }
    saved.push(file)
    console.log(`saved ${path.relative(root, file)}`)
    await page.close()
  }
  return saved
}

async function firstPresent(page, selectors) {
  for (const selector of selectors) if (await page.locator(selector).count()) return selector
  return null
}

function publish(pr, files) {
  const dir = path.join(tmpdir(), `asmm-pr-assets-${Date.now()}`)
  const remoteHasBranch = execFileSync('git', ['ls-remote', '--heads', 'origin', 'pr-assets'], { encoding: 'utf8' }).trim() !== ''
  if (remoteHasBranch) {
    execFileSync('git', ['fetch', 'origin', 'pr-assets'], { stdio: 'ignore' })
    execFileSync('git', ['worktree', 'add', '--detach', dir, 'FETCH_HEAD'], { stdio: 'ignore' })
  } else {
    execFileSync('git', ['worktree', 'add', '--detach', dir], { stdio: 'ignore' })
    execFileSync('git', ['switch', '--orphan', 'pr-assets-publish'], { cwd: dir, stdio: 'ignore' })
    writeFileSync(path.join(dir, 'README.md'), '# PR assets\n\nScreenshots referenced from pull request descriptions. Not part of the app.\n')
  }
  try {
    const target = path.join(dir, `pr-${pr}`)
    mkdirSync(target, { recursive: true })
    for (const file of files) copyFileSync(file, path.join(target, path.basename(file)))
    execFileSync('git', ['add', '-A'], { cwd: dir })
    execFileSync('git', ['commit', '-q', '-m', `Add screenshots for PR ${pr}`], { cwd: dir })
    execFileSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/pr-assets'], { cwd: dir, stdio: 'inherit' })
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', dir], { stdio: 'ignore' })
    if (!remoteHasBranch) execFileSync('git', ['branch', '-D', 'pr-assets-publish'], { stdio: 'ignore' })
  }
  return `https://raw.githubusercontent.com/${repo}/pr-assets/pr-${pr}`
}

function markdown(baseUrl, hasBefore) {
  const img = (label, shot) => `<img src="${baseUrl}/${label}-${shot.name}.png" width="${shot.device === 'mobile' ? 260 : 420}">`
  const rows = shots.map(shot => hasBefore ? `| ${shot.name} | ${img('before', shot)} | ${img('after', shot)} |` : `| ${shot.name} | ${img('after', shot)} |`)
  const header = hasBefore ? '| | Before | After |\n| --- | --- | --- |' : '| | After |\n| --- | --- |'
  return `## Screenshots\n\n${header}\n${rows.join('\n')}\n`
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const database = await MongoMemoryServer.create({ binary: { version: '7.0.24' } })
const servers = []
let beforeDir
try {
  if (!options.empty) {
    const connection = await mongoose.createConnection(database.getUri(), { dbName: DB_NAME }).asPromise()
    try { await seedPreviewDatabase(connection.db) } finally { await connection.close() }
  }
  servers.push(await startServer(root, 3301, database.getUri()))
  if (options.before) {
    beforeDir = checkoutRef(options.before)
    servers.push(await startServer(beforeDir, 3302, database.getUri()))
  }
  await Promise.all(servers.map(server => waitForServer(server)))

  const browser = await launchBrowser()
  const files = []
  try {
    files.push(...await capture(browser, 'http://localhost:3301', 'after'))
    if (options.before) files.push(...await capture(browser, 'http://localhost:3302', 'before'))
  } finally { await browser.close() }

  const imageBase = options.publish ? publish(options.publish, files) : '.'
  writeFileSync(path.join(out, 'screenshots.md'), markdown(imageBase, Boolean(options.before)))
  console.log(`\nMarkdown for the PR description: ${path.relative(root, path.join(out, 'screenshots.md'))}`)
  if (!options.publish) console.log(`Images are local only (${readdirSync(out).length - 1} files). Add --publish <pr-number> to push them to the pr-assets branch.`)
} finally {
  for (const server of servers) server.child.kill()
  await database.stop()
  if (beforeDir) execFileSync('git', ['worktree', 'remove', '--force', beforeDir], { stdio: 'ignore' })
}
