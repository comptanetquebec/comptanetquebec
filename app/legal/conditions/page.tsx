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

const TEXT = {
  fr: {
    pageTitle: "Conditions de service et d’utilisation",
    updated: "Dernière mise à jour : septembre 2026",

    identityTitle: "Identité de l’entreprise",
    identity1: "ComptaNet Québec est une marque exploitée par Les Entreprises Kema Inc., société constituée au Québec.",
    neq: "NEQ : 1175912972",
    identity2:
      "Les services sont offerts principalement en ligne à une clientèle située au Québec.",

    s1: "1. Acceptation des conditions",
    s1p1:
      "En utilisant le site, le portail client ou les services de ComptaNet Québec, vous acceptez les présentes conditions de service et d’utilisation.",
    s1p2:
      "Si vous n’acceptez pas ces conditions, vous devez cesser d’utiliser les services concernés.",

    s2: "2. Nature des services",
    s2p1:
      "ComptaNet Québec offre notamment des services de préparation de déclarations de revenus, des services destinés aux travailleurs autonomes ainsi qu’un service en ligne de tenue de livres et des services connexes, selon le type de dossier ou de forfait choisi.",
    s2p2:
      "Les déclarations fiscales et les services professionnels sont réalisés à partir des renseignements, documents et instructions fournis par le client.",
    s2p3:
      "Le service de tenue de livres permet notamment au client d’enregistrer et de consulter certaines informations financières, incluant des revenus, des dépenses et des données de suivi, et d’accéder à un tableau de bord présentant les renseignements enregistrés dans son compte.",
    s2p4:
      "Sauf entente expresse contraire, les services de ComptaNet Québec ne constituent pas des services juridiques, des conseils en placement ou une opinion juridique.",
    s2p5:
      "Une situation particulière ou complexe peut nécessiter des renseignements supplémentaires ou l’intervention d’un professionnel spécialisé.",

    s3: "3. Responsabilités du client",
    s3p1:
      "Le client est responsable de fournir des renseignements et des documents complets, exacts, lisibles et véridiques.",
    s3p2:
      "Le client doit notamment signaler toute information pouvant avoir une incidence sur sa situation fiscale et répondre aux demandes de renseignements supplémentaires nécessaires au traitement de son dossier.",
    s3p3:
      "Une omission, une erreur ou un document manquant peut modifier le résultat de la déclaration et peut notamment entraîner un nouveau calcul, des intérêts, des pénalités ou une demande de renseignements d’une autorité fiscale.",
    s3p4:
      "Avant la transmission de sa déclaration, le client demeure responsable de vérifier les renseignements qui lui sont présentés pour approbation.",

    s4: "4. Accès au portail et sécurité du compte",
    s4p1:
      "Le client est responsable de préserver la confidentialité de ses identifiants de connexion et de prendre des mesures raisonnables afin d’empêcher l’utilisation non autorisée de son compte.",
    s4p2:
      "Le client ne doit pas permettre à une personne non autorisée d’utiliser son accès au portail.",
    s4p3:
      "Toute utilisation suspecte ou non autorisée du compte devrait être signalée à ComptaNet Québec dès que possible.",

    s5: "5. Documents et renseignements manquants",
    s5p1:
      "Les documents transmis doivent être suffisamment lisibles et complets pour permettre leur traitement.",
    s5p2:
      "ComptaNet Québec peut demander des renseignements, explications ou pièces justificatives supplémentaires lorsqu’ils sont nécessaires à la préparation du dossier.",
    s5p3:
      "Un dossier incomplet peut entraîner un retard et peut empêcher la préparation ou la transmission de la déclaration jusqu’à ce que les renseignements nécessaires aient été reçus.",

    s6: "6. Service de tenue de livres",
    s6p1:
      "Le service de tenue de livres de ComptaNet Québec fournit des outils permettant au client de saisir, classer, conserver et consulter certaines données liées à ses activités financières, notamment ses revenus et ses dépenses.",
    s6p2:
      "Les tableaux de bord, soldes, totaux, rapports, estimations et autres informations présentés dans le portail sont établis à partir des données disponibles dans le système.",
    s6p3:
      "Leur exactitude dépend notamment de l’exactitude, de l’exhaustivité et de la mise à jour des renseignements enregistrés ou transmis par le client.",
    s6p4:
      "Le client demeure responsable de vérifier ses opérations, ses documents, ses catégories comptables et les renseignements financiers associés à son compte et de signaler toute erreur portée à sa connaissance.",
    s6p5:
      "L’utilisation du service de tenue de livres ne remplace pas automatiquement une vérification comptable, une mission d’examen, un audit, une certification des états financiers ou tout autre mandat professionnel qui n’aurait pas été expressément convenu.",
    s6p6:
      "Certaines fonctionnalités peuvent être ajoutées, modifiées, améliorées ou remplacées au fil de l’évolution du service, sous réserve des obligations légales applicables.",

    s7: "7. Abonnement au service de tenue de livres",
    s7p1:
      "Certaines fonctionnalités de tenue de livres peuvent nécessiter un abonnement payant.",
    s7p2:
      "Le prix, la période de facturation et les fonctionnalités comprises dans le forfait sont ceux présentés au client au moment de l’abonnement ou de la modification de son forfait.",
    s7p3:
      "Lorsqu’un abonnement prévoit une facturation récurrente, le mode de paiement autorisé peut être débité à chaque période de facturation jusqu’à la résiliation de l’abonnement, conformément aux modalités présentées lors de la souscription et aux droits prévus par la loi.",
    s7p4:
      "Le client peut demander la résiliation de son abonnement selon les mécanismes disponibles dans son compte ou en communiquant avec ComptaNet Québec.",
    s7p5:
      "La résiliation peut entraîner la perte d’accès à certaines fonctionnalités réservées au forfait payant à la fin de la période applicable. Les renseignements devant être conservés en vertu d’obligations légales peuvent toutefois être conservés pendant la période requise.",

    s8: "8. Tarifs, dépôt et paiement",
    s8intro: "Un dépôt est exigé pour l’ouverture de certains dossiers :",
    t1: "Déclaration T1 (particulier) :",
    ta: "Travailleur autonome :",
    t2: "Déclaration T2 (compagnie incorporée) :",
    plusTaxes: "plus taxes",
    s8p1:
      "Les montants sont indiqués en dollars canadiens (CAD). Les taxes applicables, notamment la TPS et la TVQ, sont ajoutées aux montants indiqués.",
    s8p2:
      "Le dépôt couvre notamment l’ouverture du dossier et le début du traitement. Une fois le traitement commencé, tout ou partie du dépôt peut être non remboursable, sous réserve des droits applicables au consommateur et de la loi.",
    s8p3:
      "Les frais finaux peuvent varier selon la nature et la complexité du dossier, notamment lorsqu’il comporte des revenus multiples, du travail autonome, des revenus locatifs, des corrections, des renseignements manquants ou du travail supplémentaire.",
    s8p4:
      "Lorsque des frais supplémentaires sont nécessaires, le montant applicable est communiqué au client avant la transmission finale de la déclaration.",
    s8p5:
      "Sauf entente contraire, le solde dû doit être payé avant la transmission officielle de la déclaration.",

    s9: "9. Paiements électroniques",
    s9p1:
      "Certains paiements peuvent être effectués au moyen de fournisseurs de services de paiement externes.",
    s9p2:
      "Les renseignements nécessaires au traitement du paiement peuvent alors être traités directement par le fournisseur de paiement conformément à ses propres conditions et politiques.",

    s10: "10. Autorisations, signatures et transmission",
    s10p1:
      "La préparation d’un dossier ne constitue pas automatiquement une autorisation de transmettre une déclaration de revenus.",
    s10p2:
      "Lorsque requis, le client doit examiner et signer les formulaires, autorisations ou déclarations nécessaires avant la transmission de sa déclaration aux autorités fiscales.",
    s10p3:
      "ComptaNet Québec peut suspendre la transmission tant que les autorisations, signatures, renseignements ou paiements nécessaires n’ont pas été reçus.",

    s11: "11. Aucune garantie de résultat fiscal",
    s11p1:
      "Aucun montant précis de remboursement, de crédit, de prestation ou de solde d’impôt ne peut être garanti.",
    s11p2:
      "Les calculs peuvent être modifiés à la suite du traitement, d’une cotisation, d’une nouvelle cotisation, d’une vérification ou d’une décision de l’Agence du revenu du Canada ou de Revenu Québec.",
    s11p3:
      "Les autorités fiscales demeurent responsables du traitement final des déclarations et de l’application des lois fiscales.",

    s12: "12. Délais et disponibilité des services",
    s12p1:
      "Les délais communiqués par ComptaNet Québec sont des estimations et peuvent varier selon la période de l’année, le volume de dossiers, la complexité de la situation et la disponibilité des renseignements nécessaires.",
    s12p2:
      "Les délais de traitement de l’ARC, de Revenu Québec ou de toute autre autorité sont indépendants de ComptaNet Québec et ne peuvent être garantis.",
    s12p3:
      "Le site et le portail peuvent occasionnellement être indisponibles en raison notamment d’entretien, de mises à jour, d’incidents techniques ou de services externes nécessaires à leur fonctionnement.",

    s13: "13. Utilisation acceptable",
    s13p1:
      "Les services ne doivent pas être utilisés à des fins frauduleuses, illégales ou trompeuses.",
    s13p2:
      "Il est notamment interdit de transmettre volontairement de faux renseignements, des documents falsifiés ou de demander à ComptaNet Québec de produire ou transmettre une déclaration que nous savons être fausse ou trompeuse.",

    s14: "14. Refus ou interruption d’un mandat",
    s14p1:
      "ComptaNet Québec peut, sous réserve des obligations légales applicables, refuser, suspendre ou mettre fin à un mandat notamment lorsque :",
    r1: "les renseignements nécessaires ne sont pas fournis;",
    r2: "des renseignements semblent faux, falsifiés ou manifestement incohérents;",
    r3: "le client refuse de fournir une autorisation nécessaire;",
    r4: "les sommes dues ne sont pas payées selon les modalités convenues;",
    r5: "la poursuite du mandat pourrait contrevenir à une obligation légale ou professionnelle;",
    r6: "la collaboration nécessaire au traitement du dossier devient impossible.",

    s15: "15. Protection des renseignements personnels",
    s15p1: "Le traitement des renseignements personnels, fiscaux et financiers est expliqué dans notre",
    privacy: "Politique de confidentialité",
    s15p2:
      "Cette politique explique notamment les renseignements recueillis, leurs utilisations, leur protection, leur conservation ainsi que certains droits des personnes concernées.",

    s16: "16. Limitation de responsabilité",
    s16p1:
      "Dans les limites permises par la loi, ComptaNet Québec ne peut être tenue responsable des conséquences résultant directement de renseignements faux, incomplets, inexacts ou transmis tardivement par le client.",
    s16p2:
      "ComptaNet Québec n’est pas responsable des délais, décisions, interruptions ou problèmes attribuables aux autorités fiscales ou à des services externes qui échappent raisonnablement à son contrôle.",
    s16p3:
      "Les résultats, soldes, rapports et autres informations produits à partir des données de tenue de livres peuvent être inexacts ou incomplets lorsque les renseignements enregistrés dans le système sont eux-mêmes inexacts, incomplets ou non à jour.",
    s16p4:
      "Rien dans les présentes conditions n’a pour effet d’exclure ou de limiter une responsabilité qui ne peut légalement être exclue ou limitée.",

    s17: "17. Propriété intellectuelle",
    s17p1:
      "Sauf indication contraire, les textes, logos, éléments visuels, présentations et fonctionnalités originales du site sont la propriété de Les Entreprises Kema Inc. ou sont utilisés avec les autorisations nécessaires.",
    s17p2:
      "Leur reproduction ou leur utilisation commerciale non autorisée peut être interdite par les lois applicables.",

    s18: "18. Modification des conditions",
    s18p1:
      "ComptaNet Québec peut modifier les présentes conditions afin de tenir compte de changements à ses services, à ses pratiques ou aux exigences applicables.",
    s18p2:
      "La version publiée sur cette page constitue la version en vigueur.",

    s19: "19. Droit applicable",
    s19p1:
      "Les présentes conditions sont régies par les lois applicables dans la province de Québec et les lois fédérales du Canada qui s’y appliquent.",
    s19p2:
      "Rien dans les présentes conditions ne limite les droits ou recours dont une personne bénéficie en vertu d’une loi applicable et auxquels elle ne peut valablement renoncer.",

    s20: "20. Contact",
    contactText: "Pour toute question concernant les présentes conditions :",
    legal: "Avis légal",
  },

  en: {
    pageTitle: "Terms of Service and Use",
    updated: "Last updated: September 2026",

    identityTitle: "Business Identity",
    identity1: "ComptaNet Québec is a brand operated by Les Entreprises Kema Inc., a corporation incorporated in Québec.",
    neq: "NEQ: 1175912972",
    identity2:
      "Services are offered primarily online to clients located in Québec.",

    s1: "1. Acceptance of Terms",
    s1p1:
      "By using the website, client portal or services of ComptaNet Québec, you agree to these Terms of Service and Use.",
    s1p2:
      "If you do not agree to these terms, you must stop using the applicable services.",

    s2: "2. Nature of Services",
    s2p1:
      "ComptaNet Québec offers, among other things, income tax return preparation services, services for self-employed individuals, an online bookkeeping service and related services, depending on the type of file or plan selected.",
    s2p2:
      "Tax returns and professional services are prepared based on the information, documents and instructions provided by the client.",
    s2p3:
      "The bookkeeping service allows clients, among other things, to record and review certain financial information, including income, expenses and tracking data, and to access a dashboard displaying information recorded in their account.",
    s2p4:
      "Unless expressly agreed otherwise, ComptaNet Québec services do not constitute legal services, investment advice or a legal opinion.",
    s2p5:
      "A particular or complex situation may require additional information or the involvement of a specialized professional.",

    s3: "3. Client Responsibilities",
    s3p1:
      "The client is responsible for providing complete, accurate, legible and truthful information and documents.",
    s3p2:
      "The client must report any information that may affect their tax situation and respond to requests for additional information required to process their file.",
    s3p3:
      "An omission, error or missing document may affect the result of a tax return and may result in a reassessment, interest, penalties or a request for information from a tax authority.",
    s3p4:
      "Before a tax return is filed, the client remains responsible for reviewing the information presented for approval.",

    s4: "4. Portal Access and Account Security",
    s4p1:
      "The client is responsible for keeping their login credentials confidential and taking reasonable measures to prevent unauthorized use of their account.",
    s4p2:
      "The client must not allow an unauthorized person to use their portal access.",
    s4p3:
      "Any suspected or unauthorized use of an account should be reported to ComptaNet Québec as soon as possible.",

    s5: "5. Missing Documents and Information",
    s5p1:
      "Documents submitted must be sufficiently legible and complete to allow them to be processed.",
    s5p2:
      "ComptaNet Québec may request additional information, explanations or supporting documents when required to prepare a file.",
    s5p3:
      "An incomplete file may cause delays and may prevent preparation or filing of a tax return until the required information has been received.",

    s6: "6. Bookkeeping Service",
    s6p1:
      "ComptaNet Québec's bookkeeping service provides tools that allow clients to enter, categorize, store and review certain data related to their financial activities, including income and expenses.",
    s6p2:
      "Dashboards, balances, totals, reports, estimates and other information displayed in the portal are generated from the data available in the system.",
    s6p3:
      "Their accuracy therefore depends, among other things, on the accuracy, completeness and currency of the information entered or submitted by the client.",
    s6p4:
      "The client remains responsible for reviewing their transactions, documents, accounting categories and financial information associated with their account and for reporting any errors brought to their attention.",
    s6p5:
      "Use of the bookkeeping service does not automatically constitute or replace an audit, review engagement, certification of financial statements or any other professional engagement that has not been expressly agreed upon.",
    s6p6:
      "Certain features may be added, modified, improved or replaced as the service evolves, subject to applicable legal requirements.",

    s7: "7. Bookkeeping Subscription",
    s7p1:
      "Certain bookkeeping features may require a paid subscription.",
    s7p2:
      "The price, billing period and features included in a plan are those presented to the client when subscribing or changing plans.",
    s7p3:
      "When a subscription includes recurring billing, the authorized payment method may be charged for each billing period until the subscription is cancelled, in accordance with the terms presented at the time of subscription and applicable legal rights.",
    s7p4:
      "The client may request cancellation of their subscription using the mechanisms available in their account or by contacting ComptaNet Québec.",
    s7p5:
      "Cancellation may result in the loss of access to certain paid features at the end of the applicable period. Information that must be retained to comply with legal obligations may nevertheless be retained for the required period.",

    s8: "8. Fees, Deposits and Payment",
    s8intro: "A deposit is required to open certain files:",
    t1: "T1 individual income tax return:",
    ta: "Self-employed:",
    t2: "T2 corporate income tax return:",
    plusTaxes: "plus applicable taxes",
    s8p1:
      "Amounts are stated in Canadian dollars (CAD). Applicable taxes, including GST and QST, are added to the amounts shown.",
    s8p2:
      "The deposit covers, among other things, opening the file and beginning the work. Once work has begun, all or part of the deposit may be non-refundable, subject to applicable consumer rights and law.",
    s8p3:
      "Final fees may vary depending on the nature and complexity of the file, including multiple sources of income, self-employment, rental income, corrections, missing information or additional work.",
    s8p4:
      "When additional fees are required, the applicable amount is communicated to the client before final filing of the return.",
    s8p5:
      "Unless otherwise agreed, the outstanding balance must be paid before the tax return is officially filed.",

    s9: "9. Electronic Payments",
    s9p1:
      "Certain payments may be made through external payment service providers.",
    s9p2:
      "Information required to process a payment may then be processed directly by the payment provider in accordance with its own terms and policies.",

    s10: "10. Authorizations, Signatures and Filing",
    s10p1:
      "Preparation of a file does not automatically constitute authorization to file an income tax return.",
    s10p2:
      "When required, the client must review and sign the necessary forms, authorizations or declarations before their tax return is filed with the tax authorities.",
    s10p3:
      "ComptaNet Québec may suspend filing until the required authorizations, signatures, information or payments have been received.",

    s11: "11. No Guarantee of Tax Results",
    s11p1:
      "No specific amount of refund, credit, benefit or tax balance can be guaranteed.",
    s11p2:
      "Calculations may be changed following processing, an assessment, reassessment, audit or decision by the Canada Revenue Agency or Revenu Québec.",
    s11p3:
      "Tax authorities remain responsible for the final processing of tax returns and the application of tax laws.",

    s12: "12. Timeframes and Service Availability",
    s12p1:
      "Timeframes communicated by ComptaNet Québec are estimates and may vary depending on the time of year, volume of files, complexity of the situation and availability of required information.",
    s12p2:
      "Processing times of the Canada Revenue Agency, Revenu Québec or any other authority are independent of ComptaNet Québec and cannot be guaranteed.",
    s12p3:
      "The website and portal may occasionally be unavailable due to maintenance, updates, technical incidents or external services required for their operation.",

    s13: "13. Acceptable Use",
    s13p1:
      "The services must not be used for fraudulent, illegal or misleading purposes.",
    s13p2:
      "It is prohibited to knowingly submit false information or falsified documents or to ask ComptaNet Québec to prepare or file a return that we know to be false or misleading.",

    s14: "14. Refusal or Termination of an Engagement",
    s14p1:
      "Subject to applicable legal obligations, ComptaNet Québec may refuse, suspend or terminate an engagement, including when:",
    r1: "required information is not provided;",
    r2: "information appears false, falsified or clearly inconsistent;",
    r3: "the client refuses to provide a required authorization;",
    r4: "amounts owing are not paid according to the agreed terms;",
    r5: "continuing the engagement could violate a legal or professional obligation;",
    r6: "the cooperation required to process the file becomes impossible.",

    s15: "15. Protection of Personal Information",
    s15p1:
      "The processing of personal, tax and financial information is explained in our",
    privacy: "Privacy Policy",
    s15p2:
      "This policy explains, among other things, the information collected, how it is used, protected and retained, as well as certain rights of the individuals concerned.",

    s16: "16. Limitation of Liability",
    s16p1:
      "To the extent permitted by law, ComptaNet Québec cannot be held responsible for consequences resulting directly from false, incomplete, inaccurate or late information provided by the client.",
    s16p2:
      "ComptaNet Québec is not responsible for delays, decisions, interruptions or problems attributable to tax authorities or external services that are reasonably beyond its control.",
    s16p3:
      "Results, balances, reports and other information produced from bookkeeping data may be inaccurate or incomplete when the information recorded in the system is itself inaccurate, incomplete or out of date.",
    s16p4:
      "Nothing in these terms excludes or limits any liability that cannot legally be excluded or limited.",

    s17: "17. Intellectual Property",
    s17p1:
      "Unless otherwise indicated, the texts, logos, visual elements, presentations and original features of the website are the property of Les Entreprises Kema Inc. or are used with the necessary authorizations.",
    s17p2:
      "Their unauthorized reproduction or commercial use may be prohibited by applicable laws.",

    s18: "18. Changes to These Terms",
    s18p1:
      "ComptaNet Québec may modify these terms to reflect changes to its services, practices or applicable requirements.",
    s18p2:
      "The version published on this page is the version currently in effect.",

    s19: "19. Applicable Law",
    s19p1:
      "These terms are governed by the laws applicable in the Province of Québec and the federal laws of Canada applicable therein.",
    s19p2:
      "Nothing in these terms limits any rights or remedies available to a person under applicable law that cannot validly be waived.",

    s20: "20. Contact",
    contactText: "For any questions regarding these terms:",
    legal: "Legal Notice",
  },

  es: {
    pageTitle: "Condiciones de servicio y uso",
    updated: "Última actualización: septiembre de 2026",

    identityTitle: "Identidad de la empresa",
    identity1:
      "ComptaNet Québec es una marca operada por Les Entreprises Kema Inc., sociedad constituida en Québec.",
    neq: "NEQ: 1175912972",
    identity2:
      "Los servicios se ofrecen principalmente en línea a clientes ubicados en Québec.",

    s1: "1. Aceptación de las condiciones",
    s1p1:
      "Al utilizar el sitio web, el portal del cliente o los servicios de ComptaNet Québec, usted acepta las presentes condiciones de servicio y uso.",
    s1p2:
      "Si no acepta estas condiciones, debe dejar de utilizar los servicios correspondientes.",

    s2: "2. Naturaleza de los servicios",
    s2p1:
      "ComptaNet Québec ofrece, entre otros, servicios de preparación de declaraciones de impuestos, servicios para trabajadores autónomos, un servicio de contabilidad en línea y servicios relacionados, según el tipo de expediente o plan seleccionado.",
    s2p2:
      "Las declaraciones fiscales y los servicios profesionales se realizan a partir de la información, los documentos y las instrucciones proporcionados por el cliente.",
    s2p3:
      "El servicio de contabilidad permite al cliente, entre otras cosas, registrar y consultar determinada información financiera, incluidos ingresos, gastos y datos de seguimiento, y acceder a un panel que muestra la información registrada en su cuenta.",
    s2p4:
      "Salvo acuerdo expreso en contrario, los servicios de ComptaNet Québec no constituyen servicios jurídicos, asesoramiento en inversiones ni una opinión jurídica.",
    s2p5:
      "Una situación particular o compleja puede requerir información adicional o la intervención de un profesional especializado.",

    s3: "3. Responsabilidades del cliente",
    s3p1:
      "El cliente es responsable de proporcionar información y documentos completos, exactos, legibles y verídicos.",
    s3p2:
      "El cliente debe comunicar cualquier información que pueda afectar su situación fiscal y responder a las solicitudes de información adicional necesaria para tramitar su expediente.",
    s3p3:
      "Una omisión, un error o un documento faltante puede modificar el resultado de una declaración y puede dar lugar, entre otras cosas, a un nuevo cálculo, intereses, sanciones o una solicitud de información de una autoridad fiscal.",
    s3p4:
      "Antes de presentar su declaración, el cliente sigue siendo responsable de verificar la información que se le presenta para su aprobación.",

    s4: "4. Acceso al portal y seguridad de la cuenta",
    s4p1:
      "El cliente es responsable de mantener la confidencialidad de sus credenciales de acceso y de tomar medidas razonables para impedir el uso no autorizado de su cuenta.",
    s4p2:
      "El cliente no debe permitir que una persona no autorizada utilice su acceso al portal.",
    s4p3:
      "Cualquier uso sospechoso o no autorizado de la cuenta debe comunicarse a ComptaNet Québec lo antes posible.",

    s5: "5. Documentos e información faltantes",
    s5p1:
      "Los documentos enviados deben ser suficientemente legibles y completos para permitir su procesamiento.",
    s5p2:
      "ComptaNet Québec puede solicitar información, explicaciones o documentos justificativos adicionales cuando sean necesarios para preparar el expediente.",
    s5p3:
      "Un expediente incompleto puede provocar retrasos e impedir la preparación o presentación de la declaración hasta que se haya recibido la información necesaria.",

    s6: "6. Servicio de contabilidad",
    s6p1:
      "El servicio de contabilidad de ComptaNet Québec proporciona herramientas que permiten al cliente ingresar, clasificar, conservar y consultar determinados datos relacionados con sus actividades financieras, incluidos sus ingresos y gastos.",
    s6p2:
      "Los paneles, saldos, totales, informes, estimaciones y demás información presentada en el portal se generan a partir de los datos disponibles en el sistema.",
    s6p3:
      "Por lo tanto, su exactitud depende, entre otras cosas, de la exactitud, integridad y actualización de la información registrada o proporcionada por el cliente.",
    s6p4:
      "El cliente sigue siendo responsable de verificar sus operaciones, documentos, categorías contables e información financiera asociada a su cuenta y de comunicar cualquier error del que tenga conocimiento.",
    s6p5:
      "El uso del servicio de contabilidad no constituye ni sustituye automáticamente una auditoría, un encargo de revisión, una certificación de estados financieros ni ningún otro encargo profesional que no haya sido expresamente acordado.",
    s6p6:
      "Algunas funcionalidades pueden añadirse, modificarse, mejorarse o sustituirse a medida que evoluciona el servicio, sujeto a las obligaciones legales aplicables.",

    s7: "7. Suscripción al servicio de contabilidad",
    s7p1:
      "Algunas funcionalidades de contabilidad pueden requerir una suscripción de pago.",
    s7p2:
      "El precio, el período de facturación y las funcionalidades incluidas en el plan son los que se presentan al cliente al suscribirse o modificar su plan.",
    s7p3:
      "Cuando una suscripción incluye facturación recurrente, el método de pago autorizado puede cargarse en cada período de facturación hasta la cancelación de la suscripción, de acuerdo con las condiciones presentadas al momento de la suscripción y los derechos previstos por la ley.",
    s7p4:
      "El cliente puede solicitar la cancelación de su suscripción mediante los mecanismos disponibles en su cuenta o comunicándose con ComptaNet Québec.",
    s7p5:
      "La cancelación puede provocar la pérdida de acceso a determinadas funcionalidades de pago al finalizar el período aplicable. Sin embargo, la información que deba conservarse para cumplir obligaciones legales podrá conservarse durante el período requerido.",

    s8: "8. Tarifas, depósito y pago",
    s8intro: "Se requiere un depósito para abrir determinados expedientes:",
    t1: "Declaración T1 (particular):",
    ta: "Trabajador autónomo:",
    t2: "Declaración T2 (sociedad incorporada):",
    plusTaxes: "más impuestos aplicables",
    s8p1:
      "Los importes se indican en dólares canadienses (CAD). Los impuestos aplicables, incluidos GST y QST, se añaden a los importes indicados.",
    s8p2:
      "El depósito cubre, entre otras cosas, la apertura del expediente y el inicio del trabajo. Una vez iniciado el trabajo, la totalidad o una parte del depósito puede no ser reembolsable, sujeto a los derechos del consumidor y a la legislación aplicable.",
    s8p3:
      "Los honorarios finales pueden variar según la naturaleza y complejidad del expediente, especialmente cuando incluye múltiples fuentes de ingresos, trabajo autónomo, ingresos por alquiler, correcciones, información faltante o trabajo adicional.",
    s8p4:
      "Cuando se requieren honorarios adicionales, el importe aplicable se comunica al cliente antes de la presentación final de la declaración.",
    s8p5:
      "Salvo acuerdo en contrario, el saldo adeudado debe pagarse antes de la presentación oficial de la declaración.",

    s9: "9. Pagos electrónicos",
    s9p1:
      "Algunos pagos pueden realizarse mediante proveedores externos de servicios de pago.",
    s9p2:
      "La información necesaria para procesar el pago puede ser tratada directamente por el proveedor de pago de acuerdo con sus propias condiciones y políticas.",

    s10: "10. Autorizaciones, firmas y presentación",
    s10p1:
      "La preparación de un expediente no constituye automáticamente una autorización para presentar una declaración de impuestos.",
    s10p2:
      "Cuando sea necesario, el cliente debe revisar y firmar los formularios, autorizaciones o declaraciones necesarios antes de presentar su declaración ante las autoridades fiscales.",
    s10p3:
      "ComptaNet Québec puede suspender la presentación hasta que se hayan recibido las autorizaciones, firmas, información o pagos necesarios.",

    s11: "11. Ausencia de garantía sobre el resultado fiscal",
    s11p1:
      "No puede garantizarse ningún importe específico de reembolso, crédito, prestación o saldo de impuestos.",
    s11p2:
      "Los cálculos pueden modificarse tras el procesamiento, una liquidación, una nueva liquidación, una verificación o una decisión de la Agencia de Ingresos de Canadá o Revenu Québec.",
    s11p3:
      "Las autoridades fiscales siguen siendo responsables del procesamiento final de las declaraciones y de la aplicación de las leyes fiscales.",

    s12: "12. Plazos y disponibilidad de los servicios",
    s12p1:
      "Los plazos comunicados por ComptaNet Québec son estimaciones y pueden variar según la época del año, el volumen de expedientes, la complejidad de la situación y la disponibilidad de la información necesaria.",
    s12p2:
      "Los plazos de procesamiento de la Agencia de Ingresos de Canadá, Revenu Québec o cualquier otra autoridad son independientes de ComptaNet Québec y no pueden garantizarse.",
    s12p3:
      "El sitio web y el portal pueden estar ocasionalmente no disponibles debido, entre otras cosas, a mantenimiento, actualizaciones, incidentes técnicos o servicios externos necesarios para su funcionamiento.",

    s13: "13. Uso aceptable",
    s13p1:
      "Los servicios no deben utilizarse con fines fraudulentos, ilegales o engañosos.",
    s13p2:
      "Está prohibido proporcionar deliberadamente información falsa o documentos falsificados, o solicitar a ComptaNet Québec que prepare o presente una declaración que sepamos que es falsa o engañosa.",

    s14: "14. Rechazo o interrupción de un mandato",
    s14p1:
      "Sujeto a las obligaciones legales aplicables, ComptaNet Québec puede rechazar, suspender o poner fin a un mandato, especialmente cuando:",
    r1: "no se proporciona la información necesaria;",
    r2: "la información parece falsa, falsificada o manifiestamente incoherente;",
    r3: "el cliente se niega a proporcionar una autorización necesaria;",
    r4: "las cantidades adeudadas no se pagan según las condiciones acordadas;",
    r5: "la continuación del mandato podría infringir una obligación legal o profesional;",
    r6: "la colaboración necesaria para tramitar el expediente se vuelve imposible.",

    s15: "15. Protección de la información personal",
    s15p1:
      "El tratamiento de la información personal, fiscal y financiera se explica en nuestra",
    privacy: "Política de privacidad",
    s15p2:
      "Esta política explica, entre otras cosas, la información recopilada, su utilización, protección y conservación, así como determinados derechos de las personas interesadas.",

    s16: "16. Limitación de responsabilidad",
    s16p1:
      "En la medida permitida por la ley, ComptaNet Québec no puede ser considerada responsable de las consecuencias derivadas directamente de información falsa, incompleta, inexacta o proporcionada tardíamente por el cliente.",
    s16p2:
      "ComptaNet Québec no es responsable de retrasos, decisiones, interrupciones o problemas atribuibles a las autoridades fiscales o a servicios externos que estén razonablemente fuera de su control.",
    s16p3:
      "Los resultados, saldos, informes y demás información producida a partir de los datos contables pueden ser inexactos o incompletos cuando la información registrada en el sistema sea inexacta, incompleta o no esté actualizada.",
    s16p4:
      "Nada de lo dispuesto en estas condiciones excluye o limita una responsabilidad que legalmente no pueda excluirse o limitarse.",

    s17: "17. Propiedad intelectual",
    s17p1:
      "Salvo indicación en contrario, los textos, logotipos, elementos visuales, presentaciones y funcionalidades originales del sitio son propiedad de Les Entreprises Kema Inc. o se utilizan con las autorizaciones necesarias.",
    s17p2:
      "Su reproducción o utilización comercial no autorizada puede estar prohibida por las leyes aplicables.",

    s18: "18. Modificación de las condiciones",
    s18p1:
      "ComptaNet Québec puede modificar estas condiciones para reflejar cambios en sus servicios, prácticas o requisitos aplicables.",
    s18p2:
      "La versión publicada en esta página constituye la versión vigente.",

    s19: "19. Legislación aplicable",
    s19p1:
      "Estas condiciones se rigen por las leyes aplicables en la provincia de Québec y por las leyes federales de Canadá aplicables en dicha provincia.",
    s19p2:
      "Nada de lo dispuesto en estas condiciones limita los derechos o recursos de los que una persona pueda beneficiarse en virtud de una ley aplicable y a los que no pueda renunciar válidamente.",

    s20: "20. Contacto",
    contactText: "Para cualquier pregunta relacionada con estas condiciones:",
    legal: "Aviso legal",
  },
} satisfies Record<Lang, Record<string, string>>;

