import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/setup-mocks";

/**
 * Member API Tests
 * Tests API functionality and security
 * Uses mocks to avoid database dependencies in tests
 */

test.describe("Member API - Authentication", () => {
  test("unauthenticated GET /api/members returns 401 (skipped in BYPASS_AUTH)", async ({ request }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    const res = await request.get("/api/members");
    expect(res.status()).toBe(401);
  });

  test("unauthenticated POST /api/members returns 401 (skipped in BYPASS_AUTH)", async ({ request }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    const res = await request.post("/api/members", {
      data: { full_name: "Test" },
    });
    expect(res.status()).toBe(401);
  });

  test("unauthenticated PUT /api/members/:id returns 401 (skipped in BYPASS_AUTH)", async ({ request }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    const res = await request.put("/api/members/999", {
      data: { full_name: "Updated" },
    });
    expect(res.status()).toBe(401);
  });

  test("unauthenticated DELETE /api/members/:id returns 401 (skipped in BYPASS_AUTH)", async ({ request }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    const res = await request.delete("/api/members/999");
    expect(res.status()).toBe(401);
  });
});

test.describe("Member API - CRUD Operations with Mocks", () => {
  test("GET /api/members returns 200 OK", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    expect(res.status()).toBe(200);
  });

  test("GET /api/members returns array of members", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("POST /api/members creates new member", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "New Socio",
          fee_amount: 30,
          paid_at: "2024-01-01",
        }),
      });
      return res.status;
    });

    expect([200, 201]).toContain(status);
  });

  test("PUT /api/members/:id updates member", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/members/00000000-0000-0000-0000-000000000001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Updated",
          fee_amount: 35,
        }),
      });
      return res.status;
    });

    expect([200, 201]).toContain(status);
  });

  test("DELETE /api/members/:id deletes member", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/members/00000000-0000-0000-0000-000000000001", {
        method: "DELETE",
      });
      return res.status;
    });

    expect([200, 204]).toContain(status);
  });
});

test.describe("Member API - Data Validation", () => {
  test("member objects contain required fields", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json() as Array<Record<string, unknown>>;

    data.forEach((member) => {
      expect(member).toHaveProperty("id");
      expect(member).toHaveProperty("full_name");
      expect(member).toHaveProperty("fee_amount");
      expect(member).toHaveProperty("paid_at");
      expect(member).toHaveProperty("expires_at");
    });
  });

  test("member fee_amount is 30 or 35", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json() as Array<Record<string, unknown>>;

    data.forEach((member) => {
      expect([30, 35]).toContain(member.fee_amount);
    });
  });

  test("member dates are in valid ISO format", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json() as Array<Record<string, unknown>>;

    data.forEach((member) => {
      expect(String(member.paid_at)).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(String(member.expires_at)).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });
});
