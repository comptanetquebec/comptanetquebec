"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const LANGS = ["fr", "en", "es"] as const;

export default function LangSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchLang(lang: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", lang);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          style={{
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "4px 10px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
