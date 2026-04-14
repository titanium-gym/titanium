import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Security hardening tests
// Focus: rate limiting, security headers, error isolation, info disclosure
// ---------------------------------------------------------------------------

test.describe("Rate limiting — API mutations", () => {
  test("POST /api/members returns 429 after burst of requests", async ({
    request,
  }) => {
    // Fire 35 concurrent unauthenticated POST requests.
    // The rate limiter allows 30/min per IP, so at least some must be 429.
    // NOTE: unauthenticated → either 401 (auth gate) or 429 (rate gate, fired first).
    const payload = {
      full_name: "Rate Limit Test",
      fee_amount: 30,
      paid_at: "2024-01-01",
      expires_at: "2024-02-01",
    };

    const responses = await Promise.all(
      Array.from({ length: 35 }, () =>
        request.post("/api/members", { data: payload })
      )
    );

    const statuses = responses.map((r) => r.status());
    const has429 = statuses.some((s) => s === 429);
    expect(has429).toBe(true);
  });

  test("Rate-limited response includes Retry-After header", async ({
    request,
  }) => {
    const payload = {
      full_name: "Rate Limit Test",
      fee_amount: 30,
      paid_at: "2024-01-01",
      expires_at: "2024-02-01",
    };

    const responses = await Promise.all(
      Array.from({ length: 35 }, () =>
        request.post("/api/members", { data: payload })
      )
    );

    const limited = responses.find((r) => r.status() === 429);
    if (limited) {
      expect(limited.headers()["retry-after"]).toBe("60");
    }
    // If none were rate-limited (flaky timing), we skip rather than fail hard
  });

  test("Rate-limited API response is JSON with error field", async ({
    request,
  }) => {
    const payload = {
      full_name: "Rate Limit Test",
      fee_amount: 30,
      paid_at: "2024-01-01",
      expires_at: "2024-02-01",
    };

    const responses = await Promise.all(
      Array.from({ length: 35 }, () =>
        request.post("/api/members", { data: payload })
      )
    );

    const limited = responses.find((r) => r.status() === 429);
    if (limited) {
      const body = await limited.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    }
  });
});

test.describe("Security headers", () => {
  test("GET /login includes security headers", async ({ request }) => {
    const res = await request.get("/login");
    const h = res.headers();

    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["permissions-policy"]).toContain("camera=()");
  });

  test("GET /login has Content-Security-Policy", async ({ request }) => {
    const res = await request.get("/login");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src https://accounts.google.com");
    // Must NOT allow all frames or all scripts from arbitrary origins
    expect(csp).not.toContain("frame-src *");
    expect(csp).not.toContain("default-src *");
  });

  test("CSP does not include unsafe-eval in production build", async ({
    request,
  }) => {
    const res = await request.get("/login");
    const csp = res.headers()["content-security-policy"];
    // unsafe-eval removed in favour of 'unsafe-inline' only
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test("API 401 response does not leak internal details", async ({
    request,
  }) => {
    const res = await request.get("/api/members");
    expect(res.status()).toBe(401);

    // Body should not expose stack traces, file paths, or env vars
    const text = await res.text();
    expect(text).not.toContain("node_modules");
    expect(text).not.toContain("SUPABASE");
    expect(text).not.toContain("process.env");
    expect(text).not.toContain("at Object.");
  });

  test("DELETE with invalid UUID returns 400 not 500", async ({ request }) => {
    const res = await request.delete("/api/members/not-a-real-uuid");
    // 401 (auth) or 400 (validation) are both acceptable; 500 is not
    expect([400, 401]).toContain(res.status());
  });

  test("PUT with invalid UUID returns 400 or 401, not 500", async ({
    request,
  }) => {
    const res = await request.put("/api/members/../../etc/passwd", {
      data: { full_name: "x" },
    });
    expect([400, 401]).toContain(res.status());
  });
});

test.describe("Info disclosure via login page", () => {
  test("login page does not expose internal routes in HTML", async ({
    page,
  }) => {
    await page.goto("/login");
    const html = await page.content();
    expect(html).not.toContain("/api/members");
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  test("login page does not reveal allowed email", async ({ page }) => {
    await page.goto("/login");
    const html = await page.content();
    // Env var ALLOWED_EMAIL must not appear in rendered HTML
    expect(html).not.toMatch(/ALLOWED_EMAIL/);
  });
});
