import HeaderContent from '@/components/ui/HeaderContent'
import EventGallery from '@/components/asociatie/EventGallery'
export const metadata = { title: 'Galerie foto' }
export default function Page() { return <><HeaderContent title="Oameni. Experiențe. Amintiri." kicker="MIMESISS · Galerie" /><div className="public-page"><p className="public-intro">Momente din activitățile MIMESISS: de la primele manevre practice la întâlnirile care ne aduc împreună.</p><EventGallery /></div></> }
