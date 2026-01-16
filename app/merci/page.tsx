"use client";

import React, { useMemo } from "react";
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

  const langParam = sp.get("lang");
  const lang = useMemo(() => normalizeLang(langParam), [langParam]);

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

  const homeHref = withLang("/", lang);
  const newFormHref = withLang("/dossiers/nouveau", lang); // ou /formulaire-fiscal si tu préfères

  function langHref(l: Lang) {
    return withLang("/merci", l);
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "clamp(16px, 4vw, 30px) auto",
        padding: "0 clamp(12px, 3vw, 16px)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        a {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href={homeHref}
          style={{
            textDecoration: "none",
            color: "#374151",
            whiteSpace: "nowrap",
            padding: "8px 6px",
            borderRadius: 10,
          }}
        >
          {T.back}
        </Link>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: 12, color: "#6b7280" }}>{T.lang}</span>

          {(LANGS as Lang[]).map((l) => (
            <Link
              key={l}
              href={langHref(l)}
              style={{
                border: `1px solid ${l === lang ? bleu : "#e5e7eb"}`,
                background: l === lang ? bleu : "white",
                color: l === lang ? "white" : "#374151",
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                textDecoration: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
                minWidth: 52,
                textAlign: "center",
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
            padding: "clamp(18px, 3vw, 28px)",
            maxWidth: 720,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: bleu, margin: 0, fontSize: "clamp(24px, 6vw, 36px)" }}>{T.title}</h1>

          <p style={{ color: "#111827", marginTop: 10, fontWeight: 700, fontSize: "clamp(14px, 2.2vw, 16px)" }}>
            {T.subtitle}
          </p>

          <p style={{ color: "#4b5563", marginTop: 6, fontSize: "clamp(13px, 2.1vw, 15px)", lineHeight: 1.5 }}>
            {T.text}
          </p>

          <p style={{ color: "#6b7280", marginTop: 6, fontSize: "clamp(12px, 2vw, 14px)", lineHeight: 1.5 }}>
            {T.hint}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              marginTop: 16,
              alignItems: "stretch",
            }}
          >
            <Link
              href={homeHref}
              style={{
                background: bleu,
                color: "white",
                padding: "12px 16px",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: 700,
                textAlign: "center",
                display: "block",
              }}
            >
              {T.homeBtn}
            </Link>

            <Link
              href={newFormHref}
              style={{
                border: `2px solid ${bleu}`,
                color: bleu,
                padding: "10px 16px",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: 700,
                textAlign: "center",
                display: "block",
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
