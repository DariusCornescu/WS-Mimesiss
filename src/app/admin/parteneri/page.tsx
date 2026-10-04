import PartnerManager from '@/components/admin/PartnerManager'
import { requireRoleOrRedirect } from '@/lib/auth'
import { getPartners } from '@/lib/partners'

export const metadata = { title: 'Parteneri și sponsori — Administrare' }

export default async function PartnersPage() {
  await requireRoleOrRedirect('admin')
  return <PartnerManager partners={await getPartners()} />
}
