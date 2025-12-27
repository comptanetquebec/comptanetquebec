"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";

/** Déclaration minimale pour éviter l'erreur TS sur grecaptcha */
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
          fontWeight: 600,
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
            fontWeight: 700,
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
                fontWeight: 700,
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

  const COPY = {
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
      ctaMain: "Démarrer ma déclaration",
      heroTitle: (
        <>
          Service d’impôt personnel et corporatif partout au Canada{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>(incluant le Québec)</span>{" "}
          avec <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),

      // ✅ PARAGRAPHE DU HAUT (MODIFIÉ)
      heroSub:
        "Déclarations T1 (particuliers et travailleurs autonomes) partout au Canada, incluant le Québec. Déclarations T2 pour sociétés incorporées dans toutes les provinces. Au Québec, nous préparons aussi la CO-17. Dépôt de documents via portail sécurisé. Préparation humaine et envoi conforme à l’ARC et à Revenu Québec.",

      chooseType: "Choisissez votre situation fiscale",
      t1Title: "Impôt des particuliers (T1 Canada / Québec)",
      t1Desc:
        "Votre déclaration personnelle annuelle (salarié, étudiant, retraité). On produit la déclaration fédérale pour l’ARC et, si vous vivez au Québec, la déclaration Québec aussi.",
      t1Btn: "Impôt personnel T1",
      autoTitle: "Travailleur autonome / petit business (T1 Canada / Québec)",
      autoDesc:
        "Votre T1 avec revenus d’entreprise, piges, livraison, sous-traitance. On inclut toutes vos dépenses admissibles. Fédéral + Québec si requis.",
      autoBtn: "T1 travailleur autonome",
      t2Title: "Société incorporée (T2 partout au Canada)",
      t2Desc:
        "Impôt de votre société incorporée (T2 fédéral + déclaration provinciale). Au Québec : T2 + CO-17.",
      t2Btn: "Impôt société T2",

      servicesTitle: "Services offerts",
      servicesSub:
        "Impôt personnel, travail autonome et sociétés incorporées — partout au Canada, incluant le Québec.",
      services: [
        {
          t: "Déclaration T1 particuliers",
          d: "Déclaration fédérale (ARC). Si vous êtes résident du Québec, on prépare aussi votre déclaration Revenu Québec.",
        },
        {
          t: "Travailleurs autonomes / revenus d’entreprise",
          d: "Revenus autonome, dépenses admissibles, kilométrage, cellulaire, bureau à la maison, etc. Fédéral + Québec si applicable.",
        },
        {
          t: "Déclaration T2 (sociétés incorporées)",
          d: "Impôt des sociétés partout au Canada. Au Québec, on inclut aussi la CO-17.",
        },
        {
          t: "Portail sécurisé pour vos documents",
          d: "Déposez vos T4 / Relevé 1, factures, relevés bancaires, états financiers. Zéro papier.",
        },
        {
          t: "Optimisation fiscale",
          d: "On vérifie crédits, dépenses déductibles, REER, frais d’auto, etc., avant d’envoyer.",
        },
      ],

      stepsTitle: "Comment ça fonctionne",
      steps: [
        { n: "1", t: "Créez votre compte", d: "On ouvre votre espace client sécurisé." },
        {
          n: "2",
          t: "Téléversez vos documents",
          d: "Glissez vos feuillets, factures, relevés bancaires, états financiers (photo ou PDF).",
        },
        { n: "3", t: "On prépare votre déclaration", d: "Un spécialiste fiscal prépare vos formulaires. Vous validez avant l’envoi." },
        {
          n: "4",
          t: "Envoi officiel",
          d: "On transmet à l’ARC (fédéral) et à Revenu Québec / la province au besoin. Vous recevez une confirmation.",
        },
      ],

      pricingTitle: "Tarifs 2025",
      pricingSub:
        "Tarifs de base. Le prix final dépend de la complexité (revenus multiples, immeubles locatifs, tenue de livres manquante, etc.). On confirme toujours le montant AVANT d’envoyer quoi que ce soit.",
      plans: [
        {
          t: "Impôt des particuliers (T1 Canada / Québec)",
          p: "à partir de 100 $",
          pts: ["T4 / Relevé 1 inclus", "Crédits et déductions de base", "Fédéral (ARC) + Québec si applicable", "Portail client sécurisé", "Acompte initial 100 $"],
          href: "/tarifs/t1",
        },
        {
          t: "Travailleur autonome / petit business (T1 Canada / Québec)",
          p: "à partir de 150 $",
          pts: [
            "Revenus d’entreprise / travail autonome",
            "Dépenses admissibles (kilométrage, cellulaire, etc.)",
            "Optimisation REER / déductions",
            "Fédéral (ARC) + Québec si applicable",
            "Acompte initial 100 $",
          ],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Sociétés incorporées (T2 partout au Canada)",
          p: "à partir de 850 $",
          pts: [
            "Déclaration T2 fédérale (ARC)",
            "Déclaration provinciale requise selon la province",
            "Au Québec : CO-17 incluse",
            "États financiers / Bilan / Résultats",
            "Acompte initial 400 $",
            "Société sans revenus? À partir de 450 $",
          ],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "Voir les détails",

      whyTitle: "Pourquoi nous choisir",
      whyPoints: [
        { t: "Service humain et rapide", d: "Votre dossier est traité par une vraie personne, pas juste un robot." },
        { t: "Portail 100 % sécurisé", d: "Téléversement de vos documents sans impression ni déplacement." },
        { t: "Basé au Québec", d: "On connaît la réalité fiscale du Québec… mais on sert tout le Canada." },
        { t: "Conforme ARC / Revenu Québec", d: "On envoie officiellement vos déclarations aux bons gouvernements." },
      ],

      faqTitle: "FAQ",
      faq: [
        {
          q: "Est-ce que vous faites les impôts au Québec?",
          a: "Oui. Pour les particuliers et travailleurs autonomes du Québec, on prépare la déclaration fédérale (ARC) ET la déclaration Québec (Revenu Québec). Pour les sociétés au Québec, on s’occupe aussi de la CO-17.",
        },
        {
          q: "Je suis en Ontario / Alberta / Manitoba… est-ce que je peux vous envoyer mes impôts?",
          a: "Oui. On sert toutes les provinces et territoires du Canada, à distance, par portail sécurisé. Pas besoin d’être physiquement au Québec.",
        },
        {
          q: "Comment je vous envoie mes documents?",
          a: "Dès que votre compte est créé, vous avez un portail sécurisé pour téléverser vos pièces (photos ou PDF). Plus besoin d’imprimer.",
        },
        {
          q: "Combien de temps ça prend?",
          a: "Habituellement 3 à 7 jours ouvrables après réception complète des infos. En haute saison (mars–avril), les dossiers incomplets peuvent prendre plus longtemps.",
        },
        {
          q: "Comment se fait le paiement?",
          a: "On demande un acompte (100 $ pour T1 / 400 $ pour T2). Le solde est payable quand la déclaration est prête, avant l’envoi officiel. Paiement par transfert Interac ou carte (lien sécurisé).",
        },
      ],

      contactTitle: "Contact",
      contactHint: "Vous pouvez aussi nous écrire à",
      send: "Envoyer",
      contactPlaceholders: { name: "Votre nom", email: "Votre courriel", msg: "Comment pouvons-nous aider?" },

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
          note: "Nous ne sommes pas l’ARC ni Revenu Québec. Nous préparons et transmettons vos déclarations selon l’information fournie.",
        },
      },
    },

    en: {
      brand: "ComptaNet Québec",
      nav: { services: "Services", steps: "Steps", pricing: "Pricing", faq: "FAQ", contact: "Contact", client: "Client portal" },
      ctaMain: "Start my tax return",
      heroTitle: (
        <>
          Personal and corporate tax services across Canada{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>(including Québec)</span>{" "}
          with <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "T1 returns (individuals and self-employed) across Canada, including Québec. T2 returns for incorporated companies in all provinces. In Québec, we also prepare the CO-17. Upload documents through a secure portal. Human preparation and compliant filing with the CRA and Revenu Québec.",

      chooseType: "Choose your tax situation",
      t1Title: "Individuals (T1 Canada / Québec)",
      t1Desc: "Your annual personal return (employee, student, retiree). We file with the CRA and, if you live in Québec, we file the Québec return too.",
      t1Btn: "T1 personal return",
      autoTitle: "Self-employed / small business (T1 Canada / Québec)",
      autoDesc: "Your T1 with business income. We include eligible expenses. Federal + Québec if applicable.",
      autoBtn: "T1 self-employed",
      t2Title: "Incorporated company (T2 across Canada)",
      t2Desc: "Corporate tax return (federal T2 + required provincial return). In Québec: T2 + CO-17.",
      t2Btn: "T2 corporate return",

      servicesTitle: "Services",
      servicesSub: "Personal taxes, self-employment, and incorporated companies — across Canada, including Québec.",
      services: [
        { t: "T1 individual returns", d: "Federal return (CRA). If you’re in Québec, we also prepare your Revenu Québec return." },
        { t: "Self-employed / business income", d: "Business income and eligible expenses (vehicle, phone, home office, etc.). Federal + Québec if applicable." },
        { t: "T2 corporate returns", d: "Corporate taxes across Canada. In Québec, we also include the CO-17." },
        { t: "Secure portal", d: "Upload T4 / RL-1, invoices, statements, and financials. Paperless." },
        { t: "Tax optimization", d: "We review credits and deductions before filing." },
      ],

      stepsTitle: "How it works",
      steps: [
        { n: "1", t: "Create your account", d: "We set up your secure client portal." },
        { n: "2", t: "Upload your documents", d: "Upload slips, invoices, bank statements, and financials (photo or PDF)." },
        { n: "3", t: "We prepare your return", d: "A tax specialist prepares your file. You review before filing." },
        { n: "4", t: "Official filing", d: "We file with the CRA and, if needed, with Revenu Québec / your province. You get confirmation." },
      ],

      pricingTitle: "2025 Pricing",
      pricingSub:
        "Base pricing. Final price depends on complexity (multiple income sources, rentals, missing bookkeeping, etc.). We always confirm the amount BEFORE filing.",
      plans: [
        {
          t: "Individuals (T1 Canada / Québec)",
          p: "from $100",
          pts: ["T4 / RL-1 included", "Basic credits and deductions", "Federal (CRA) + Québec if applicable", "Secure client portal", "Initial deposit $100"],
          href: "/tarifs/t1",
        },
        {
          t: "Self-employed / small business (T1 Canada / Québec)",
          p: "from $150",
          pts: ["Business / self-employment income", "Eligible expenses (vehicle, phone, etc.)", "RRSP / deduction optimization", "Federal (CRA) + Québec if applicable", "Initial deposit $100"],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Incorporated companies (T2 across Canada)",
          p: "from $850",
          pts: ["Federal T2 (CRA)", "Required provincial return", "In Québec: CO-17 included", "Financial statements / Balance sheet / Income statement", "Initial deposit $400", "No-revenue corporation? From $450"],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "View details",

      whyTitle: "Why choose us",
      whyPoints: [
        { t: "Human and fast service", d: "Your file is handled by a real person." },
        { t: "100% secure portal", d: "Upload documents without printing or travel." },
        { t: "Based in Québec", d: "We know Québec tax reality, and we serve all of Canada." },
        { t: "CRA / Revenu Québec compliant", d: "We file with the right authorities." },
      ],

      faqTitle: "FAQ",
      faq: [
        { q: "Do you handle Québec tax returns?", a: "Yes. For Québec residents, we prepare both the federal CRA return and the Québec (Revenu Québec) return. For Québec corporations, we also handle the CO-17." },
        { q: "I’m in Ontario / Alberta / Manitoba… can I use your service?", a: "Yes. We serve all provinces and territories remotely via a secure portal." },
        { q: "How do I send my documents?", a: "Once your account is created, you can upload documents securely (photo or PDF)." },
        { q: "How long does it take?", a: "Usually 3–7 business days after receiving complete information. During peak season (Mar–Apr), incomplete files may take longer." },
        { q: "How do payments work?", a: "We request a deposit ($100 for T1 / $400 for T2). The balance is due when the return is ready, before filing. Payment via Interac transfer or card (secure link)." },
      ],

      contactTitle: "Contact",
      contactHint: "You can also email us at",
      send: "Send",
      contactPlaceholders: { name: "Your name", email: "Your email", msg: "How can we help?" },

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
          note: "We are not the CRA nor Revenu Québec. We prepare and file returns based on the information you provide.",
        },
      },
    },

    es: {
      brand: "ComptaNet Québec",
      nav: { services: "Servicios", steps: "Pasos", pricing: "Precios", faq: "FAQ", contact: "Contacto", client: "Portal del cliente" },
      ctaMain: "Empezar mi declaración",
      heroTitle: (
        <>
          Impuestos personales y corporativos en todo Canadá{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>(incluido Québec)</span>{" "}
          con <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Declaraciones T1 (personas y autónomos) en todo Canadá, incluido Québec. Declaraciones T2 para empresas incorporadas en todas las provincias. En Québec, también preparamos la CO-17. Suba sus documentos por un portal seguro. Preparación humana y presentación conforme ante la CRA y Revenu Québec.",

      chooseType: "Elija su situación fiscal",
      t1Title: "Personas (T1 Canadá / Québec)",
      t1Desc: "Su declaración anual personal. Presentamos ante la CRA y, si vive en Québec, también la declaración de Québec.",
      t1Btn: "T1 personal",
      autoTitle: "Autónomo / pequeño negocio (T1 Canadá / Québec)",
      autoDesc: "Su T1 con ingresos de negocio. Incluimos gastos deducibles. Federal + Québec si corresponde.",
      autoBtn: "T1 autónomo",
      t2Title: "Empresa incorporada (T2 en Canadá)",
      t2Desc: "Impuesto corporativo (T2 federal + declaración provincial requerida). En Québec: T2 + CO-17.",
      t2Btn: "T2 corporativo",

      servicesTitle: "Servicios",
      servicesSub: "Impuestos personales, autónomos y empresas incorporadas — en todo Canadá, incluido Québec.",
      services: [
        { t: "Declaraciones T1", d: "Declaración federal (CRA). Si vive en Québec, también preparamos Revenu Québec." },
        { t: "Autónomos / ingresos de negocio", d: "Ingresos y gastos deducibles (vehículo, teléfono, oficina en casa, etc.)." },
        { t: "Declaraciones T2", d: "Impuestos corporativos en Canadá. En Québec incluimos también la CO-17." },
        { t: "Portal seguro", d: "Suba T4 / RL-1, facturas, estados bancarios y financieros. Sin papel." },
        { t: "Optimización fiscal", d: "Revisamos créditos y deducciones antes de presentar." },
      ],

      stepsTitle: "Cómo funciona",
      steps: [
        { n: "1", t: "Cree su cuenta", d: "Configuramos su portal seguro." },
        { n: "2", t: "Suba sus documentos", d: "Suba formularios, facturas y estados (foto o PDF)." },
        { n: "3", t: "Preparamos su declaración", d: "Un especialista prepara su expediente. Usted valida antes de presentar." },
        { n: "4", t: "Presentación oficial", d: "Presentamos ante la CRA y, si corresponde, ante Québec / su provincia." },
      ],

      pricingTitle: "Precios 2025",
      pricingSub:
        "Precios base. El precio final depende de la complejidad. Siempre confirmamos el monto ANTES de presentar.",
      plans: [
        {
          t: "Personas (T1 Canadá / Québec)",
          p: "desde $100",
          pts: ["T4 / RL-1 incluido", "Créditos y deducciones básicas", "Federal (CRA) + Québec si corresponde", "Portal seguro", "Depósito inicial $100"],
          href: "/tarifs/t1",
        },
        {
          t: "Autónomo / pequeño negocio (T1 Canadá / Québec)",
          p: "desde $150",
          pts: ["Ingresos de negocio", "Gastos deducibles", "Optimización de deducciones", "Federal + Québec si corresponde", "Depósito inicial $100"],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Empresas incorporadas (T2 Canadá)",
          p: "desde $850",
          pts: ["T2 federal (CRA)", "Declaración provincial requerida", "En Québec: CO-17 incluida", "Estados financieros", "Depósito inicial $400", "Sin ingresos: desde $450"],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "Ver detalles",

      whyTitle: "Por qué elegirnos",
      whyPoints: [
        { t: "Servicio humano y rápido", d: "Su expediente lo gestiona una persona real." },
        { t: "Portal 100% seguro", d: "Suba documentos sin imprimir ni desplazarse." },
        { t: "Basado en Québec", d: "Conocemos Québec y atendemos todo Canadá." },
        { t: "Conforme a CRA / Revenu Québec", d: "Presentación ante las autoridades correctas." },
      ],

      faqTitle: "FAQ",
      faq: [
        { q: "¿Hacen impuestos en Québec?", a: "Sí. Para residentes de Québec, preparamos la declaración federal y la de Québec. Para empresas de Québec, también la CO-17." },
        { q: "¿Puedo usar el servicio desde otra provincia?", a: "Sí. Atendemos todo Canadá a distancia mediante portal seguro." },
        { q: "¿Cómo envío mis documentos?", a: "Tras crear su cuenta, puede subir documentos (foto o PDF) en el portal." },
        { q: "¿Cuánto tarda?", a: "Normalmente 3–7 días hábiles con información completa. En temporada alta puede tardar más." },
        { q: "¿Cómo se paga?", a: "Pedimos un depósito ($100 T1 / $400 T2). El saldo se paga cuando esté listo, antes de presentar." },
      ],

      contactTitle: "Contacto",
      contactHint: "También puede escribirnos a",
      send: "Enviar",
      contactPlaceholders: { name: "Su nombre", email: "Su correo", msg: "¿Cómo podemos ayudar?" },

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
          note: "No somos la CRA ni Revenu Québec. Preparamos y presentamos según la información que usted proporciona.",
        },
      },
    },
  } as const;

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
              fontWeight: 600,
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

  /** Handler pour bloquer l'envoi si la case reCAPTCHA n'est pas cochée */
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    try {
      const token = typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : "";
      if (!token) {
        e.preventDefault();
        alert(lang === "fr"
          ? "Merci de cocher « Je ne suis pas un robot » pour continuer."
          : lang === "en"
          ? 'Please check "I’m not a robot" to continue.'
          : 'Por favor marque "No soy un robot" para continuar.'
        );
      }
    } catch {
      e.preventDefault();
      alert(lang === "fr"
        ? "reCAPTCHA n’a pas été chargé. Veuillez réessayer."
        : lang === "en"
        ? "reCAPTCHA did not load. Please try again."
        : "reCAPTCHA no se cargó. Inténtelo de nuevo."
      );
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
            <a href="#services" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>{T.nav.services}</a>
            <a href="#etapes" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>{T.nav.steps}</a>
            <a href="#tarifs" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>{T.nav.pricing}</a>
            <a href="#faq" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>{T.nav.faq}</a>
            <a href="#contact" style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap" }}>{T.nav.contact}</a>

            <Link
              href={`/espace-client?lang=${lang}`}
              style={{ textDecoration: "none", color: "#374151", whiteSpace: "nowrap", fontWeight: 600 }}
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
          <Image src="/banniere.png" alt="Bannière fisc" fill style={{ objectFit: "cover" }} priority sizes="100vw" />
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
              <a
                href="#tarifs"
                style={{
                  display: "inline-block",
                  background: bleu,
                  color: "white",
                  padding: "12px 22px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {T.ctaMain}
              </a>

              <Link
                href={`/espace-client?lang=${lang}`}
                style={{
                  display: "inline-block",
                  border: `2px solid ${bleu}`,
                  color: bleu,
                  padding: "10px 20px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {T.nav.client}
              </Link>
            </div>

            {/* Choix du type d'impôt */}
            <div style={{ marginTop: 28, textAlign: "left", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 16px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937", marginBottom: 12, textAlign: "center" }}>
                {T.chooseType}
              </div>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))" }}>
                <TaxChoiceCard title={T.t1Title} desc={T.t1Desc} btn={T.t1Btn} href={toT1} bleu={bleu} />
                <TaxChoiceCard title={T.autoTitle} desc={T.autoDesc} btn={T.autoBtn} href={toT1Auto} bleu={bleu} />
                <TaxChoiceCard title={T.t2Title} desc={T.t2Desc} btn={T.t2Btn} href={toT2} bleu={bleu} />
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
                    fontWeight: 700,
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

              <div style={{ color: bleu, fontWeight: 800, fontSize: 20, margin: "8px 0 12px" }}>{plan.p}</div>

              <ul style={{ margin: 0, paddingLeft: 18, color: "#6b7280", fontSize: 14, lineHeight: 1.45 }}>
                {plan.pts.map((pt: string, j: number) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={`${plan.href}?lang=${lang}`} style={{ display: "inline-block", background: bleu, color: "white", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {T.getPrice}
                </Link>

                <Link href={`/espace-client?lang=${lang}`} style={{ display: "inline-block", border: `2px solid ${bleu}`, color: bleu, padding: "9px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {T.nav.client}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 20 }}>{T.whyTitle}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {T.whyPoints?.map((pt: any, i: number) => (
            <div key={i} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: 6, fontSize: 16, lineHeight: 1.4 }}>{pt.t}</div>
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
      <section id="contact" style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px 60px", display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <h2 style={{ color: bleu }}>{T.contactTitle}</h2>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "white", maxWidth: 700 }}>
          <form action="mailto:comptanetquebec@gmail.com" method="post" encType="text/plain" onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 12 }}>
              <input name="Nom" placeholder={T.contactPlaceholders?.name || "Votre nom"} required style={inputStyle} />
              <input name="Courriel" placeholder={T.contactPlaceholders?.email || "Votre courriel"} type="email" required style={inputStyle} />
              <textarea name="Message" placeholder={T.contactPlaceholders?.msg || "Comment pouvons-nous aider?"} rows={5} style={inputStyle} />

              {/* reCAPTCHA v2 – clé de SITE (publique) */}
              <div className="g-recaptcha" data-sitekey="6LcUqP4rAAAAAPu5Fzw1duIE22QtT_Pt7wN3nxF7" />

              <button
                type="submit"
                style={{ background: bleu, color: "white", border: 0, padding: "12px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
              >
                {T.send}
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
              <a href="#services" style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap" }}>{T.footerLinks.services}</a>
              <a href="#tarifs" style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap" }}>{T.footerLinks.pricing}</a>
              <a href="#contact" style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap" }}>{T.footerLinks.contact}</a>
              <Link href={`/espace-client?lang=${lang}`} style={{ color: "#cbd5e1", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 600 }}>
                {T.nav.client}
              </Link>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, fontSize: 12, color: "#94a3b8", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, lineHeight: 1.4 }}>
              <Link href={`/legal/confidentialite?lang=${lang}`} style={{ color: "#94a3b8", textDecoration: "none" }}>{T.footerLinks.legal.privacy}</Link>
              <span style={{ opacity: 0.4 }}>•</span>
              <Link href={`/legal/conditions?lang=${lang}`} style={{ color: "#94a3b8", textDecoration: "none" }}>{T.footerLinks.legal.terms}</Link>
              <span style={{ opacity: 0.4 }}>•</span>
              <Link href={`/legal/avis-legal?lang=${lang}`} style={{ color: "#94a3b8", textDecoration: "none" }}>{T.footerLinks.legal.disclaimer}</Link>
            </div>

            <div style={{ maxWidth: 800, lineHeight: 1.4 }}>{T.footerLinks.legal.note}</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
