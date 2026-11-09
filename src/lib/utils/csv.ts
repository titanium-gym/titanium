/**
 * Quotes a CSV cell. Text starting with a formula trigger gets a leading
 * apostrophe so spreadsheets do not execute it.
 */
export function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
