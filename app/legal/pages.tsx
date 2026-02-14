"use client";

import React from "react";

export default function ConfidentialitePage() {
  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const MARQUE = "ComptaNet Québec";
  const NEQ = "1175912972";

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "0 16px 80px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        lineHeight: 1.6,
      }}
    >
      <h1
        style={{
          fontSize: "30px",
          fontWeight: 800,
          marginBottom: "18px",
          color: "#0f172a",
          textAlign: "center",
        }}
      >
        Politique de confidentialité
      </h1>

      <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 28 }}>
        Dernière mise à jour : {new Date().getFullYear()}
      </p>

      {/* Identité */}
      <section
        style={{
          marginBottom: 28,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={h2Style}>Identité de l’entreprise</h2>
        <p style={pStyle}>
          <strong>{MARQUE}</strong> est une marque exploitée par{" "}
          <strong>{NOM_LEGAL}</strong>, entreprise incorporée au Québec.
        </p>
        <p style={pStyle}>
          <strong>NEQ :</strong> {NEQ}
        </p>
        <p style={{ ...pStyle, marginBottom: 0 }}>
          Pour toute question relative à la confidentialité :{" "}
          <a href="mailto:comptanetquebec@gmail.com" style={linkStyle}>
            comptanetquebec@gmail.com
          </a>
        </p>
      </section>

      {/* 1 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>1. Portée</h2>
        <p style={pStyle}>
          La présente politique explique comment nous recueillons, utilisons,
          conservons et protégeons les renseignements personnels lorsque vous
          utilisez notre site, notre portail client sécurisé et nos services de
          préparation de déclarations de revenus.
        </p>
        <p style={pStyle}>
          Nous visons à respecter les lois applicables au Québec et au Canada en
          matière de protection des renseignements personnels.
        </p>
      </section>

      {/* 2 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>2. Renseignements collectés</h2>
        <p style={pStyle}>
          Selon votre situation, nous pouvons recueillir des renseignements tels
          que :
        </p>
        <ul style={ulStyle}>
          <li>Nom, coordonnées (courriel, téléphone), informations d’identification;</li>
          <li>Documents fiscaux (ex. T4, Relevé 1, feuillets, relevés);</li>
          <li>Informations de revenus et dépenses (ex. travail autonome);</li>
          <li>Informations d’entreprise (ex. société incorporée, T2/CO-17);</li>
          <li>Messages et pièces transmises via le portail (photo/PDF).</li>
        </ul>
      </section>

      {/* 3 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>3. Utilisation des renseignements</h2>
        <p style={pStyle}>
          Nous utilisons ces renseignements uniquement pour :
        </p>
        <ul style={ulStyle}>
          <li>Ouvrir votre dossier et communiquer avec vous;</li>
          <li>Préparer vos déclarations (T1, travailleur autonome, T2/CO-17) selon les documents fournis;</li>
          <li>Transmettre les déclarations électroniquement lorsque applicable (ex. TED);</li>
          <li>Répondre à vos questions et fournir du support;</li>
          <li>Respecter nos obligations légales et comptables.</li>
        </ul>
        <p style={pStyle}>
          Nous ne vendons pas et ne louons pas vos renseignements personnels.
        </p>
      </section>

      {/* 4 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>4. Partage avec des tiers</h2>
        <p style={pStyle}>
          Nous pouvons partager certains renseignements uniquement lorsque
          nécessaire pour offrir le service, par exemple :
        </p>
        <ul style={ulStyle}>
          <li>Prestataire de paiement (ex. Stripe) pour traiter les paiements;</li>
          <li>Fournisseurs techniques nécessaires au fonctionnement du portail sécurisé;</li>
          <li>Autorités fiscales (ARC / Revenu Québec) lors de la transmission, selon votre autorisation.</li>
        </ul>
        <p style={pStyle}>
          Nous ne partageons pas vos données à des fins commerciales.
        </p>
      </section>

      {/* 5 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>5. Sécurité</h2>
        <p style={pStyle}>
          Nous appliquons des mesures raisonnables de sécurité pour protéger vos
          renseignements (ex. accès contrôlé au portail, mesures techniques et
          organisationnelles). Aucun système n’étant infaillible, un risque
          résiduel demeure malgré les précautions prises.
        </p>
        <p style={pStyle}>
          Pour limiter les abus, notre formulaire de contact peut utiliser un
          mécanisme anti-robot (ex. reCAPTCHA).
        </p>
      </section>

      {/* 6 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>6. Conservation</h2>
        <p style={pStyle}>
          Nous conservons les renseignements pour la durée nécessaire à la
          prestation des services et pour respecter nos obligations légales.
          À titre indicatif, certains documents fiscaux peuvent devoir être
          conservés pendant plusieurs années (souvent jusqu’à 6 ans), selon les
          exigences applicables.
        </p>
      </section>

      {/* 7 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>7. Vos droits</h2>
        <p style={pStyle}>
          Vous pouvez demander l’accès à vos renseignements personnels, la
          correction d’informations inexactes, ou la suppression de certains
          renseignements, sous réserve des obligations légales de conservation.
        </p>
        <p style={pStyle}>
          Pour faire une demande, écrivez à{" "}
          <a href="mailto:comptanetquebec@gmail.com" style={linkStyle}>
            comptanetquebec@gmail.com
          </a>
          .
        </p>
      </section>

      {/* 8 */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={h2Style}>8. Liens vers d’autres pages</h2>
        <p style={pStyle}>
          Pour plus d’informations, consultez aussi nos pages :
        </p>
        <ul style={ulStyle}>
          <li>Conditions d’utilisation</li>
          <li>Avis légal</li>
        </ul>
        <p style={pStyle}>
          (Vous pouvez placer ici des liens internes vers tes routes Next.js.)
        </p>
      </section>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 13, color: "#6b7280" }}>
        {NOM_LEGAL} — NEQ : {NEQ}
      </p>
    </main>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 10,
  color: "#004aad",
};

const pStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 12,
  color: "#1f2937",
};

const linkStyle: React.CSSProperties = {
  color: "#004aad",
  fontWeight: 700,
  textDecoration: "none",
};

const ulStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  paddingLeft: 20,
  color: "#1f2937",
};
