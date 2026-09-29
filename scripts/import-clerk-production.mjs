import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { MongoClient } = require('mongodb');
const { createClerkClient } = require('@clerk/backend');
const apply = process.argv.includes('--apply');
const csvPath = process.env.CLERK_USER_EXPORT_CSV;
const expectedDomain = process.env.CLERK_MIGRATION_EXPECTED_DOMAIN || 'asmm.ro';
const assert = (ok, message) => { if (!ok) throw new Error(message); };
assert(csvPath, 'CLERK_USER_EXPORT_CSV must point to the fresh Clerk CSV export.');
function parseCsv(input) {
 const parsed = [];
 let row = [];
 let field = '';
 let quoted = false;
 for (let i = 0; i < input.length; i++) {
  const char = input[i];
  if (quoted) {
   if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
   else if (char === '"') quoted = false;
   else field += char;
  } else if (char === '"' && field === '') quoted = true;
  else if (char === ',') { row.push(field); field = ''; }
  else if (char === '\n') { row.push(field); parsed.push(row); row = []; field = ''; }
  else if (char !== '\r') field += char;
 }
 assert(!quoted, 'CSV contains an unterminated quoted field.');
 if (field || row.length) { row.push(field); parsed.push(row); }
 const headers = parsed.shift()?.map((value, index) => index === 0 ? value.replace(/^\uFEFF/, '') : value) || [];
 assert(headers.length > 0, 'CSV has no header row.');
 return parsed.filter(values => values.some(Boolean)).map(values => {
  assert(values.length === headers.length, 'CSV row has an unexpected number of columns.');
  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
 });
}
const rows = parseCsv(readFileSync(csvPath, 'utf8'));
const norm = value => String(value || '').trim().toLowerCase();
const refs = [['registrations', 'userId'], ['registrations', 'attendance.confirmedBy'], ['payments', 'clerkId'], ['issuedtickets', 'clerkId']];
let client;
try {
 assert(process.env.CLERK_MIGRATION_SECRET_KEY?.startsWith('sk_live_'), 'A separate production migration key is required.');
 assert(process.env.CLERK_MIGRATION_PUBLISHABLE_KEY?.startsWith('pk_live_') && Buffer.from(process.env.CLERK_MIGRATION_PUBLISHABLE_KEY.slice(8), 'base64').toString() === `clerk.${expectedDomain}$`, `Expected the production publishable key for clerk.${expectedDomain}.`);
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
 const matchIssues = { missing: 0, duplicate: 0, emailMismatch: 0 };
 let emailOnlyMatches = 0;
 const sourceToMongoId = new Map();
 for (const r of rows) {
  let matches = mongoUsers.filter(u => u.clerkId === r.id || u.legacyClerkId === r.id);
  if (!matches.length) {
   matches = mongoUsers.filter(u => norm(u.email) === norm(r.primary_email_address));
   if (matches.length === 1) emailOnlyMatches++;
  }
  if (!matches.length) matchIssues.missing++;
  else if (matches.length > 1) matchIssues.duplicate++;
  else if (norm(matches[0].email) !== norm(r.primary_email_address)) matchIssues.emailMismatch++;
  else sourceToMongoId.set(r.id, matches[0].clerkId);
 }
 assert(Object.values(matchIssues).every(count => count === 0), `CSV and database users do not match exactly: ${JSON.stringify({ ...matchIssues, mongoUsers: mongoUsers.length, emailOnlyMatches })}.`);
 assert(new Set(sourceToMongoId.values()).size === rows.length, 'CSV-to-Mongo user mapping is not one-to-one.');
 const clerk = createClerkClient({ secretKey: process.env.CLERK_MIGRATION_SECRET_KEY });
 const domains = await clerk.domains.list();
 assert(domains.data.some(d => d.name === expectedDomain && !d.isSatellite), 'Secret key does not belong to the expected production domain.');
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
 const knownIds = new Set([...sourceIds, ...sourceToMongoId.values(), ...existing.values()]);
 for (const [collection, field] of refs.filter(([, field]) => field !== 'attendance.confirmedBy')) {
  const values = await db.collection(collection).distinct(field);
  assert(values.every(id => knownIds.has(id)), 'A record owner is missing from the migration map.');
 }
 console.log(JSON.stringify({ mode: apply ? 'apply' : 'audit', csvUsers: rows.length, matchedDatabaseUsers: rows.length, matchedByCurrentOrLegacyId: rows.length - emailOnlyMatches, matchedByUniqueEmail: emailOnlyMatches, targetClerkUsers: targetUsers.length, alreadyImported: existing.size, toImport: rows.length - existing.size, passwordHasher: 'bcrypt', destination: `Clerk Production for ${expectedDomain}; MongoDB read-only` }));
 if (!apply) { console.log('Production audit passed. No accounts or database records changed.'); }
 else {
  console.log('Importing into Clerk Production only. MongoDB and development accounts will not be changed. No invitation messages are sent by this script.');
  let imported = 0;
  for (const r of rows) {
   if (existing.has(r.id)) continue;
   // Do not automatically retry ambiguous writes. Rerun discovers successful imports by externalId.
   const createdAt = r.created_at ? new Date(r.created_at) : undefined;
   assert(!createdAt || !Number.isNaN(createdAt.valueOf()), 'Invalid source creation timestamp.');
   const u = await clerk.users.createUser({ externalId: r.id, emailAddress: [r.primary_email_address], firstName: r.first_name || undefined, lastName: r.last_name || undefined, passwordDigest: r.password_digest, passwordHasher: 'bcrypt', createdAt, skipLegalChecks: true });
   existing.set(r.id, u.id);
   imported++;
   if (imported % 25 === 0) console.log(JSON.stringify({ newlyImported: imported }));
   await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert(new Set(existing.values()).size === rows.length, 'New IDs are not unique.');
  const verified = await clerk.users.getUserList({ limit: 1 });
  console.log(JSON.stringify({ result: 'Production Clerk import complete', sourceUsers: rows.length, newlyImported: imported, mappedIdentities: existing.size, targetUserCount: verified.totalCount, databaseChanged: false, nextStep: 'Configure DNS and deployment, then separately link the production user IDs. Original IDs are stored as Clerk externalId.' }));
 }
} catch (e) {
 // SDK/database errors may contain personal data. Emit only sanitized machine codes.
 console.error(JSON.stringify({ stopped: true, reason: e.constructor === Error ? e.message : 'Service rejected the operation; inspect status/code.', status: e.status || null, code: typeof e.code === 'number' ? e.code : null, clerkCodes: Array.isArray(e.errors) ? e.errors.map(x => x.code) : [] }));
 process.exitCode = 1;
} finally { await client?.close(); }
