import connectDB from '@/lib/mongodb'
import { GalleryAlbum as AlbumModel } from '@/models/GalleryAlbum'
import { ProjectImage } from '@/models/ProjectImage'
import { LEGACY_ALBUM, type GalleryAlbum, type GalleryPhoto } from '@/lib/gallery-types'
import { RequestError } from '@/lib/request-security'

const albumFields = 'title description editionYear status coverImage photos revision updatedAt legacy'
const objectIdPattern = /^[a-f\d]{24}$/i
const oldPhotoPattern = /^\/old\/(?:[1-9]|1[0-2])\.jpeg$/
const uploadedPhotoPattern = /^\/api\/project-images\/([a-f\d]{24})$/i

type AlbumRecord = Omit<GalleryAlbum, 'id' | 'updatedAt'> & { _id: { toString(): string }; updatedAt?: Date; removed?: boolean }
type AlbumInput = Pick<GalleryAlbum, 'title' | 'description' | 'editionYear' | 'status' | 'coverImage' | 'photos'>

function serializeAlbum(record: AlbumRecord, published = false): GalleryAlbum {
  return {
    id: record.legacy ? 'archive' : record._id.toString(),
    title: record.title,
    description: record.description || '',
    editionYear: record.editionYear ?? null,
    status: record.status,
    coverImage: record.coverImage || '',
    photos: record.photos.filter(photo => !published || !photo.hidden).map(photo => ({
      url: photo.url, alt: photo.alt || '', caption: photo.caption || '', hidden: Boolean(photo.hidden),
    })),
    revision: record.revision,
    updatedAt: record.updatedAt?.toISOString() || '',
    ...(record.legacy ? { legacy: true } : {}),
  }
}

export function albumFilter(id: string) {
  if (id === 'archive') return { legacy: true }
  if (!objectIdPattern.test(id)) throw new RequestError(400, 'Adresa albumului este invalidă.')
  return { _id: id }
}

async function importLegacyAlbum() {
  await connectDB()
  const { id: _id, updatedAt: _updatedAt, ...archive } = LEGACY_ALBUM
  void _id
  void _updatedAt
  const now = new Date()
  try {
    await AlbumModel.updateOne({ legacy: true }, {
      $setOnInsert: { ...archive, removed: false, createdBy: 'archive', updatedBy: 'archive', createdAt: now, updatedAt: now },
    }, { upsert: true, runValidators: true, timestamps: false })
  } catch (error) {
    // The unique legacy index also protects simultaneous first visits.
    if ((error as { code?: number }).code !== 11000) throw error
  }
}

export async function getAdminAlbums(): Promise<GalleryAlbum[]> {
  await importLegacyAlbum()
  const records = await AlbumModel.find({ removed: { $ne: true } }).select(albumFields)
    .sort({ editionYear: -1, createdAt: -1 }).lean() as unknown as AlbumRecord[]
  return records.map(record => serializeAlbum(record))
}

export async function getAdminAlbum(id: string): Promise<GalleryAlbum | null> {
  const filter = albumFilter(id)
  if (id === 'archive') await importLegacyAlbum()
  else await connectDB()
  const record = await AlbumModel.findOne({ ...filter, removed: { $ne: true } }).select(albumFields).lean() as AlbumRecord | null
  return record ? serializeAlbum(record) : null
}

export async function getPublishedAlbums(): Promise<GalleryAlbum[]> {
  await connectDB()
  // Read visibility and legacy existence together so first import cannot add
  // or suppress the archive between two separate queries.
  const records = await AlbumModel.find({ $or: [{ status: 'published', removed: { $ne: true } }, { legacy: true }] })
    .select(`${albumFields} removed`).sort({ editionYear: -1, createdAt: -1 }).lean() as unknown as AlbumRecord[]
  const albums = records.filter(record => record.status === 'published' && !record.removed).map(record => serializeAlbum(record, true))
  if (!records.some(record => record.legacy)) albums.push({ ...LEGACY_ALBUM, photos: LEGACY_ALBUM.photos.map(photo => ({ ...photo })) })
  return albums
}

export async function getPublishedAlbum(id: string): Promise<GalleryAlbum | null> {
  if (id !== 'archive' && !objectIdPattern.test(id)) return null
  await connectDB()
  const record = await AlbumModel.findOne(albumFilter(id)).select(`${albumFields} removed`).lean() as AlbumRecord | null
  if (record) return record.status === 'published' && !record.removed ? serializeAlbum(record, true) : null
  return id === 'archive' ? { ...LEGACY_ALBUM, photos: LEGACY_ALBUM.photos.map(photo => ({ ...photo })) } : null
}

function text(value: unknown, field: string, maximum: number, required = false): string {
  if (typeof value !== 'string') throw new RequestError(400, `${field}: text invalid.`)
  const result = value.trim()
  if ((required && !result) || result.length > maximum) {
    throw new RequestError(400, `${field}: ${required ? 'completează câmpul și folosește' : 'folosește'} cel mult ${maximum} de caractere.`)
  }
  return result
}

