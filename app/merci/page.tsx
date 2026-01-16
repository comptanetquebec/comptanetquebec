"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";
const LANGS: Lang[] = ["fr", "en", "es"];

function normalizeLang(v?: string | null): Lang {
  const x = (v || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(x as Lang) ? (x as Lang) : "fr";
}

function withLang(href: string, lang: Lang): string {
  try {
    const u = new URL(href, "http://dummy.local");
    u.searchParams.set("lang", lang);
    return u.pathname + u.search;
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}lang=${lang}`;
  }
}

export default function MerciPage() {
  const sp = useSearchParams();

  // ✅ Lang depuis l’URL
  const lang = useMemo(() => normalizeLang(sp.get("lang")), [sp]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const bleu = "#004aad";

  const T = {
    fr: {
      title: "Merci !",
      subtitle: "Votre formulaire a été envoyé avec succès.",
      text: "Nous vous répondrons rapidement par courriel avec les prochaines étapes pour déposer vos documents.",
      hint: "Vous pouvez revenir à l’accueil ou ouvrir un autre formulaire.",
      back: "← Retour à l’accueil",
      homeBtn: "Retour à l’accueil",
      form: "Remplir un autre formulaire",
      lang: "Langue",
    },
    en: {
      title: "Thank you!",
      subtitle: "Your form was sent successfully.",
      text: "We will reply by email shortly with the next steps to upload your documents.",
      hint: "You can go back home or open another form.",
      back: "← Back to home",
      homeBtn: "Back to home",
      form: "Fill another form",
      lang: "Language",
    },
    es: {
      title: "¡Gracias!",
      subtitle: "Su formulario se envió correctamente.",
      text: "Le responderemos por correo con los próximos pasos para subir sus documentos.",
      hint: "Puede volver al inicio o abrir otro formulario.",
      back: "← Volver al inicio",
      homeBtn: "Volver al inicio",
      form: "Completar otro formulario",
      lang: "Idioma",
    },
  }[lang];

  // ✅ Liens qui gardent lang
  const homeHref = withLang("/", lang);
  const newFormHref = withLang("/dossiers/nouveau", lang);

  // ✅ Switcher -> change l’URL (pas juste un state)
  function langHref(l: Lang) {
    const path = "/merci";
    return withLang(path, l);
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "30px auto",
        padding: "0 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        img,
        video {
          max-width: 100%;
          height: auto;
          display: block;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Link href={homeHref} style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>
          {T.back}
        </Link>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{T.lang}</span>
          {(LANGS as Lang[]).map((l) => (
            <Link
              key={l}
              href={langHref(l)}
              style={{
                border: `1px solid ${l === lang ? bleu : "#e5e7eb"}`,
                background: l === lang ? bleu : "white",
                color: l === lang ? "white" : "#374151",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                textDecoration: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
              aria-current={l === lang ? "page" : undefined}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* Carte */}
      <section style={{ display: "grid", placeItems: "center" }}>
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            padding: isMobile ? 18 : 28,
            maxWidth: 720,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: bleu, margin: 0, fontSize: "clamp(24px,6vw,36px)" }}>{T.title}</h1>
          <p style={{ color: "#111827", marginTop: 10, fontWeight: 700 }}>{T.subtitle}</p>
          <p style={{ color: "#4b5563", marginTop: 6 }}>{T.text}</p>
          <p style={{ color: "#6b7280", marginTop: 6 }}>{T.hint}</p>

          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link
              href={homeHref}
              style={{
                background: bleu,
                color: "white",
                padding: "10px 16px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {T.homeBtn}
            </Link>

            <Link
              href={newFormHref}
              style={{
                border: `2px solid ${bleu}`,
                color: bleu,
                padding: "8px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {T.form}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
