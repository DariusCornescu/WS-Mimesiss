import type { AppSettingsPlain } from '@/lib/settings'
import { RequestError } from '@/lib/request-security'

type OfferSettings = Pick<AppSettingsPlain, 'offerTicketId' | 'offerStartsAt' | 'offerEndsAt'>

/**
 * A limited offer replaces the workshop tickets for its window: while it
 * runs only the offer ticket is sold, and outside the window the offer
 * ticket is not sold at all. An offer without both ends is ignored.
 */
export function limitedOffer(settings: OfferSettings, now = Date.now()) {
  const { offerTicketId, offerStartsAt, offerEndsAt } = settings
  if (!offerTicketId || !offerStartsAt || !offerEndsAt) return null
  const startsAt = Date.parse(offerStartsAt)
  const endsAt = Date.parse(offerEndsAt)
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) return null
  return { ticketId: offerTicketId, endsAt: offerEndsAt, active: now >= startsAt && now < endsAt }
}

/** Whether a workshop ticket may be sold right now, given the limited offer. */
export function offerAllows(ticketId: string, settings: OfferSettings, now = Date.now()) {
  const offer = limitedOffer(settings, now)
  if (!offer) return true
  return offer.active ? ticketId === offer.ticketId : ticketId !== offer.ticketId
}

export function purchasePolicy(ticket: { _id?: unknown; enabled: boolean; category: string; price: number }, quantity: number, settings: AppSettingsPlain, purchased: number, now = Date.now()) {
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
  } else {
    if (settings.ticketSalesStartTime && now < Date.parse(settings.ticketSalesStartTime)) {
      throw new RequestError(403, 'Vânzarea biletelor nu este deschisă.')
    }
    if (!offerAllows(String(ticket._id ?? ''), settings, now)) {
      throw new RequestError(409, limitedOffer(settings, now)?.active
        ? 'Acum se vinde doar biletul din oferta limitată. Reîncarcă pagina.'
        : 'Oferta limitată nu este disponibilă acum. Reîncarcă pagina.', 'offer_window')
    }
    if (quantity !== 1 || purchased > 0) throw new RequestError(409, 'Poți cumpăra un singur bilet de acest tip.')
  }
  const amount = Math.round(ticket.price * 100) * quantity
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 99999999) throw new RequestError(400, 'Preț invalid.')
  return amount
}
