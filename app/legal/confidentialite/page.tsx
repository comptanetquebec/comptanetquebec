"use client";

import React from "react";
import Link from "next/link";

export default function ConfidentialitePage() {
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
          Politique de confidentialité
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
          <h2 style={h2Style}>1. Qui nous sommes</h2>

          <p style={pStyle}>
            <strong>{MARQUE}</strong> est une marque exploitée par{" "}
            <strong>{NOM_LEGAL}</strong>, société constituée au Québec.
          </p>

          <p style={pStyle}>
            <strong>NEQ :</strong> {NEQ}
          </p>

          <p style={pStyle}>
            {MARQUE} offre notamment des services de préparation et de
            transmission de déclarations de revenus ainsi que des services
            connexes.
          </p>
        </section>

        {/* 2 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            2. Renseignements personnels que nous pouvons recueillir
          </h2>

          <p style={pStyle}>
            Selon les services demandés et votre situation, nous pouvons
            recueillir les renseignements nécessaires au traitement de votre
            dossier, notamment :
          </p>

          <ul style={ulStyle}>
            <li>
              vos renseignements d'identification et coordonnées, notamment
              votre nom, adresse, courriel et numéro de téléphone;
            </li>

            <li>
              votre numéro d'assurance sociale (NAS) lorsqu'il est nécessaire
              à la préparation ou à la transmission de votre déclaration;
            </li>

            <li>
              votre date de naissance, état civil et certains renseignements
              concernant votre conjoint ou vos personnes à charge;
            </li>

            <li>
              vos renseignements fiscaux, financiers et professionnels;
            </li>

            <li>
              vos feuillets et documents fiscaux, notamment T4, relevés,
              reçus, pièces justificatives et autres documents nécessaires;
            </li>

            <li>
              les renseignements relatifs à une entreprise, un travail
              autonome ou des revenus de location lorsque ces renseignements
              sont nécessaires à votre dossier;
            </li>

            <li>
              les renseignements que vous fournissez dans nos formulaires,
              notre portail, par courriel ou lors de communications avec nous;
            </li>

            <li>
              certains renseignements techniques nécessaires au
              fonctionnement et à la sécurité de nos services en ligne.
            </li>
          </ul>

          <p style={pStyle}>
            Nous cherchons à limiter la collecte aux renseignements
            raisonnablement nécessaires aux fins pour lesquelles ils sont
            recueillis.
          </p>
        </section>

        {/* 3 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            3. Pourquoi nous utilisons vos renseignements
          </h2>

          <p style={pStyle}>
            Les renseignements recueillis peuvent notamment être utilisés
            pour :
          </p>

          <ul style={ulStyle}>
            <li>ouvrir, administrer et traiter votre dossier;</li>

            <li>
              préparer vos déclarations de revenus et les documents connexes;
            </li>

            <li>
              vérifier la cohérence des renseignements et documents fournis;
            </li>

            <li>
              communiquer avec vous au sujet de votre dossier;
            </li>

            <li>
              transmettre les renseignements requis aux autorités fiscales
              lorsque vous nous autorisez à effectuer une transmission;
            </li>

            <li>
              fournir les services que vous avez demandés;
            </li>

            <li>
              protéger nos systèmes, prévenir les accès non autorisés et
              assurer la sécurité de nos services;
            </li>

            <li>
              respecter nos obligations légales, fiscales, administratives et
              réglementaires.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            4. Utilisation de l'intelligence artificielle
          </h2>

          <p style={pStyle}>
            {MARQUE} peut utiliser des outils d'intelligence artificielle à
            titre d'assistance pour analyser, classer, organiser ou résumer
            certains renseignements et documents fournis afin de faciliter le
            traitement et la préparation d'un dossier.
          </p>

          <p style={pStyle}>
            L'intelligence artificielle ne prend aucune décision fiscale de
            façon autonome. Les informations produites à l'aide de ces outils
            sont vérifiées par une personne avant leur utilisation dans la
            préparation d'une déclaration de revenus.
          </p>

          <p style={pStyle}>
            <strong>
              Le numéro d'assurance sociale (NAS) n'est pas transmis à l'outil
              d'intelligence artificielle utilisé pour l'analyse du formulaire
              fiscal.
            </strong>
          </p>
        </section>

        {/* 5 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            5. Communication de renseignements à des tiers
          </h2>

          <p style={pStyle}>
            {MARQUE} ne vend ni ne loue les renseignements personnels de ses
            clients.
          </p>

          <p style={pStyle}>
            Certains renseignements peuvent toutefois être communiqués
            lorsque cela est nécessaire, notamment :
          </p>

          <ul style={ulStyle}>
            <li>
              à l'Agence du revenu du Canada, à Revenu Québec ou à une autre
              autorité compétente lorsque cela est nécessaire au service
              demandé et autorisé;
            </li>

            <li>
              à des fournisseurs technologiques ou prestataires de services
              qui nous aident notamment à exploiter, héberger, sécuriser ou
              fournir nos services;
            </li>

            <li>
              lorsque la communication est requise ou permise par la loi;
            </li>

            <li>
              avec votre consentement lorsque celui-ci est requis.
            </li>
          </ul>

          <p style={pStyle}>
            Lorsque des fournisseurs traitent des renseignements personnels
            pour notre compte, nous cherchons à limiter leur accès aux
            renseignements nécessaires à l'exécution des services concernés.
          </p>
        </section>

        {/* 6 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            6. Hébergement et traitement à l'extérieur du Québec
          </h2>

          <p style={pStyle}>
            Certains fournisseurs technologiques utilisés par {MARQUE} peuvent
            traiter ou conserver des renseignements à l'extérieur du Québec ou
            du Canada.
          </p>

          <p style={pStyle}>
            Lorsque les exigences légales applicables l'exigent, {MARQUE}
            prend les mesures nécessaires avant une telle communication,
            notamment en évaluant les facteurs relatifs à la vie privée et les
            mesures de protection applicables.
          </p>
        </section>

        {/* 7 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Sécurité des renseignements</h2>

          <p style={pStyle}>
            {MARQUE} met en place des mesures administratives, techniques et
            organisationnelles raisonnables afin de protéger les
            renseignements personnels contre la perte, le vol ainsi que
            l'accès, l'utilisation ou la communication non autorisés.
          </p>

          <p style={pStyle}>
            L'accès aux renseignements personnels doit être limité aux
            personnes et fournisseurs qui en ont besoin dans le cadre de leurs
            fonctions ou des services qu'ils fournissent.
          </p>

          <p style={pStyle}>
            Malgré ces mesures, aucun système informatique ni aucune
            transmission sur Internet ne peut être garanti comme étant
            entièrement exempt de risques.
          </p>
        </section>

        {/* 8 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Incidents de confidentialité</h2>

          <p style={pStyle}>
            En cas d'incident de confidentialité impliquant des renseignements
            personnels, {MARQUE} prend les mesures raisonnables nécessaires
            afin de réduire les risques de préjudice et d'éviter qu'un incident
            de même nature se reproduise.
          </p>

          <p style={pStyle}>
            Lorsque la loi l'exige, les personnes concernées ainsi que les
            autorités compétentes sont avisées de l'incident.
          </p>
        </section>

        {/* 9 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Conservation et destruction</h2>

          <p style={pStyle}>
            Les renseignements personnels sont conservés pendant la période
            nécessaire aux fins pour lesquelles ils ont été recueillis et pour
            respecter les obligations légales, fiscales, comptables ou
            administratives applicables.
          </p>

          <p style={pStyle}>
            Lorsqu'ils ne sont plus nécessaires et que leur conservation n'est
            plus requise, ils sont détruits de façon sécuritaire ou traités
            conformément aux exigences légales applicables.
          </p>
        </section>

        {/* 10 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Vos droits</h2>

          <p style={pStyle}>
            Sous réserve des conditions et exceptions prévues par la loi, vous
            pouvez notamment demander :
          </p>

          <ul style={ulStyle}>
            <li>
              l'accès aux renseignements personnels que nous détenons à votre
              sujet;
            </li>

            <li>
              la rectification de renseignements personnels inexacts,
              incomplets ou équivoques;
            </li>

            <li>
              des renseignements concernant l'utilisation et la communication
              de vos renseignements personnels;
            </li>

            <li>
              le retrait de votre consentement lorsque le traitement concerné
              repose sur votre consentement et que la loi permet son retrait.
            </li>
          </ul>

          <p style={pStyle}>
            Le retrait de certains consentements peut empêcher {MARQUE} de
            fournir ou de poursuivre certains services lorsque les
            renseignements concernés sont nécessaires à leur exécution.
          </p>
        </section>

        {/* 11 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            11. Responsable de la protection des renseignements personnels
          </h2>

          <p style={pStyle}>
            Les demandes relatives à l'accès, à la rectification, à la
            confidentialité ou à l'exercice de vos droits peuvent être
            adressées au responsable de la protection des renseignements
            personnels.
          </p>

          <p style={pStyle}>
            <strong>
              Responsable de la protection des renseignements personnels
            </strong>
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

        {/* 12 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Plaintes et questions</h2>

          <p style={pStyle}>
            Toute question, préoccupation ou plainte concernant la protection
            de vos renseignements personnels peut être transmise au
            responsable de la protection des renseignements personnels à
            l'adresse suivante :
          </p>

          <p style={pStyle}>
            <a href={`mailto:${COURRIEL}`} style={linkStyle}>
              {COURRIEL}
            </a>
          </p>
        </section>

        {/* 13 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>13. Modification de cette politique</h2>

          <p style={pStyle}>
            Cette politique peut être modifiée afin de refléter des changements
            à nos pratiques, à nos services ou aux exigences légales
            applicables.
          </p>

          <p style={pStyle}>
            La date de la dernière mise à jour est indiquée au début de la
            politique. Toute modification importante sera portée à l'attention
            des personnes concernées par un moyen approprié lorsque requis.
          </p>
        </section>

        {/* NAVIGATION */}
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
          <Link href="/legal/avis-legal" style={linkStyle}>
            Avis légal
          </Link>

          <Link href="/legal/conditions" style={linkStyle}>
            Conditions de service
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

const ulStyle: React.CSSProperties = {
  color: "#4b5563",
  fontSize: 14,
  lineHeight: 1.6,
  margin: "0 0 12px 20px",
  padding: 0,
  listStyle: "disc",
};

const linkStyle: React.CSSProperties = {
  color: "#004aad",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
