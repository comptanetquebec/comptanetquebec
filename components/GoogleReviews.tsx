"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import styles from "./GoogleReviews.module.css";

type Lang = "fr" | "en" | "es";

export type GoogleReviewItem = {
  name: string;
  rating: 5 | 4 | 3 | 2 | 1;
  text?: string;
};

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  const full = "★".repeat(r);
  const empty = "☆".repeat(5 - r);
  return (
    <span className={styles.stars} aria-label={`${r} / 5`}>
      {full}
      {empty}
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

  maxItems?: number; // ✅ au lieu d’être bloqué à 3
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
    <section className={styles.wrap} data-compact={compact ? "true" : "false"} aria-label={T.title}>
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
          {displayItems.map((r, i) => (
            <div key={`${r.name}-${i}`} className={styles.card}>
              <div className={styles.cardTop}>
                <strong className={styles.name} title={r.name}>
                  {r.name}
                </strong>
                <Stars rating={r.rating} />
              </div>

              <p className={`${styles.text} ${!r.text?.trim() ? styles.muted : ""}`}>
                {r.text && r.text.trim().length > 0 ? r.text : T.noText}
              </p>
            </div>
          ))}
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
