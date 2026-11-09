import { getSupabaseClient } from "@/lib/supabase";
import { currentMonthRange } from "@/lib/utils/date";

/** This month's payments: the single source for every "income this month" figure. */
export async function getCurrentMonthIncome() {
  const { start, end } = currentMonthRange();
  const { data, error } = await getSupabaseClient()
    .from("payments")
    .select("fee_amount")
    .gte("paid_at", start)
    .lte("paid_at", end);

  const payments = data ?? [];
  return {
    income: payments.reduce((sum, p) => sum + Number(p.fee_amount), 0),
    count: payments.length,
    error,
  };
}
