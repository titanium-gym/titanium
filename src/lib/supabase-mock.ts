import { createClient } from "@supabase/supabase-js";
import type { Member } from "./supabase";

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const mockData: Member[] = Array.from({ length: 50 }, (_, i) => {
  const bucket = i % 6;
  let paid_at: string;
  let expires_at: string;

  if (bucket === 0) {
    paid_at = offsetDate(-90); expires_at = offsetDate(-60); // expirado hace 2 meses
  } else if (bucket === 1) {
    paid_at = offsetDate(-45); expires_at = offsetDate(-15); // expirado reciente
  } else if (bucket === 2) {
    paid_at = offsetDate(-28); expires_at = offsetDate(3);   // vence pronto
  } else if (bucket === 3) {
    paid_at = offsetDate(-28); expires_at = offsetDate(6);   // vence pronto
  } else if (bucket === 4) {
    paid_at = offsetDate(-15); expires_at = offsetDate(15);  // activo
  } else {
    paid_at = offsetDate(-5);  expires_at = offsetDate(25);  // activo reciente
  }

  return {
    id: i + 1,
    full_name: `Socio ${String(i + 1).padStart(3, "0")}`,
    phone: i % 2 === 0 ? `+34 6${String(i * 13 + 10000000).padStart(8, "0")}` : null,
    fee_amount: i % 2 === 0 ? 30 : 35,
    paid_at,
    expires_at,
    notes: i % 5 === 0 ? "Nota de prueba" : null,
    created_at: new Date(2024, 0, 1).toISOString(),
    updated_at: new Date(2024, 0, 1).toISOString(),
  };
});

function makeQueryBuilder(data: Member[]) {
  return {
    select: (_cols: string) => ({
      order: (col: string, opts?: { ascending?: boolean }) => {
        const ascending = opts?.ascending !== false;
        const sorted = [...data].sort((a, b) => {
          const va = String(a[col as keyof Member] ?? "");
          const vb = String(b[col as keyof Member] ?? "");
          return ascending ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        return Promise.resolve({ data: sorted, error: null });
      },
    }),
  };
}

export function createMockSupabaseClient(): ReturnType<typeof createClient> {
  return {
    from: (_table: string) => makeQueryBuilder(mockData),
  } as unknown as ReturnType<typeof createClient>;
}
