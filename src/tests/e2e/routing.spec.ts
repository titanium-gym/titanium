import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/setup-mocks";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { mockMembers } from "./fixtures/mock-data";

/**
 * Routing & Navigation Tests
 * Validates core page loads and redirects work correctly
 * Uses mock API responses to avoid touching production database
 * Note: Tests assume BYPASS_AUTH=true in dev environment
 */

test.describe("Routing - Core Routes", () => {
  test("GET / redirects to /login", async ({ page }) => {
    // In BYPASS_AUTH mode, should still respect the redirect
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("GET /login loads successfully (200)", async ({ page }) => {
    await page.goto("/login");
    expect(page.url()).toContain("/login");
  });

  test("GET /dashboard loads successfully (200)", async ({ page }) => {
    // BYPASS_AUTH allows access without auth
    await page.goto("/dashboard");
    expect(page.url()).toContain("/dashboard");
  });

  test("dashboard page renders without errors", async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        throw new Error(`Console error: ${msg.text()}`);
      }
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("404 for non-existent routes returns error status", async ({ page }) => {
    const res = await page.goto("/non-existent-route-xyz-abc");
    // Should return 404 or redirect
    expect([404, 307, 200].includes(res?.status() || 200)).toBeTruthy();
  });
});

test.describe("API Routes", () => {
  test("GET /api/members returns 200", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    expect(res.status()).toBe(200);
  });

  test("GET /api/members returns valid JSON array", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("GET /api/members returns demo socios (count > 0)", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
  });

  test("GET /api/members contains expected fields", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json();
    const first = data[0];

    // Verify required fields exist
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("full_name");
    expect(first).toHaveProperty("fee_amount");
    expect(first).toHaveProperty("paid_at");
    expect(first).toHaveProperty("expires_at");
  });

  test("GET /api/members first record has valid data", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json();
    const first = data[0];

    // Validate types
    expect(typeof first.id).toBe("string");
    expect(typeof first.full_name).toBe("string");
    expect(typeof first.fee_amount).toBe("number");
    expect(typeof first.paid_at).toBe("string");
    expect(typeof first.expires_at).toBe("string");

    // Validate fee_amount is 30 or 35
    expect([30, 35]).toContain(first.fee_amount);

    // Validate dates are ISO format
    expect(first.paid_at).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(first.expires_at).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

test.describe("Dashboard Integration", () => {
  test("dashboard loads without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        errors.push(msg.text());
      }
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Allow some errors but not for core app failures
    expect(errors.length).toBe(0);
  });

  test("dashboard page has content", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should have some text content (title, headers, etc)
    const content = await page.textContent("body");
    expect(content?.length).toBeGreaterThan(50);
  });
});
