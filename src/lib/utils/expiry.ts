import { differenceInDays, parseISO, startOfDay } from "date-fns";

export type ExpiryStatus = "active" | "expiring-soon" | "expired";

export function getExpiryStatus(
  expiresAt: string,
  warningDays = Number(process.env.EXPIRY_WARNING_DAYS ?? 3)
): ExpiryStatus {
  const today = startOfDay(new Date());
  const expiry = startOfDay(parseISO(expiresAt));
  const diff = differenceInDays(expiry, today);

  if (diff < 0) return "expired";
  if (diff <= warningDays) return "expiring-soon";
  return "active";
}

export function getDaysUntilExpiry(expiresAt: string): number {
  const today = startOfDay(new Date());
  const expiry = startOfDay(parseISO(expiresAt));
  return differenceInDays(expiry, today);
}
