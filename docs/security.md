# Security Architecture

## Authentication

- **Google OAuth only** — no self-registration, no username/password forms.
- **Email allowlist** — NextAuth's `signIn` callback checks `profile.email` against the `ALLOWED_EMAILS` list. Any other account is rejected server-side before a session is created.
- **Signed JWT** — sessions use JWTs signed with `NEXTAUTH_SECRET` (minimum 32 chars). Without a valid secret, all tokens are invalid.
- **Session expiry** — 4 hours. After expiry the middleware redirects to `/login`.

## Route Protection

The Next.js middleware (`src/middleware.ts`) intercepts **all requests** before they reach any page or API route:

```
Request → Middleware → Valid session? → Yes → Content
                                      → No  → Redirect /login
```

API requests get a `401` instead of a redirect. Pages and API handlers also check the session themselves (`requirePageAuth()` / `requireAuth()`), because layouts are skipped on client navigations.

Public routes (not protected):
- `/`, `/login`, `/robots.txt` and the apple-touch icons (`PUBLIC_PATHS` in `src/middleware.ts`)
- `/api/auth/*` (NextAuth callbacks)
- Static assets (`_next/static`, `_next/image`, etc.)

## Database

- **Supabase is never accessed from the client** — only from server components and API routes using `SUPABASE_SERVICE_ROLE_KEY`.
- **RLS enabled** — Row Level Security is active on all tables, and the `service_role` key bypasses it on the server. The policies in `001_complete_schema.sql` grant full access to Supabase's `authenticated` role, which the app does not use, so keep Supabase Auth sign-ups disabled.
- **`SUPABASE_SERVICE_ROLE_KEY` is a server-only variable** — it is never bundled into the client.

## HTTP Security Headers

Configured in `next.config.ts` (static headers applied to all routes):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |

The middleware adds a per-request **CSP nonce** via `src/middleware.ts`, and applies an **in-memory IP-based rate limiter** to all non-auth routes.

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

## Generating Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32
```
