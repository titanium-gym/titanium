"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Users, RefreshCw, Download, SlidersHorizontal } from "lucide-react";

type StatusFilter = "all" | "active" | "expiring-soon" | "expired";

interface MembersTableToolbarProps {
  search: string;
  statusFilter: StatusFilter;
  selectedCount: number;
  bulkRenewing: boolean;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: StatusFilter) => void;
  onBulkRenew: () => void;
  onExportCSV: () => void;
}

export function MembersTableToolbar({
  search,
  statusFilter,
  selectedCount,
  bulkRenewing,
  totalCount,
  filteredCount,
  onSearchChange,
  onStatusChange,
  onBulkRenew,
  onExportCSV,
}: MembersTableToolbarProps) {
  return (
    <>
      {/* Card header — toolbar */}
      <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-8 text-sm"
              aria-label="Buscar socio por nombre"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-36 h-8 text-sm hidden sm:flex" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="expiring-soon">Vence pronto</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filter sheet */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden gap-1.5 h-8 px-3"
                  aria-label="Abrir filtros"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="text-xs">Filtros</span>
                  {statusFilter !== "all" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </Button>
              }
            />
            <SheetContent side="bottom" className="h-auto pb-8">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-sm">Filtrar socios</SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => onStatusChange(v as StatusFilter)}
                >
                  <SelectTrigger className="w-full h-9 text-sm" aria-label="Filtrar por estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="expiring-soon">Vence pronto</SelectItem>
                    <SelectItem value="expired">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedCount > 0 && (
            <Button
              size="sm"
              onClick={onBulkRenew}
              disabled={bulkRenewing}
              aria-label={`Renovar ${selectedCount} socios seleccionados`}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${bulkRenewing ? "animate-spin" : ""}`} />
              Renovar ({selectedCount})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportCSV}
            aria-label="Exportar a CSV"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
      </div>

      {/* Info strip */}
      <div className="px-4 py-2 border-b border-border/40 bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredCount === totalCount
            ? `${totalCount} socios`
            : `${filteredCount} de ${totalCount} socios`}
          {selectedCount > 0 && (
            <span className="text-primary font-medium"> · {selectedCount} seleccionados</span>
          )}
        </span>
        {(search || statusFilter !== "all") && (
          <button
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            onClick={() => { onSearchChange(""); onStatusChange("all"); }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </>
  );
}
