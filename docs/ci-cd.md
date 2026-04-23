# 🚀 CI/CD Configuration - Titanium

Complete guide to the GitHub Actions CI/CD pipeline.

---

## Pipeline Overview

The CI/CD pipeline runs automatically on:
- **Push to `main`** - Validate all commits going to main
- **Pull requests** - Validate PRs before merge

**Jobs:**
1. **Unit Tests** (Vitest) - 45 tests
2. **Build & Type Check** - TypeScript + Next.js build
3. **E2E Tests** (Playwright) - 42 tests (11 skipped in BYPASS_AUTH mode)
4. **Lint** - ESLint validation

**Status:** All jobs must pass to merge to `main`

---

## Job Details

### 1. Unit Tests (Vitest)

```yaml
Test Files  4 passed
Tests       45 passed
Duration    ~8 seconds
```

**What it does:**
- Runs all tests in `src/tests/unit/`
- Validates routing, schemas, expiry logic
- No external dependencies

**Failure points:**
- Code logic errors
- Type inference issues
- Data validation failures

---

### 2. Build & Type Check

```yaml
Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies (npm ci)
  4. Type check (tsc --noEmit)
  5. Build (npm run build)
Duration    ~30 seconds
```

**What it does:**
- Validates all TypeScript types (strict mode)
- Produces production-ready `.next` build
- Confirms Next.js app router works correctly

**Environment variables used:**
```env
BYPASS_AUTH=false              # Enforce auth in build
SUPABASE_URL=<secret>          # DB connection
SUPABASE_SERVICE_ROLE_KEY=<secret>
NEXTAUTH_SECRET=<secret>       # Auth session key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<secret>      # OAuth
GOOGLE_CLIENT_SECRET=<secret>
```

**Failure points:**
- TypeScript type errors
- Missing environment secrets
- Invalid Next.js configuration
- Broken build steps

---

### 3. E2E Tests (Playwright)

```yaml
Test Files  6 files
Tests       42 passed, 11 skipped
Duration    ~20 seconds
```

**What it does:**
- Runs E2E tests with `BYPASS_AUTH=true` (auth bypassed)
- Intercepts API calls with mock data
- Validates page navigation, API structure, security headers
- Uploads Playwright report as artifact

**Environment variables used:**
```env
BYPASS_AUTH=true               # Skip auth for UI testing
SUPABASE_URL=<secret>          # Optional, not used (mocks)
# ... others for build context
```

**Failure points:**
- Page navigation broken
- API response structure changed
- Security headers missing
- UI elements not rendering

**Artifacts:**
- Uploaded as `playwright-report-<run-id>` (30 day retention)
- Download from Actions → Latest run → Artifacts

---

### 4. Lint (ESLint)

```yaml
Files checked:
  - src/**
  - next.config.ts
  - playwright.config.ts
  - vitest.config.ts
Duration    ~5 seconds
```

**What it does:**
- Validates code style and patterns
- Enforces ESLint config rules
- `--max-warnings 0` = even warnings fail the job

**Failure points:**
- Code style violations
- Unused variables
- Incorrect imports
- Console.log() left in code

---

## GitHub Secrets Configuration

Required secrets in GitHub repo:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value | Where |
|--------|-------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase dashboard |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -hex 32` | Any secure value |
| `NEXTAUTH_URL` | `http://localhost:3000` | Static for dev |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | OAuth setup |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | OAuth setup |

### How to Find Values

**Supabase:**
1. Dashboard → Project Settings → API
2. Copy `URL` and `Service Role Key`

**Google OAuth:**
1. Google Cloud Console → Credentials
2. OAuth 2.0 Client ID → Copy credentials

**NEXTAUTH_SECRET:**
```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## Actions & Versions

All actions are pinned to specific versions for stability:

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v4 | Clone repository |
| `actions/setup-node` | v4 | Install Node.js 20 |
| `actions/upload-artifact` | v4 | Store test reports |

**Checking for updates:**
- https://github.com/actions/checkout/releases
- https://github.com/actions/setup-node/releases
- https://github.com/actions/upload-artifact/releases

---

## Workflow File

**Location:** `.github/workflows/ci.yml`

### Key Features

✅ **Concurrency control** - Cancel stale runs on same branch
✅ **Minimal permissions** - `contents: read` only
✅ **Caching** - npm cache between runs
✅ **Descriptive names** - Each step clearly labeled
✅ **Artifact retention** - 30 days for reports
✅ **Always upload** - Playwright report even on failure (`if: always()`)

### Environment Variables

- **Build job:** Full set of secrets (needed for build context)
- **Unit tests:** Only `EXPIRY_WARNING_DAYS`
- **E2E tests:** `BYPASS_AUTH=true` + full secret set

---

## Troubleshooting

### Build fails with "SECRET not found"

**Problem:** Missing GitHub secret

**Solution:**
1. Check `ci.yml` for all secrets used
2. Go to repo Settings → Secrets
3. Add missing secret
4. Re-run workflow

### E2E tests fail with timeout

**Problem:** Playwright can't install browsers

**Solution:**
- Playwright install step uses `chromium` only (faster)
- If needed, add `firefox` or `webkit`

### Type check fails locally but passes in CI

**Problem:** Node version mismatch

**Solution:**
```bash
nvm use 20
npm ci
npm run build
```

### Lint job fails

**Problem:** Code style issues

**Solution:**
```bash
npx eslint src next.config.ts --fix
```

---

## Viewing Results

### Real-time Status

1. Go to repo → **Actions**
2. See all workflow runs
3. Click run to see logs

### After Failure

1. Click failed job name (e.g., "Build & Type Check")
2. Expand failed step
3. Read error message
4. Fix locally

### Playwright Report

1. Actions → Latest run
2. Artifacts section → `playwright-report-<id>`
3. Download → Extract → Open `index.html` in browser

---

## Local Development vs CI

| Aspect | Local | CI |
|--------|-------|-----|
| Node version | Any | 20 (pinned) |
| Secrets | `.env.local` | GitHub Secrets |
| BYPASS_AUTH | `true` (dev) | `true` (E2E only) |
| Build | `npm run dev` | `npm run build` |
| Cache | disk | GitHub cache |
| Speed | Fast | ~60 seconds |

---

## Performance

**Total CI time:** ~60 seconds

| Job | Time |
|-----|------|
| Unit tests | ~8s |
| Build | ~30s |
| E2E tests | ~20s |
| Lint | ~5s |
| Setup/overhead | ~10s |

**Concurrency:** Jobs run in parallel (not sequential)

---

## Next Steps

### To Add More Tests
1. Create tests in `src/tests/unit/` or `src/tests/e2e/`
2. They run automatically in CI
3. Commit and push

### To Re-run Workflow
1. Actions → Latest run
2. Click "Re-run all jobs"
3. View output

---

## Branch Protection Rules

Recommend setting in GitHub:

**Settings → Branches → Branch protection rules → main**

- ✅ Require status checks to pass:
  - `test-unit`
  - `build`
  - `test-e2e`
  - `lint`
- ✅ Require branches to be up to date
- ✅ Dismiss stale PR approvals

---

**Last updated:** 2025-01-15  
**Maintained by:** Copilot
