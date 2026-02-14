"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";

/* ===== Types ===== */
type Lang = "fr" | "en" | "es";
type FAQItem = { q: string; a: string };

type Copy = {
  metaTitle: string;
  metaDesc: string;

  brand: string;
  title: string;
  sub: string;

  ctas: {
    t1: string;
    ta: string;
    t2: string;
    pricing: string;
    home: string;
  };

  sections: {
    whoTitle: string;
    whoItems: string[];

    howTitle: string;
    howSteps: { n: string; t: string; d: string }[];

    docsTitle: string;
    docsNote: string;
    docsItems: string[];

    delaysTitle: string;
    delaysItems: string[];

    tedTitle: string;
    tedText: string;

    securityTitle: string;
    securityItems: string[];

    qcTitle: string;
    qcText: string;

    pricingTitle: string;
    pricingText: string;

    faqTitle: string;
    faq: FAQItem[];

    footerNote: string;
  };
};

/* ===========================
   Lang helpers (URL only)
=========================== */
function normalizeLang(v: string | null): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function readLangFromUrl(): Lang {
  if (typeof window === "undefined") return "fr";
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeLang(params.get("lang"));
  } catch {
    return "fr";
  }
}

function writeLangToUrl(l: Lang) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
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
              type="button"
              className={styles.faqBtn}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
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

