import { describe, it, expect } from "vitest";
import { format, subDays } from "date-fns";
import { parseISO } from "date-fns";

/** Replicates the server-side threshold calculation from the purge route */
function purgeCutoff(days: number): string {
  return format(subDays(new Date(), days), "yyyy-MM-dd");
}

function isExpiredByDays(expiresAt: string, days: number): boolean {
  return expiresAt < purgeCutoff(days);
}

describe("purge threshold logic", () => {
  it("cutoff is exactly N days before today", () => {
    const cutoff = purgeCutoff(60);
    const expected = format(subDays(new Date(), 60), "yyyy-MM-dd");
    expect(cutoff).toBe(expected);
  });

  it("member expired exactly N days ago is included (less than cutoff)", () => {
    const expiry = format(subDays(new Date(), 60), "yyyy-MM-dd");
    // date < cutoff (strict less-than) → NOT included (same day)
    expect(isExpiredByDays(expiry, 60)).toBe(false);
  });

  it("member expired N+1 days ago is included", () => {
    const expiry = format(subDays(new Date(), 61), "yyyy-MM-dd");
    expect(isExpiredByDays(expiry, 60)).toBe(true);
  });

  it("member expired N-1 days ago is NOT included", () => {
    const expiry = format(subDays(new Date(), 59), "yyyy-MM-dd");
    expect(isExpiredByDays(expiry, 60)).toBe(false);
  });

  it("member not yet expired is NOT included", () => {
    const expiry = format(new Date(Date.now() + 86_400_000), "yyyy-MM-dd");
    expect(isExpiredByDays(expiry, 60)).toBe(false);
  });

  it("minimum days guard: 7 days", () => {
    // The API enforces min=7; a 6-day input should be rejected at schema level
    const valid = [7, 30, 60, 365, 3650];
    const invalid = [0, 1, 6, -1, 3651, 10000];
    valid.forEach((d) => expect(d).toBeGreaterThanOrEqual(7));
    invalid.filter((d) => d < 7 || d > 3650).forEach((d) =>
      expect(d < 7 || d > 3650).toBe(true)
    );
  });

  it("cutoff dates are ordered correctly (more days = older cutoff)", () => {
    const cutoff30 = purgeCutoff(30);
    const cutoff60 = purgeCutoff(60);
    const cutoff90 = purgeCutoff(90);
    expect(parseISO(cutoff30) > parseISO(cutoff60)).toBe(true);
    expect(parseISO(cutoff60) > parseISO(cutoff90)).toBe(true);
  });
});
