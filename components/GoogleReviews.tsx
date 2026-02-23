"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import styles from "./GoogleReviews.module.css";

type Lang = "fr" | "en" | "es";

export type GoogleReviewText = {
  fr?: string;
  en?: string;
  es?: string;
};

export type GoogleReviewItem = {
  name: string;
  rating: 5 | 4 | 3 | 2 | 1;
  text?: GoogleReviewText;
};

// ✅ ÉTOILES PRO : jaunes (★) + grises (★)
function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className={styles.stars} aria-label={`${r} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            color: i < r ? "#fbbf24" : "#e5e7eb",
          }}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function GoogleReviews(props: {
  lang?: Lang;
  googleUrl: string;

  rating?: number; // ex 5.0
  count?: number; // ex 12
  items?: GoogleReviewItem[];

  title?: string;
  compact?: boolean;

  maxItems?: number; // combien afficher
}) {
  const {
    lang = "fr",
    googleUrl,
    rating,
    count,
    items = [],
    title,
    compact = false,
    maxItems = 3,
  } = props;

  const T = useMemo(() => {
    if (lang === "en") {
      return {
        title: title ?? "Reviews",
        viewAll: "View on Google",
        noText: "★★★★★",
        summary: (rt?: number, ct?: number) =>
          rt && ct ? `${rt.toFixed(1)} • ${ct} reviews` : "",
        badge: "Google reviews",
      };
    }
    if (lang === "es") {
      return {
        title: title ?? "Reseñas",
        viewAll: "Ver en Google",
        noText: "★★★★★",
        summary: (rt?: number, ct?: number) =>
          rt && ct ? `${rt.toFixed(1)} • ${ct} reseñas` : "",
        badge: "Reseñas de Google",
      };
    }
    return {
      title: title ?? "Avis clients",
      viewAll: "Voir sur Google",
      noText: "★★★★★",
      summary: (rt?: number, ct?: number) =>
        rt && ct ? `${rt.toFixed(1)} • ${ct} avis` : "",
      badge: "Avis Google",
    };
  }, [lang, title]);

  const summary = T.summary(rating, count);
  const displayItems = items.slice(0, Math.max(0, maxItems));

  return (
    <section
      className={styles.wrap}
      data-compact={compact ? "true" : "false"}
      aria-label={T.title}
    >
      <div className={styles.header}>
        <div className={styles.left}>
          <h3 className={styles.title}>{T.title}</h3>
          {summary ? <span className={styles.summary}>{summary}</span> : null}
        </div>

        <Link
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewAll}
        >
          {T.viewAll}
        </Link>
      </div>

      {displayItems.length ? (
        <div className={styles.grid}>
          {displayItems.map((r, i) => {
            const text = r.text?.[lang] ?? "";
            const hasText = text.trim().length > 0;

            return (
              <div key={`${r.name}-${i}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <strong className={styles.name} title={r.name}>
                    {r.name}
                  </strong>
                  <Stars rating={r.rating} />
                </div>

                <p className={`${styles.text} ${!hasText ? styles.muted : ""}`}>
                  {hasText ? text : T.noText}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.badge}>
          <span className={styles.badgeStars} aria-hidden="true">
            ★★★★★
          </span>

          <strong className={styles.badgeText}>
            {summary ? summary : T.badge}
          </strong>

          <Link
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-outline ${styles.badgeBtn}`}
          >
            {T.viewAll}
          </Link>
        </div>
      )}
    </section>
  );
}
