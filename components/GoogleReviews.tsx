"use client";

import React, { useMemo } from "react";
import Link from "next/link";

type Lang = "fr" | "en" | "es";

export type GoogleReviewItem = {
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string; // optionnel
};

function Stars({ rating }: { rating: number }) {
  // rating 1..5 attendu (mais on sécurise)
  const r = Math.max(1, Math.min(5, Math.round(rating || 5)));
  const full = "★".repeat(r);
  const empty = "☆".repeat(5 - r);
  return (
    <span aria-label={`${r} / 5`} style={{ fontSize: 16, letterSpacing: 0.5 }}>
      {full}
      {empty}
    </span>
  );
}

export default function GoogleReviews(props: {
  lang?: Lang;
  googleUrl: string;

  // badge "4.9 • 12 avis"
  rating?: number; // ex 4.9
  count?: number; // ex 12

  // avis à afficher (0 à 3 recommandé)
  items?: GoogleReviewItem[];

  // options UI
  title?: string;
  compact?: boolean;
}) {
  const {
    lang = "fr",
    googleUrl,
    rating,
    count,
    items = [],
    title,
    compact,
  } = props;

  const T = useMemo(() => {
    const fr = {
      title: title ?? "Avis clients",
      viewAll: "Voir sur Google",
      noText: "★★★★★",
      summary: (rt?: number, ct?: number) => {
        const hasRt = typeof rt === "number" && Number.isFinite(rt);
        const hasCt = typeof ct === "number" && Number.isFinite(ct);
        if (!hasRt && !hasCt) return "";
        if (hasRt && hasCt) return `${rt!.toFixed(1)} • ${ct} avis`;
        if (hasRt) return `${rt!.toFixed(1)} / 5`;
        return `${ct} avis`;
      },
    };

    const en = {
      title: title ?? "Reviews",
      viewAll: "View on Google",
      noText: "★★★★★",
      summary: (rt?: number, ct?: number) => {
        const hasRt = typeof rt === "number" && Number.isFinite(rt);
        const hasCt = typeof ct === "number" && Number.isFinite(ct);
        if (!hasRt && !hasCt) return "";
        if (hasRt && hasCt) return `${rt!.toFixed(1)} • ${ct} reviews`;
        if (hasRt) return `${rt!.toFixed(1)} / 5`;
        return `${ct} reviews`;
      },
    };

    const es = {
      title: title ?? "Reseñas",
      viewAll: "Ver en Google",
      noText: "★★★★★",
      summary: (rt?: number, ct?: number) => {
        const hasRt = typeof rt === "number" && Number.isFinite(rt);
        const hasCt = typeof ct === "number" && Number.isFinite(ct);
        if (!hasRt && !hasCt) return "";
        if (hasRt && hasCt) return `${rt!.toFixed(1)} • ${ct} reseñas`;
        if (hasRt) return `${rt!.toFixed(1)} / 5`;
        return `${ct} reseñas`;
      },
    };

    if (lang === "en") return en;
    if (lang === "es") return es;
    return fr;
  }, [lang, title]);

  const summary = T.summary(rating, count);

  return (
    <section aria-label={T.title} style={{ marginTop: compact ? 10 : 14 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: compact ? 15 : 16, fontWeight: 900 }}>
            {T.title}
          </h3>

          {summary ? (
            <span
              style={{
                fontSize: compact ? 12 : 13,
                padding: "4px 10px",
                border: "1px solid rgba(0,0,0,.10)",
                borderRadius: 999,
                background: "rgba(255,255,255,.75)",
                backdropFilter: "blur(6px)",
                fontWeight: 700,
              }}
            >
              {summary}
            </span>
          ) : null}
        </div>

        <Link
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: compact ? 12 : 13,
            textDecoration: "underline",
            fontWeight: 700,
          }}
        >
          {T.viewAll}
        </Link>
      </div>

      {/* Cards */}
      {items?.length ? (
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {items.slice(0, 3).map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              style={{
                border: "1px solid rgba(0,0,0,.08)",
                borderRadius: 14,
                background: "rgba(255,255,255,.75)",
                backdropFilter: "blur(6px)",
                padding: compact ? 10 : 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: compact ? 13 : 14 }}>{r.name}</strong>
                <Stars rating={r.rating} />
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: compact ? 13 : 14,
                  lineHeight: 1.45,
                  opacity: r.text ? 1 : 0.9,
                }}
              >
                {r.text && r.text.trim().length > 0 ? r.text : T.noText}
              </p>
            </div>
          ))}
        </div>
      ) : (
        // Si tu ne passes pas items, on affiche juste un petit badge propre
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            padding: compact ? "8px 10px" : "10px 12px",
            border: "1px solid rgba(0,0,0,.08)",
            borderRadius: 14,
            background: "rgba(255,255,255,.75)",
            backdropFilter: "blur(6px)",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: compact ? 14 : 16 }}>
            ★★★★★
          </span>

          {summary ? (
            <strong style={{ fontSize: compact ? 13 : 14 }}>{summary}</strong>
          ) : (
            <strong style={{ fontSize: compact ? 13 : 14 }}>
              {lang === "fr"
                ? "Avis Google"
                : lang === "en"
                ? "Google reviews"
                : "Reseñas de Google"}
            </strong>
          )}

          <Link
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ borderRadius: 10, padding: compact ? "8px 10px" : undefined }}
          >
            {T.viewAll}
          </Link>
        </div>
      )}
    </section>
  );
}
