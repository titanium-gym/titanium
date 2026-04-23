# Titanium Copilot Instructions

## Build, test, and lint commands

- `npm run dev` — start the Next.js 15 app locally.
- `npm run build` — production build. In this repo it also performs Next.js linting and type-checking.
- `npm test` — run the Vitest unit suite (`src/tests/unit/**/*.test.ts`).
- `npx vitest run src/tests/unit/expiry.test.ts` — run a single unit test file.
- `npx vitest run src/tests/unit/expiry.test.ts -t "returns 'expired' when expires_at is in the past"` — run a single Vitest test by name.
- `npm run test:e2e` — run Playwright specs from `src/tests/e2e`. Locally, Playwright auto-starts `npm run dev`.
- `npx playwright test src/tests/e2e/security.spec.ts` — run a single Playwright spec file.
- `npx playwright test src/tests/e2e/security.spec.ts -g "GET /login includes security headers"` — run a single Playwright test by title.
- `npm run lint` — runs raw `eslint`. Because the config does not exclude `.next/`, this will lint generated build output if `.next` already exists. Prefer running it before `npm run build`, or target source files directly with `npx eslint src next.config.ts playwright.config.ts vitest.config.ts`.
- E2E tests are fully self-contained: `playwright.config.ts` sets all required env vars in `webServer.env` (`BYPASS_AUTH`, `SUPABASE_MOCK`, `RATE_LIMIT_DISABLED`, `NEXTAUTH_SECRET`). No real Supabase or Google credentials are needed to run the E2E suite locally or in CI.

## High-level architecture

- This is a Next.js 15 App Router app. `/` redirects to `/login`. The authenticated UI lives under `src/app/dashboard`, with `/dashboard` for overview metrics and `/dashboard/socios` for member management.
- Authentication is centralized in `src/auth.ts` with NextAuth v5 + Google OAuth. Access is intentionally limited to a single authorized Google account via `ALLOWED_EMAIL`. `src/app/dashboard/layout.tsx` guards the dashboard UI, and `src/lib/require-auth.ts` is the shared guard for API routes.
- `BYPASS_AUTH=true` is a development-only escape hatch. Both the NextAuth authorization callback and `require-auth.ts` honor it only when `NODE_ENV !== "production"`.
- Supabase access is server-only. `src/lib/supabase.ts` builds a client with `SUPABASE_SERVICE_ROLE_KEY`, and there is no browser-side Supabase client. Server components read directly from Supabase; client components mutate through route handlers in `src/app/api/members/**`.
- The members screen is split between a server read and client-managed interactivity. `src/app/dashboard/socios/page.tsx` fetches the initial rows, then `src/components/members/MembersTable.tsx` owns filtering, sorting, pagination, selection, CSV export, and optimistic local state updates after API calls.
- Member validation and business rules are shared. `src/lib/schemas/member.ts` defines the allowed payload shape, `src/lib/constants.ts` defines global fee/expiry constants, and `src/lib/utils/date.ts` plus `src/lib/utils/expiry.ts` are reused across forms, dashboard cards, charts, and renew endpoints.
- Scheduled expiry notifications are implemented as a Vercel cron job. `vercel.json` schedules `/api/cron/check-expiry`, and `src/app/api/cron/check-expiry/route.ts` verifies `CRON_SECRET`, fetches eligible members, sends batched email through `src/lib/email.ts`, and logs sent notifications in `notification_log` so the same day/type is not emailed twice.
- Security is layered in two places: `next.config.ts` sets static headers such as HSTS and X-Frame-Options, while `src/middleware.ts` adds a per-request CSP nonce and an in-memory IP-based rate limiter. Middleware intentionally excludes `api/auth`, `api/cron`, and static assets from that wrapper.
- E2E tests use a two-layer mock system. `src/tests/e2e/fixtures/setup-mocks.ts` registers `page.route()` interceptors that run in the browser context and handle all API calls including mutations. `src/lib/supabase-mock.ts` is the server-side mock activated by `SUPABASE_MOCK=true`; it only needs to implement SELECT since server components never mutate. Both mocks use the same UUID-format IDs (`"00000000-0000-0000-0000-000000000001"`).

## Key conventions

- Visible product/UI copy is in Spanish. Keep new user-facing strings aligned with the existing language and domain wording (`socios`, `vencimiento`, `cuota`, `inicio`).
- This is a private-access app with low-disclosure public surfaces. Before changing `/login`, auth redirects, headers, or rate limiting, check the existing Playwright security/auth specs in `src/tests/e2e`.
- Fee tiers are intentionally hard-coded to `30` and `35` in `src/lib/constants.ts`. If that changes, update the constant, Zod schema, form select, dashboard charts, and related tests together.
- Dates move through the app as `yyyy-MM-dd` strings. `paid_at` usually drives `expires_at` via `nextMonthSameDay()`, and expiry status is always derived through the shared helpers in `src/lib/utils/expiry.ts`.
- Dashboard pages that read live Supabase data use `export const dynamic = "force-dynamic"`. Preserve that unless the data-fetching strategy changes on purpose.
- Database migrations are manual. The repo expects schema changes to be applied in Supabase SQL Editor (starting from `supabase/migrations/000_consolidated.sql`); there is no automated migration step in CI/CD.
- Repo guidance in `AGENTS.md` is important when changing framework APIs: this project is on Next.js 15, so prefer the current framework docs in `node_modules/next/dist/docs/` over older Next.js habits.
- In E2E tests, **never use `page.request.*` for mutations** (POST/PUT/DELETE). `page.request.*` is a separate API context that bypasses `page.route()` interceptors. Always use `page.evaluate(async () => fetch(...))` for mutations — this runs in the browser context where route mocks are active. Navigate to `/dashboard` first to establish auth cookies before calling `page.evaluate`.
- Member IDs are UUIDs validated by regex in API routes. Test fixtures (`mock-data.ts`, `supabase-mock.ts`) use `"00000000-0000-0000-0000-000000000001"` format. Never use numeric or custom-string IDs in tests.
- `src/middleware.ts` has an in-memory rate limiter (10 req/min for `/login`, 30/min for API mutations). It is bypassed when `RATE_LIMIT_DISABLED=true` and `NODE_ENV !== "production"`. This flag is set in `playwright.config.ts` `webServer.env` to prevent 429s during sequential test runs.
