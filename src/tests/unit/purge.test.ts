import { describe, it, expect } from "vitest";
import { format, subDays, parseISO } from "date-fns";
import { daysSchema, computeThreshold } from "@/lib/utils/purge";

function cutoffStr(days: number): string {
  return format(computeThreshold(days), "yyyy-MM-dd");
}

function isExpiredByDays(expiresAt: string, days: number): boolean {
  return expiresAt < cutoffStr(days);
}

describe("purge threshold logic", () => {
  it("cutoff is exactly N days before today", () => {
    const cutoff = cutoffStr(60);
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

  it("daysSchema enforces min=7, max=3650", () => {
    const valid = [7, 30, 60, 365, 3650];
    const invalid = [0, 1, 6, -1, 3651, 10000];
    valid.forEach((d) => expect(daysSchema.safeParse(d).success).toBe(true));
    invalid.forEach((d) => expect(daysSchema.safeParse(d).success).toBe(false));
  });

  it("cutoff dates are ordered correctly (more days = older cutoff)", () => {
    const cutoff30 = cutoffStr(30);
    const cutoff60 = cutoffStr(60);
    const cutoff90 = cutoffStr(90);
    expect(parseISO(cutoff30) > parseISO(cutoff60)).toBe(true);
    expect(parseISO(cutoff60) > parseISO(cutoff90)).toBe(true);
  });
});
