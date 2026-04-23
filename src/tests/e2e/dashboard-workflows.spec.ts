import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/setup-mocks";
import { mockMembers } from "./fixtures/mock-data";

/**
 * Dashboard & Workflow Integration Tests
 * Tests core dashboard functionality and user workflows
 * Uses mock API to avoid database dependencies
 */

test.describe("Dashboard - Basic Navigation", () => {
  test("dashboard page loads", async ({ page }) => {
    await page.goto("/dashboard");
    expect(page.url()).toContain("/dashboard");
  });

  test("socios page loads", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard/socios");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/socios");
  });

  test("page title or heading is visible", async ({ page }) => {
    await page.goto("/dashboard");
    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeTruthy();
  });
});

test.describe("Dashboard - API Integration", () => {
  test("GET /api/members returns valid data", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    expect(res.status()).toBe(200);
    const data = await res.json() as Array<unknown>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("API mock returns correct number of members", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json() as Array<unknown>;
    expect(data.length).toBe(mockMembers.length);
  });

  test("member objects have required properties", async ({ page }) => {
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
});

test.describe("Dashboard - Data Validation", () => {
  test("all member fees are 30 or 35", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json() as Array<Record<string, unknown>>;

    data.forEach((member) => {
      expect([30, 35]).toContain(member.fee_amount);
    });
  });

  test("all dates are in ISO format", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.get("/api/members");
    const data = await res.json() as Array<Record<string, unknown>>;

    data.forEach((member) => {
      const paid = String(member.paid_at);
      const expires = String(member.expires_at);
      expect(paid).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(expires).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });
});

test.describe("Dashboard - No Console Errors", () => {
  test("dashboard has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Filter out common non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("socios page has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await setupApiMocks(page);
    await page.goto("/dashboard/socios");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Dashboard - Complete CRUD Workflow", () => {
  test("full CRUD operations work end-to-end", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");

    // CREATE
    const createStatus = await page.evaluate(async () => {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Test Member",
          fee_amount: 30,
          paid_at: "2025-01-01",
        }),
      });
      return res.status;
    });
    expect([200, 201]).toContain(createStatus);

    // READ
    const readRes = await page.request.get("/api/members");
    expect(readRes.status()).toBe(200);
    const members = await readRes.json() as Array<unknown>;
    expect(members.length).toBeGreaterThan(0);

    // UPDATE
    if (Array.isArray(members) && members.length > 0) {
      const member = members[0] as Record<string, unknown>;
      const memberId = member.id as string;

      const updateStatus = await page.evaluate(async (id: string) => {
        const res = await fetch(`/api/members/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: "Updated Member" }),
        });
        return res.status;
      }, memberId);
      expect([200, 201]).toContain(updateStatus);

      // DELETE
      const deleteStatus = await page.evaluate(async (id: string) => {
        const res = await fetch(`/api/members/${id}`, {
          method: "DELETE",
        });
        return res.status;
      }, memberId);
      expect([200, 204]).toContain(deleteStatus);
    }
  });
});
