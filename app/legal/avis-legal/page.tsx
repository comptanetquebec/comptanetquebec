"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

function getLang(value: string | null): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

type Translation = {
  title: string;
  updated: string;

  s1: string;
  s1p1: string;
  neqLabel: string;
  s1p2: string;

  s2: string;
  s2p1: string;
  s2p2: string;

  s3: string;
  s3p1: string;
  s3p2: string;
  s3p3: string;

  s4: string;
  s4p1: string;
  s4p2: string;

  s5: string;
  s5p1: string;
  s5p2: string;

  s6: string;
  s6p1: string;
  s6p2: string;

  s7: string;
  s7p1: string;
  conditions: string;

  s8: string;
  s8p1: string;
  privacy: string;

  s9: string;
  s9p1: string;
  s9p2: string;

  s10: string;
  s10p1: string;

  s11: string;
  s11p1: string;
  emailLabel: string;
};

const TEXT: Record<Lang, Translation> = {
  fr: {
    title: "Avis légal",
    updated: "Dernière mise à jour : septembre 2026",

    s1: "1. Identité de l’entreprise",
    s1p1:
      "ComptaNet Québec est une marque exploitée par Les Entreprises Kema Inc., société constituée au Québec.",
    neqLabel: "Numéro d’entreprise du Québec (NEQ)",
    s1p2:
      "ComptaNet Québec offre principalement des services de préparation de déclarations de revenus, des services destinés aux travailleurs autonomes, des services de tenue de livres en ligne ainsi que des services connexes à une clientèle située principalement au Québec.",

    s2: "2. Service privé et absence d’affiliation gouvernementale",
    s2p1:
      "ComptaNet Québec est un service privé. ComptaNet Québec n’est pas l’Agence du revenu du Canada (ARC), Revenu Québec, un ministère, un organisme public ou un représentant d’un gouvernement.",
    s2p2:
      "Toute référence à l’ARC, à Revenu Québec ou à un autre organisme gouvernemental sur ce site est faite uniquement afin d’identifier les autorités fiscales, programmes, formulaires ou procédures concernés.",

    s3: "3. Information générale",
    s3p1:
      "Le contenu publié sur le site de ComptaNet Québec est fourni à titre informatif et dans le cadre des services offerts.",
    s3p2:
      "Les renseignements fiscaux, comptables et financiers peuvent évoluer en fonction des lois, règlements, programmes, normes et directives des autorités compétentes.",
    s3p3:
      "Une situation particulière ou complexe peut nécessiter une analyse supplémentaire ou l’intervention d’un professionnel spécialisé.",

    s4: "4. Disponibilité et fonctionnement du site",
    s4p1:
      "ComptaNet Québec prend des mesures raisonnables afin d’assurer le bon fonctionnement et la disponibilité de son site, de son portail client et de ses services en ligne, incluant les fonctionnalités de tenue de livres.",
    s4p2:
      "Toutefois, l’accès au site, au portail ou à certaines fonctionnalités peut être temporairement interrompu notamment en raison d’une maintenance, d’une mise à jour, d’un problème technique ou d’un événement indépendant de notre volonté.",

    s5: "5. Liens et services externes",
    s5p1:
      "Le site et le portail peuvent contenir des liens vers des sites, plateformes ou services exploités par des tiers ou utiliser des services technologiques fournis par des tiers.",
    s5p2:
      "ComptaNet Québec n’exerce aucun contrôle sur le contenu, la disponibilité, les pratiques ou les politiques de confidentialité des services externes exploités indépendamment par ces tiers.",

    s6: "6. Propriété intellectuelle",
    s6p1:
      "Sauf indication contraire, les textes, éléments graphiques, logos, présentations, tableaux de bord, fonctionnalités originales et autres contenus propres au site et au portail sont la propriété de Les Entreprises Kema Inc. ou sont utilisés avec les autorisations nécessaires.",
    s6p2:
      "Toute reproduction, modification, distribution ou utilisation commerciale non autorisée de ces éléments peut être interdite par les lois applicables.",

    s7: "7. Conditions applicables aux services",
    s7p1:
      "Les règles concernant la préparation des déclarations, la tenue de livres, les responsabilités du client, les abonnements, les frais, les paiements, les délais, les autorisations et les limites des services sont décrites dans nos",
    conditions: "Conditions de service",

    s8: "8. Protection des renseignements personnels",
    s8p1:
      "Les pratiques de ComptaNet Québec concernant la collecte, l’utilisation, la conservation et la protection des renseignements personnels, fiscaux et financiers sont décrites dans notre",
    privacy: "Politique de confidentialité",

    s9: "9. Modification du présent avis",
    s9p1:
      "ComptaNet Québec peut modifier le présent avis légal afin de tenir compte de changements apportés au site, au portail, aux services ou aux exigences applicables.",
    s9p2:
      "La version publiée sur le site constitue la version en vigueur.",

    s10: "10. Droit applicable",
    s10p1:
      "Le présent avis légal et l’utilisation du site sont régis par les lois applicables dans la province de Québec ainsi que par les lois fédérales du Canada qui s’y appliquent.",

    s11: "11. Contact",
    s11p1: "Pour toute question concernant le présent avis légal :",
    emailLabel: "Courriel",
  },

  en: {
    title: "Legal Notice",
    updated: "Last updated: September 2026",

    s1: "1. Business Identity",
    s1p1:
      "ComptaNet Québec is a brand operated by Les Entreprises Kema Inc., a corporation incorporated in Québec.",
    neqLabel: "Québec Enterprise Number (NEQ)",
    s1p2:
      "ComptaNet Québec primarily provides income tax return preparation services, services for self-employed individuals, online bookkeeping services and related services to clients located primarily in Québec.",

    s2: "2. Private Service and No Government Affiliation",
    s2p1:
      "ComptaNet Québec is a private service. ComptaNet Québec is not the Canada Revenue Agency (CRA), Revenu Québec, a government department, a public body or a representative of any government.",
    s2p2:
      "Any reference to the CRA, Revenu Québec or another government organization on this website is made solely to identify the relevant tax authorities, programs, forms or procedures.",

    s3: "3. General Information",
    s3p1:
      "Content published on the ComptaNet Québec website is provided for informational purposes and in connection with the services offered.",
    s3p2:
      "Tax, accounting and financial information may change as a result of laws, regulations, programs, standards and guidance issued by competent authorities.",
    s3p3:
      "A particular or complex situation may require additional analysis or the involvement of a specialized professional.",

    s4: "4. Website Availability and Operation",
    s4p1:
      "ComptaNet Québec takes reasonable measures to maintain the proper operation and availability of its website, client portal and online services, including bookkeeping features.",
    s4p2:
      "However, access to the website, portal or certain features may be temporarily interrupted due to maintenance, updates, technical problems or events beyond our control.",

    s5: "5. External Links and Services",
    s5p1:
      "The website and portal may contain links to websites, platforms or services operated by third parties or may use technological services provided by third parties.",
    s5p2:
      "ComptaNet Québec has no control over the content, availability, practices or privacy policies of external services independently operated by those third parties.",

    s6: "6. Intellectual Property",
    s6p1:
      "Unless otherwise indicated, the texts, graphic elements, logos, presentations, dashboards, original features and other content specific to the website and portal are the property of Les Entreprises Kema Inc. or are used with the necessary authorizations.",
    s6p2:
      "Unauthorized reproduction, modification, distribution or commercial use of these elements may be prohibited by applicable laws.",

    s7: "7. Terms Applicable to Services",
    s7p1:
      "The rules concerning tax return preparation, bookkeeping, client responsibilities, subscriptions, fees, payments, timeframes, authorizations and service limitations are described in our",
    conditions: "Terms of Service",

    s8: "8. Protection of Personal Information",
    s8p1:
      "ComptaNet Québec’s practices regarding the collection, use, retention and protection of personal, tax and financial information are described in our",
    privacy: "Privacy Policy",

    s9: "9. Changes to This Legal Notice",
    s9p1:
      "ComptaNet Québec may modify this legal notice to reflect changes to the website, portal, services or applicable requirements.",
    s9p2:
      "The version published on the website is the version currently in effect.",

    s10: "10. Applicable Law",
    s10p1:
      "This legal notice and use of the website are governed by the laws applicable in the Province of Québec and the federal laws of Canada applicable therein.",

    s11: "11. Contact",
    s11p1: "For any questions regarding this legal notice:",
    emailLabel: "Email",
  },

  es: {
    title: "Aviso legal",
    updated: "Última actualización: septiembre de 2026",

    s1: "1. Identidad de la empresa",
    s1p1:
      "ComptaNet Québec es una marca operada por Les Entreprises Kema Inc., sociedad constituida en Québec.",
    neqLabel: "Número de empresa de Québec (NEQ)",
    s1p2:
      "ComptaNet Québec ofrece principalmente servicios de preparación de declaraciones de impuestos, servicios para trabajadores autónomos, servicios de contabilidad en línea y servicios relacionados a clientes ubicados principalmente en Québec.",

    s2: "2. Servicio privado y ausencia de afiliación gubernamental",
    s2p1:
      "ComptaNet Québec es un servicio privado. ComptaNet Québec no es la Agencia de Ingresos de Canadá (CRA), Revenu Québec, un ministerio, un organismo público ni un representante de ningún gobierno.",
    s2p2:
      "Toda referencia a la Agencia de Ingresos de Canadá, Revenu Québec u otro organismo gubernamental en este sitio se realiza únicamente para identificar las autoridades fiscales, programas, formularios o procedimientos correspondientes.",

    s3: "3. Información general",
    s3p1:
      "El contenido publicado en el sitio web de ComptaNet Québec se proporciona con fines informativos y en el marco de los servicios ofrecidos.",
    s3p2:
      "La información fiscal, contable y financiera puede cambiar en función de las leyes, reglamentos, programas, normas y directrices de las autoridades competentes.",
    s3p3:
      "Una situación particular o compleja puede requerir un análisis adicional o la intervención de un profesional especializado.",

    s4: "4. Disponibilidad y funcionamiento del sitio",
    s4p1:
      "ComptaNet Québec toma medidas razonables para garantizar el correcto funcionamiento y la disponibilidad de su sitio web, portal del cliente y servicios en línea, incluidas las funcionalidades de contabilidad.",
    s4p2:
      "Sin embargo, el acceso al sitio, al portal o a determinadas funcionalidades puede interrumpirse temporalmente debido a mantenimiento, actualizaciones, problemas técnicos o acontecimientos fuera de nuestro control.",

    s5: "5. Enlaces y servicios externos",
    s5p1:
      "El sitio web y el portal pueden contener enlaces a sitios, plataformas o servicios operados por terceros o utilizar servicios tecnológicos proporcionados por terceros.",
    s5p2:
      "ComptaNet Québec no ejerce ningún control sobre el contenido, la disponibilidad, las prácticas o las políticas de privacidad de los servicios externos operados independientemente por dichos terceros.",

    s6: "6. Propiedad intelectual",
    s6p1:
      "Salvo indicación en contrario, los textos, elementos gráficos, logotipos, presentaciones, paneles, funcionalidades originales y demás contenidos propios del sitio web y del portal son propiedad de Les Entreprises Kema Inc. o se utilizan con las autorizaciones necesarias.",
    s6p2:
      "La reproducción, modificación, distribución o utilización comercial no autorizada de estos elementos puede estar prohibida por las leyes aplicables.",

    s7: "7. Condiciones aplicables a los servicios",
    s7p1:
      "Las normas relativas a la preparación de declaraciones, la contabilidad, las responsabilidades del cliente, las suscripciones, las tarifas, los pagos, los plazos, las autorizaciones y las limitaciones de los servicios se describen en nuestras",
    conditions: "Condiciones de servicio",

    s8: "8. Protección de la información personal",
    s8p1:
      "Las prácticas de ComptaNet Québec relativas a la recopilación, utilización, conservación y protección de la información personal, fiscal y financiera se describen en nuestra",
    privacy: "Política de privacidad",

    s9: "9. Modificación del presente aviso",
    s9p1:
      "ComptaNet Québec puede modificar el presente aviso legal para reflejar cambios realizados en el sitio web, el portal, los servicios o los requisitos aplicables.",
    s9p2:
      "La versión publicada en el sitio web constituye la versión vigente.",

    s10: "10. Legislación aplicable",
    s10p1:
      "El presente aviso legal y el uso del sitio web se rigen por las leyes aplicables en la provincia de Québec y por las leyes federales de Canadá aplicables en dicha provincia.",

    s11: "11. Contacto",
    s11p1: "Para cualquier pregunta relacionada con el presente aviso legal:",
    emailLabel: "Correo electrónico",
  },
};

