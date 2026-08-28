import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
])

// Defense in depth: unauthenticated /api/admin/* dies here with a JSON 401
// (auth.protect() would 307-redirect to the sign-in page, which is the wrong
// shape for fetch callers). Role checks stay in the handlers - middleware
// runs on Edge and cannot read Mongo roles.
const isProtectedApiRoute = createRouteMatcher([
  '/api/admin(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/(.*)',
  '/api/payments/webhook(.*)', // Exclude webhook from auth
  '/api/payments/webhook-test(.*)', // Exclude test webhook from auth
  '/qr/(.*)', // QR code routes should be public
])

export default clerkMiddleware(async (auth, req) => {
  // Skip auth for public routes (including webhooks)
  if (isPublicRoute(req)) {
    return
  }

  if (isProtectedApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
