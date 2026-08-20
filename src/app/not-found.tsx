import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
	<main className="min-h-screen flex flex-col items-center gap-8 justify-center bg-gradient-to-br from-background via-background/95 to-background p-4">
		<Link href="/">
			<Image src="/icons/asmm.png" alt="MIMESISS 2025" width={300} height={200} priority />
		</Link>
		<h1 className="text-4xl font-bold">Pagina nu a fost găsită</h1>
		<p className="text-lg text-muted-foreground">Ne pare rău, dar pagina pe care o căutați nu există.</p>

		<Link href="/" className="text-lg text-muted-foreground hover:underline"> &larr; Înapoi la pagina principală</Link>
	</main>
  );
}