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

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Translation = {
  title: string;
  updated: string;
  sections: Section[];
  privacyOfficer: string;
  emailLabel: string;
  legalNotice: string;
  terms: string;
};

const TEXT: Record<Lang, Translation> = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : septembre 2026",
    privacyOfficer:
      "Responsable de la protection des renseignements personnels",
    emailLabel: "Courriel",
    legalNotice: "Avis légal",
    terms: "Conditions de service",

    sections: [
      {
        title: "1. Qui nous sommes",
        paragraphs: [
          "ComptaNet Québec est une marque exploitée par Les Entreprises Kema Inc., société constituée au Québec.",
          "NEQ : 1175912972",
          "ComptaNet Québec offre notamment des services de préparation et de transmission de déclarations de revenus, des services destinés aux travailleurs autonomes, des services de tenue de livres en ligne ainsi que des services connexes.",
        ],
      },
      {
        title:
          "2. Renseignements personnels que nous pouvons recueillir",
        paragraphs: [
          "Selon les services demandés et votre situation, nous pouvons recueillir les renseignements nécessaires au traitement de votre dossier ou à l’utilisation de nos services, notamment :",
        ],
        bullets: [
          "vos renseignements d’identification et coordonnées, notamment votre nom, adresse, courriel et numéro de téléphone;",
          "votre numéro d’assurance sociale (NAS) lorsqu’il est nécessaire à la préparation ou à la transmission de votre déclaration;",
          "votre date de naissance, état civil et certains renseignements concernant votre conjoint ou vos personnes à charge;",
          "vos renseignements fiscaux, financiers et professionnels;",
          "vos feuillets et documents fiscaux, notamment T4, relevés, reçus, pièces justificatives et autres documents nécessaires;",
          "les renseignements relatifs à une entreprise, un travail autonome ou des revenus de location lorsque ces renseignements sont nécessaires à votre dossier;",
          "dans le cadre du service de tenue de livres, les revenus, dépenses, dates, montants, descriptions, catégories comptables, pièces justificatives et autres renseignements financiers que vous enregistrez ou transmettez;",
          "les renseignements que vous fournissez dans nos formulaires, notre portail, par courriel ou lors de communications avec nous;",
          "certains renseignements techniques nécessaires au fonctionnement et à la sécurité de nos services en ligne.",
        ],
      },
      {
        title: "3. Pourquoi nous utilisons vos renseignements",
        paragraphs: [
          "Les renseignements recueillis peuvent notamment être utilisés pour :",
        ],
        bullets: [
          "ouvrir, administrer et traiter votre dossier;",
          "préparer vos déclarations de revenus et les documents connexes;",
          "fournir et administrer le service de tenue de livres;",
          "enregistrer, classer et présenter les revenus, dépenses et autres données financières dans votre compte;",
          "produire les tableaux de bord, totaux, soldes, rapports et autres informations disponibles dans le portail;",
          "vérifier la cohérence des renseignements et documents fournis;",
          "communiquer avec vous au sujet de votre dossier ou de votre abonnement;",
          "transmettre les renseignements requis aux autorités fiscales lorsque vous nous autorisez à effectuer une transmission;",
          "fournir les services que vous avez demandés;",
          "protéger nos systèmes, prévenir les accès non autorisés et assurer la sécurité de nos services;",
          "respecter nos obligations légales, fiscales, comptables, administratives et réglementaires.",
        ],
      },
      {
        title: "4. Utilisation de l’intelligence artificielle",
        paragraphs: [
          "ComptaNet Québec peut utiliser des outils d’intelligence artificielle à titre d’assistance pour analyser, classer, organiser ou résumer certains renseignements et documents fournis afin de faciliter le traitement d’un dossier ou certaines fonctions de tenue de livres.",
          "L’intelligence artificielle ne prend aucune décision fiscale de façon autonome. Lorsqu’une information produite à l’aide de ces outils est utilisée dans la préparation d’une déclaration de revenus, elle est vérifiée par une personne.",
          "Le numéro d’assurance sociale (NAS) n’est pas transmis à l’outil d’intelligence artificielle utilisé pour l’analyse du formulaire fiscal.",
        ],
      },
      {
        title: "5. Communication de renseignements à des tiers",
        paragraphs: [
          "ComptaNet Québec ne vend ni ne loue les renseignements personnels de ses clients.",
          "Certains renseignements peuvent toutefois être communiqués lorsque cela est nécessaire, notamment :",
        ],
        bullets: [
          "à l’Agence du revenu du Canada, à Revenu Québec ou à une autre autorité compétente lorsque cela est nécessaire au service demandé et autorisé;",
          "à des fournisseurs technologiques ou prestataires de services qui nous aident notamment à exploiter, héberger, sécuriser ou fournir notre site, notre portail, notre service de tenue de livres ou nos systèmes;",
          "à des fournisseurs de services de paiement lorsque cela est nécessaire au traitement d’un paiement ou d’un abonnement;",
          "lorsque la communication est requise ou permise par la loi;",
          "avec votre consentement lorsque celui-ci est requis.",
        ],
      },
      {
        title: "6. Fournisseurs de services",
        paragraphs: [
          "Lorsque des fournisseurs traitent des renseignements personnels pour notre compte, nous cherchons à limiter leur accès aux renseignements nécessaires à l’exécution des services concernés.",
          "Ces fournisseurs peuvent notamment être utilisés pour l’hébergement, les bases de données, l’authentification, les paiements, l’envoi de communications, la sécurité ou certaines fonctionnalités technologiques.",
        ],
      },
      {
        title:
          "7. Hébergement et traitement à l’extérieur du Québec",
        paragraphs: [
          "Certains fournisseurs technologiques utilisés par ComptaNet Québec peuvent traiter ou conserver des renseignements à l’extérieur du Québec ou du Canada.",
          "Lorsque les exigences légales applicables l’exigent, ComptaNet Québec prend les mesures nécessaires avant une telle communication, notamment en évaluant les facteurs relatifs à la vie privée et les mesures de protection applicables.",
        ],
      },
      {
        title:
          "8. Témoins de connexion (cookies) et technologies similaires",
        paragraphs: [
          "ComptaNet Québec utilise des témoins de connexion (« cookies ») et des technologies similaires lorsqu’ils sont nécessaires au fonctionnement, à la sécurité et à la protection du site et du portail client.",
          "Ces technologies peuvent notamment être utilisées pour maintenir une session utilisateur, permettre l’accès à certaines fonctionnalités, sécuriser les services en ligne et prévenir les accès automatisés ou frauduleux.",
          "Le site utilise notamment Google reCAPTCHA afin de contribuer à la détection et à la prévention des accès automatisés, des abus et des tentatives frauduleuses. Dans le cadre de ce service, Google peut utiliser des témoins ou des technologies similaires et traiter certains renseignements techniques conformément à ses propres politiques.",
          "Certains fournisseurs technologiques nécessaires au fonctionnement du portail ou au traitement des paiements peuvent également utiliser des témoins ou des technologies similaires nécessaires à la prestation de leurs services.",
          "ComptaNet Québec n’utilise pas ces technologies à des fins de publicité ciblée. Si des technologies de suivi publicitaire ou de mesure nécessitant un consentement sont ajoutées ultérieurement, les mécanismes de consentement requis seront mis en place.",
        ],
      },
      {
        title: "9. Sécurité des renseignements",
        paragraphs: [
          "ComptaNet Québec met en place des mesures administratives, techniques et organisationnelles raisonnables afin de protéger les renseignements personnels, fiscaux et financiers contre la perte, le vol ainsi que l’accès, l’utilisation ou la communication non autorisés.",
          "L’accès aux renseignements personnels doit être limité aux personnes et fournisseurs qui en ont besoin dans le cadre de leurs fonctions ou des services qu’ils fournissent.",
          "Malgré ces mesures, aucun système informatique ni aucune transmission sur Internet ne peut être garanti comme étant entièrement exempt de risques.",
        ],
      },
      {
        title: "10. Incidents de confidentialité",
        paragraphs: [
          "En cas d’incident de confidentialité impliquant des renseignements personnels, ComptaNet Québec prend les mesures raisonnables nécessaires afin de réduire les risques de préjudice et d’éviter qu’un incident de même nature se reproduise.",
          "Lorsque la loi l’exige, les personnes concernées ainsi que les autorités compétentes sont avisées de l’incident.",
        ],
      },
      {
        title: "11. Conservation et destruction",
        paragraphs: [
          "Les renseignements personnels, fiscaux, financiers et de tenue de livres sont conservés pendant la période nécessaire aux fins pour lesquelles ils ont été recueillis et pour respecter les obligations légales, fiscales, comptables ou administratives applicables.",
          "La fermeture d’un compte ou la résiliation d’un abonnement n’entraîne pas nécessairement la destruction immédiate de tous les renseignements lorsqu’une période de conservation est nécessaire ou exigée.",
          "Lorsqu’ils ne sont plus nécessaires et que leur conservation n’est plus requise, les renseignements sont détruits de façon sécuritaire ou traités conformément aux exigences légales applicables.",
        ],
      },
      {
        title: "12. Vos droits",
        paragraphs: [
          "Sous réserve des conditions et exceptions prévues par la loi, vous pouvez notamment demander :",
        ],
        bullets: [
          "l’accès aux renseignements personnels que nous détenons à votre sujet;",
          "la rectification de renseignements personnels inexacts, incomplets ou équivoques;",
          "des renseignements concernant l’utilisation et la communication de vos renseignements personnels;",
          "le retrait de votre consentement lorsque le traitement concerné repose sur votre consentement et que la loi permet son retrait.",
        ],
      },
      {
        title: "13. Retrait du consentement",
        paragraphs: [
          "Le retrait de certains consentements peut empêcher ComptaNet Québec de fournir ou de poursuivre certains services lorsque les renseignements concernés sont nécessaires à leur exécution.",
        ],
      },
      {
        title:
          "14. Responsable de la protection des renseignements personnels",
        paragraphs: [
          "Les demandes relatives à l’accès, à la rectification, à la confidentialité ou à l’exercice de vos droits peuvent être adressées au responsable de la protection des renseignements personnels.",
        ],
      },
      {
        title: "15. Plaintes et questions",
        paragraphs: [
          "Toute question, préoccupation ou plainte concernant la protection de vos renseignements personnels peut être transmise au responsable de la protection des renseignements personnels.",
        ],
      },
      {
        title: "16. Modification de cette politique",
        paragraphs: [
          "Cette politique peut être modifiée afin de refléter des changements à nos pratiques, à nos services ou aux exigences légales applicables.",
          "La date de la dernière mise à jour est indiquée au début de la politique. Toute modification importante sera portée à l’attention des personnes concernées par un moyen approprié lorsque requis.",
        ],
      },
    ],
  },

  en: {
    title: "Privacy Policy",
    updated: "Last updated: September 2026",
    privacyOfficer: "Privacy Officer",
    emailLabel: "Email",
    legalNotice: "Legal Notice",
    terms: "Terms of Service",

    sections: [
      {
        title: "1. Who We Are",
        paragraphs: [
          "ComptaNet Québec is a brand operated by Les Entreprises Kema Inc., a corporation incorporated in Québec.",
          "NEQ: 1175912972",
          "ComptaNet Québec offers, among other things, income tax return preparation and filing services, services for self-employed individuals, online bookkeeping services and related services.",
        ],
      },
      {
        title: "2. Personal Information We May Collect",
        paragraphs: [
          "Depending on the services requested and your situation, we may collect information required to process your file or provide our services, including:",
        ],
        bullets: [
          "identification and contact information, including your name, address, email address and telephone number;",
          "your Social Insurance Number (SIN) when required to prepare or file your tax return;",
          "your date of birth, marital status and certain information concerning your spouse or dependants;",
          "tax, financial and professional information;",
          "tax slips and documents, including T4 slips, statements, receipts, supporting documents and other required documents;",
          "information relating to a business, self-employment or rental income when required for your file;",
          "for the bookkeeping service, income, expenses, dates, amounts, descriptions, accounting categories, supporting documents and other financial information that you enter or submit;",
          "information you provide through our forms, portal, email or communications with us;",
          "certain technical information required for the operation and security of our online services.",
        ],
      },
      {
        title: "3. Why We Use Your Information",
        paragraphs: [
          "Information collected may be used to:",
        ],
        bullets: [
          "open, administer and process your file;",
          "prepare your income tax returns and related documents;",
          "provide and administer the bookkeeping service;",
          "record, categorize and display income, expenses and other financial data in your account;",
          "generate dashboards, totals, balances, reports and other information available through the portal;",
          "verify the consistency of information and documents provided;",
          "communicate with you regarding your file or subscription;",
          "submit required information to tax authorities when you authorize us to do so;",
          "provide the services you requested;",
          "protect our systems, prevent unauthorized access and maintain the security of our services;",
          "comply with applicable legal, tax, accounting, administrative and regulatory obligations.",
        ],
      },
      {
        title: "4. Use of Artificial Intelligence",
        paragraphs: [
          "ComptaNet Québec may use artificial intelligence tools as an aid to analyze, categorize, organize or summarize certain information and documents provided in order to facilitate file processing or certain bookkeeping functions.",
          "Artificial intelligence does not make autonomous tax decisions. When information produced with these tools is used in preparing an income tax return, it is reviewed by a person.",
          "The Social Insurance Number (SIN) is not transmitted to the artificial intelligence tool used to analyze the tax form.",
        ],
      },
      {
        title: "5. Disclosure of Information to Third Parties",
        paragraphs: [
          "ComptaNet Québec does not sell or rent its clients’ personal information.",
          "Certain information may nevertheless be disclosed when necessary, including:",
        ],
        bullets: [
          "to the Canada Revenue Agency, Revenu Québec or another competent authority when necessary for an authorized service;",
          "to technology providers or service providers that assist us in operating, hosting, securing or providing our website, portal, bookkeeping service or systems;",
          "to payment service providers when necessary to process a payment or subscription;",
          "when disclosure is required or permitted by law;",
          "with your consent when consent is required.",
        ],
      },
      {
        title: "6. Service Providers",
        paragraphs: [
          "When service providers process personal information on our behalf, we seek to limit their access to the information necessary to perform the applicable services.",
          "These providers may be used for hosting, databases, authentication, payments, communications, security or certain technological functions.",
        ],
      },
      {
        title: "7. Hosting and Processing Outside Québec",
        paragraphs: [
          "Certain technology providers used by ComptaNet Québec may process or store information outside Québec or Canada.",
          "When required by applicable law, ComptaNet Québec takes the necessary measures before such disclosure, including assessing privacy-related factors and applicable safeguards.",
        ],
      },
      {
        title: "8. Cookies and Similar Technologies",
        paragraphs: [
          "ComptaNet Québec uses cookies and similar technologies when necessary for the operation, security and protection of the website and client portal.",
          "These technologies may be used to maintain user sessions, provide access to certain features, secure online services and prevent automated or fraudulent access.",
          "The website uses Google reCAPTCHA to help detect and prevent automated access, abuse and fraudulent attempts. Google may use cookies or similar technologies and process certain technical information in accordance with its own policies.",
          "Technology providers required for portal operation or payment processing may also use cookies or similar technologies necessary to provide their services.",
          "ComptaNet Québec does not use these technologies for targeted advertising. If advertising tracking or measurement technologies requiring consent are added in the future, the required consent mechanisms will be implemented.",
        ],
      },
      {
        title: "9. Information Security",
        paragraphs: [
          "ComptaNet Québec implements reasonable administrative, technical and organizational measures to protect personal, tax and financial information against loss, theft and unauthorized access, use or disclosure.",
          "Access to personal information is intended to be limited to persons and providers who require it to perform their functions or services.",
          "Despite these measures, no computer system or Internet transmission can be guaranteed to be entirely free of risk.",
        ],
      },
      {
        title: "10. Privacy Incidents",
        paragraphs: [
          "In the event of a privacy incident involving personal information, ComptaNet Québec takes reasonable measures to reduce the risk of harm and prevent similar incidents from recurring.",
          "When required by law, affected individuals and competent authorities are notified.",
        ],
      },
      {
        title: "11. Retention and Destruction",
        paragraphs: [
          "Personal, tax, financial and bookkeeping information is retained for the period necessary for the purposes for which it was collected and to comply with applicable legal, tax, accounting or administrative obligations.",
          "Closing an account or cancelling a subscription does not necessarily result in the immediate destruction of all information when a retention period is necessary or required.",
          "When information is no longer required and retention is no longer necessary, it is securely destroyed or otherwise handled in accordance with applicable legal requirements.",
        ],
      },
      {
        title: "12. Your Rights",
        paragraphs: [
          "Subject to the conditions and exceptions provided by law, you may request:",
        ],
        bullets: [
          "access to personal information we hold about you;",
          "correction of inaccurate, incomplete or ambiguous personal information;",
          "information regarding the use and disclosure of your personal information;",
          "withdrawal of your consent when the processing is based on consent and the law permits its withdrawal.",
        ],
      },
      {
        title: "13. Withdrawal of Consent",
        paragraphs: [
          "Withdrawal of certain consents may prevent ComptaNet Québec from providing or continuing certain services when the information concerned is necessary to perform those services.",
        ],
      },
      {
        title: "14. Privacy Officer",
        paragraphs: [
          "Requests relating to access, correction, privacy or the exercise of your rights may be addressed to the Privacy Officer.",
        ],
      },
      {
        title: "15. Complaints and Questions",
        paragraphs: [
          "Any question, concern or complaint regarding the protection of your personal information may be submitted to the Privacy Officer.",
        ],
      },
      {
        title: "16. Changes to This Policy",
        paragraphs: [
          "This policy may be modified to reflect changes to our practices, services or applicable legal requirements.",
          "The date of the latest update appears at the beginning of this policy. Any significant change will be brought to the attention of affected individuals by an appropriate means when required.",
        ],
      },
    ],
  },

  es: {
    title: "Política de privacidad",
    updated: "Última actualización: septiembre de 2026",
    privacyOfficer:
      "Responsable de la protección de la información personal",
    emailLabel: "Correo electrónico",
    legalNotice: "Aviso legal",
    terms: "Condiciones de servicio",

    sections: [
      {
        title: "1. Quiénes somos",
        paragraphs: [
          "ComptaNet Québec es una marca operada por Les Entreprises Kema Inc., sociedad constituida en Québec.",
          "NEQ: 1175912972",
          "ComptaNet Québec ofrece, entre otros, servicios de preparación y presentación de declaraciones de impuestos, servicios para trabajadores autónomos, servicios de contabilidad en línea y servicios relacionados.",
        ],
      },
      {
        title: "2. Información personal que podemos recopilar",
        paragraphs: [
          "Según los servicios solicitados y su situación, podemos recopilar la información necesaria para tramitar su expediente o prestar nuestros servicios, incluida:",
        ],
        bullets: [
          "información de identificación y contacto, incluido su nombre, dirección, correo electrónico y número de teléfono;",
          "su número de seguro social (NAS/SIN) cuando sea necesario para preparar o presentar su declaración de impuestos;",
          "su fecha de nacimiento, estado civil y determinada información sobre su cónyuge o personas a cargo;",
          "información fiscal, financiera y profesional;",
          "formularios y documentos fiscales, incluidos T4, comprobantes, recibos, documentos justificativos y otros documentos necesarios;",
          "información relacionada con una empresa, trabajo autónomo o ingresos por alquiler cuando sea necesaria para su expediente;",
          "para el servicio de contabilidad, ingresos, gastos, fechas, importes, descripciones, categorías contables, documentos justificativos y demás información financiera que registre o proporcione;",
          "información proporcionada mediante nuestros formularios, portal, correo electrónico o comunicaciones con nosotros;",
          "determinada información técnica necesaria para el funcionamiento y la seguridad de nuestros servicios en línea.",
        ],
      },
      {
        title: "3. Por qué utilizamos su información",
        paragraphs: [
          "La información recopilada puede utilizarse para:",
        ],
        bullets: [
          "abrir, administrar y tramitar su expediente;",
          "preparar sus declaraciones de impuestos y documentos relacionados;",
          "proporcionar y administrar el servicio de contabilidad;",
          "registrar, clasificar y presentar ingresos, gastos y otros datos financieros en su cuenta;",
          "generar paneles, totales, saldos, informes y demás información disponible en el portal;",
          "verificar la coherencia de la información y los documentos proporcionados;",
          "comunicarnos con usted sobre su expediente o suscripción;",
          "transmitir la información requerida a las autoridades fiscales cuando usted nos autorice a hacerlo;",
          "proporcionar los servicios solicitados;",
          "proteger nuestros sistemas, prevenir accesos no autorizados y garantizar la seguridad de nuestros servicios;",
          "cumplir nuestras obligaciones legales, fiscales, contables, administrativas y reglamentarias.",
        ],
      },
      {
        title: "4. Uso de inteligencia artificial",
        paragraphs: [
          "ComptaNet Québec puede utilizar herramientas de inteligencia artificial como asistencia para analizar, clasificar, organizar o resumir determinada información y documentos proporcionados con el fin de facilitar la tramitación de un expediente o determinadas funciones de contabilidad.",
          "La inteligencia artificial no toma decisiones fiscales de forma autónoma. Cuando la información producida mediante estas herramientas se utiliza en la preparación de una declaración de impuestos, es revisada por una persona.",
          "El número de seguro social (NAS/SIN) no se transmite a la herramienta de inteligencia artificial utilizada para analizar el formulario fiscal.",
        ],
      },
      {
        title: "5. Comunicación de información a terceros",
        paragraphs: [
          "ComptaNet Québec no vende ni alquila la información personal de sus clientes.",
          "Sin embargo, determinada información puede comunicarse cuando sea necesario, incluido:",
        ],
        bullets: [
          "a la Agencia de Ingresos de Canadá, Revenu Québec u otra autoridad competente cuando sea necesario para un servicio solicitado y autorizado;",
          "a proveedores tecnológicos o prestadores de servicios que nos ayudan a operar, alojar, proteger o proporcionar nuestro sitio web, portal, servicio de contabilidad o sistemas;",
          "a proveedores de servicios de pago cuando sea necesario para procesar un pago o una suscripción;",
          "cuando la comunicación sea exigida o permitida por la ley;",
          "con su consentimiento cuando este sea necesario.",
        ],
      },
      {
        title: "6. Proveedores de servicios",
        paragraphs: [
          "Cuando proveedores tratan información personal por nuestra cuenta, procuramos limitar su acceso a la información necesaria para prestar los servicios correspondientes.",
          "Estos proveedores pueden utilizarse para alojamiento, bases de datos, autenticación, pagos, comunicaciones, seguridad o determinadas funciones tecnológicas.",
        ],
      },
      {
        title: "7. Alojamiento y tratamiento fuera de Québec",
        paragraphs: [
          "Algunos proveedores tecnológicos utilizados por ComptaNet Québec pueden tratar o conservar información fuera de Québec o Canadá.",
          "Cuando lo exija la legislación aplicable, ComptaNet Québec adopta las medidas necesarias antes de dicha comunicación, incluida la evaluación de factores relacionados con la privacidad y las medidas de protección aplicables.",
        ],
      },
      {
        title: "8. Cookies y tecnologías similares",
        paragraphs: [
          "ComptaNet Québec utiliza cookies y tecnologías similares cuando son necesarias para el funcionamiento, la seguridad y la protección del sitio web y del portal del cliente.",
          "Estas tecnologías pueden utilizarse para mantener sesiones de usuario, permitir el acceso a determinadas funciones, proteger los servicios en línea y prevenir accesos automatizados o fraudulentos.",
          "El sitio utiliza Google reCAPTCHA para ayudar a detectar y prevenir accesos automatizados, abusos e intentos fraudulentos. Google puede utilizar cookies o tecnologías similares y tratar determinada información técnica de acuerdo con sus propias políticas.",
          "Los proveedores tecnológicos necesarios para el funcionamiento del portal o el procesamiento de pagos también pueden utilizar cookies o tecnologías similares necesarias para prestar sus servicios.",
          "ComptaNet Québec no utiliza estas tecnologías con fines de publicidad dirigida. Si en el futuro se añaden tecnologías publicitarias o de medición que requieran consentimiento, se implementarán los mecanismos de consentimiento necesarios.",
        ],
      },
      {
        title: "9. Seguridad de la información",
        paragraphs: [
          "ComptaNet Québec aplica medidas administrativas, técnicas y organizativas razonables para proteger la información personal, fiscal y financiera contra pérdida, robo, acceso, uso o comunicación no autorizados.",
          "El acceso a la información personal debe limitarse a las personas y proveedores que la necesiten para desempeñar sus funciones o prestar sus servicios.",
          "A pesar de estas medidas, ningún sistema informático ni transmisión por Internet puede garantizarse como totalmente libre de riesgos.",
        ],
      },
      {
        title: "10. Incidentes de privacidad",
        paragraphs: [
          "En caso de un incidente de privacidad relacionado con información personal, ComptaNet Québec adopta medidas razonables para reducir el riesgo de perjuicio y evitar que se repita un incidente de la misma naturaleza.",
          "Cuando la ley lo exige, se informa a las personas afectadas y a las autoridades competentes.",
        ],
      },
      {
        title: "11. Conservación y destrucción",
        paragraphs: [
          "La información personal, fiscal, financiera y contable se conserva durante el período necesario para los fines para los que fue recopilada y para cumplir las obligaciones legales, fiscales, contables o administrativas aplicables.",
          "El cierre de una cuenta o la cancelación de una suscripción no implica necesariamente la destrucción inmediata de toda la información cuando sea necesario o exigido un período de conservación.",
          "Cuando la información deja de ser necesaria y su conservación ya no es requerida, se destruye de forma segura o se trata de conformidad con los requisitos legales aplicables.",
        ],
      },
      {
        title: "12. Sus derechos",
        paragraphs: [
          "Sujeto a las condiciones y excepciones previstas por la ley, usted puede solicitar:",
        ],
        bullets: [
          "acceso a la información personal que conservamos sobre usted;",
          "rectificación de información personal inexacta, incompleta o ambigua;",
          "información sobre el uso y la comunicación de su información personal;",
          "retiro de su consentimiento cuando el tratamiento se base en su consentimiento y la ley permita retirarlo.",
        ],
      },
      {
        title: "13. Retiro del consentimiento",
        paragraphs: [
          "El retiro de determinados consentimientos puede impedir que ComptaNet Québec proporcione o continúe determinados servicios cuando la información correspondiente sea necesaria para prestarlos.",
        ],
      },
      {
        title:
          "14. Responsable de la protección de la información personal",
        paragraphs: [
          "Las solicitudes relacionadas con acceso, rectificación, privacidad o ejercicio de sus derechos pueden dirigirse al responsable de la protección de la información personal.",
        ],
      },
      {
        title: "15. Quejas y preguntas",
        paragraphs: [
          "Cualquier pregunta, inquietud o queja relacionada con la protección de su información personal puede enviarse al responsable de la protección de la información personal.",
        ],
      },
      {
        title: "16. Modificación de esta política",
        paragraphs: [
          "Esta política puede modificarse para reflejar cambios en nuestras prácticas, servicios o requisitos legales aplicables.",
          "La fecha de la última actualización aparece al principio de esta política. Cualquier modificación importante se comunicará a las personas afectadas por un medio apropiado cuando sea necesario.",
        ],
      },
    ],
  },
};

