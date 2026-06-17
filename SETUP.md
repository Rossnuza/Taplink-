# TapLink — Setup Guide (plain English)

This walks you through connecting TapLink to its three services and going live.
You don't need to be technical — follow it top to bottom. It takes ~20 minutes.

You'll wire up:

1. **Supabase** — the database + login + file storage (your data lives here)
2. **Resend** — sends documents to people who ask for them by email
3. **Vercel** — hosts the live website

---

## What keys I need from you

To finish the connection I need these six values. You can paste them to me in
chat, or add them yourself in the two places described in Step 5. They are:

| Name | Where to find it | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key | **Yes — keep private** |
| `RESEND_API_KEY` | Resend → API Keys → Create API Key | **Yes — keep private** |
| `TAPLINK_FROM_EMAIL` | The "from" address (start with `TapLink <onboarding@resend.dev>`) | No |
| `NEXT_PUBLIC_SITE_URL` | Your live web address, e.g. `https://taplink.vercel.app` | No |

> The two "secret" keys are powerful. They're only ever used on the server and
> are never committed to git (`.env.local` is ignored). If you paste them in
> chat, rotate them later from each dashboard if you want to be extra safe.

---

## Step 1 — Create the database tables (Supabase)

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/0001_init.sql` from this project, copy its
   entire contents, paste into the editor, and click **Run**.
3. You should see "Success." This creates every table (profiles, assets, links,
   leads, events), the security rules, and the three storage buckets
   (`avatars`, `logos`, `documents`).

## Step 2 — Turn on email login (Supabase)

1. Supabase → **Authentication** → **Providers** → make sure **Email** is
   enabled (it is by default).
2. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000` for testing, or your Vercel URL once
     live.
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and your
     production `https://YOUR-APP.vercel.app/auth/callback`.

That's it — TapLink uses magic links (a sign-in link emailed to you), so there
are no passwords to manage.

## Step 3 — Resend (sending documents)

1. In Resend, create an **API key** and copy it → that's `RESEND_API_KEY`.
2. To start, leave `TAPLINK_FROM_EMAIL` as `TapLink <onboarding@resend.dev>`
   (Resend's sandbox sender — works immediately).
3. Later, to send from your own domain (e.g. `ross@eicindustries.com`), verify
   the domain in Resend → **Domains**, then update `TAPLINK_FROM_EMAIL`.

## Step 4 — Run it locally (optional but recommended)

1. Copy the template: `cp .env.example .env.local`
2. Paste your six values into `.env.local`.
3. `npm install` then `npm run dev`, and open `http://localhost:3000`.
4. Click **Get started**, enter your email, open the magic link, claim your
   handle (e.g. `ross`), and you'll land in the dashboard.

## Step 5 — Deploy to Vercel (go live)

1. Push this repository to GitHub (already done if you're reading this in a PR).
2. In Vercel → **Add New Project** → import the repo.
3. In Vercel → Project → **Settings → Environment Variables**, add the same six
   values from the table above (set `NEXT_PUBLIC_SITE_URL` to your Vercel URL).
4. Deploy. Then go back to **Step 2** and make sure your Vercel URL is in
   Supabase's Site URL + Redirect URLs.

---

## How the pieces fit together

- **Visitor scans your QR** → loads `/<your-handle>` instantly (no login) → a
  `scan` event is logged.
- **They tap a button** → it does the obvious thing (open LinkedIn, download
  your vCard, open or request a document, visit your site) → the action is
  logged silently.
- **They request a document by email** → their email is saved as a **lead**, the
  document is emailed to them via Resend, and you see it in **Leads**.
- **You** watch it all from the dashboard: scans over time, top links, document
  opens, and your lead inbox (with CSV export).

## Day-to-day use

- **Profile** tab: photo, logo, name/title/bio, and which buttons show.
- **Assets** tab: upload PDFs. Toggle "Require email to open" for sensitive
  files (like a confidential IM) so every view becomes a captured lead.
  Replacing a file keeps the **same QR**.
- **Share** tab: download your QR, copy your NFC badge URL, add campaign tags
  (e.g. `?source=eu-business-week`) to compare events.
- **Leads** tab: filter, and export to CSV.

## Troubleshooting

- **"Finish setup" screen** → the Supabase keys aren't loaded. Check
  `.env.local` (local) or Vercel env vars (production) and restart.
- **Magic link doesn't sign me in** → the redirect URL isn't whitelisted in
  Supabase (Step 2), or you opened the link on a different device/browser.
- **Document email never arrives** → check `RESEND_API_KEY`, and that you're
  sending from a verified domain (or the `onboarding@resend.dev` sandbox).
