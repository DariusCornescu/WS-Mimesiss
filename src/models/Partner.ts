import mongoose, { Schema } from 'mongoose'

const schema = new Schema({
  name: { type: String, default: '', maxlength: 160 },
  logo: { type: String, required: true },
  category: { type: String, enum: ['institutional', 'sponsor'], required: true },
  visible: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true })

schema.index({ visible: 1, category: 1, order: 1, _id: 1 })
export const PartnerModel = mongoose.models.Partner || mongoose.model('Partner', schema)
