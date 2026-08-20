import mongoose, { Schema, Document } from 'mongoose'

export interface IAppSettings extends Document {
  _id: string
  // Event mode: switches what the payment page and user dashboard show
  eventMode: 'workshops' | 'ball'
  // Global workshop settings
  globalRegistrationEnabled: boolean
  paymentsEnabled?: boolean
  workshopVisibleToPublic?: boolean

  allowCancelRegistration: boolean
  registrationStartTime?: Date // When registrations will open
  registrationDeadline?: Date // When registrations will close
  
  // Workshop defaults
  defaultMaxParticipants: number

  // Ball (gala) ticket settings
  ballTicketAvailableFrom?: Date  // When ball tickets go on sale
  ballTicketAvailableTo?: Date    // When ball tickets stop being sold
  ballMaxTicketsPerUser: number   // Max quantity a single user can buy
  
  createdAt: Date
  updatedAt: Date
}

const AppSettingsSchema = new Schema<IAppSettings>({
  // Global workshop settings
  globalRegistrationEnabled: {
    type: Boolean,
    default: true,
    required: true
  },
  paymentsEnabled: {
    type: Boolean,
    default: false,
    required: true
  },
  workshopVisibleToPublic: {
    type: Boolean,
    default: false,
    required: true
  },
  allowCancelRegistration: {
    type: Boolean,
    default: true,
    required: true
  },
  registrationStartTime: {
    type: Date,
    required: false
  },
  registrationDeadline: {
    type: Date,
    required: false
  },
  
  // Workshop defaults
  defaultMaxParticipants: {
    type: Number,
    default: 20,
    min: 1,
    max: 1000,
    required: true
  },

  // Ball (gala) ticket settings
  eventMode: {
    type: String,
    enum: ['workshops', 'ball'],
    default: 'workshops',
    required: true
  },
  ballTicketAvailableFrom: {
    type: Date,
    required: false
  },
  ballTicketAvailableTo: {
    type: Date,
    required: false
  },
  ballMaxTicketsPerUser: {
    type: Number,
    default: 2,
    min: 1,
    max: 50,
    required: true
  }
}, {
  timestamps: true
})

// Ensure only one settings document exists by adding a virtual constraint
// We'll handle this in the application logic instead of database constraints

const AppSettings = mongoose.models.AppSettings || mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema)

export default AppSettings
