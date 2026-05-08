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
import { Checkbox } from "@/components/ui/checkbox";
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
import { MembersTableToolbar } from "./MembersTableToolbar";
import { MembersTableEmptyState } from "./MembersTableEmptyState";
import { MembersTablePagination } from "./MembersTablePagination";
import { format } from "date-fns";
import {
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "expiring-soon" | "expired";
type SortField = "full_name" | "expires_at" | "fee_amount" | "paid_at";
type SortDir = "asc" | "desc";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-rose-600/80",
  "bg-orange-600/80",
  "bg-amber-600/80",
  "bg-emerald-600/80",
  "bg-sky-600/80",
  "bg-violet-600/80",
  "bg-pink-600/80",
  "bg-teal-600/80",
];

function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function StatusBadge({ expiresAt }: { expiresAt: string }) {
  const status = getExpiryStatus(expiresAt);
  if (status === "expired")
    return (
      <Badge className="bg-primary/15 text-primary border-primary/25 text-[11px] font-semibold gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        Vencido
      </Badge>
    );
  if (status === "expiring-soon")
    return (
      <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[11px] font-semibold gap-1.5">
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
        </span>
        Vence pronto
      </Badge>
    );
  return (
    <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[11px] font-semibold gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
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

function SortableHead({
  field, label, className, sortBy, sortDir, onSort,
}: {
  field: SortField; label: string; className?: string;
  sortBy: SortField; sortDir: SortDir; onSort: (f: SortField) => void;
}) {
  return (
    <TableHead
      scope="col"
      aria-sort={sortBy === field ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={`cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ""}`}
    >
      <button
        onClick={() => onSort(field)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSort(field); }}
        className="flex items-center gap-1 w-full bg-transparent border-0 p-0 text-inherit cursor-pointer"
      >
        {label}
        <SortIcon field={field} sortField={sortBy} sortDir={sortDir} />
      </button>
    </TableHead>
  );
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
      const newExpiry = nextMonthSameDay(today);
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_at: today, expires_at: newExpiry }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err?.error === "string" ? err.error : "Error al renovar";
        toast.error(msg);
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

        <MembersTableToolbar
          search={search}
          statusFilter={statusFilter}
          selectedCount={selectedIds.size}
          bulkRenewing={bulkRenewing}
          totalCount={members.length}
          filteredCount={filtered.length}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onBulkRenew={handleBulkRenew}
          onExportCSV={() => exportCSV(filtered)}
        />

        {/* Table / empty state */}
        {filtered.length === 0 ? (
          <MembersTableEmptyState totalCount={members.length} />
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border/40">
              {paginated.map((member) => {
                const isExpired = getExpiryStatus(member.expires_at) === "expired";
                return (
                  <div
                    key={member.id}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                      selectedIds.has(member.id)
                        ? "bg-primary/8"
                        : isExpired
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(member.id)}
                      onCheckedChange={() => toggleOne(member.id)}
                      aria-label={`Seleccionar ${member.full_name}`}
                      className="mt-0.5 shrink-0"
                    />
                    <div
                      className={`w-9 h-9 rounded-full ${getAvatarColor(member.full_name)} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
                    >
                      {getInitials(member.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {member.full_name}
                        </p>
                        <StatusBadge expiresAt={member.expires_at} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          Vence: {formatDate(member.expires_at)}
                        </p>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {Number(member.fee_amount).toFixed(0)} €
                        </p>
                      </div>
                      {member.phone && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{member.phone}</p>
                      )}
                      {member.notes && (
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5" title={member.notes}>
                          {member.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRenew(member)}
                        disabled={renewingId === member.id}
                        aria-label={`Renovar ${member.full_name}`}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-green-400"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${renewingId === member.id ? "animate-spin" : ""}`} />
                      </Button>
                      <EditMemberDialog member={member} onUpdated={handleUpdated} />
                      <DeleteMemberDialog member={member} onDeleted={handleDeleted} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
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
                    <SortableHead field="full_name" label="Nombre" sortBy={sortField} sortDir={sortDir} onSort={handleSort} />
                    <TableHead scope="col" className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</TableHead>
                    <SortableHead field="fee_amount" label="Cuota" className="hidden md:table-cell" sortBy={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableHead field="paid_at" label="Último pago" className="hidden md:table-cell" sortBy={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableHead field="expires_at" label="Vencimiento" sortBy={sortField} sortDir={sortDir} onSort={handleSort} />
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
                            ? "opacity-60 hover:opacity-100 hover:bg-gradient-to-r hover:from-white/[0.02] hover:to-transparent"
                            : "hover:bg-gradient-to-r hover:from-white/[0.04] hover:to-transparent"
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
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full ${getAvatarColor(member.full_name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                            >
                              {getInitials(member.full_name)}
                            </div>
                            <div>
                              <span>{member.full_name}</span>
                              {member.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5" title={member.notes}>
                                  {member.notes}
                                </p>
                              )}
                            </div>
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
            <MembersTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              filteredCount={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
