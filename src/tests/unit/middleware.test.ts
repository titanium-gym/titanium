// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, type NextResponse } from "next/server";

// Make auth(handler) return the bare handler so it can be called with a fake session.
vi.mock("next-auth", () => ({
  default: () => ({ auth: (handler: unknown) => handler }),
}));

import middleware from "@/middleware";

type Session = { user: { email: string } } | null;

function run(
  path: string,
  session: Session,
  headers: Record<string, string> = {}
): NextResponse {
  const req = Object.assign(
    new NextRequest(`http://localhost:3000${path}`, { headers }),
    { auth: session }
  );
  return (middleware as unknown as (r: typeof req) => NextResponse)(req);
}

const allowed = { user: { email: "owner@example.com" } };

describe("middleware", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("ALLOWED_EMAILS", "owner@example.com");
    vi.stubEnv("BYPASS_AUTH", "false");
    vi.stubEnv("RATE_LIMIT_DISABLED", "true");
  });

  it("redirects anonymous page requests to /login", () => {
    const res = run("/dashboard/socios", null);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("blocks anonymous RSC requests that claim the layout is already loaded", () => {
    const tree = JSON.stringify([
      "",
      { children: ["dashboard", { children: ["__PAGE__", {}] }] },
      null,
      null,
      true,
    ]);

    const res = run("/dashboard/socios", null, {
      RSC: "1",
      "Next-Router-State-Tree": encodeURIComponent(tree),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("returns 401 JSON for anonymous API requests", async () => {
    const res = run("/api/members", null);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects a session whose email is not allowed", () => {
    const res = run("/dashboard", { user: { email: "other@example.com" } });

    expect(res.status).toBe(307);
  });

  it("lets an allowed session through", () => {
    const res = run("/dashboard/socios", allowed);

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/", "/login", "/robots.txt"])("keeps %s public", (path) => {
    const res = run(path, null);

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("honors BYPASS_AUTH outside production", () => {
    vi.stubEnv("BYPASS_AUTH", "true");
    vi.stubEnv("NODE_ENV", "test");

    expect(run("/dashboard", null).headers.get("x-middleware-next")).toBe("1");
  });

  it("ignores BYPASS_AUTH in production", () => {
    vi.stubEnv("BYPASS_AUTH", "true");
    vi.stubEnv("NODE_ENV", "production");

    expect(run("/dashboard", null).status).toBe(307);
  });

  it("sends the same nonce CSP on the request, so Next.js can apply it", () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = run("/login", null);
    const responseCsp = res.headers.get("content-security-policy");

    expect(responseCsp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(res.headers.get("x-middleware-request-content-security-policy")).toBe(responseCsp);
  });
});
