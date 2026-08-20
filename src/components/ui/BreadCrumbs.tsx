import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";

interface Crumb {
	label: string;
	href?: string;
}

export default function BreadCrumbs({ items = [] }: { items?: Crumb[] }) {
	return (
		<nav className="flex" aria-label="Breadcrumb">
			<ol className="inline-flex items-center">
				<li className="inline-flex items-center">
					<Link
						href="/"
						className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary underline"
					>
						Acasa
					</Link>
				</li>
				{items.map((item) => (
					<li key={item.label} className="inline-flex items-center">
						<HiChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
						{item.href ? (
							<Link
								href={item.href}
								className="text-sm font-medium text-foreground hover:text-primary"
							>
								{item.label}
							</Link>
						) : (
							<span className="text-sm font-medium text-muted-foreground">
								{item.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
