import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { saveProfile } from '@/lib/profile'
import { registrationProfile } from '@/lib/registration-profile'
import { limitRequests, readSmallJson, requestErrorResponse } from '@/lib/request-security'

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Cerere nepermisă.' }, { status: 403 })
  }
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Conectează-te pentru a continua.' }, { status: 401 })
    await limitRequests(user.id, 'profile-save')
    const profile = registrationProfile(await readSmallJson(request))
    if (!profile) return NextResponse.json({ error: 'Completează numele și alege un profil valid.' }, { status: 400 })
    if (user.primaryEmailAddress?.verification?.status !== 'verified') {
      return NextResponse.json({ error: 'Verifică adresa de email înainte de a continua.' }, { status: 403 })
    }
    await saveProfile(user, profile)
    return NextResponse.json({ success: true })
  } catch (error) {
    const response = requestErrorResponse(error)
    if (response) return response
    console.error('Profile completion failed')
    return NextResponse.json({ error: 'Nu am putut salva profilul. Încearcă din nou.' }, { status: 500 })
  }
}
