import { describe, it, expect } from "vitest";
import { parseISO, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

type MockMember = { paid_at: string; fee_amount: number };

/** Replicates the feeData bucketing logic from OverviewCharts.tsx */
function computeFeeData(members: MockMember[]): Record<string, { "30 €": number; "35 €": number }> {
  const buckets: Record<string, { "30 €": number; "35 €": number }> = {};
  for (const m of members) {
    const month = format(parseISO(m.paid_at), "MMM yy", { locale: es });
    if (!buckets[month]) buckets[month] = { "30 €": 0, "35 €": 0 };
    const fee = Number(m.fee_amount);
    if (fee === 30) buckets[month]["30 €"] += fee;
    else buckets[month]["35 €"] += fee;
  }
  return buckets;
}

describe("income chart bucketing", () => {
  it("sums fee_amount in euros, not counts members", () => {
    const members: MockMember[] = [
      { paid_at: "2025-01-10", fee_amount: 30 },
      { paid_at: "2025-01-20", fee_amount: 30 },
      { paid_at: "2025-01-25", fee_amount: 35 },
    ];
    const data = computeFeeData(members);
    const janKey = format(parseISO("2025-01-10"), "MMM yy", { locale: es });

    expect(data[janKey]["30 €"]).toBe(60);  // 2 × 30€ = 60€
    expect(data[janKey]["35 €"]).toBe(35);  // 1 × 35€ = 35€
  });

  it("attributes payments to the month of paid_at, not expires_at", () => {
    // paid Jan 16, expires Feb 16 → must count in January, NOT February
    const members: MockMember[] = [
      { paid_at: "2025-01-16", fee_amount: 30 },
    ];
    const data = computeFeeData(members);
    const janKey = format(parseISO("2025-01-16"), "MMM yy", { locale: es });
    const febKey = format(parseISO("2025-02-16"), "MMM yy", { locale: es });

    expect(data[janKey]["30 €"]).toBe(30);
    expect(data[febKey]).toBeUndefined();
  });

  it("resets each month — February shows only February payments", () => {
    const members: MockMember[] = [
      { paid_at: "2025-01-10", fee_amount: 30 },  // January payer
      { paid_at: "2025-02-05", fee_amount: 35 },  // February renewal
    ];
    const data = computeFeeData(members);
    const janKey = format(parseISO("2025-01-10"), "MMM yy", { locale: es });
    const febKey = format(parseISO("2025-02-05"), "MMM yy", { locale: es });

    expect(data[janKey]["30 €"]).toBe(30);
    expect(data[janKey]["35 €"]).toBe(0);
    expect(data[febKey]["30 €"]).toBe(0);
    expect(data[febKey]["35 €"]).toBe(35);
  });

  it("month with no payments returns 0 for both tiers", () => {
    const members: MockMember[] = [
      { paid_at: "2025-01-10", fee_amount: 30 },
    ];
    const data = computeFeeData(members);
    const marchKey = format(parseISO("2025-03-01"), "MMM yy", { locale: es });

    expect(data[marchKey]).toBeUndefined();
    // Chart renders 0 via nullish coalescing: buckets[m]?.["30 €"] ?? 0
    expect(data[marchKey]?.["30 €"] ?? 0).toBe(0);
  });

  it("uses parseISO (local time) so first-of-month pays stay in correct month", () => {
    // "2025-02-01" parsed as UTC midnight = 2025-01-31T23:00 in UTC+1
    // parseISO("2025-02-01") in local time = 2025-02-01T00:00 → correct
    const date = "2025-02-01";
    const localMonth = format(parseISO(date), "MMM yy", { locale: es });
    const utcMonth = format(new Date(date), "MMM yy", { locale: es });

    // parseISO always lands in Feb regardless of timezone
    expect(localMonth).toBe(format(startOfMonth(new Date(2025, 1, 1)), "MMM yy", { locale: es }));
    // Note: utcMonth may differ in UTC+ timezones — that's the bug we fixed
    void utcMonth; // documented intentionally, not asserted (timezone-dependent)
  });

  it("multiple members in same month accumulate correctly", () => {
    const members: MockMember[] = [
      { paid_at: "2025-03-01", fee_amount: 30 },
      { paid_at: "2025-03-05", fee_amount: 35 },
      { paid_at: "2025-03-10", fee_amount: 30 },
      { paid_at: "2025-03-15", fee_amount: 35 },
      { paid_at: "2025-03-20", fee_amount: 30 },
    ];
    const data = computeFeeData(members);
    const marKey = format(parseISO("2025-03-01"), "MMM yy", { locale: es });

    expect(data[marKey]["30 €"]).toBe(90);  // 3 × 30€
    expect(data[marKey]["35 €"]).toBe(70);  // 2 × 35€
  });
});
