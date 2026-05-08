
# Titanium Copilot Instructions

---

## Build, Test, and Lint Commands

See this section for all build, test, and lint commands:

- `npm run dev`: Start the Next.js 15 app locally.
- `npm run build`: Production build (includes linting and type-checking).
- `npm test`: Run the Vitest unit suite (`src/tests/unit/**/*.test.ts`).
- `npx vitest run src/tests/unit/expiry.test.ts`: Run a single unit test file.
- `npx vitest run src/tests/unit/expiry.test.ts -t "returns 'expired' when expires_at is in the past"`: Run a single Vitest test by name.
- `npm run test:e2e`: Run Playwright specs from `src/tests/e2e` (auto-starts dev server).
- `npx playwright test src/tests/e2e/security.spec.ts`: Run a single Playwright spec file.
- `npx playwright test src/tests/e2e/security.spec.ts -g "GET /login includes security headers"`: Run a single Playwright test by title.
- `npm run lint`: Run raw `eslint`. Prefer running before build, or target source files directly with `npx eslint src next.config.ts playwright.config.ts vitest.config.ts`.
- E2E tests are self-contained: `playwright.config.ts` sets all required env vars in `webServer.env`. No real Supabase or Google credentials are needed for E2E locally or in CI.

---

## High-Level Architecture

This section covers the main architecture:

- Next.js 15 App Router app. `/` redirects to `/login`. Authenticated UI is under `src/app/dashboard`.
- Authentication: `src/auth.ts` (NextAuth v5 + Google OAuth), limited to authorized Google accounts via `ALLOWED_EMAILS` (comma-separated list). `src/app/dashboard/layout.tsx` and `src/lib/require-auth.ts` guard dashboard and API routes.
- `BYPASS_AUTH=true` is a dev-only escape hatch, honored only when not in production.
- Supabase access is server-only. `src/lib/supabase.ts` uses `SUPABASE_SERVICE_ROLE_KEY`. No browser-side Supabase client. Server components read directly; client components mutate via API route handlers.
- Members screen: server read + client interactivity. `src/app/dashboard/socios/page.tsx` fetches initial rows; `src/components/members/MembersTable.tsx` manages filtering, sorting, pagination, selection, CSV export, and optimistic updates.
- Shared validation/business rules: `src/lib/schemas/member.ts`, `src/lib/constants.ts`, `src/lib/utils/date.ts`, `src/lib/utils/expiry.ts`.
- Security: `next.config.ts` sets static headers; `src/middleware.ts` adds CSP nonce and in-memory IP-based rate limiter (excludes `api/auth` and static assets).
- E2E tests: two-layer mock system. `src/tests/e2e/fixtures/setup-mocks.ts` (browser context, all API calls/mutations). `src/lib/supabase-mock.ts` (server-side, SELECT only). Both use integer IDs for fixtures.

---

## Key Conventions

This section lists key conventions:

- UI copy is in Spanish. Keep new user-facing strings aligned with existing language/domain wording (`socios`, `vencimiento`, `cuota`, `inicio`).
- Private-access app with low-disclosure public surfaces. Before changing `/login`, auth redirects, headers, or rate limiting, check Playwright security/auth specs in `src/tests/e2e`.
- Fee tiers are hard-coded to `30` and `35` in `src/lib/constants.ts`. If changed, update constant, Zod schema, form select, dashboard charts, and related tests together.
- Dates use `yyyy-MM-dd` strings. `paid_at` drives `expires_at` via `nextMonthSameDay()`. Expiry status is always derived via shared helpers in `src/lib/utils/expiry.ts`.
- Dashboard pages reading live Supabase data use `export const dynamic = "force-dynamic"`. Preserve unless data-fetching strategy changes.
- Database migrations are manual. Apply schema changes in Supabase SQL Editor (`supabase/migrations/001_complete_schema.sql`). No automated migration in CI/CD.
- **This is Next.js 15 — not the Next.js you know from training data.** APIs, conventions, and file structure may differ from older versions. Always read `node_modules/next/dist/docs/` before writing framework-specific code and heed deprecation notices.
- In E2E tests, **never use `page.request.*` for mutations**. Always use `page.evaluate(async () => fetch(...))` for mutations (runs in browser context where route mocks are active). Navigate to `/dashboard` first to establish auth cookies before calling `page.evaluate`.
- Member IDs are integers. Test fixtures use numeric IDs: `1`–`50` for member list, `999` for single-member fixture. Always use numeric IDs in tests.
- `src/middleware.ts` has an in-memory rate limiter (10 req/min for `/login`, 30/min for API mutations). It is bypassed when `RATE_LIMIT_DISABLED=true` and not in production. This flag is set in `playwright.config.ts` `webServer.env` to prevent 429s during sequential test runs.
