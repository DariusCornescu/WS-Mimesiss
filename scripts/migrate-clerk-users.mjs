import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { MongoClient } = require('mongodb');
const { createClerkClient } = require('@clerk/backend');
const apply = process.argv.includes('--apply');
const csvPath = 'C:/Users/c0rnesky/Desktop/Darius/Projects/IMM/users_mimesiss_clerk.csv';
const python = path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const pythonCode = 'import csv,json,sys\nwith open(sys.argv[1],encoding="utf-8-sig",newline="") as f: print(json.dumps(list(csv.DictReader(f))))';
const rows = JSON.parse(execFileSync(python, ['-X', 'utf8', '-c', pythonCode, csvPath], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, windowsHide: true }));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const norm = value => String(value || '').trim().toLowerCase();
const refs = [['registrations', 'userId'], ['registrations', 'attendance.confirmedBy'], ['payments', 'clerkId'], ['issuedtickets', 'clerkId']];
let client;
try {
 assert(process.env.CLERK_SECRET_KEY?.startsWith('sk_test_'), 'Only a Clerk development instance is supported.');
 assert(new URL(process.env.MONGODB_URI).pathname === '/mimesiss_test', 'Only mimesiss_test is supported.');
 assert(rows.length > 0, 'CSV is empty.');
 assert(new Set(rows.map(r => r.id)).size === rows.length, 'Duplicate source IDs.');
 assert(new Set(rows.map(r => norm(r.primary_email_address))).size === rows.length, 'Duplicate source emails.');
 for (const r of rows) {
  assert(/^user_/.test(r.id), 'Invalid source user ID.');
  assert(r.primary_email_address && r.verified_email_addresses === r.primary_email_address && !r.unverified_email_addresses, 'Email verification shape needs manual review.');
  assert(r.password_hasher === 'bcrypt' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(r.password_digest), 'Unsupported or invalid password hash.');
  assert(!r.totp_secret && !r.primary_phone_number && !r.verified_phone_numbers && !r.unverified_phone_numbers && !r.username, 'Additional authentication fields need a migration plan.');
 }
 client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
 await client.connect();
 const db = client.db('mimesiss_test');
 const sourceIds = new Set(rows.map(r => r.id));
 const mongoUsers = await db.collection('users').find({}, { projection: { clerkId: 1, email: 1, legacyClerkId: 1, role: 1 } }).toArray();
 for (const r of rows) {
  const matches = mongoUsers.filter(u => u.clerkId === r.id || u.legacyClerkId === r.id);
  assert(matches.length === 1 && norm(matches[0].email) === norm(r.primary_email_address), 'CSV and database users do not match exactly.');
 }
 const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
 const targetUsers = [];
 for (let offset = 0; ; offset += 100) {
  const page = await clerk.users.getUserList({ limit: 100, offset });
  targetUsers.push(...page.data);
  if (targetUsers.length >= page.totalCount || !page.data.length) break;
 }
 const existing = new Map();
 for (const r of rows) {
  const byId = targetUsers.filter(u => u.externalId === r.id);
  assert(byId.length <= 1, 'Duplicate migration identity in Clerk.');
  const byEmail = targetUsers.filter(u => u.emailAddresses.some(e => norm(e.emailAddress) === norm(r.primary_email_address)));
  assert(byEmail.every(u => u.externalId === r.id), 'A target Clerk email already exists without the matching legacy ID. Resolve this account before importing.');
  if (byId.length) {
   const u = byId[0];
   assert(u.emailAddresses.some(e => e.id === u.primaryEmailAddressId && norm(e.emailAddress) === norm(r.primary_email_address) && e.verification?.status === 'verified'), 'Existing migration account email mismatch.');
   assert(!u.publicMetadata?.role, 'Existing Clerk role metadata needs review before migration.');
   existing.set(r.id, u.id);
  }
 }
 const knownIds = new Set([...sourceIds, ...existing.values()]);
 for (const [collection, field] of refs.filter(([, field]) => field !== 'attendance.confirmedBy')) {
  const values = await db.collection(collection).distinct(field);
  assert(values.every(id => knownIds.has(id)), 'A record owner is missing from the migration map.');
 }
 console.log(JSON.stringify({ mode: apply ? 'apply' : 'audit', csvUsers: rows.length, matchedDatabaseUsers: rows.length, targetClerkUsers: targetUsers.length, alreadyImported: existing.size, toImport: rows.length - existing.size, passwordHasher: 'bcrypt', destination: 'Clerk development + mimesiss_test' }));
 const capacityNeeded = targetUsers.length + rows.length - existing.size;
 if (capacityNeeded > 100) {
  console.log(JSON.stringify({ blocker: 'Clerk development instances allow at most 100 users.', requiredCapacity: capacityNeeded, availableSlots: Math.max(0, 100 - targetUsers.length), action: 'Use a deliberately selected test subset, or prepare a separate production migration from the original CSV.' }));
  assert(!apply, 'Development quota would be exceeded. No accounts or database records changed by this run.');
 }
 if (!apply) { console.log(capacityNeeded > 100 ? 'Read-only audit complete; full migration is blocked by the development quota.' : 'Audit passed. No accounts or database records changed.'); }
 else {
  console.log('Keep the app stopped until migration finishes. Importing accounts; no invitation messages are sent by this script.');
  let imported = 0;
  for (const r of rows) {
   if (existing.has(r.id)) continue;
   // Do not automatically retry ambiguous writes. Rerun discovers successful imports by externalId.
   const u = await clerk.users.createUser({ externalId: r.id, emailAddress: [r.primary_email_address], firstName: r.first_name || undefined, lastName: r.last_name || undefined, passwordDigest: r.password_digest, passwordHasher: 'bcrypt' });
   existing.set(r.id, u.id);
   imported++;
   if (imported % 25 === 0) console.log(JSON.stringify({ newlyImported: imported }));
   await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert(new Set(existing.values()).size === rows.length, 'New IDs are not unique.');
  const totalsBefore = {};
  for (const name of ['users', 'registrations', 'payments', 'issuedtickets']) totalsBefore[name] = await db.collection(name).countDocuments();
  const session = client.startSession();
  try {
   await session.withTransaction(async () => {
    const current = await db.collection('users').find({}, { session, projection: { clerkId: 1, legacyClerkId: 1, email: 1 } }).toArray();
    for (const r of rows) {
     const u = current.filter(u => u.clerkId === r.id || u.legacyClerkId === r.id);
     assert(u.length === 1 && norm(u[0].email) === norm(r.primary_email_address), 'Database users changed since preflight.');
     assert(u[0].clerkId === r.id || u[0].clerkId === existing.get(r.id), 'Conflicting mapping.');
    }
    await db.collection('users').bulkWrite(rows.map(r => ({ updateOne: { filter: { _id: current.find(u => u.clerkId === r.id || u.legacyClerkId === r.id)._id }, update: { $set: { clerkId: existing.get(r.id), legacyClerkId: r.id } } } })), { session });
    for (const [collection, field] of refs) await db.collection(collection).bulkWrite(rows.map(r => ({ updateMany: { filter: { [field]: r.id }, update: { $set: { [field]: existing.get(r.id) } } } })), { session });
    for (const [name, count] of Object.entries(totalsBefore)) assert(await db.collection(name).countDocuments({}, { session }) === count, 'Record count changed during migration.');
    for (const [collection, field] of [['users', 'clerkId'], ...refs]) assert(await db.collection(collection).countDocuments({ [field]: { $in: [...sourceIds] } }, { session }) === 0, 'Some legacy references were not remapped.');
   });
  } finally { await session.endSession(); }
  console.log(JSON.stringify({ result: 'Migration complete', linkedUsers: rows.length, preservedRecordCounts: totalsBefore, roles: 'preserved from MongoDB' }));
 }
} catch (e) {
 // SDK/database errors may contain personal data. Emit only sanitized machine codes.
 console.error(JSON.stringify({ stopped: true, reason: e.constructor === Error ? e.message : 'Service rejected the operation; inspect status/code.', status: e.status || null, code: typeof e.code === 'number' ? e.code : null, clerkCodes: Array.isArray(e.errors) ? e.errors.map(x => x.code) : [] }));
 process.exitCode = 1;
} finally { await client?.close(); }
