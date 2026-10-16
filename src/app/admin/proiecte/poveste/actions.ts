'use server'

import { updateTag, revalidatePath } from 'next/cache'
import { AuthError, requireRole } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { ProjectStoryContent } from '@/models/ProjectStoryContent'
import { isEditableStorySlug, readProjectCopy, editableStoryKeys, type ProjectStoryCopy } from '@/lib/project-story-copy'
import { projectStoryTag } from '@/lib/editable-project-content'
import { TentCopyValidationError } from '@/lib/tent-story-copy'

export type StorySaveState = { success: boolean; error?: string; message?: string; savedCopy?: ProjectStoryCopy }
export async function saveProjectStoryCopy(slug: string, _previous: StorySaveState, form: FormData): Promise<StorySaveState> {
  let copy: ProjectStoryCopy
  try {
    const user = await requireRole('admin')
    if (!isEditableStorySlug(slug)) return { success: false, error: 'Proiect negăsit.' }
    copy = readProjectCopy(slug, form)
    await connectDB()
    await ProjectStoryContent.findOneAndUpdate({ slug }, {
      $set: { sections: editableStoryKeys[slug].map(key => ({ key, ...copy[key] })), updatedBy: user.clerkId },
    }, { upsert: true, runValidators: true })
  } catch (error) {
    if (error instanceof AuthError || error instanceof TentCopyValidationError) return { success: false, error: error.message }
    console.error('Project story content save failed', error)
    return { success: false, error: 'Textele nu au putut fi salvate. Încearcă din nou.' }
  }
  updateTag(projectStoryTag(slug))
  revalidatePath('/proiecte/' + slug)
  revalidatePath('/admin/proiecte/poveste/' + slug)
  return { success: true, savedCopy: copy, message: 'Textele au fost salvate și sunt vizibile pe pagina proiectului.' }
}
