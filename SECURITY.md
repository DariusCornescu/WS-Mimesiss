# Security Best Practices

## Supabase Row Level Security

This document outlines the security approach used in the Mimesiss application to protect data while allowing appropriate access.

## Principles

1. **Least Privilege**: Each client only gets the minimum access required
2. **Defense in Depth**: Multiple layers of protection
3. **Separation of Concerns**: Admin and user operations are handled separately
4. **API-driven Admin Operations**: Admin operations use server-side API routes

## RLS Policies Overview

### Public Access (No Login Required)
- Workshop listings can be viewed by anyone
- Workshop capacity/registration counts are public
- Instructor names are public

### User Access (Login Required)
- Users can see and update their own profile
- Users can view and manage their own workshop registrations
- Users can't modify other users' data

### Admin Access
- Admins use specialized API routes with service role key
- Admin status is verified before allowing privileged operations
- Admin operations are logged and auditable

## Safe vs. Unsafe Approaches

### ❌ Unsafe: Using Admin Client in Public Pages
```typescript
// AVOID THIS PATTERN
const adminSupabase = await createAdminClient()
const { data: workshops } = await adminSupabase.from('workshops').select('*')
```

Problems with this approach:
- Service role key bypasses ALL security
- Any bug could expose unintended data
- Violates principle of least privilege

### ✅ Safe: Proper RLS Policies
```typescript
// BETTER APPROACH
const supabase = await createClient() // Regular client
const { data: workshops } = await supabase.from('workshops').select('*')
```

Benefits of this approach:
- Only exposes data allowed by RLS policies
- Enforces security at the database level
- Works even if there are application bugs

## Implementing RLS Policies

Run the `fix-rls-public.sql` script to set up safe RLS policies that allow:
- Public viewing of workshops
- Viewing instructor information
- Showing registration counts
- Users managing their own registrations

## Admin Operations

For admin operations, use the pattern in `/api/admin/workshops/route.ts`:
1. Authenticate the user
2. Verify admin status
3. Use service role for the operation
4. Return only necessary data

This keeps the service role isolated to admin API routes while maintaining security.
