"use client";

import React, { useEffect, useState } from "react";

type Lang = "fr" | "en" | "es";
type Consent = "accept" | "reject";

const CONSENT_COOKIE = "cq_cookie_consent"; // "accept" | "reject"
const LANG_COOKIE = "cq_lang"; // "fr" | "en" | "es"
const CONSENT_MAX_AGE_DAYS = 180;
const LANG_MAX_AGE_DAYS = 365;

// 🎨 Comptanet Québec
const COLORS = {
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#0f172a",
  primary: "#004aad",
  primaryText: "#ffffff",
  softBg: "#f1f5f9",
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const found =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1] ?? null;
  return found ? decodeURIComponent(found) : null;
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function normalizeLang(v: string | null): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function getLangFromCookie(): Lang {
  return normalizeLang(getCookie(LANG_COOKIE));
}

// Texte bandeau
const TEXT: Record<
  Lang,
  {
    msg: string;
    settingsTitle: string;
    settingsMsg: string;
    essential: string;
    audience: string;
    accept: string;
    reject: string;
    settings: string;
    back: string;
  }
> = {
  fr: {
    msg:
      "Comptanet Québec utilise des cookies essentiels pour assurer le bon fonctionnement du site, ainsi que des cookies non essentiels pour mesurer l’audience.",
    settingsTitle: "Paramètres des cookies",
    settingsMsg:
      "Les cookies essentiels sont requis pour le fonctionnement. Les cookies non essentiels servent uniquement à mesurer l’audience.",
    essential: "Cookies essentiels (obligatoires)",
    audience: "Cookies de mesure d’audience (non essentiels)",
    accept: "Accepter",
    reject: "Refuser",
    settings: "Paramètres",
    back: "Retour",
  },
  en: {
    msg:
      "Comptanet Québec uses essential cookies to ensure the proper functioning of the site, as well as non-essential cookies to measure audience and usage.",
    settingsTitle: "Cookie settings",
    settingsMsg:
      "Essential cookies are required for the site to work. Non-essential cookies are used only to measure audience and usage.",
    essential: "Essential cookies (required)",
    audience: "Audience measurement cookies (non-essential)",
    accept: "Accept",
    reject: "Decline",
    settings: "Settings",
    back: "Back",
  },
  es: {
    msg:
      "Comptanet Québec utiliza cookies esenciales para garantizar el correcto funcionamiento del sitio, así como cookies no esenciales para medir la audiencia.",
    settingsTitle: "Configuración de cookies",
    settingsMsg:
      "Las cookies esenciales son necesarias para que el sitio funcione. Las cookies no esenciales se usan solo para medir la audiencia.",
    essential: "Cookies esenciales (obligatorias)",
    audience: "Cookies de medición de audiencia (no esenciales)",
    accept: "Aceptar",
    reject: "Rechazar",
    settings: "Configuración",
    back: "Volver",
  },
};

export default function CookieBanner() {
  const [lang, setLang] = useState<Lang>("fr");
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ✅ init + écoute changement langue depuis la 1ère page
  useEffect(() => {
    const applyLang = () => setLang(getLangFromCookie());

    applyLang();
    window.addEventListener("cq:lang", applyLang);
    return () => window.removeEventListener("cq:lang", applyLang);
  }, []);

  // ✅ show banner si pas de consentement
  useEffect(() => {
    const v = getCookie(CONSENT_COOKIE);
    setVisible(v !== "accept" && v !== "reject");
  }, []);

  if (!visible) return null;

  const t = TEXT[lang];

  function save(choice: Consent) {
    setCookie(CONSENT_COOKIE, choice, CONSENT_MAX_AGE_DAYS);
    setVisible(false);

    // (Optionnel) événement si tu veux déclencher GA/Pixel ailleurs
    window.dispatchEvent(new CustomEvent("cq:cookie-consent", { detail: choice }));
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 980,
        margin: "0 auto",
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        padding: 16,
        color: COLORS.text,
      }}
    >
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 280, fontSize: 14, lineHeight: 1.4 }}>
          {!showSettings ? (
            t.msg
          ) : (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{t.settingsTitle}</div>
              <div style={{ opacity: 0.9 }}>{t.settingsMsg}</div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div
                  style={{
                    background: COLORS.softBg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{t.essential}</div>
                  <div style={{ fontWeight: 800, opacity: 0.8 }}>ON</div>
                </div>

                <div
                  style={{
                    background: "#fff",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{t.audience}</div>
                  {/* Ici, tu ne fais pas de toggle séparé: accept/reject global */}
                  <div style={{ fontWeight: 700, opacity: 0.7 }}>
                    {lang === "fr" ? "Choix global" : lang === "en" ? "Global choice" : "Elección global"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!showSettings ? (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.softBg,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.settings}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.softBg,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.back}
            </button>
          )}

          <button
            type="button"
            onClick={() => save("reject")}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              background: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t.reject}
          </button>

          <button
            type="button"
            onClick={() => save("accept")}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 12,
              border: "none",
              background: COLORS.primary,
              color: COLORS.primaryText,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

