import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import { Payment } from '@/models'
import { PaymentAttempt } from '@/models/PaymentAttempt'
import PaymentStatusRefresh from '@/components/payments/PaymentStatusRefresh'
import PaymentResult from '@/components/payments/PaymentResult'
import PaymentShell from '@/components/payments/PaymentShell'

type SearchParams = Promise<{ payment_intent?: string | string[] }>

export default async function PaymentSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const value = (await searchParams).payment_intent
  const paymentIntentId = typeof value === 'string' && /^pi_[a-zA-Z0-9]+$/.test(value) ? value : null
  let state: 'complete' | 'pending' | 'unverified' = 'unverified'

  if (paymentIntentId) {
    await connectDB()
    const payment = await Payment.findOne({
      clerkId: userId,
      stripePaymentIntentId: paymentIntentId,
      status: 'completed',
      fulfillmentComplete: true,
    }).select('_id').lean()
    if (payment) state = 'complete'
    else {
      const attempt = await PaymentAttempt.findOne({
        clerkId: userId,
        stripePaymentIntentId: paymentIntentId,
        status: 'pending',
      }).select('_id').lean()
      if (attempt) state = 'pending'
    }
  }

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
          detail="Îl poți deschide oricând din secțiunea „Biletele mele”."
          actions={[{ href: '/dashboard/tickets', label: 'Vezi biletele mele' }]}
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
