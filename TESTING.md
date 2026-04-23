# 🧪 Testing Guide - Titanium

Complete guide for running tests locally and in CI/CD environments.

---

## Quick Start

### Local Development (with BYPASS_AUTH=true)

```bash
# Unit tests only
npm test

# E2E tests only (requires `npm run dev` running separately)
npm run test:e2e

# All tests together
./scripts/test-all.sh
```

### CI/CD (GitHub Actions)

Tests run automatically on pull requests and merges to `main`:
- Unit tests (Vitest)
- Type checking (TypeScript)
- Production build

View results in GitHub: **Actions** → latest workflow run

---

## Test Infrastructure

### Unit Tests (Vitest) - `/src/tests/unit`

**Coverage:** 45 tests

| Module | Tests | Purpose |
|--------|-------|---------|
| `routing.test.ts` | 9 | App Router navigation, redirects |
| `project-structure.test.ts` | 15 | File/folder layout, conventions |
| `member-schema.test.ts` | 11 | Member validation (Zod) |
| `expiry.test.ts` | 10 | Date math, expiry logic |

**Run:**
```bash
npm test                           # All tests
npm test -- routing.test.ts        # Single file
npm test -- -t "returns 'active'"  # By test name
```

**Isolation:** Unit tests use in-memory data, no external dependencies.

---

### E2E Tests (Playwright) - `/src/tests/e2e`

**Coverage:** 42 tests (11 skipped in BYPASS_AUTH mode)

| File | Tests | Purpose |
|------|-------|---------|
| `user-workflows.spec.ts` | 12 | Login, navigation, CRUD, logout |
| `routing.spec.ts` | 11 | Page routing, API responses |
| `members.spec.ts` | 9 | Member API auth, CRUD, validation |
| `security.spec.ts` | 11 | Headers, CSP, info disclosure |
| `dashboard-workflows.spec.ts` | 15 | Dashboard rendering, data display |
| `auth.spec.ts` | 4 | Authentication flow (mostly skipped in dev) |

**Run:**
```bash
# Local with BYPASS_AUTH=true
BYPASS_AUTH=true npm run test:e2e

# CI/CD mode (no BYPASS_AUTH)
npm run test:e2e

# Single file
npx playwright test src/tests/e2e/user-workflows.spec.ts

# Specific test
npx playwright test -g "can click Inicio"

# With UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

---

## Execution Modes

### Mode 1: Local Development (`BYPASS_AUTH=true`)

**When:** You're developing locally with `npm run dev`

**What happens:**
- ✅ Auth checks bypassed (no login required)
- ✅ E2E tests run against running dev server
- ✅ Mock API intercepts HTTP calls (no real database)
- ✅ Auth tests are skipped (because auth is bypassed)

**Setup:**
```bash
# Terminal 1: Start dev server
BYPASS_AUTH=true npm run dev

# Terminal 2: Run E2E tests
BYPASS_AUTH=true npm run test:e2e
```

**Test expectations:**
- UI navigation works (buttons, links)
- Mock members data returned from `/api/members`
- No real database calls
- Auth tests marked as skipped

---

### Mode 2: CI/CD (GitHub Actions)

**When:** PR is pushed or merged to `main`

**What happens:**
- ✅ No `BYPASS_AUTH` (auth checks are enforced)
- ✅ Tests run against live API endpoints
- ✅ API calls are NOT intercepted
- ✅ Requires valid Supabase connection
- ✅ Auth tests run and expect 401 responses

**Setup in CI:**
1. GitHub Secrets configured:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_EMAIL`
   - `CRON_SECRET` (optional, if you add cron back)

2. Workflow runs (`.github/workflows/ci.yml`):
   ```yaml
   - Unit tests (npm test)
   - Type check (tsc)
   - Build (npm run build)
   ```

**Test expectations:**
- Auth tests validate 401 responses for unauthenticated requests
- E2E tests skip checks that require authentication bypass
- All security headers validated
- Build succeeds

---

## Mock API System

### How It Works

E2E tests use **mock API interception** to avoid real database calls:

```typescript
// In any E2E test:
import { setupApiMocks } from "./fixtures/setup-mocks";

test("my test", async ({ page }) => {
  await setupApiMocks(page);  // ← Intercepts /api/members calls
  const res = await page.request.get("/api/members");
  // Returns mock data instead of hitting real DB
});
```

### Mock Data Location

**File:** `src/tests/e2e/fixtures/mock-data.ts`

- 50 deterministic mock members
- Fee amounts: 30 or 35
- Expiry dates: mix of active/expired
- Used by all E2E tests

### Benefits

| Feature | Benefit |
|---------|---------|
| No DB dependency | Tests run offline, faster |
| Consistent data | Same results every run |
| No data mutations | Safe to run anytime |
| CI/CD friendly | Works everywhere |
| Isolated | Doesn't affect production |

---

## Test Categories

