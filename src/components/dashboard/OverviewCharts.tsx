"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpiryStatus } from "@/lib/utils/expiry";
import type { Member } from "@/lib/supabase";

interface OverviewChartsProps {
  members: Member[];
}

interface DonutCenterLabelProps {
  viewBox?: { cx?: number; cy?: number };
  total: number;
  activePct: number;
}

function DonutCenterLabel({ viewBox, total, activePct }: DonutCenterLabelProps) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <g>
      <text
        x={cx}
        y={cy - 9}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "var(--color-foreground)", fontSize: 24, fontWeight: 900 }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
      >
        {activePct}% activos
      </text>
    </g>
  );
}

const STATUS_COLORS = {
  Activos: "var(--color-chart-2)",
  "Vence pronto": "var(--color-chart-4)",
  Vencidos: "var(--color-chart-1)",
};

const FEE_COLORS = {
  "30 €": "var(--color-chart-3)",
  "35 €": "var(--color-chart-5)",
};

export function OverviewCharts({ members }: OverviewChartsProps) {
  const statusData = useMemo(() => {
    const counts = { Activos: 0, "Vence pronto": 0, Vencidos: 0 };
    for (const m of members) {
      const s = getExpiryStatus(m.expires_at);
      if (s === "active") counts["Activos"]++;
      else if (s === "expiring-soon") counts["Vence pronto"]++;
      else counts["Vencidos"]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  const feeData = useMemo(() => {
    const buckets: Record<string, { "30 €": number; "35 €": number }> = {};
    const now = new Date();

    for (const m of members) {
      // Use parseISO so date-only strings stay in local time (avoids UTC midnight → day-before shift)
      const month = format(parseISO(m.paid_at), "MMM yy", { locale: es });
      if (!buckets[month]) buckets[month] = { "30 €": 0, "35 €": 0 };
      const fee = Number(m.fee_amount);
      // Sum euros, not count members
      if (fee === 30) buckets[month]["30 €"] += fee;
      else buckets[month]["35 €"] += fee;
    }

    // Last 6 months in order
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(format(d, "MMM yy", { locale: es }));
    }

    return months.map((m) => ({
      mes: m,
      "30 €": buckets[m]?.["30 €"] ?? 0,
      "35 €": buckets[m]?.["35 €"] ?? 0,
    }));
  }, [members]);

  const hasAnyStatus = statusData.some((d) => d.value > 0);
  const activePct =
    members.length > 0
      ? Math.round(((statusData.find((d) => d.name === "Activos")?.value ?? 0) / members.length) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut — estado actual */}
      <Card className="bg-gradient-to-br from-white/[0.03] via-card/60 to-transparent border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Estado actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyStatus ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin datos
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                    />
                  ))}
                  <Label
                    content={(props) => (
                      <DonutCenterLabel
                        viewBox={props.viewBox as { cx: number; cy: number }}
                        total={members.length}
                        activePct={activePct}
                      />
                    )}
                    position="center"
                  />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar — ingresos por cuota (últimos 6 meses) */}
      <Card className="bg-gradient-to-br from-white/[0.03] via-card/60 to-transparent border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ingresos · últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={feeData} barSize={16}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={(v: number) => `${v}€`}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                formatter={(value) => {
                  const v = value != null ? Number(value) : 0;
                  return `${v}€`;
                }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
              {Object.entries(FEE_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
