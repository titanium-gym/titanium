"use client";

import { Users } from "lucide-react";

interface MembersTableEmptyStateProps {
  totalCount: number;
}

export function MembersTableEmptyState({ totalCount }: MembersTableEmptyStateProps) {
  return (
    <div
      className="text-center py-20 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        </div>
        {totalCount === 0 ? (
          <>
            <p className="font-semibold text-foreground">Sin socios todavía</p>
            <p className="text-sm">Añade el primer socio para empezar.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">Sin resultados</p>
            <p className="text-sm">Prueba con otros filtros o un nombre diferente.</p>
          </>
        )}
      </div>
    </div>
  );
}
