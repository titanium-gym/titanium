"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-semibold">Algo fue mal</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
      <Button variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
