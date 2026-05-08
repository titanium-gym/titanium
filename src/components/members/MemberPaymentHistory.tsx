"use client";

import { useState } from "react";
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
