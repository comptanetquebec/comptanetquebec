"use client";

import React from "react";

export default function ConditionsPage() {
  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const MARQUE = "ComptaNet Québec";
  const NEQ = "1175912972";

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

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
          Dernière mise à jour : {new Date().getFullYear()}
        </p>

        {/* IDENTITÉ */}
        <section style={boxStyle} aria-label="Identité de l'entreprise">
          <h2 style={{ ...h2Style, marginBottom: 10 }}>Identité de l’entreprise</h2>
          <p style={pStyle}>
            <strong>{MARQUE}</strong> est une marque exploitée par{" "}
            <strong>{NOM_LEGAL}</strong>, entreprise incorporée au Québec.
          </p>
          <p style={pStyle}>
            <strong>NEQ :</strong> {NEQ}
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Service offert principalement en ligne aux résidents et entreprises du
            Québec.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>1. Acceptation</h2>
          <p style={pStyle}>
            En utilisant notre site, notre portail sécurisé ou nos services, vous
            acceptez les présentes conditions d’utilisation. Si vous n’êtes pas
            d’accord, veuillez ne pas utiliser nos services.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>2. Nature du service</h2>
          <p style={pStyle}>
            Nous préparons vos déclarations de revenus à partir des informations et
            documents que vous nous fournissez. Vous demeurez responsable de
            l’exactitude, de l’exhaustivité et de la véracité de ces informations.
          </p>
          <p style={pStyle}>
            Nous ne garantissons pas un remboursement, ni un résultat fiscal
            particulier. Toute estimation fournie demeure une estimation. Les
            autorités fiscales (ARC et Revenu Québec) conservent le dernier mot.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>3. Accès au portail</h2>
          <p style={pStyle}>
            Vous acceptez de ne pas partager votre accès au portail client avec une
            tierce personne non autorisée. Vous êtes responsable de la
            confidentialité de vos identifiants et de toute activité réalisée via
            votre compte.
          </p>
          <p style={pStyle}>
            Vous devez transmettre des documents lisibles et complets. Nous pouvons
            demander des précisions ou des pièces supplémentaires si nécessaire.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>4. Tarifs, dépôt et paiement</h2>

          <p style={pStyle}>Un dépôt est exigé pour l’ouverture du dossier :</p>

          <ul style={ulStyle}>
            <li>Déclaration T1 (particulier) : <strong>100 $</strong> (taxes incluses)</li>
            <li>Travailleur autonome : <strong>150 $</strong> (taxes incluses)</li>
            <li>Déclaration T2 (compagnie incorporée) : <strong>450 $</strong> (taxes incluses)</li>
          </ul>

          <p style={pStyle}>
            Les montants affichés sont en dollars canadiens (CAD) et incluent les
            taxes applicables (TPS/TVQ).
          </p>

          <p style={pStyle}>
            Le solde doit être payé avant la transmission officielle de vos
            déclarations (ex. TED lorsque applicable).
          </p>

          <p style={pStyle}>
            Le dépôt couvre l’ouverture du dossier et l’analyse initiale. Il peut
            être non remboursable une fois le traitement commencé.
          </p>

          <p style={pStyle}>
            Les frais finaux peuvent varier selon la complexité du dossier (revenus
            multiples, immeubles locatifs, tenue de livres manquante, corrections,
            etc.). Le montant final est toujours confirmé avant l’envoi.
          </p>

          <p style={pStyle}>
            Les paiements peuvent être traités par un prestataire de paiement (ex.
            Stripe). Vous acceptez les conditions du prestataire applicables aux
            paiements.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>5. Utilisation acceptable</h2>
          <p style={pStyle}>
            Vous acceptez de ne pas utiliser nos services pour toute activité
            frauduleuse, illégale ou trompeuse, incluant la transmission volontaire
            d’informations fausses ou de documents falsifiés.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>6. Limitation, refus ou interruption du service</h2>
          <p style={pStyle}>
            Nous pouvons refuser ou interrompre un mandat si l’information fournie
            est incomplète, incohérente ou manifestement inexacte, si la
            collaboration devient impossible, ou si la situation présente un risque
            de non-conformité.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>7. Confidentialité et documents</h2>
          <p style={pStyle}>
            Nous traitons les informations transmises de manière confidentielle.
            Pour plus de détails, consultez notre politique de confidentialité.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>8. Propriété intellectuelle</h2>
          <p style={pStyle}>
            Le contenu du site (textes, logo, éléments visuels) est protégé. Toute
            reproduction, distribution ou utilisation non autorisée est interdite.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>9. Droit applicable</h2>
          <p style={pStyle}>
            Ces conditions sont régies par les lois applicables au Québec et au
            Canada. Tout litige devra être traité dans cette juridiction.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={h2Style}>10. Modifications</h2>
          <p style={pStyle}>
            Nous pouvons mettre à jour ces conditions à l’occasion. La version en
            vigueur est celle publiée sur cette page à la date indiquée.
          </p>
        </section>

        <section>
          <h2 style={h2Style}>11. Contact</h2>
          <p style={pStyle}>
            Pour toute question sur ces conditions :{" "}
            <a href="mailto:comptanetquebec@gmail.com">comptanetquebec@gmail.com</a>
          </p>
          <p style={{ ...pStyle, marginBottom: 0, color: "#6b7280" }}>
            {NOM_LEGAL} — NEQ : {NEQ}
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

const boxStyle: React.CSSProperties = {
  marginBottom: 32,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const ulStyle: React.CSSProperties = {
  marginLeft: 20,
  marginBottom: 12,
  color: "#4b5563",
  fontSize: 14,
  lineHeight: 1.6,
};
