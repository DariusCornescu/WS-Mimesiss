import { z } from 'zod'

export const objectId = z
  .string({ message: 'Identificator invalid' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Identificator invalid')

/**
 * safeParse with a friendly, first-issue-only message — every caller either
 * returns it as an action error or a 400 body instead of throwing.
 */
export function parseWith<S extends z.ZodType>(
  schema: S,
  data: unknown
): { ok: true; data: z.infer<S> } | { ok: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { ok: true, data: result.data }
  }
  return { ok: false, error: result.error.issues[0]?.message ?? 'Date invalide' }
}

// --- input schemas -------------------------------------------------------

export const registrationInput = z.object({
  workshopId: objectId,
  action: z.enum(['register', 'cancel'], { message: 'Acțiune invalidă' }),
})

const ticketFields = {
  title: z.string({ message: 'Titlul este obligatoriu' }).trim().min(1, 'Titlul este obligatoriu').max(200, 'Titlul este prea lung'),
  description: z.string({ message: 'Descrierea este obligatorie' }).trim().min(1, 'Descrierea este obligatorie').max(2000, 'Descrierea este prea lungă'),
  price: z.number({ message: 'Prețul trebuie să fie un număr' }).finite('Prețul trebuie să fie un număr').min(0, 'Prețul nu poate fi negativ'),
  features: z.array(z.string().trim().min(1).max(300), { message: 'Lista de beneficii este invalidă' }).max(30, 'Prea multe beneficii'),
  type: z.string({ message: 'Tipul este obligatoriu' }).trim().min(1, 'Tipul este obligatoriu').max(50, 'Tipul este prea lung'),
  enabled: z.boolean().optional(),
  category: z.enum(['workshop', 'ball'], { message: 'Categorie invalidă' }).optional(),
}

export const ticketCreateInput = z.object(ticketFields)
export const ticketUpdateInput = z.object(ticketFields).partial()

/** Whitelist for POST /api/admin/payments — only these fields reach the model. */
export const manualPaymentInput = z.object({
  clerkId: z.string({ message: 'clerkId este obligatoriu' }).trim().min(1, 'clerkId este obligatoriu').max(128),
  ticketId: objectId,
  amount: z.number({ message: 'Suma trebuie să fie un număr întreg de bani' }).int('Suma trebuie să fie un număr întreg de bani').positive('Suma trebuie să fie pozitivă'),
  currency: z.string().trim().min(3).max(8).default('RON'),
  status: z.enum(['pending', 'completed']).default('completed'),
  stripeSessionId: z.string().trim().min(1).max(255).optional(),
  stripePaymentIntentId: z.string().trim().max(255).optional(),
  ticketType: z.string().trim().max(50).optional(),
  ticketCategory: z.enum(['workshop', 'ball']).optional(),
  quantity: z.number().int().min(1).max(50).default(1),
})

export const paymentIntentInput = z.object({
  ticketId: objectId,
  quantity: z.coerce.number({ message: 'Cantitate invalidă' }).int('Cantitate invalidă').min(1, 'Cantitate invalidă').max(50, 'Cantitate prea mare').default(1),
})

export const checkoutInput = z.object({
  ticketId: objectId,
})

export const settingsInput = z.object({
  globalRegistrationEnabled: z.boolean(),
  paymentsEnabled: z.boolean(),
  workshopVisibleToPublic: z.boolean(),
  allowCancelRegistration: z.boolean(),
  registrationStartTime: z.date().optional(),
  registrationDeadline: z.date().optional(),
  defaultMaxParticipants: z.number({ message: 'Număr invalid de participanți' }).int('Număr invalid de participanți').min(1, 'Minim 1 participant').max(1000, 'Maxim 1000 de participanți'),
  eventMode: z.enum(['workshops', 'ball'], { message: 'Mod de eveniment invalid' }),
  ballMaxTicketsPerUser: z.number().int().min(1, 'Minim 1 bilet').max(50, 'Maxim 50 de bilete'),
  ballTicketAvailableFrom: z.date().optional(),
  ballTicketAvailableTo: z.date().optional(),
})

export const workshopInput = z.object({
  title: z.string({ message: 'Titlul este obligatoriu' }).trim().min(1, 'Titlul este obligatoriu').max(200, 'Titlul este prea lung'),
  description: z.string({ message: 'Descrierea este obligatorie' }).trim().min(1, 'Descrierea este obligatorie').max(5000, 'Descrierea este prea lungă'),
  maxParticipants: z.number({ message: 'Numărul maxim de participanți este invalid' }).int('Numărul maxim de participanți este invalid').min(1, 'Numărul maxim de participanți este invalid').max(1000, 'Maxim 1000 de participanți'),
  wsType: z.enum(['workshop', 'conferinta']).catch('workshop'),
  url: z.string().trim().max(500, 'Linkul este prea lung').optional(),
})

export const userRoleInput = z.object({
  userId: z.string({ message: 'ID utilizator invalid.' }).trim().min(1, 'ID utilizator invalid.').max(128),
  role: z.enum(['user', 'moderator', 'admin'], { message: 'Rol invalid.' }),
  userType: z.union([z.literal(''), z.enum(['student', 'elev', 'rezident'])], { message: 'Tip utilizator invalid.' }).optional(),
})

export const attendancePatchInput = z.object({
  registrationId: objectId,
  confirmed: z.boolean({ message: 'Valoare invalidă pentru prezență' }),
})

export const issuedTicketStatusInput = z.object({
  ticketId: objectId,
  status: z.enum(['active', 'used', 'cancelled'], { message: 'Status invalid' }),
})
