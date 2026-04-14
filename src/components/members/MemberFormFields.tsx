"use client";

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { MemberInput } from "@/lib/schemas/member";
import { FEE_TIERS } from "@/lib/constants";
import { nextMonthSameDay } from "@/lib/utils/date";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface MemberFormFieldsProps {
  form: UseFormReturn<MemberInput>;
  /** When true, expires_at auto-updates when paid_at changes */
  autoExpiry?: boolean;
}

export function MemberFormFields({ form, autoExpiry = true }: MemberFormFieldsProps) {
  const paidAt = form.watch("paid_at");

  useEffect(() => {
    if (autoExpiry && paidAt) {
      form.setValue("expires_at", nextMonthSameDay(paidAt), {
        shouldValidate: true,
      });
    }
  }, [paidAt, autoExpiry, form]);

  return (
    <>
      <FormField
        control={form.control}
        name="full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre completo *</FormLabel>
            <FormControl>
              <Input placeholder="Juan García López" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono</FormLabel>
            <FormControl>
              <Input placeholder="600 000 000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="fee_amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cuota (€) *</FormLabel>
            <Select
              onValueChange={(v) => field.onChange(Number(v))}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cuota" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FEE_TIERS.map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    {t} €
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="paid_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de pago *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expires_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimiento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notas</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Observaciones, notas de pago…"
                className="resize-none"
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
