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
  borderColor: string;
  accent: string;
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
      iconBg: "bg-white/5",
      iconColor: "text-muted-foreground",
      borderColor: "border-border",
      accent: "bg-border",
    },
    {
      label: "Activos",
      value: active,
      icon: TrendingUp,
      valueClass: "text-green-400",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
      borderColor: "border-green-500/20",
      accent: "bg-green-500",
    },
    {
      label: "Vencen pronto",
      value: expiringSoon,
      icon: AlertTriangle,
      valueClass: "text-yellow-400",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
      borderColor: "border-yellow-500/20",
      accent: "bg-yellow-500",
    },
    {
      label: "Vencidos",
      value: expired,
      icon: XCircle,
      valueClass: "text-primary",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      borderColor: "border-primary/25",
      accent: "bg-primary",
    },
    {
      label: "Ingresos / mes",
      value: `${revenue.toFixed(0)} €`,
      icon: Euro,
      valueClass: "text-foreground",
      iconBg: "bg-white/5",
      iconColor: "text-muted-foreground",
      borderColor: "border-border",
      accent: "bg-border",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`relative rounded-xl border ${s.borderColor} bg-card overflow-hidden p-4 flex flex-col gap-3`}
        >
          {/* Left accent bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${s.accent} opacity-70`} />

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {s.label}
            </p>
            <div className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center`}>
              <s.icon className={`w-3.5 h-3.5 ${s.iconColor}`} aria-hidden="true" />
            </div>
          </div>

          <p className={`text-3xl font-black leading-none tracking-tight ${s.valueClass}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
