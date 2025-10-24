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
          Déclarez vos revenus en ligne facilement et rapidement avec{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Service professionnel pour vos impôts personnels partout au Canada, incluant le Québec, ainsi que vos déclarations de société (t2). Sécurisé, rapie et géré par des spécialistes fiscaux.",

      chooseType: "Choisissez votre type d’impôt",
      t1Title: "Impôt des particuliers (T1 Québec et Canada)",
      t1Desc:
        "Salarié, étudiant, retraité, etc. Déclaration fédérale + Québec.",
      t1Btn: "Commencer T1",
      autoTitle: "Travailleur autonome (T1 Québec et Canada)",
      autoDesc:
        "Travailleur autonome, livreur, pigiste, sous-traitant. Fédéral + Québec.",
      autoBtn: "T1 travailleur autonome",
      t2Title: "Impôt des sociétés (T2 Québec et Canada)",
      t2Desc:
        "Société incorporée, partout au Canada. Déclaration fédérale T2 (et Québec si applicable).",
      t2Btn: "Commencer T2",

      // SERVICES
      servicesTitle: "Services",
      servicesSub:
        "On s’occupe de l’essentiel pour que vous restiez conforme, sans casse-tête.",
      services: [
        {
          t: "Déclarations T1 Québec et Canada",
          d: "Particuliers et travailleurs autonomes : Revenu Canada (fédéral) et Revenu Québec.",
        },
        {
          t: "Déclarations T2 Canada",
          d: "Sociétés incorporées partout au Canada. On prépare le fédéral (ARC) et la déclaration provinciale requise. Au Québec : T2 + CO-17.",
        },
        {
          t: "Organisation de documents",
          d: "Espace sécurisé pour déposer vos T4/Relevé 1, dépenses, reçus, états financiers, etc.",
        },
        {
          t: "Support et optimisation",
          d: "Nous vérifions les crédits, déductions et dépenses admissibles pour réduire l’impôt.",
        },
      ],

      // ÉTAPES
      stepsTitle: "Comment ça marche (4 étapes simples)",
      steps: [
        {
          n: "1",
          t: "Créez votre compte",
          d: "On vous ouvre un espace sécurisé.",
        },
        {
          n: "2",
          t: "Téléversez vos documents",
          d: "Photos ou PDF (T4, relevés, factures, relevé bancaire, états financiers…).",
        },
        {
          n: "3",
          t: "Révision & approbation",
          d: "On prépare vos impôts. Vous validez avant l’envoi.",
        },
        {
          n: "4",
          t: "Transmission officielle",
          d: "On transmet à l’ARC (Canada) et à Revenu Québec si applicable. Vous recevez la confirmation.",
        },
      ],

      // TARIFS
      pricingTitle: "Tarifs 2025",
      pricingSub:
        "Exemples de base. Les cas plus complexes (plusieurs revenus, biens locatifs, déductions spéciales, états financiers détaillés, etc.) peuvent ajuster le prix. Nous confirmons toujours le montant avant de transmettre.",
      plans: [
        {
          t: "Impôt des particuliers (T1 Québec)",
          p: "à partir de 100 $",
          pts: [
            "T4 / Relevé 1",
            "Crédits et déductions de base",
            "Fédéral + Québec inclus",
            "Dépôt client sécurisé",
            "Acompte initial 100 $",
          ],
          href: "/tarifs/t1",
        },
        {
          t: "Travailleur autonome (T1 Québec)",
          p: "à partir de 150 $",
          pts: [
            "Revenus d’entreprise / travail autonome",
            "Dépenses admissibles",
            "Optimisation REER / déductions",
            "Fédéral + Québec inclus",
            "Acompte initial 100 $",
          ],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Sociétés incorporées (T2 Canada)",
          p: "à partir de 850 $",
          pts: [
            "Déclaration T2 fédérale (ARC) pour sociétés canadiennes",
            "Déclaration provinciale requise selon la province",
            "Au Québec : CO-17 incluse",
            "États financiers / Bilan / Résultats",
            "Acompte initial 400 $",
            "Sans revenus? À partir de 450 $",
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
          a: "Après la création du compte, vous avez un espace sécurisé pour téléverser vos pièces (photos, PDF, relevés bancaires, etc.). Plus besoin d’imprimer.",
        },
        {
          q: "Quels documents avez-vous besoin?",
          a: "T4/Relevé 1, feuillets de revenus (REER, intérêts, placements, prestations), reçus de dépenses, états financiers si société, et toute lettre de l’ARC/Revenu Québec.",
        },
        {
          q: "Combien de temps ça prend?",
          a: "En période normale : 3 à 7 jours ouvrables après réception des documents complets. En très haute saison (mars-avril), certains dossiers peuvent prendre plus longtemps si incomplets.",
        },
        {
          q: "Comment se fait le paiement?",
          a: "On demande un acompte (100 $ pour T1 / 400 $ pour T2). Le solde est payé une fois la déclaration prête, avant l’envoi officiel. Paiement par virement Interac ou carte (lien sécurisé).",
        },
      ],

      // CONTACT
      contactTitle: "Contact",
      contactHint:
        "Vous pouvez aussi nous écrire directement à",
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

      ctaMain: "Get started today",
      heroTitle: (
        <>
          File your taxes online quickly and securely with{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Professional tax filing for Quebec residents (T1 personal & self-employed) and corporate returns (T2) across Canada. Secure upload, human review, full compliance.",

      chooseType: "Choose your return type",
      t1Title: "Personal income tax (T1 Québec)",
      t1Desc:
        "Employee, student, retired. Federal + Québec personal tax return.",
      t1Btn: "Start T1",
      autoTitle: "Self-employed (T1 Québec)",
      autoDesc:
        "Freelancer, contractor, delivery driver. Federal + Québec self-employed taxes.",
      autoBtn: "Start self-employed T1",
      t2Title: "Corporate tax (T2 Canada)",
      t2Desc:
        "Incorporated business anywhere in Canada. We handle the federal T2 and provincial filing where required. In Québec, we also handle the provincial CO-17.",
      t2Btn: "Start T2",

      servicesTitle: "Services",
      servicesSub:
        "We handle the essentials so you stay compliant and stress-free.",
      services: [
        {
          t: "T1 Québec (personal & self-employed)",
          d: "We prepare and file both federal (CRA) and Québec returns.",
        },
        {
          t: "T2 Canada (corporations)",
          d: "We file corporate T2 for companies across Canada. In Québec, we also prepare and file the CO-17.",
        },
        {
          t: "Document portal",
          d: "Secure portal to upload receipts, slips, bank statements, financial statements.",
        },
        {
          t: "Optimization & support",
          d: "We review deductions, business expenses, RRSP strategy, and credits before filing.",
        },
      ],

      stepsTitle: "How it works (4 simple steps)",
      steps: [
        {
          n: "1",
          t: "Create your account",
          d: "We set up your secure portal.",
        },
        {
          n: "2",
          t: "Upload your documents",
          d: "Slips, receipts, statements, financials — PDF or photo.",
        },
        {
          n: "3",
          t: "Review & approve",
          d: "We prepare your returns. You approve before submission.",
        },
        {
          n: "4",
          t: "We file for you",
          d: "We e-file to CRA (federal) and the province (for Québec we file both levels). You get confirmation.",
        },
      ],

      pricingTitle: "Pricing 2025",
      pricingSub:
        "Starting prices. More complex cases (rental income, multiple businesses, complex corporate structure, etc.) may change the final quote. We always confirm the total before filing.",
      plans: [
        {
          t: "Personal tax (T1 Québec)",
          p: "from $100",
          pts: [
            "Employment slips (T4 / Relevé 1)",
            "Basic deductions & credits",
            "Federal + Québec filing included",
            "Secure client portal",
            "Initial deposit $100",
          ],
          href: "/tarifs/t1",
        },
        {
          t: "Self-employed (T1 Québec)",
          p: "from $150",
          pts: [
            "Business/self-employment income",
            "Expense deductions",
            "RRSP / deduction optimization",
            "Federal + Québec filing included",
            "Initial deposit $100",
          ],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Incorporated business (T2 Canada)",
          p: "from $850",
          pts: [
            "Corporate T2 (CRA federal) anywhere in Canada",
            "Provincial corporate filing where required",
            "In Québec: T2 + CO-17 handled",
            "Financial statements / balance sheet / P&L",
            "Initial deposit $400",
            "No revenue corp? from $450",
          ],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "See details",

      faqTitle: "FAQ",
      faq: [
        {
          q: "How do I send documents?",
          a: "After you create your account, you get a secure portal to upload photos or PDFs (slips, receipts, bank statements, financial statements, etc.).",
        },
        {
          q: "What documents do you need?",
          a: "T4/Relevé 1, income slips (RRSP, investment, benefits), deductible expense receipts, company financials, and any CRA / Revenu Québec notice.",
        },
        {
          q: "How long does it take?",
          a: "Typical turnaround is 3–7 business days once we have all documents. During peak (March–April), complex or incomplete files can take longer.",
        },
        {
          q: "How do I pay?",
          a: "We charge a deposit (100 $ for personal / self-employed, 400 $ for corporate). The balance is paid once everything is prepared, before we file. You can pay by Interac e-Transfer or card (secure link).",
        },
      ],

      contactTitle: "Contact",
      contactHint: "You can also write to",
      send: "Send",

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

      ctaMain: "Empieza hoy",
      heroTitle: (
        <>
          Declare sus impuestos en línea de forma segura con{" "}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Declaraciones personales de Québec (T1) y declaraciones corporativas T2 en todo Canadá. Portal seguro, revisión humana, envío oficial a las autoridades fiscales.",

      chooseType: "Elija el tipo de declaración",
      t1Title: "Impuesto personal (T1 Québec)",
      t1Desc:
        "Empleado, estudiante, jubilado. Declaración federal + Québec.",
      t1Btn: "Empezar T1",
      autoTitle: "Autónomo (T1 Québec)",
      autoDesc:
        "Freelancer, contratista, repartidor. Federal + Québec con gastos deducibles.",
      autoBtn: "T1 Autónomo",
      t2Title: "Impuesto corporativo (T2 Canadá)",
      t2Desc:
        "Sociedad incorporada en cualquier provincia canadiense. Declaración T2 federal + declaración provincial requerida. En Québec también CO-17.",
      t2Btn: "Empezar T2",

      servicesTitle: "Servicios",
      servicesSub:
        "Nos ocupamos de lo esencial para que esté conforme, sin complicaciones.",
      services: [
        {
          t: "T1 Québec (personal y autónomos)",
          d: "Preparamos y enviamos su declaración federal (CRA) y Québec.",
        },
        {
          t: "T2 Canadá (sociedades)",
          d: "Declaración corporativa T2 en todo Canadá. En Québec también la parte provincial (CO-17).",
        },
        {
          t: "Portal de documentos",
          d: "Suba recibos, resúmenes bancarios y estados financieros de forma segura.",
        },
        {
          t: "Soporte y optimización",
          d: "Revisamos deducciones, gastos y créditos antes del envío.",
        },
      ],

      stepsTitle: "Cómo funciona (4 pasos)",
      steps: [
        {
          n: "1",
          t: "Cree su cuenta",
          d: "Le damos acceso seguro.",
        },
        {
          n: "2",
          t: "Suba sus documentos",
          d: "PDF o fotos (recibos, T4, estados financieros…).",
        },
        {
          n: "3",
          t: "Revisión y aprobación",
          d: "Preparamos su declaración y usted la valida.",
        },
        {
          n: "4",
          t: "Envío oficial",
          d: "Enviamos a la CRA (federal) y a la provincia. En Québec, también Revenu Québec.",
        },
      ],

      pricingTitle: "Tarifas 2025",
      pricingSub:
        "Precios iniciales. Casos complejos (renta, múltiples negocios, estados financieros complejos, etc.) pueden cambiar el monto final. Siempre confirmamos antes del envío.",
      plans: [
        {
          t: "Impuesto personal (T1 Québec)",
          p: "desde $100",
          pts: [
            "T4 / Relevé 1",
            "Créditos básicos",
            "Federal + Québec incluidos",
            "Portal seguro",
            "Depósito inicial $100",
          ],
          href: "/tarifs/t1",
        },
        {
          t: "Autónomos (T1 Québec)",
          p: "desde $150",
          pts: [
            "Ingresos de negocio / autónomo",
            "Gastos deducibles",
            "Optimización RRSP / deducciones",
            "Federal + Québec incluidos",
            "Depósito inicial $100",
          ],
          href: "/tarifs/travailleur-autonome",
        },
        {
          t: "Sociedades (T2 Canadá)",
          p: "desde $850",
          pts: [
            "Declaración corporativa T2 (CRA federal) en todo Canadá",
            "Declaración provincial requerida según la provincia",
            "En Québec también CO-17",
            "Estados financieros / balance / resultados",
            "Depósito inicial $400",
            "Sin ingresos? desde $450",
          ],
          href: "/tarifs/t2",
        },
      ],
      getPrice: "Ver detalles",

      faqTitle: "FAQ",
      faq: [
        {
          q: "¿Cómo envío mis documentos?",
          a: "Al crear su cuenta obtiene un portal seguro para subir fotos o PDF (recibos, resúmenes bancarios, estados financieros, etc.).",
        },
        {
          q: "¿Qué documentos necesitan?",
          a: "T4/Relevé 1, comprobantes de ingresos (RRSP, inversiones, prestaciones), recibos de gastos, estados financieros de la empresa y cartas de CRA / Revenu Québec.",
        },
        {
          q: "¿Cuánto demora?",
          a: "Normalmente 3–7 días hábiles una vez que tenemos todos los documentos. En temporada alta (marzo-abril) los casos incompletos pueden tardar más.",
        },
        {
          q: "¿Cómo pago?",
          a: "Se pide un depósito (100 $ personal/autónomo, 400 $ sociedades). El saldo se paga cuando la declaración está lista, antes del envío oficial. Puede pagar por Interac o tarjeta (enlace seguro).",
        },
      ],

      contactTitle: "Contacto",
      contactHint: "También puede escribirnos a",
      send: "Enviar",

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
        <p style={{ color: "#4b5563", marginBottom: 20 }}>
          {T.pricingSub}
        </p>

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
                placeholder="Votre nom"
                required
                style={inputStyle}
              />
              <input
                name="Courriel"
                placeholder="Votre courriel"
                type="email"
                required
                style={inputStyle}
              />
              <textarea
                name="Message"
                placeholder="Comment pouvons-nous aider?"
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
