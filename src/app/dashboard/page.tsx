import { getSupabaseClient } from "@/lib/supabase";
import { getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils/expiry";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { parseISO, startOfMonth } from "date-fns";
import { AlertTriangle, Clock, TrendingUp, XCircle, Euro, Users, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = getSupabaseClient();
  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .order("expires_at", { ascending: true });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Error al cargar datos</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const all = members ?? [];
  const now = new Date();
  const thisMonthStart = startOfMonth(now);

  const total = all.length;
  const activos = all.filter((m) => getExpiryStatus(m.expires_at) === "active").length;
  const vencidos = all.filter((m) => getExpiryStatus(m.expires_at) === "expired").length;
  const vencenProto = all.filter((m) => getExpiryStatus(m.expires_at) === "expiring-soon").length;
  const ingresosMes = all
    .filter((m) => parseISO(m.paid_at) >= thisMonthStart)
    .reduce((sum, m) => sum + Number(m.fee_amount), 0);
  const nuevosEsteMes = all.filter(
    (m) => parseISO(m.created_at) >= thisMonthStart
  ).length;

  const proximosAVencer = all
    .filter((m) => {
      const days = getDaysUntilExpiry(m.expires_at);
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => getDaysUntilExpiry(a.expires_at) - getDaysUntilExpiry(b.expires_at));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Inicio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen general del gimnasio
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Activos */}
        <Card className="relative overflow-hidden border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 to-transparent">
          <CardContent className="pt-6 pb-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400/80">
                Activos
              </span>
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              </div>
            </div>
            <p className="text-5xl font-black tabular-nums tracking-tight text-emerald-400">
              {activos}
            </p>
            <div className="mt-3 h-px w-10 bg-emerald-500/40 rounded-full" />
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card className="relative overflow-hidden border-border/60">
          <CardContent className="pt-6 pb-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/70">
                Ingresos · mes
              </span>
              <div className="w-7 h-7 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
                <Euro className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <p className="text-5xl font-black tabular-nums tracking-tight text-foreground">
              {ingresosMes}
              <span className="text-2xl font-bold text-muted-foreground ml-1">€</span>
            </p>
            <div className="mt-3 h-px w-10 bg-border rounded-full" />
          </CardContent>
        </Card>

        {/* Vencidos */}
        <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-primary/8 to-transparent">
          <CardContent className="pt-6 pb-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/70">
                Vencidos
              </span>
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                <XCircle className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              </div>
            </div>
            <p className="text-5xl font-black tabular-nums tracking-tight text-primary">
              {vencidos}
            </p>
            <div className="mt-3 h-px w-10 bg-primary/40 rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium truncate">
              Total
            </p>
          </div>
          <p className="text-xl font-black tabular-nums text-foreground shrink-0">{total}</p>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <p className="text-[11px] text-amber-400/80 uppercase tracking-wider font-medium truncate">
              Vencen pronto
            </p>
          </div>
          <p className="text-xl font-black tabular-nums text-amber-400 shrink-0">{vencenProto}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium truncate">
              Nuevos
            </p>
          </div>
          <p className="text-xl font-black tabular-nums text-foreground shrink-0">{nuevosEsteMes}</p>
        </div>
      </div>

      {/* Charts */}
      <OverviewCharts members={all} />

      {/* Upcoming expirations */}
      <Card className="bg-card/50 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Vencen en los próximos 14 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximosAVencer.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Ningún socio vence en los próximos 14 días 🎉
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {proximosAVencer.map((m) => {
                const days = getDaysUntilExpiry(m.expires_at);
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-2.5 gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.phone ?? "Sin teléfono"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        days === 0
                          ? "border-rose-500/40 text-rose-400 shrink-0"
                          : "border-amber-500/40 text-amber-400 shrink-0"
                      }
                    >
                      {days === 0 ? "Hoy" : `${days}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
