"use client";

import React from "react";

export default function AvisLegalPage() {
  const bleu = "#004aad";

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

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>1. Nous ne sommes pas l’ARC ni Revenu Québec</h2>
          <p style={pStyle}>
            ComptaNet Québec est un service privé de préparation et de
            transmission de déclarations de revenus. Nous ne sommes pas
            l’Agence du revenu du Canada (ARC), Revenu Québec, ni aucun
            gouvernement provincial ou territorial.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>2. Information fournie par le client</h2>
          <p style={pStyle}>
            Vos déclarations sont préparées à partir des informations et des
            documents que vous nous transmettez. Vous demeurez responsable de
            l’exactitude, de l’exhaustivité et de la véracité de ces
            informations.
          </p>
          <p style={pStyle}>
            Toute omission, erreur ou oubli dans les informations fournies peut
            affecter votre résultat fiscal, vos soldes à payer ou vos pénalités.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>3. Aucune garantie de résultat fiscal</h2>
          <p style={pStyle}>
            Nous ne garantissons pas un remboursement spécifique, un montant
            d’impôt à payer spécifique, ni l’acceptation automatique d’une
            déduction ou d’un crédit fiscal. Les autorités fiscales ont toujours
            le dernier mot.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>4. Délais de traitement</h2>
          <p style={pStyle}>
            Les délais indiqués (ex. quelques jours ouvrables) sont des délais
            habituels et non garantis. En haute saison ou si votre dossier est
            incomplet, le traitement peut être plus long.
          </p>
        </section>

        <section>
          <h2 style={h2Style}>5. Contact</h2>
          <p style={pStyle}>
            Pour toute question concernant cet avis légal :{" "}
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
