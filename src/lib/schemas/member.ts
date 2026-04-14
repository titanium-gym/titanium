import { z } from "zod";
import { FEE_TIERS } from "@/lib/constants";

const memberBaseSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional().or(z.literal("")),
  fee_amount: z.union(
    FEE_TIERS.map((t) => z.literal(t)) as [
      z.ZodLiteral<30>,
      z.ZodLiteral<35>,
    ],
    { error: "La cuota debe ser 30 o 35" }
  ),
  paid_at: z.string().min(1, "La fecha de pago es obligatoria"),
  expires_at: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

export const memberSchema = memberBaseSchema.refine(
  (data) => !data.paid_at || !data.expires_at || data.expires_at >= data.paid_at,
  {
    message: "La fecha de vencimiento debe ser igual o posterior a la fecha de pago",
    path: ["expires_at"],
  }
);

export const memberUpdateSchema = memberBaseSchema.partial();

export type MemberInput = z.infer<typeof memberSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