### User Workflows (`user-workflows.spec.ts`)

Tests complete user journeys:
- ✅ Login page accessibility
- ✅ Sidebar navigation (Inicio, Socios)
- ✅ Create new member
- ✅ Renew membership
- ✅ Edit member
- ✅ Delete member
- ✅ Logout

```bash
npx playwright test -g "User Workflows"
```

### Routing (`routing.spec.ts`)

Tests page navigation and API structure:
- ✅ `/` redirects to `/login`
- ✅ `/login` loads successfully
- ✅ `/dashboard` shows overview
- ✅ `/dashboard/socios` loads members table
- ✅ API returns valid member objects

```bash
npx playwright test -g "Page Routing"
```

### Security (`security.spec.ts`)

Tests headers, auth, and info disclosure:
- ✅ Security headers present (CSP, HSTS)
- ✅ 401 responses for unauthenticated requests
- ✅ No sensitive data leaked in HTML
- ✅ No error stack traces exposed
- ✅ API errors don't expose internals

```bash
npx playwright test -g "Security"
```

### Members API (`members.spec.ts`)

Tests member CRUD and API security:
- ✅ GET /api/members returns 200
- ✅ POST creates member
- ✅ PUT updates member
- ✅ DELETE removes member
- ✅ Missing auth returns 401 (CI only)

```bash
npx playwright test -g "Member API"
```

### Dashboard (`dashboard-workflows.spec.ts`)

Tests dashboard rendering and data display:
- ✅ Dashboard loads successfully
- ✅ Members table renders
- ✅ No console errors
- ✅ Mock data displayed correctly
- ✅ Logout button exists

```bash
npx playwright test -g "Dashboard"
```

---

## Running Tests

### Single Test File

```bash
npx playwright test src/tests/e2e/user-workflows.spec.ts
```

### Single Test by Name

```bash
npx playwright test -g "can click Socios"
```

### All Tests with UI (Interactive)

```bash
npx playwright test --ui
```

### Debug Mode

```bash
npx playwright test --debug
```

### Generate HTML Report

```bash
npm run test:e2e
npx playwright show-report
```

### Run Tests in Headed Mode (see browser)

```bash
npx playwright test --headed
```

---

## Troubleshooting

### Tests fail locally with `BYPASS_AUTH=true`

**Problem:** Tests still expecting 401 responses

**Solution:** 
- Check test file has `if (process.env.BYPASS_AUTH === "true") { test.skip(); }`
- Restart dev server: `npm run dev` with `BYPASS_AUTH=true`

### "Browser context is closed" error

**Problem:** Tests running before server is ready

**Solution:**
```bash
# Start server first
npm run dev

# Then run tests in another terminal
npm run test:e2e
```

### Mock data not being used

**Problem:** Tests hitting real database

**Solution:**
- Check test calls `await setupApiMocks(page)` before API calls
- Verify mock data file exists: `src/tests/e2e/fixtures/mock-data.ts`

### Tests timeout

**Problem:** Page elements not found

**Solution:**
- Increase timeout: `test.setTimeout(60000)`
- Check element selectors with `--debug` mode
- Use `page.waitForLoadState('networkidle')` before assertions

---

## CI/CD Configuration

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

Runs on:
- Every push to `main`
- Every pull request

Jobs:
1. **Unit Tests** - `npm test`
2. **Type Check** - `tsc --noEmit`
3. **Build** - `npm run build`

### Required Secrets

Add to GitHub repo Settings → Secrets:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
ALLOWED_EMAIL=your-email@example.com
```

### View Results

1. Go to repo → **Actions**
2. Click latest workflow run
3. See test results, build output, type errors

---

## Best Practices

### ✅ DO

- Call `setupApiMocks(page)` in every E2E test that uses `/api/members`
- Use `await page.waitForLoadState('networkidle')` before UI assertions
- Use flexible status code checks: `expect([200, 201]).toContain(res.status())`
- Skip auth tests in `BYPASS_AUTH=true` mode
- Use mock data for consistent test results

### ❌ DON'T

- Make direct database queries in tests
- Use hardcoded IDs or names
- Assume specific member counts (use `.length > 0`)
- Test against production database
- Skip tests that should run in CI

---

## Key Takeaways

| Local Dev | CI/CD |
|-----------|-------|
| `BYPASS_AUTH=true` | No BYPASS_AUTH |
| Auth tests skipped | Auth tests run |
| Mock API used | Real API called |
| Fast, offline | Full validation |
| Ideal for UI work | Ideal for release |

---

## Quick Reference

```bash
# Start dev
npm run dev

# Unit tests
npm test

# E2E tests (local)
BYPASS_AUTH=true npm run test:e2e

# All tests
./scripts/test-all.sh

# Debug single test
npx playwright test user-workflows.spec.ts --debug

# Show report
npx playwright show-report
```

---

**Last updated:** 2025-01-15  
**Maintained by:** Copilot
