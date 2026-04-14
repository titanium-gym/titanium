import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated user from /dashboard to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated user from / to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows only Google button without internal info", async ({
    page,
  }) => {
    await page.goto("/login");
    // Should have an access button (Google)
    await expect(
      page.getByRole("button", { name: /acceder/i })
    ).toBeVisible();

    // Should NOT reveal what the app does
    const content = await page.textContent("body");
    expect(content).not.toContain("Next.js");
    expect(content).not.toContain("Supabase");
    expect(content).not.toContain("dashboard");
    expect(content).not.toContain("Panel");
    expect(content).not.toContain("Gestión");
    expect(content).not.toContain("socios");
    expect(content).not.toContain("gimnasio");
  });

  test("login page source does not reveal internal routes", async ({ page }) => {
    await page.goto("/login");
    const html = await page.content();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("/api/members");
  });
});
