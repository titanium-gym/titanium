"use client";

import { useState } from "react";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Search, Trash2, UserX, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PreviewMember = {
  id: number;
  full_name: string;
  expires_at: string;
  phone: string | null;
};

const MIN_DAYS = 7;
const DEFAULT_DAYS = 60;

function formatDate(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy");
}

function daysSince(iso: string): number {
  const today = startOfDay(new Date());
  const expiry = startOfDay(parseISO(iso));
  return differenceInDays(today, expiry);
}

export function PurgePanel() {
  const [days, setDays] = useState<number>(DEFAULT_DAYS);
  const [inputValue, setInputValue] = useState<string>(String(DEFAULT_DAYS));
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<PreviewMember[] | null>(null);
  const [searched, setSearched] = useState(false);

  const validDays = Number.isInteger(days) && days >= MIN_DAYS;

  async function handlePreview() {
    if (!validDays) return;
    setPreviewing(true);
    setPreview(null);
    setSearched(false);
    try {
      const res = await fetch(`/api/members/purge?days=${days}`);
      if (!res.ok) {
        toast.error("Error al obtener la previsualización");
        return;
      }
      const data = await res.json() as { members: PreviewMember[]; count: number };
      setPreview(data.members);
      setSearched(true);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDelete() {
    if (!validDays) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/members/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) {
        toast.error("Error al eliminar socios");
        return;
      }
      const data = await res.json() as { deleted: number };
      toast.success(
        data.deleted === 0
          ? "No había socios que eliminar"
          : `${data.deleted} ${data.deleted === 1 ? "socio eliminado" : "socios eliminados"} correctamente`
      );
      setPreview([]);
      setSearched(false);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  function handleDaysChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    const num = parseInt(val, 10);
    setDays(Number.isNaN(num) ? 0 : num);
    setPreview(null);
    setSearched(false);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Danger zone banner */}
      <div className="rounded-xl border border-destructive/30 bg-gradient-to-r from-destructive/12 to-destructive/5 px-4 py-3.5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_-2px_oklch(0.62_0.22_27_/_0.4)] mt-0.5">
          <TriangleAlert className="w-4.5 h-4.5 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Zona de peligro</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Los socios eliminados no se pueden recuperar. Esta acción es permanente e irreversible.
          </p>
        </div>
      </div>

      {/* Config card */}
      <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <UserX className="w-3.5 h-3.5 text-destructive" aria-hidden="true" />
            Umbral de vencimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-[180px] space-y-1.5">
              <Label htmlFor="days-input" className="text-sm text-foreground">
                Días vencidos
              </Label>
              <Input
                id="days-input"
                type="number"
                min={MIN_DAYS}
                step={1}
                value={inputValue}
                onChange={handleDaysChange}
                className="tabular-nums"
                aria-describedby="days-hint"
              />
              <p id="days-hint" className="text-[11px] text-muted-foreground">
                Mínimo {MIN_DAYS} días
              </p>
            </div>

            <Button
              onClick={handlePreview}
              disabled={!validDays || previewing}
              variant="outline"
              className="gap-2"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              {previewing ? "Consultando…" : "Previsualizar"}
            </Button>
          </div>

          {!validDays && inputValue !== "" && (
            <p className="mt-2 text-xs text-destructive flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" aria-hidden="true" />
              El valor mínimo es {MIN_DAYS} días
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview results */}
      {searched && preview !== null && (
        <Card className={`border-border/60 ${preview.length > 0 ? "border-destructive/30 bg-destructive/5" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                {preview.length > 0 ? (
                  <span className="text-destructive flex items-center gap-2">
                    <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
                    {preview.length} {preview.length === 1 ? "socio" : "socios"} a eliminar
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin resultados</span>
                )}
              </CardTitle>

              {preview.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5 h-8"
                        disabled={deleting}
                      />
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {deleting ? "Eliminando…" : `Eliminar ${preview.length}`}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar {preview.length} {preview.length === 1 ? "socio" : "socios"}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminarán permanentemente todos los socios con la cuota vencida
                        hace más de <strong>{days} días</strong>. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {preview.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay socios vencidos hace más de {days} días 🎉
              </p>
            ) : (
              <div className="rounded-lg border border-destructive/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-destructive/20 hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-wider">Nombre</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider hidden sm:table-cell">Teléfono</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider">Venció</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-right">Días</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((m) => (
                      <TableRow key={m.id} className="border-destructive/15">
                        <TableCell className="font-medium text-sm">{m.full_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          {m.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm tabular-nums">
                          {formatDate(m.expires_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums text-destructive">
                            {daysSince(m.expires_at)}d
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
