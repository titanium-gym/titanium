"use client";

import { Member } from "@/lib/supabase";
import { getExpiryStatus } from "@/lib/utils/expiry";
import { parseISO, startOfMonth } from "date-fns";
import { Users, TrendingUp, AlertTriangle, XCircle, Euro } from "lucide-react";

type Stat = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueClass: string;
  iconBg: string;
  iconColor: string;
  iconGlow: string;
  borderColor: string;
  gradient: string;
  progressPct?: number;
  progressColor?: string;
};

export function StatsCards({ members }: { members: Member[] }) {
  const total = members.length;
  const active = members.filter((m) => getExpiryStatus(m.expires_at) === "active").length;
  const expiringSoon = members.filter((m) => getExpiryStatus(m.expires_at) === "expiring-soon").length;
  const expired = members.filter((m) => getExpiryStatus(m.expires_at) === "expired").length;
  const thisMonthStart = startOfMonth(new Date());
  const revenue = members
    .filter((m) => parseISO(m.paid_at) >= thisMonthStart)
    .reduce((sum, m) => sum + Number(m.fee_amount), 0);

  const stats: Stat[] = [
    {
      label: "Total socios",
      value: total,
      icon: Users,
      valueClass: "text-foreground",
      iconBg: "bg-white/8",
      iconColor: "text-muted-foreground",
      iconGlow: "",
      borderColor: "border-border/60",
      gradient: "from-white/[0.02] to-transparent",
    },
    {
      label: "Activos",
      value: active,
      icon: TrendingUp,
      valueClass: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      iconGlow: "shadow-[0_0_10px_-2px_oklch(0.7_0.17_160_/_0.5)]",
      borderColor: "border-emerald-500/25",
      gradient: "from-emerald-500/6 to-transparent",
      progressPct: total > 0 ? Math.round((active / total) * 100) : 0,
      progressColor: "bg-emerald-500/60",
    },
    {
      label: "Vencen pronto",
      value: expiringSoon,
      icon: AlertTriangle,
      valueClass: "text-yellow-400",
      iconBg: "bg-yellow-500/15",
      iconColor: "text-yellow-400",
      iconGlow: "shadow-[0_0_10px_-2px_oklch(0.85_0.17_85_/_0.5)]",
      borderColor: "border-yellow-500/25",
      gradient: "from-yellow-500/6 to-transparent",
      progressPct: total > 0 ? Math.round((expiringSoon / total) * 100) : 0,
      progressColor: "bg-yellow-500/60",
    },
    {
      label: "Vencidos",
      value: expired,
      icon: XCircle,
      valueClass: "text-primary",
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      iconGlow: "shadow-[0_0_10px_-2px_oklch(0.62_0.22_27_/_0.5)]",
      borderColor: "border-primary/25",
      gradient: "from-primary/6 to-transparent",
      progressPct: total > 0 ? Math.round((expired / total) * 100) : 0,
      progressColor: "bg-primary/60",
    },
    {
      label: "Ingresos / mes",
      value: `${revenue.toFixed(0)} €`,
      icon: Euro,
      valueClass: "text-foreground",
      iconBg: "bg-white/8",
      iconColor: "text-muted-foreground",
      iconGlow: "",
      borderColor: "border-border/60",
      gradient: "from-white/[0.02] to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`relative rounded-xl border ${s.borderColor} bg-gradient-to-br ${s.gradient} bg-card overflow-hidden p-4 flex flex-col gap-2.5`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {s.label}
            </p>
            <div className={`w-8 h-8 rounded-lg ${s.iconBg} border border-white/5 flex items-center justify-center ${s.iconGlow}`}>
              <s.icon className={`w-3.5 h-3.5 ${s.iconColor}`} aria-hidden="true" />
            </div>
          </div>

          <p className={`text-4xl font-black leading-none tracking-tight ${s.valueClass}`}>
            {s.value}
          </p>

          {s.progressPct !== undefined && (
            <div className="space-y-1">
              <div className="h-1 bg-border/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.progressColor} rounded-full transition-all`}
                  style={{ width: `${s.progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 tabular-nums">{s.progressPct}%</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
