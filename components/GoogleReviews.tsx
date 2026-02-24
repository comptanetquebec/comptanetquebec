"use client";

import React, { useMemo } from "react";
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
          style={{ color: i < r ? "#fbbf24" : "#e5e7eb" }}
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
  googleUrl: string; // gardé pour compat (mais non affiché)

  rating?: number; // gardé pour compat (mais non affiché)
  count?: number; // gardé pour compat (mais non affiché)
  items?: GoogleReviewItem[];

  title?: string; // gardé pour compat (mais non affiché)
  compact?: boolean;

  maxItems?: number;
}) {
  const { lang = "fr", items = [], compact = false, maxItems = 3 } = props;

  const T = useMemo(() => {
    if (lang === "en") return { noText: "★★★★★" };
    if (lang === "es") return { noText: "★★★★★" };
    return { noText: "★★★★★" };
  }, [lang]);

  const displayItems = items.slice(0, Math.max(0, maxItems));

  return (
    <section
      className={styles.wrap}
      data-compact={compact ? "true" : "false"}
      aria-label="Google reviews"
    >
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
      ) : null}
    </section>
  );
}
