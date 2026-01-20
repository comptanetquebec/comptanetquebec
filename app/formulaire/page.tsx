"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "fr" | "en" | "es";
type ClientType = "t1" | "ta" | "t2";

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

export default function FormulairePage() {
  const bleu = "#004aad" as const;

  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Lang vient de l’URL (ex: /formulaire?lang=en)
  const lang = useMemo(() => normalizeLang(sp.get("lang")), [sp]);

  const T = {
    fr: {
      title: "Créer votre compte / Demande de prise en charge",
      intro:
        "Répondez à ces questions et nous ouvrons votre dossier sécurisé. Vous recevrez un courriel de confirmation.",
      labels: {
        firstName: "Prénom",
        lastName: "Nom",
        email: "Courriel",
        phone: "Téléphone (optionnel)",
        type: "Type de client",
        t1: "Impôt des particuliers (T1)",
        ta: "Travailleur autonome",
        t2: "Société incorporée (T2 / PME)",
        message: "Message / précisions (optionnel)",
        consent: "J’accepte d’être contacté par courriel.",
        submit: "Envoyer la demande",
        back: "Retour à l’accueil",
        lang: "Langue",
      },
    },
    en: {
      title: "Create your account / Intake form",
      intro:
        "Answer these questions and we will open your secure file. You will receive a confirmation email.",
      labels: {
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        phone: "Phone (optional)",
        type: "Client type",
        t1: "Personal income tax (T1)",
        ta: "Self-employed",
        t2: "Incorporated company (T2 / SMB)",
        message: "Message / details (optional)",
        consent: "I agree to be contacted by email.",
        submit: "Submit request",
        back: "Back to home",
        lang: "Language",
      },
    },
    es: {
      title: "Crear su cuenta / Formulario de inicio",
      intro:
        "Responda estas preguntas y abriremos su expediente seguro. Recibirá un correo de confirmación.",
      labels: {
        firstName: "Nombre",
        lastName: "Apellido",
        email: "Correo",
        phone: "Teléfono (opcional)",
        type: "Tipo de cliente",
        t1: "Impuesto personal (T1)",
        ta: "Autónomo",
        t2: "Sociedad (T2 / PyME)",
        message: "Mensaje / detalles (opcional)",
        consent: "Acepto ser contactado por correo electrónico.",
        submit: "Enviar solicitud",
        back: "Volver al inicio",
        lang: "Idioma",
      },
    },
  }[lang];

  // état des champs visibles
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientType, setClientType] = useState<ClientType>("t1");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  // champs "API" attendus par /api/contact
  const fullName = `${firstName} ${lastName}`.trim();
  const apiMessage = `Type: ${clientType.toUpperCase()}
Téléphone: ${phone || "-"}
Consentement courriel: ${consent ? "oui" : "non"}

Message:
${message || "-"}`;

  // ✅ Changement de langue = on met à jour l’URL (pour que ça “suive” partout)
  function setLang(nextLang: Lang) {
    const u = new URL(window.location.href);
    u.searchParams.set("lang", nextLang);
    router.replace(u.pathname + "?" + u.searchParams.toString());
  }

  return (
    <main style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      {/* Script reCAPTCHA v2 */}
      <script async defer src="https://www.google.com/recaptcha/api.js"></script>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "white",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link
            href={withLang("/", lang)}
            style={{ textDecoration: "none", color: bleu, fontWeight: 800 }}
          >
            ComptaNet Québec
          </Link>

          <select
            aria-label={T.labels.lang}
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              background: "white",
              color: "#374151",
            }}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
      </header>

      <section style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{T.title}</h1>
        <p style={{ color: "#4b5563", marginBottom: 18 }}>{T.intro}</p>

        {/* IMPORTANT: envoi direct à /api/contact pour inclure automatiquement g-recaptcha-response */}
        <form
          method="POST"
          action="/api/contact"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 18,
            background: "white",
          }}
        >
          {/* Champs visibles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label style={lbl}>{T.labels.firstName}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.lastName}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.phone}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.type}</label>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value as ClientType)}
                style={input as React.CSSProperties}
              >
                <option value="t1">{T.labels.t1}</option>
                <option value="ta">{T.labels.ta}</option>
                <option value="t2">{T.labels.t2}</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={lbl}>{T.labels.message}</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, color: "#374151" }}>{T.labels.consent}</span>
          </div>

          {/* --- Champs attendus par /api/contact --- */}
          <input type="hidden" name="name" value={fullName} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="lang" value={lang} />
          <textarea name="message" value={apiMessage} hidden readOnly />

          {/* reCAPTCHA v2 */}
          <div style={{ marginTop: 14 }}>
            <div className="g-recaptcha" data-sitekey="6LcUqP4rAAAAAPu5Fzw1duIE22QtT_Pt7wN3nxF7" />
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="submit"
              style={{
                background: bleu,
                color: "white",
                border: 0,
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {T.labels.submit}
            </button>

            <Link
              href={withLang("/", lang)}
              style={{
                display: "inline-block",
                background: "white",
                border: `2px solid ${bleu}`,
                color: bleu,
                padding: "10px 16px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {T.labels.back}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
};

const lbl: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  color: "#374151",
};
