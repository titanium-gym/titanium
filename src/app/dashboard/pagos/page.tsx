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

  const thisMonthPayments = all.filter((p) => {
    try {
      return isWithinInterval(parseISO(p.paid_at), { start: monthStart, end: monthEnd });
    } catch {
      return false;
    }
  });

  const ingresosMes = thisMonthPayments.reduce((sum, p) => sum + Number(p.fee_amount), 0);

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
              {thisMonthPayments.length}
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
                const member = (p.members as unknown) as { full_name: string } | null;
                const isThisMonth = thisMonthPayments.includes(p);
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
