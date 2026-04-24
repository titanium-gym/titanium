"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Member } from "@/lib/supabase";
import { getExpiryStatus } from "@/lib/utils/expiry";
import { formatDate } from "@/lib/utils/date";
import { nextMonthSameDay } from "@/lib/utils/date";
import { PAGE_SIZE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateMemberDialog } from "./CreateMemberDialog";
import { EditMemberDialog } from "./EditMemberDialog";
import { DeleteMemberDialog } from "./DeleteMemberDialog";
import { StatsCards } from "./StatsCards";
import { format, addMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Users,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "expiring-soon" | "expired";
type SortField = "full_name" | "expires_at" | "fee_amount" | "paid_at";
type SortDir = "asc" | "desc";

function StatusBadge({ expiresAt }: { expiresAt: string }) {
  const status = getExpiryStatus(expiresAt);
  if (status === "expired")
    return (
      <Badge className="bg-primary/15 text-primary border-primary/25 text-[11px] font-semibold">
        Vencido
      </Badge>
    );
  if (status === "expiring-soon")
    return (
      <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[11px] font-semibold">
        Vence pronto
      </Badge>
    );
  return (
    <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[11px] font-semibold">
      Activo
    </Badge>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronUp className="h-3 w-3 opacity-20" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-primary" />
    : <ChevronDown className="h-3 w-3 text-primary" />;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function exportCSV(members: Member[]) {
  const header = ["Nombre", "Teléfono", "Cuota (€)", "Fecha pago", "Vencimiento", "Estado", "Notas"];
  const rows = members.map((m) => [
    m.full_name,
    m.phone ?? "",
    Number(m.fee_amount).toFixed(2),
    m.paid_at,
    m.expires_at,
    getExpiryStatus(m.expires_at) === "expired"
      ? "Vencido"
      : getExpiryStatus(m.expires_at) === "expiring-soon"
      ? "Vence pronto"
      : "Activo",
    m.notes ?? "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map(escapeCsvCell).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `socios-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MembersTable({ initialMembers }: { initialMembers: Member[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    () => (searchParams.get("status") as StatusFilter) ?? "all"
  );
  const [page, setPage] = useState(() => Number(searchParams.get("page") ?? 1));
  const [sortField, setSortField] = useState<SortField>("expires_at");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRenewing, setBulkRenewing] = useState(false);

  const updateUrl = useCallback(
    (newSearch: string, newStatus: StatusFilter, newPage: number) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("q", newSearch);
      if (newStatus !== "all") params.set("status", newStatus);
      if (newPage > 1) params.set("page", String(newPage));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  function handleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    setSelectedIds(new Set());
    updateUrl(value, statusFilter, 1);
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
    setSelectedIds(new Set());
    updateUrl(search, value, 1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    updateUrl(search, statusFilter, newPage);
  }

  const filtered = useMemo(() => {
    const result = members.filter((m) => {
      const matchesSearch = m.full_name.toLowerCase().includes(search.toLowerCase());
      const status = getExpiryStatus(m.expires_at);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    result.sort((a, b) => {
      let va: string | number = a[sortField] ?? "";
      let vb: string | number = b[sortField] ?? "";
      if (sortField === "fee_amount") { va = Number(va); vb = Number(vb); }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [members, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Selection helpers
  const allPageSelected = paginated.length > 0 && paginated.every((m) => selectedIds.has(m.id));
  function toggleAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((m) => next.add(m.id));
        return next;
      });
    }
  }
  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRenew(member: Member) {
    setRenewingId(member.id);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const newExpiry = format(addMonths(new Date(), 1), "yyyy-MM-dd");
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_at: today, expires_at: newExpiry }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.formErrors?.[0] ?? err?.error?.message ?? err?.error ?? "Error al renovar";
        toast.error(typeof msg === "string" ? msg : "Error al renovar");
        return;
      }
      const updated = await res.json();
      handleUpdated(updated);
      toast.success(`${member.full_name} renovado hasta ${formatDate(newExpiry)}`);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setRenewingId(null);
    }
  }

  async function handleBulkRenew() {
    const ids = Array.from(selectedIds).map(String);
    if (ids.length === 0) return;
    setBulkRenewing(true);
    try {
      const res = await fetch("/api/members/bulk-renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) { toast.error("Error al renovar"); return; }
      const { updated } = await res.json() as { updated: Member[] };
      updated.forEach(handleUpdated);
      toast.success(`${updated.length} socios renovados correctamente`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Error de conexión");
    } finally {
      setBulkRenewing(false);
    }
  }

  const handleCreated = (member: Member) => {
    setMembers((prev) => [...prev, member]);
    setPage(1);
  };
  const handleUpdated = (updated: Member) =>
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  const handleDeleted = (id: number) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  function SortableHead({ field, label, className }: { field: SortField; label: string; className?: string }) {
    return (
      <TableHead
        scope="col"
        className={`cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ""}`}
        onClick={() => handleSort(field)}
      >
        <span className="flex items-center gap-1">
          {label}
          <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
        </span>
      </TableHead>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Panel de Socios</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de membresías del gimnasio</p>
        </div>
        <CreateMemberDialog onCreated={handleCreated} />
      </div>

      {/* Stats */}
      <StatsCards members={members} />

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">

        {/* Card header — toolbar */}
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                placeholder="Buscar por nombre…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-8 text-sm"
                aria-label="Buscar socio por nombre"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => handleStatusChange(v as StatusFilter)}
            >
              <SelectTrigger className="w-36 h-8 text-sm" aria-label="Filtrar por estado">
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
          <div className="flex items-center gap-2 shrink-0">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={handleBulkRenew}
                disabled={bulkRenewing}
                aria-label={`Renovar ${selectedIds.size} socios seleccionados`}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${bulkRenewing ? "animate-spin" : ""}`} />
                Renovar ({selectedIds.size})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportCSV(filtered)}
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
            {filtered.length === members.length
              ? `${members.length} socios`
              : `${filtered.length} de ${members.length} socios`}
            {selectedIds.size > 0 && (
              <span className="text-primary font-medium"> · {selectedIds.size} seleccionados</span>
            )}
          </span>
          {(search || statusFilter !== "all") && (
            <button
              className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              onClick={() => { handleSearchChange(""); handleStatusChange("all"); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Table / empty state */}
        {filtered.length === 0 ? (
          <div
            className="text-center py-20 text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              {members.length === 0 ? (
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
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead scope="col" className="w-10 pl-4">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Seleccionar todos en esta página"
                      />
                    </TableHead>
                    <SortableHead field="full_name" label="Nombre" />
                    <TableHead scope="col" className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</TableHead>
                    <SortableHead field="fee_amount" label="Cuota" className="hidden md:table-cell" />
                    <SortableHead field="paid_at" label="Último pago" className="hidden md:table-cell" />
                    <SortableHead field="expires_at" label="Vencimiento" />
                    <TableHead scope="col" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                    <TableHead scope="col" className="text-right pr-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((member) => {
                    const isExpired = getExpiryStatus(member.expires_at) === "expired";
                    return (
                      <TableRow
                        key={member.id}
                        className={`border-border transition-colors ${
                          selectedIds.has(member.id)
                            ? "bg-primary/8 hover:bg-primary/12"
                            : isExpired
                            ? "opacity-60 hover:opacity-80 hover:bg-white/[0.02]"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedIds.has(member.id)}
                            onCheckedChange={() => toggleOne(member.id)}
                            aria-label={`Seleccionar ${member.full_name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div>
                            <span>{member.full_name}</span>
                            {member.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5" title={member.notes}>
                                {member.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {member.phone || <span className="opacity-30">—</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm tabular-nums">
                          {Number(member.fee_amount).toFixed(0)} €
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm tabular-nums">
                          {formatDate(member.paid_at)}
                        </TableCell>
                        <TableCell className="text-foreground text-sm font-medium tabular-nums">
                          {formatDate(member.expires_at)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge expiresAt={member.expires_at} />
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRenew(member)}
                              disabled={renewingId === member.id}
                              aria-label={`Renovar ${member.full_name}`}
                              title={`Renovar → vence ${nextMonthSameDay(format(new Date(), "yyyy-MM-dd"))}`}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-green-400"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${renewingId === member.id ? "animate-spin" : ""}`} />
                            </Button>
                            <EditMemberDialog member={member} onUpdated={handleUpdated} />
                            <DeleteMemberDialog member={member} onDeleted={handleDeleted} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 tabular-nums">{currentPage} / {totalPages}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
