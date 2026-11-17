import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import { Payment } from '@/models'
import { PaymentAttempt } from '@/models/PaymentAttempt'
import PaymentStatusRefresh from '@/components/payments/PaymentStatusRefresh'
import PaymentResult from '@/components/payments/PaymentResult'
import PaymentShell from '@/components/payments/PaymentShell'
import { getAppSettings } from '@/lib/settings'
import { workshopChoiceOpen } from '@/lib/workshop-choice'

type SearchParams = Promise<{ payment_intent?: string | string[] }>

export default async function PaymentSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const value = (await searchParams).payment_intent
  const paymentIntentId = typeof value === 'string' && /^pi_[a-zA-Z0-9]+$/.test(value) ? value : null
  let state: 'complete' | 'pending' | 'unverified' = 'unverified'
  let workshopTicket = false
  let withAddOn = false

  if (paymentIntentId) {
    await connectDB()
    const payment = await Payment.findOne({
      clerkId: userId,
      stripePaymentIntentId: paymentIntentId,
      // The add-on record shares the payment intent; the ticket is the other one.
      stripeSessionId: { $ne: paymentIntentId + ':addon' },
      status: 'completed',
      fulfillmentComplete: true,
    }).select('_id ticketCategory').lean()
    if (payment) {
      state = 'complete'
      workshopTicket = payment.ticketCategory !== 'ball'
      withAddOn = Boolean(await Payment.exists({ clerkId: userId, stripeSessionId: paymentIntentId + ':addon', status: 'completed' }))
    }
    else {
      const attempt = await PaymentAttempt.findOne({
        clerkId: userId,
        stripePaymentIntentId: paymentIntentId,
        status: 'pending',
      }).select('_id').lean()
      if (attempt) state = 'pending'
    }
  }

  const choiceOpen = workshopTicket && workshopChoiceOpen(await getAppSettings())
  const workshopNote = !workshopTicket
    ? 'Îl poți deschide oricând din secțiunea „Biletele mele”.'
    : (withAddOn ? 'Ai inclus și un workshop în plus, deci vei putea alege 3 workshopuri. ' : '')
      + (choiceOpen
        ? 'Îți poți alege workshopurile acum.'
        : 'Vei putea alege workshopurile în curând. Te anunțăm când se deschide alegerea.')

  return (
    <PaymentShell
      eyebrow="ASMM · STAREA PLĂȚII"
      title="Confirmarea biletului"
      description="Verificăm plata și îți arătăm imediat starea biletului asociat contului tău."
    >
      {state === 'complete' ? (
        <PaymentResult
          variant="success"
          title="Biletul tău este pregătit"
          description="Plata a fost confirmată, iar biletul a fost emis în contul tău."
          detail={workshopNote}
          actions={choiceOpen
            ? [{ href: '/congres/workshops', label: 'Alege workshopurile' }, { href: '/dashboard/tickets', label: 'Vezi biletele mele', variant: 'secondary' }]
            : [{ href: '/dashboard/tickets', label: 'Vezi biletele mele' }]}
        />
      ) : state === 'pending' ? (
        <PaymentResult
          variant="pending"
          title="Plata este în curs de verificare"
          description="Biletul nu este emis încă. Așteptăm confirmarea procesatorului de plată."
          detail="Nu începe o a doua plată. Poți verifica din nou această stare sau poți vedea dacă biletul a apărut deja în cont."
          extraAction={<PaymentStatusRefresh />}
          actions={[
            { href: '/dashboard/tickets', label: 'Verifică biletele mele' },
            { href: '/payment', label: 'Înapoi la selecția biletelor', variant: 'secondary' },
          ]}
        />
      ) : (
        <PaymentResult
          variant="unverified"
          title="Plata nu a putut fi confirmată"
          description="Nu am găsit o plată finalizată pentru acest cont."
          detail="Verifică biletele existente sau revino la selecție înainte de a încerca din nou."
          actions={[
            { href: '/dashboard/tickets', label: 'Verifică biletele mele' },
            { href: '/payment', label: 'Înapoi la selecția biletelor', variant: 'secondary' },
          ]}
        />
      )}
    </PaymentShell>
  )
}
