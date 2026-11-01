import { notFound } from 'next/navigation'
import AccountLayout from '@/components/dashboard/AccountLayout'
import PartnerManager from '@/components/admin/PartnerManager'

export const metadata = { title: 'Previzualizare administrare parteneri', robots: { index: false, follow: false } }

export default function PartnersCheck() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <AccountLayout user={{ email: 'editor@example.invalid', firstName: 'Editor', lastName: 'ASMM', role: 'admin' }}>
    <PartnerManager partners={[
      { id: '0123456789abcdef01234567', name: 'Partener demonstrativ', logo: '/orgs/2.png', category: 'institutional', visible: false, order: 1 },
      { id: '0123456789abcdef01234568', name: '', logo: '/orgs/4.png', category: 'sponsor', visible: false, order: 2 },
    ]} />
  </AccountLayout>
}
