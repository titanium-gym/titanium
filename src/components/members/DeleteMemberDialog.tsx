"use client";

import { useState } from "react";
import { Member } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteMemberDialog({
  member,
  onDeleted,
}: {
  member: Member;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar el socio");
        return;
      }
      onDeleted(member.id);
      toast.success("Socio eliminado correctamente");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar socio?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar a <strong>{member.full_name}</strong>. Esta acción no
            se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
