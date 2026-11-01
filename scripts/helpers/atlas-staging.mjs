const HOST = 'asmm-staging.ug3jfvy.mongodb.net'
const USER = 'asmm_staging_app'
const DATABASE = 'asmm_staging'

export function atlasStagingUri(configured) {
  if (configured.MONGODB_URI && configured.ATLAS_STAGING_PASSWORD) {
    throw new Error('Folosește MONGODB_URI sau ATLAS_STAGING_PASSWORD, nu ambele.')
  }

  const uri = configured.MONGODB_URI || (configured.ATLAS_STAGING_PASSWORD
    ? `mongodb+srv://${USER}:${encodeURIComponent(configured.ATLAS_STAGING_PASSWORD)}@${HOST}/${DATABASE}?authSource=admin&retryWrites=true&w=majority`
    : '')
  if (!uri) throw new Error('Lipsește parola sau adresa bazei Atlas Staging.')

  let parsed
  try { parsed = new URL(uri) }
  catch { throw new Error('Adresa bazei Atlas Staging nu este validă.') }
  if (parsed.protocol !== 'mongodb+srv:' || parsed.hostname !== HOST ||
      decodeURIComponent(parsed.username) !== USER || parsed.pathname !== `/${DATABASE}`) {
    throw new Error('Conexiunea trebuie să folosească exclusiv utilizatorul și clusterul ASMM Staging.')
  }
  return uri
}
