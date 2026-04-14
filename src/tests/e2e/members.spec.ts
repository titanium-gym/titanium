import { test, expect } from "@playwright/test";

// NOTE: These tests require a running dev server with a valid session.
// In CI they run against a seeded test database.
// The test user must be authenticated via PLAYWRIGHT_TEST_SESSION cookie
// (set up via storageState in playwright.config.ts for full E2E runs).

// For now we test the API endpoints directly with a session
test.describe("Members API (unauthenticated)", () => {
  test("GET /api/members returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/members");
    expect(res.status()).toBe(401);
  });

  test("POST /api/members returns 401 without session", async ({ request }) => {
    const res = await request.post("/api/members", {
      data: { full_name: "Test User", fee_amount: 30, paid_at: "2024-01-01", expires_at: "2024-02-01" },
    });
    expect(res.status()).toBe(401);
  });

  test("PUT /api/members/:id returns 401 without session", async ({ request }) => {
    const res = await request.put("/api/members/fake-id", {
      data: { full_name: "Test User", fee_amount: 30, paid_at: "2024-01-01", expires_at: "2024-02-01" },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/members/:id returns 401 without session", async ({ request }) => {
    const res = await request.delete("/api/members/fake-id");
    expect(res.status()).toBe(401);
  });
});

test.describe("Cron endpoint security", () => {
  test("GET /api/cron/check-expiry returns 401 without secret", async ({ request }) => {
    const res = await request.get("/api/cron/check-expiry");
    expect(res.status()).toBe(401);
  });

  test("GET /api/cron/check-expiry returns 401 with wrong secret", async ({ request }) => {
    const res = await request.get("/api/cron/check-expiry", {
      headers: { authorization: "Bearer wrongsecret" },
    });
    expect(res.status()).toBe(401);
  });
});
