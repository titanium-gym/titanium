import { describe, it, expect, vi, afterEach } from "vitest";
import { currentMonthRange, renewalExpiry, todayISO } from "@/lib/utils/date";
import { getExpiryStatus } from "@/lib/utils/expiry";
import { escapeCsvCell } from "@/lib/utils/csv";

describe("todayISO", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the Madrid date when UTC is still on the previous day", () => {
    vi.useFakeTimers({ now: new Date("2025-07-31T22:30:00Z") });

    expect(todayISO()).toBe("2025-08-01");
    expect(currentMonthRange()).toEqual({ start: "2025-08-01", end: "2025-08-31" });
  });

  it("does not mark a member expired on their last day after midnight in Madrid", () => {
    vi.useFakeTimers({ now: new Date("2025-07-30T22:30:00Z") });

    expect(getExpiryStatus("2025-07-31", 0)).toBe("expiring-soon");
    expect(getExpiryStatus("2025-07-30", 0)).toBe("expired");
  });
});

describe("renewalExpiry", () => {
  it("extends from the current expiry when there is prepaid time", () => {
    expect(renewalExpiry("2025-03-20", "2025-03-01")).toBe("2025-04-20");
  });

  it("extends from today when the member has expired", () => {
    expect(renewalExpiry("2025-01-15", "2025-03-01")).toBe("2025-04-01");
  });
});

describe("escapeCsvCell", () => {
  it.each(["=1+1", "+34600", "-2", "@SUM(A1)"])("neutralizes the formula in %s", (value) => {
    expect(escapeCsvCell(value)).toBe(`"'${value}"`);
  });

  it("leaves ordinary text alone and doubles quotes", () => {
    expect(escapeCsvCell('Ana "la" Ruiz')).toBe('"Ana ""la"" Ruiz"');
  });
});
