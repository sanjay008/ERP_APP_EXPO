import type { TFunction } from "i18next";

/** Display API / backend strings through i18n — pass the raw key from the API. */
export function tx(t: TFunction, value?: string | null, fallback = "-"): string {
  const key = value?.trim();
  if (!key) return t(fallback);
  return t(key);
}
