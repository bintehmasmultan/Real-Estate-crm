# EstateCRM — Real Estate CRM

Production-ready real estate CRM built with Next.js (App Router), TypeScript, **Firebase Auth**, **Firestore**, Tailwind CSS, Recharts, and drag-and-drop pipelines.

## Features

- Auth with roles: **Admin**, **Manager**, **Agent** (scoped data access)
- Dashboard metrics, activity feed, pipeline chart, upcoming tasks
- Contacts with preferences, tags, and activity timeline
- Properties / listings with photos (URL), owner, and related deals
- Leads (CRM + public `/lead` capture) with convert → Contact + Deal
- Sales & Rentals Kanban pipelines (`@hello-pangea/dnd`)
- Tasks, calendar view, and basic reports

## Firebase project

This repo targets Firebase project **`estate-crm-web`** with:

- **Authentication** — Email/password sign-in
- **Firestore** — CRM data (`users`, `contacts`, `properties`, `leads`, `deals`, etc.)

## Quick start

1. Create or open project [estate-crm-web](https://console.firebase.google.com/) and enable **Email/Password** auth and **Firestore**.
2. Copy `.env.example` to `.env.local` and fill in web + admin credentials.
3. Install and seed:

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Service account (server / seed)

In Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**:

- Set `FIREBASE_CLIENT_EMAIL` to the service account email
- Set `FIREBASE_PRIVATE_KEY` to the private key (keep `\n` escapes in `.env.local`)

The seed script uses `firebase-admin` with these variables to create demo users and sample CRM data.

### Demo logins

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | `admin@crm.local`   | `password123` |
| Manager | `manager@crm.local` | `password123` |
| Agent   | `agent@crm.local`   | `password123` |
| Agent   | `agent2@crm.local`  | `password123` |

Public lead form: [http://localhost:3000/lead](http://localhost:3000/lead)

## Environment

See `.env.example` for:

- `NEXT_PUBLIC_FIREBASE_*` — client SDK (from Firebase web app config)
- `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` — Admin SDK for session cookies, server reads, and seeding

## Scripts

- `npm run dev` — local development
- `npm run build` / `npm start` — production
- `npm run db:seed` — reset Firestore demo data + Auth users (`scripts/seed-firebase.ts`)

## Stack notes

- Firestore for all CRM entities; dates stored as ISO strings; tags/photos as `string[]`
- Server Actions for mutations; Server Components for reads
- Session via Firebase session cookie (`estate_session`)
- Dark mode via `next-themes`
