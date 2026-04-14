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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpiryStatus } from "@/lib/utils/expiry";
import type { Member } from "@/lib/supabase";

interface OverviewChartsProps {
  members: Member[];
}

const STATUS_COLORS = {
  Activos: "hsl(var(--chart-2))",
  "Vence pronto": "hsl(var(--chart-4))",
  Vencidos: "hsl(var(--chart-1))",
};

const FEE_COLORS = {
  "30 €": "hsl(var(--chart-3))",
  "35 €": "hsl(var(--chart-5))",
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
      const month = new Date(m.paid_at).toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });
      if (!buckets[month]) buckets[month] = { "30 €": 0, "35 €": 0 };
      const fee = Number(m.fee_amount);
      if (fee === 30) buckets[month]["30 €"]++;
      else buckets[month]["35 €"]++;
    }

    // Last 6 months in order
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
      );
    }

    return months.map((m) => ({
      mes: m,
      "30 €": buckets[m]?.["30 €"] ?? 0,
      "35 €": buckets[m]?.["35 €"] ?? 0,
    }));
  }, [members]);

  const hasAnyStatus = statusData.some((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut — estado actual */}
      <Card className="bg-card/50 border-border/60">
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
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
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

      {/* Bar — distribución por cuota (últimos 6 meses) */}
      <Card className="bg-card/50 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pagos por cuota · últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={feeData} barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
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
                <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
