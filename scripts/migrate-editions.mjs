/**
 * Migrare: introduce Project și Edition, și leagă workshopurile existente de
 * ediția căreia îi aparțin.
 *
 * Până acum nu exista noțiunea de ediție: toate workshopurile aparțineau
 * implicit lui noiembrie 2025, fără nimic care să le lege de ea. La ediția
 * următoare datele s-ar fi amestecat.
 *
 * Idempotent — se poate rula de câte ori vrei.
 *
 *   node scripts/migrate-editions.mjs --dry-run
 *   node scripts/migrate-editions.mjs
 *   node scripts/migrate-editions.mjs --with-placeholders
 *
 * --with-placeholders adaugă cele trei proiecte de exemplu (CCT, Cursuri,
 * Voluntariat) ca să nu arate homepage-ul gol în demo. NU le rula pe producție
 * înainte ca asociația să confirme lista reală de proiecte.
 */

import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

const DRY_RUN = process.argv.includes('--dry-run')
const WITH_PLACEHOLDERS = process.argv.includes('--with-placeholders')

/** .env.local nu e încărcat automat într-un script standalone. */
function readEnvLocal() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=')
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
      })
  )
}

const CONGRESS = {
  slug: 'congres',
  title: 'MIMESISS',
  kicker: 'Congres · noiembrie',
  summary:
    'Military Medicine Scientific Session for Students. Trei zile de workshopuri practice, conferințe și concurs de comunicări științifice.',
  coverImage: '/old/3.jpeg',
  order: 0,
  status: 'published',
  kind: 'congress',
}

const EDITION_2025 = {
  year: 2025,
  title: 'MIMESISS 2025',
  startDate: new Date('2025-11-14T00:00:00Z'),
  endDate: new Date('2025-11-16T23:59:59Z'),
  status: 'archived',
}

const PLACEHOLDERS = [
  {
    slug: 'cct',
    title: 'CCT',
    kicker: 'Concurs',
    summary: 'Concursul de Comunicări Științifice — lucrări originale prezentate în fața juriului.',
    coverImage: '/old/8.jpeg',
    order: 1,
    status: 'published',
    kind: 'standard',
  },
  {
    slug: 'cursuri',
    title: 'Cursuri & Workshopuri',
    kicker: 'Peste an',
    summary: 'Sesiuni practice de-a lungul anului universitar, deschise studenților mediciniști.',
    coverImage: '/old/11.jpeg',
    order: 2,
    status: 'published',
    kind: 'standard',
  },
  {
    slug: 'voluntariat',
    title: 'Voluntariat',
    kicker: 'Comunitate',
    summary: 'Echipa care ține congresul pe picioare și proiectele asociației în mișcare.',
    coverImage: '/old/2.jpeg',
    order: 3,
    status: 'published',
    kind: 'standard',
  },
]

async function main() {
  const uri = process.env.MONGODB_URI || readEnvLocal().MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI lipsește (nici în mediu, nici în .env.local)')

  console.log(`\nBază de date : ${uri.replace(/\/\/[^@]*@/, '//***@')}`)
  console.log(`Mod          : ${DRY_RUN ? 'DRY RUN — nu se scrie nimic' : 'SCRIE în baza de date'}`)
  console.log(`Placeholders : ${WITH_PLACEHOLDERS ? 'DA' : 'nu'}\n`)

  await mongoose.connect(uri)
  const db = mongoose.connection.db
  const projects = db.collection('projects')
  const editions = db.collection('editions')
  const workshops = db.collection('workshops')

  // 1. Proiectul congres
  const existingCongress = await projects.findOne({ slug: CONGRESS.slug })
  if (existingCongress) {
    console.log(`  = proiectul „${CONGRESS.title}" există deja`)
  } else if (DRY_RUN) {
    console.log(`  + s-ar crea proiectul „${CONGRESS.title}"`)
  } else {
    await projects.insertOne({ ...CONGRESS, createdAt: new Date(), updatedAt: new Date() })
    console.log(`  + creat proiectul „${CONGRESS.title}"`)
  }

  // 2. Proiectele placeholder
  if (WITH_PLACEHOLDERS) {
    for (const p of PLACEHOLDERS) {
      if (await projects.findOne({ slug: p.slug })) {
        console.log(`  = proiectul „${p.title}" există deja`)
      } else if (DRY_RUN) {
        console.log(`  + s-ar crea proiectul placeholder „${p.title}"`)
      } else {
        await projects.insertOne({ ...p, createdAt: new Date(), updatedAt: new Date() })
        console.log(`  + creat proiectul placeholder „${p.title}"`)
      }
    }
  }

  // 3. Ediția 2025. În dry-run proiectul poate să nu existe încă.
  const congressDoc = await projects.findOne({ slug: CONGRESS.slug })
  let editionId = null

  if (!congressDoc) {
    console.log('  ~ ediția se sare (proiectul congres nu există încă în dry-run)')
  } else {
    const existingEdition = await editions.findOne({
      projectId: congressDoc._id,
      year: EDITION_2025.year,
    })
    if (existingEdition) {
      editionId = existingEdition._id
      console.log(`  = ediția „${EDITION_2025.title}" există deja`)
    } else if (DRY_RUN) {
      console.log(`  + s-ar crea ediția „${EDITION_2025.title}"`)
    } else {
      const res = await editions.insertOne({
        ...EDITION_2025,
        projectId: congressDoc._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      editionId = res.insertedId
      console.log(`  + creată ediția „${EDITION_2025.title}"`)
    }
  }

  // 4. Leagă workshopurile fără ediție
  const orphans = await workshops.countDocuments({ editionId: { $exists: false } })
  if (orphans === 0) {
    console.log('  = toate workshopurile au deja o ediție')
  } else if (DRY_RUN || !editionId) {
    console.log(`  + s-ar lega ${orphans} workshopuri de „${EDITION_2025.title}"`)
  } else {
    const res = await workshops.updateMany(
      { editionId: { $exists: false } },
      { $set: { editionId } }
    )
    console.log(`  + legate ${res.modifiedCount} workshopuri de „${EDITION_2025.title}"`)
  }

  // Raport final
  console.log('\nStare după rulare:')
  console.log(`  proiecte             : ${await projects.countDocuments()}`)
  console.log(`  ediții               : ${await editions.countDocuments()}`)
  console.log(`  workshopuri cu ediție: ${await workshops.countDocuments({ editionId: { $exists: true } })}`)
  console.log(`  workshopuri fără     : ${await workshops.countDocuments({ editionId: { $exists: false } })}`)

  await mongoose.disconnect()
  console.log(DRY_RUN ? '\nDry run încheiat — nu s-a scris nimic.\n' : '\nMigrare încheiată.\n')
}

main().catch(async (err) => {
  console.error('\nMigrarea a eșuat:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
