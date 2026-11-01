import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cancelPendingPayment } from '@/lib/payment-attempts'
import { requireSameOrigin, limitRequests, requestErrorResponse, RequestError } from '@/lib/request-security'

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const user = await currentUser()
    if (!user) throw new RequestError(401, 'Conectează-te pentru a continua.')
    await limitRequests(user.id, 'payment-cancel')
    await cancelPendingPayment(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return requestErrorResponse(error) || NextResponse.json({ error: 'Nu am putut anula plata. Încearcă din nou.' }, { status: 500 })
  }
}
