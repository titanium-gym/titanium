import { describe, it, expect, vi } from "vitest";
import { format, parseISO, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import type { Member } from "@/lib/supabase";

// OverviewCharts is a "use client" component that imports recharts.
// Mock recharts so the pure computeFeeData function can be imported without
// triggering browser-only APIs during the test run.
vi.mock("recharts", () => ({}));

import { computeFeeData } from "@/components/dashboard/OverviewCharts";

// Minimal Member fixture — only the fields computeFeeData actually reads.
const baseMember: Member = {
  id: 1,
  full_name: "Test Member",
  phone: null,
  fee_amount: 30,
  paid_at: "2025-01-01",
  expires_at: "2025-02-01",
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function findBucket(data: ReturnType<typeof computeFeeData>, dateStr: string) {
  const key = format(parseISO(dateStr), "MMM yy", { locale: es });
  return data.find((d) => d.mes === key);
}

/** Returns a yyyy-MM-dd date in the month that is `n` calendar months before today. */
function dateInMonthsAgo(n: number, day = 10): string {
  const d = subMonths(new Date(), n);
  return format(new Date(d.getFullYear(), d.getMonth(), day), "yyyy-MM-dd");
}

describe("income chart bucketing", () => {
  it("sums fee_amount in euros, not counts members", () => {
    const paid = dateInMonthsAgo(2);
    const members: Member[] = [
      { ...baseMember, paid_at: paid, fee_amount: 30 },
      { ...baseMember, paid_at: paid, fee_amount: 30 },
      { ...baseMember, paid_at: paid, fee_amount: 35 },
    ];
    const data = computeFeeData(members);
    const bucket = findBucket(data, paid);

    expect(bucket?.["30 €"]).toBe(60); // 2 × 30€ = 60€
    expect(bucket?.["35 €"]).toBe(35); // 1 × 35€ = 35€
  });

  it("attributes payments to the month of paid_at, not another month", () => {
    const paid = dateInMonthsAgo(1);
    const members: Member[] = [{ ...baseMember, paid_at: paid, fee_amount: 30 }];
    const data = computeFeeData(members);

    // Payment must appear in the paid month
    const correct = findBucket(data, paid);
    expect(correct?.["30 €"]).toBe(30);

    // Must NOT appear in a different month
    const other = findBucket(data, dateInMonthsAgo(3));
    expect(other?.["30 €"]).toBe(0);
  });

  it("resets each month — different months show only their payments", () => {
    const twoAgo = dateInMonthsAgo(2);
    const lastMonth = dateInMonthsAgo(1);
    const members: Member[] = [
      { ...baseMember, paid_at: twoAgo, fee_amount: 30 },
      { ...baseMember, paid_at: lastMonth, fee_amount: 35 },
    ];
    const data = computeFeeData(members);

    const b1 = findBucket(data, twoAgo);
    const b2 = findBucket(data, lastMonth);
    expect(b1?.["30 €"]).toBe(30);
    expect(b1?.["35 €"]).toBe(0);
    expect(b2?.["30 €"]).toBe(0);
    expect(b2?.["35 €"]).toBe(35);
  });

  it("month with no payments returns 0 for both tiers", () => {
    const data = computeFeeData([]);

    // computeFeeData always returns exactly the last 6 calendar months
    expect(data.length).toBe(6);
    data.forEach((bucket) => {
      expect(bucket["30 €"]).toBe(0);
      expect(bucket["35 €"]).toBe(0);
    });
  });

  it("uses parseISO (local time) so first-of-month payments stay in correct month", () => {
    const lastMonth = subMonths(new Date(), 1);
    // "first of last month" as a date-only string
    const firstOfMonth = format(
      new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      "yyyy-MM-dd"
    );
    const members: Member[] = [{ ...baseMember, paid_at: firstOfMonth, fee_amount: 30 }];
    const data = computeFeeData(members);

    // Should land in the correct month, not the month before
    const bucket = findBucket(data, firstOfMonth);
    expect(bucket?.["30 €"]).toBe(30);
  });

  it("multiple members in same month accumulate correctly", () => {
    const lastMonth = subMonths(new Date(), 1);
    const day = (d: number) =>
      format(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), d), "yyyy-MM-dd");

    const members: Member[] = [
      { ...baseMember, paid_at: day(1), fee_amount: 30 },
      { ...baseMember, paid_at: day(5), fee_amount: 35 },
      { ...baseMember, paid_at: day(10), fee_amount: 30 },
      { ...baseMember, paid_at: day(15), fee_amount: 35 },
      { ...baseMember, paid_at: day(20), fee_amount: 30 },
    ];
    const data = computeFeeData(members);
    const bucket = findBucket(data, day(1));

    expect(bucket?.["30 €"]).toBe(90); // 3 × 30€
    expect(bucket?.["35 €"]).toBe(70); // 2 × 35€
  });
});
