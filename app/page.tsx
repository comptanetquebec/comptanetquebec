"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const bleu = "#004aad" as const;

  // langues supportées
  type Lang = "fr" | "en" | "es";
  const [lang, setLang] = useState<Lang>("fr");
  const [isMobile, setIsMobile] = useState(false);

  // responsive helper
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // dictionnaire multilingue
  const T = {
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

      // HERO
      ctaMain: "Commencez dès aujourd’hui",
      heroTitle: (
        <>
          Impôt personnel et corporatif partout au Canada{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>
            (incluant le Québec)
          </span>{" "}
          avec{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Déclarations T1 (particuliers et travailleurs autonomes) partout au Canada, incluant la déclaration fédérale et le Québec. Déclarations T2 pour les sociétés incorporées dans toutes les provinces canadiennes. Au Québec, nous produisons aussi la CO-17. Service rapide, sécurisé et géré par des spécialistes fiscaux.",

      chooseType: "Choisissez votre type d’impôt",
      t1Title: "Impôt des particuliers (T1 Canada, incluant Québec)",
      t1Desc:
        "Salarié, étudiant, retraité, etc. On produit votre déclaration fédérale pour l’ARC et, si vous vivez au Québec, aussi la déclaration Québec.",
      t1Btn: "Commencer T1",
      autoTitle:
        "Travailleur autonome / petit business (T1 Canada, incluant Québec)",
      autoDesc:
        "Travailleur autonome, livreur, pigiste, sous-traitant. On inclut vos revenus d’entreprise et vos dépenses. Fédéral + Québec si applicable.",
      autoBtn: "T1 travailleur autonome",
      t2Title: "Impôt des sociétés (T2 partout au Canada)",
      t2Desc:
        "Sociétés incorporées dans n’importe quelle province. On prépare la T2 fédérale (ARC) et la déclaration provinciale requise. Au Québec : T2 + CO-17.",
      t2Btn: "Commencer T2",

      // SERVICES
      servicesTitle: "Services",
      servicesSub:
        "On s’occupe de tout pour vos impôts personnels et corporatifs, partout au pays.",
      services: [
        {
          t: "Déclarations T1 particuliers (Canada et Québec)",
          d: "Déclaration fédérale à l’ARC, et pour les résidents du Québec, aussi la déclaration Revenu Québec.",
        },
        {
          t: "Travailleurs autonomes (Canada et Québec)",
          d: "Revenus d’entreprise / travail autonome, dépenses admissibles, optimisation fiscale. Inclus : fédéral + Québec si requis.",
        },
        {
          t: "Déclarations T2 pour sociétés canadiennes",
          d: "Impôt des sociétés incorporées partout au Canada. Au Québec, nous produisons aussi la CO-17.",
        },
        {
          t: "Organisation sécurisée de vos pièces",
          d: "Portail sécurisé pour déposer T4 / Relevé 1, factures, relevés bancaires, états financiers, etc.",
        },
        {
          t: "Optimisation et soutien",
          d: "Crédits, déductions, dépenses d’entreprise, optimisation REER. On vérifie avant l’envoi.",
        },
      ],

      // ÉTAPES
      stepsTitle: "Comment ça marche (4 étapes simples)",
      steps: [
        {
          n: "1",
          t: "Créez votre compte",
          d: "On vous ouvre un espace client sécurisé.",
        },
        {
          n: "2",
          t: "Téléversez vos documents",
          d: "Photos ou PDF (T4, Relevé 1, factures, relevés bancaires, états financiers…).",
        },
        {
          n: "3",
          t: "Révision & approbation",
          d: "On prépare vos déclarations. Vous validez avant l’envoi officiel.",
        },
        {
          n: "4",
          t: "Transmission officielle",
          d: "On transmet à l’ARC (fédéral), et à Revenu Québec si nécessaire. Vous recevez la confirmation.",
        },
      ],

      // TARIFS
      pricingTitle: "Tarifs 2025",
      pricingSub:
        "Tarifs de base. Le prix final dépend de la complexité (revenus multiples, locations, tenue de livres, structure corporative, etc.). On confirme toujours le montant AVANT d’envoyer quoi que ce soit.",
      plans: [
        {
          t: "Impôt des particuliers (T1 Canada / Québec)",
          p: "à partir de 100 $",
          pts: [
            "T4 / Relevé 1",
            "Crédits et déductions de base",
            "Fédéral (ARC) + Québec si applicable",
            "Portail client sécurisé",
            "Acompte initial 100 $",
          ],
          href: "/tarifs/t1",
        },
        {
          t: "Travailleur autonome (T1 Canada / Québec)",
          p: "à partir de 150 $",
          pts: [
            "Revenus d’entreprise / travail autonome",
            "Dépenses admissibles",
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

      // FAQ
      faqTitle: "FAQ",
      faq: [
        {
          q: "Comment je vous envoie mes documents?",
          a: "Après la création du compte, vous avez un portail sécurisé pour téléverser vos pièces (photos, PDF, relevés bancaires, etc.). Aucune impression papier nécessaire.",
        },
        {
          q: "Quels documents avez-vous besoin?",
          a: "T4/Relevé 1, feuillets de revenu (REER, intérêts, placements, prestations), reçus de dépenses d’entreprise, états financiers si société, et toute lettre de l’ARC / Revenu Québec.",
        },
        {
          q: "Combien de temps ça prend?",
          a: "En période normale : environ 3 à 7 jours ouvrables après réception de tous les documents. En haute saison (mars-avril), les dossiers incomplets peuvent prendre plus longtemps.",
        },
        {
          q: "Comment se fait le paiement?",
          a: "Acompte (100 $ pour T1 / 400 $ pour T2). Le solde est payable quand la déclaration est prête, avant l’envoi officiel. Paiement par Interac ou carte (lien sécurisé).",
        },
      ],

      // CONTACT
      contactTitle: "Contact",
      contactHint: "Vous pouvez aussi nous écrire directement à",
      send: "Envoyer",

      // divers
      langLabel: "Langue",
      footerLinks: {
        services: "Services",
        pricing: "Tarifs",
        contact: "Contact",
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

      // HERO
      ctaMain: "Get started today",
      heroTitle: (
        <>
          Personal and corporate tax filing across Canada{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>
            (including Québec)
          </span>{" "}
          with{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "We prepare and file personal T1 returns and self-employed T1 returns for clients anywhere in Canada, including Québec. We also file corporate T2 returns for incorporated businesses in every province. If you're in Québec, we also prepare and file the CO-17. Secure portal, human review, CRA compliant.",

      chooseType: "Choose your return type",
      t1Title: "Personal income tax (T1 Canada, including Québec)",
      t1Desc:
        "Employee, student, retired. We file your federal T1 with the CRA, and if you live in Québec we also file the Québec provincial return.",
      t1Btn: "Start T1",
      autoTitle:
        "Self-employed / small business (T1 Canada, including Québec)",
      autoDesc:
        "Freelancer, contractor, delivery driver, subcontractor. We include your business income and expenses. Federal (CRA) + Québec if required.",
      autoBtn: "Start self-employed T1",
      t2Title: "Corporate income tax (T2 anywhere in Canada)",
      t2Desc:
        "Incorporated business in any province. We file the federal T2 to the CRA and any required provincial corporate return. In Québec: T2 + CO-17 handled.",
      t2Btn: "Start T2",

      // SERVICES
      servicesTitle: "Services",
      servicesSub:
        "Personal, self-employed, and corporate tax filing anywhere in Canada.",
      services: [
        {
          t: "Personal T1 returns (Canada & Québec)",
          d: "We prepare your federal CRA return and, if you are a Québec resident, we also file your Québec provincial return.",
        },
        {
          t: "Self-employed and gig workers (Canada & Québec)",
          d: "Business income, deductible expenses, GST/QST considerations. Federal CRA filing and Québec if applicable.",
        },
        {
          t: "Corporate tax (T2 across Canada)",
          d: "We file T2 for incorporated businesses in all provinces. Québec clients also get CO-17 prepared and filed.",
        },
        {
          t: "Secure document portal",
          d: "Upload T4/Relevé 1, invoices, bank statements, receipts, financial statements — all in one place.",
        },
        {
          t: "Tax optimization & support",
          d: "We check credits, deductions, RRSP strategy, business expenses, and small business deductions before filing.",
        },
      ],

      // STEPS
      stepsTitle: "How it works (4 simple steps)",
      steps: [
        {
          n: "1",
          t: "Create your account",
          d: "We set up your secure client portal.",
        },
        {
          n: "2",
          t: "Upload your documents",
          d: "Slips, receipts, statements, financials — PDF or photo.",
        },
        {
          n: "3",
          t: "Review & approve",
          d: "We prepare your return(s). You approve before we file.",
        },
        {
          n: "4",
          t: "We file for you",
          d: "We submit to the CRA (federal) and to Revenu Québec if required. You get confirmation.",
        },
      ],

      // PRICING
      pricingTitle: "Pricing 2025",
      pricingSub:
        "These are starting prices. Complex cases (rental income, multiple businesses, bookkeeping cleanup, corporate structure, etc.) may affect the final quote. We always confirm the total before filing.",
      plans: [
        {
          t: "Personal tax (T1 Canada / Québec)",
          p: "from $100",
          pts: [
            "T4 / Relevé 1",
            "Basic deductions & credits",
            "Federal (CRA) + Québec if needed",
            "Secure client portal",
            "Initial deposit $100",
          ],
          href: "/tarifs/t1",
        },
        {
          t: "Self-employed / small business (T1 Canada / Québec)",
          p: "from $150",
          pts: [
            "Business / self-employment income",
            "Expense deductions",
            "RRSP / deduction optimization",
            "Federal (CRA) + Québec if needed",
            "Initial deposit $100",
          ],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Incorporated business (T2 anywhere in Canada)",
          p: "from $850",
          pts: [
            "Corporate T2 return (CRA federal)",
            "Provincial filing where required",
            "In Québec: CO-17 included",
            "Financial statements / balance sheet / P&L",
            "Initial deposit $400",
            "No revenue corporation? from $450",
          ],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "See details",

      // FAQ
      faqTitle: "FAQ",
      faq: [
        {
          q: "How do I send documents?",
          a: "After you create your account, you’ll have a secure portal to upload photos or PDFs (slips, receipts, bank statements, financial statements, etc.). No printing required.",
        },
        {
          q: "What documents do you need?",
          a: "T4 / Relevé 1, income slips (RRSP, investments, benefits), deductible business expenses, financial statements if you have a corporation, and any CRA / Revenu Québec letters.",
        },
        {
          q: "How long does it take?",
          a: "Typical turnaround is about 3–7 business days once we receive complete information. During peak season (March–April), incomplete files may take longer.",
        },
        {
          q: "How do I pay?",
          a: "We request a deposit ($100 for T1 / $400 for T2). The balance is due once the return is ready, before we file. You can pay by Interac e-Transfer or by card using a secure link.",
        },
      ],

      // CONTACT
      contactTitle: "Contact",
      contactHint: "You can also write to",
      send: "Send",

      // misc
      langLabel: "Language",
      footerLinks: {
        services: "Services",
        pricing: "Pricing",
        contact: "Contact",
      },
    },

    es: {
      brand: "ComptaNet Québec",
      nav: {
        services: "Servicios",
        steps: "Pasos",
        pricing: "Tarifas",
        faq: "FAQ",
        contact: "Contacto",
        client: "Espacio cliente",
      },

      // HERO
      ctaMain: "Empieza hoy",
      heroTitle: (
        <>
          Declaración de impuestos personal y corporativa en todo Canadá{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>
            (incluyendo Québec)
          </span>{" "}
          con{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Preparamos y presentamos declaraciones T1 para personas y trabajadores autónomos en cualquier provincia de Canadá, incluyendo Québec. También hacemos declaraciones corporativas T2 para sociedades incorporadas en todo el país. En Québec también preparamos y enviamos la CO-17. Portal seguro, revisión humana, cumplimiento con la CRA.",

      chooseType: "Elija el tipo de declaración",
      t1Title: "Impuesto personal (T1 Canadá, incluyendo Québec)",
      t1Desc:
        "Empleado, estudiante, jubilado. Presentamos su declaración federal ante la CRA y, si reside en Québec, también la declaración provincial de Québec.",
      t1Btn: "Empezar T1",
      autoTitle:
        "Autónomo / pequeño negocio (T1 Canadá, incluyendo Québec)",
      autoDesc:
        "Freelancer, contratista, repartidor, subcontratista. Incluimos ingresos de negocio y gastos deducibles. Federal (CRA) + Québec si aplica.",
      autoBtn: "T1 Autónomo",
      t2Title: "Impuesto corporativo (T2 en todo Canadá)",
      t2Desc:
        "Sociedad incorporada en cualquier provincia. Preparamos la T2 federal para la CRA y la declaración corporativa provincial que se requiera. En Québec: T2 + CO-17.",
      t2Btn: "Empezar T2",

      // SERVICES
      servicesTitle: "Servicios",
      servicesSub:
        "Impuestos personales, autónomos y corporativos para todas las provincias de Canadá.",
      services: [
        {
          t: "Declaraciones T1 personales (Canadá y Québec)",
          d: "Preparamos la declaración federal para la CRA y, si vive en Québec, también la declaración provincial de Québec.",
        },
        {
          t: "Trabajadores autónomos / gig (Canadá y Québec)",
          d: "Ingresos de negocio, gastos deducibles, estrategia fiscal. Incluye federal y Québec si corresponde.",
        },
        {
          t: "Impuesto corporativo T2 (todas las provincias)",
          d: "Declaración de sociedades incorporadas en todo Canadá. En Québec también preparamos la CO-17.",
        },
        {
          t: "Portal seguro de documentos",
          d: "Suba T4 / Relevé 1, facturas, extractos bancarios y estados financieros de forma segura.",
        },
        {
          t: "Optimización fiscal y soporte",
          d: "Revisamos créditos, deducciones, gastos de negocio y planificación RRSP antes de enviar.",
        },
      ],

      // STEPS
      stepsTitle: "Cómo funciona (4 pasos)",
      steps: [
        {
          n: "1",
          t: "Cree su cuenta",
          d: "Le damos acceso a su portal seguro.",
        },
        {
          n: "2",
          t: "Suba sus documentos",
          d: "PDF o foto (T4, Relevé 1, facturas, extractos bancarios, estados financieros…).",
        },
        {
          n: "3",
          t: "Revisión y aprobación",
          d: "Preparamos su declaración. Usted la aprueba antes del envío.",
        },
        {
          n: "4",
          t: "Envío oficial",
          d: "Enviamos a la CRA (federal) y a Revenu Québec cuando aplica. Recibe confirmación.",
        },
      ],

      // PRICING
      pricingTitle: "Tarifas 2025",
      pricingSub:
        "Precios iniciales. Casos más complejos (rentas, varios negocios, contabilidad pendiente, estructura corporativa, etc.) pueden ajustar el precio final. Siempre confirmamos el monto ANTES de enviar.",
      plans: [
        {
          t: "Impuesto personal (T1 Canadá / Québec)",
          p: "desde $100",
          pts: [
            "T4 / Relevé 1",
            "Créditos y deducciones básicas",
            "Federal (CRA) + Québec si aplica",
            "Portal seguro",
            "Depósito inicial $100",
          ],
          href: "/tarifs/t1",
        },
        {
          t: "Autónomos / pequeño negocio (T1 Canadá / Québec)",
          p: "desde $150",
          pts: [
            "Ingresos de negocio / autónomo",
            "Gastos deducibles",
            "Optimización RRSP / deducciones",
            "Federal (CRA) + Québec si aplica",
            "Depósito inicial $100",
          ],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Sociedades incorporadas (T2 en todo Canadá)",
          p: "desde $850",
          pts: [
            "Declaración corporativa T2 (CRA, nivel federal)",
            "Declaración provincial según la provincia",
            "En Québec: CO-17 incluida",
            "Estados financieros / balance / resultados",
            "Depósito inicial $400",
            "Sin ingresos? desde $450",
          ],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "Ver detalles",

      // FAQ
      faqTitle: "FAQ",
      faq: [
        {
          q: "¿Cómo envío mis documentos?",
          a: "Al crear su cuenta obtiene un portal seguro para subir fotos o PDF (recibos, T4 / Relevé 1, estados bancarios, estados financieros, etc.). No necesita imprimir.",
        },
        {
          q: "¿Qué documentos necesitan?",
          a: "T4/Relevé 1, comprobantes de ingresos (RRSP, inversiones, prestaciones), gastos deducibles del negocio, estados financieros de la sociedad y cualquier carta de la CRA / Revenu Québec.",
        },
        {
          q: "¿Cuánto demora?",
          a: "Normalmente entre 3 y 7 días hábiles después de recibir toda la información. En temporada alta (marzo-abril), los expedientes incompletos pueden tardar más.",
        },
        {
          q: "¿Cómo pago?",
          a: "Pedimos un depósito ($100 T1 / $400 T2). El saldo se paga cuando la declaración está lista, antes del envío oficial. Puede pagar por Interac o tarjeta (enlace seguro).",
        },
      ],

      // CONTACT
      contactTitle: "Contacto",
      contactHint: "También puede escribirnos a",
      send: "Enviar",

      // misc
      langLabel: "Idioma",
      footerLinks: {
        services: "Servicios",
        pricing: "Tarifas",
        contact: "Contacto",
      },
    },
  }[lang];

  // redirections sécurisées vers l'espace client avec le "next"
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
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      );
    }
    return (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
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
              }}
              aria-pressed={l === lang}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
    );
  };

  return (
    <main style={{ fontFamily: "Arial, sans-serif", color: "#1f2937" }}>
      {/* petit reset responsive */}
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
          {/* Logo + marque */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 160,
            }}
          >
            <Image
              src="/logo-cq.png"
              alt="Logo ComptaNet Québec"
              width={36}
              height={36}
              style={{ borderRadius: 6 }}
              priority
            />
            <strong style={{ color: bleu, whiteSpace: "nowrap" }}>
              {T.brand}
            </strong>
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
            <a
              href="#services"
              style={{
                textDecoration: "none",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {T.nav.services}
            </a>
            <a
              href="#etapes"
              style={{
                textDecoration: "none",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {T.nav.steps}
            </a>
            <a
              href="#tarifs"
              style={{
                textDecoration: "none",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {T.nav.pricing}
            </a>
            <a
              href="#faq"
              style={{
                textDecoration: "none",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {T.nav.faq}
            </a>
            <a
              href="#contact"
              style={{
                textDecoration: "none",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {T.nav.contact}
            </a>

            <Link
              href="/espace-client"
              style={{
                textDecoration: "none",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
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
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: isMobile ? 520 : 600,
          overflow: "hidden",
        }}
      >
        {/* image de fond */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="/banniere.png"
            alt="Bannière"
            fill
            style={{ objectFit: "cover" }}
            priority
            sizes="100vw"
          />
        </div>

        {/* contenu du bloc blanc par-dessus */}
        <div
          style={{
            position: "relative",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 16,
            minHeight: isMobile ? 520 : 600,
          }}
        >
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
            {/* titre */}
            <h1
              style={{
                fontSize: "clamp(22px, 6vw, 36px)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {T.heroTitle}
            </h1>

            {/* sous-titre */}
            <p
              style={{
                marginTop: 14,
                color: "#4b5563",
                fontSize: "clamp(14px, 3.6vw, 18px)",
              }}
            >
              {T.heroSub}
            </p>

            {/* boutons CTA généraux */}
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
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
                href="/espace-client"
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

            {/* bloc : choix de type d'impôt */}
            <div
              style={{
                marginTop: 28,
                textAlign: "left",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "16px 16px 20px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#1f2937",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {T.chooseType}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(auto-fit,minmax(200px,1fr))",
                }}
              >
                <TaxChoiceCard
                  title={T.t1Title}
                  desc={T.t1Desc}
                  btn={T.t1Btn}
                  href={toT1}
                  bleu={bleu}
                />
                <TaxChoiceCard
                  title={T.autoTitle}
                  desc={T.autoDesc}
                  btn={T.autoBtn}
                  href={toT1Auto}
                  bleu={bleu}
                />
                <TaxChoiceCard
                  title={T.t2Title}
                  desc={T.t2Desc}
                  btn={T.t2Btn}
                  href={toT2}
                  bleu={bleu}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        style={{
          maxWidth: 1100,
          margin: "60px auto",
          padding: "0 16px",
        }}
      >
        <h2 style={{ color: bleu, marginBottom: 12 }}>{T.servicesTitle}</h2>
        <p style={{ color: "#4b5563", marginBottom: 22 }}>{T.servicesSub}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {T.services.map((svc, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 18,
                background: "white",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  color: "#111827",
                  fontSize: 18,
                }}
              >
                {svc.t}
              </h3>
              <p style={{ margin: 0, color: "#6b7280" }}>{svc.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ÉTAPES */}
      <section
        id="etapes"
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #eef2f7",
          borderBottom: "1px solid #eef2f7",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "50px 16px",
          }}
        >
          <h2 style={{ color: bleu, marginBottom: 20 }}>{T.stepsTitle}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {T.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 18,
                }}
              >
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
                <h3
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: 18,
                  }}
                >
                  {step.t}
                </h3>
                <p style={{ margin: 0, color: "#6b7280" }}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section
        id="tarifs"
        style={{
          maxWidth: 1100,
          margin: "60px auto",
          padding: "0 16px",
        }}
      >
        <h2 style={{ color: bleu, marginBottom: 12 }}>{T.pricingTitle}</h2>
        <p style={{ color: "#4b5563", marginBottom: 20 }}>{T.pricingSub}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {T.plans.map((plan, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 20,
                background: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>{plan.t}</h3>

              <div
                style={{
                  color: bleu,
                  fontWeight: 800,
                  fontSize: 20,
                  margin: "8px 0 12px",
                }}
              >
                {plan.p}
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: "#6b7280",
                  fontSize: 14,
                  lineHeight: 1.45,
                }}
              >
                {plan.pts.map((pt, j) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={plan.href}
                  style={{
                    display: "inline-block",
                    background: bleu,
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {T.getPrice}
                </Link>

                <Link
                  href="/espace-client"
                  style={{
                    display: "inline-block",
                    border: `2px solid ${bleu}`,
                    color: bleu,
                    padding: "9px 16px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {T.nav.client}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        style={{
          maxWidth: 1100,
          margin: "60px auto",
          padding: "0 16px",
        }}
      >
        <h2 style={{ color: bleu, marginBottom: 16 }}>{T.faqTitle}</h2>
        <FAQ items={T.faq} />
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

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 18,
            background: "white",
            maxWidth: 700,
          }}
        >
          <form
            action="mailto:comptanetquebec@gmail.com"
            method="post"
            encType="text/plain"
          >
            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="Nom"
                placeholder={
                  lang === "fr"
                    ? "Votre nom"
                    : lang === "en"
                    ? "Your name"
                    : "Su nombre"
                }
                required
                style={inputStyle}
              />
              <input
                name="Courriel"
                placeholder={
                  lang === "fr"
                    ? "Votre courriel"
                    : lang === "en"
                    ? "Your email"
                    : "Su correo"
                }
                type="email"
                required
                style={inputStyle}
              />
              <textarea
                name="Message"
                placeholder={
                  lang === "fr"
                    ? "Comment pouvons-nous aider?"
                    : lang === "en"
                    ? "How can we help?"
                    : "¿Cómo podemos ayudar?"
                }
                rows={5}
                style={inputStyle}
              />
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
                {T.send}
              </button>
            </div>
          </form>

          <p style={{ color: "#6b7280", marginTop: 12, fontSize: 14 }}>
            {T.contactHint}{" "}
            <a href="mailto:comptanetquebec@gmail.com">
              comptanetquebec@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#0f172a",
          color: "#cbd5e1",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Image src="/logo-cq.png" alt="" width={28} height={28} />
            <span>© {new Date().getFullYear()} ComptaNet Québec</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              fontSize: 14,
            }}
          >
            <a
              href="#services"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {T.footerLinks.services}
            </a>
            <a
              href="#tarifs"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {T.footerLinks.pricing}
            </a>
            <a
              href="#contact"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {T.footerLinks.contact}
            </a>
            <Link
              href="/espace-client"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {T.nav.client}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

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
        minHeight: 150,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
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

/* --- style de base pour les inputs du formulaire contact --- */
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
};
