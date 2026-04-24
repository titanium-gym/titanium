# Security Architecture

## Authentication

- **Google OAuth only** — no self-registration, no username/password forms.
- **Email allowlist** — NextAuth's `signIn` callback compares `profile.email` to `ALLOWED_EMAIL`. Any other account is rejected server-side before a session is created.
- **Signed JWT** — sessions use JWTs signed with `NEXTAUTH_SECRET` (minimum 32 chars). Without a valid secret, all tokens are invalid.
- **Session expiry** — 24 hours. After expiry the middleware redirects to `/login`.

## Route Protection

The Next.js middleware (`src/middleware.ts`) intercepts **all requests** before they reach any page or API route:

```
Request → Middleware → Valid session? → Yes → Content
                                      → No  → Redirect /login
```

Public routes (not protected):
- `/login`
- `/api/auth/*` (NextAuth callbacks)
- Static assets (`_next/static`, `_next/image`, etc.)

## Database

- **Supabase is never accessed from the client** — only from Next.js API routes using `SUPABASE_SERVICE_ROLE_KEY`.
- **RLS enabled** — Row Level Security is active on all tables. There are no public policies; the `service_role` key bypasses RLS on the server.
- **`SUPABASE_SERVICE_ROLE_KEY` is a server-only variable** — it is never bundled into the client.

## Cron Endpoint

`/api/cron/check-expiry` validates an `Authorization: Bearer <CRON_SECRET>` header on every invocation. Without this header it returns `401` without executing any logic.

## HTTP Security Headers

Configured in `next.config.ts` (static headers applied to all routes):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

The middleware adds a per-request **CSP nonce** via `src/middleware.ts`, and applies an **in-memory IP-based rate limiter** to all non-auth, non-cron routes.

## Login Page Disclosure

The `/login` page is designed to minimise information leakage:
- No references to "Next.js", "Supabase", "dashboard", or internal routes.
- Only a Google OAuth button is exposed — no hints about the underlying stack.

## Sensitive Environment Variables

| Variable | Sensitivity | Notes |
|----------|-------------|-------|
| `NEXTAUTH_SECRET` | 🔴 Critical | Signs all JWTs. Rotate immediately if compromised |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 Critical | Full database access. Server-only, never expose to client |
| `GOOGLE_CLIENT_SECRET` | 🔴 Critical | Never expose to the client |
| `CRON_SECRET` | 🟡 High | Secures the cron endpoint |
| `RESEND_API_KEY` | 🟡 High | Server-only |

## Generating Secrets

```bash
# NEXTAUTH_SECRET and CRON_SECRET
openssl rand -base64 32
```
