# Payment History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track every payment/renewal in a `payments` table, expose it via API, show it per-socio in `EditMemberDialog`, and add a global `/dashboard/pagos` page.

**Architecture:** New `payments` table in Supabase records every payment event (member creation + every renewal). Server-only API route exposes payment history per member. `EditMemberDialog` gains a collapsible history section. New dashboard page shows all payments with month filter and totals.

**Tech Stack:** Next.js 15 App Router, Supabase (service_role), React Hook Form, shadcn/ui, Tailwind, Vitest (unit), Playwright (E2E)

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/002_payments.sql` |
| Create | `src/app/api/members/[id]/payments/route.ts` |
| Modify | `src/app/api/members/route.ts` (POST — insert payment on create) |
| Modify | `src/app/api/members/[id]/route.ts` (PUT — insert payment when paid_at changes) |
| Modify | `src/app/api/members/bulk-renew/route.ts` (insert payments for each renewed member) |
| Modify | `src/lib/supabase.ts` (add `Payment` type export) |
| Modify | `src/lib/supabase-mock.ts` (add mock payments support) |
| Create | `src/components/members/MemberPaymentHistory.tsx` |
| Modify | `src/components/members/EditMemberDialog.tsx` (add history section) |
| Create | `src/app/dashboard/pagos/page.tsx` |
| Modify | `src/components/dashboard/AppSidebar.tsx` (add Pagos nav item) |
| Modify | `src/tests/e2e/fixtures/mock-data.ts` (add `mockPayments`) |
| Modify | `src/tests/e2e/fixtures/setup-mocks.ts` (intercept `/api/members/:id/payments`) |
| Create | `src/tests/unit/payments-api.test.ts` |

---

## Task 1: DB Migration — tabla `payments`

**Files:**
- Create: `supabase/migrations/002_payments.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- supabase/migrations/002_payments.sql
-- =============================================================================
-- 002_payments.sql
-- Historial de pagos por socio
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  member_id   BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  fee_amount  INTEGER NOT NULL CHECK (fee_amount IN (30, 35)),
  paid_at     DATE NOT NULL,
  expires_at  DATE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at   ON payments(paid_at DESC);

-- RLS (bypassed by service_role, defined for correctness)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select ON payments;
CREATE POLICY payments_select ON payments
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS payments_insert ON payments;
CREATE POLICY payments_insert ON payments
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Backfill: poblar con el pago actual de cada socio existente
-- (representa el único pago conocido en el historial)
INSERT INTO payments (member_id, fee_amount, paid_at, expires_at)
SELECT id, fee_amount, paid_at, expires_at
FROM members;

SELECT 'payments table created ✅' AS status, COUNT(*) AS backfilled FROM payments;
```

- [ ] **Step 2: Aplicar la migración manualmente en Supabase**

Ir a Supabase → SQL Editor → copiar y ejecutar el contenido de `002_payments.sql`.

Verificar que la consulta retorna `backfilled = N` (donde N = número de socios actuales).

---

## Task 2: Tipo `Payment` en `supabase.ts`

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Añadir el tipo `Payment`**

Abrir `src/lib/supabase.ts`. Al final del archivo, después de la definición de `Member`, añadir:

```ts
export type Payment = {
  id: number;
  member_id: number;
  fee_amount: number;
  paid_at: string;
  expires_at: string;
  created_at: string;
};
```

- [ ] **Step 2: Verificar que no rompe nada**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 3: API `GET /api/members/[id]/payments`

**Files:**
- Create: `src/app/api/members/[id]/payments/route.ts`
- Create: `src/tests/unit/payments-api.test.ts`

- [ ] **Step 1: Escribir el test fallido**

```ts
// src/tests/unit/payments-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock requireAuth to return a session
vi.mock("@/lib/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { email: "test@test.com" } }),
}));

// Mock Supabase client
const mockPayments = [
  { id: 1, member_id: 1, fee_amount: 30, paid_at: "2025-01-01", expires_at: "2025-02-01", created_at: "2025-01-01T00:00:00Z" },
  { id: 2, member_id: 1, fee_amount: 30, paid_at: "2025-02-01", expires_at: "2025-03-01", created_at: "2025-02-01T00:00:00Z" },
];

const selectMock = vi.fn().mockReturnThis();
const eqMock = vi.fn().mockReturnThis();
const orderMock = vi.fn().mockResolvedValue({ data: mockPayments, error: null });

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: selectMock,
      eq: eqMock,
      order: orderMock,
    })),
  })),
}));

