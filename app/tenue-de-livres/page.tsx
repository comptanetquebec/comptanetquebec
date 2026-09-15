"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lang = "fr" | "en" | "es";

export default function TenueDeLivresPage() {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("lang");

      if (value === "fr" || value === "en" || value === "es") {
        setLang(value);
      }
    } catch {
      setLang("fr");
    }
  }, []);

  const text = {
    fr: {
      title: "Tenue de livres",
      subtitle:
        "Gérez simplement vos revenus, vos dépenses, vos documents et vos taxes au même endroit.",
      year: "Année 2026",

      dashboard: "Tableau de bord",
      dashboardDesc:
        "Voyez rapidement la situation de votre entreprise.",

      income: "Revenus",
      incomeDesc:
        "Ajoutez et consultez vos revenus d’entreprise.",

      expenses: "Dépenses",
      expensesDesc:
        "Ajoutez vos dépenses et conservez vos pièces justificatives.",

      documents: "Documents",
      documentsDesc:
        "Téléversez vos factures, reçus, relevés et autres documents.",

      taxes: "TPS / TVQ",
      taxesDesc:
        "Suivez les taxes perçues et les crédits de taxes sur vos dépenses.",

      periods: "Périodes",
      periodsDesc:
        "Consultez vos périodes mensuelles, trimestrielles ou annuelles.",

      annual: "Résumé annuel",
      annualDesc:
        "Obtenez le résumé de vos revenus et dépenses pour votre déclaration d’impôt.",

      incomeTotal: "Revenus",
      expensesTotal: "Dépenses",
      profit: "Résultat",
      documentsTotal: "Documents",

      coming: "À configurer",
      back: "Retour à ComptaNet Québec",
    },

    en: {
      title: "Bookkeeping",
      subtitle:
        "Manage your business income, expenses, documents and taxes in one place.",
      year: "Year 2026",

      dashboard: "Dashboard",
      dashboardDesc:
        "Quickly view the financial activity of your business.",

      income: "Income",
      incomeDesc:
        "Add and review your business income.",

      expenses: "Expenses",
      expensesDesc:
        "Add expenses and keep your supporting documents.",

      documents: "Documents",
      documentsDesc:
        "Upload invoices, receipts, statements and other documents.",

      taxes: "GST / QST",
      taxesDesc:
        "Track taxes collected and input tax credits on expenses.",

      periods: "Periods",
      periodsDesc:
        "View monthly, quarterly or annual periods.",

      annual: "Annual summary",
      annualDesc:
        "Get your income and expense summary for your tax return.",

      incomeTotal: "Income",
      expensesTotal: "Expenses",
      profit: "Net result",
      documentsTotal: "Documents",

      coming: "To configure",
      back: "Back to ComptaNet Québec",
    },

    es: {
      title: "Contabilidad",
      subtitle:
        "Gestione sus ingresos, gastos, documentos e impuestos en un solo lugar.",
      year: "Año 2026",

      dashboard: "Panel",
      dashboardDesc:
        "Consulte rápidamente la actividad financiera de su empresa.",

      income: "Ingresos",
      incomeDesc:
        "Añada y consulte los ingresos de su empresa.",

      expenses: "Gastos",
      expensesDesc:
        "Añada sus gastos y conserve sus comprobantes.",

      documents: "Documentos",
      documentsDesc:
        "Suba facturas, recibos, estados de cuenta y otros documentos.",

      taxes: "GST / QST",
      taxesDesc:
        "Controle los impuestos cobrados y los créditos fiscales de sus gastos.",

      periods: "Períodos",
      periodsDesc:
        "Consulte períodos mensuales, trimestrales o anuales.",

      annual: "Resumen anual",
      annualDesc:
        "Obtenga el resumen de ingresos y gastos para su declaración de impuestos.",

      incomeTotal: "Ingresos",
      expensesTotal: "Gastos",
      profit: "Resultado",
      documentsTotal: "Documentos",

      coming: "Por configurar",
      back: "Volver a ComptaNet Québec",
    },
  }[lang];

  const cards = [
    {
      icon: "💰",
      title: text.income,
      desc: text.incomeDesc,
      href: "/tenue-de-livres/revenus",
    },
    {
      icon: "🧾",
      title: text.expenses,
      desc: text.expensesDesc,
      href: "/tenue-de-livres/depenses",
    },
    {
      icon: "📁",
      title: text.documents,
      desc: text.documentsDesc,
      href: "/tenue-de-livres/documents",
    },
    {
      icon: "🧮",
      title: text.taxes,
      desc: text.taxesDesc,
      href: "/tenue-de-livres/taxes",
    },
    {
      icon: "📅",
      title: text.periods,
      desc: text.periodsDesc,
      href: "/tenue-de-livres/periodes",
    },
    {
      icon: "📊",
      title: text.annual,
      desc: text.annualDesc,
      href: "/tenue-de-livres/resume-annuel",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        color: "#0f172a",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/?lang=${lang}`}
            style={{
              textDecoration: "none",
              color: "#0f172a",
              fontWeight: 900,
              fontSize: 19,
            }}
          >
            ComptaNet Québec
          </Link>

          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {(["fr", "en", "es"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                style={{
                  border:
                    lang === l
                      ? "1px solid #004aad"
                      : "1px solid #dbe3ef",
                  background: lang === l ? "#004aad" : "#ffffff",
                  color: lang === l ? "#ffffff" : "#334155",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 20px 60px",
        }}
      >
        {/* TITRE */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 26,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "#004aad",
                  fontWeight: 900,
                  marginBottom: 6,
                }}
              >
                💼 ComptaNet Québec
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(28px, 5vw, 42px)",
                }}
              >
                {text.title}
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "#64748b",
                  maxWidth: 700,
                  lineHeight: 1.5,
                }}
              >
                {text.subtitle}
              </p>
            </div>

            <div
              style={{
                background: "#eef6ff",
                border: "1px solid #cfe3ff",
                color: "#004aad",
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 900,
              }}
            >
              {text.year}
            </div>
          </div>
        </section>

        {/* RÉSUMÉ */}
        <section style={{ marginBottom: 28 }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 21,
            }}
          >
            {text.dashboard}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            <SummaryCard
              title={text.incomeTotal}
              value="0,00 $"
              icon="💰"
            />

            <SummaryCard
              title={text.expensesTotal}
              value="0,00 $"
              icon="🧾"
            />

            <SummaryCard
              title={text.profit}
              value="0,00 $"
              icon="📈"
            />

            <SummaryCard
              title={text.documentsTotal}
              value="0"
              icon="📁"
            />
          </div>
        </section>

        {/* MODULES */}
        <section>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 21,
            }}
          >
            {text.dashboard}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {cards.map((card) => (
              <Link
                key={card.href}
                href={`${card.href}?lang=${lang}`}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: 20,
                  textDecoration: "none",
                  color: "#0f172a",
                  minHeight: 155,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 14px rgba(15,23,42,.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 12,
                  }}
                >
                  {card.icon}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    marginBottom: 7,
                  }}
                >
                  {card.title}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {card.desc}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 14,
                    color: "#004aad",
                    fontWeight: 900,
                    fontSize: 14,
                  }}
                >
                  {text.coming} →
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: 30,
            textAlign: "center",
          }}
        >
          <Link
            href={`/?lang=${lang}`}
            style={{
              color: "#004aad",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← {text.back}
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: "#64748b",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {title}
        </span>

        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>

      <div
        style={{
          fontSize: 25,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}
