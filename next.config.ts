import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
		optimizePackageImports: ['react-icons', 'lucide-react'],
	},
};

export default nextConfig;
