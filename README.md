# EstateCRM — Real Estate CRM

Production-ready real estate CRM built with Next.js (App Router), TypeScript, **Firebase Auth**, **Firestore**, Tailwind CSS, Recharts, and drag-and-drop pipelines.

## Features

- Auth with roles: **Admin**, **Manager**, **Agent** (scoped data access)
- Dashboard metrics, activity feed, pipeline chart, upcoming tasks
- Contacts with preferences, tags, and activity timeline
- Properties / listings with photos (URL), owner, and related deals
- Leads (CRM + public `/lead` capture) with convert → Contact + Deal
- Sales & Rentals Kanban pipelines (`@hello-pangea/dnd`)
- Tasks, month calendar (tasks, viewings, meetings), and reports (conversion, sales and rentals, agent results)

## Firebase project

This repo targets Firebase project **`bintehmasmultan-crm`** with:

- **Authentication** — Email/password sign-in
- **Firestore** — CRM data (`users`, `contacts`, `properties`, `leads`, `deals`, etc.)

## Quick start

1. Open project [bintehmasmultan-crm](https://console.firebase.google.com/project/bintehmasmultan-crm) and enable **Email/Password** auth. Firestore is already in `asia-south1`.
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

The seed script refuses to run when `NODE_ENV`, `VERCEL_ENV`, or `FIREBASE_ENV` is `production`, or when `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is listed in `PRODUCTION_FIREBASE_PROJECT_IDS`. Override that guard only on purpose with `ALLOW_PROD_SEED=true`.

## Access control

Public `/signup` creates a Firebase Auth user and a Firestore profile with role **`PENDING`**. Pending users can sign in, but they cannot open the CRM until an admin assigns **Admin**, **Manager**, or **Agent** on **Team access** (`/admin/users`). The session endpoint never accepts a role from the client, and a missing profile is treated as pending rather than agent. Seeded demo users keep the roles in the table above.

## Server Firebase Admin on Vercel

`firebase-admin` 14 loads `jwks-rsa`, which `require()`s `jose`. jose 6 is ESM-only, and Vercel’s external module loader throws `ERR_REQUIRE_ESM` while loading `firebase-admin/auth` (this shows up as HTTP 500 on `/login` and `/api/auth/session`). `package.json` overrides `jwks-rsa`’s `jose` dependency to `4.15.9`, the last CommonJS build, and `next.config.ts` keeps `firebase-admin` external so Node resolves that override.

## Stack notes

- Firestore for all CRM entities; dates stored as ISO strings; tags/photos as `string[]`
- Server Actions for mutations; Server Components for reads
- Session via Firebase session cookie (`estate_session`)
- Dark mode via `next-themes`
