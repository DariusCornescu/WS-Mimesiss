import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Acest flux de plată nu mai este disponibil. Reîncarcă pagina și folosește formularul de plată.' }, { status: 410 })
}
