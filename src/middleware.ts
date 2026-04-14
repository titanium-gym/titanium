import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

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
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://lh3.googleusercontent.com",
    isProd
      ? "connect-src 'self' https://accounts.google.com https://*.supabase.co"
      : "connect-src 'self' ws: wss: https://accounts.google.com https://*.supabase.co",
    "frame-src https://accounts.google.com",
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

function getLimit(pathname: string, method: string): number {
  if (pathname === "/login") return 10;
  if (
    pathname.startsWith("/api/") &&
    (method === "POST" || method === "PUT" || method === "DELETE")
  )
    return 30;
  if (pathname.startsWith("/api/")) return 60;
  return 200;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function allow(ip: string, limit: number): boolean {
  const now = Date.now();
  const bucket = hits.get(ip);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    hits.set(ip, { n: 1, windowStart: now });
    return true;
  }
  if (bucket.n >= limit) return false;
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

export default auth((req) => {
  maybeCleanup();

  const ip = getIp(req);
  const { pathname } = req.nextUrl;
  const limit = getLimit(pathname, req.method);

  if (!allow(ip, limit)) {
    const isApi = pathname.startsWith("/api/");
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

  // Attach a fresh nonce to the request headers (available to server components
  // via `headers().get("x-nonce")`) and set the CSP response header.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
});

export const config = {
  matcher: [
    // Exclude: NextAuth callbacks, static assets, cron (uses its own CRON_SECRET)
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
