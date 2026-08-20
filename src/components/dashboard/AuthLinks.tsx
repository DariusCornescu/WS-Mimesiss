// components/layout/AuthLinks.tsx (REVISED)
'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	FaSignOutAlt,
	FaUser,
	FaUserPlus
} from 'react-icons/fa'

interface AuthLinksProps {
	variant: 'desktop' | 'mobile'
	isMobileMenuOpen?: boolean
	onLinkClick?: () => void
}

/**
 * Renders a skeleton placeholder to prevent layout shift while auth state is loading.
 */
function AuthSkeleton({ variant }: { variant: 'desktop' | 'mobile' }) {
	if (variant === 'desktop') {
		return (
			<div className="hidden lg:flex items-center space-x-4 animate-pulse">
				<div className="h-5 w-20 bg-muted rounded"></div>
				<div className="h-10 w-24 bg-muted rounded-md"></div>
			</div>
		)
	}

	// Mobile skeleton
	return (
		<>
			{/* Profile Section Skeleton */}
			<div className="p-6 border-b border-border animate-pulse">
				<div className="flex items-center space-x-3">
					<div className="flex-shrink-0">
						<div className="w-10 h-10 bg-muted rounded-full"></div>
					</div>
					<div className="flex-1 min-w-0 space-y-2">
						<div className="h-4 w-3/4 bg-muted rounded"></div>
						<div className="h-3 w-1/2 bg-muted rounded"></div>
					</div>
				</div>
			</div>
			{/* Links Skeleton (at bottom) */}
			<div className="p-6 border-t border-border/50 space-y-2 animate-pulse">
				<div className="h-10 w-full bg-muted rounded-md"></div>
				<div className="h-10 w-full bg-muted rounded-md"></div>
			</div>
		</>
	)
}


export default function AuthLinks({ variant, isMobileMenuOpen, onLinkClick }: AuthLinksProps) {
	const { user, isLoaded } = useUser()
	const { signOut } = useClerk()
	const router = useRouter()

	const handleSignOut = async () => {
		if (onLinkClick) {
			onLinkClick()
		}
		await signOut()
		router.push('/')
	}

	// Render skeleton placeholder to avoid CLS
	if (!isLoaded) {
		return <AuthSkeleton variant={variant} />
	}

	// --- DESKTOP ---
	if (variant === 'desktop') {
		return user ? (
			// Desktop Logged In
			<div className="hidden lg:flex items-center space-x-4">
				<Link
					href="/dashboard"
					className="flex items-center space-x-2 text-foreground hover:text-foreground/80 transition-colors"
				>
					<FaUser className="h-4 w-4" />
					<span>Contul meu</span>
				</Link>
				<button
					type="button"
					onClick={handleSignOut}
					className="flex items-center space-x-2 text-destructive hover:text-destructive/80 transition-colors"
				>
					<FaSignOutAlt className="h-4 w-4" />
					<span>Deconectare</span>
				</button>
			</div>
		) : (
			// Desktop Logged Out
			<div className="hidden lg:flex items-center space-x-4">
				<Link
					href="/auth/login"
					className="text-foreground hover:text-foreground/80 transition-colors"
				>
					Conectare
				</Link>
				<Link
					href="/auth/signup"
					className="mimesiss-btn-primary p-2 text-base"
				>
					Înregistrare
				</Link>
			</div>
		)
	}

	// --- MOBILE ---
	if (variant === 'mobile') {
		return user ? (
			// Mobile Logged In
			<>
				{/* User Profile Section */}
				<div className={`p-6 border-b border-border transform transition-all duration-300 ease-in-out delay-100 ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
					}`}>
					<div className="flex items-center space-x-3">
						<div className="flex-shrink-0">
							<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
								<FaUser className="h-5 w-5 text-primary" />
							</div>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-foreground truncate">
								{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.emailAddresses?.[0]?.emailAddress}
							</p>
							<p className="text-xs text-muted-foreground">
								{user?.publicMetadata?.role === 'admin' ? 'Administrator' : 'Utilizator'}
							</p>
						</div>
					</div>
				</div>

				{/* Sign Out Button & Dashboard Link */}
				<div className={`p-6 border-t border-border/50 space-y-2 transform transition-all duration-200 ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
					}`}
					style={{ transitionDelay: isMobileMenuOpen ? '650ms' : '0ms' }}
				>
					<Link
						href="/dashboard"
						onClick={onLinkClick}
						className="flex items-center w-full px-3 py-2 rounded-md text-foreground hover:bg-accent/50 transition-colors duration-200"
					>
						<FaUser className="h-4 w-4 mr-3" />
						Contul meu
					</Link>
					<button
						type='button'
						onClick={handleSignOut}
						className="flex items-center w-full px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors duration-200"
					>
						<FaSignOutAlt className="h-4 w-4 mr-3" />
						Deconectare
					</button>
				</div>
			</>
		) : (
			// Mobile Logged Out
			<>
				{/* Guest user actions */}
				<div className={`p-6 border-t border-border/50 space-y-2 transform transition-all duration-200 ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
					}`}
					style={{ transitionDelay: isMobileMenuOpen ? '600ms' : '0ms' }}
				>
					<Link
						href="/auth/login"
						onClick={onLinkClick}
						className="flex items-center px-3 py-2 rounded-md text-foreground hover:bg-accent/50 transition-colors duration-200"
					>
						<FaUser className="h-4 w-4 mr-3" />
						Conectare
					</Link>

					<Link
						href="/auth/signup"
						onClick={onLinkClick}
						className="flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
					>
						<FaUserPlus className="h-4 w-4 mr-3" />
						Înregistrare
					</Link>
				</div>
			</>
		)
	}

	return null
}