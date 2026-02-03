"use client";

import React, { useEffect, useMemo, useState } from "react";

type Lang = "fr" | "en" | "es";

type ConsentState = {
  essential: true; // toujours true
  analytics: boolean; // audience
};

const CONSENT_COOKIE = "cq_cookie_consent_v2"; // JSON { essential:true, analytics:boolean }
const LEGACY_CONSENT_COOKIE = "cq_cookie_consent"; // "accept" | "reject" (ancien)
const LANG_COOKIE = "cq_lang";

const CONSENT_MAX_AGE_DAYS = 180;

// 🎨 Comptanet Québec
const COLORS = {
  bg: "#ffffff",
  border: "#e5e7eb",
  text: "#0f172a",
  primary: "#004aad",
  primaryText: "#ffffff",
  softBg: "#f1f5f9",
  muted: "#64748b",
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

function safeParseConsent(v: string | null): ConsentState | null {
  if (!v) return null;
  try {
    const obj = JSON.parse(v) as Partial<ConsentState>;
    if (obj && obj.essential === true && typeof obj.analytics === "boolean") {
      return { essential: true, analytics: obj.analytics };
    }
    return null;
  } catch {
    return null;
  }
}

function migrateLegacyConsent(): ConsentState | null {
  const legacy = getCookie(LEGACY_CONSENT_COOKIE);
  if (legacy === "accept") return { essential: true, analytics: true };
  if (legacy === "reject") return { essential: true, analytics: false };
  return null;
}

const TEXT = {
  fr: {
    msg:
      "ComptaNet Québec utilise des cookies essentiels pour assurer le bon fonctionnement du site. Avec votre accord, des cookies de mesure d’audience peuvent aussi être utilisés pour améliorer le site.",
    settingsTitle: "Paramètres des cookies",
    settingsMsg:
      "Les cookies essentiels sont nécessaires au fonctionnement du site. Vous pouvez choisir d’activer ou non la mesure d’audience.",
    essentialTitle: "Cookies essentiels",
    essentialDesc: "Nécessaires pour la sécurité, la connexion et l’utilisation du portail.",
    alwaysOn: "Toujours actifs",
    analyticsTitle: "Cookies de mesure d’audience",
    analyticsDesc: "Aident à comprendre l’utilisation du site (pages visitées, clics) afin de l’améliorer.",
    on: "Activé",
    off: "Désactivé",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    saveChoices: "Enregistrer mes choix",
    settings: "Paramètres",
    back: "Retour",
  },
  en: {
    msg:
      "ComptaNet Québec uses essential cookies to make the site work. With your consent, analytics cookies may also be used to improve the site.",
    settingsTitle: "Cookie settings",
    settingsMsg:
      "Essential cookies are required. You can choose whether to enable analytics cookies.",
    essentialTitle: "Essential cookies",
    essentialDesc: "Required for security, login, and using the client portal.",
    alwaysOn: "Always on",
    analyticsTitle: "Analytics cookies",
    analyticsDesc: "Help us understand site usage (pages, clicks) to improve the experience.",
    on: "On",
    off: "Off",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    saveChoices: "Save my choices",
    settings: "Settings",
    back: "Back",
  },
  es: {
    msg:
      "ComptaNet Québec utiliza cookies esenciales para que el sitio funcione. Con su consentimiento, también se pueden usar cookies de analítica para mejorar el sitio.",
    settingsTitle: "Ajustes de cookies",
    settingsMsg:
      "Las cookies esenciales son necesarias. Puede elegir si activar o no las cookies de analítica.",
    essentialTitle: "Cookies esenciales",
    essentialDesc: "Necesarias para la seguridad, el inicio de sesión y el portal.",
    alwaysOn: "Siempre activas",
    analyticsTitle: "Cookies de analítica",
    analyticsDesc: "Ayudan a entender el uso del sitio (páginas, clics) para mejorarlo.",
    on: "Activado",
    off: "Desactivado",
    acceptAll: "Aceptar todo",
    rejectAll: "Rechazar todo",
    saveChoices: "Guardar mis opciones",
    settings: "Configuración",
    back: "Volver",
  },
} as const;

function Toggle({
  checked,
  onChange,
  labelOn,
  labelOff,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        border: `1px solid ${COLORS.border}`,
        background: "#fff",
        borderRadius: 999,
        padding: "6px 10px",
        cursor: "pointer",
        fontWeight: 800,
        color: COLORS.text,
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 12, color: checked ? COLORS.primary : COLORS.muted }}>
        {checked ? labelOn : labelOff}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: checked ? COLORS.primary : "#cbd5e1",
          position: "relative",
          transition: "background 150ms ease",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#fff",
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            transition: "left 150ms ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </span>
    </button>
  );
}

