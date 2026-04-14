import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils/expiry";
import { format, addDays, subDays } from "date-fns";

const TODAY = new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd");

describe("getExpiryStatus", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 'expired' when expires_at is in the past", () => {
    const pastDate = fmt(subDays(TODAY, 1));
    expect(getExpiryStatus(pastDate)).toBe("expired");
  });

  it("returns 'expired' for a date well in the past", () => {
    const pastDate = fmt(subDays(TODAY, 30));
    expect(getExpiryStatus(pastDate)).toBe("expired");
  });

  it("returns 'expiring-soon' when expires_at is today", () => {
    const todayStr = fmt(TODAY);
    expect(getExpiryStatus(todayStr, 3)).toBe("expiring-soon");
  });

  it("returns 'expiring-soon' when expires_at is within warningDays", () => {
    const soonDate = fmt(addDays(TODAY, 2));
    expect(getExpiryStatus(soonDate, 3)).toBe("expiring-soon");
  });

  it("returns 'expiring-soon' exactly at warningDays boundary", () => {
    const boundaryDate = fmt(addDays(TODAY, 3));
    expect(getExpiryStatus(boundaryDate, 3)).toBe("expiring-soon");
  });

  it("returns 'active' when expires_at is beyond warningDays", () => {
    const futureDate = fmt(addDays(TODAY, 10));
    expect(getExpiryStatus(futureDate, 3)).toBe("active");
  });

  it("uses custom warningDays parameter", () => {
    const date7 = fmt(addDays(TODAY, 7));
    expect(getExpiryStatus(date7, 7)).toBe("expiring-soon");
    expect(getExpiryStatus(date7, 3)).toBe("active");
  });
});

describe("getDaysUntilExpiry", () => {
  it("returns 0 for today", () => {
    expect(getDaysUntilExpiry(fmt(TODAY))).toBe(0);
  });

  it("returns negative for past dates", () => {
    const past = fmt(subDays(TODAY, 5));
    expect(getDaysUntilExpiry(past)).toBe(-5);
  });

  it("returns positive for future dates", () => {
    const future = fmt(addDays(TODAY, 10));
    expect(getDaysUntilExpiry(future)).toBe(10);
  });
});
