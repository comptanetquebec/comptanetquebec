"use client";

import React from "react";

export default function ConfidentialitePage() {
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
          Politique de confidentialité
        </h1>

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          Dernière mise à jour : {new Date().getFullYear()}
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>1. Qui nous sommes</h2>
          <p style={pStyle}>
            ComptaNet Québec offre des services de préparation et de
            transmission de déclarations de revenus personnelles (T1) et
            corporatives (T2) au Canada, incluant le Québec.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>2. Informations que nous recueillons</h2>
          <p style={pStyle}>
            Nous pouvons recueillir :
          </p>
          <ul style={ulStyle}>
            <li>Vos coordonnées (nom, courriel, numéro de téléphone);</li>
            <li>
              Vos documents fiscaux (T4, Relevé 1, reçus, relevés bancaires,
              états financiers, etc.);
            </li>
            <li>
              Les informations d’entreprise nécessaires à la production d’une
              déclaration T2 ou CO-17;
            </li>
            <li>
              Toute information que vous nous fournissez volontairement via le
              portail sécurisé ou par courriel.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>3. Comment nous utilisons ces informations</h2>
          <p style={pStyle}>
            Vos informations servent uniquement à :
          </p>
          <ul style={ulStyle}>
            <li>
              Préparer vos déclarations d’impôt (fédérales et provinciales);
            </li>
            <li>
              Vous conseiller fiscalement selon les informations fournies;
            </li>
            <li>
              Communiquer avec vous au sujet de votre dossier;
            </li>
            <li>
              Respecter nos obligations légales et fiscales.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>4. Partage de l’information</h2>
          <p style={pStyle}>
            Nous ne vendons ni ne louons vos informations personnelles.
            L’information peut être transmise uniquement :
          </p>
          <ul style={ulStyle}>
            <li>
              Aux autorités fiscales compétentes (ARC, Revenu Québec ou autre
              province) lorsque nous transmettons votre déclaration;
            </li>
            <li>
              À des partenaires techniques (hébergement sécurisé, portail de
              téléversement) uniquement dans le cadre du service;
            </li>
            <li>
              Si requis par la loi (ordonnance, enquête gouvernementale, etc.).
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>5. Sécurité et hébergement</h2>
          <p style={pStyle}>
            Vos documents sont transmis via un portail sécurisé. Nous appliquons
            des mesures raisonnables pour protéger les données contre l’accès
            non autorisé. Cependant, aucune transmission Internet ou
            conservation électronique n’est garantie à 100 %.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>6. Conservation des données</h2>
          <p style={pStyle}>
            Nous pouvons conserver certains dossiers fiscaux pour répondre aux
            exigences légales et comptables. Vous pouvez nous écrire si vous
            souhaitez demander la suppression de certaines informations qui ne
            sont plus requises légalement.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>7. Vos droits</h2>
          <p style={pStyle}>
            Vous pouvez demander :
          </p>
          <ul style={ulStyle}>
            <li>À voir quelles informations nous détenons sur vous;</li>
            <li>À corriger une information inexacte;</li>
            <li>
              À retirer votre consentement futur (ce qui peut empêcher la
              poursuite du service).
            </li>
          </ul>
          <p style={pStyle}>
            Pour exercer ces droits :{" "}
            <a href="mailto:comptanetquebec@gmail.com">
              comptanetquebec@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 style={h2Style}>8. Contact</h2>
          <p style={pStyle}>
            Pour toute question au sujet de cette politique :{" "}
            <a href="mailto:comptanetquebec@gmail.com">
              comptanetquebec@gmail.com
            </a>
          </p>
        </section>
      </section>
    </main>
  );
}

// styles réutilisés
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

const ulStyle: React.CSSProperties = {
  color: "#4b5563",
  fontSize: 14,
  lineHeight: 1.5,
  margin: "0 0 12px 18px",
  padding: 0,
  listStyle: "disc",
};
