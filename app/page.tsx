"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import styles from "./page.module.css";

/* ===== reCAPTCHA (sans any) ===== */
type Grecaptcha = {
  getResponse: () => string;
  reset: () => void;
};
declare const grecaptcha: Grecaptcha | undefined;

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
  };

  heroTitle: React.ReactNode;
  heroSub: string;

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
   UI bits
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
    <div
      style={{
        marginTop: 12,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
      }}
    >
      {items.map((x, i) => (
        <div
          key={i}
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 999,
            padding: "6px 10px",
            fontSize: 13,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(4px)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
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

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactOk, setContactOk] = useState<string | null>(null);
  const [contactErr, setContactErr] = useState<string | null>(null);

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

  // ✅ Check admin (lien admin discret dans hero)
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
        },

        heroTitle: (
          <>
            Service de{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>
              déclaration d’impôt au Québec
            </span>{" "}
            — <span style={{ color: bleu, fontWeight: 900 }}>en ligne</span>
          </>
        ),

        heroExperience:
          "Plus de 30 ans d’expérience. Des milliers de déclarations produites au Québec.",
        heroSub:
          "Service indépendant de préparation de déclarations de revenus au Québec. Vous ouvrez votre dossier, vous téléversez vos documents via un portail sécurisé, puis je prépare à partir des informations fournies. Je vous contacte s’il manque quelque chose avant l’envoi.",

        trust: [
          { t: "Québec seulement" },
          { t: "Des milliers de déclarations produites" },
          { t: "Acompte requis pour ouvrir le dossier" },
          { t: "Paiement sécurisé (Stripe)" },
          { t: "Accréditation TED (transmission électronique)" },
          { t: "Confidentialité" },
          { t: "Délais habituels : 3 à 7 jours ouvrables (dossier complet)" },
        ],

        chooseType: "Choisissez votre situation",
        t1Title: "👤 Salarié(e), étudiant(e) ou retraité(e)",
        t1Desc: "T4, Relevé 1, pension, études, etc.",
        t1Btn: "Commencer ma déclaration maintenant",

        autoTitle: "💼 Travailleur autonome / à mon compte",
        autoDesc: "Revenus + dépenses d’entreprise (factures, relevés, etc.).",
        autoBtn: "Commencer ma déclaration maintenant",

        t2Title: "🏢 Compagnie incorporée",
        t2Desc:
          "Déclaration de société (T2 + CO-17) selon les documents fournis.",
        t2Btn: "Créer mon dossier corporatif",

        seoTitle: "Service d’impôt au Québec, simple et guidé",
        seoP1:
"ComptaNet Québec offre un service de déclaration d’impôt en ligne au Québec. Ouvrez votre dossier sécurisé, téléversez vos documents et votre déclaration est préparée à partir des informations fournies.",

seoP2:
"Le service s’adresse aux particuliers (T1), aux travailleurs autonomes et aux compagnies incorporées (T2). Transmission électronique (TED) lorsque applicable.",

seoP3:
"Service fiscal indépendant, simple et confidentiel, disponible partout au Québec.",

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
            d: "Téléversement de vos documents (photo ou PDF). Tout au même endroit.",
          },
        ],

        stepsTitle: "Comment ça fonctionne",
        steps: [
          {
            n: "1",
            t: "Ouvrez votre dossier",
            d: "Création de votre espace client sécurisé + paiement de l’acompte.",
          },
          {
            n: "2",
            t: "Téléversez vos documents",
            d: "Glissez vos documents (photo ou PDF) dans le portail.",
          },
          {
            n: "3",
            t: "Préparation",
            d: "Préparation à partir des informations fournies. Je vous contacte si quelque chose manque.",
          },
          {
            n: "4",
            t: "Validation et envoi",
            d: "Paiement du solde avant l’envoi. Transmission (TED) lorsque applicable.",
          },
        ],

        pricingTitle: "Tarifs 2026",
        pricingSub:
          "Tarifs de base. Le prix final dépend de la complexité (revenus multiples, immeubles locatifs, tenue de livres manquante, etc.). Le montant est confirmé avant l’envoi.",
        plans: [
          {
            t: "Déclaration d’impôt — Particulier",
            p: "à partir de 100 $",
            pts: [
              "Acompte requis : 100 $ (ouverture du dossier)",
              "Portail sécurisé",
              "Préparation selon documents fournis",
            ],
            href: "/tarifs/t1",
          },
          {
            t: "Travailleur autonome",
            p: "à partir de 150 $",
            pts: [
              "Acompte requis : 150 $ (ouverture du dossier)",
              "Portail sécurisé",
              "Revenus + dépenses selon pièces",
            ],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Compagnie incorporée",
            p: "à partir de 850 $",
            pts: [
              "Acompte requis : 450 $ (ouverture du dossier)",
              "Portail sécurisé",
              "T2 + CO-17 selon documents fournis",
              "Société sans revenus : à partir de 450 $",
            ],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "Voir les détails",

        whyTitle: "Pourquoi choisir ComptaNet Québec",
        whyPoints: [
          {
            t: "30+ ans d’expérience — des milliers de déclarations",
            d: "Préparation de déclarations d’impôt au Québec, avec un processus clair et éprouvé.",
          },
          {
            t: "Accréditation TED",
            d: "Transmission électronique (TED) lorsque applicable.",
          },
          {
            t: "Confidentialité",
            d: "Traitement des informations de façon strictement confidentielle.",
          },
          {
            t: "Portail sécurisé",
            d: "Téléversement de documents (photo ou PDF), tout au même endroit.",
          },
        ],

        faqTitle: "FAQ",
        faq: [
          {
            q: "Est-ce que c’est seulement pour le Québec ?",
            a: "Oui. ComptaNet Québec sert les résidents et entreprises du Québec.",
          },
          {
            q: "Je ne sais pas quel type choisir. Quoi faire ?",
            a: "Choisissez la description qui correspond à votre situation. Si vous hésitez, écrivez-nous et on vous guide.",
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
            a: "Un acompte est demandé. Le solde est payable quand la déclaration est prête, avant l’envoi.",
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
          help: "Besoin d’aide ?",
          legal: {
            privacy: "Politique de confidentialité",
            terms: "Conditions d’utilisation",
            disclaimer: "Avis légal",
            note: "Service indépendant. Nous ne sommes pas l’ARC ni Revenu Québec. Les déclarations sont préparées et transmises à partir des informations fournies par le client.",
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
        },

        heroTitle: (
          <>
            Québec{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>
              tax return service
            </span>{" "}
            — <span style={{ color: bleu, fontWeight: 900 }}>online</span>
          </>
        ),

        heroExperience:
          "Over 30 years of experience. Thousands of tax returns prepared in Québec.",
        heroSub:
          "Independent Québec-only tax return preparation service. Open your file, upload documents through a secure portal, and your return is prepared from the information you provide. You’ll be contacted if anything is missing before filing.",

        trust: [
          { t: "Québec only" },
          { t: "Thousands of returns prepared" },
          { t: "Deposit required to open the file" },
          { t: "Secure payment (Stripe)" },
          { t: "TED e-filing accreditation" },
          { t: "Confidentiality" },
          { t: "Typical turnaround: 3–7 business days (complete file)" },
        ],

        chooseType: "Choose your situation",
        t1Title: "👤 Employee, student or retiree",
        t1Desc: "T4, RL-1, pension, studies, etc.",
        t1Btn: "Start my tax return now",

        autoTitle: "💼 Self-employed / business income",
        autoDesc: "Income + expenses based on supporting documents.",
        autoBtn: "Start my tax return now",

        t2Title: "🏢 Incorporated business",
        t2Desc: "Corporate filing (T2 + CO-17) based on your documents.",
        t2Btn: "Open my corporate file",

        seoTitle: "Québec tax return service, simple and guided",
        seoP1:
          "ComptaNet Québec provides an online service to prepare Québec tax returns. Open your file, upload your documents, and your return is prepared from the information you provide.",
        seoP2:
          "This service is for individuals, self-employed workers (income and expenses), and incorporated businesses (corporate filing).",
        seoP3:
          "No need to know tax forms. Choose your situation and follow the steps. If something is missing, you will be contacted before filing.",

        servicesTitle: "Services",
        servicesSub: "Québec-only tax returns — secure document portal.",
        services: [
          { t: "Tax return — Individual", d: "Prepared from your documents." },
          {
            t: "Tax return — Self-employed",
            d: "Income and expenses based on your documents.",
          },
          {
            t: "Tax return — Incorporated business",
            d: "Corporate filing (T2 + CO-17) prepared from your information and documents.",
          },
          { t: "TED accreditation", d: "Electronic filing (TED) when applicable." },
          { t: "Secure portal", d: "Upload documents (photo or PDF). Paperless." },
        ],

        stepsTitle: "How it works",
        steps: [
          { n: "1", t: "Open your file", d: "Create your secure portal + pay the deposit." },
          { n: "2", t: "Upload documents", d: "Upload documents (photo or PDF) into the portal." },
          { n: "3", t: "Preparation", d: "Prepared from the information provided. You’ll be contacted if something is missing." },
          { n: "4", t: "Review & file", d: "Pay the balance before filing. E-filing (TED) when applicable." },
        ],

        pricingTitle: "2026 Pricing",
        pricingSub:
          "Base pricing. Final price depends on complexity. The amount is confirmed before filing.",
        plans: [
          {
            t: "Tax return — Individual",
            p: "from $100",
            pts: [
              "Deposit required: $100 (opens the file)",
              "Secure portal",
              "Prepared from provided documents",
            ],
            href: "/tarifs/t1",
          },
          {
            t: "Self-employed",
            p: "from $150",
            pts: [
              "Deposit required: $150 (opens the file)",
              "Secure portal",
              "Income + expenses from documents",
            ],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Incorporated business",
            p: "from $850",
            pts: [
              "Deposit required: $450 (opens the file)",
              "Secure portal",
              "T2 + CO-17 from documents",
              "No-revenue corp: from $450",
            ],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "View details",

        whyTitle: "Why choose ComptaNet Québec",
        whyPoints: [
          {
            t: "30+ years — thousands of returns prepared",
            d: "Québec tax return preparation with a clear, proven process.",
          },
          { t: "TED accreditation", d: "Electronic filing (TED) when applicable." },
          { t: "Confidentiality", d: "Information is handled strictly confidentially." },
          { t: "Secure portal", d: "Upload documents (photo or PDF) in one place." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "Is it Québec only?", a: "Yes. ComptaNet Québec serves Québec residents and Québec corporations." },
          { q: "I’m not sure which option to choose. What should I do?", a: "Pick the description that matches your situation. If unsure, contact us and we’ll guide you." },
          { q: "How do I send my documents?", a: "After creating your account, you upload documents in the secure portal (photo or PDF)." },
          { q: "How long does it take?", a: "Usually 3–7 business days after receiving complete documents. Peak season may take longer for incomplete files." },
          { q: "How do payments work?", a: "A deposit is required. The balance is paid when the return is ready, before filing." },
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
          help: "Need help?",
          legal: {
            privacy: "Privacy policy",
            terms: "Terms of use",
            disclaimer: "Legal notice",
            note: "Independent service. We are not the CRA nor Revenu Québec. Returns are prepared and filed based on the information provided by the client.",
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
        },

        heroTitle: (
          <>
            Servicio de{" "}
            <span style={{ color: bleu, fontWeight: 900 }}>
              impuestos en Québec
            </span>{" "}
            — <span style={{ color: bleu, fontWeight: 900 }}>en línea</span>
          </>
        ),

        heroExperience:
          "Más de 30 años de experiencia. Miles de declaraciones preparadas en Québec.",
        heroSub:
          "Servicio independiente solo para Québec. Abra su expediente, suba documentos por un portal seguro y preparo la declaración con la información proporcionada. Le contacto si falta algo antes de presentar.",

        trust: [
          { t: "Solo Québec" },
          { t: "Miles de declaraciones preparadas" },
          { t: "Depósito requerido para abrir el expediente" },
          { t: "Pago seguro (Stripe)" },
          { t: "Acreditación TED (presentación electrónica)" },
          { t: "Confidencialidad" },
          { t: "Plazo habitual: 3–7 días hábiles (expediente completo)" },
        ],

        chooseType: "Elija su situación",
        t1Title: "👤 Empleado/a, estudiante o jubilado/a",
        t1Desc: "T4, RL-1, pensión, estudios, etc.",
        t1Btn: "Comenzar mi declaración ahora",

        autoTitle: "💼 Autónomo / por cuenta propia",
        autoDesc: "Ingresos + gastos según sus comprobantes.",
        autoBtn: "Comenzar mi declaración ahora",

        t2Title: "🏢 Empresa incorporada",
        t2Desc: "Declaración de empresa (T2 + CO-17) según sus documentos.",
        t2Btn: "Abrir mi expediente corporativo",

        seoTitle: "Servicio de impuestos en Québec, simple y guiado",
        seoP1:
          "ComptaNet Québec ofrece un servicio en línea para preparar declaraciones de impuestos en Québec. Abra su expediente, suba sus documentos y preparamos la declaración con la información proporcionada.",
        seoP2:
          "Este servicio es para particulares, autónomos (ingresos y gastos) y empresas incorporadas (declaración de empresa).",
        seoP3:
          "No necesita conocer los formularios. Elija su situación y siga los pasos. Si falta algo, le contactaremos antes de presentar.",

        servicesTitle: "Servicios",
        servicesSub: "Solo Québec — portal seguro para documentos.",
        services: [
          { t: "Impuestos — Particular", d: "Preparada con sus documentos." },
          { t: "Impuestos — Autónomo", d: "Ingresos y gastos según comprobantes." },
          {
            t: "Impuestos — Empresa incorporada",
            d: "Declaración de empresa (T2 + CO-17) con sus documentos e información.",
          },
          { t: "Acreditación TED", d: "Presentación electrónica (TED) cuando aplique." },
          { t: "Portal seguro", d: "Suba documentos (foto o PDF). Sin papel." },
        ],

        stepsTitle: "Cómo funciona",
        steps: [
          { n: "1", t: "Abra su expediente", d: "Cree su portal seguro + pague el depósito." },
          { n: "2", t: "Suba documentos", d: "Suba documentos (foto o PDF) en el portal." },
          { n: "3", t: "Preparación", d: "Con la información proporcionada. Le contactamos si falta algo." },
          { n: "4", t: "Validación y presentación", d: "Pague el saldo antes de presentar. TED cuando aplique." },
        ],

        pricingTitle: "Precios 2026",
        pricingSub:
          "Precios base. El monto final depende de la complejidad y se confirma antes de presentar.",
        plans: [
          {
            t: "Impuestos — Particular",
            p: "desde $100",
            pts: [
              "Depósito requerido: $100 (abre el expediente)",
              "Portal seguro",
              "Según documentos",
            ],
            href: "/tarifs/t1",
          },
          {
            t: "Autónomo",
            p: "desde $150",
            pts: [
              "Depósito requerido: $150 (abre el expediente)",
              "Portal seguro",
              "Ingresos + gastos",
            ],
            href: "/tarifs/travailleur-autonome",
          },
          {
            t: "Empresa incorporada",
            p: "desde $850",
            pts: [
              "Depósito requerido: $450 (abre el expediente)",
              "Portal seguro",
              "T2 + CO-17 según documentos",
              "Sin ingresos: desde $450",
            ],
            href: "/tarifs/t2",
          },
        ],
        getPrice: "Ver detalles",

        whyTitle: "Por qué elegir ComptaNet Québec",
        whyPoints: [
          {
            t: "Más de 30 años — miles de declaraciones",
            d: "Preparación de impuestos en Québec con un proceso claro y comprobado.",
          },
          { t: "Acreditación TED", d: "Presentación electrónica (TED) cuando aplique." },
          { t: "Confidencialidad", d: "La información se trata de forma estrictamente confidencial." },
          { t: "Portal seguro", d: "Suba documentos (foto o PDF) en un solo lugar." },
        ],

        faqTitle: "FAQ",
        faq: [
          { q: "¿Es solo para Québec?", a: "Sí. ComptaNet Québec atiende residentes y empresas de Québec." },
          { q: "No sé cuál opción elegir. ¿Qué hago?", a: "Elija la descripción que coincida con su situación. Si tiene dudas, contáctenos y le guiamos." },
          { q: "¿Cómo envío mis documentos?", a: "Después de crear la cuenta, sube los documentos en el portal seguro (foto o PDF)." },
          { q: "¿Cuánto tarda?", a: "Normalmente 3–7 días hábiles con documentos completos. En temporada alta puede tardar más si falta información." },
          { q: "¿Cómo se paga?", a: "Se requiere un depósito. El saldo se paga cuando esté listo, antes de presentar." },
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
          help: "¿Necesitas ayuda?",
          legal: {
            privacy: "Política de privacidad",
            terms: "Términos de uso",
            disclaimer: "Aviso legal",
            note: "Servicio independiente. No somos la CRA ni Revenu Québec. Las declaraciones se preparan y se presentan con la información proporcionada por el cliente.",
          },
        },
      },
    };

    return dict;
  }, [bleu]);

  const T = COPY[lang];

  // ✅ Liens
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

  const onContactSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setContactOk(null);
    setContactErr(null);

    let token = "";
    try {
      token = grecaptcha ? grecaptcha.getResponse() : "";
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
          token,
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
        if (grecaptcha) grecaptcha.reset();
      } catch {
        // ignore
      }
    } catch {
      setContactErr(T.sentErr);
    } finally {
      setContactBusy(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* reCAPTCHA */}
      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="afterInteractive"
        async
        defer
      />

      {/* FAQ JSON-LD */}
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* NAVBAR (landing) */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Image
              src="/logo-cq.png"
              alt="Logo ComptaNet Québec"
              width={36}
              height={36}
              style={{ borderRadius: 6 }}
              priority
            />
            <strong className={styles.brandName}>{T.brand}</strong>
          </div>

          <nav className={styles.nav}>
            <a href="#services">{T.nav.services}</a>
            <a href="#etapes">{T.nav.steps}</a>
            <a href="#tarifs">{T.nav.pricing}</a>
            <a href="#faq">{T.nav.faq}</a>
            <a href="#contact">{T.nav.contact}</a>

            {/* Lang switch */}
            <div className={styles.langWrap}>
              <div className={styles.langRow}>
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

            <div
              style={{
                marginTop: 8,
                textAlign: "center",
                fontWeight: 900,
                color: bleu,
                letterSpacing: 0.2,
              }}
            >
              {T.heroExperience}
            </div>

            <p className={styles.heroSub}>{T.heroSub}</p>

            <TrustBar items={T.trust} />

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

            <div className={styles.choiceBox}>
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

              {/* ✅ Micro-ligne (trilingue) */}
              <div
                style={{
                  marginTop: 12,
                  textAlign: "center",
                  fontWeight: 800,
                  opacity: 0.95,
                }}
              >
                {lang === "fr"
                  ? "✅ Acompte requis • ✅ Paiement sécurisé (Stripe) • ✅ Accréditation TED"
                  : lang === "en"
                  ? "✅ Deposit required • ✅ Secure payment (Stripe) • ✅ TED accreditation"
                  : "✅ Depósito requerido • ✅ Pago seguro (Stripe) • ✅ Acreditación TED"}
              </div>

              <div style={{ marginTop: 10, textAlign: "center" }}>
                <a
                  href="#tarifs"
                  style={{
                    color: bleu,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
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

        <p className={styles.sectionSub}>
          Service 100 % en ligne partout au Québec (ex. Québec, Montréal, Laval,
          Gatineau, Lévis, Sherbrooke, Trois-Rivières).
        </p>
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
      <section
        id="contact"
        className={styles.section}
        style={{ marginBottom: 0 }}
      >
        <h2 className={styles.sectionTitle}>{T.contactTitle}</h2>

        <div className={styles.contactBox}>
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
              className={styles.input}
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
            />

            <div
              className="g-recaptcha"
              data-sitekey="6LcUqP4rAAAAAPu5Fzw1duIE22QtT_Pt7wN3nxF7"
            />

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
            <a href="mailto:comptanetquebec@gmail.com">
              comptanetquebec@gmail.com
            </a>
          </p>
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
              <Link
                href={toHelp}
                style={{
                  fontWeight: 800,
                  color: "#cbd5e1",
                  textDecoration: "none",
                }}
                prefetch
              >
                {T.footerLinks.help}
              </Link>
            </div>
          </div>

          <div className={styles.footerLegal}>
            <div className={styles.footerLegalRow}>
              <Link
                href={`/legal/confidentialite?lang=${encodeURIComponent(lang)}`}
                style={{ color: "#94a3b8", textDecoration: "none" }}
                prefetch
              >
                {T.footerLinks.legal.privacy}
              </Link>
              <span className={styles.dot}>•</span>
              <Link
                href={`/legal/conditions?lang=${encodeURIComponent(lang)}`}
                style={{ color: "#94a3b8", textDecoration: "none" }}
                prefetch
              >
                {T.footerLinks.legal.terms}
              </Link>
              <span className={styles.dot}>•</span>
              <Link
                href={`/legal/avis-legal?lang=${encodeURIComponent(lang)}`}
                style={{ color: "#94a3b8", textDecoration: "none" }}
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