export default function ConfidentialitePage() {
  const searchParams = useSearchParams();
  const lang = getLang(searchParams.get("lang"));
  const t = TEXT[lang];

  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const NEQ = "1175912972";
  const MARQUE = "ComptaNet Québec";
  const COURRIEL = "comptanetquebec@gmail.com";

  const legalHref = `/legal/avis-legal?lang=${lang}`;
  const termsHref = `/legal/conditions?lang=${lang}`;

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

        {t.sections.map((section, index) => (
          <section key={index} style={sectionStyle}>
            <h2 style={h2Style}>{section.title}</h2>

            {section.paragraphs?.map((paragraph, pIndex) => (
              <p key={pIndex} style={pStyle}>
                {paragraph}
              </p>
            ))}

            {section.bullets && (
              <ul style={ulStyle}>
                {section.bullets.map((bullet, bIndex) => (
                  <li key={bIndex}>{bullet}</li>
                ))}
              </ul>
            )}

            {index === 13 && (
              <p style={pStyle}>
                <strong>{t.privacyOfficer}</strong>
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
            )}

            {index === 14 && (
              <p style={pStyle}>
                <a href={`mailto:${COURRIEL}`} style={linkStyle}>
                  {COURRIEL}
                </a>
              </p>
            )}
          </section>
        ))}

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
          <Link href={legalHref} style={linkStyle}>
            {t.legalNotice}
          </Link>

          <Link href={termsHref} style={linkStyle}>
            {t.terms}
          </Link>
        </div>

        <div
          style={{
            marginTop: 24,
            color: "#6b7280",
            fontSize: 12,
          }}
        >
          {MARQUE} — {NOM_LEGAL} — NEQ {NEQ}
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

