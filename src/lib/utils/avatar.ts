export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Picks a stable palette entry for a name, so a member keeps the same color. */
export function pickByName(name: string, palette: readonly string[]): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}
