import { test, expect } from "@playwright/test";

/**
 * Authentication Tests
 * Note: In BYPASS_AUTH mode (development), these redirect tests are skipped
 * because auth is completely bypassed. These tests run in production CI only.
 */

test.describe("Authentication", () => {
  test("redirects unauthenticated user from /dashboard to /login", async ({
    page,
  }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated user from / to /login", async ({ page }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login page", () => {
  test("login page shows Google button", async ({ page }) => {
    if (process.env.BYPASS_AUTH === "true") {
      test.skip();
    }
    await page.goto("/login");
    // Should have an access button (Google)
    await expect(
      page.getByRole("button", { name: /acceder/i })
    ).toBeVisible();
  });

  test("login page does not expose internal details", async ({ page }) => {
    await page.goto("/login");
    const html = await page.content();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("/api/members");
  });
});
