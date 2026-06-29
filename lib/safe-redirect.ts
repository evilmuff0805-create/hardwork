export function getSafeRedirectPath(value: FormDataEntryValue | string | null | undefined, fallback = "/protected") {
  if (typeof value !== "string" || value.length === 0) return fallback;

  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, "http://localhost");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
