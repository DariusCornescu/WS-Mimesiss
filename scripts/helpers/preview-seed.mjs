// Sample content for screenshot and preview runs against an in-memory database.
// Dates are relative to today so the "upcoming events" section always has data.
export async function seedPreviewDatabase(db) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const day = offset => new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate() + offset))

  await db.collection('appsettings').insertOne({
    eventMode: 'workshop', paymentsEnabled: false, globalRegistrationEnabled: false,
    workshopVisibleToPublic: false, allowCancelRegistration: true,
    defaultMaxParticipants: 20, ballMaxTicketsPerUser: 2, createdAt: now, updatedAt: now,
  })

  const project = (slug, title, summary, order, kind, extra = {}) => ({
    slug, title, summary, order, kind, status: 'published', coverPositionX: 50, coverPositionY: 50, createdAt: now, updatedAt: now, ...extra,
  })
  const { insertedIds } = await db.collection('projects').insertMany([
    project('mimesiss', 'MIMESISS', 'Congresul științific de medicină militară, organizat de studenți, pentru viitorii medici. Workshopuri practice, conferințe și comunicări științifice.', 0, 'congress', { coverImage: '/old/1.jpeg' }),
    project('tabara', 'Tabăra de vară', 'O săptămână de pregătire practică în teren, alături de instructori militari.', 1, 'standard', { kicker: 'Voluntariat', coverImage: '/old/3.jpeg' }),
    project('concurs', 'Concursul de cazuri clinice', 'Echipe de studenți rezolvă cazuri clinice din medicina militară.', 2, 'standard'),
  ])
  const [mimesiss, tabara, concurs] = Object.values(insertedIds)

  const edition = (projectId, editionYear, title, status, startDate, endDate) => ({
    projectId, year: editionYear, title, status, startDate, endDate, createdAt: now, updatedAt: now,
  })
  await db.collection('editions').insertMany([
    edition(concurs, year, `Concursul de cazuri clinice ${year}`, 'active', day(-1), day(2)),
    edition(mimesiss, year + 1, `MIMESISS ${year + 1}`, 'upcoming', day(14), day(17)),
    edition(tabara, year + 1, `Tabăra de vară ${year + 1}`, 'upcoming', undefined, undefined),
    edition(mimesiss, year - 1, `MIMESISS ${year - 1}`, 'archived', day(-300), day(-297)),
  ])
}
