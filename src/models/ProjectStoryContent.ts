import mongoose, { Schema } from 'mongoose'
import { editableStoryKeys } from '@/lib/project-story-copy'
import { tentSceneKeys, tentCopyLimits } from '@/lib/tent-story-copy'

const section = new Schema({
  key: { type: String, required: true, enum: [...tentSceneKeys, ...editableStoryKeys.mimesiss, ...editableStoryKeys['balul-bobocilor']] },
  title: { type: String, default: '', maxlength: tentCopyLimits.title },
  body: { type: String, default: '', maxlength: tentCopyLimits.body },
}, { _id: false })
const schema = new Schema({
  slug: { type: String, required: true, enum: ['cortul-imm', 'mimesiss', 'balul-bobocilor'], unique: true },
  sections: { type: [section], default: [] },
  updatedBy: { type: String, required: true },
}, { timestamps: true })
export const ProjectStoryContent = mongoose.models.ProjectStoryContent || mongoose.model('ProjectStoryContent', schema)
