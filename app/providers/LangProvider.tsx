"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lang, DEFAULT_LANG, normalizeLang } from "@/lib/i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: DEFAULT_LANG, setLang: () => {} });
export function useLang() { return useContext(LangCtx); }

export default function LangProvider({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlLang = normalizeLang(sp.get("lang"));
  const [lang, _setLang] = useState<Lang>(urlLang);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("cq.lang")) || "";
    const cookie = (typeof document !== "undefined" && /(?:^|; )cq\.lang=([^;]+)/.exec(document.cookie || "")?.[1]) || "";
    const initial = normalizeLang(urlLang || stored || cookie || DEFAULT_LANG);
    if (initial !== lang) _setLang(initial);
    if (!sp.get("lang")) {
      const params = new URLSearchParams(sp.toString());
      params.set("lang", initial);
      router.replace(`${pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sp) return;
    const current = normalizeLang(sp.get("lang"));
    if (current !== lang) {
      const params = new URLSearchParams(sp.toString());
      params.set("lang", lang);
      router.replace(`${pathname}?${params.toString()}`);
    }
    try { localStorage.setItem("cq.lang", lang); } catch {}
    try { document.cookie = `cq.lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`; } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang: _setLang }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
