"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";

/** Déclaration minimale pour éviter l'erreur TS sur grecaptcha (v2 checkbox) */
declare const grecaptcha: any;

/* --- style de base pour les inputs du formulaire contact --- */
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
};

/* --- composant carte pour choix T1 / autonome / T2 --- */
function TaxChoiceCard({
  title,
  desc,
  btn,
  href,
  bleu,
}: {
  title: string;
  desc: string;
  btn: string;
  href: string;
  bleu: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "white",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        minHeight: 170,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: "#111827",
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginTop: 6,
          lineHeight: 1.4,
        }}
      >
        {desc}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Link
          href={href}
          style={{
            display: "inline-block",
            background: bleu,
            color: "white",
            padding: "10px 14px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 800,
            fontSize: 14,
            marginTop: 12,
            textAlign: "center",
            width: "100%",
          }}
        >
          {btn}
        </Link>
      </div>
    </div>
  );
}

/* --- composant FAQ accordéon --- */
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              background: "white",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                background: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 800,
                color: "#111827",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              aria-expanded={isOpen}
            >
              <span>{it.q}</span>
              <span style={{ fontSize: 18, color: "#6b7280" }}>
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "0 16px 16px",
                  color: "#4b5563",
                  fontSize: 14,
                  lineHeight: 1.45,
                }}
              >
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const bleu = "#004aad" as const;

  // langues supportées
  type Lang = "fr" | "en" | "es";
  const [lang, setLang] = useState<Lang>("fr");
  const [isMobile, setIsMobile] = useState(false);

  // formulaire contact (optionnel API)
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactOk, setContactOk] = useState<string | null>(null);
  const [contactErr, setContactErr] = useState<string | null>(null);

  // ✅ Initialiser la langue depuis l'URL (?lang=fr/en/es)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get("lang") || "").toLowerCase();
      if (q === "fr" || q === "en" || q === "es") setLang(q);
    } catch {}
  }, []);

  // responsive helper
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const COPY = useMemo(() => {
    return {
      fr: {
        brand: "ComptaNet Québec",
        nav: {
          services: "Services",
          steps: "Étapes",
          pricing: "Tarifs",
          faq: "FAQ",
          contact: "Contact",
          client: "Espace client",
        },
        ctaMain: "Commencer mon dossier",

        heroTitle: (
          <>
            Impôts{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>au Québec</span>{" "}
            avec{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>ComptaNet Québec</span>
          </>
        ),
        heroSub:
          "T1 (particuliers et travailleurs autonomes) et T2/CO-17 (sociétés au Québec). Dépôt de documents via portail sécurisé. Je fais vos impôts à partir des informations fournies et je vous contacte s’il manque quelque chose avant l’envoi.",

        chooseType: "Choisissez votre situation",
        t1Title: "Impôt personnel (T1 – Québec)",
        t1Desc:
          "Salarié, étudiant, retraité, etc. Préparation à partir de vos documents (T4, Relevé 1, etc.).",
        t1Btn: "Commencer T1",

        autoTitle: "Travailleur autonome (T1 – Québec)",
        autoDesc:
          "Revenus d’entreprise + dépenses admissibles selon les pièces fournies (factures, relevés, etc.).",
        autoBtn: "Commencer autonome",

        t2Title: "Société (T2 + CO-17 – Québec)",
        t2Desc:
          "Déclaration de société au Québec. Préparation à partir des documents et informations fournis.",
        t2Btn: "Commencer T2",

        servicesTitle: "Services",
        servicesSub:
          "Impôts au Québec (T1, autonome, T2/CO-17) — dépôt de documents par portail sécurisé.",
        services: [
          {
            t: "Impôt personnel (T1 – Québec)",
            d: "Préparation de votre déclaration annuelle à partir des documents fournis.",
          },
          {
            t: "Travailleur autonome (T1 – Québec)",
            d: "Revenus et dépenses selon les pièces justificatives fournies.",
          },
          {
            t: "Société (T2 + CO-17 – Québec)",
            d: "Préparation de la déclaration de société au Québec à partir des documents fournis.",
          },
          {
            t: "Portail sécurisé",
            d: "Téléversement de vos documents (photo ou PDF). Tout au même endroit.",
          },
          {
            t: "Vérification du dossier",
            d: "Je vérifie que le dossier est complet et je vous contacte si une info manque.",
          },
        ],

        stepsTitle: "Comment ça fonctionne",
        steps: [
          {
            n: "1",
            t: "Créez votre compte",
            d: "Ouverture de votre espace client sécurisé.",
          },
          {
            n: "2",
            t: "Téléversez vos documents",
            d: "Glissez vos documents (photo ou PDF) dans le portail.",
          },
          {
            n: "3",
            t: "Je prépare votre déclaration",
            d: "Préparation à partir des informations fournies. Vous validez avant l’envoi.",
          },
          {
            n: "4",
            t: "Envoi",
            d: "Transmission selon votre situation. Vous recevez une confirmation.",
          },
        ],

        pricingTitle: "Tarifs 2026",
        pricingSub:
          "Tarifs de base. Le prix final dépend de la complexité (revenus multiples, immeubles locatifs, tenue de livres manquante, etc.). Le montant est confirmé avant l’envoi.",
        plans: [
          {
            t: "Impôt personnel (T1 – Québec)",
            p: "à partir de 100 $",
            pts: [
              "Portail sécurisé",
              "Préparation selon documents fournis",
              "Acompte initial 100 $",
            ],
            href: "/tarifs/t1",
          },
          {
            t: "Travailleur autonome (T1 – Québec)",
            p: "à partir de 150 $",
            pts: [
              "Revenus + dépenses selon pièces",
              "Portail sécurisé",
              "Acompte initial 100 $",
            ],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Société (T2 + CO-17 – Québec)",
            p: "à partir de 850 $",
            pts: [
              "Préparation selon documents fournis",
              "Portail sécurisé",
              "Acompte initial 400 $",
              "Société sans revenus : à partir de 450 $",
            ],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "Voir les détails",

        whyTitle: "Pourquoi choisir ComptaNet Québec",
        whyPoints: [
          { t: "Simple et clair", d: "Un processus guidé, sans papier." },
          { t: "Portail sécurisé", d: "Téléversement de vos documents au même endroit." },
          { t: "Québec seulement", d: "Service centré sur la réalité du Québec." },
          { t: "Suivi du dossier", d: "Je vous contacte si un document ou une info manque." },
        ],

        faqTitle: "FAQ",
        faq: [
          {
            q: "Est-ce que c’est seulement pour le Québec ?",
            a: "Oui. ComptaNet Québec sert les résidents et entreprises du Québec.",
          },
          {
            q: "Comment j’envoie mes documents ?",
            a: "Après création du compte, vous téléversez vos documents dans le portail (photo ou PDF).",
          },
          {
            q: "Combien de temps ça prend ?",
            a: "Habituellement 3 à 7 jours ouvrables après réception complète des documents. En haute saison, les dossiers incomplets peuvent prendre plus de temps.",
          },
          {
            q: "Comment se fait le paiement ?",
            a: "Un acompte est demandé (100 $ pour T1 / 400 $ pour T2). Le solde est payable quand la déclaration est prête, avant l’envoi.",
          },
          {
            q: "Quels documents dois-je fournir ?",
            a: "Ça dépend de votre situation. Après ouverture du dossier, vous aurez une liste simple des documents à téléverser.",
          },
        ],

        contactTitle: "Contact",
        contactHint: "Vous pouvez aussi nous écrire à",
        send: "Envoyer",
        sending: "Envoi...",
        sentOk: "Message envoyé. Merci!",
        sentErr: "Impossible d’envoyer. Réessayez ou écrivez-nous par courriel.",
        contactPlaceholders: {
          name: "Votre nom",
          email: "Votre courriel",
          msg: "Votre message",
        },

        langLabel: "Langue",
        langNames: { fr: "FR", en: "EN", es: "ES" },

        footerLinks: {
          services: "Services",
          pricing: "Tarifs",
          contact: "Contact",
          legal: {
            privacy: "Politique de confidentialité",
            terms: "Conditions d’utilisation",
            disclaimer: "Avis légal",
            note:
              "Nous ne sommes pas l’ARC ni Revenu Québec. Les déclarations sont préparées et transmises à partir des informations fournies par le client.",
          },
        },
      },

      en: {
        brand: "ComptaNet Québec",
        nav: {
          services: "Services",
          steps: "Steps",
          pricing: "Pricing",
          faq: "FAQ",
          contact: "Contact",
          client: "Client portal",
        },
        ctaMain: "Start my file",
        heroTitle: (
          <>
            Taxes{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>in Québec</span>{" "}
            with{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>
              ComptaNet Québec
            </span>
          </>
        ),
        heroSub:
          "Québec-only service for T1 (individuals and self-employed) and T2/CO-17 (corporations). Upload documents through a secure portal. I prepare your return from the information you provide and contact you if anything is missing before filing.",

        chooseType: "Choose your situation",
        t1Title: "Personal return (T1 – Québec)",
        t1Desc: "Prepared from the documents you provide.",
        t1Btn: "Start T1",
        autoTitle: "Self-employed (T1 – Québec)",
        autoDesc: "Income and expenses based on your supporting documents.",
        autoBtn: "Start self-employed",
        t2Title: "Corporation (T2 + CO-17 – Québec)",
        t2Desc: "Prepared from the information and documents you provide.",
        t2Btn: "Start T2",

        servicesTitle: "Services",
        servicesSub:
          "Québec-only tax returns (T1, self-employed, T2/CO-17) — secure document portal.",
        services: [
          { t: "Personal return (T1 – Québec)", d: "Prepared from your documents." },
          { t: "Self-employed (T1 – Québec)", d: "Income and expenses based on your documents." },
          { t: "Corporation (T2 + CO-17 – Québec)", d: "Prepared from your information and documents." },
          { t: "Secure portal", d: "Upload documents (photo or PDF). Paperless." },
          { t: "File check", d: "I review completeness and contact you if something is missing." },
        ],

        stepsTitle: "How it works",
        steps: [
          { n: "1", t: "Create your account", d: "Your secure client portal is opened." },
          { n: "2", t: "Upload documents", d: "Upload documents (photo or PDF) into the portal." },
          { n: "3", t: "I prepare your return", d: "Prepared from the information provided. You review before filing." },
          { n: "4", t: "Filing", d: "Filed based on your situation. You receive confirmation." },
        ],

        pricingTitle: "2026 Pricing",
        pricingSub:
          "Base pricing. Final price depends on complexity. The amount is confirmed before filing.",
        plans: [
          {
            t: "Personal return (T1 – Québec)",
            p: "from $100",
            pts: ["Secure portal", "Prepared from provided documents", "Deposit $100"],
            href: "/tarifs/t1",
          },
          {
            t: "Self-employed (T1 – Québec)",
            p: "from $150",
            pts: ["Income + expenses from documents", "Secure portal", "Deposit $100"],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Corporation (T2 + CO-17 – Québec)",
            p: "from $850",
            pts: ["Prepared from provided documents", "Secure portal", "Deposit $400", "No-revenue corp: from $450"],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "View details",

        whyTitle: "Why choose ComptaNet Québec",
        whyPoints: [
          { t: "Simple process", d: "Clear steps and paperless workflow." },
          { t: "Secure portal", d: "Everything in one place." },
          { t: "Québec only", d: "Focused on Québec." },
          { t: "File follow-up", d: "I contact you if something is missing." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "Is it Québec only?", a: "Yes. ComptaNet Québec serves Québec residents and Québec corporations." },
          { q: "How do I send my documents?", a: "After creating your account, you upload documents in the secure portal (photo or PDF)." },
          { q: "How long does it take?", a: "Usually 3–7 business days after receiving complete documents. Peak season may take longer for incomplete files." },
          { q: "How do payments work?", a: "A deposit is required ($100 for T1 / $400 for T2). The balance is paid when the return is ready, before filing." },
          { q: "What documents do I need?", a: "It depends on your situation. After opening your file, you’ll receive a simple checklist." },
        ],

        contactTitle: "Contact",
        contactHint: "You can also email us at",
        send: "Send",
        sending: "Sending...",
        sentOk: "Message sent. Thank you!",
        sentErr: "Unable to send. Please try again or email us.",
        contactPlaceholders: { name: "Your name", email: "Your email", msg: "Your message" },

        langLabel: "Language",
        langNames: { fr: "FR", en: "EN", es: "ES" },

        footerLinks: {
          services: "Services",
          pricing: "Pricing",
          contact: "Contact",
          legal: {
            privacy: "Privacy policy",
            terms: "Terms of use",
            disclaimer: "Legal notice",
            note:
              "We are not the CRA nor Revenu Québec. Returns are prepared and filed based on the information provided by the client.",
          },
        },
      },

      es: {
        brand: "ComptaNet Québec",
        nav: {
          services: "Servicios",
          steps: "Pasos",
          pricing: "Precios",
          faq: "FAQ",
          contact: "Contacto",
          client: "Portal del cliente",
        },
        ctaMain: "Empezar mi expediente",
        heroTitle: (
          <>
            Impuestos{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>en Québec</span>{" "}
            con{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>
              ComptaNet Québec
            </span>
          </>
        ),
        heroSub:
          "Servicio solo para Québec: T1 (personas y autónomos) y T2/CO-17 (empresas). Suba documentos por un portal seguro. Preparo la declaración con la información proporcionada y le contacto si falta algo antes de presentar.",

        chooseType: "Elija su situación",
        t1Title: "Declaración personal (T1 – Québec)",
        t1Desc: "Preparada con los documentos proporcionados.",
        t1Btn: "Empezar T1",
        autoTitle: "Autónomo (T1 – Québec)",
        autoDesc: "Ingresos y gastos según sus comprobantes.",
        autoBtn: "Empezar autónomo",
        t2Title: "Empresa (T2 + CO-17 – Québec)",
        t2Desc: "Preparada con la información y documentos proporcionados.",
        t2Btn: "Empezar T2",

        servicesTitle: "Servicios",
        servicesSub:
          "Solo Québec (T1, autónomos, T2/CO-17) — portal seguro para documentos.",
        services: [
          { t: "T1 personal (Québec)", d: "Preparada con sus documentos." },
          { t: "Autónomo (T1 – Québec)", d: "Ingresos y gastos según comprobantes." },
          { t: "Empresa (T2 + CO-17 – Québec)", d: "Preparada con su información y documentos." },
          { t: "Portal seguro", d: "Suba documentos (foto o PDF). Sin papel." },
          { t: "Revisión del expediente", d: "Reviso si falta algo y le contacto." },
        ],

        stepsTitle: "Cómo funciona",
        steps: [
          { n: "1", t: "Cree su cuenta", d: "Se abre su portal seguro." },
          { n: "2", t: "Suba documentos", d: "Suba documentos (foto o PDF) en el portal." },
          { n: "3", t: "Preparo la declaración", d: "Con la información proporcionada. Usted valida antes de presentar." },
          { n: "4", t: "Presentación", d: "Se presenta según su situación. Recibe confirmación." },
        ],

        pricingTitle: "Precios 2026",
        pricingSub:
          "Precios base. El monto final depende de la complejidad y se confirma antes de presentar.",
        plans: [
          { t: "T1 personal (Québec)", p: "desde $100", pts: ["Portal seguro", "Según documentos", "Depósito $100"], href: "/tarifs/t1" },
          { t: "Autónomo (T1 – Québec)", p: "desde $150", pts: ["Ingresos + gastos", "Portal seguro", "Depósito $100"], href: "/tarifs/travailleur-autonome" },
          { t: "Empresa (T2 + CO-17 – Québec)", p: "desde $850", pts: ["Según documentos", "Portal seguro", "Depósito $400", "Sin ingresos: desde $450"], href: "/tarifs/t2" },
        ],
        getPrice: "Ver detalles",

        whyTitle: "Por qué elegir ComptaNet Québec",
        whyPoints: [
          { t: "Proceso simple", d: "Pasos claros y sin papel." },
          { t: "Portal seguro", d: "Todo en un solo lugar." },
          { t: "Solo Québec", d: "Servicio enfocado en Québec." },
          { t: "Seguimiento", d: "Le contacto si falta algo." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "¿Es solo para Québec?", a: "Sí. ComptaNet Québec atiende residentes y empresas de Québec." },
          { q: "¿Cómo envío mis documentos?", a: "Después de crear la cuenta, sube los documentos en el portal seguro (foto o PDF)." },
          { q: "¿Cuánto tarda?", a: "Normalmente 3–7 días hábiles con documentos completos. En temporada alta puede tardar más si falta información." },
          { q: "¿Cómo se paga?", a: "Se requiere un depósito ($100 para T1 / $400 para T2). El saldo se paga cuando esté listo, antes de presentar." },
          { q: "¿Qué documentos necesito?", a: "Depende de su situación. Tras abrir el expediente, recibirá una lista simple." },
        ],

        contactTitle: "Contacto",
        contactHint: "También puede escribirnos a",
        send: "Enviar",
        sending: "Enviando...",
        sentOk: "Mensaje enviado. ¡Gracias!",
        sentErr: "No se pudo enviar. Inténtelo de nuevo o escríbanos por correo.",
        contactPlaceholders: { name: "Su nombre", email: "Su correo", msg: "Su mensaje" },

        langLabel: "Idioma",
        langNames: { fr: "FR", en: "EN", es: "ES" },

        footerLinks: {
          services: "Servicios",
          pricing: "Precios",
          contact: "Contacto",
          legal: {
            privacy: "Política de privacidad",
            terms: "Términos de uso",
            disclaimer: "Aviso legal",
            note:
              "No somos la CRA ni Revenu Québec. Las declaraciones se preparan y se presentan con la información proporcionada por el cliente.",
          },
        },
      },
    } as const;
  }, [bleu]);

  const T = COPY[lang];

  // ✅ URLs avec lang conservé partout
  const toT1 = `/espace-client?lang=${lang}&next=/formulaire-fiscal`;
  const toT1Auto = `/espace-client?lang=${lang}&next=/formulaire-fiscal?type=autonome`;
  const toT2 = `/espace-client?lang=${lang}&next=/T2`;

  // sélecteur de langue
  const LangSwitcher = () => {
    if (isMobile) {
      return (
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{
            border: "1px solid #e5e7eb",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 12,
          }}
          aria-label={T.langLabel}
        >
          {(["fr", "en", "es"] as Lang[]).map((l) => (
            <option key={l} value={l}>
              {T.langNames[l]}
            </option>
          ))}
        </select>
      );
    }

    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{T.langLabel}</span>
        {(["fr", "en", "es"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              border: `1px solid ${l === lang ? bleu : "#e5e7eb"}`,
              background: l === lang ? bleu : "white",
              color: l === lang ? "white" : "#374151",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: 1,
              fontWeight: 700,
              minWidth: 44,
            }}
            aria-pressed={l === lang}
          >
            {T.langNames[l]}
          </button>
        ))}
      </div>
    );
  };

  /** Optionnel API contact: envoi via /api/contact avec token reCAPTCHA */
  const onContactSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setContactOk(null);
    setContactErr(null);

    let token = "";
    try {
      token = typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : "";
    } catch {
      token = "";
    }
    if (!token) {
      setContactErr(
        lang === "fr"
          ? "Merci de cocher « Je ne suis pas un robot »."
          : lang === "en"
          ? 'Please check "I’m not a robot".'
          : 'Por favor marque "No soy un robot".'
      );
      return;
    }

    setContactBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMsg,
          lang,
          recaptchaToken: token,
        }),
      });

      if (!res.ok) throw new Error("bad_status");
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data?.ok) throw new Error(data?.error || "unknown");

      setContactOk(T.sentOk);
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      try {
        if (typeof grecaptcha !== "undefined") grecaptcha.reset();
      } catch {}
    } catch {
      setContactErr(T.sentErr);
    } finally {
      setContactBusy(false);
    }
  };

  return (
    <main style={{ fontFamily: "Arial, sans-serif", color: "#1f2937" }}>
      {/* Script Google reCAPTCHA v2 */}
      <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" async defer />

      {/* RESET CSS minimal responsive */}
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

      {/* NAVBAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "white",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          {/* Marque */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
            <Image src="/logo-cq.png" alt="Logo ComptaNet Québec" width={36} height={36} style={{ borderRadius: 6 }} priority />
            <strong style={{ color: bleu, whiteSpace: "nowrap" }}>{T.brand}</strong>
          </div>

          {/* Nav */}
          <nav
            style={{
              display: "flex",
              gap: 12,
              fontSize: 14,
              alignItems: "center",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              flexWrap: "wrap",
              maxWidth: "100%",
            }}
          >
            <a href="#services" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>
              {T.nav.services}
            </a>
            <a href="#etapes" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>
              {T.nav.steps}
            </a>
            <a href="#tarifs" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>
              {T.nav.pricing}
            </a>
            <a href="#faq" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>
              {T.nav.faq}
            </a>
            <a href="#contact" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>
              {T.nav.contact}
            </a>

            <Link
              href={`/espace-client?lang=${lang}`}
              style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap", fontWeight: 700 }}
            >
              {T.nav.client}
            </Link>

            <div style={{ marginLeft: 8 }}>
              <LangSwitcher />
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: "relative", width: "100%", minHeight: isMobile ? 520 : 600, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/banniere.png" alt="Bannière" fill style={{ objectFit: "cover" }} priority sizes="100vw" />
        </div>

        <div style={{ position: "relative", inset: 0, display: "grid", placeItems: "center", padding: 16, minHeight: isMobile ? 520 : 600 }}>
          <div
            style={{
              background: "white",
              padding: isMobile ? "24px 18px" : "38px 30px",
              borderRadius: 16,
              maxWidth: 780,
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,.18)",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "clamp(22px, 6vw, 36px)", lineHeight: 1.2, margin: 0 }}>{T.heroTitle}</h1>

            <p style={{ marginTop: 14, color: "#4b5563", fontSize: "clamp(14px, 3.6vw, 18px)" }}>{T.heroSub}</p>

            <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {/* ✅ CTA principal = démarrer dossier (T1) */}
              <Link
                href={toT1}
                style={{
                  display: "inline-block",
                  background: bleu,
                  color: "white",
                  padding: "12px 22px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {T.ctaMain}
              </Link>

              {/* bouton secondaire = espace client */}
              <Link
                href={`/espace-client?lang=${lang}`}
                style={{
                  display: "inline-block",
                  border: `2px solid ${bleu}`,
                  color: bleu,
                  padding: "10px 20px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {T.nav.client}
              </Link>
            </div>

            {/* Choix du type d'impôt */}
            <div style={{ marginTop: 28, textAlign: "left", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937", marginBottom: 12, textAlign: "center" }}>
                {T.chooseType}
              </div>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))" }}>
                <TaxChoiceCard title={T.t1Title} desc={T.t1Desc} btn={T.t1Btn} href={toT1} bleu={bleu} />
                <TaxChoiceCard title={T.autoTitle} desc={T.autoDesc} btn={T.autoBtn} href={toT1Auto} bleu={bleu} />
                <TaxChoiceCard title={T.t2Title} desc={T.t2Desc} btn={T.t2Btn} href={toT2} bleu={bleu} />
              </div>

              {/* Petit lien discret vers tarifs */}
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <a href="#tarifs" style={{ color: bleu, fontWeight: 700, textDecoration: "none" }}>
                  {T.nav.pricing}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 12 }}>{T.servicesTitle}</h2>
        <p style={{ color: "#4b5563", marginBottom: 22 }}>{T.servicesSub}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {T.services?.map((svc: any, i: number) => (
            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "white" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: 18 }}>{svc.t}</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>{svc.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ÉTAPES */}
      <section id="etapes" style={{ background: "#f8fafc", borderTop: "1px solid #eef2f7", borderBottom: "1px solid #eef2f7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 16px" }}>
          <h2 style={{ color: bleu, marginBottom: 20 }}>{T.stepsTitle}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {T.steps?.map((step: any, i: number) => (
              <div key={i} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: bleu,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  {step.n}
                </div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 18 }}>{step.t}</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 12 }}>{T.pricingTitle}</h2>
        <p style={{ color: "#4b5563", marginBottom: 20 }}>{T.pricingSub}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {T.plans?.map((plan: any, i: number) => (
            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "white", display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{plan.t}</h3>

              <div style={{ color: bleu, fontWeight: 900, fontSize: 20, margin: "8px 0 12px" }}>{plan.p}</div>

              <ul style={{ margin: 0, paddingLeft: 18, color: "#6b7280", fontSize: 14, lineHeight: 1.45 }}>
                {plan.pts.map((pt: string, j: number) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  href={`${plan.href}?lang=${lang}`}
                  style={{ display: "inline-block", background: bleu, color: "white", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 800, whiteSpace: "nowrap" }}
                >
                  {T.getPrice}
                </Link>

                <Link
                  href={`/espace-client?lang=${lang}`}
                  style={{ display: "inline-block", border: `2px solid ${bleu}`, color: bleu, padding: "9px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 800, whiteSpace: "nowrap" }}
                >
                  {T.nav.client}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POURQUOI */}
      <section style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 20 }}>{T.whyTitle}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {T.whyPoints?.map((pt: any, i: number) => (
            <div key={i} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
              <div style={{ fontWeight: 800, color: "#111827", marginBottom: 6, fontSize: 16, lineHeight: 1.4 }}>{pt.t}</div>
              <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.45 }}>{pt.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 16 }}>{T.faqTitle}</h2>
        <FAQ items={T.faq || []} />
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        style={{
          maxWidth: 1100,
          margin: "60px auto",
          padding: "0 16px 60px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 20,
        }}
      >
        <h2 style={{ color: bleu }}>{T.contactTitle}</h2>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "white", maxWidth: 700 }}>
          {/* ✅ Optionnel recommandé: POST /api/contact (au lieu de mailto) */}
          <form onSubmit={onContactSubmit}>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                placeholder={T.contactPlaceholders?.name}
                required
                style={inputStyle}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <input
                name="email"
                placeholder={T.contactPlaceholders?.email}
                type="email"
                required
                style={inputStyle}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <textarea
                name="message"
                placeholder={T.contactPlaceholders?.msg}
                rows={5}
                style={inputStyle}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
              />

              {/* reCAPTCHA v2 – clé de SITE (publique) */}
              <div className="g-recaptcha" data-sitekey="6LcUqP4rAAAAAPu5Fzw1duIE22QtT_Pt7wN3nxF7" />

              {contactErr && (
                <div style={{ color: "#b91c1c", fontWeight: 700, fontSize: 13 }}>
                  {contactErr}
                </div>
              )}
              {contactOk && (
                <div style={{ color: "#166534", fontWeight: 800, fontSize: 13 }}>
                  {contactOk}
                </div>
              )}

              <button
                type="submit"
                disabled={contactBusy}
                style={{
                  background: bleu,
                  color: "white",
                  border: 0,
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontWeight: 900,
                  cursor: contactBusy ? "not-allowed" : "pointer",
                  opacity: contactBusy ? 0.8 : 1,
                }}
              >
                {contactBusy ? T.sending : T.send}
              </button>
            </div>
          </form>

          <p style={{ color: "#6b7280", marginTop: 12, fontSize: 14 }}>
            {T.contactHint}{" "}
            <a href="mailto:comptanetquebec@gmail.com">comptanetquebec@gmail.com</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f172a", color: "#cbd5e1", padding: "24px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/logo-cq.png" alt="" width={28} height={28} />
              <span>© {new Date().getFullYear()} ComptaNet Québec</span>
            </div>

            <div style={{ display: "flex", gap: 16, overflowX: "auto", fontSize: 14 }}>
              <a href="#services" style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap" }}>
                {T.footerLinks.services}
              </a>
              <a href="#tarifs" style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap" }}>
                {T.footerLinks.pricing}
              </a>
              <a href="#contact" style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap" }}>
                {T.footerLinks.contact}
              </a>
              <Link href={`/espace-client?lang=${lang}`} style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 700 }}>
                {T.nav.client}
              </Link>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, fontSize: 12, color: "#94a3b8", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, lineHeight: 1.4 }}>
              <Link href={`/legal/confidentialite?lang=${lang}`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {T.footerLinks.legal.privacy}
              </Link>
              <span style={{ opacity: 0.4 }}>•</span>
              <Link href={`/legal/conditions?lang=${lang}`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {T.footerLinks.legal.terms}
              </Link>
              <span style={{ opacity: 0.4 }}>•</span>
              <Link href={`/legal/avis-legal?lang=${lang}`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {T.footerLinks.legal.disclaimer}
              </Link>
            </div>

            <div style={{ maxWidth: 800, lineHeight: 1.4 }}>{T.footerLinks.legal.note}</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
