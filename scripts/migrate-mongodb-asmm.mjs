import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
require('@next/env').loadEnvConfig(process.cwd())
const { MongoClient } = require('mongodb')
const { createClerkClient } = require('@clerk/backend')

const apply = process.argv.includes('--apply')
const sourceUri = process.env.MONGODB_URI
const targetUri = process.env.ASMM_TARGET_MONGODB_URI
const targetDatabaseName = process.env.ASMM_TARGET_DATABASE || 'asmm_staging'
const csvPath = process.env.CLERK_USER_EXPORT_CSV
const sourceDatabaseName = 'mimesiss_test'
const refs = [
  ['registrations', 'userId'],
  ['registrations', 'attendance.confirmedBy'],
  ['payments', 'clerkId'],
  ['issuedtickets', 'clerkId'],
]

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

function parseCsv(input) {
  const parsed = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') quoted = false
      else field += char
    } else if (char === '"' && field === '') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      parsed.push(row)
      row = []
      field = ''
    } else if (char !== '\r') field += char
  }

  assert(!quoted, 'CSV contains an unterminated quoted field.')
  if (field || row.length) {
    row.push(field)
    parsed.push(row)
  }

  const headers = parsed.shift()?.map((value, index) =>
    index === 0 ? value.replace(/^\uFEFF/, '') : value,
  ) || []
  assert(headers.length > 0, 'CSV has no header row.')

  return parsed.filter(values => values.some(Boolean)).map(values => {
    assert(values.length === headers.length, 'CSV row has an unexpected number of columns.')
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]))
  })
}

const normalize = value => String(value || '').trim().toLowerCase()

