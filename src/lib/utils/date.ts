import { addMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function nextMonthSameDay(dateStr: string): string {
  try {
    return format(addMonths(parseISO(dateStr), 1), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}
