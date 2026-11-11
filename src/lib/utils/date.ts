import { addMonths, differenceInDays, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const APP_TIME_ZONE = "Europe/Madrid";

/** Today in the gym's time zone (yyyy-MM-dd), so server (UTC) and browser agree. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(new Date());
}

/** First and last day of the current month (yyyy-MM-dd). */
export function currentMonthRange(): { start: string; end: string } {
  const today = parseISO(todayISO());
  return {
    start: format(startOfMonth(today), "yyyy-MM-dd"),
    end: format(endOfMonth(today), "yyyy-MM-dd"),
  };
}

export function nextMonthSameDay(dateStr: string): string {
  try {
    return format(addMonths(parseISO(dateStr), 1), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

/** New expiry after a renewal: extends from MAX(expires_at, today) to preserve prepaid time. */
export function renewalExpiry(expiresAt: string, today: string = todayISO()): string {
  return nextMonthSameDay(expiresAt > today ? expiresAt : today);
}

type PaymentDates = { paid_at: string; expires_at: string };

/**
 * A changed paid_at fixes a mistyped date, rather than recording a renewal, when
 * the date barely moves and the expiry does not gain a month. Anything else
 * counts as a new payment, so a real renewal is never overwritten.
 */
export function isPaymentDateCorrection(before: PaymentDates, after: PaymentDates): boolean {
  const paidShift = Math.abs(differenceInDays(parseISO(after.paid_at), parseISO(before.paid_at)));
  const expiryGain = differenceInDays(parseISO(after.expires_at), parseISO(before.expires_at));
  return paidShift < 15 && expiryGain < 28;
}

/**
 * Whether an edit touches the payment history: paid_at changed, or the expiry
 * gained a month on the same paid_at (a second renewal on the same day).
 */
export function affectsPaymentHistory(before: PaymentDates, after: PaymentDates): boolean {
  return before.paid_at !== after.paid_at || !isPaymentDateCorrection(before, after);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}
