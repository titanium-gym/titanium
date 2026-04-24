<div align="center">

# 🏋️ Titanium

**Private gym management system — members, renewals, and expiry notifications.**

[![CI](https://github.com/titanium-gym/titanium/actions/workflows/tests.yml/badge.svg)](https://github.com/titanium-gym/titanium/actions/workflows/tests.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://titanium-gold.vercel.app)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

</div>

---

## Overview

Titanium is a full-stack web application for managing gym members. It handles member registrations, fee renewals, expiry tracking, and sends automated notifications when memberships are about to lapse — all behind a single-account Google OAuth gate.

## Features

- 👤 **Member management** — create, edit, renew, and delete members
- 📊 **Dashboard** — real-time KPIs: active, expiring soon, and expired members
- 📈 **Income chart** — monthly fee revenue for the last 6 months
- 🔔 **Expiry notifications** — daily cron emails for members expiring within N days
- 🗑️ **Purge tool** — bulk-delete members expired beyond a configurable threshold
- 🔒 **Single-user access** — Google OAuth restricted to one authorized email
- 🛡️ **Security headers** — CSP nonce, HSTS, X-Frame-Options, rate limiting

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth v5 · Google OAuth |
| Database | Supabase (PostgreSQL + RLS) |
| Email | Resend |
| UI | shadcn/ui · Tailwind CSS v4 |
| Deployment | Vercel |
| Cron | Vercel Cron + GitHub Actions keep-alive |
| Testing | Vitest · Playwright |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 app
- A [Resend](https://resend.com) account (for email notifications)

### 1. Clone & install

```bash
git clone https://github.com/titanium-gym/titanium.git
cd titanium
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (local) or production URL |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 credentials |
| `ALLOWED_EMAIL` | The single authorized Google account |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key |
| `BYPASS_AUTH` | Set `true` to skip OAuth in local dev |
| `RESEND_API_KEY` | resend.com → API Keys |
| `OWNER_EMAIL` | Recipient of expiry notification emails |
| `EXPIRY_WARNING_DAYS` | Days ahead to trigger expiry warnings (e.g. `3`) |
| `CRON_SECRET` | `openssl rand -base64 32` (secures the cron endpoint) |

### 3. Set up the database

Run the following scripts **in order** in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new):

```
supabase/drop-all.sql                       # clean slate (optional)
supabase/migrations/001_complete_schema.sql # schema + RLS + triggers
supabase/seed_demo.sql                      # 100 demo members (optional)
```

> ⚠️ Migrations are **manual** — there is no automated migration step in CI/CD.

### 4. Configure Google OAuth redirect URIs

In Google Cloud Console → OAuth 2.0 credentials, add:

- **Local:** `http://localhost:3000/api/auth/callback/google`
- **Production:** `https://<your-domain>/api/auth/callback/google`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

```bash
# Unit tests (Vitest) — 58 tests
npm test

# E2E tests (Playwright) — auto-starts dev server
npm run test:e2e

# Both at once
./scripts/test-all.sh
```

**CI/CD (GitHub Actions)** runs on every push and PR to `main`:
- ✅ Unit tests (Vitest)
- ✅ Type check (`tsc --noEmit`)
- ✅ Production build

See [TESTING.md](TESTING.md) for the full testing guide.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Run ESLint |
| `./scripts/test-all.sh` | Run all tests locally |

---

## Documentation

| Document | Description |
|----------|-------------|
| [TESTING.md](TESTING.md) | Full testing guide — unit, E2E, CI modes, mocks |
| [docs/deployment.md](docs/deployment.md) | Vercel setup, secrets, cron, rollback |
| [docs/security.md](docs/security.md) | Auth model, headers, rate limiting, CSP |

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