// Import AFTER mocks are set up
const { GET } = await import("@/app/api/members/[id]/payments/route");

describe("GET /api/members/[id]/payments", () => {
  it("returns 200 with payment list for valid member id", async () => {
    const params = Promise.resolve({ id: "1" });
    const res = await GET({} as Request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ member_id: 1, fee_amount: 30 });
  });

  it("returns 400 for non-numeric id", async () => {
    const params = Promise.resolve({ id: "abc" });
    const res = await GET({} as Request, { params });
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const { requireAuth } = await import("@/lib/require-auth");
    vi.mocked(requireAuth).mockResolvedValueOnce(null);
    const params = Promise.resolve({ id: "1" });
    const res = await GET({} as Request, { params });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
npx vitest run src/tests/unit/payments-api.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/members/[id]/payments/route'"

- [ ] **Step 3: Implementar la ruta**

```ts
// src/app/api/members/[id]/payments/route.ts
import { requireAuth } from "@/lib/require-auth";
import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

const MEMBER_ID_RE = /^\d+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!MEMBER_ID_RE.test(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, member_id, fee_amount, paid_at, expires_at, created_at")
    .eq("member_id", id)
    .order("paid_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  return NextResponse.json(data ?? []);
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
npx vitest run src/tests/unit/payments-api.test.ts
```

Expected: PASS — 3 tests passed.

---

## Task 4: Insertar pago en CREATE de socio

**Files:**
- Modify: `src/app/api/members/route.ts`

Tras crear el member con éxito, insertar en `payments`. El insert de payment no debe bloquear la respuesta — si falla se loguea pero no falla la request.

- [ ] **Step 1: Modificar `POST /api/members`**

Reemplazar el bloque desde `const supabase = getSupabaseClient();` hasta el final del `POST`:

```ts
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("members")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create member" }, { status: 500 });

  // Register initial payment in history (best-effort — failure does not block member creation)
  await supabase.from("payments").insert({
    member_id: data.id,
    fee_amount: data.fee_amount,
    paid_at: data.paid_at,
    expires_at: data.expires_at,
  });

  return NextResponse.json(data, { status: 201 });
```

- [ ] **Step 2: Verificar tipado**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 5: Insertar pago en RENEW/UPDATE de socio

**Files:**
- Modify: `src/app/api/members/[id]/route.ts`

El PUT recibe campos opcionales. Solo debe insertar en `payments` si el campo `paid_at` está entre los campos actualizados (el update es una renovación).

- [ ] **Step 1: Modificar `PUT /api/members/[id]`**

Reemplazar el bloque desde `const { data, error } = await supabase.from("members").update...` hasta `return NextResponse.json(data)`:

```ts
  const { data, error } = await supabase
    .from("members")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update member" }, { status: 500 });

  // If paid_at was updated (renewal), record payment in history
  if (updateData.paid_at !== undefined) {
    await supabase.from("payments").insert({
      member_id: Number(id),
      fee_amount: data.fee_amount,
      paid_at: data.paid_at,
      expires_at: data.expires_at,
    });
  }

  return NextResponse.json(data);
```

- [ ] **Step 2: Verificar tipado**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 6: Insertar pagos en bulk-renew

**Files:**
- Modify: `src/app/api/members/bulk-renew/route.ts`

- [ ] **Step 1: Modificar bulk-renew para insertar payments**

Reemplazar el bloque desde `const failed = updates.filter...` hasta el final:

```ts
  const failed = updates.filter((u) => u.error);
  if (failed.length > 0) {
    return NextResponse.json({ error: "Failed to renew some members" }, { status: 500 });
  }

  const renewed = updates.map((u) => u.data!);

  // Register payments in history (best-effort)
  await supabase.from("payments").insert(
    renewed.map((m) => ({
      member_id: m.id,
      fee_amount: m.fee_amount,
      paid_at: m.paid_at,
      expires_at: m.expires_at,
    }))
  );

  return NextResponse.json({ updated: renewed });
```

- [ ] **Step 2: Verificar tipado**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 7: Actualizar mocks E2E para `payments`

**Files:**
- Modify: `src/tests/e2e/fixtures/mock-data.ts`
- Modify: `src/tests/e2e/fixtures/setup-mocks.ts`

- [ ] **Step 1: Añadir `mockPayments` a mock-data.ts**

Al final del archivo `src/tests/e2e/fixtures/mock-data.ts`, añadir:

```ts
export const mockPayments = [
  {
    id: 1,
    member_id: 1,
    fee_amount: 30,
    paid_at: offsetDate(-30),
    expires_at: offsetDate(0),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    member_id: 1,
    fee_amount: 30,
    paid_at: offsetDate(0),
    expires_at: offsetDate(30),
    created_at: new Date().toISOString(),
  },
];

export const mockAllPayments = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  member_id: (i % 10) + 1,
  fee_amount: i % 2 === 0 ? 30 : 35,
  paid_at: offsetDate(-i * 3),
  expires_at: offsetDate(30 - i * 3),
  created_at: new Date(Date.now() - i * 3 * 86400000).toISOString(),
  member_name: `Socio ${String((i % 10) + 1).padStart(3, "0")}`,
}));
```

- [ ] **Step 2: Interceptar `/api/members/:id/payments` en setup-mocks.ts**

En `src/tests/e2e/fixtures/setup-mocks.ts`, añadir la siguiente ruta **antes** del bloque `page.route("**/api/members/**", ...)` (Playwright es LIFO — las más específicas van al final, pero aquí la ruta `**/api/members/**` ya captura todo, así que añadimos un check dentro del handler existente):

Localizar el bloque `if (url.includes("/bulk-renew"))` y añadir **antes** del mismo:

```ts
    if (url.match(/\/api\/members\/\d+\/payments$/)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPayments),
      });
      return;
    }
```

Añadir también el import al principio del archivo:

```ts
import { mockMembers, mockPayments } from "./mock-data";
```

---

## Task 8: Componente `MemberPaymentHistory`

**Files:**
- Create: `src/components/members/MemberPaymentHistory.tsx`

Este componente es `"use client"`. Recibe el `memberId` (number), hace fetch a `/api/members/:id/payments` cuando se abre, y muestra la lista.

- [ ] **Step 1: Crear el componente**

```tsx
// src/components/members/MemberPaymentHistory.tsx
"use client";

import { useState, useEffect } from "react";
import { Payment } from "@/lib/supabase";
import { formatDate } from "@/lib/utils/date";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MemberPaymentHistoryProps {
  memberId: number;
}

export function MemberPaymentHistory({ memberId }: MemberPaymentHistoryProps) {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchPayments() {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/payments`);
      if (res.ok) {
        setPayments(await res.json());
        setFetched(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchPayments();
  }

  return (
    <div className="border-t border-border/50 pt-3 mt-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="w-full justify-between text-muted-foreground hover:text-foreground px-1 h-8"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <History className="w-3.5 h-3.5" />
          Historial de pagos
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </Button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {loading && (
            <p className="text-xs text-muted-foreground px-1 py-2">Cargando…</p>
          )}
          {!loading && payments.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2">Sin pagos registrados.</p>
          )}
          {!loading && payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-muted/40 border border-border/40"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground tabular-nums">
                  {formatDate(p.paid_at)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Vence: {formatDate(p.expires_at)}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] border-border/60 text-muted-foreground shrink-0"
              >
                {p.fee_amount} €
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipado**

```bash
npx tsc --noEmit
```

Expected: sin errores.

---

## Task 9: Integrar historial en `EditMemberDialog`

**Files:**
- Modify: `src/components/members/EditMemberDialog.tsx`

- [ ] **Step 1: Añadir import**

Al final de los imports existentes de `EditMemberDialog.tsx`:

```ts
import { MemberPaymentHistory } from "./MemberPaymentHistory";
```

- [ ] **Step 2: Añadir el componente antes del cierre de `<DialogContent>`**

Localizar:
```tsx
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <MemberFormFields form={form} autoExpiry={false} />
            <div className="flex justify-end gap-2 pt-2">
```

Reemplazar con:
```tsx
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <MemberFormFields form={form} autoExpiry={false} />
            <MemberPaymentHistory memberId={member.id} />
            <div className="flex justify-end gap-2 pt-2">
```

- [ ] **Step 3: Verificar tipado y build**

```bash
npx tsc --noEmit && npm run lint -- --max-warnings=0
```

Expected: sin errores.

---

## Task 10: Página global `/dashboard/pagos`

**Files:**
- Create: `src/app/dashboard/pagos/page.tsx`
- Modify: `src/components/dashboard/AppSidebar.tsx`

Esta página es un Server Component que lee directamente de Supabase (como el resto del dashboard). Muestra todos los pagos paginados + filtro por mes.

- [ ] **Step 1: Crear la página**

```tsx
// src/app/dashboard/pagos/page.tsx
import { getSupabaseClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils/date";
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Euro, Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const supabase = getSupabaseClient();

  // Fetch payments joined with member name
  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, member_id, fee_amount, paid_at, expires_at, created_at, members(full_name)")
    .order("paid_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="font-semibold text-foreground">Error al cargar pagos</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const all = payments ?? [];
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMontPayments = all.filter((p) => {
    try {
      return isWithinInterval(parseISO(p.paid_at), { start: monthStart, end: monthEnd });
    } catch {
      return false;
    }
  });

  const ingresosMes = thisMontPayments.reduce((sum, p) => sum + Number(p.fee_amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Pagos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Historial completo de renovaciones
        </p>
      </div>

      {/* KPIs del mes actual */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/70">
                Ingresos · {format(now, "MMMM")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-foreground/8 border border-border flex items-center justify-center">
                <Euro className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-4xl font-black tabular-nums text-foreground">
              {ingresosMes}
              <span className="text-xl font-bold text-muted-foreground ml-1">€</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/70">
                Renovaciones · {format(now, "MMMM")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-foreground/8 border border-border flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-4xl font-black tabular-nums text-foreground">
              {thisMontPayments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listado */}
      <Card className="bg-card/50 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Últimos 200 pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {all.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8">Sin pagos registrados.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {all.map((p) => {
                const member = p.members as { full_name: string } | null;
                const isThisMonth = thisMontPayments.includes(p);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member?.full_name ?? `Socio #${p.member_id}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {formatDate(p.paid_at)} → vence {formatDate(p.expires_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isThisMonth && (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          este mes
                        </Badge>
                      )}
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {p.fee_amount} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Añadir "Pagos" a la sidebar**

En `src/components/dashboard/AppSidebar.tsx`, añadir el import de `Receipt`:

```ts
import { LayoutDashboard, Users, Dumbbell, UserX, Receipt } from "lucide-react";
```

En el array `NAV_ITEMS`, añadir después de `socios`:

```ts
  { href: "/dashboard/pagos", label: "Pagos", icon: Receipt, exact: false },
```

- [ ] **Step 3: Verificar build completo**

```bash
npm run build
```

Expected: Build successful, sin errores ni warnings de tipo.

---

## Task 11: Test de integración — mock Supabase para `payments`

**Files:**
- Modify: `src/lib/supabase-mock.ts`

El mock de Supabase solo intercepta SELECT. Necesita reconocer `from("payments")` para no lanzar error al testear server components.

- [ ] **Step 1: Verificar cómo funciona `supabase-mock.ts`**

Leer `src/lib/supabase-mock.ts` para ver cómo está estructurado el mock. El `MockQueryBuilder` actualmente solo maneja `members`. Hay que añadir soporte para `payments`.

En el método `from(table)` del mock client (buscar `createMockSupabaseClient`), añadir soporte para la tabla `payments`:

```ts
// Dentro de createMockSupabaseClient(), localizar el método from() y añadir:
if (table === "payments") {
  return new MockQueryBuilder([]); // payments no se usan en tests server-side
}
```

- [ ] **Step 2: Verificar tests unitarios existentes**

```bash
npm test
```

Expected: todos los tests anteriores siguen en verde.

---

## Task 12: Verificación final y commit

- [ ] **Step 1: Correr suite completa de tests**

```bash
npm test
```

Expected: todos los tests pasan (sin cambios en el número de failing tests).

- [ ] **Step 2: Correr lint**

```bash
npm run lint
```

Expected: sin errores ni warnings nuevos.

- [ ] **Step 3: Build de producción**

```bash
npm run build
```

Expected: Build successful.

- [ ] **Step 4: Confirmar al usuario para commit**

Informar al usuario de todos los archivos creados/modificados y pedir confirmación antes de hacer commit.

---

## Notas importantes

- La migración DB (Task 1) es **manual** — hay que ejecutarla en Supabase SQL Editor antes de cualquier deploy
- El backfill en la migración asume que el `paid_at` actual de cada socio es su único pago histórico conocido
- La inserción de pagos en los routes es **best-effort**: si falla el insert en `payments`, la operación principal (create/update del member) no falla
- `BYPASS_AUTH=true` no funciona en producción — todas las rutas nuevas usan `requireAuth()`
- IDs siempre son integers (BIGINT), nunca UUIDs
- No hacer commit sin confirmación explícita del usuario
