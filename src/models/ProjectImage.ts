import mongoose, { Schema } from 'mongoose'

const schema = new Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  createdBy: { type: String, required: true },
  name: { type: String, default: 'Fotografie', maxlength: 140 },
  sha256: { type: String },
}, { timestamps: true })

schema.index({ sha256: 1 }, { unique: true, partialFilterExpression: { sha256: { $type: 'string' } } })

export const ProjectImage = mongoose.models.ProjectImage || mongoose.model('ProjectImage', schema)
