import { describe, it, expect } from "vitest";
import { nextMonthSameDay } from "@/lib/utils/date";

describe("nextMonthSameDay", () => {
  it("returns the same day in the next month", () => {
    expect(nextMonthSameDay("2024-03-15")).toBe("2024-04-15");
  });

  it("clamps Jan 31 to Feb 28 in a non-leap year", () => {
    expect(nextMonthSameDay("2023-01-31")).toBe("2023-02-28");
  });

  it("clamps Jan 31 to Feb 29 in a leap year", () => {
    expect(nextMonthSameDay("2024-01-31")).toBe("2024-02-29");
  });

  it("rolls Dec 31 to Jan 31", () => {
    expect(nextMonthSameDay("2024-12-31")).toBe("2025-01-31");
  });
});
