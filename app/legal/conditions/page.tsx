"use client";

import React from "react";

export default function ConditionsPage() {
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
          Conditions d’utilisation
        </h1>

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          Dernière mise à jour : {new Date().getFullYear()}
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>1. Acceptation</h2>
          <p style={pStyle}>
            En utilisant notre site, notre portail sécurisé ou nos services,
            vous acceptez ces conditions d’utilisation. Si vous n’êtes pas
            d’accord, veuillez ne pas utiliser nos services.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>2. Nature du service</h2>
          <p style={pStyle}>
            Nous préparons vos déclarations de revenus en fonction de
            l’information que vous nous fournissez. Vous êtes responsable de
            l’exactitude et de l’exhaustivité de cette information.
          </p>
          <p style={pStyle}>
            Nous ne garantissons pas un remboursement donné, ni un résultat
            fiscal particulier. Toute estimation fournie reste une estimation.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>3. Accès au portail</h2>
          <p style={pStyle}>
            Vous acceptez de ne pas partager votre accès au portail client avec
            une tierce personne non autorisée. Vous êtes responsable de la
            confidentialité de vos identifiants.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>4. Paiement</h2>
          <p style={pStyle}>
            Des dépôts initiaux peuvent être exigés (par exemple 100 $ pour T1,
            400 $ pour T2). Le solde doit être payé avant la transmission
            officielle de vos déclarations.
          </p>
          <p style={pStyle}>
            Les frais finaux peuvent varier selon la complexité du dossier
            (multi-revenus, tenue de livres manquante, etc.). Le montant est
            toujours confirmé avant l’envoi.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>5. Utilisation acceptable</h2>
          <p style={pStyle}>
            Vous acceptez de ne pas utiliser nos services pour toute activité
            frauduleuse, illégale ou trompeuse auprès des autorités fiscales.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>6. Limitation de service</h2>
          <p style={pStyle}>
            Nous pouvons refuser ou interrompre un mandat si l’information
            fournie est incomplète, incohérente ou manifestement inexacte, ou si
            la collaboration devient impossible.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>7. Droit applicable</h2>
          <p style={pStyle}>
            Ces conditions sont régies par les lois applicables au Québec et au
            Canada. Tout litige devra être traité dans cette juridiction.
          </p>
        </section>

        <section>
          <h2 style={h2Style}>8. Contact</h2>
          <p style={pStyle}>
            Pour toute question sur ces conditions :{" "}
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
