"use client";

import React from "react";

export default function AvisLegalPage() {
  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const NEQ = "1175912972";
  const MARQUE = "ComptaNet Québec";

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 16px 80px",
        }}
      >
        <h1
          style={{
            color: bleu,
            fontSize: "clamp(24px,2vw,32px)",
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Avis légal
        </h1>

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          Dernière mise à jour : {new Date().getFullYear()}
        </p>

        {/* IDENTITÉ LÉGALE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>1. Identité de l’entreprise</h2>

          <p style={pStyle}>
            <strong>{MARQUE}</strong> est une marque exploitée par{" "}
            <strong>{NOM_LEGAL}</strong>, entreprise incorporée au Québec.
          </p>

          <p style={pStyle}>
            <strong>NEQ :</strong> {NEQ}
          </p>

          <p style={pStyle}>
            Les services sont offerts principalement en ligne à l’ensemble des
            résidents et entreprises du Québec.
          </p>
        </section>

        {/* NON AFFILIATION */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>2. Nous ne sommes pas l’ARC ni Revenu Québec</h2>
          <p style={pStyle}>
            {MARQUE} est un service privé de préparation et de transmission de
            déclarations de revenus. Nous ne sommes pas l’Agence du revenu du
            Canada (ARC), Revenu Québec, ni aucun gouvernement provincial ou
            territorial.
          </p>
        </section>

        {/* RESPONSABILITÉ CLIENT */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>3. Information fournie par le client</h2>
          <p style={pStyle}>
            Les déclarations sont préparées à partir des informations et des
            documents transmis par le client. Le client demeure responsable de
            l’exactitude, de l’exhaustivité et de la véracité des informations
            fournies.
          </p>
          <p style={pStyle}>
            Toute omission ou erreur peut affecter les résultats fiscaux, les
            soldes à payer ou les pénalités applicables.
          </p>
        </section>

        {/* AUCUNE GARANTIE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>4. Aucune garantie de résultat fiscal</h2>
          <p style={pStyle}>
            Aucun remboursement spécifique ni montant d’impôt à payer ne peut
            être garanti. Les autorités fiscales conservent le pouvoir final
            d’acceptation ou de révision des déclarations.
          </p>
        </section>

        {/* DÉLAIS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>5. Délais de traitement</h2>
          <p style={pStyle}>
            Les délais de traitement sont fournis à titre indicatif seulement.
            Ils peuvent varier selon la période de l’année, la complexité du
            dossier et la complétude des documents transmis.
          </p>
        </section>

        {/* CONTACT */}
        <section>
          <h2 style={h2Style}>6. Contact</h2>
          <p style={pStyle}>
            Pour toute question concernant le présent avis légal :
          </p>
          <p style={pStyle}>
            <a href="mailto:comptanetquebec@gmail.com">
              comptanetquebec@gmail.com
            </a>
          </p>
        </section>
      </section>
    </main>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: "18px",
  color: "#111827",
  fontWeight: 600,
  marginBottom: 8,
  lineHeight: 1.3,
};

const pStyle: React.CSSProperties = {
  color: "#4b5563",
  fontSize: 14,
  lineHeight: 1.5,
  margin: 0,
  marginBottom: 12,
};
