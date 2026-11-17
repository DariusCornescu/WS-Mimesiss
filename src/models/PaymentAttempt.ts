import mongoose, { Schema } from 'mongoose'

export interface PaymentAttemptRecord {
  _id: mongoose.Types.ObjectId
  clerkId: string
  ticketId: string
  ticketType: string
  ticketTitle: string
  category: 'ball' | 'workshop'
  quantity: number
  amount: number
  email: string
  status: 'pending' | 'completed' | 'cancelled'
  stripePaymentIntentId?: string
  /** Add-on bought in the same payment; `amount` above is the total. */
  addOnTicketId?: string
  addOnTicketType?: string
  addOnTicketTitle?: string
  addOnAmount?: number
  /** Name from the profile, sent to Stripe as the billing name so every payment shows it. */
  buyerName?: string
  createdAt: Date
}
const schema = new Schema<PaymentAttemptRecord>({
  clerkId: { type: String, required: true, index: true },
  ticketId: { type: String, required: true },
  ticketType: { type: String, required: true },
  ticketTitle: { type: String, required: true },
  category: { type: String, enum: ['ball', 'workshop'], required: true },
  quantity: { type: Number, min: 1, max: 50, required: true },
  amount: { type: Number, min: 1, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], required: true },
  stripePaymentIntentId: String,
  addOnTicketId: String,
  addOnTicketType: String,
  addOnTicketTitle: String,
  addOnAmount: { type: Number, min: 1 },
  buyerName: { type: String, maxlength: 201 },
}, { timestamps: true })
schema.index({ clerkId: 1, status: 1 })
// Stock count and stale-hold lookup per ticket
schema.index({ ticketId: 1, status: 1, createdAt: 1 })
schema.index({ addOnTicketId: 1, status: 1, createdAt: 1 })
export const PaymentAttempt = mongoose.models.PaymentAttempt || mongoose.model<PaymentAttemptRecord>('PaymentAttempt', schema)
