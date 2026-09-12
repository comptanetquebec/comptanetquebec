"use client";

import React from "react";
import Link from "next/link";

export default function AvisLegalPage() {
  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const NEQ = "1175912972";
  const MARQUE = "ComptaNet Québec";
  const COURRIEL = "comptanetquebec@gmail.com";

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

        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            marginBottom: 32,
          }}
        >
          Dernière mise à jour : septembre 2026
        </p>

        {/* 1 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Identité de l’entreprise</h2>

          <p style={pStyle}>
            <strong>{MARQUE}</strong> est une marque exploitée par{" "}
            <strong>{NOM_LEGAL}</strong>, société constituée au Québec.
          </p>

          <p style={pStyle}>
            <strong>Numéro d’entreprise du Québec (NEQ) :</strong> {NEQ}
          </p>

          <p style={pStyle}>
            {MARQUE} offre principalement des services de préparation de
            déclarations de revenus et des services connexes à une clientèle
            située au Québec.
          </p>
        </section>

        {/* 2 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            2. Service privé et absence d’affiliation gouvernementale
          </h2>

          <p style={pStyle}>
            {MARQUE} est un service privé. {MARQUE} n’est pas l’Agence du
            revenu du Canada (ARC), Revenu Québec, un ministère, un organisme
            public ou un représentant d’un gouvernement.
          </p>

          <p style={pStyle}>
            Toute référence à l’ARC, à Revenu Québec ou à un autre organisme
            gouvernemental sur ce site est faite uniquement afin
            d’identifier les autorités fiscales, programmes, formulaires ou
            procédures concernés.
          </p>
        </section>

        {/* 3 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Information générale</h2>

          <p style={pStyle}>
            Le contenu publié sur le site de {MARQUE} est fourni à titre
            informatif et dans le cadre des services offerts.
          </p>

          <p style={pStyle}>
            Les renseignements fiscaux peuvent évoluer en fonction des lois,
            règlements, programmes et directives des autorités compétentes.
          </p>

          <p style={pStyle}>
            Une situation particulière peut nécessiter une analyse
            supplémentaire ou l’intervention d’un professionnel spécialisé.
          </p>
        </section>

        {/* 4 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Disponibilité et fonctionnement du site</h2>

          <p style={pStyle}>
            {MARQUE} prend des mesures raisonnables afin d’assurer le bon
            fonctionnement et la disponibilité de ses services en ligne.
          </p>

          <p style={pStyle}>
            Toutefois, l’accès au site ou à certaines fonctionnalités peut
            être temporairement interrompu notamment en raison d’une
            maintenance, d’une mise à jour, d’un problème technique ou d’un
            événement indépendant de notre volonté.
          </p>
        </section>

        {/* 5 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Liens et services externes</h2>

          <p style={pStyle}>
            Le site peut contenir des liens vers des sites, plateformes ou
            services exploités par des tiers.
          </p>

          <p style={pStyle}>
            {MARQUE} n’exerce aucun contrôle sur le contenu, la disponibilité,
            les pratiques ou les politiques de confidentialité de ces
            services externes.
          </p>
        </section>

        {/* 6 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Propriété intellectuelle</h2>

          <p style={pStyle}>
            Sauf indication contraire, les textes, éléments graphiques,
            logos, présentations, fonctionnalités originales et autres
            contenus propres au site sont la propriété de {NOM_LEGAL} ou
            sont utilisés avec les autorisations nécessaires.
          </p>

          <p style={pStyle}>
            Toute reproduction, modification, distribution ou utilisation
            commerciale non autorisée de ces éléments peut être interdite
            par les lois applicables.
          </p>
        </section>

        {/* 7 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Conditions applicables aux services</h2>

          <p style={pStyle}>
            Les règles concernant la préparation des déclarations, les
            responsabilités du client, les frais, les délais, les
            autorisations et les limites des services sont décrites dans nos{" "}
            <Link href="/legal/conditions" style={linkStyle}>
              Conditions de service
            </Link>
            .
          </p>
        </section>

        {/* 8 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            8. Protection des renseignements personnels
          </h2>

          <p style={pStyle}>
            Les pratiques de {MARQUE} concernant la collecte, l’utilisation,
            la conservation et la protection des renseignements personnels
            sont décrites dans notre{" "}
            <Link href="/legal/confidentialite" style={linkStyle}>
              Politique de confidentialité
            </Link>
            .
          </p>
        </section>

        {/* 9 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Modification du présent avis</h2>

          <p style={pStyle}>
            {MARQUE} peut modifier le présent avis légal afin de tenir compte
            de changements apportés au site, aux services ou aux exigences
            applicables.
          </p>

          <p style={pStyle}>
            La version publiée sur le site constitue la version en vigueur.
          </p>
        </section>

        {/* 10 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Droit applicable</h2>

          <p style={pStyle}>
            Le présent avis légal et l’utilisation du site sont régis par les
            lois applicables dans la province de Québec ainsi que par les lois
            fédérales du Canada qui s’y appliquent.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 style={h2Style}>11. Contact</h2>

          <p style={pStyle}>
            Pour toute question concernant le présent avis légal :
          </p>

          <p style={pStyle}>
            <strong>{MARQUE}</strong>
            <br />
            {NOM_LEGAL}
            <br />
            NEQ : {NEQ}
            <br />
            Courriel :{" "}
            <a href={`mailto:${COURRIEL}`} style={linkStyle}>
              {COURRIEL}
            </a>
          </p>
        </section>

        {/* NAVIGATION LÉGALE */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 14,
          }}
        >
          <Link href="/legal/conditions" style={linkStyle}>
            Conditions de service
          </Link>

          <Link href="/legal/confidentialite" style={linkStyle}>
            Politique de confidentialité
          </Link>
        </div>
      </section>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

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
  lineHeight: 1.6,
  margin: 0,
  marginBottom: 12,
};

const linkStyle: React.CSSProperties = {
  color: "#004aad",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
