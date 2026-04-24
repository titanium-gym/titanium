import { getSupabaseClient } from "@/lib/supabase";
import { getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils/expiry";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { parseISO, startOfMonth } from "date-fns";
import { AlertTriangle, Clock, TrendingUp, XCircle, Euro, Users, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function getInitialsDashboard(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS_DASH = [
  "from-rose-500/80 to-rose-600/80",
  "from-orange-500/80 to-orange-600/80",
  "from-amber-500/80 to-amber-600/80",
  "from-emerald-500/80 to-emerald-600/80",
  "from-sky-500/80 to-sky-600/80",
  "from-violet-500/80 to-violet-600/80",
  "from-pink-500/80 to-pink-600/80",
  "from-teal-500/80 to-teal-600/80",
];

function avatarColorDash(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS_DASH[Math.abs(h) % AVATAR_COLORS_DASH.length];
}

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
        <Card className="relative overflow-hidden border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
          <CardContent className="pt-6 pb-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400/80">
                Activos
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_14px_-2px_oklch(0.7_0.17_160_/_0.4)]">
                <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              </div>
            </div>
            <p className="text-6xl font-black tabular-nums tracking-tight text-emerald-400 leading-none">
              {activos}
            </p>
            {total > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="h-1 bg-emerald-500/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/70 rounded-full transition-all"
                    style={{ width: `${Math.round((activos / total) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-400/50 tabular-nums">
                  {Math.round((activos / total) * 100)}% del total
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-white/[0.03] to-transparent">
          <CardContent className="pt-6 pb-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/70">
                Ingresos · mes
              </span>
              <div className="w-9 h-9 rounded-xl bg-foreground/8 border border-border flex items-center justify-center">
                <Euro className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <p className="text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
              {ingresosMes}
              <span className="text-3xl font-bold text-muted-foreground ml-1">€</span>
            </p>
            <div className="mt-4 h-px w-12 bg-border/60 rounded-full" />
          </CardContent>
        </Card>

        {/* Vencidos */}
        <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          {vencidos > 0 && (
            <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          )}
          <CardContent className="pt-6 pb-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/70">
                Vencidos
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_14px_-2px_oklch(0.62_0.22_27_/_0.4)]">
                <XCircle className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
            </div>
            <p className="text-6xl font-black tabular-nums tracking-tight text-primary leading-none">
              {vencidos}
            </p>
            {total > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="h-1 bg-primary/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all"
                    style={{ width: `${Math.round((vencidos / total) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-primary/50 tabular-nums">
                  {Math.round((vencidos / total) * 100)}% del total
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-white/5 border border-border flex items-center justify-center shrink-0">
              <Users className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium truncate">
              Total
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums text-foreground shrink-0">{total}</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/8 to-transparent px-4 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 text-amber-400" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-amber-400/80 uppercase tracking-wider font-medium truncate">
              Vencen pronto
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums text-amber-400 shrink-0">{vencenProto}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-white/5 border border-border flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium truncate">
              Nuevos
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums text-foreground shrink-0">{nuevosEsteMes}</p>
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
            <div className="grid gap-2">
              {proximosAVencer.map((m) => {
                const days = getDaysUntilExpiry(m.expires_at);
                const initials = getInitialsDashboard(m.full_name);
                const avatarGrad = avatarColorDash(m.full_name);
                const isUrgent = days <= 3;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                      isUrgent
                        ? "border-rose-500/20 bg-rose-500/5"
                        : "border-amber-500/15 bg-amber-500/4"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {m.full_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.phone ?? "Sin teléfono"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        days === 0
                          ? "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold shrink-0"
                          : isUrgent
                          ? "border-orange-500/40 bg-orange-500/8 text-orange-400 shrink-0"
                          : "border-amber-500/40 bg-amber-500/8 text-amber-400 shrink-0"
                      }
                    >
                      {days === 0 ? "Hoy" : `${days}d`}
                    </Badge>
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
