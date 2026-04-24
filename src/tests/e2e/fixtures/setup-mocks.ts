/**
 * Playwright hook for intercepting API calls during E2E tests
 * Replaces real API calls with mocked responses to avoid touching production database
 */

import { Page } from "@playwright/test";
import { mockMembers } from "./mock-data";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function nextMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Setup API mocks for a test page
 * Intercepts /api/members calls and returns mock data
 */
export async function setupApiMocks(page: Page) {
  // Intercept purge route BEFORE the catch-all to avoid being shadowed
  await page.route("**/api/members/purge**", async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ members: [mockMembers[0], mockMembers[1]], count: 2 }),
      });
    } else if (method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ deleted: 2 }),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept individual member routes: /api/members/:id and /api/members/:id/renew
  await page.route("**/api/members/**", async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (url.includes("/bulk-renew")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ updated: [mockMembers[0]] }),
      });
      return;
    }

    if (url.includes("/renew")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, expires_at: nextMonth() }),
      });
      return;
    }

    // /api/members/:id
    const member = {
      ...mockMembers[0],
      paid_at: today(),
      expires_at: nextMonth(),
    };

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(member),
      });
    } else if (method === "PUT" || method === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...member, full_name: "Socio Actualizado" }),
      });
    } else if (method === "DELETE") {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });

  // Intercept the members list/create route: /api/members (exact)
  await page.route("**/api/members", async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMembers),
      });
    } else if (method === "POST") {
      const newMember = {
        id: 999,
        full_name: "Nuevo Socio",
        phone: "+34 612345678",
        fee_amount: 30,
        paid_at: today(),
        expires_at: nextMonth(),
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newMember),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Disable API mocks (use real API)
 */
export async function disableApiMocks(page: Page) {
  await page.unroute("**/api/members/purge**");
  await page.unroute("**/api/members/**");
  await page.unroute("**/api/members");
}

