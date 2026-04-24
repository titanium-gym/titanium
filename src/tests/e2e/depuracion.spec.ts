import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/setup-mocks";

test.describe("Depuración page", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/dashboard/depuracion");
  });

  test("renders the page with heading and input", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Depuración" })).toBeVisible();
    await expect(page.getByLabel("Días vencidos")).toBeVisible();
    await expect(page.getByRole("button", { name: /previsualizar/i })).toBeVisible();
  });

  test("default days value is 60", async ({ page }) => {
    const input = page.getByLabel("Días vencidos");
    await expect(input).toHaveValue("60");
  });

  test("shows validation error when days < 7", async ({ page }) => {
    await page.getByLabel("Días vencidos").fill("3");
    await expect(page.getByText(/mínimo 7 días/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /previsualizar/i })).toBeDisabled();
  });

  test("preview shows affected members and delete button", async ({ page }) => {
    await page.getByRole("button", { name: /previsualizar/i }).click();
    // Mock returns 2 members
    await expect(page.getByText(/2 socios a eliminar/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /eliminar 2/i })).toBeVisible();
  });

  test("clicking delete shows confirmation dialog", async ({ page }) => {
    await page.getByRole("button", { name: /previsualizar/i }).click();
    await page.getByRole("button", { name: /eliminar 2/i }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText(/esta acción no se puede deshacer/i)).toBeVisible();
  });

  test("confirming deletion shows success toast", async ({ page }) => {
    await page.getByRole("button", { name: /previsualizar/i }).click();
    await page.getByRole("button", { name: /eliminar 2/i }).click();
    // Confirm in AlertDialog
    await page.getByRole("button", { name: /^eliminar$/i }).click();
    await expect(page.getByText(/socios eliminados correctamente/i)).toBeVisible();
  });

  test("cancelling dialog does not delete", async ({ page }) => {
    await page.getByRole("button", { name: /previsualizar/i }).click();
    await page.getByRole("button", { name: /eliminar 2/i }).click();
    await page.getByRole("button", { name: /cancelar/i }).click();
    // Dialog closed, preview still visible
    await expect(page.getByRole("alertdialog")).not.toBeVisible();
    await expect(page.getByText(/2 socios a eliminar/i)).toBeVisible();
  });
});
