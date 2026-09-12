"use client";

import React from "react";
import Link from "next/link";

export default function ConditionsPage() {
  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const MARQUE = "ComptaNet Québec";
  const NEQ = "1175912972";
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
          Conditions de service et d’utilisation
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          Dernière mise à jour : septembre 2026
        </p>

        {/* IDENTITÉ */}
        <section style={boxStyle} aria-label="Identité de l'entreprise">
          <h2 style={{ ...h2Style, marginBottom: 10 }}>
            Identité de l’entreprise
          </h2>

          <p style={pStyle}>
            <strong>{MARQUE}</strong> est une marque exploitée par{" "}
            <strong>{NOM_LEGAL}</strong>, société constituée au Québec.
          </p>

          <p style={pStyle}>
            <strong>NEQ :</strong> {NEQ}
          </p>

          <p style={{ ...pStyle, marginBottom: 0 }}>
            Les services sont offerts principalement en ligne à une clientèle
            située au Québec.
          </p>
        </section>

        {/* 1 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Acceptation des conditions</h2>

          <p style={pStyle}>
            En utilisant le site, le portail client ou les services de{" "}
            {MARQUE}, vous acceptez les présentes conditions de service et
            d’utilisation.
          </p>

          <p style={pStyle}>
            Si vous n’acceptez pas ces conditions, vous devez cesser
            d’utiliser les services concernés.
          </p>
        </section>

        {/* 2 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Nature des services</h2>

          <p style={pStyle}>
            {MARQUE} offre des services de préparation de déclarations de
            revenus et des services connexes selon le type de dossier accepté.
          </p>

          <p style={pStyle}>
            Les déclarations sont préparées à partir des renseignements,
            documents et instructions fournis par le client.
          </p>

          <p style={pStyle}>
            Sauf entente expresse contraire, les services de {MARQUE} ne
            constituent pas des services juridiques, des conseils en placement
            ou une opinion juridique.
          </p>

          <p style={pStyle}>
            Une situation particulière ou complexe peut nécessiter des
            renseignements supplémentaires ou l’intervention d’un
            professionnel spécialisé.
          </p>
        </section>

        {/* 3 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Responsabilités du client</h2>

          <p style={pStyle}>
            Le client est responsable de fournir des renseignements et des
            documents complets, exacts, lisibles et véridiques.
          </p>

          <p style={pStyle}>
            Le client doit notamment signaler toute information pouvant avoir
            une incidence sur sa situation fiscale et répondre aux demandes
            de renseignements supplémentaires nécessaires au traitement de
            son dossier.
          </p>

          <p style={pStyle}>
            Une omission, une erreur ou un document manquant peut modifier le
            résultat de la déclaration et peut notamment entraîner un nouveau
            calcul, des intérêts, des pénalités ou une demande de
            renseignements d’une autorité fiscale.
          </p>

          <p style={pStyle}>
            Avant la transmission de sa déclaration, le client demeure
            responsable de vérifier les renseignements qui lui sont présentés
            pour approbation.
          </p>
        </section>

        {/* 4 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Accès au portail et sécurité du compte</h2>

          <p style={pStyle}>
            Le client est responsable de préserver la confidentialité de ses
            identifiants de connexion et de prendre des mesures raisonnables
            afin d’empêcher l’utilisation non autorisée de son compte.
          </p>

          <p style={pStyle}>
            Le client ne doit pas permettre à une personne non autorisée
            d’utiliser son accès au portail.
          </p>

          <p style={pStyle}>
            Toute utilisation suspecte ou non autorisée du compte devrait être
            signalée à {MARQUE} dès que possible.
          </p>
        </section>

        {/* 5 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Documents et renseignements manquants</h2>

          <p style={pStyle}>
            Les documents transmis doivent être suffisamment lisibles et
            complets pour permettre leur traitement.
          </p>

          <p style={pStyle}>
            {MARQUE} peut demander des renseignements, explications ou pièces
            justificatives supplémentaires lorsqu’ils sont nécessaires à la
            préparation du dossier.
          </p>

          <p style={pStyle}>
            Un dossier incomplet peut entraîner un retard et peut empêcher la
            préparation ou la transmission de la déclaration jusqu’à ce que
            les renseignements nécessaires aient été reçus.
          </p>
        </section>

        {/* 6 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Tarifs, dépôt et paiement</h2>

          <p style={pStyle}>
            Un dépôt est exigé pour l’ouverture de certains dossiers :
          </p>

          <ul style={ulStyle}>
            <li>
              Déclaration T1 (particulier) :{" "}
              <strong>100 $ plus taxes</strong>
            </li>

            <li>
              Travailleur autonome :{" "}
              <strong>150 $ plus taxes</strong>
            </li>

            <li>
              Déclaration T2 (compagnie incorporée) :{" "}
              <strong>450 $ plus taxes</strong>
            </li>
          </ul>

          <p style={pStyle}>
            Les montants sont indiqués en dollars canadiens (CAD). Les taxes
            applicables, notamment la TPS et la TVQ, sont ajoutées aux montants
            indiqués.
          </p>

          <p style={pStyle}>
            Le dépôt couvre notamment l’ouverture du dossier et le début du
            traitement. Une fois le traitement commencé, tout ou partie du
            dépôt peut être non remboursable, sous réserve des droits
            applicables au consommateur et de la loi.
          </p>

          <p style={pStyle}>
            Les frais finaux peuvent varier selon la nature et la complexité
            du dossier, notamment lorsqu’il comporte des revenus multiples,
            du travail autonome, des revenus locatifs, des corrections, des
            renseignements manquants ou du travail supplémentaire.
          </p>

          <p style={pStyle}>
            Lorsque des frais supplémentaires sont nécessaires, le montant
            applicable est communiqué au client avant la transmission finale
            de la déclaration.
          </p>

          <p style={pStyle}>
            Sauf entente contraire, le solde dû doit être payé avant la
            transmission officielle de la déclaration.
          </p>
        </section>

        {/* 7 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Paiements électroniques</h2>

          <p style={pStyle}>
            Certains paiements peuvent être effectués au moyen de fournisseurs
            de services de paiement externes.
          </p>

          <p style={pStyle}>
            Les renseignements nécessaires au traitement du paiement peuvent
            alors être traités directement par le fournisseur de paiement
            conformément à ses propres conditions et politiques.
          </p>
        </section>

        {/* 8 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            8. Autorisations, signatures et transmission
          </h2>

          <p style={pStyle}>
            La préparation d’un dossier ne constitue pas automatiquement une
            autorisation de transmettre une déclaration de revenus.
          </p>

          <p style={pStyle}>
            Lorsque requis, le client doit examiner et signer les formulaires,
            autorisations ou déclarations nécessaires avant la transmission
            de sa déclaration aux autorités fiscales.
          </p>

          <p style={pStyle}>
            {MARQUE} peut suspendre la transmission tant que les autorisations,
            signatures, renseignements ou paiements nécessaires n’ont pas été
            reçus.
          </p>
        </section>

        {/* 9 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Aucune garantie de résultat fiscal</h2>

          <p style={pStyle}>
            Aucun montant précis de remboursement, de crédit, de prestation
            ou de solde d’impôt ne peut être garanti.
          </p>

          <p style={pStyle}>
            Les calculs peuvent être modifiés à la suite du traitement, d’une
            cotisation, d’une nouvelle cotisation, d’une vérification ou d’une
            décision de l’Agence du revenu du Canada ou de Revenu Québec.
          </p>

          <p style={pStyle}>
            Les autorités fiscales demeurent responsables du traitement final
            des déclarations et de l’application des lois fiscales.
          </p>
        </section>

        {/* 10 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Délais</h2>

          <p style={pStyle}>
            Les délais communiqués par {MARQUE} sont des estimations et peuvent
            varier selon la période de l’année, le volume de dossiers, la
            complexité de la situation et la disponibilité des renseignements
            nécessaires.
          </p>

          <p style={pStyle}>
            Les délais de traitement de l’ARC, de Revenu Québec ou de toute
            autre autorité sont indépendants de {MARQUE} et ne peuvent être
            garantis.
          </p>
        </section>

        {/* 11 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Utilisation acceptable</h2>

          <p style={pStyle}>
            Les services ne doivent pas être utilisés à des fins frauduleuses,
            illégales ou trompeuses.
          </p>

          <p style={pStyle}>
            Il est notamment interdit de transmettre volontairement de faux
            renseignements, des documents falsifiés ou de demander à{" "}
            {MARQUE} de produire ou transmettre une déclaration que nous
            savons être fausse ou trompeuse.
          </p>
        </section>

        {/* 12 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Refus ou interruption d’un mandat</h2>

          <p style={pStyle}>
            {MARQUE} peut, sous réserve des obligations légales applicables,
            refuser, suspendre ou mettre fin à un mandat notamment lorsque :
          </p>

          <ul style={ulStyle}>
            <li>les renseignements nécessaires ne sont pas fournis;</li>

            <li>
              des renseignements semblent faux, falsifiés ou manifestement
              incohérents;
            </li>

            <li>
              le client refuse de fournir une autorisation nécessaire;
            </li>

            <li>
              les sommes dues ne sont pas payées selon les modalités
              convenues;
            </li>

            <li>
              la poursuite du mandat pourrait contrevenir à une obligation
              légale ou professionnelle;
            </li>

            <li>
              la collaboration nécessaire au traitement du dossier devient
              impossible.
            </li>
          </ul>
        </section>

        {/* 13 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>
            13. Protection des renseignements personnels
          </h2>

          <p style={pStyle}>
            Le traitement des renseignements personnels et fiscaux est
            expliqué dans notre{" "}
            <Link href="/legal/confidentialite" style={linkStyle}>
              Politique de confidentialité
            </Link>
            .
          </p>

          <p style={pStyle}>
            Cette politique explique notamment les renseignements recueillis,
            leurs utilisations, leur protection, leur conservation ainsi que
            certains droits des personnes concernées.
          </p>
        </section>

        {/* 14 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>14. Limitation de responsabilité</h2>

          <p style={pStyle}>
            Dans les limites permises par la loi, {MARQUE} ne peut être tenue
            responsable des conséquences résultant directement de
            renseignements faux, incomplets, inexacts ou transmis tardivement
            par le client.
          </p>

          <p style={pStyle}>
            {MARQUE} n’est pas responsable des délais, décisions, interruptions
            ou problèmes attribuables aux autorités fiscales ou à des services
            externes qui échappent raisonnablement à son contrôle.
          </p>

          <p style={pStyle}>
            Rien dans les présentes conditions n’a pour effet d’exclure ou de
            limiter une responsabilité qui ne peut légalement être exclue ou
            limitée.
          </p>
        </section>

        {/* 15 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>15. Propriété intellectuelle</h2>

          <p style={pStyle}>
            Sauf indication contraire, les textes, logos, éléments visuels,
            présentations et fonctionnalités originales du site sont la
            propriété de {NOM_LEGAL} ou sont utilisés avec les autorisations
            nécessaires.
          </p>

          <p style={pStyle}>
            Leur reproduction ou leur utilisation commerciale non autorisée
            peut être interdite par les lois applicables.
          </p>
        </section>

        {/* 16 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>16. Modification des conditions</h2>

          <p style={pStyle}>
            {MARQUE} peut modifier les présentes conditions afin de tenir
            compte de changements à ses services, à ses pratiques ou aux
            exigences applicables.
          </p>

          <p style={pStyle}>
            La version publiée sur cette page constitue la version en vigueur.
          </p>
        </section>

        {/* 17 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>17. Droit applicable</h2>

          <p style={pStyle}>
            Les présentes conditions sont régies par les lois applicables dans
            la province de Québec et les lois fédérales du Canada qui s’y
            appliquent.
          </p>

          <p style={pStyle}>
            Rien dans les présentes conditions ne limite les droits ou recours
            dont une personne bénéficie en vertu d’une loi applicable et
            auxquels elle ne peut valablement renoncer.
          </p>
        </section>

        {/* 18 */}
        <section>
          <h2 style={h2Style}>18. Contact</h2>

          <p style={pStyle}>
            Pour toute question concernant les présentes conditions :
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
          <Link href="/legal/avis-legal" style={linkStyle}>
            Avis légal
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
  padding: 0,
  color: "#4b5563",
  fontSize: 14,
  lineHeight: 1.6,
};

const linkStyle: React.CSSProperties = {
  color: "#004aad",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
