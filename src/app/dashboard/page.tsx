import { getSupabaseClient } from "@/lib/supabase";
import { getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils/expiry";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { parseISO, startOfMonth } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";
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

  // KPI calculations
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

  // Upcoming expirations (next 14 days, not yet expired)
  const proximosAVencer = all
    .filter((m) => {
      const days = getDaysUntilExpiry(m.expires_at);
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => getDaysUntilExpiry(a.expires_at) - getDaysUntilExpiry(b.expires_at));

  const kpis = [
    { label: "Total socios", value: total, sub: null },
    { label: "Activos", value: activos, sub: null, accent: "text-emerald-400" },
    { label: "Vencen pronto", value: vencenProto, sub: null, accent: "text-amber-400" },
    { label: "Vencidos", value: vencidos, sub: null, accent: "text-rose-400" },
    { label: "Ingresos este mes", value: `${ingresosMes} €`, sub: null, accent: "text-primary" },
    { label: "Nuevos este mes", value: nuevosEsteMes, sub: null },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Inicio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen general del gimnasio
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(({ label, value, accent }) => (
          <Card key={label} className="bg-card/50 border-border/60">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate">
                {label}
              </p>
              <p className={`text-2xl font-black mt-1 tabular-nums ${accent ?? "text-foreground"}`}>
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
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
