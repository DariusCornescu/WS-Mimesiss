import { spawn } from 'node:child_process'
import { MongoMemoryReplSet } from 'mongodb-memory-server-core'

// No real database or provider credentials are consumed by this build check.
const database = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1, ip: '127.0.0.1' } })
try {
  const env = { ...process.env,
    ASMM_LOCAL_PREVIEW: '', MONGODB_URI: database.getUri(), MONGODB_DB_NAME: 'asmm_build_test',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_Y2ktcGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==',
    CLERK_SECRET_KEY: 'sk_live_ciplaceholdernotarealkey',
    STRIPE_SECRET_KEY: 'sk_test_ciplaceholdernotarealkey', STRIPE_WEBHOOK_SECRET: 'whsec_ciplaceholdernotarealsecret',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_ciplaceholdernotarealkey', NEXT_PUBLIC_BASE_URL: 'http://localhost:3100', NEXT_TELEMETRY_DISABLED: '1',
  }
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build', '--webpack'], { env, stdio: 'inherit', windowsHide: true })
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)) })
} finally { await database.stop() }