export default function ConditionsPage() {
  const searchParams = useSearchParams();
  const lang = getLang(searchParams.get("lang"));
  const t = TEXT[lang];

  const bleu = "#004aad";

  const NOM_LEGAL = "Les Entreprises Kema Inc.";
  const MARQUE = "ComptaNet Québec";
  const NEQ = "1175912972";
  const COURRIEL = "info@comptanetquebec.com";

  const legalHref = `/legal/avis-legal?lang=${lang}`;
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
          {t.pageTitle}
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {t.updated}
        </p>

        <section style={boxStyle}>
          <h2 style={{ ...h2Style, marginBottom: 10 }}>
            {t.identityTitle}
          </h2>
          <p style={pStyle}>{t.identity1}</p>
          <p style={pStyle}>{t.neq}</p>
          <p style={{ ...pStyle, marginBottom: 0 }}>{t.identity2}</p>
        </section>

        <TextSection title={t.s1} paragraphs={[t.s1p1, t.s1p2]} />

        <TextSection
          title={t.s2}
          paragraphs={[t.s2p1, t.s2p2, t.s2p3, t.s2p4, t.s2p5]}
        />

        <TextSection
          title={t.s3}
          paragraphs={[t.s3p1, t.s3p2, t.s3p3, t.s3p4]}
        />

        <TextSection
          title={t.s4}
          paragraphs={[t.s4p1, t.s4p2, t.s4p3]}
        />

        <TextSection
          title={t.s5}
          paragraphs={[t.s5p1, t.s5p2, t.s5p3]}
        />

        <TextSection
          title={t.s6}
          paragraphs={[
            t.s6p1,
            t.s6p2,
            t.s6p3,
            t.s6p4,
            t.s6p5,
            t.s6p6,
          ]}
        />

        <TextSection
          title={t.s7}
          paragraphs={[t.s7p1, t.s7p2, t.s7p3, t.s7p4, t.s7p5]}
        />

        <section style={sectionStyle}>
          <h2 style={h2Style}>{t.s8}</h2>

          <p style={pStyle}>{t.s8intro}</p>

          <ul style={ulStyle}>
            <li>
              {t.t1} <strong>100 $ {t.plusTaxes}</strong>
            </li>
            <li>
              {t.ta} <strong>150 $ {t.plusTaxes}</strong>
            </li>
            <li>
              {t.t2} <strong>450 $ {t.plusTaxes}</strong>
            </li>
          </ul>

          {[t.s8p1, t.s8p2, t.s8p3, t.s8p4, t.s8p5].map((p, i) => (
            <p key={i} style={pStyle}>
              {p}
            </p>
          ))}
        </section>

        <TextSection title={t.s9} paragraphs={[t.s9p1, t.s9p2]} />

        <TextSection
          title={t.s10}
          paragraphs={[t.s10p1, t.s10p2, t.s10p3]}
        />

        <TextSection
          title={t.s11}
          paragraphs={[t.s11p1, t.s11p2, t.s11p3]}
        />

        <TextSection
          title={t.s12}
          paragraphs={[t.s12p1, t.s12p2, t.s12p3]}
        />

        <TextSection title={t.s13} paragraphs={[t.s13p1, t.s13p2]} />

        <section style={sectionStyle}>
          <h2 style={h2Style}>{t.s14}</h2>
          <p style={pStyle}>{t.s14p1}</p>

          <ul style={ulStyle}>
            <li>{t.r1}</li>
            <li>{t.r2}</li>
            <li>{t.r3}</li>
            <li>{t.r4}</li>
            <li>{t.r5}</li>
            <li>{t.r6}</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>{t.s15}</h2>

          <p style={pStyle}>
            {t.s15p1}{" "}
            <Link href={privacyHref} style={linkStyle}>
              {t.privacy}
            </Link>
            .
          </p>

          <p style={pStyle}>{t.s15p2}</p>
        </section>

        <TextSection
          title={t.s16}
          paragraphs={[t.s16p1, t.s16p2, t.s16p3, t.s16p4]}
        />

        <TextSection title={t.s17} paragraphs={[t.s17p1, t.s17p2]} />

        <TextSection title={t.s18} paragraphs={[t.s18p1, t.s18p2]} />

        <TextSection title={t.s19} paragraphs={[t.s19p1, t.s19p2]} />

        <section>
          <h2 style={h2Style}>{t.s20}</h2>

          <p style={pStyle}>{t.contactText}</p>

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
            {t.legal}
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

