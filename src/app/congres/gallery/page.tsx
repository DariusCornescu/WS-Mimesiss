import HeaderContent from '@/components/ui/HeaderContent'
import Reveal from '@/components/asociatie/Reveal'

export default function InfoPage() {
	return (
		<>
			<HeaderContent kicker='Congres · Galerie' title='Galerie foto MIMESISS 2025' />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen flex flex-col justify-center items-center">
				<Reveal>
					<p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Reveniți aici pentru pozele din această ediție</p>
				</Reveal>
			</div>
		</>
	)
}
