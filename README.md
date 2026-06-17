# TapLink

A scannable digital business card + smart link hub with built-in lead capture
and scan tracking — a "Facebook pixel for real-world networking."

There are **two sides to one product**:

- **Visitor page** (`/[handle]`) — the fast, mobile-first, no-login page someone
  sees the instant they scan your QR or tap your NFC badge. They can connect on
  LinkedIn, save your contact (vCard), open a document (view in browser **or**
  have it emailed to them), and visit your website. Every action is tracked
  silently.
- **Owner dashboard** (`/dashboard`) — your private side: build your profile,
  upload documents, generate your QR + NFC URL, and watch scans, clicks and
  captured leads roll in.

Built with **Next.js 16** (App Router), **Supabase** (auth, Postgres, storage)
and **Resend** (transactional email). Visual direction: "Classic Clean."

## Quick start

1. Copy the environment template and fill in your keys (see **SETUP.md** for a
   step-by-step, non-technical walkthrough):
   ```bash
   cp .env.example .env.local
   ```
2. Create the database tables: open the Supabase SQL editor and run
   `supabase/migrations/0001_init.sql`.
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Visit `http://localhost:3000`, sign in with the magic link, claim your
   handle, and you're live.

## Project layout

| Path | What it is |
| --- | --- |
| `app/[handle]/` | Public visitor page (server-rendered) + interactive view |
| `app/dashboard/` | Owner dashboard: Home, Profile, Assets, Share, Leads |
| `app/api/` | Tracking, vCard, document view, email-capture endpoints |
| `app/auth/`, `app/login/`, `app/onboarding/` | Magic-link auth + first-run |
| `lib/` | Supabase clients, analytics, email, vCard, helpers |
| `supabase/migrations/` | Database schema + Row Level Security policies |
| `proxy.ts` | Session refresh + route protection (Next 16's middleware) |

See **SETUP.md** for full configuration and deployment instructions.
