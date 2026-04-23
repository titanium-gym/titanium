/**
 * Global setup for Playwright tests
 * Configured to use mock API responses to avoid production database
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { chromium } from "@playwright/test";

async function globalSetup() {
  // Set environment to use mocks
  process.env.PLAYWRIGHT_TEST_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  // Could add additional global setup here if needed
  // (e.g., database setup, credential setup, etc.)

  return async () => {
    // Global teardown (if needed)
  };
}

export default globalSetup;
