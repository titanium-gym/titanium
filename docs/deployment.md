# Deployment Guide

## Quick Checklist (first deployment)

- [ ] Supabase: run SQL migration
- [ ] Google Cloud: add redirect URIs
- [ ] Vercel: create project and set environment variables
- [ ] GitHub: add secrets for CI/CD
- [ ] Push to `main` for automatic deployment

---

## 1. Database — Supabase

### Create tables (once per environment)

Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new) and run:

```
supabase/migrations/001_complete_schema.sql
```

> ⚠️ Migrations are **manual** — there is no automated migration step in CI/CD.
> Every time you add a new migration, run it manually in the Supabase Dashboard.

### Get credentials

Go to Supabase → Settings → API:
- **`SUPABASE_URL`**: Project URL (e.g. `https://xxxx.supabase.co`)
- **`SUPABASE_SERVICE_ROLE_KEY`**: `service_role` key — never expose to the client

---

## 2. Google OAuth

### Create credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create credential → OAuth 2.0 Client ID → Web application
3. Add **Authorized redirect URIs**:

| Environment | URI |
|-------------|-----|
| Local | `http://localhost:3000/api/auth/callback/google` |
| Production | `https://your-domain.vercel.app/api/auth/callback/google` |

---

## 3. Vercel — first deployment

### Link project

```bash
npm i -g vercel
vercel login
vercel link   # link to existing project or create a new one
```

Running `vercel link` creates `.vercel/project.json` with `orgId` and `projectId`.

### Configure environment variables

Go to Vercel Dashboard → your project → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Use a different value than local |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | No trailing slash |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | |
| `ALLOWED_EMAILS` | Your authorized Google accounts (comma-separated) | e.g. `owner@gmail.com,user@gmail.com` |
| `SUPABASE_URL` | From Supabase → Settings → API | |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API | |

### First manual deploy

```bash
vercel --prod
```

---

## 4. GitHub Actions — CI/CD

Add secrets under GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `NEXTAUTH_SECRET` | Same as Vercel |
| `GOOGLE_CLIENT_ID` | Same as Vercel |
| `GOOGLE_CLIENT_SECRET` | Same as Vercel |
| `ALLOWED_EMAILS` | Same as Vercel |
| `SUPABASE_URL` | Same as Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as Vercel |

Also add these for the keep-alive workflow:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as above |

### Automatic flow

```
PR opened  → CI (unit tests + type check + build) must pass
Push main  → tests pass → Vercel auto-deploys to production
Daily cron → keep-alive.yml sends 25 read requests to prevent Supabase free-tier pause
```

---

## Rollback

```bash
# List recent deployments
vercel list

# Promote a previous deployment to production
vercel promote <deployment-url>
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | URI not registered in Google Cloud | Add the exact URI in OAuth credentials |
| `Unauthorized` on login | Email is not in `ALLOWED_EMAILS` | Verify the value in Vercel env vars |
| `Could not find table 'members'` | Migration not run | Execute `001_complete_schema.sql` in Supabase SQL Editor |
