import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { parseWith, paymentIntentInput } from '@/lib/validation'
import { reservePayment, intentForAttempt } from '@/lib/payment-attempts'
import { requireSameOrigin, limitRequests, readSmallJson, requestErrorResponse, RequestError } from '@/lib/request-security'

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const user = await currentUser()
    if (!user) throw new RequestError(401, 'Conectează-te pentru a continua.')
    await limitRequests(user.id, 'payment-create')
    const parsed = parseWith(paymentIntentInput, await readSmallJson(request))
    if (!parsed.ok) throw new RequestError(400, parsed.error)
    const attempt = await reservePayment(user.id, parsed.data.ticketId, parsed.data.quantity)
    const intent = await intentForAttempt(attempt)
    if (['succeeded', 'processing', 'canceled'].includes(intent.status)) throw new RequestError(409, 'Plata a fost deja procesată. Actualizează pagina pentru starea biletelor.')
    return NextResponse.json({ clientSecret: intent.client_secret }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const response = requestErrorResponse(error)
    if (response) return response
    console.error('Payment initialization failed')
    return NextResponse.json({ error: 'Nu am putut inițializa plata. Încearcă din nou.' }, { status: 500 })
  }
}
