import type { NextConfig } from "next";
import path from 'node:path';

const diagnostic = process.env.PERFORMANCE_DIAGNOSTIC;
if (diagnostic && !['base', 'analytics', 'scene', 'full'].includes(diagnostic)) throw new Error('Unknown performance diagnostic');
if (diagnostic && process.env.VERCEL_ENV === 'production') throw new Error('Performance diagnostics cannot run in production');

const nextConfig: NextConfig = {
	distDir: diagnostic ? `.preview/build-${diagnostic}` : '.next',
	webpack(config, { webpack }) {
		if (diagnostic === 'base' || diagnostic === 'scene') {
			const fixture = path.resolve('scripts/fixtures/no-analytics.ts');
			config.plugins.push(new webpack.NormalModuleReplacementPlugin(/(?:components\/analytics\/GoogleAnalytics$|^@vercel\/(?:analytics\/react|speed-insights\/next)$)/, fixture));
		}
		if (diagnostic === 'base' || diagnostic === 'analytics') {
			config.plugins.push(new webpack.NormalModuleReplacementPlugin(/\/lib\/neural-space$/, path.resolve('scripts/fixtures/no-neural-space.ts')));
		}
		return config;
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'img.clerk.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'images.clerk.dev',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'www.gravatar.com',
				port: '',
				pathname: '/**',
			},
		],
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 60,
		deviceSizes: [640, 750, 828, 1080, 1200],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		qualities: [30, 40, 50, 60, 75, 85],
	},
	productionBrowserSourceMaps: false,
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
	// Turbopack configuration (Next.js 16 uses Turbopack by default)
	turbopack: {},
	experimental: {
		optimizePackageImports: ['react-icons'],
	},

	// Rutele congresului au trecut sub /congres cand site-ul a devenit al
	// asociatiei. Link-urile vechi sunt deja in postari de Instagram si in
	// materiale tiparite, deci raman valide permanent.
	async redirects() {
		return [
			{ source: '/program', destination: '/congres/program', permanent: true },
			{ source: '/workshops/:path*', destination: '/congres/workshops/:path*', permanent: true },
			{ source: '/workshops', destination: '/congres/workshops', permanent: true },
			{ source: '/reg', destination: '/congres/reg', permanent: true },
			{ source: '/ghid', destination: '/congres/ghid', permanent: true },
			{ source: '/info', destination: '/congres/info', permanent: true },
			{ source: '/editii', destination: '/congres/editii', permanent: true },
			{ source: '/gallery', destination: '/congres/gallery', permanent: true },
			// /about era deja pagina asociatiei (conducerea ASMM), doar prost numita.
			{ source: '/about', destination: '/despre', permanent: true },
		]
	},
};

export default nextConfig;
