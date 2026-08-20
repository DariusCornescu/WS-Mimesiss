import Image from "next/image";
export default function PersonCard({
	name,
	role,
	imageUrl,
	className
}: {
	name: string;
	role: string;
	imageUrl: string;
	className?: string;
}) {
	return (
		<div className={`flex flex-col items-center text-center ${className}`}>
			<div className="relative overflow-hidden group">
				<Image
					src={imageUrl}
					alt={name}
					className="w-full h-full object-cover border-4 border-primary transition-transform duration-200 group-hover:scale-105"
					width={1000}
					height={1000}
				/>

				{/* Overlay: transparent -> primary color, shows name & role on hover */}
				<div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/80" />
					<div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-white">
						<h3 className="text-lg font-semibold drop-shadow-sm">{name}</h3>
						<p className="text-sm drop-shadow-sm">{role}</p>
					</div>
				</div>
			</div>

			<h3 className="text-lg font-semibold text-foreground hidden">{name}</h3>
			<p className="text-sm text-muted-foreground hidden">{role}</p>
		</div>
	);
}	