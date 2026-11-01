import { spawn } from 'node:child_process'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import loadConfig from 'next/dist/server/config.js'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

const database = await MongoMemoryServer.create({ binary: { version: '7.0.24' } })
try {
  const env = { ...process.env, ASMM_LOCAL_PREVIEW: '1', MONGODB_URI: database.getUri(), MONGODB_DB_NAME: 'gallery_preview',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_Y2ktcGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==', CLERK_SECRET_KEY: 'sk_live_ciplaceholdernotarealkey',
    STRIPE_SECRET_KEY: 'sk_test_ciplaceholdernotarealkey', STRIPE_WEBHOOK_SECRET: 'whsec_ciplaceholdernotarealsecret', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_ciplaceholdernotarealkey',
    NEXT_PUBLIC_BASE_URL: 'http://localhost:3105', NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'development' }
  const configuration = await loadConfig.default(PHASE_DEVELOPMENT_SERVER, process.cwd())
  configuration.distDir = '.next-gallery-check/dev'
  configuration.distDirRoot = '.next-gallery-check'
  env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(configuration)
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', 'localhost', '--port', '3105'], { env, stdio: 'inherit', windowsHide: true })
  const stop = () => child.kill()
  process.on('SIGINT', stop); process.on('SIGTERM', stop)
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 0)) })
} finally { await database.stop() }
