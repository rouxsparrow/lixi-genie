# Lì Xì Genie (Production MVP)

A fairness-first lucky draw app built with Next.js + Supabase.

## Features
- Commit-reveal fairness model (server seed lock + reveal)
- Atomic draw via Postgres RPC
- Append-only audit log with hash-chain integrity
- VOID latest draw with stock restoration
- Deterministic `/verify` endpoint and page
- Admin passcode session via signed httpOnly cookie

## Stack
- Next.js App Router
- Supabase Postgres + Storage
- Tailwind CSS

## Setup
1. Install dependencies:
```bash
pnpm install
```
2. Copy env template:
```bash
cp .env.example .env.local
```
3. Fill env values.
4. Run Supabase migrations from `supabase/migrations`.
5. Start dev server:
```bash
pnpm dev
```

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSCODE`
- `ADMIN_SESSION_SECRET`
- `SERVER_SEED_ENC_KEY`

## API Overview
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/events/:slug/state`
- `POST /api/events/:slug/start-lock`
- `POST /api/events/:slug/phase`
- `POST /api/events/:slug/draw`
- `POST /api/events/:slug/void-latest`
- `POST /api/events/:slug/reveal`
- `GET /api/events/:slug/audit.json`
- `POST /api/verify/audit`

## Pre-Event Checklist
1. Create an event from `/admin`.
2. Add all participants and prizes.
3. Lock fairness with boss input.
4. Run a dry draw + void + redraw flow.
5. Verify reveal and `audit.json` download.

## Post-Event Checklist
1. Reveal server seed.
2. Download `audit.json`.
3. Upload to `/verify` and confirm PASS.
4. Archive event data.

## Tests
```bash
pnpm test
```
