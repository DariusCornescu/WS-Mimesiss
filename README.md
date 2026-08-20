# Mimesiss

A modern workshop and event management platform built with Next.js 15, TypeScript, Tailwind CSS, MongoDB, and Clerk authentication. Features Stripe payment integration, QR code attendance tracking, and role-based access control.

## Features

### 🔐 Authentication & Users
- **Clerk Authentication** - Secure login/signup with Clerk
- **Role-based Access Control** - Admin, Moderator, and User roles with proper permissions
- **User Types** - Support for students, pupils (elev), and residents

### 📅 Workshop Management
- **Workshop Creation** - Create workshops and conferences with full details
- **Registration System** - Users can register for workshops with participant limits
- **Configurable Settings** - Global registration enable/disable, registration windows, and deadlines
- **Public/Private Visibility** - Control workshop visibility to public

### 💳 Payment Integration
- **Stripe Payments** - Integrated payment processing with Stripe
- **Payment Management** - Admin panel for viewing and managing payments
- **Toggleable Payments** - Enable/disable payments system-wide

### 📱 QR Code & Attendance
- **User QR Codes** - Each user gets a unique QR code for attendance
- **QR Scanner** - Moderators can scan QR codes to confirm attendance
- **Attendance Tracking** - Track who attended which workshop with timestamps
- **Manual Entry** - Fallback option for manual attendance confirmation

### 👨‍💼 Admin Dashboard
- **User Management** - View and manage all users
- **Workshop Management** - Create, edit, delete workshops
- **Attendance Overview** - View attendance status for all registrations
- **Settings Management** - Configure global app settings
- **Reports & Analytics** - Generate workshop reports
- **Tickets Management** - Admin ticket system

### 👤 User Dashboard
- **Personal QR Code** - View and download personal QR code
- **Registration History** - View all workshop registrations
- **Profile Management** - Update personal information

### 🎫 Moderator Features
- **QR Code Scanner** - Scan attendee QR codes
- **Attendance Confirmation** - Confirm user attendance at events
- **Mobile-friendly Scanner** - Works on mobile devices

### 📱 Additional Features
- **Responsive Design** - Works on all devices
- **Countdown Timer** - Event countdown on homepage
- **Gallery** - Photo gallery section
- **Program Schedule** - Event program page
- **Contact Page** - Contact information
- **Multi-language Support** - Romanian language UI

## Tech Stack

- **Framework**: Next.js 15 with App Router & Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: MongoDB with Mongoose
- **Payments**: Stripe
- **QR Codes**: qrcode & html5-qrcode
- **Icons**: React Icons
- **Analytics**: Vercel Analytics & Speed Insights
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel (workshops, users, payments, settings, attendance, tickets)
│   ├── auth/              # Authentication pages (login, signup, forgot-password)
│   ├── dashboard/         # User dashboard (profile, registrations, moderator)
│   ├── payment/           # Payment pages (checkout, success, cancel)
│   ├── workshops/         # Workshop listings and details
│   ├── api/               # API routes
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── gallery/           # Photo gallery
│   ├── program/           # Event program
│   └── qr/                # QR code display pages
├── components/            # Reusable React components
│   ├── admin/             # Admin-specific components
│   ├── dashboard/         # Dashboard components
│   ├── payments/          # Payment components
│   └── ui/                # UI components
├── lib/                   # Utility functions and configurations
├── models/                # Mongoose models
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database
- A Clerk account
- A Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with the following variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## User Roles

| Role | Permissions |
|------|-------------|
| **User** | View workshops, register for workshops, manage profile, view personal QR code |
| **Moderator** | All user permissions + scan QR codes, confirm attendance |
| **Admin** | All permissions + manage users, workshops, payments, settings |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `MONGODB_URI` | MongoDB connection string |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NEXT_PUBLIC_APP_URL` | Application URL |

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT License.

