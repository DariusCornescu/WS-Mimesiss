import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autentificare - Mimesiss',
  description: 'Platformă de management a workshopurilor',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
