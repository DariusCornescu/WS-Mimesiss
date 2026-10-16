import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { load } from './helpers/load-ts.mjs'

function loadComponent(file, dependencies) {
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const loadedModule = { exports: {} }
  runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, require: name => {
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' }
    if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name)
    return dependencies[name]
  } })
  return loadedModule.exports
}

test('public routes render without mounting an account provider; account and payment routes retain it', () => {
  const { isPublicPath } = load('src/lib/public-routes.ts')
  let pathname = '/'
  const provider = () => {}
  const { default: Boundary } = loadComponent('src/components/auth/AuthBoundary.tsx', {
    'next/dynamic': () => provider,
    'next/navigation': { usePathname: () => pathname },
    '@/lib/public-routes': { isPublicPath },
  })
  const child = { content: 'page' }
  for (pathname of ['/', '/despre', '/contact', '/proiecte/mimesiss', '/congres/workshops', '/congres/gallery']) assert.equal(Boundary({ children: child }), child)
  for (pathname of ['/auth/login', '/auth/signup', '/sign-in', '/sign-up', '/dashboard', '/admin', '/payment', '/proiecte-private']) {
    const result = Boundary({ children: child })
    assert.equal(result.type, provider)
    assert.equal(result.props.children, child)
  }
})

for (const signedIn of [false, true]) test('session lookup exposes only sign-in state with private no-store caching: ' + signedIn, async () => {
  const { GET } = load('src/app/api/session/route.ts', {
    '@clerk/nextjs/server': { auth: async () => ({ userId: signedIn ? 'private-user-id' : null, sessionId: 'private-session-id' }) },
    'next/server': { NextResponse: Response },
  })
  const result = await GET()
  assert.deepEqual(await result.json(), { signedIn })
  assert.equal(result.headers.get('cache-control'), 'private, no-store')
  assert.equal(result.headers.get('vary'), 'Cookie')
})

test('session lookup does not treat an unavailable auth service as a signed-out user', async () => {
  const { GET } = load('src/app/api/session/route.ts', {
    '@clerk/nextjs/server': { auth: async () => { throw Error('Unavailable') } },
    'next/server': { NextResponse: Response },
  })
  await assert.rejects(GET(), /Unavailable/)
})

test('analytics queues one initial view with original URL and referrer before idle loading', () => {
  const Script = () => {}
  const { default: Analytics } = loadComponent('src/components/analytics/GoogleAnalytics.tsx', { 'next/script': Script })
  const [init, external] = Analytics().props.children
  assert.equal(external.props.strategy, 'lazyOnload')
  assert.equal(external.props.src, 'https://www.googletagmanager.com/gtag/js?id=G-2H44Z5Z7S3')
  const window = { location: { href: 'https://asmm.ro/proiecte?source=test' } }
  const document = { title: 'Proiecte', referrer: 'https://example.com/' }
  runInNewContext(init.props.children, { window, document })
  window.location.href = 'https://asmm.ro/contact'
  const commands = window.dataLayer.map(command => Array.from(command))
  assert.equal(commands.length, 2)
  assert.equal(commands[0][0], 'js')
  assert.equal(commands[1][0], 'config')
  assert.equal(commands[1][1], 'G-2H44Z5Z7S3')
  assert.equal(commands[1][2].page_location, 'https://asmm.ro/proiecte?source=test')
  assert.equal(commands[1][2].page_referrer, document.referrer)
  assert.equal(commands[1][2].page_title, document.title)
  assert.equal(commands[1][2].send_page_view, undefined)
})

