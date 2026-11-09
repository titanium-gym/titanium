import { differenceInDays, isValid, parseISO, startOfDay } from "date-fns";
import { EXPIRY_WARNING_DAYS } from "@/lib/constants";
import { todayISO } from "@/lib/utils/date";

export type ExpiryStatus = "active" | "expiring-soon" | "expired" | "unknown";

export function getExpiryStatus(
  expiresAt: string,
  warningDays = EXPIRY_WARNING_DAYS
): ExpiryStatus {
  if (!expiresAt || !isValid(parseISO(expiresAt))) return "unknown";
  const today = startOfDay(parseISO(todayISO()));
  const expiry = startOfDay(parseISO(expiresAt));
  const diff = differenceInDays(expiry, today);

  if (diff < 0) return "expired";
  if (diff <= warningDays) return "expiring-soon";
  return "active";
}

export function getDaysUntilExpiry(expiresAt: string): number {
  const today = startOfDay(parseISO(todayISO()));
  const expiry = startOfDay(parseISO(expiresAt));
  return differenceInDays(expiry, today);
}
