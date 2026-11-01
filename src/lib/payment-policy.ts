import type { AppSettingsPlain } from '@/lib/settings'
import { RequestError } from '@/lib/request-security'

export function purchasePolicy(ticket: { enabled: boolean; category: string; price: number }, quantity: number, settings: AppSettingsPlain, purchased: number, now = Date.now()) {
  if (!settings.paymentsEnabled || !ticket.enabled) throw new RequestError(403, 'Plățile pentru acest bilet nu sunt disponibile.')
  const ball = ticket.category === 'ball'
  if ((ball ? 'ball' : 'workshops') !== settings.eventMode) throw new RequestError(403, 'Acest bilet nu este disponibil pentru evenimentul curent.')
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 50) throw new RequestError(400, 'Cantitate invalidă.')
  if (ball) {
    if ((settings.ballTicketAvailableFrom && now < Date.parse(settings.ballTicketAvailableFrom)) ||
        (settings.ballTicketAvailableTo && now >= Date.parse(settings.ballTicketAvailableTo))) {
      throw new RequestError(403, 'Vânzarea biletelor nu este deschisă.')
    }
    if (purchased + quantity > settings.ballMaxTicketsPerUser) throw new RequestError(409, 'Ai atins limita de bilete per persoană.')
  } else if (quantity !== 1 || purchased > 0) {
    throw new RequestError(409, 'Poți cumpăra un singur bilet de acest tip.')
  }
  const amount = Math.round(ticket.price * 100) * quantity
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 99999999) throw new RequestError(400, 'Preț invalid.')
  return amount
}
