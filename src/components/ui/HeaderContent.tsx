import BreadCrumbs from "@/components/ui/BreadCrumbs";

interface HeaderContentProps {
	title?: string;
	/** Etichetă mono deasupra titlului, în limbajul vizual al asociației. */
	kicker?: string;
}

export default function HeaderContent({ title, kicker }: HeaderContentProps) {
	return (
		<header
			className="relative gap-6 bg-cover bg-center bg-no-repeat header-div py-8 "
		>
			<div className="max-w-6xl mx-auto px-4 lg:px-0 flex flex-col gap-4">
				<BreadCrumbs items={[{ label: title || "Pagina" }]} />

				{/* Animație de încărcare (nu de scroll): headerul e mereu above the
				    fold, iar clasele asmm-* nu aduc niciun JS de client. */}
				<div>
					{kicker && (
						<p
							className="asmm-rise font-mono text-xs uppercase tracking-[0.3em] text-primary"
							style={{ animationDelay: '60ms' }}
						>
							{kicker}
						</p>
					)}
					<h1 className="asmm-rise mimesiss-title mt-2" style={{ animationDelay: '140ms' }}>
						{title || "Pagina"}
					</h1>
					<div
						className="asmm-draw mt-3 h-px w-24 bg-gradient-to-r from-primary to-secondary"
						style={{ animationDelay: '280ms' }}
					/>
				</div>
			</div>
		</header>
	);
}
