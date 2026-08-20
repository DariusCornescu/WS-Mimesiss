# Project Overview

This is a modern workshop management application built with Next.js, TypeScript, Tailwind CSS, Clerk, and MongoDB.

## Key Features

*   **User Authentication:** Secure login/signup with Clerk.
*   **Admin Dashboard:** A comprehensive admin panel for managing workshops and users.
*   **User Account Management:** Personal dashboard and profile management.
*   **Workshop Management:** Create, view, and register for workshops.
*   **Role-based Access Control:** Admin and user roles with proper permissions.
*   **Responsive Design:** Works on all devices.

# Building and Running

## Prerequisites

*   Node.js 18+
*   A Clerk account and project
*   A MongoDB database

## Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd workshop
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**

    Copy `.env.example` to `.env.local` and fill in your credentials:
    ```bash
    cp .env.example .env.local
    ```

    See `.env.example` for the full list. Auth pages live at `/auth/login` and
    `/auth/signup`, so no Clerk URL overrides are needed.

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**

    Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

*   `npm run dev`: Start development server with Turbopack.
*   `npm run build`: Build for production (webpack).
*   `npm run start`: Start production server.
*   `npm run lint`: Run ESLint.
*   `npm run typecheck`: Run `tsc --noEmit`.

# Development Conventions

*   **Styling:** Tailwind CSS. Colour tokens resolve to the CSS variables in
    `src/app/globals.css`; use semantic tokens rather than raw hex.
*   **Authentication:** Clerk, with roles stored on the Mongo user document.
*   **Database:** MongoDB via Mongoose.
*   **Payments:** Stripe. See `STRIPE_SETUP.md`.
*   **Linting:** ESLint flat config. There is no separate formatter.
