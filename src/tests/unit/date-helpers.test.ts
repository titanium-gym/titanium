import { describe, it, expect, vi, afterEach } from "vitest";
import { currentMonthRange, renewalExpiry, todayISO, isPaymentDateCorrection } from "@/lib/utils/date";
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

describe("isPaymentDateCorrection", () => {
  const dates = (paid_at: string, expires_at: string) => ({ paid_at, expires_at });

  it("treats a shifted date with the same expiry as a correction", () => {
    expect(
      isPaymentDateCorrection(dates("2026-09-29", "2026-10-29"), dates("2026-10-01", "2026-10-29"))
    ).toBe(true);
  });

  it("treats a backdated fix as a correction", () => {
    expect(
      isPaymentDateCorrection(dates("2026-10-15", "2026-11-15"), dates("2026-10-07", "2026-11-07"))
    ).toBe(true);
  });

  it("treats a monthly renewal as a new payment", () => {
    expect(
      isPaymentDateCorrection(dates("2026-10-03", "2026-11-03"), dates("2026-11-03", "2026-12-03"))
    ).toBe(false);
  });

  it("treats an early renewal from the edit form as a new payment", () => {
    expect(
      isPaymentDateCorrection(dates("2026-09-29", "2026-10-29"), dates("2026-10-25", "2026-11-25"))
    ).toBe(false);
  });

  it("treats a prepaid month a few days later as a new payment", () => {
    expect(
      isPaymentDateCorrection(dates("2026-11-03", "2026-12-03"), dates("2026-11-05", "2027-01-03"))
    ).toBe(false);
  });
});
