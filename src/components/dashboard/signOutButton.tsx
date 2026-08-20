'use client'

import { useClerk } from '@clerk/nextjs'
import { FaSignOutAlt } from 'react-icons/fa'

export default function SignOutButton() {
	const { signOut } = useClerk()

	const handleSignOut = async () => {
		try {
			await signOut()
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<button
			onClick={handleSignOut}
			className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
			type='button'
		>
			<FaSignOutAlt className="h-4 w-4" />
			<span className="ml-2 hidden sm:inline">Ieșire</span>
		</button>
	)
}