"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { nextMonthSameDay } from "@/lib/utils/date";
import { MemberFormFields } from "./MemberFormFields";

export function CreateMemberDialog({
  onCreated,
}: {
  onCreated: (member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      fee_amount: undefined,
      paid_at: today,
      expires_at: nextMonthSameDay(today),
      notes: "",
    },
  });

  async function onSubmit(values: MemberInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error?.message ?? "Error al crear el socio");
        return;
      }
      const member = await res.json();
      onCreated(member);
      toast.success("Socio creado correctamente");
      form.reset({ full_name: "", phone: "", fee_amount: undefined, paid_at: today, expires_at: nextMonthSameDay(today), notes: "" });
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
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo socio
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir socio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <MemberFormFields form={form} autoExpiry />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
