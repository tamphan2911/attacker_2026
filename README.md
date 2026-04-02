# Attacker 2026

Attacker 2026 is a Next.js frontend prototype for a student fintech competition. This repository now also includes the first backend foundation for authentication, teams, Round 1 submissions, CMS storage, and admin-facing data models.

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- SQLite for local development
- NextAuth.js with credentials login and optional Google login

## Environment

Copy `.env.example` to `.env` and adjust values if needed.

```bash
cp .env.example .env
```

Required values:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Optional values:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `APP_STORAGE_ROOT`
- `BOOTSTRAP_DEMO_DATA`

## Install

```bash
npm install
```

## Database bootstrap

Generate the Prisma client:

```bash
npm run prisma:generate
```

Create the local SQLite schema:

```bash
npm run db:push
```

Seed demo data:

```bash
npm run db:seed
```

Or run the full local setup sequence:

```bash
npm run prisma:generate
npm run db:setup
npm run db:seed
```

Important note:

- `npm run db:push` and `npm run db:setup` currently recreate `prisma/dev.db` from the Prisma schema using `prisma migrate diff`.
- This is fine for local bootstrap right now, but it is destructive for existing local data.

## Run

```bash
npm run dev
```

App URL:

- [http://localhost:3000](http://localhost:3000)

## Railway deployment

For the current codebase, the cheapest practical online test setup is a single Railway service with:

- Railway public domain (`*.up.railway.app`)
- one persistent volume
- SQLite stored on that volume
- uploaded team submission files stored on that volume

### Recommended Railway env vars

Set these in Railway:

```bash
DATABASE_URL="file:/data/sqlite/attacker.db"
NEXTAUTH_URL="https://your-service.up.railway.app"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
APP_STORAGE_ROOT="/data"
BOOTSTRAP_DEMO_DATA="true"
```

Optional:

```bash
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="Attacker 2026 <no-reply@example.com>"
```

Important:

- mount the Railway volume at `/data`
- only leave `BOOTSTRAP_DEMO_DATA="true"` for the first boot if you want the demo dataset
- after the database is initialized and seeded, set `BOOTSTRAP_DEMO_DATA="false"`

### Railway commands

Use these service commands:

- Build command: `npm run build`
- Start command: `npm run start:railway`

The Railway start script now does this safely:

1. creates persistent folders inside `APP_STORAGE_ROOT`
2. runs `prisma db push` against the configured SQLite file
3. optionally seeds demo data when the database is empty and `BOOTSTRAP_DEMO_DATA=true`
4. starts Next.js on Railway's `PORT`

### Health check

Health endpoint:

- `GET /api/health`

### Persistent data paths

With the recommended Railway setup:

- SQLite DB: `/data/sqlite/attacker.db`
- Uploaded team files: `/data/team-submissions`

### Updating the live site later

- code changes from this workspace only affect Railway after a new deploy
- admin edits made on the live site affect the live database immediately
- if you redeploy with the same Railway volume attached, the database and uploaded files remain

## Demo credentials

Backend seed currently creates these fixed demo accounts:

- Admin: `admin / Aa@291189`
- Moderator password: `Moderator@2026`
- Student password: `Student@2026`

The seeded student and moderator emails and IDs come from the demo content in [`/Users/tamphanhuy/Documents/attacker 2026/src/data/site-content.ts`](/Users/tamphanhuy/Documents/attacker%202026/src/data/site-content.ts).

## Backend status

This backend pass adds:

- Prisma schema and local SQLite database
- NextAuth credentials login by `email` or `loginId`
- email activation for email/password registrations
- password-reset flow with secure email links
- optional Google login when OAuth env vars are present
- registration API
- authenticated `me` API
- server-side team business rules
- Round 1 server-side submission validation
- CMS/news persistence models for the next backend passes

Current limitation:

- The existing UI is still primarily driven by frontend demo state in [`/Users/tamphanhuy/Documents/attacker 2026/src/components/providers/site-state-provider.tsx`](/Users/tamphanhuy/Documents/attacker%202026/src/components/providers/site-state-provider.tsx).
- The new backend APIs are in place, but the app is not fully migrated to consume them yet.

## Current API routes

Auth and account:

- `POST /api/auth/register`
- `POST /api/auth/activate`
- `POST /api/auth/resend-activation`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET|POST /api/auth/[...nextauth]`
- `GET /api/me`

Teams:

- `POST /api/teams`
- `POST /api/teams/[teamId]/invites`
- `POST /api/invitations/[invitationId]/respond`
- `POST /api/teams/current/leave`
- `POST /api/teams/[teamId]/leadership-transfer`
- `POST /api/leadership-transfer-requests/[requestId]/respond`
- `POST /api/teams/[teamId]/round-1-lock`
- `POST /api/round-1-lock-requests/[requestId]/respond`

Round 1:

- `POST /api/round-1/submissions`

## Backend files

Core backend files added in this pass:

- [`/Users/tamphanhuy/Documents/attacker 2026/prisma/schema.prisma`](/Users/tamphanhuy/Documents/attacker%202026/prisma/schema.prisma)
- [`/Users/tamphanhuy/Documents/attacker 2026/prisma/seed.ts`](/Users/tamphanhuy/Documents/attacker%202026/prisma/seed.ts)
- [`/Users/tamphanhuy/Documents/attacker 2026/src/lib/db.ts`](/Users/tamphanhuy/Documents/attacker%202026/src/lib/db.ts)
- [`/Users/tamphanhuy/Documents/attacker 2026/src/lib/auth.ts`](/Users/tamphanhuy/Documents/attacker%202026/src/lib/auth.ts)
- [`/Users/tamphanhuy/Documents/attacker 2026/src/server/team-service.ts`](/Users/tamphanhuy/Documents/attacker%202026/src/server/team-service.ts)
- [`/Users/tamphanhuy/Documents/attacker 2026/src/server/auth-helpers.ts`](/Users/tamphanhuy/Documents/attacker%202026/src/server/auth-helpers.ts)
- [`/Users/tamphanhuy/Documents/attacker 2026/src/server/route-utils.ts`](/Users/tamphanhuy/Documents/attacker%202026/src/server/route-utils.ts)

## Validation

Current backend foundation passes:

- `npm run lint`
- `npm run build`

## Suggested next steps

The next backend pass should focus on one of these:

1. Wire frontend auth and profile flows to NextAuth and `/api/me`.
2. Replace local team state with the team APIs.
3. Add admin CRUD APIs for users, teams, news, judges, sponsors, and Round 1 banks.
4. Move file uploads to real storage instead of browser-local demo data.
