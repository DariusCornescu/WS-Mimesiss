# Mimesiss

**Workshop and event platform: registration, payments and QR check-in in one app.** Attendees sign up for workshops and pay online, each gets a personal QR code, and staff scan it at the door to confirm attendance. Organisers run everything from an admin dashboard. The interface is in Romanian.

## What it does

**For attendees**
- Sign up, browse workshops and register, within participant limits and registration windows.
- Pay online with Stripe.
- Get a personal QR code to show at the event, and see registration history.

**For moderators**
- Scan attendee QR codes from a phone to confirm attendance, with timestamps.
- Fall back to manual ticket-number entry on browsers without QR scanning support.

**For admins**
- Create and edit workshops and conferences, and control which are public.
- Manage users, roles, payments and tickets.
- See attendance for every registration and generate workshop reports.
- Turn registration and payments on or off for the whole site from a settings panel.

## How it's built

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk, with admin / moderator / user roles stored in the database and checked on the server |
| Database | MongoDB with Mongoose |
| Payments | Stripe, with webhook handling |
| QR codes | `qrcode` to generate, the browser `BarcodeDetector` API to scan |
| Hosting and CI | Vercel; GitHub Actions runs lint, typecheck and a production build against a MongoDB service |

A few design choices:

- **Server-side permission checks**: roles live in MongoDB rather than only in the auth provider, and every protected action re-checks them on the server.
- **Settings-driven behaviour**: event mode, payments, global registration and workshop visibility are switches in the database, so organisers can change them without a deploy.
- **Scannable QR codes**: the QR colour is chosen for contrast on white, because the UI brand blue was too light to scan reliably.
- **Graceful fallback**: where `BarcodeDetector` isn't available (Safari, Firefox), the scanner switches to manual lookup.

## Run it

You need Node.js 22+, a MongoDB database, a Clerk account, and a Stripe account for payments.

```bash
npm install
# create .env.local with the variables below
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk authentication |
| `MONGODB_URI`, `MONGODB_DB_NAME` | MongoDB connection and database name |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `NEXT_PUBLIC_BASE_URL` | App URL, used to build Stripe return URLs |

For a local database: `docker run -d --name mimesiss-mongo -p 27017:27017 mongo:7`. Stripe setup is described in [STRIPE_SETUP.md](STRIPE_SETUP.md).

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## License

MIT.
