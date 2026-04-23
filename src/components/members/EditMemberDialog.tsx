"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, MemberInput } from "@/lib/schemas/member";
import { Member } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { MemberFormFields } from "./MemberFormFields";

export function EditMemberDialog({
  member,
  onUpdated,
}: {
  member: Member;
  onUpdated: (member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: member.full_name,
      phone: member.phone ?? "",
      fee_amount: Number(member.fee_amount) as 30 | 35,
      paid_at: member.paid_at,
      expires_at: member.expires_at,
      notes: member.notes ?? "",
    },
  });

  // Reset form when member changes (e.g. after renew)
  useEffect(() => {
    form.reset({
      full_name: member.full_name,
      phone: member.phone ?? "",
      fee_amount: Number(member.fee_amount) as 30 | 35,
      paid_at: member.paid_at,
      expires_at: member.expires_at,
      notes: member.notes ?? "",
    });
  }, [member, form]);

  async function onSubmit(values: MemberInput) {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error?.message ?? "Error al actualizar el socio");
        return;
      }
      const updated = await res.json();
      onUpdated(updated);
      toast.success("Socio actualizado correctamente");
      setOpen(false);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
      <Button variant="ghost" size="sm" aria-label={`Editar ${member.full_name}`} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar socio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <MemberFormFields form={form} autoExpiry={false} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
