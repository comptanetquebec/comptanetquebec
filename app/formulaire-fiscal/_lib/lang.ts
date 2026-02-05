// app/formulaire-fiscal/_lib/lang.ts

export type Lang = "fr" | "en" | "es";

function normalizeLang(v: string | null | undefined): Lang | null {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : null;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const safe = name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&");
  const m = document.cookie.match(new RegExp("(^|; )" + safe + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Règle:
 * 1) ?lang=fr|en|es (prioritaire)
 * 2) cookie cq_lang
 * 3) fallback "fr"
 */
export function resolveLangFromParams(
  params: URLSearchParams,
  cookieName = "cq_lang"
): Lang {
  const q = normalizeLang(params.get("lang"));
  if (q) {
    setCookie(cookieName, q);
    return q;
  }

  const c = normalizeLang(getCookie(cookieName));
  return c ?? "fr";
}
