export const LANGS = ["fr", "en", "es"] as const;
export type Lang = typeof LANGS[number];
export const DEFAULT_LANG: Lang = "fr";

export function normalizeLang(input?: string | null): Lang {
  const v = (input || "").toLowerCase();
  return (LANGS as readonly string[]).includes(v) ? (v as Lang) : DEFAULT_LANG;
}

export function withLang(href: string, lang: Lang): string {
  try {
    const u = new URL(href, "http://dummy.local");
    u.searchParams.set("lang", lang);
    return u.pathname + (u.search ? u.search : "");
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}lang=${lang}`;
  }
}

