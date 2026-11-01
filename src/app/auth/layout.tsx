import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cont ASMM',
  description: 'Autentificare pentru evenimente, înscrieri și bilete ASMM.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
