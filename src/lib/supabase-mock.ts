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

/**
 * Chainable query builder that mimics the Supabase PostgREST client interface.
 * Supports both intermediate (filter/mutation) methods that return `this` and
 * terminal methods (order, single) that return a resolved Promise.
 * The object is also a "thenable" so it can be awaited directly after any
 * intermediate method call.
 */
class MockQueryBuilder {
  private _data: Member[];

  constructor(data: Member[]) {
    this._data = [...data];
  }

  // --- Thenable so `await builder.lte(...)` works without a terminal call ---
  then<T>(
    onfulfilled: (value: { data: Member[]; error: null }) => T | PromiseLike<T>
  ): Promise<T> {
    return Promise.resolve({ data: this._data, error: null }).then(onfulfilled);
  }

  // --- Column selection (no-op for the mock) ---
  select(_cols: string): this {
    return this;
  }

  // --- Filter methods (narrow _data, return this for chaining) ---
  eq(column: string, value: unknown): this {
    this._data = this._data.filter(
      (m) => (m as Record<string, unknown>)[column] === value
    );
    return this;
  }

  lt(column: string, value: string): this {
    this._data = this._data.filter(
      (m) => String((m as Record<string, unknown>)[column] ?? "") < value
    );
    return this;
  }

  lte(column: string, value: string): this {
    this._data = this._data.filter(
      (m) => String((m as Record<string, unknown>)[column] ?? "") <= value
    );
    return this;
  }

  in(column: string, values: unknown[]): this {
    this._data = this._data.filter((m) =>
      values.includes((m as Record<string, unknown>)[column])
    );
    return this;
  }

  // --- Mutation stubs (return this so callers can chain .eq / .select) ---
  update(_values: Partial<Member>): this {
    return this;
  }

  delete(): this {
    return this;
  }

  insert(_values: Partial<Member> | Partial<Member>[]): this {
    return this;
  }

  limit(_n: number): this {
    this._data = this._data.slice(0, _n);
    return this;
  }

  // --- Terminal methods that return a plain Promise ---
  order(col: string, opts?: { ascending?: boolean }): this {
    const ascending = opts?.ascending !== false;
    this._data = [...this._data].sort((a, b) => {
      const va = String((a as Record<string, unknown>)[col] ?? "");
      const vb = String((b as Record<string, unknown>)[col] ?? "");
      return ascending ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return this;
  }

  single(): Promise<{ data: Member | null; error: null }> {
    return Promise.resolve({ data: this._data[0] ?? null, error: null });
  }
}

export function createMockSupabaseClient(): ReturnType<typeof createClient> {
  const today = new Date();
  const mockPaymentData = Array.from({ length: 10 }, (_, i) => {
    // First 5 payments are in the current month, rest are in previous months
    const daysAgo = i < 5 ? i * 2 : 30 + i * 10;
    const paid = new Date(today);
    paid.setDate(paid.getDate() - daysAgo);
    const expires = new Date(paid);
    expires.setMonth(expires.getMonth() + 1);
    return {
      id: i + 1,
      member_id: i + 1,
      fee_amount: i % 2 === 0 ? 30 : 35,
      paid_at: paid.toISOString().split("T")[0],
      expires_at: expires.toISOString().split("T")[0],
      created_at: paid.toISOString(),
      members: { full_name: `Socio ${String(i + 1).padStart(3, "0")}` },
    };
  });

  return {
    from: (table: string) => {
      if (table === "payments") {
        return new MockQueryBuilder(mockPaymentData as unknown as Member[]);
      }
      return new MockQueryBuilder(mockData);
    },
  } as unknown as ReturnType<typeof createClient>;
}
