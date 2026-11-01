import { describe, expect, it } from 'vitest'
import { isPublicPath } from '@/lib/public-routes'

describe('isPublicPath', () => {
  it.each(['/', '/despre', '/contact', '/proiecte', '/proiecte/un-proiect', '/congres', '/congres/program'])(
    'treats %s as a public surface',
    path => expect(isPublicPath(path)).toBe(true)
  )

  it.each(['/dashboard', '/admin', '/auth/login', '/despre-noi', '/congresx', '/contactare', ''])(
    'does not treat %s as a public surface',
    path => expect(isPublicPath(path)).toBe(false)
  )
})
