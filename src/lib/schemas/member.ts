import { z } from "zod";
import { FEE_TIERS } from "@/lib/constants";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const memberBaseSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  phone: z.string().optional().or(z.literal("")),
  fee_amount: z.union(
    FEE_TIERS.map((t) => z.literal(t)) as [
      z.ZodLiteral<30>,
      z.ZodLiteral<35>,
    ],
    { error: "La cuota debe ser 30 o 35" }
  ),
  paid_at: z
    .string()
    .min(1, "La fecha de pago es obligatoria")
    .regex(ISO_DATE_RE, "Formato de fecha inválido (yyyy-MM-dd)"),
  expires_at: z
    .string()
    .min(1, "La fecha de vencimiento es obligatoria")
    .regex(ISO_DATE_RE, "Formato de fecha inválido (yyyy-MM-dd)"),
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
