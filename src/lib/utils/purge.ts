import { z } from "zod";

export const MIN_DAYS = 7;
export const MAX_DAYS = 3650;

export const daysSchema = z
  .number()
  .int("Debe ser un número entero")
  .min(MIN_DAYS, `Mínimo ${MIN_DAYS} días`)
  .max(MAX_DAYS, `Máximo ${MAX_DAYS} días`);

export function computeThreshold(days: number): Date {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return threshold;
}