export function parseAlbumInput(raw: unknown, creating = false): AlbumInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new RequestError(400, 'Datele albumului sunt invalide.')
  const input = raw as Record<string, unknown>
  const title = text(input.title, 'Titlu', 120, true)
  const description = text(input.description ?? '', 'Descriere', 1000)
  const editionYear = input.editionYear ?? null
  if (editionYear !== null && (typeof editionYear !== 'number' || !Number.isInteger(editionYear) || editionYear < 1900 || editionYear > 2100)) {
    throw new RequestError(400, 'Anul ediției trebuie să fie între 1900 și 2100.')
  }
  if (creating) return { title, description, editionYear, status: 'draft', coverImage: '', photos: [] }
  if (input.status !== 'draft' && input.status !== 'published') throw new RequestError(400, 'Starea albumului este invalidă.')
  if (!Array.isArray(input.photos) || input.photos.length > 200) throw new RequestError(400, 'Un album poate conține cel mult 200 de fotografii.')
  const urls = new Set<string>()
  const photos: GalleryPhoto[] = input.photos.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError(400, 'Fotografie invalidă.')
    const photo = value as Record<string, unknown>
    const url = text(photo.url, 'Adresă fotografie', 100)
    const uploadedId = uploadedPhotoPattern.exec(url)?.[1]
    if (!oldPhotoPattern.test(url) && !uploadedId) throw new RequestError(400, 'Folosește o fotografie încărcată în biblioteca site-ului.')
    const normalizedUrl = uploadedId ? `/api/project-images/${uploadedId.toLowerCase()}` : url
    if (urls.has(normalizedUrl)) throw new RequestError(400, 'O fotografie poate apărea o singură dată în album.')
    urls.add(normalizedUrl)
    if (typeof photo.hidden !== 'boolean') throw new RequestError(400, 'Vizibilitatea fotografiei este invalidă.')
    return { url: normalizedUrl, alt: text(photo.alt ?? '', 'Descriere accesibilă', 240), caption: text(photo.caption ?? '', 'Legendă fotografie', 500), hidden: photo.hidden }
  })
  const rawCover = text(input.coverImage ?? '', 'Copertă', 100)
  const coverId = uploadedPhotoPattern.exec(rawCover)?.[1]
  const coverImage = coverId ? `/api/project-images/${coverId.toLowerCase()}` : rawCover
  const visible = photos.filter(photo => !photo.hidden)
  if (coverImage && !visible.some(photo => photo.url === coverImage)) throw new RequestError(400, 'Alege coperta dintre fotografiile vizibile din album.')
  if (input.status === 'published' && (!visible.length || !coverImage)) throw new RequestError(400, 'Adaugă cel puțin o fotografie vizibilă și alege coperta înainte de publicare.')
  return { title, description, editionYear, status: input.status, coverImage, photos }
}

export function parseRevision(raw: unknown): number {
  const revision = raw && typeof raw === 'object' ? (raw as Record<string, unknown>).revision : undefined
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) throw new RequestError(400, 'Versiunea albumului este invalidă. Reîncarcă pagina.')
  return revision
}

async function verifyUploadedPhotos(photos: GalleryPhoto[]) {
  const ids = photos.map(photo => uploadedPhotoPattern.exec(photo.url)?.[1]).filter((id): id is string => Boolean(id))
  if (!ids.length) return
  const records = await ProjectImage.find({ _id: { $in: ids } }).select('_id').lean() as { _id: { toString(): string } }[]
  if (records.length !== ids.length) throw new RequestError(400, 'Una dintre fotografii nu mai există. Alege din nou din bibliotecă.')
}

export async function createAlbum(raw: unknown, author: string): Promise<GalleryAlbum> {
  const input = parseAlbumInput(raw, true)
  await connectDB()
  const record = await AlbumModel.create({ ...input, createdBy: author, updatedBy: author })
  return serializeAlbum(record as AlbumRecord)
}

export async function updateAlbum(id: string, raw: unknown, author: string): Promise<GalleryAlbum> {
  const filter = albumFilter(id)
  const input = parseAlbumInput(raw)
  const revision = parseRevision(raw)
  await connectDB()
  await verifyUploadedPhotos(input.photos)
  const record = await AlbumModel.findOneAndUpdate({ ...filter, removed: { $ne: true }, revision }, {
    $set: { ...input, updatedBy: author }, $inc: { revision: 1 },
  }, { new: true, runValidators: true }).select(albumFields).lean() as AlbumRecord | null
  if (record) return serializeAlbum(record)
  if (!await AlbumModel.exists({ ...filter, removed: { $ne: true } })) throw new RequestError(404, 'Albumul nu mai există.')
  throw new RequestError(409, 'Albumul a fost modificat între timp. Reîncarcă pagina înainte de a salva din nou.')
}

export async function removeAlbum(id: string, author: string) {
  const filter = albumFilter(id)
  if (id === 'archive') await importLegacyAlbum()
  else await connectDB()
  const record = await AlbumModel.findOneAndUpdate({ ...filter, removed: { $ne: true } }, {
    $set: { removed: true, updatedBy: author }, $inc: { revision: 1 },
  })
  if (!record) throw new RequestError(404, 'Albumul nu mai există.')
}
