import mongoose, { Schema } from 'mongoose'
import type { Document } from 'mongoose'
import type { UserRole, UserType } from '@/types/models'

// User interface
export interface IUser extends Document {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  userType: UserType
}

// Workshop interface
export interface IWorkshop extends Document {
  title: string
  description: string
  date: Date
  time: string
  location: string
  maxParticipants: number
  currentParticipants: number
  wsType: 'workshop' | 'conferinta'
  instructor: string
  status: 'active' | 'cancelled' | 'completed'
  url?: string;
}

// Registration interface
export interface IRegistration extends Document {
  userId: string // Clerk user ID
  workshopId: string // Workshop ID
  attendance: {
    confirmed: boolean
    confirmedAt?: Date
    confirmedBy?: string // Admin user ID who confirmed
  }
}

export interface ITicket extends Document {
  title: string // Ticket title
  type: string
  price: number // Ticket price in RON
  features: string[] // List of features
  description?: string // Optional detailed description
  enabled: boolean // Whether the ticket is available for purchase
  category: 'workshop' | 'ball' // Type of event this ticket belongs to
}

// User schema
const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true }, // unique: true creates an index
  email: { type: String, required: true, unique: true }, // unique: true creates an index
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  userType: { type: String, enum: ['student', 'elev', 'rezident'], default: 'student' },
}, {
  timestamps: true
})

// Add indexes for performance (clerkId and email already indexed via unique: true)
UserSchema.index({ role: 1 })

// Workshop schema
const WorkshopSchema = new Schema<IWorkshop>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: false },
  time: { type: String, required: false },
  location: { type: String, required: false },
  maxParticipants: { type: Number, required: true, min: 1 },
  currentParticipants: { type: Number, default: 0, min: 0 },
  instructor: { type: String, required: false },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  wsType: { type: String, enum: ['workshop', 'conferinta'], default: 'workshop' },
  url: { type: String, required: false },
}, {
  timestamps: true
})

// Add indexes for common queries
WorkshopSchema.index({ status: 1, date: 1 })
WorkshopSchema.index({ wsType: 1 })
WorkshopSchema.index({ date: 1 })
WorkshopSchema.index({ status: 1 })

// Registration schema
const RegistrationSchema = new Schema<IRegistration>({
  userId: { type: String, required: true },
  workshopId: { type: String, required: true },
  attendance: {
    confirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date },
    confirmedBy: { type: String }, // Admin user ID who confirmed
  }
}, {
  timestamps: true
})

// Create compound index to prevent duplicate registrations
RegistrationSchema.index({ userId: 1, workshopId: 1 }, { unique: true })
// Add individual indexes for common queries
RegistrationSchema.index({ userId: 1 })
RegistrationSchema.index({ workshopId: 1 })
// Index for attendance queries
RegistrationSchema.index({ 'attendance.confirmed': 1 })

// Payment interface
export interface IPayment extends Document {
  clerkId: string
  stripeSessionId: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  ticketId?: string
  ticketType?: string
  ticketCategory?: 'workshop' | 'ball'
  quantity: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  metadata?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

// Payment schema
const PaymentSchema = new Schema<IPayment>({
  clerkId: { type: String, required: true, index: true },
  stripeSessionId: { type: String, required: true, unique: true },
  stripePaymentIntentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'ron' },
  ticketId: { type: String, index: true },
  ticketType: { type: String, index: true },
  ticketCategory: { type: String, enum: ['workshop', 'ball'], index: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
})

// Add compound index for common queries
PaymentSchema.index({ clerkId: 1, status: 1 })
PaymentSchema.index({ clerkId: 1, ticketType: 1 })

const TicketSchema = new Schema<ITicket>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  features: { type: [String], required: true },
  type: { type: String, required: true },
  enabled: { type: Boolean, required: true, default: true },
  category: { type: String, enum: ['workshop', 'ball'], default: 'workshop', required: true },
}, {
  timestamps: true
})

// Counter (for auto-incrementing sequences)
interface ICounter extends Document {
  _id: string
  seq: number
}
const CounterSchema = new Schema<ICounter>({ _id: { type: String }, seq: { type: Number, default: 0 } })
export const Counter = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema)

// IssuedTicket — one document per physical ticket issued to a user
export interface IIssuedTicket extends Document {
  ticketNumber: number        // globally unique sequential number (1, 2, 3…)
  clerkId: string             // owner
  paymentId: string           // Payment._id reference
  ticketTypeId: string        // Ticket._id reference (the product)
  ticketTitle: string         // denormalized for display
  ticketType: string          // e.g. "bal"
  category: 'workshop' | 'ball'
  status: 'active' | 'used' | 'cancelled'
  pricePerTicket: number      // amount paid per ticket in smallest currency unit
  currency: string
  createdAt: Date
  updatedAt: Date
}
const IssuedTicketSchema = new Schema<IIssuedTicket>({
  ticketNumber: { type: Number, required: true, unique: true },
  clerkId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, index: true },
  ticketTypeId: { type: String, required: true },
  ticketTitle: { type: String, required: true },
  ticketType: { type: String, required: true },
  category: { type: String, enum: ['workshop', 'ball'], required: true },
  status: { type: String, enum: ['active', 'used', 'cancelled'], default: 'active' },
  pricePerTicket: { type: Number, required: true },
  currency: { type: String, required: true, default: 'RON' },
}, { timestamps: true })
IssuedTicketSchema.index({ clerkId: 1, category: 1 })

if (mongoose.models.IssuedTicket) delete mongoose.models.IssuedTicket
export const IssuedTicket = mongoose.model<IIssuedTicket>('IssuedTicket', IssuedTicketSchema)


export const Workshop = mongoose.models.Workshop || mongoose.model<IWorkshop>('Workshop', WorkshopSchema)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const Registration = mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema)

// Payment and Ticket had fields added (ticketCategory/quantity and category).
// Force re-registration so the updated schema is always used.
if (mongoose.models.Payment) delete mongoose.models.Payment
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema)

if (mongoose.models.Ticket) delete mongoose.models.Ticket
export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema)

// Import and export AppSettings separately
import AppSettings from './AppSettings'
export { AppSettings }
export type { IAppSettings } from './AppSettings'
