/**
 * Generate a random URL token — 8 chars, alphanumeric, URL-safe.
 * e.g. "x7k2mq9f"
 * Used as the profile page route slug instead of name-based slugs
 * to prevent reverse-lookup of someone's identity from the URL.
 */
export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(22);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join("");
}

/** Legacy: name-based slug (kept for backwards compat lookup) */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
