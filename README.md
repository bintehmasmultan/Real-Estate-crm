# EstateCRM — Real Estate CRM

Production-ready real estate CRM built with Next.js (App Router), TypeScript, Prisma, SQLite, NextAuth, Tailwind CSS, Recharts, and drag-and-drop pipelines.

## Features

- Auth with roles: **Admin**, **Manager**, **Agent** (scoped data access)
- Dashboard metrics, activity feed, pipeline chart, upcoming tasks
- Contacts with preferences, tags, and activity timeline
- Properties / listings with photos (URL), owner, and related deals
- Leads (CRM + public `/lead` capture) with convert → Contact + Deal
- Sales & Rentals Kanban pipelines (`@hello-pangea/dnd`)
- Tasks, calendar view, and basic reports

## Quick start

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | `admin@crm.local`   | `password123` |
| Manager | `manager@crm.local` | `password123` |
| Agent   | `agent@crm.local`   | `password123` |

Public lead form: [http://localhost:3000/lead](http://localhost:3000/lead)

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

## Scripts

- `npm run dev` — local development
- `npm run build` / `npm start` — production
- `npm run db:seed` — reset sample data
- `npx prisma studio` — browse the database

## Stack notes

- SQLite for local development (Prisma schema is easy to point at Postgres later)
- Server Actions for mutations; Server Components for reads
- Dark mode via `next-themes`
