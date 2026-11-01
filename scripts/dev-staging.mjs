import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawn } from 'node:child_process'
import { MongoMemoryReplSet } from 'mongodb-memory-server-core'
import mongoose from 'mongoose'
import { atlasStagingUri } from './helpers/atlas-staging.mjs'

const configured = parseEnv(readFileSync('.env.staging.local', 'utf8'))
configured.ASMM_EPHEMERAL_DB = process.env.ASMM_EPHEMERAL_DB ?? configured.ASMM_EPHEMERAL_DB
for (const [key, prefixes] of [['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', ['pk_test_']], ['CLERK_SECRET_KEY', ['sk_test_']], ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', ['pk_test_']], ['STRIPE_SECRET_KEY', ['rk_test_', 'sk_test_']]]) {
  if (!prefixes.some(prefix => configured[key]?.startsWith(prefix))) throw Error('Completează ' + key + ' cu valoarea din mediul de test, în .env.staging.local.')
}
const host = Buffer.from(configured.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.slice(8), 'base64').toString('utf8')
if (host !== 'definite-herring-2323.clerk.accounts.dev$') throw Error('Cheia Clerk nu aparține aplicației ASMM Development selectate.')
if (configured.MONGODB_DB_NAME !== 'asmm_staging') throw Error('Folosește exclusiv baza asmm_staging pentru acest mediu.')
let database
try {
  if (configured.ASMM_EPHEMERAL_DB === '1') {
    database = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1, ip: '127.0.0.1' } })
    configured.MONGODB_URI = database.getUri()
  } else {
    configured.MONGODB_URI = atlasStagingUri(configured)
  }
  if (configured.ASMM_STAGING_SEED === '1') {
    const connection = await mongoose.createConnection(configured.MONGODB_URI, { dbName: configured.MONGODB_DB_NAME }).asPromise()
    try {
      const now = new Date()
      await connection.db.collection('appsettings').updateOne({}, { $setOnInsert: {
        eventMode: 'ball', paymentsEnabled: true, globalRegistrationEnabled: true,
        workshopVisibleToPublic: false, allowCancelRegistration: true,
        defaultMaxParticipants: 20, ballMaxTicketsPerUser: 2, createdAt: now, updatedAt: now,
      } }, { upsert: true })
      await connection.db.collection('tickets').updateOne({ type: 'asmm-staging-ball' }, { $setOnInsert: {
        title: 'Bilet de test ASMM', description: 'Produs fictiv pentru verificarea plăților în sandbox.',
        price: 50, features: [], type: 'asmm-staging-ball', enabled: true, category: 'ball',
        createdAt: now, updatedAt: now,
      } }, { upsert: true })
      console.log('Baza de test conține un bilet fictiv de 50 RON pentru plăți sandbox.')
    } finally { await connection.close() }
  }
  const runtimeConfigured = { ...configured }
  delete runtimeConfigured.ATLAS_STAGING_PASSWORD
  const env = { ...process.env, ...runtimeConfigured, ATLAS_STAGING_PASSWORD: '', ASMM_LOCAL_PREVIEW: process.env.ASMM_LOCAL_PREVIEW === '1' ? '1' : '', NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: 'true', NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' }
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', 'localhost', '--port', '3000'], { env, stdio: 'inherit', windowsHide: true })
  const stop = () => child.kill()
  process.on('SIGINT', stop); process.on('SIGTERM', stop)
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 0)) })
} finally { await database?.stop() }
