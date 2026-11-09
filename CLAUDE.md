# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev                # Next.js dev server (BYPASS_AUTH=true in .env.local skips OAuth)
npm run build              # Production build; also how CI type-checks
npm test                   # Vitest unit suite (src/tests/unit/**/*.test.ts)
npm run test:e2e           # Playwright; auto-starts the dev server with mocks

npx vitest run src/tests/unit/expiry.test.ts            # single unit file
npx vitest run src/tests/unit/expiry.test.ts -t "name"  # single unit test
npx playwright test src/tests/e2e/security.spec.ts            # single spec
npx playwright test src/tests/e2e/security.spec.ts -g "title" # single E2E test

npx eslint src next.config.ts playwright.config.ts vitest.config.ts --max-warnings 0  # lint exactly as CI does
```

CI runs on PRs to `main`: unit tests, lint, build, and E2E (2 shards). E2E needs no real credentials; `playwright.config.ts` sets its env vars in `webServer.env`. With `reuseExistingServer` on locally, an already-running dev server without those vars gives misleading results.

## Architecture

Single-tenant gym management app: Next.js 15 App Router, NextAuth v5 (Google), Supabase Postgres, shadcn/ui with Tailwind v4, deployed on Vercel. `/` redirects to `/login`; the app itself lives under `src/app/dashboard` (`socios`, `pagos`, `depuracion`).

**Auth is enforced in layers.** `src/middleware.ts` denies by default outside `PUBLIC_PATHS` (NextAuth ignores the `authorized` callback when middleware has a handler, so the check is explicit), and also handles rate limiting and the CSP nonce. Every API handler must also call `requireAuth()` and every dashboard page `requirePageAuth()` from `src/lib/require-auth.ts`; a check in the layout alone is not enough, because layouts are skipped on client navigations. `ALLOWED_EMAILS` is checked in `src/auth.config.ts`, which is kept free of providers because the middleware imports it; the Google provider is added in `src/auth.ts`. `src/proxy.ts` is an empty placeholder.

**Data access is server-only.** `getSupabaseClient()` (`src/lib/supabase.ts`) uses the service-role key, so RLS does not protect these queries and there is no browser client. Server components read directly and use `export const dynamic = "force-dynamic"`; client components mutate through `src/app/api/members/**` and `AutoRefresh` re-fetches server data periodically. API handlers follow one shape: `requireAuth`, parse JSON, Zod `safeParse`, query, generic error message.

**Member and payment model.** `members` holds the current state and `payments` the history. No DB trigger links them: each route that sets `paid_at` (`POST /api/members`, `PUT /api/members/[id]`, `bulk-renew`) inserts the payment row itself, best-effort, so a new renewal path must do the same. Bulk renew extends from `MAX(expires_at, today)` to preserve prepaid time. Dates are `yyyy-MM-dd` strings; `nextMonthSameDay()` computes expiry and `getExpiryStatus()` in `src/lib/utils/expiry.ts` is the only source of status.

**Security surface.** Static headers are in `next.config.ts`; the per-request CSP (nonce + `strict-dynamic` in production, relaxed in dev) and the in-memory rate limiter are in `src/middleware.ts`. `BYPASS_AUTH` and `RATE_LIMIT_DISABLED` only take effect outside production, so keep that `NODE_ENV` check on any new use. Before changing `/login`, auth redirects, headers, or rate limiting, check the Playwright `security` and `auth` specs.

## E2E mocks

There are two layers, and a new data path often needs both:
- `src/tests/e2e/fixtures/setup-mocks.ts` intercepts API calls in the browser context, covering all mutations.
- `src/lib/supabase-mock.ts` (enabled by `SUPABASE_MOCK=true`) serves server-side reads. Its mutations are no-ops, and `.eq()` compares strictly, so the string `id` from route params matches nothing.

Never use `page.request.*` for mutations, because it skips the route mocks. Use `page.evaluate(() => fetch(...))` after navigating to `/dashboard`. Fixture member IDs are integers: `1`-`50` for the list, `999` for the single-member fixture. Auth specs are skipped when `BYPASS_AUTH=true`.

## Conventions

- UI copy is Spanish; keep the domain wording (`socios`, `vencimiento`, `cuota`, `inicio`).
- Fee tiers (`30`, `35`) are defined in `src/lib/constants.ts`, and also in the `members.fee_amount` SQL CHECK and the `z.ZodLiteral` tuple in `src/lib/schemas/member.ts`. Changing them also affects the form select, dashboard charts, and tests.
- Migrations are manual: run SQL in the Supabase SQL Editor (`supabase/migrations/001_complete_schema.sql`). CI/CD applies nothing.
- `src/tests/unit/project-structure.test.ts` asserts specific files and strings exist (e.g. `public_read_members` in the schema, `force-dynamic` in `src/app/page.tsx`), so moving or renaming those fails unit tests.