export default function AvisLegalPage() {
  const searchParams = useSearchParams();
  const lang = getLang(searchParams.get("lang"));
  const t = TEXT[lang];

  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const NEQ = "1175912972";
  const MARQUE = "ComptaNet Québec";
  const COURRIEL = "comptanetquebec@gmail.com";

  const conditionsHref = `/legal/conditions?lang=${lang}`;
  const privacyHref = `/legal/confidentialite?lang=${lang}`;

  return (
    <main
      lang={lang}
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
          {t.title}
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            marginBottom: 32,
          }}
        >
          {t.updated}
        </p>

        {/* 1 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>{t.s1}</h2>

          <p style={pStyle}>{t.s1p1}</p>

          <p style={pStyle}>
            <strong>{t.neqLabel} :</strong> {NEQ}
          </p>

          <p style={pStyle}>{t.s1p2}</p>
        </section>

        {/* 2 */}
        <TextSection title={t.s2} paragraphs={[t.s2p1, t.s2p2]} />

        {/* 3 */}
        <TextSection
          title={t.s3}
          paragraphs={[t.s3p1, t.s3p2, t.s3p3]}
        />

        {/* 4 */}
        <TextSection title={t.s4} paragraphs={[t.s4p1, t.s4p2]} />

        {/* 5 */}
        <TextSection title={t.s5} paragraphs={[t.s5p1, t.s5p2]} />

        {/* 6 */}
        <TextSection title={t.s6} paragraphs={[t.s6p1, t.s6p2]} />

        {/* 7 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>{t.s7}</h2>

          <p style={pStyle}>
            {t.s7p1}{" "}
            <Link href={conditionsHref} style={linkStyle}>
              {t.conditions}
            </Link>
            .
          </p>
        </section>

        {/* 8 */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>{t.s8}</h2>

          <p style={pStyle}>
            {t.s8p1}{" "}
            <Link href={privacyHref} style={linkStyle}>
              {t.privacy}
            </Link>
            .
          </p>
        </section>

        {/* 9 */}
        <TextSection title={t.s9} paragraphs={[t.s9p1, t.s9p2]} />

        {/* 10 */}
        <TextSection title={t.s10} paragraphs={[t.s10p1]} />

        {/* 11 */}
        <section>
          <h2 style={h2Style}>{t.s11}</h2>

          <p style={pStyle}>{t.s11p1}</p>

          <p style={pStyle}>
            <strong>{MARQUE}</strong>
            <br />
            {NOM_LEGAL}
            <br />
            NEQ : {NEQ}
            <br />
            {t.emailLabel} :{" "}
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
          <Link href={conditionsHref} style={linkStyle}>
            {t.conditions}
          </Link>

          <Link href={privacyHref} style={linkStyle}>
            {t.privacy}
          </Link>
        </div>
      </section>
    </main>
  );
}

function TextSection({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>{title}</h2>

      {paragraphs.map((paragraph, index) => (
        <p key={index} style={pStyle}>
          {paragraph}
        </p>
      ))}
    </section>
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