export default function CookieBanner() {
  const [lang, setLang] = useState<Lang>("fr");
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [consent, setConsent] = useState<ConsentState>({ essential: true, analytics: false });

  // init langue
  useEffect(() => {
    const applyLang = () => setLang(getLangFromCookie());
    applyLang();
    window.addEventListener("cq:lang", applyLang);
    return () => window.removeEventListener("cq:lang", applyLang);
  }, []);

  // init consent + migration legacy
  useEffect(() => {
    const v2 = safeParseConsent(getCookie(CONSENT_COOKIE));
    if (v2) {
      setConsent(v2);
      setVisible(false);
      return;
    }

    const migrated = migrateLegacyConsent();
    if (migrated) {
      setConsent(migrated);
      setCookie(CONSENT_COOKIE, JSON.stringify(migrated), CONSENT_MAX_AGE_DAYS);
      setVisible(false);
      return;
    }

    // pas de consentement -> afficher
    setVisible(true);
  }, []);

  const t = useMemo(() => TEXT[lang], [lang]);

  function persist(next: ConsentState) {
    setConsent(next);
    setCookie(CONSENT_COOKIE, JSON.stringify(next), CONSENT_MAX_AGE_DAYS);
    setVisible(false);
    setShowSettings(false);

    window.dispatchEvent(new CustomEvent("cq:cookie-consent", { detail: next }));
  }

  function acceptAll() {
    persist({ essential: true, analytics: true });
  }

  function rejectAll() {
    persist({ essential: true, analytics: false });
  }

  function saveChoices() {
    persist({ essential: true, analytics: consent.analytics });
  }

  if (!visible) return null;

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
        <div style={{ flex: 1, minWidth: 280, fontSize: 14, lineHeight: 1.45 }}>
          {!showSettings ? (
            t.msg
          ) : (
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>{t.settingsTitle}</div>
              <div style={{ color: COLORS.muted }}>{t.settingsMsg}</div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {/* Essentiels */}
                <div
                  style={{
                    background: COLORS.softBg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{t.essentialTitle}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{t.essentialDesc}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: COLORS.muted }}>{t.alwaysOn}</div>
                </div>

                {/* Audience */}
                <div
                  style={{
                    background: "#fff",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{t.analyticsTitle}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{t.analyticsDesc}</div>
                  </div>

                  <Toggle
                    checked={consent.analytics}
                    onChange={(v) => setConsent({ essential: true, analytics: v })}
                    labelOn={t.on}
                    labelOff={t.off}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {!showSettings ? (
            <>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.softBg,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {t.settings}
              </button>

              <button
                type="button"
                onClick={rejectAll}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "#ffffff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {t.rejectAll}
              </button>

              <button
                type="button"
                onClick={acceptAll}
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
                {t.acceptAll}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.softBg,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {t.back}
              </button>

              <button
                type="button"
                onClick={rejectAll}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "#ffffff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {t.rejectAll}
              </button>

              <button
                type="button"
                onClick={saveChoices}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.softBg,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {t.saveChoices}
              </button>

              <button
                type="button"
                onClick={acceptAll}
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
                {t.acceptAll}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
