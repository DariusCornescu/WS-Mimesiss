import { notFound } from 'next/navigation'
import ProjectForm from '@/components/admin/ProjectForm'
import type { ProjectFormState } from '@/app/admin/proiecte/actions'
import AccountLayout from '@/components/dashboard/AccountLayout'

async function previewAction(): Promise<ProjectFormState> { 'use server'; return { error: 'Această previzualizare nu salvează date pe site.' } }
export default function ArticleCheck() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <AccountLayout user={{ email: 'editor@example.invalid', firstName: 'Editor', lastName: 'ASMM', role: 'admin' }}><ProjectForm action={previewAction} submitLabel="Salvează postarea" project={{ _id: '0123456789abcdef01234568', slug: 'mimesiss-2025', title: 'MIMESISS · Învățăm împreună', summary: 'Experiențe practice și oameni care dau sens medicinei militare.', description: 'Trei zile de conferințe și workshopuri.\n\nO comunitate care se construiește prin implicare.', kind: 'standard', status: 'draft', coverImage: '/old/3.jpeg', coverPositionX: 50, coverPositionY: 50, order: 1 }} /></AccountLayout>
}
