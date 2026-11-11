import NextAuth from "next-auth";
import { authConfig, isSessionEmailAllowed } from "@/auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// ---------------------------------------------------------------------------
// Content Security Policy — generated per-request so we can embed a nonce.
// In production: nonce + strict-dynamic (no unsafe-inline for scripts).
// In development: relax to unsafe-inline + unsafe-eval for Turbopack HMR.
// ---------------------------------------------------------------------------

function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    "default-src 'self'",
    isProd
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Inline styles stay allowed: a nonce cannot cover style="" attributes,
    // which the login page, progress bars and charts rely on.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://lh3.googleusercontent.com",
    isProd
      ? "connect-src 'self' https://accounts.google.com"
      : "connect-src 'self' ws: wss: https://accounts.google.com",
    "frame-src https://accounts.google.com",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "base-uri 'self'",
  ].join("; ");
}

// ---------------------------------------------------------------------------
// Sliding-window in-memory rate limiter.
// Per-worker (Edge) — acceptable for a small private app.
// Multiple Vercel edge workers each maintain independent state, which is fine
// since the goal is deterrence, not perfect global counting.
// ---------------------------------------------------------------------------

interface Bucket {
  n: number;
  windowStart: number;
}

const hits = new Map<string, Bucket>();
const WINDOW_MS = 60_000; // 1 minute

interface Limit {
  scope: string;
  max: number;
}

function getLimit(pathname: string, method: string): Limit {
  if (pathname === "/login") return { scope: "login", max: 10 };
  if (
    pathname.startsWith("/api/") &&
    (method === "POST" || method === "PUT" || method === "DELETE")
  )
    return { scope: "api-write", max: 30 };
  if (pathname.startsWith("/api/")) return { scope: "api-read", max: 60 };
  return { scope: "page", max: 200 };
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Each scope counts on its own: a shared counter would let ordinary page
// views use up the much smaller /login allowance.
function allow(ip: string, limit: Limit): boolean {
  const now = Date.now();
  const key = `${ip}:${limit.scope}`;
  const bucket = hits.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    hits.set(key, { n: 1, windowStart: now });
    return true;
  }
  if (bucket.n >= limit.max) return false;
  bucket.n++;
  return true;
}

function maybeCleanup() {
  if (hits.size > 5_000) {
    const now = Date.now();
    for (const [k, v] of hits) {
      if (now - v.windowStart > WINDOW_MS) hits.delete(k);
    }
  }
}

// ---------------------------------------------------------------------------
// Middleware — rate limiting + NextAuth session check
// ---------------------------------------------------------------------------

// Everything else requires an allowed session. NextAuth ignores the
// `authorized` callback when middleware has a handler, so it is checked here.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/robots.txt",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
]);

export default auth((req) => {
  maybeCleanup();

  const ip = getIp(req);
  const { pathname } = req.nextUrl;
  const limit = getLimit(pathname, req.method);
  const isApi = pathname.startsWith("/api/");

  const rateLimitDisabled =
    process.env.NODE_ENV !== "production" &&
    process.env.RATE_LIMIT_DISABLED === "true";

  if (!rateLimitDisabled && !allow(ip, limit)) {
    if (isApi) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60", "Content-Type": "text/plain" },
    });
  }

  const authBypassed =
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_AUTH === "true";

  if (
    !authBypassed &&
    !PUBLIC_PATHS.has(pathname) &&
    !isSessionEmailAllowed(req.auth?.user?.email)
  ) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Next.js takes the nonce for its own scripts from the CSP *request* header,
  // so the policy has to be set on both the request and the response.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  matcher: [
    // Exclude: NextAuth callbacks, static assets
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
