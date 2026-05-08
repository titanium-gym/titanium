# Multi-Provider Google Auth — Design Spec

## Context

Titanium is a private gym management app used by two people:
- **Owner**: developer/administrator with their own GCP project and OAuth credentials
- **User**: gym operator with their own GCP project and OAuth credentials

Both have identical admin permissions. The goal is **full credential independence**: if one GCP project fails or credentials are rotated, the other user is unaffected.

## Design

### Two Independent Google OAuth Providers

Replace the single Google provider with two named providers in NextAuth:

- `google-1` → Owner's GCP project (`GOOGLE_CLIENT_ID_1` / `GOOGLE_CLIENT_SECRET_1`)
- `google-2` → User's GCP project (`GOOGLE_CLIENT_ID_2` / `GOOGLE_CLIENT_SECRET_2`)

Each provider is **locked to one specific email** via the `signIn` callback. Authenticating with the wrong email for a given provider results in access denied.

### Email-First Login Flow

The login page collects the user's email before initiating OAuth:

1. User enters their Gmail address and clicks "Continuar con Google"
2. Server action calls `resolveProvider(email)` — maps email → provider ID
3. If no match: redirect to `/login?error=unauthorized` (generic error, no disclosure)
4. If match: call `signIn(providerId, { redirectTo: "/dashboard" })`
5. Google OAuth completes → `signIn` callback re-validates `profile.email` matches that provider's allowed email
6. Session created → user lands on dashboard

### Security

- **Email comparison is case-insensitive** throughout (`email.toLowerCase()`)
- **`resolveProvider` runs server-side only** — email↔provider mapping never reaches the client bundle
- **Double validation**: email checked in `resolveProvider` (pre-OAuth) and again in `signIn` callback (post-OAuth) — defense in depth
- **Generic error messages**: "Cuenta no autorizada" regardless of reason — no information disclosure
- **BYPASS_AUTH preserved** for non-production testing (E2E test suite unaffected)

### Environment Variables

```env
# Provider 1 (Owner)
GOOGLE_CLIENT_ID_1=...
GOOGLE_CLIENT_SECRET_1=...
ALLOWED_EMAIL_1=owner@gmail.com

# Provider 2 (User)
GOOGLE_CLIENT_ID_2=...
GOOGLE_CLIENT_SECRET_2=...
ALLOWED_EMAIL_2=user@gmail.com
```

**Removed**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`, `ALLOWED_EMAIL`

### Auth Logic

**`resolveProvider(email: string): string | null`** (server-side helper)
```
email === ALLOWED_EMAIL_1 → "google-1"
email === ALLOWED_EMAIL_2 → "google-2"
otherwise               → null
```

**`signIn` callback** (post-OAuth validation)
```
provider === "google-1" AND profile.email === ALLOWED_EMAIL_1 → allow
provider === "google-2" AND profile.email === ALLOWED_EMAIL_2 → allow
otherwise                                                      → deny
```

**`authorized` callback** (per-request middleware check)
```
BYPASS_AUTH=true AND not production → allow
session.user.email in [ALLOWED_EMAIL_1, ALLOWED_EMAIL_2] → allow
otherwise → deny
```

## Files Changed

| File | Change |
|------|--------|
| `src/auth.ts` | Two Google providers with `id: "google-1"` / `id: "google-2"` |
| `src/auth.config.ts` | New `signIn` + `authorized` callbacks; add `resolveProvider` helper; remove `isEmailAllowed` |
| `src/app/login/page.tsx` | Email input field; updated Server Action to call `resolveProvider` |
| `.env.example` | New vars (`_1`, `_2`); remove old single vars |
| `src/tests/unit/auth-config.test.ts` | New — unit tests for `resolveProvider`, `signIn` callback, `authorized` callback |

## Out of Scope

- Role-based access control (both users have identical permissions)
- Session display of which user is logged in (already works via NextAuth session)
- Multiple emails per provider
