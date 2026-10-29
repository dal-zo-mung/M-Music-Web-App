export const DEFAULT_CATEGORIES = [
  "worship",
  "christmas",
  "gospel",
  "hymn",
] as const;

export function normalizeCategory(value: unknown): string {
  if (typeof value !== "string") return "";
  const name = value.trim();
  const key = name.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const base = key.replace(/ songs?$/, "");
  if (base === "hymns") return "hymn";
  return (DEFAULT_CATEGORIES as readonly string[]).includes(base) ? base : name;
}

export function isDefaultCategory(value: unknown): boolean {
  return (DEFAULT_CATEGORIES as readonly string[]).includes(
    normalizeCategory(value),
  );
}
