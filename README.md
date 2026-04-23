# Titanium

Private access.

## Stack

- **Next.js 15** (App Router) — Vercel
- **NextAuth v5** — Google OAuth, single authorized account
- **Supabase** (PostgreSQL + RLS) — server-only access
- **Resend** — transactional email
- **Vercel Cron** — daily job at 08:00 UTC
- **shadcn/ui + Tailwind CSS**
- **Vitest** + **Playwright**

## Setup

### Environment variables

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (local) / full URL (prod) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 |
| `ALLOWED_EMAIL` | Single authorized Google account |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `BYPASS_AUTH` | `true` for local dev (skips OAuth) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `OWNER_EMAIL` | Receives expiry notifications |
| `EXPIRY_WARNING_DAYS` | Days ahead to warn (e.g. `3`) |
| `CRON_SECRET` | `openssl rand -base64 32` |

### Database migration

Run these scripts in order in the Supabase SQL Editor:
1. `supabase/drop-all.sql` — Clean slate
2. `supabase/migrations/001_complete_schema.sql` — Schema + RLS + triggers
3. `supabase/seed_demo.sql` — Load 100 demo socios

### Google OAuth redirect URIs

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://<your-domain>/api/auth/callback/google`

## Testing

### Local: Unit tests (Vitest)
```bash
npm test
```
Runs 45 tests covering routing, project structure, member schema, and expiry logic.

### Local: E2E tests (Playwright)
```bash
# First terminal: start the dev server
npm run dev

# Second terminal: run E2E tests
npm run test:e2e
```
Tests critical user flows: login, dashboard, API endpoints.

### Both at once
```bash
./scripts/test-all.sh
```

### GitHub Actions
Runs on every PR to `main`:
- ✅ Unit tests (Vitest) — 45 tests
- ✅ Type check (tsc)
- ✅ Build (npm run build)

See [TESTING.md](TESTING.md) for detailed instructions.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run lint` | Lint |
| `./scripts/test-all.sh` | Run all tests locally |

## Deployment & GitHub Secrets

See [docs/deployment.md](docs/deployment.md) — includes Vercel setup, GitHub Actions secrets checklist, cron verification, and rollback.

## Security

See [docs/security.md](docs/security.md).
