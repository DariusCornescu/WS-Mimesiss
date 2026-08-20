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

    Copy `.env.local.example` to `.env.local` and fill in your Clerk and MongoDB credentials:
    ```bash
    cp .env.local.example .env.local
    ```

    Update the following variables in `.env.local`:
    ```
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
    MONGODB_URI=your_mongodb_connection_string
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**

    Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

*   `npm run dev`: Start development server with Turbopack.
*   `npm run build`: Build for production.
*   `npm run start`: Start production server.
*   `npm run lint`: Run ESLint.

# Development Conventions

*   **Styling:** The project uses Tailwind CSS for styling.
*   **Authentication:** Authentication is handled by Clerk.
*   **Database:** The project uses MongoDB as the database.
*   **Linting:** ESLint is used for linting.
*   **Code Formatting:** Biome is used for code formatting.
