import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
if (!uri || new URL(uri).pathname !== '/mimesiss_test') throw new Error('Restore requires the explicit mimesiss_test database.');
const archive = 'C:/Users/c0rnesky/Desktop/Darius/Projects/IMM/mimesiss_prod.archive.gz';
const binary = path.resolve('.preview/migration-tools/mongodb-database-tools-windows-x86_64-100.18.0/bin/mongorestore.exe');
const apply = process.argv.includes('--apply');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
const config = path.resolve('.preview/migration-tools/restore-secret.yml');
try {
 await client.connect();
 const db = client.db('mimesiss_test');
 const existing = await db.listCollections({}, { nameOnly: true }).toArray();
 for (const { name } of existing) { if (await db.collection(name).countDocuments({}, { limit: 1 })) throw new Error('Target is not empty. Stopping without overwriting any collections.'); }
 fs.writeFileSync(config, JSON.stringify({ uri }), { mode: 0o600 });
 const args = ['--config', config, '--gzip', '--archive=' + archive, '--nsInclude=mimesiss_prod.*', '--nsFrom=mimesiss_prod.*', '--nsTo=mimesiss_test.*', '--stopOnError'];
 if (!apply) args.push('--dryRun', '--verbose');
 const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 180000, windowsHide: true });
 const output = (result.stdout || '') + (result.stderr || '');
 console.log(JSON.stringify({ mode: apply ? 'restore' : 'dry-run', exitCode: result.status, timedOut: result.error?.code === 'ETIMEDOUT', authenticationError: /authentication failed|bad auth/i.test(output), duplicateKeyError: /E11000/.test(output) }));
 // Report only aggregate result lines, never document contents or credentials.
 for (const line of output.split('\n')) if (/\d+ document\(s\) restored successfully/.test(line)) console.log(line.replace(/^.*?(\d+ document\(s\))/, '$1'));
 if (result.status !== 0) { process.exitCode = 1; }
 else if (apply) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const counts = [];
  for (const { name } of collections) counts.push({ collection: name, documents: await db.collection(name).countDocuments(), indexes: (await db.collection(name).indexes()).length });
  console.log(JSON.stringify({ database: 'mimesiss_test', counts }, null, 2));
 }
} catch (error) {
 console.log(JSON.stringify({ stopped: true, errorType: error.name, reason: error.message.startsWith('Target is not empty') ? error.message : 'Restore preflight or connection failed; no credentials displayed.' }));
 process.exitCode = 1;
} finally {
 if (fs.existsSync(config)) fs.unlinkSync(config);
 await client.close();
}