function connectionIdentity(uri) {
  const parsed = new URL(uri.replace(/^mongodb\+srv:/, 'https:').replace(/^mongodb:/, 'http:'))
  return { host: parsed.hostname, database: parsed.pathname.replace(/^\//, '') }
}

async function getCounts(db, collectionNames) {
  const counts = {}
  for (const name of collectionNames) counts[name] = await db.collection(name).countDocuments()
  return counts
}

async function getClerkUsers(clerk) {
  const users = []
  for (let offset = 0; ; offset += 100) {
    const page = await clerk.users.getUserList({ limit: 100, offset })
    users.push(...page.data)
    if (users.length >= page.totalCount || !page.data.length) break
  }
  return users
}

function indexOptions(index) {
  const allowed = [
    'name',
    'unique',
    'sparse',
    'expireAfterSeconds',
    'partialFilterExpression',
    'collation',
    'hidden',
    'wildcardProjection',
  ]
  return Object.fromEntries(allowed.filter(key => index[key] !== undefined).map(key => [key, index[key]]))
}

async function copyDatabase(sourceDb, targetDb, collectionNames) {
  for (const name of collectionNames) {
    await targetDb.createCollection(name)
    const documents = await sourceDb.collection(name).find({}).toArray()
    if (documents.length) await targetDb.collection(name).insertMany(documents, { ordered: true })

    const indexes = await sourceDb.collection(name).listIndexes().toArray()
    for (const index of indexes.filter(item => item.name !== '_id_')) {
      await targetDb.collection(name).createIndex(index.key, indexOptions(index))
    }
  }
}

let sourceClient
let targetClient

try {
  assert(sourceUri, 'MONGODB_URI is required for the staging source.')
  assert(targetUri, 'ASMM_TARGET_MONGODB_URI is required for the destination cluster.')
  assert(csvPath, 'CLERK_USER_EXPORT_CSV must point to the fresh Clerk export.')
  assert(process.env.CLERK_MIGRATION_SECRET_KEY?.startsWith('sk_live_'), 'A production Clerk migration key is required.')
  assert(/^asmm(?:_[a-z0-9_-]+)?$/.test(targetDatabaseName), 'Unexpected target database name.')

  const sourceIdentity = connectionIdentity(sourceUri)
  const targetIdentity = connectionIdentity(targetUri)
  assert(sourceIdentity.database === sourceDatabaseName, `Source database must be ${sourceDatabaseName}.`)
  assert(sourceIdentity.host !== targetIdentity.host, 'Source and target MongoDB clusters must be different.')

  const rows = parseCsv(readFileSync(csvPath, 'utf8'))
  assert(rows.length > 0, 'Clerk export is empty.')
  assert(new Set(rows.map(row => row.id)).size === rows.length, 'Clerk export contains duplicate IDs.')
  assert(new Set(rows.map(row => normalize(row.primary_email_address))).size === rows.length, 'Clerk export contains duplicate emails.')

  sourceClient = new MongoClient(sourceUri, { serverSelectionTimeoutMS: 10000 })
  targetClient = new MongoClient(targetUri, { serverSelectionTimeoutMS: 10000 })
  await Promise.all([sourceClient.connect(), targetClient.connect()])

  const sourceDb = sourceClient.db(sourceDatabaseName)
  const targetDb = targetClient.db(targetDatabaseName)
  const collectionNames = (await sourceDb.listCollections({}, { nameOnly: true }).toArray())
    .map(collection => collection.name)
    .filter(name => !name.startsWith('system.'))
    .sort()
  assert(collectionNames.length > 0, 'Source database has no collections.')

  const sourceCounts = await getCounts(sourceDb, collectionNames)
  const targetCollections = (await targetDb.listCollections({}, { nameOnly: true }).toArray())
    .map(collection => collection.name)
    .filter(name => !name.startsWith('system.'))
  const targetCounts = await getCounts(targetDb, targetCollections)
  const sourceTotal = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0)
  const targetTotal = Object.values(targetCounts).reduce((sum, count) => sum + count, 0)
  const targetIsEmpty = targetTotal === 0 && targetCollections.length === 0
  const targetMatchesSource = collectionNames.every(name => targetCounts[name] === sourceCounts[name])
    && targetCollections.every(name => collectionNames.includes(name))
  assert(targetIsEmpty || targetMatchesSource, 'Target database is partially populated; stop for manual review.')

  const sourceUsers = await sourceDb.collection('users').find({}, {
    projection: { clerkId: 1, legacyClerkId: 1, email: 1, role: 1 },
  }).toArray()
  assert(sourceUsers.length === rows.length, 'Clerk export and MongoDB user counts differ.')

  const clerk = createClerkClient({ secretKey: process.env.CLERK_MIGRATION_SECRET_KEY })
  const targetClerkUsers = await getClerkUsers(clerk)
  const mappings = []
  for (const row of rows) {
    const mongoMatches = sourceUsers.filter(user => normalize(user.email) === normalize(row.primary_email_address))
    assert(mongoMatches.length === 1, 'A Clerk export row does not have one unique MongoDB email match.')
    const clerkMatches = targetClerkUsers.filter(user => user.externalId === row.id)
    assert(clerkMatches.length === 1, 'A source Clerk ID does not have one unique target Clerk match.')
    const targetUser = clerkMatches[0]
    assert(targetUser.emailAddresses.some(email => normalize(email.emailAddress) === normalize(row.primary_email_address)), 'Target Clerk email mismatch.')
    mappings.push({
      mongoObjectId: mongoMatches[0]._id,
      currentId: mongoMatches[0].clerkId,
      existingLegacyId: mongoMatches[0].legacyClerkId,
      sourceId: row.id,
      targetId: targetUser.id,
    })
  }

  assert(new Set(mappings.map(item => item.currentId)).size === rows.length, 'Current MongoDB IDs are not unique.')
  assert(new Set(mappings.map(item => item.targetId)).size === rows.length, 'Target Clerk IDs are not unique.')
  const oldIds = new Set(mappings.flatMap(item => [item.currentId, item.sourceId, item.existingLegacyId].filter(Boolean)))
  const newIds = new Set(mappings.map(item => item.targetId))
  assert([...newIds].every(id => !oldIds.has(id)), 'Old and new Clerk ID sets overlap unexpectedly.')

  const referenceAudit = {}
  for (const [collection, field] of refs) {
    if (!collectionNames.includes(collection)) {
      referenceAudit[`${collection}.${field}`] = { values: 0, old: 0, new: 0, unknown: 0 }
      continue
    }
    const values = (await sourceDb.collection(collection).distinct(field)).filter(Boolean)
    referenceAudit[`${collection}.${field}`] = {
      values: values.length,
      old: values.filter(value => oldIds.has(value)).length,
      new: values.filter(value => newIds.has(value)).length,
      unknown: values.filter(value => !oldIds.has(value) && !newIds.has(value)).length,
    }
  }
  for (const [field, result] of Object.entries(referenceAudit)) {
    assert(result.unknown === 0, `Unmapped user reference values found in ${field}.`)
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'audit',
    sourceDatabase: sourceDatabaseName,
    targetDatabase: targetDatabaseName,
    collections: collectionNames.length,
    sourceDocuments: sourceTotal,
    targetDocuments: targetTotal,
    targetState: targetIsEmpty ? 'empty' : 'copied',
    usersMapped: mappings.length,
    referenceAudit,
  }))

  if (!apply) {
    console.log('MongoDB migration audit passed. No target data changed.')
  } else {
    if (targetIsEmpty) await copyDatabase(sourceDb, targetDb, collectionNames)

    const countsBefore = await getCounts(targetDb, collectionNames)
    const session = targetClient.startSession()
    try {
      await session.withTransaction(async () => {
        const targetUsers = await targetDb.collection('users').find({}, { session }).toArray()
        const userOperations = mappings.map(mapping => {
          const user = targetUsers.find(item => item._id.equals(mapping.mongoObjectId))
          assert(user, 'Copied target user is missing.')
          assert(user.clerkId === mapping.currentId || user.clerkId === mapping.targetId, 'Target user has a conflicting Clerk ID.')
          const legacyIds = [...new Set([
            mapping.existingLegacyId,
            mapping.sourceId,
            mapping.currentId,
          ].filter(Boolean))]
          return {
            updateOne: {
              filter: { _id: mapping.mongoObjectId },
              update: {
                $set: {
                  clerkId: mapping.targetId,
                  legacyClerkId: mapping.sourceId,
                  previousClerkId: mapping.currentId,
                },
                $addToSet: { legacyClerkIds: { $each: legacyIds } },
              },
            },
          }
        })
        await targetDb.collection('users').bulkWrite(userOperations, { session, ordered: true })

        for (const [collection, field] of refs) {
          if (!collectionNames.includes(collection)) continue
          const operations = mappings.map(mapping => ({
            updateMany: {
              filter: { [field]: { $in: [mapping.currentId, mapping.sourceId] } },
              update: { $set: { [field]: mapping.targetId } },
            },
          }))
          await targetDb.collection(collection).bulkWrite(operations, { session, ordered: true })
        }

        for (const [name, count] of Object.entries(countsBefore)) {
          assert(await targetDb.collection(name).countDocuments({}, { session }) === count, `Document count changed in ${name}.`)
        }
        assert(await targetDb.collection('users').countDocuments({ clerkId: { $in: [...oldIds] } }, { session }) === 0, 'Some user Clerk IDs were not remapped.')
        for (const [collection, field] of refs) {
          if (!collectionNames.includes(collection)) continue
          assert(await targetDb.collection(collection).countDocuments({ [field]: { $in: [...oldIds] } }, { session }) === 0, `Some ${collection}.${field} values were not remapped.`)
        }
      })
    } finally {
      await session.endSession()
    }

    const finalCounts = await getCounts(targetDb, collectionNames)
    assert(collectionNames.every(name => finalCounts[name] === sourceCounts[name]), 'Final collection counts differ from the source.')
    console.log(JSON.stringify({
      result: 'MongoDB migration complete',
      targetDatabase: targetDatabaseName,
      collections: collectionNames.length,
      documents: Object.values(finalCounts).reduce((sum, count) => sum + count, 0),
      linkedUsers: mappings.length,
      roles: 'preserved',
    }))
  }
} catch (error) {
  console.error(JSON.stringify({
    stopped: true,
    reason: error instanceof Error ? error.message : 'Migration failed.',
    code: typeof error?.code === 'number' ? error.code : null,
  }))
  process.exitCode = 1
} finally {
  await Promise.allSettled([sourceClient?.close(), targetClient?.close()])
}
