"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// recharts is ~90KB+ gzipped — load it only on the client, only when this
// component is actually rendered, instead of shipping it in the shared
// bundle. `ssr: false` is only valid inside a Client Component, so this
// wrapper exists purely to give the dashboard (a Server Component) a
// client boundary to call it from.
export const OverviewCharts = dynamic(
  () => import("@/components/dashboard/OverviewCharts").then((m) => m.OverviewCharts),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-xl" /> }
);
