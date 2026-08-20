import BreadCrumbs from "@/components/ui/BreadCrumbs";

interface HeaderContentProps {
	title?: string;
	}

	export default function HeaderContent({ title }: HeaderContentProps) {
		return (
			<header
				className="relative gap-6 bg-cover bg-center bg-no-repeat header-div py-8 "
			>
				<div className="max-w-6xl mx-auto px-4 lg:px-0 flex flex-col gap-4">
					<BreadCrumbs items={[{ label: title || "Pagina" }]} />

					<h1 className="mimesiss-title">{title || "Pagina"}</h1>
				</div>
			</header>
		);
	}
