'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { AuthError, requireRole } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { ProjectStoryContent } from '@/models/ProjectStoryContent'
import { tentStoryTag } from '@/lib/project-story-content'
import { readTentCopy, tentSceneKeys, TentCopyValidationError, type TentStoryCopy } from '@/lib/tent-story-copy'

export type TentSaveState = { success: boolean; error?: string; message?: string; savedCopy?: TentStoryCopy }
export async function saveTentStoryCopy(_previous: TentSaveState, form: FormData): Promise<TentSaveState> {
  let copy: TentStoryCopy
  try {
    const user = await requireRole('admin')
    copy = readTentCopy(form)
    await connectDB()
    await ProjectStoryContent.findOneAndUpdate({ slug: 'cortul-imm' }, {
      $set: { sections: tentSceneKeys.map(key => ({ key, ...copy[key] })), updatedBy: user.clerkId },
    }, { upsert: true, runValidators: true })
  } catch (error) {
    if (error instanceof AuthError) return { success: false, error: error.message }
    if (error instanceof TentCopyValidationError) return { success: false, error: error.message }
    console.error('Tent story content save failed', error)
    return { success: false, error: 'Textele nu au putut fi salvate. Încearcă din nou.' }
  }
  updateTag(tentStoryTag)
  revalidatePath('/proiecte/cortul-imm')
  revalidatePath('/admin/proiecte/cortul-imm')
  return { success: true, savedCopy: copy, message: 'Textele au fost salvate și sunt vizibile pe pagina Cortului IMM.' }
}
