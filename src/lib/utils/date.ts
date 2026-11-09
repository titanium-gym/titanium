import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
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

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}
