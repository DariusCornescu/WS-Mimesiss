import mongoose, { Schema } from 'mongoose'

const photoSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
  hidden: { type: Boolean, default: false },
}, { _id: false })

const schema = new Schema({
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 1000 },
  editionYear: { type: Number, default: null },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  coverImage: { type: String, default: '' },
  photos: { type: [photoSchema], default: [] },
  revision: { type: Number, default: 0 },
  legacy: { type: Boolean, default: false },
  removed: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true },
}, { timestamps: true })

schema.index({ legacy: 1 }, { unique: true, partialFilterExpression: { legacy: true } })
schema.index({ removed: 1, status: 1, editionYear: -1, createdAt: -1 })

export const GalleryAlbum = mongoose.models.GalleryAlbum || mongoose.model('GalleryAlbum', schema)