export default function DeclarationImpotQuebecPage() {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const l = readLangFromUrl();
    setLang(l);
    writeLangToUrl(l);
  }, []);

  const COPY = useMemo(() => {
    const fr: Copy = {
      metaTitle: "Déclaration d’impôt au Québec en ligne | ComptaNet Québec",
      metaDesc:
        "Service professionnel de déclaration d’impôt au Québec. Particulier, travailleur autonome et compagnie incorporée. Portail sécurisé, acompte, solde avant l’envoi (TED si applicable).",

      brand: "ComptaNet Québec",
      title: "Service de déclaration d’impôt au Québec — en ligne",
      sub:
        "Page détaillée : qui peut utiliser le service, comment ça fonctionne, documents requis, délais, transmission TED, sécurité et tarifs.",

      ctas: {
        t1: "Commencer (particulier)",
        ta: "Commencer (travailleur autonome)",
        t2: "Créer dossier (compagnie)",
        pricing: "Voir les tarifs",
        home: "Retour à l’accueil",
      },

      sections: {
        whoTitle: "Qui peut utiliser ce service",
        whoItems: [
          "Particulier : salarié(e), étudiant(e), retraité(e), prestations, pension, etc.",
          "Travailleur autonome : revenus d’entreprise + dépenses (factures, relevés, etc.).",
          "Compagnie incorporée : déclaration de société (T2 + CO-17) selon les documents fournis.",
          "Résidents et entreprises du Québec uniquement.",
        ],

        howTitle: "Comment ça fonctionne",
        howSteps: [
          { n: "1", t: "Ouvrir le dossier", d: "Accès au portail + acompte requis selon votre type." },
          { n: "2", t: "Téléverser les documents", d: "Photo ou PDF dans un portail sécurisé." },
          { n: "3", t: "Préparation", d: "Analyse et préparation. Je contacte si quelque chose manque." },
          { n: "4", t: "Validation et envoi", d: "Solde payable quand c’est prêt. Envoi (TED si applicable)." },
        ],

        docsTitle: "Documents requis (exemples)",
        docsNote:
          "La liste exacte dépend de votre situation. Une checklist simple est fournie après l’ouverture du dossier.",
        docsItems: [
          "T4 / Relevé 1, feuillets de pension, assurance-emploi, etc.",
          "Frais médicaux, dons, frais de garde, études (T2202/RL-8), etc.",
          "Travailleur autonome : revenus, dépenses, relevés bancaires, factures, kilométrage, etc.",
          "Immeubles locatifs (si applicable) : revenus/ dépenses, intérêts, taxes, assurances, etc.",
          "Compagnie : états financiers / balance, relevés, salaires, dividendes, etc.",
        ],

        delaysTitle: "Délais",
        delaysItems: [
          "Particulier : 24 à 48 h ouvrables si dossier complet.",
          "Période de pointe : 3 à 7 jours ouvrables selon le volume.",
          "Travailleur autonome et compagnie : variable; estimation après analyse des documents.",
        ],

        tedTitle: "Transmission TED",
        tedText:
          "La transmission électronique (TED) est effectuée lorsque applicable et lorsque le dossier est complet.",

        securityTitle: "Sécurité & confidentialité",
        securityItems: [
          "Portail sécurisé pour téléverser vos documents.",
          "Traitement confidentiel des informations.",
          "Paiement sécurisé via Stripe (acompte + solde).",
        ],

        qcTitle: "Partout au Québec",
        qcText:
          "Service 100 % en ligne partout au Québec (ex. Québec, Montréal, Laval, Gatineau, Lévis, Sherbrooke, Trois-Rivières).",

        pricingTitle: "Tarifs",
        pricingText:
          "Les tarifs de base sont affichés sur la page Tarifs. Le prix final dépend de la complexité et est confirmé avant l’envoi.",

        faqTitle: "FAQ",
        faq: [
          { q: "Est-ce seulement pour le Québec ?", a: "Oui, service Québec seulement." },
          { q: "Comment j’envoie mes documents ?", a: "Vous téléversez des photos ou des PDF dans le portail." },
          { q: "Comment se fait le paiement ?", a: "Acompte à l’ouverture, solde quand la déclaration est prête, avant l’envoi." },
          { q: "Je ne sais pas quel type choisir.", a: "Choisissez l’option la plus proche; sinon écrivez-nous et on vous guide." },
        ],

        footerNote:
          "Service indépendant. Nous ne sommes pas l’ARC ni Revenu Québec. Les déclarations sont préparées à partir des informations fournies par le client.",
      },
    };

    const en: Copy = {
      metaTitle: "Québec tax return service online | ComptaNet Québec",
      metaDesc:
        "Québec-only tax return service. Individual, self-employed, and incorporated business. Secure portal, deposit, balance before filing (TED when applicable).",

      brand: "ComptaNet Québec",
      title: "Québec tax return service — online",
      sub:
        "Detailed page: eligibility, process, required documents, timelines, TED filing, security, and pricing.",

      ctas: {
        t1: "Start (individual)",
        ta: "Start (self-employed)",
        t2: "Open file (corporate)",
        pricing: "View pricing",
        home: "Back to home",
      },

      sections: {
        whoTitle: "Who this service is for",
        whoItems: [
          "Individuals: employees, students, retirees, benefits, pensions, etc.",
          "Self-employed: business income + expenses (invoices, statements, etc.).",
          "Incorporated business: corporate filing (T2 + CO-17) based on your documents.",
          "Québec residents and Québec businesses only.",
        ],

        howTitle: "How it works",
        howSteps: [
          { n: "1", t: "Open your file", d: "Secure portal + deposit based on your type." },
          { n: "2", t: "Upload documents", d: "Photo or PDF in a secure portal." },
          { n: "3", t: "Preparation", d: "We prepare and contact you if anything is missing." },
          { n: "4", t: "Review & file", d: "Pay balance when ready. File (TED when applicable)." },
        ],

        docsTitle: "Required documents (examples)",
        docsNote:
          "The exact checklist depends on your situation. A simple checklist is provided after opening your file.",
        docsItems: [
          "T4 / RL-1, pension slips, employment insurance, etc.",
          "Medical expenses, donations, childcare, tuition (T2202/RL-8), etc.",
          "Self-employed: income, expenses, bank statements, invoices, mileage, etc.",
          "Rental properties (if applicable): income/expenses, interest, taxes, insurance, etc.",
          "Corporate: financial statements / trial balance, statements, payroll, dividends, etc.",
        ],

        delaysTitle: "Timelines",
        delaysItems: [
          "Individual: 24–48 business hours if complete.",
          "Peak season: 3–7 business days depending on volume.",
          "Self-employed/corporate: varies; estimate after document review.",
        ],

        tedTitle: "TED e-filing",
        tedText:
          "Electronic filing (TED) is used when applicable and once the file is complete.",

        securityTitle: "Security & confidentiality",
        securityItems: [
          "Secure document portal.",
          "Confidential handling of information.",
          "Secure Stripe payment (deposit + balance).",
        ],

        qcTitle: "Available across Québec",
        qcText:
          "100% online across Québec (e.g., Québec City, Montréal, Laval, Gatineau, Lévis, Sherbrooke, Trois-Rivières).",

        pricingTitle: "Pricing",
        pricingText:
          "Base pricing is on the Pricing page. Final price depends on complexity and is confirmed before filing.",

        faqTitle: "FAQ",
        faq: [
          { q: "Is it Québec only?", a: "Yes, Québec only." },
          { q: "How do I send documents?", a: "Upload photos or PDFs in the portal." },
          { q: "How do payments work?", a: "Deposit to open, balance when ready, before filing." },
          { q: "I’m not sure which option to choose.", a: "Pick the closest match; contact us if unsure." },
        ],

        footerNote:
          "Independent service. We are not the CRA nor Revenu Québec. Returns are prepared from client-provided information.",
      },
    };

    const es: Copy = {
      metaTitle: "Servicio de impuestos en Québec en línea | ComptaNet Québec",
      metaDesc:
        "Servicio solo para Québec. Particular, autónomo y empresa incorporada. Portal seguro, depósito, saldo antes de presentar (TED si aplica).",

      brand: "ComptaNet Québec",
      title: "Servicio de impuestos en Québec — en línea",
      sub:
        "Página detallada: quién puede usar el servicio, proceso, documentos, tiempos, TED, seguridad y precios.",

      ctas: {
        t1: "Empezar (particular)",
        ta: "Empezar (autónomo)",
        t2: "Abrir expediente (empresa)",
        pricing: "Ver precios",
        home: "Volver al inicio",
      },

      sections: {
        whoTitle: "Para quién es este servicio",
        whoItems: [
          "Particulares: empleados, estudiantes, jubilados, beneficios, pensiones, etc.",
          "Autónomos: ingresos + gastos (facturas, extractos, etc.).",
          "Empresa incorporada: declaración (T2 + CO-17) según documentos.",
          "Solo residentes y empresas de Québec.",
        ],

        howTitle: "Cómo funciona",
        howSteps: [
          { n: "1", t: "Abrir el expediente", d: "Portal seguro + depósito según el tipo." },
          { n: "2", t: "Subir documentos", d: "Foto o PDF en el portal." },
          { n: "3", t: "Preparación", d: "Preparo y contacto si falta algo." },
          { n: "4", t: "Validación y presentación", d: "Pagar saldo cuando esté listo. Presentación (TED si aplica)." },
        ],

        docsTitle: "Documentos requeridos (ejemplos)",
        docsNote:
          "La lista exacta depende de su situación. Se entrega una checklist simple al abrir el expediente.",
        docsItems: [
          "T4 / RL-1, pensión, seguro de empleo, etc.",
          "Gastos médicos, donaciones, guardería, estudios (T2202/RL-8), etc.",
          "Autónomo: ingresos, gastos, extractos, facturas, kilometraje, etc.",
          "Alquiler (si aplica): ingresos/gastos, intereses, impuestos, seguros, etc.",
          "Empresa: estados financieros / balance, extractos, nómina, dividendos, etc.",
        ],

        delaysTitle: "Tiempos",
        delaysItems: [
          "Particular: 24–48 horas hábiles si completo.",
          "Temporada alta: 3–7 días hábiles según volumen.",
          "Autónomo/empresa: variable; estimación tras revisar documentos.",
        ],

        tedTitle: "Presentación TED",
        tedText:
          "La presentación electrónica (TED) se usa cuando aplica y cuando el expediente está completo.",

        securityTitle: "Seguridad y confidencialidad",
        securityItems: [
          "Portal seguro para documentos.",
          "Tratamiento confidencial.",
          "Pago seguro con Stripe (depósito + saldo).",
        ],

        qcTitle: "Disponible en todo Québec",
        qcText:
          "100% en línea en todo Québec (ej. Québec, Montréal, Laval, Gatineau, Lévis, Sherbrooke, Trois-Rivières).",

        pricingTitle: "Precios",
        pricingText:
          "Los precios base están en la página de Precios. El monto final depende de la complejidad y se confirma antes de presentar.",

        faqTitle: "FAQ",
        faq: [
          { q: "¿Es solo para Québec?", a: "Sí, solo Québec." },
          { q: "¿Cómo envío documentos?", a: "Suba fotos o PDFs en el portal." },
          { q: "¿Cómo se paga?", a: "Depósito para abrir, saldo cuando esté listo, antes de presentar." },
          { q: "No sé qué opción elegir.", a: "Elija la más cercana; contáctenos si tiene dudas." },
        ],

        footerNote:
          "Servicio independiente. No somos la CRA ni Revenu Québec. Las declaraciones se preparan con la información proporcionada por el cliente.",
      },
    };

    return { fr, en, es } as const;
  }, []);

  const T = COPY[lang];

  // Links (mêmes routes que ta home)
  const toHome = `/?lang=${encodeURIComponent(lang)}`;
  const toPricing = `/tarifs?lang=${encodeURIComponent(lang)}`;

  const toClient = `/espace-client?lang=${encodeURIComponent(lang)}`;

  const toT1 = `/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(
    "/formulaire-fiscal"
  )}`;
  const toTA = `/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(
    "/formulaire-fiscal-ta"
  )}`;
  const toT2 = `/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(
    "/formulaire-fiscal-t2"
  )}`;

  // FAQ JSON-LD
  const faqJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: T.sections.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
  }, [T.sections.faq]);

  // SEO meta via <head> client-side (simple) + JSON-LD
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = T.metaTitle;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", T.metaDesc);
  }, [T.metaTitle, T.metaDesc]);

  return (
    <main className={styles.main}>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>{T.brand}</div>

          <div className={styles.langRow}>
            <span className={styles.langLabel}>
              {lang === "fr" ? "Langue" : lang === "en" ? "Language" : "Idioma"}
            </span>
            {(["fr", "en", "es"] as const).map((l) => (
              <button
                key={l}
                type="button"
                className={`${styles.langBtn} ${l === lang ? styles.langBtnActive : ""}`}
                aria-pressed={l === lang}
                onClick={() => {
                  setLang(l);
                  writeLangToUrl(l);
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className={styles.topLinks}>
            <Link className={styles.topLink} href={toHome}>
              {T.ctas.home}
            </Link>
            <Link className={styles.topLink} href={toClient}>
              {lang === "fr" ? "Espace client" : lang === "en" ? "Client portal" : "Portal del cliente"}
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.h1}>{T.title}</h1>
        <p className={styles.lead}>{T.sub}</p>

        <div className={styles.ctaRow}>
          <Link href={toT1} className="btn btn-primary">
            {T.ctas.t1}
          </Link>
          <Link href={toTA} className="btn btn-outline">
            {T.ctas.ta}
          </Link>
          <Link href={toT2} className="btn btn-outline">
            {T.ctas.t2}
          </Link>
          <Link href={toPricing} className="btn btn-outline">
            {T.ctas.pricing}
          </Link>
        </div>
      </section>

      <div className={styles.container}>
        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.whoTitle}</h2>
          <ul className={styles.ul}>
            {T.sections.whoItems.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.howTitle}</h2>
          <div className={styles.stepsGrid}>
            {T.sections.howSteps.map((s, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.stepNum}>{s.n}</div>
                <div className={styles.stepTitle}>{s.t}</div>
                <div className={styles.stepDesc}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.docsTitle}</h2>
          <p className={styles.note}>{T.sections.docsNote}</p>
          <ul className={styles.ul}>
            {T.sections.docsItems.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.delaysTitle}</h2>
          <ul className={styles.ul}>
            {T.sections.delaysItems.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.tedTitle}</h2>
          <p className={styles.p}>{T.sections.tedText}</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.securityTitle}</h2>
          <ul className={styles.ul}>
            {T.sections.securityItems.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.qcTitle}</h2>
          <p className={styles.p}>{T.sections.qcText}</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.pricingTitle}</h2>
          <p className={styles.p}>{T.sections.pricingText}</p>
          <div className={styles.ctaRow2}>
            <Link href={toPricing} className="btn btn-primary">
              {T.ctas.pricing}
            </Link>
            <Link href={toClient} className="btn btn-outline">
              {lang === "fr" ? "Ouvrir mon dossier" : lang === "en" ? "Open my file" : "Abrir mi expediente"}
            </Link>
          </div>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>{T.sections.faqTitle}</h2>
          <FAQ items={T.sections.faq} />
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerNote}>{T.sections.footerNote}</div>
        </div>
      </footer>
    </main>
  );
}
