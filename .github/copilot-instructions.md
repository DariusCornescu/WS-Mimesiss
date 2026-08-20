# Mimesiss - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js workshop application called Mimesiss with the following key features and conventions:

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Icons**: Lucide React

## Project Structure
- Use the `src/` directory structure
- App Router with `src/app/` for pages and layouts
- Components in `src/components/`
- Utilities and lib functions in `src/lib/`
- Database types and schemas in `src/types/`

## Authentication & Authorization
- Implement role-based access control (admin/user)
- Use Supabase Row Level Security (RLS)
- Protect admin routes with middleware
- Use server components for data fetching when possible

## Code Style
- Use TypeScript strictly with proper typing
- Follow Next.js 15 best practices
- Use Tailwind CSS utility classes
- Implement proper error handling
- Use Server Actions for form submissions
- Implement proper loading states and error boundaries

## Key Features to Implement
1. User authentication (sign up, sign in, sign out)
2. Admin dashboard for managing workshops and users
3. User account pages for profile management
4. Workshop registration and management
5. Role-based access control
