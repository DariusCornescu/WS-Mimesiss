import BreadCrumbs from "@/components/ui/BreadCrumbs";

interface HeaderContentProps {
	title?: string;
	/** Etichetă mono deasupra titlului, în limbajul vizual al asociației. */
	kicker?: string;
	breadcrumbLabel?: string;
	titleClassName?: string;
}

export default function HeaderContent({ title, kicker, breadcrumbLabel, titleClassName }: HeaderContentProps) {
	return (
		<header
			className="relative gap-6 bg-cover bg-center bg-no-repeat header-div py-8 "
		>
			<div className="max-w-6xl mx-auto px-4 lg:px-0 flex flex-col gap-4">
				<BreadCrumbs items={[{ label: breadcrumbLabel || title || "Pagina" }]} />

				<div>
					{kicker && (
						<p
							className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
						>
							{kicker}
						</p>
					)}
					<h1 className={`mimesiss-title mt-2 ${titleClassName ?? ''}`}>
						{title || "Pagina"}
					</h1>
					<div
						className="mt-3 h-px w-24 bg-gradient-to-r from-primary to-secondary"
					/>
				</div>
			</div>
		</header>
	);
}
