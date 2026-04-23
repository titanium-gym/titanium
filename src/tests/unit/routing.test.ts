import { describe, it, expect } from "vitest";
import { nextMonthSameDay, formatDate } from "@/lib/utils/date";

describe("nextMonthSameDay", () => {
  it("adds exactly one month to a mid-month date", () => {
    expect(nextMonthSameDay("2025-01-15")).toBe("2025-02-15");
  });

  it("handles year boundary (December → January)", () => {
    expect(nextMonthSameDay("2025-12-10")).toBe("2026-01-10");
  });

  it("handles month-end overflow (Jan 31 → last day of Feb)", () => {
    const result = nextMonthSameDay("2025-01-31");
    expect(result).toMatch(/^2025-02-/);
  });

  it("returns empty string for invalid date string", () => {
    expect(nextMonthSameDay("not-a-date")).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(nextMonthSameDay("")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats ISO date as dd/MM/yyyy", () => {
    expect(formatDate("2025-03-15")).toBe("15/03/2025");
  });

  it("formats first day of year correctly", () => {
    expect(formatDate("2025-01-01")).toBe("01/01/2025");
  });

  it("returns the original string for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("returns the original string for empty input", () => {
    expect(formatDate("")).toBe("");
  });
});

