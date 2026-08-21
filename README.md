# Lapshark — E-Commerce Platform

A full React e-commerce platform with a customer-facing storefront and an admin dashboard.

## Run locally

Prerequisites: Node.js

1. Install dependencies: `npm install`
2. Set the required environment variables in `.env.local` (see `.env.development.local` for what's needed)
3. Run the app: `npm run dev`

## Structure

- `app/` — Next.js App Router pages (storefront + `app/admin/` dashboard)
- `components/` — shared UI components
- `context/` — auth, cart, and user-feature state
- `api/` — API client
