import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { MongoClient } from 'mongodb'
import { atlasStagingUri } from './helpers/atlas-staging.mjs'

const configured = parseEnv(readFileSync(new URL('../.env.staging.local', import.meta.url), 'utf8'))
if (configured.MONGODB_DB_NAME !== 'asmm_staging') throw new Error('Baza configurată nu este asmm_staging.')

const client = new MongoClient(atlasStagingUri(configured), { serverSelectionTimeoutMS: 10000 })
let stage = 'connect'
try {
  await client.connect()
  stage = 'staging ping'
  await client.db('asmm_staging').command({ ping: 1 })
  stage = 'staging collections'
  await client.db('asmm_staging').listCollections({}, { nameOnly: true }).toArray()

  let adminDenied = false
  try {
    stage = 'admin isolation'
    await client.db('admin').listCollections({}, { nameOnly: true }).toArray()
  } catch (error) {
    if (error?.code !== 13 && !(error?.code === 8000 && /not allowed|not authorized|unauthorized/i.test(error?.message || ''))) throw error
    adminDenied = true
  }
  if (!adminDenied) throw new Error('Contul aplicației poate citi baza admin; verifică rolurile Atlas.')
  console.log('Conexiunea la ASMM Staging funcționează; accesul la baza admin este refuzat.')
} catch (error) {
  const category = error?.code === 8000 && /authentication failed|bad auth/i.test(error?.message || '')
    ? 'autentificare respinsă'
    : error?.code === 13 ? 'drepturi insuficiente' : error?.codeName || error?.name || 'eroare necunoscută'
  console.error('Verificarea Atlas Staging a eșuat:', stage, category, `(cod ${error?.code ?? 'indisponibil'})`)
  process.exitCode = 1
} finally {
  await client.close()
}
