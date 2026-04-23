import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/setup-mocks";

/**
 * User Workflows Tests
 * Tests the key user journeys:
 * - Login
 * - Sidebar navigation (Inicio & Socios)
 * - Create/New Socio
 * - Renew membership
 * - Edit member
 * - Delete member
 * - Logout
 */

test.describe("User Workflows", () => {
  test("Login: login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("Login: login page has Google sign-in button", async ({ page }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip(true, "Skipped in BYPASS_AUTH mode — auth flow is bypassed");
    }
    await page.goto("/login");
    await expect(
      page.locator("button, a[href*='google'], a[href*='auth']").first()
    ).toBeVisible();
  });

  test("Navigation: Inicio sidebar link navigates to dashboard", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard/socios");
    const inicioLink = page.getByRole("link", { name: "Inicio" });
    await expect(inicioLink).toBeVisible();
    await inicioLink.click();
    await page.waitForURL(/\/dashboard$/);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("Navigation: Socios sidebar link navigates to socios page", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");
    const sociosLink = page.getByRole("link", { name: "Socios" });
    await expect(sociosLink).toBeVisible();
    await sociosLink.click();
    await page.waitForURL(/\/socios/);
    await expect(page).toHaveURL(/\/socios/);
  });

  test("New Socio: socios page loads correctly", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard/socios");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/socios/);
  });

  test("New Socio: create button is visible and clickable", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard/socios");
    await page.waitForLoadState("networkidle");
    const createButton = page.getByRole("button", { name: /nuevo socio/i });
    await expect(createButton).toBeVisible();
  });

  test("Renew: member can be renewed via API", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.post("/api/members/1/renew", {
      data: { paid_at: "2025-01-01" },
    });
    expect([200, 201, 204]).toContain(res.status());
  });

  test("Edit: member can be edited via API", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.put("/api/members/1", {
      data: {
        full_name: "Updated Name",
        fee_amount: 35,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("Delete: member can be deleted via API", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.delete("/api/members/1");
    expect([200, 204]).toContain(res.status());
  });

  test("Bulk renew: multiple members can be renewed via API", async ({ page }) => {
    await setupApiMocks(page);
    const res = await page.request.post("/api/members/bulk-renew", {
      data: { ids: [1, 2, 3] },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("updated");
  });

  test("Logout: Salir button is visible in dashboard", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /salir/i })).toBeVisible();
  });

  test("Logout: clicking Salir redirects away from dashboard", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard");
    const logoutButton = page.getByRole("button", { name: /salir/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.waitForURL(/\/login/);
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});

test.describe("Member Operations - Full Workflow", () => {
  test("Complete CRUD workflow: create -> read -> update -> delete", async ({ page }) => {
    await setupApiMocks(page);

    const createRes = await page.request.post("/api/members", {
      data: {
        full_name: "Test Socio",
        fee_amount: 30,
        paid_at: "2025-01-01",
      },
    });
    expect([200, 201]).toContain(createRes.status());

    const readRes = await page.request.get("/api/members");
    expect(readRes.status()).toBe(200);
    const members = await readRes.json();
    expect(Array.isArray(members)).toBe(true);

    if (members.length > 0) {
      const updateRes = await page.request.put(`/api/members/${members[0].id}`, {
        data: { full_name: "Updated Socio" },
      });
      expect([200, 201]).toContain(updateRes.status());

      const deleteRes = await page.request.delete(`/api/members/${members[0].id}`);
      expect([200, 204]).toContain(deleteRes.status());
    }
  });
});
