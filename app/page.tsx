"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import RecaptchaV2, { type RecaptchaV2Handle } from "@/components/RecaptchaV2";
import styles from "./page.module.css";
import GoogleReviews from "@/components/GoogleReviews";
import { GOOGLE_REVIEWS } from "@/components/googleReviewsData";

/* ===== Types ===== */
type Lang = "fr" | "en" | "es";

type FAQItem = { q: string; a: string };
type ServiceItem = { t: string; d: string };
type StepItem = { n: string; t: string; d: string };
type PlanItem = { t: string; p: string; pts: string[]; href: string };
type WhyItem = { t: string; d: string };
type TrustItem = { t: string };

type CopyDict = {
  brand: string;
  nav: {
    services: string;
    steps: string;
    pricing: string;
    faq: string;
    contact: string;
    client: string;
    help: string;
    menu: string;
    close: string;
  };

  heroTitle: React.ReactNode;
  heroSubShort: string;
  heroSubMore: string;
  heroExperience: string;
  trust: TrustItem[];

  chooseType: string;
  t1Title: string;
  t1Desc: string;
  t1Btn: string;
  autoTitle: string;
  autoDesc: string;
  autoBtn: string;
  t2Title: string;
  t2Desc: string;
  t2Btn: string;

  seoTitle: string;
  seoP1: string;
  seoP2: string;
  seoP3: string;
  seoCities: string;

  servicesTitle: string;
  servicesSub: string;
  services: ServiceItem[];

  stepsTitle: string;
  steps: StepItem[];

  pricingTitle: string;
  pricingSub: string;
  plans: PlanItem[];
  getPrice: string;

  whyTitle: string;
  whyPoints: WhyItem[];

  faqTitle: string;
  faq: FAQItem[];

  contactTitle: string;
  contactHint: string;
  send: string;
  sending: string;
  sentOk: string;
  sentErr: string;
  contactPlaceholders: { name: string; email: string; msg: string };

  langLabel: string;
  langNames: Record<Lang, string>;

  footerLinks: {
    services: string;
    pricing: string;
    contact: string;
    help: string;
    legal: {
      privacy: string;
      terms: string;
      disclaimer: string;
      note: string;
    };
  };
};

/* ===========================
   Cookies helpers (lang)
=========================== */
const LANG_COOKIE = "cq_lang";
const LANG_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const found =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1] ?? null;
  return found ? decodeURIComponent(found) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function normalizeLang(v: string | null): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function readLangFromUrl(): Lang | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("lang");
    const x = (q || "").toLowerCase();
    return x === "fr" || x === "en" || x === "es" ? (x as Lang) : null;
  } catch {
    return null;
  }
}

function writeLangToUrl(l: Lang) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

/* ===========================
   Small components
=========================== */
function TaxChoiceCard(props: {
  title: string;
  desc: string;
  btn: string;
  href: string;
}) {
  const { title, desc, btn, href } = props;

  return (
    <div className={styles.choiceCard}>
      <div className={styles.choiceCardTitle}>{title}</div>
      <div className={styles.choiceCardDesc}>{desc}</div>
      <div className={styles.choiceCardAction}>
        <Link
          href={href}
          className="btn btn-primary"
          style={{ width: "100%", borderRadius: 10 }}
          aria-label={btn}
          prefetch
        >
          {btn}
        </Link>
      </div>
    </div>
  );
}

function FAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={styles.faqWrap}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={styles.faqItem}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className={styles.faqBtn}
              aria-expanded={isOpen}
              type="button"
            >
              <span>{it.q}</span>
              <span className={styles.faqIcon}>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className={styles.faqAnswer}>{it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

function TrustBar({ items }: { items: TrustItem[] }) {
  return (
    <div className={styles.trustBar}>
      {items.map((x, i) => (
        <div key={i} className={styles.trustPill}>
          <span aria-hidden="true">✓</span>
          <span>{x.t}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const bleu = "#004aad" as const;
  const btnRadius = 10;

  const [lang, setLang] = useState<Lang>("fr");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactOk, setContactOk] = useState<string | null>(null);
  const [contactErr, setContactErr] = useState<string | null>(null);

  // ✅ reCAPTCHA (component)
  const recaptchaRef = useRef<RecaptchaV2Handle>(null);

  const setLangAndPersist = useCallback((next: Lang) => {
    setLang(next);
    setCookie(LANG_COOKIE, next, LANG_COOKIE_MAX_AGE);
    writeLangToUrl(next);
    window.dispatchEvent(new Event("cq:lang"));
  }, []);

  // ✅ Init langue: URL > cookie > fr
  useEffect(() => {
    const fromUrl = readLangFromUrl();
    const fromCookieRaw = getCookie(LANG_COOKIE);
    const fromCookie = fromCookieRaw ? normalizeLang(fromCookieRaw) : null;

    const next = fromUrl || fromCookie || "fr";
    setLang(next);
    setCookie(LANG_COOKIE, next, LANG_COOKIE_MAX_AGE);

    if (!fromUrl) writeLangToUrl(next);
    window.dispatchEvent(new Event("cq:lang"));
  }, []);

  // ✅ Check admin
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/me/is-admin");
        const data = (await res.json()) as { isAdmin?: boolean };
        if (alive) setIsAdmin(!!data?.isAdmin);
      } catch {
        if (alive) setIsAdmin(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ ferme le menu mobile quand on change de langue
  useEffect(() => {
    if (mobileNavOpen) setMobileNavOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ✅ fermer menu mobile si on clique un anchor
  const closeMobile = useCallback(() => setMobileNavOpen(false), []);

  const COPY = useMemo(() => {
    const dict: Record<Lang, CopyDict> = {
      fr: {
        brand: "ComptaNet Québec",
        nav: {
          services: "Services",
          steps: "Étapes",
          pricing: "Tarifs",
          faq: "FAQ",
          contact: "Contact",
          client: "Espace client",
          help: "Besoin d’aide ?",
          menu: "Menu",
          close: "Fermer",
        },

        // ✅ PLUS COURT / PLUS FRIENDLY
        heroTitle: (
          <>
            Déclaration d’impôt{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>au Québec</span>{" "}
            — <span style={{ color: bleu, fontWeight: 900 }}>en ligne</span>
          </>
        ),
        heroExperience: "30+ ans d’expérience au Québec",
        heroSubShort: "Simple. Rapide. 100% en ligne. Déposez vos documents et on s’occupe du reste.",
        heroSubMore:
          "Service indépendant de préparation de déclarations de revenus au Québec. Portail sécurisé (photo/PDF). Acompte à l’ouverture, solde avant l’envoi. Transmission électronique (TED) lorsque applicable.",

        trust: [
          { t: "Québec seulement" },
          { t: "Paiement sécurisé (Stripe)" },
          { t: "Accréditation TED" },
          { t: "Portail sécurisé" },
          { t: "Confidentialité" },
          { t: "Acompte requis" },
        ],

        chooseType: "Choisissez votre situation",
        t1Title: "👤 Salarié(e), étudiant(e) ou retraité(e)",
        t1Desc: "T4, Relevé 1, pension, études, etc.",
        t1Btn: "Commencer maintenant",

        autoTitle: "💼 Travailleur autonome / à mon compte",
        autoDesc: "Revenus + dépenses d’entreprise (factures, relevés, etc.).",
        autoBtn: "Commencer maintenant",

        t2Title: "🏢 Compagnie incorporée",
        t2Desc: "Déclaration de société (T2 + CO-17) selon les documents fournis.",
        t2Btn: "Créer mon dossier",

        seoTitle: "Service d’impôt au Québec, simple et guidé",
        seoP1:
          "ComptaNet Québec offre un service de déclaration d’impôt en ligne au Québec. Ouvrez votre dossier sécurisé, téléversez vos documents et votre déclaration est préparée à partir des informations fournies.",
        seoP2:
          "Le service s’adresse aux particuliers, aux travailleurs autonomes et aux compagnies incorporées. Transmission électronique (TED) lorsque applicable.",
        seoP3:
          "Service fiscal indépendant, simple et confidentiel, disponible partout au Québec.",
        seoCities:
          "Service 100 % en ligne partout au Québec (ex. Québec, Montréal, Laval, Gatineau, Lévis, Sherbrooke, Trois-Rivières).",

        servicesTitle: "Services",
        servicesSub:
          "Déclarations de revenus au Québec — dépôt de documents par portail sécurisé.",
        services: [
          {
            t: "Déclaration d’impôt — Particulier",
            d: "Préparation de votre déclaration annuelle à partir des documents fournis.",
          },
          {
            t: "Impôt — Travailleur autonome",
            d: "Revenus et dépenses selon les pièces justificatives fournies.",
          },
          {
            t: "Impôt — Compagnie incorporée",
            d: "Préparation de la déclaration de société (T2 + CO-17) à partir des documents fournis.",
          },
          {
            t: "Accréditation TED",
            d: "Transmission électronique (TED) lorsque applicable.",
          },
          {
            t: "Portail sécurisé",
            d: "Téléversement de vos documents (photo ou PDF).",
          },
        ],

        stepsTitle: "Comment ça fonctionne",
        steps: [
          { n: "1", t: "Ouvrez votre dossier", d: "Espace client sécurisé + acompte." },
          { n: "2", t: "Téléversez vos documents", d: "Photo ou PDF dans le portail." },
          { n: "3", t: "Préparation", d: "Je vous contacte si quelque chose manque." },
          { n: "4", t: "Validation et envoi", d: "Paiement du solde avant l’envoi (TED si applicable)." },
        ],

        pricingTitle: "Tarifs 2026",
        pricingSub:
          "Tarifs de base (taxes incluses). Le prix final dépend de la complexité (revenus multiples, immeubles locatifs, tenue de livres manquante, etc.). Le montant est confirmé avant l’envoi.",
        plans: [
          {
            t: "Déclaration d’impôt — Particulier",
            p: "à partir de 100 $ (taxes incluses)",
            pts: [
              "Acompte requis : 100 $ (taxes incluses)",
              "Portail sécurisé",
              "Préparation selon documents fournis",
            ],
            href: "/tarifs/t1",
          },
          {
            t: "Travailleur autonome",
            p: "à partir de 150 $ (taxes incluses)",
            pts: [
              "Acompte requis : 150 $ (taxes incluses)",
              "Portail sécurisé",
              "Revenus + dépenses selon pièces",
            ],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Compagnie incorporée",
            p: "à partir de 850 $ (taxes incluses)",
            pts: [
              "Acompte requis : 450 $ (taxes incluses)",
              "Portail sécurisé",
              "T2 + CO-17",
              "Société sans revenus : à partir de 450 $ (taxes incluses)",
            ],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "Voir les détails",

        whyTitle: "Pourquoi choisir ComptaNet Québec",
        whyPoints: [
          { t: "30+ ans d’expérience", d: "Processus clair et éprouvé, Québec seulement." },
          { t: "Accréditation TED", d: "Transmission électronique (TED) lorsque applicable." },
          { t: "Confidentialité", d: "Traitement strictement confidentiel." },
          { t: "Portail sécurisé", d: "Téléversement photo/PDF, tout au même endroit." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "Est-ce seulement pour le Québec ?", a: "Oui. ComptaNet Québec sert les résidents et entreprises du Québec." },
          { q: "Je ne sais pas quel type choisir.", a: "Choisissez la description la plus proche. Si vous hésitez, écrivez-nous et on vous guide." },
          { q: "Comment j’envoie mes documents ?", a: "Après création du compte, vous téléversez vos documents (photo ou PDF) dans le portail." },
          { q: "Combien de temps ça prend ?", a: "Particulier : 24 à 48 h ouvrables si dossier complet. Période de pointe : 3 à 7 jours ouvrables selon le volume. Travailleur autonome et compagnie : variable selon documents; estimation après analyse." },
          { q: "Comment se fait le paiement ?", a: "Acompte à l’ouverture. Solde payable quand la déclaration est prête, avant l’envoi." },
          { q: "Quels documents dois-je fournir ?", a: "Ça dépend de votre situation. Une checklist simple est fournie après ouverture du dossier." },
        ],

        contactTitle: "Contact",
        contactHint: "Vous pouvez aussi nous écrire à",
        send: "Envoyer",
        sending: "Envoi...",
        sentOk: "Message envoyé. Merci!",
        sentErr: "Impossible d’envoyer. Réessayez ou écrivez-nous par courriel.",
        contactPlaceholders: { name: "Votre nom", email: "Votre courriel", msg: "Votre message" },

        langLabel: "Langue",
        langNames: { fr: "FR", en: "EN", es: "ES" },

        footerLinks: {
          services: "Services",
          pricing: "Tarifs",
          contact: "Contact",
          help: "Besoin d’aide ?",
          legal: {
            privacy: "Politique de confidentialité",
            terms: "Conditions d’utilisation",
            disclaimer: "Avis légal",
            note:
              "ComptaNet Québec est une marque exploitée par Les Entreprises Kema Inc. (NEQ : 1175912972). Service indépendant — nous ne sommes pas l’ARC ni Revenu Québec. Les déclarations sont préparées et transmises à partir des informations fournies par le client. Tous les prix sont en dollars canadiens (CAD) et incluent les taxes applicables (TPS/TVQ).",
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
          help: "Need help?",
          menu: "Menu",
          close: "Close",
        },

        // ✅ SHORTER
        heroTitle: (
          <>
            Québec{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>tax returns</span>{" "}
            — <span style={{ color: bleu, fontWeight: 900 }}>online</span>
          </>
        ),
        heroExperience: "30+ years of Québec experience",
        heroSubShort: "Simple. Fast. 100% online. Upload your documents and we handle the rest.",
        heroSubMore:
          "Independent Québec tax preparation. Secure portal (photo/PDF). Deposit to open your file, balance before filing. TED e-filing when applicable.",

        trust: [
          { t: "Québec only" },
          { t: "Secure payment (Stripe)" },
          { t: "TED e-filing accreditation" },
          { t: "Secure portal" },
          { t: "Confidentiality" },
          { t: "Deposit required" },
        ],

        chooseType: "Choose your situation",
        t1Title: "👤 Employee, student or retiree",
        t1Desc: "T4, RL-1, pension, studies, etc.",
        t1Btn: "Start now",

        autoTitle: "💼 Self-employed / business income",
        autoDesc: "Income + expenses based on supporting documents.",
        autoBtn: "Start now",

        t2Title: "🏢 Incorporated business",
        t2Desc: "Corporate filing (T2 + CO-17) based on your documents.",
        t2Btn: "Open my file",

        seoTitle: "Québec tax return service, simple and guided",
        seoP1:
          "ComptaNet Québec provides an online service to prepare Québec tax returns. Open your file, upload your documents, and your return is prepared from the information you provide.",
        seoP2:
          "For individuals, self-employed workers, and incorporated businesses. E-filing (TED) when applicable.",
        seoP3: "Independent, simple and confidential.",
        seoCities:
          "100% online across Québec (e.g., Québec City, Montréal, Laval, Gatineau, Lévis, Sherbrooke, Trois-Rivières).",

        servicesTitle: "Services",
        servicesSub: "Québec-only tax returns — secure document portal.",
        services: [
          { t: "Tax return — Individual", d: "Prepared from your documents." },
          { t: "Tax return — Self-employed", d: "Income and expenses from documents." },
          { t: "Tax return — Incorporated business", d: "Corporate filing (T2 + CO-17) from documents." },
          { t: "TED accreditation", d: "Electronic filing when applicable." },
          { t: "Secure portal", d: "Upload documents (photo or PDF)." },
        ],

        stepsTitle: "How it works",
        steps: [
          { n: "1", t: "Open your file", d: "Secure portal + deposit." },
          { n: "2", t: "Upload documents", d: "Photo or PDF." },
          { n: "3", t: "Preparation", d: "We contact you if something is missing." },
          { n: "4", t: "Review & file", d: "Pay balance before filing (TED when applicable)." },
        ],

        pricingTitle: "2026 Pricing",
        pricingSub:
          "Base pricing. Final price depends on complexity (multiple income sources, rental properties, missing bookkeeping, etc.) and is confirmed before filing. All prices are in Canadian dollars (CAD) and include applicable taxes (GST/QST).",
        plans: [
          {
            t: "Tax return — Individual",
            p: "from $100",
            pts: ["Deposit: $100", "Secure client portal", "Prepared from documents provided", "Taxes included (CAD)"],
            href: "/tarifs/t1",
          },
          {
            t: "Self-employed",
            p: "from $150",
            pts: ["Deposit: $150", "Secure client portal", "Income and expenses based on documents", "Taxes included (CAD)"],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Incorporated business",
            p: "from $450",
            pts: ["Deposit: $450", "Secure client portal", "T2 + CO-17 corporate filing", "No-revenue corporation: from $450", "Taxes included (CAD)"],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "View details",

        whyTitle: "Why choose ComptaNet Québec",
        whyPoints: [
          { t: "30+ years experience", d: "Clear process, Québec only." },
          { t: "TED accreditation", d: "Electronic filing when applicable." },
          { t: "Confidentiality", d: "Strictly confidential." },
          { t: "Secure portal", d: "Upload photo/PDF, all in one place." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "Is it Québec only?", a: "Yes. ComptaNet Québec serves Québec residents and Québec corporations." },
          { q: "I’m not sure which option to choose.", a: "Pick the closest match. If unsure, contact us and we’ll guide you." },
          { q: "How do I send documents?", a: "After creating your account, upload documents (photo or PDF) in the portal." },
          { q: "How long does it take?", a: "Individual: 24–48 business hours if complete. Peak: 3–7 business days. Self-employed/corp varies; estimate after review." },
          { q: "How do payments work?", a: "Deposit to open. Balance paid when ready, before filing." },
          { q: "Which documents do I need?", a: "Depends on your situation. A simple checklist is provided after opening." },
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
          help: "Need help?",
          legal: {
            privacy: "Privacy policy",
            terms: "Terms of use",
            disclaimer: "Legal notice",
            note:
              "ComptaNet Québec is a brand operated by Les Entreprises Kema Inc. (NEQ: 1175912972). Independent service — we are not the CRA nor Revenu Québec. Returns are prepared and filed based solely on client-provided information. All prices are in Canadian dollars (CAD) and include applicable taxes (GST/QST).",
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
          help: "¿Necesitas ayuda?",
          menu: "Menú",
          close: "Cerrar",
        },

        // ✅ SHORTER
        heroTitle: (
          <>
            Impuestos en{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>Québec</span> —{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>en línea</span>
          </>
        ),
        heroExperience: "30+ años de experiencia en Québec",
        heroSubShort: "Simple. Rápido. 100% en línea. Suba sus documentos y nos encargamos del resto.",
        heroSubMore:
          "Servicio independiente solo para Québec. Portal seguro (foto/PDF). Depósito para abrir el expediente, saldo antes de presentar. Presentación electrónica (TED) cuando aplique.",

        trust: [
          { t: "Solo Québec" },
          { t: "Pago seguro (Stripe)" },
          { t: "Acreditación TED" },
          { t: "Portal seguro" },
          { t: "Confidencialidad" },
          { t: "Depósito requerido" },
        ],

        chooseType: "Elija su situación",
        t1Title: "👤 Empleado/a, estudiante o jubilado/a",
        t1Desc: "T4, RL-1, pensión, estudios, etc.",
        t1Btn: "Empezar ahora",

        autoTitle: "💼 Autónomo / por cuenta propia",
        autoDesc: "Ingresos + gastos según comprobantes.",
        autoBtn: "Empezar ahora",

        t2Title: "🏢 Empresa incorporada",
        t2Desc: "Declaración (T2 + CO-17) según sus documentos.",
        t2Btn: "Abrir expediente",

        seoTitle: "Servicio de impuestos en Québec, simple y guiado",
        seoP1:
          "ComptaNet Québec ofrece un servicio en línea para preparar declaraciones de impuestos en Québec. Abra su expediente, suba sus documentos y se prepara la declaración con la información proporcionada.",
        seoP2:
          "Para particulares, autónomos y empresas incorporadas. Presentación electrónica (TED) cuando aplique.",
        seoP3: "Servicio independiente, simple y confidencial.",
        seoCities:
          "100% en línea en todo Québec (ej. Québec, Montréal, Laval, Gatineau, Lévis, Sherbrooke, Trois-Rivières).",

        servicesTitle: "Servicios",
        servicesSub: "Solo Québec — portal seguro para documentos.",
        services: [
          { t: "Impuestos — Particular", d: "Preparada con sus documentos." },
          { t: "Impuestos — Autónomo", d: "Ingresos y gastos según comprobantes." },
          { t: "Impuestos — Empresa incorporada", d: "Declaración (T2 + CO-17) con documentos." },
          { t: "Acreditación TED", d: "Presentación electrónica cuando aplique." },
          { t: "Portal seguro", d: "Suba documentos (foto o PDF)." },
        ],

        stepsTitle: "Cómo funciona",
        steps: [
          { n: "1", t: "Abra su expediente", d: "Portal seguro + depósito." },
          { n: "2", t: "Suba documentos", d: "Foto o PDF." },
          { n: "3", t: "Preparación", d: "Le contactamos si falta algo." },
          { n: "4", t: "Validación y presentación", d: "Pague el saldo antes de presentar (TED si aplica)." },
        ],

        pricingTitle: "Precios 2026",
        pricingSub:
          "Precios base. El monto final depende de la complejidad (múltiples ingresos, propiedades en alquiler, contabilidad incompleta, etc.) y se confirma antes de presentar la declaración. Todos los precios están en dólares canadienses (CAD) e incluyen los impuestos aplicables (GST/QST).",
        plans: [
          {
            t: "Impuestos — Particular",
            p: "desde $100 CAD (impuestos incluidos)",
            pts: ["Depósito requerido: $100", "Portal seguro", "Preparación según documentos proporcionados"],
            href: "/tarifs/t1",
          },
          {
            t: "Autónomo",
            p: "desde $150 CAD (impuestos incluidos)",
            pts: ["Depósito requerido: $150", "Portal seguro", "Ingresos y gastos según comprobantes"],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Empresa incorporada",
            p: "desde $850 CAD (impuestos incluidos)",
            pts: ["Depósito requerido: $450", "Portal seguro", "T2 + CO-17", "Empresa sin ingresos: desde $450 CAD"],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "Ver detalles",

        whyTitle: "Por qué elegir ComptaNet Québec",
        whyPoints: [
          { t: "Más de 30 años", d: "Proceso claro, solo Québec." },
          { t: "Acreditación TED", d: "Presentación electrónica cuando aplique." },
          { t: "Confidencialidad", d: "Estrictamente confidencial." },
          { t: "Portal seguro", d: "Suba foto/PDF, todo en un lugar." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "¿Es solo para Québec?", a: "Sí. ComptaNet Québec atiende residentes y empresas de Québec." },
          { q: "No sé cuál opción elegir.", a: "Elija la más cercana. Si tiene dudas, contáctenos y le guiamos." },
          { q: "¿Cómo envío documentos?", a: "Después de crear la cuenta, suba documentos (foto o PDF) en el portal." },
          { q: "¿Cuánto tarda?", a: "Particular: 24–48 horas hábiles si completo. Temporada alta: 3–7 días. Autónomo/empresa varía; estimación tras revisión." },
          { q: "¿Cómo se paga?", a: "Depósito para abrir. Saldo cuando esté listo, antes de presentar." },
          { q: "¿Qué documentos necesito?", a: "Depende. Se entrega una lista simple tras abrir el expediente." },
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
          help: "¿Necesitas ayuda?",
          legal: {
            privacy: "Política de privacidad",
            terms: "Términos de uso",
            disclaimer: "Aviso legal",
            note:
              "ComptaNet Québec es una marca operada por Les Entreprises Kema Inc. (NEQ: 1175912972). Servicio independiente — no somos la CRA ni Revenu Québec. Las declaraciones se preparan y presentan únicamente con la información proporcionada por el cliente. Todos los precios están en dólares canadienses (CAD) e incluyen los impuestos aplicables (GST/QST).",
          },
        },
      },
    };

    return dict;
  }, [bleu]);

  const T = COPY[lang];

  // Reviews
  const reviews = GOOGLE_REVIEWS[lang] ?? GOOGLE_REVIEWS.fr;
  const reviewsCount = reviews.length;
  const reviewsRating =
    reviewsCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount
      : 0;

  // ✅ Liens (inchangés)
  const toClient = `/espace-client?lang=${encodeURIComponent(lang)}`;
  const toHelp = `/aide?lang=${encodeURIComponent(lang)}`;

  const toT1 = `/espace-client?lang=${encodeURIComponent(
    lang
  )}&next=${encodeURIComponent("/formulaire-fiscal")}`;
  const toT1Auto = `/espace-client?lang=${encodeURIComponent(
    lang
  )}&next=${encodeURIComponent("/formulaire-fiscal-ta")}`;
  const toT2 = `/espace-client?lang=${encodeURIComponent(
    lang
  )}&next=${encodeURIComponent("/formulaire-fiscal-t2")}`;

  // ✅ FAQ schema (JSON-LD)
  const faqJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: T.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
  }, [T.faq]);

  // ✅ LocalBusiness schema (JSON-LD)
  const localJsonLd = useMemo(() => {
    const base = "https://www.comptanetquebec.com";
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "ComptaNet Québec",
      url: base,
      telephone: "+15819852599",
      email: "comptanetquebec@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "849, boulevard Pie XII",
        addressLocality: "Québec",
        addressRegion: "QC",
        postalCode: "G1X 3T2",
        addressCountry: "CA",
      },
      areaServed: { "@type": "AdministrativeArea", name: "Québec" },
    };
  }, []);

  const onContactSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setContactOk(null);
    setContactErr(null);

    const token = recaptchaRef.current?.getToken() || "";
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
          token,
          company: "", // honeypot
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) throw new Error(data?.error || "bad_status");

      setContactOk(T.sentOk);
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      recaptchaRef.current?.reset();
    } catch {
      setContactErr(T.sentErr);
    } finally {
      setContactBusy(false);
    }
  };

  const learnMoreLabel =
    lang === "fr" ? "En savoir plus" : lang === "en" ? "Learn more" : "Saber más";

  const primaryCta =
    lang === "fr"
      ? "Choisir mon type d’impôt"
      : lang === "en"
      ? "Choose my tax type"
      : "Elegir mi tipo de impuesto";

  return (
    <main className={styles.main}>
      {/* FAQ JSON-LD */}
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* LocalBusiness JSON-LD */}
      <Script
        id="local-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localJsonLd) }}
      />

      {/* NAVBAR */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Image
              src="/logo-cq.png"
              alt="Logo ComptaNet Québec"
              width={36}
              height={36}
              className={styles.brandLogo}
              priority
            />
            <strong className={styles.brandName}>{T.brand}</strong>
          </div>

          {/* Mobile actions */}
          <div className={styles.headerActions}>
            <div className={styles.langInline}>
              <span className={styles.langLabel}>{T.langLabel}</span>
              {(["fr", "en", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLangAndPersist(l)}
                  className={`${styles.langBtn} ${
                    l === lang ? styles.langBtnActive : ""
                  }`}
                  aria-pressed={l === lang}
                  type="button"
                >
                  {T.langNames[l]}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.mobileNavBtn}
              aria-label={mobileNavOpen ? T.nav.close : T.nav.menu}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <nav className={`${styles.nav} ${mobileNavOpen ? styles.navOpen : ""}`}>
            <a href="#services" onClick={closeMobile}>
              {T.nav.services}
            </a>
            <a href="#etapes" onClick={closeMobile}>
              {T.nav.steps}
            </a>
            <a href="#tarifs" onClick={closeMobile}>
              {T.nav.pricing}
            </a>
            <a href="#faq" onClick={closeMobile}>
              {T.nav.faq}
            </a>
            <a href="#contact" onClick={closeMobile}>
              {T.nav.contact}
            </a>

            <div className={styles.navCtas}>
              <Link
                href={toClient}
                className="btn btn-primary"
                prefetch
                onClick={closeMobile}
              >
                {T.nav.client}
              </Link>
              <Link
                href={toHelp}
                className="btn btn-outline"
                prefetch
                onClick={closeMobile}
              >
                {T.nav.help}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/dossiers"
                  className="btn btn-outline"
                  onClick={closeMobile}
                >
                  Admin
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            src="/banniere.png"
            alt="Bannière"
            fill
            priority
            sizes="100vw"
            className={styles.heroBgImg}
          />
        </div>

        <div className={styles.heroCenter}>
          <div className={styles.heroCard}>
            <h1 className={styles.heroTitle}>{T.heroTitle}</h1>

            <div className={styles.heroExperience} style={{ color: bleu }}>
              {T.heroExperience}
            </div>

            <p className={styles.heroSub}>{T.heroSubShort}</p>

            {/* CTA principal */}
            <div className={styles.heroPrimaryCtaRow}>
              <a
                href="#types-impot"
                className="btn btn-primary"
                style={{ width: "100%", borderRadius: 10 }}
              >
                {primaryCta}
              </a>
            </div>

            {/* Lien secondaire */}
            <div className={styles.heroMoreLinkRow}>
              <Link
                href={`/declaration-impot-quebec?lang=${encodeURIComponent(lang)}`}
                className={styles.heroMoreBtn}
                prefetch
              >
                {learnMoreLabel}
              </Link>
            </div>

            <TrustBar items={T.trust} />

            <GoogleReviews
              lang={lang}
              rating={reviewsRating || 5.0}
              count={reviewsCount || GOOGLE_REVIEWS.fr.length}
              items={reviewsCount ? reviews : GOOGLE_REVIEWS.fr}
              googleUrl="https://maps.app.goo.gl/kBT1kbiqb4EWs3mT6?g_st=afm"
              compact
            />

            <div className={styles.heroLinks}>
              <Link href={toClient} className={styles.heroLink} prefetch>
                {T.nav.client}
              </Link>
              <span className={styles.heroSep}>•</span>
              <Link href={toHelp} className={styles.heroLink} prefetch>
                {T.nav.help}
              </Link>
              {isAdmin && (
                <>
                  <span className={styles.heroSep}>•</span>
                  <Link href="/admin/dossiers" className={styles.heroLinkAdmin}>
                    Admin
                  </Link>
                </>
              )}
            </div>

            {/* Anchor target */}
            <div id="types-impot" className={styles.choiceBox}>
              <div className={styles.choiceTitle}>{T.chooseType}</div>

              <div className={styles.choiceGrid}>
                <TaxChoiceCard
                  title={T.t1Title}
                  desc={T.t1Desc}
                  btn={T.t1Btn}
                  href={toT1}
                />
                <TaxChoiceCard
                  title={T.autoTitle}
                  desc={T.autoDesc}
                  btn={T.autoBtn}
                  href={toT1Auto}
                />
                <TaxChoiceCard
                  title={T.t2Title}
                  desc={T.t2Desc}
                  btn={T.t2Btn}
                  href={toT2}
                />
              </div>

              <div className={styles.microLine}>
                {lang === "fr"
                  ? "✅ Acompte requis • ✅ Paiement sécurisé (Stripe) • ✅ Accréditation TED"
                  : lang === "en"
                  ? "✅ Deposit required • ✅ Secure payment (Stripe) • ✅ TED accreditation"
                  : "✅ Depósito requerido • ✅ Pago seguro (Stripe) • ✅ Acreditación TED"}
              </div>

              <div className={styles.heroCtaLinkRow}>
                <a href="#tarifs" className={styles.heroCtaLink}>
                  {T.nav.pricing}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO INTRO */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{T.seoTitle}</h2>
        <p className={styles.sectionSub}>{T.seoP1}</p>
        <p className={styles.sectionSub}>{T.seoP2}</p>
        <p className={styles.sectionSub}>{T.seoP3}</p>
        <p className={styles.sectionSub}>{T.seoCities}</p>
      </section>

      {/* SERVICES */}
      <section id="services" className={styles.section}>
        <h2 className={styles.sectionTitle}>{T.servicesTitle}</h2>
        <p className={styles.sectionSub}>{T.servicesSub}</p>

        <div className={styles.gridCards}>
          {T.services.map((svc, i) => (
            <div key={i} className={styles.cardBox}>
              <h3>{svc.t}</h3>
              <p>{svc.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ÉTAPES */}
      <section id="etapes" className={styles.stepsWrap}>
        <div className={styles.stepsInner}>
          <h2 className={styles.sectionTitle}>{T.stepsTitle}</h2>

          <div className={styles.gridCards}>
            {T.steps.map((step, i) => (
              <div key={i} className={styles.cardBox}>
                <div className={styles.stepNum}>{step.n}</div>
                <h3>{step.t}</h3>
                <p>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className={styles.section}>
        <h2 className={styles.sectionTitle}>{T.pricingTitle}</h2>
        <p className={styles.sectionSub}>{T.pricingSub}</p>

        <div className={styles.gridCards}>
          {T.plans.map((plan, i) => (
            <div
              key={i}
              className={styles.cardBox}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <h3>{plan.t}</h3>
              <div className={styles.planPrice}>{plan.p}</div>

              <ul className={styles.planList}>
                {plan.pts.map((pt, j) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>

              <div className={styles.planActions}>
                <Link
                  href={`${plan.href}?lang=${encodeURIComponent(lang)}`}
                  className="btn btn-primary"
                  style={{ borderRadius: btnRadius }}
                  prefetch
                >
                  {T.getPrice}
                </Link>
                <Link
                  href={toClient}
                  className="btn btn-outline"
                  style={{ borderRadius: btnRadius }}
                  prefetch
                >
                  {T.nav.client}
                </Link>
                <Link
                  href={toHelp}
                  className="btn btn-outline"
                  style={{ borderRadius: btnRadius }}
                  prefetch
                >
                  {T.nav.help}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POURQUOI */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{T.whyTitle}</h2>

        <div className={styles.gridCards}>
          {T.whyPoints.map((pt, i) => (
            <div key={i} className={styles.cardBox}>
              <h3 style={{ marginBottom: 6 }}>{pt.t}</h3>
              <p>{pt.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.section}>
        <h2 className={styles.faqTitle}>{T.faqTitle}</h2>
        <FAQ items={T.faq} />
      </section>

      {/* CONTACT */}
      <section id="contact" className={styles.section} style={{ marginBottom: 0 }}>
        <h2 className={styles.sectionTitle}>{T.contactTitle}</h2>

        <div className={styles.contactGrid}>
          {/* Colonne gauche : infos */}
          <div className={styles.contactCard}>
            <h3 className={styles.contactCardTitle}>
              {lang === "fr"
                ? "Coordonnées"
                : lang === "en"
                ? "Contact details"
                : "Datos de contacto"}
            </h3>

            <div className={styles.contactLine}>
              <span className={styles.contactLabel}>
                {lang === "fr" ? "Adresse" : lang === "en" ? "Address" : "Dirección"}
              </span>
              <span className={styles.contactValue}>
                849, boulevard Pie XII<br />
                Québec (QC) G1X 3T2
              </span>
            </div>

            <div className={styles.contactLine}>
              <span className={styles.contactLabel}>
                {lang === "fr" ? "Sur rendez-vous" : lang === "en" ? "By appointment" : "Con cita"}
              </span>
              <span className={styles.contactValue}>
                {lang === "fr" ? "Sur rendez-vous seulement" : lang === "en" ? "Appointment only" : "Solo con cita"}
              </span>
            </div>

            <div className={styles.contactLine}>
              <span className={styles.contactLabel}>
                {lang === "fr" ? "Téléphone" : lang === "en" ? "Phone" : "Teléfono"}
              </span>
              <span className={styles.contactValue}>581-985-2599</span>
            </div>

            <div className={styles.contactLine}>
              <span className={styles.contactLabel}>
                {lang === "fr" ? "Courriel" : lang === "en" ? "Email" : "Correo"}
              </span>
              <a className={styles.contactValueLink} href="mailto:info@comptanetquebec.com">
                info@comptanetquebec.com
              </a>
            </div>

            <div className={styles.contactNote}>
              {lang === "fr"
                ? "Service 100 % en ligne partout au Québec. Rencontres en personne possibles sur rendez-vous seulement, à Québec."
                : lang === "en"
                ? "100% online service across Québec. In-person meetings are available by appointment only in Québec City."
                : "Servicio 100 % en línea en todo Québec. Las reuniones presenciales están disponibles solo con cita previa en la ciudad de Québec."}
            </div>

            <div className={styles.contactPrefer}>
              <div className={styles.contactPreferTitle}>
                {lang === "fr"
                  ? "Canal prioritaire"
                  : lang === "en"
                  ? "Preferred channel"
                  : "Canal preferido"}
              </div>

              <div className={styles.contactPreferText}>
                {lang === "fr"
                  ? "Pour un service rapide, utilisez l’espace client ou le formulaire. Aucune réception sans rendez-vous."
                  : lang === "en"
                  ? "For faster service, please use the client portal or the form. No walk-ins — appointment required."
                  : "Para un servicio más rápido, use el portal del cliente o el formulario. No atendemos sin cita previa."}
              </div>

              <div className={styles.contactPriority}>
                {lang === "fr"
                  ? "⚡ Priorité : ouvrez votre dossier dans l’espace client."
                  : lang === "en"
                  ? "⚡ Priority: open your file in the client portal."
                  : "⚡ Prioridad: abra su expediente en el portal del cliente."}
              </div>
            </div>

            <div className={styles.contactCtas}>
              <Link
                href={toClient}
                className="btn btn-primary"
                style={{ borderRadius: 10 }}
                prefetch
              >
                {lang === "fr"
                  ? "Ouvrir l’espace client"
                  : lang === "en"
                  ? "Open client portal"
                  : "Abrir portal del cliente"}
              </Link>

              <Link
                href={toHelp}
                className="btn btn-outline"
                style={{ borderRadius: 10 }}
                prefetch
              >
                {lang === "fr" ? "Besoin d’aide ?" : lang === "en" ? "Need help?" : "¿Necesitas ayuda?"}
              </Link>
            </div>
          </div>

          {/* Colonne droite : formulaire */}
          <div className={styles.contactCard}>
            <h3 className={styles.contactCardTitle}>
              {lang === "fr"
                ? "Écrire un message"
                : lang === "en"
                ? "Send a message"
                : "Enviar un mensaje"}
            </h3>

            <form onSubmit={onContactSubmit} className={styles.contactForm}>
              <input
                name="name"
                placeholder={T.contactPlaceholders.name}
                required
                className={styles.input}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />

              <input
                name="email"
                placeholder={T.contactPlaceholders.email}
                type="email"
                required
                className={styles.input}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />

              <textarea
                name="message"
                placeholder={T.contactPlaceholders.msg}
                rows={5}
                required
                className={styles.input}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
              />

              <RecaptchaV2 ref={recaptchaRef} siteKey="6Lc072ssAAAAABf_BKFEvaxaqX0lTK3klGU9Z39D" />

              {contactErr && <div className={styles.err}>{contactErr}</div>}
              {contactOk && <div className={styles.ok}>{contactOk}</div>}

              <button
                type="submit"
                disabled={contactBusy}
                className="btn btn-primary"
                style={{ borderRadius: btnRadius }}
              >
                {contactBusy ? T.sending : T.send}
              </button>
            </form>

            <p className={styles.contactHint}>
              {T.contactHint}{" "}
              <a href="mailto:info@comptanetquebec.com">info@comptanetquebec.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/logo-cq.png" alt="" width={28} height={28} />
              <span>© {new Date().getFullYear()} ComptaNet Québec</span>
            </div>

            <div className={styles.footerLinks}>
              <a href="#services">{T.footerLinks.services}</a>
              <a href="#tarifs">{T.footerLinks.pricing}</a>
              <a href="#contact">{T.footerLinks.contact}</a>
              <Link href={toHelp} className={styles.footerHelpLink} prefetch>
                {T.footerLinks.help}
              </Link>
            </div>
          </div>

          <div className={styles.footerLegal}>
            <div className={styles.footerLegalRow}>
              <Link
                href={`/legal/confidentialite?lang=${encodeURIComponent(lang)}`}
                className={styles.footerLegalLink}
                prefetch
              >
                {T.footerLinks.legal.privacy}
              </Link>
              <span className={styles.dot}>•</span>
              <Link
                href={`/legal/conditions?lang=${encodeURIComponent(lang)}`}
                className={styles.footerLegalLink}
                prefetch
              >
                {T.footerLinks.legal.terms}
              </Link>
              <span className={styles.dot}>•</span>
              <Link
                href={`/legal/avis-legal?lang=${encodeURIComponent(lang)}`}
                className={styles.footerLegalLink}
                prefetch
              >
                {T.footerLinks.legal.disclaimer}
              </Link>
            </div>

            <div className={styles.footerNote}>{T.footerLinks.legal.note}</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
