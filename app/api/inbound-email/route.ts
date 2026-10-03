import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const FORWARD_TO = "comptanetquebec@gmail.com";

const ALLOWED_RECIPIENTS = [
  "info@comptanetquebec.com",
  "contact@comptanetquebec.com",
];

const OPENAI_MODEL = "gpt-5.6-luna";

type TriageCategory = "auto" | "manual" | "priority";
type CustomerReplyType = "ai" | "acknowledgement" | "none";

type ResendAttachment = {
  id?: string;
  filename?: string | null;
  content_type?: string;
  content_id?: string | null;
  content_disposition?: string | null;
  size?: number;
  download_url?: string;
  path?: string;
};

type ForwardAttachment = {
  path: string;
  filename: string;
  content_type?: string;
  content_id?: string;
};

type ResendEvent = {
  type: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    attachments?: ResendAttachment[];
  };
};

type AIDecision = {
  category: TriageCategory;
  message: string;
};

/* =========================================================
   WEBHOOK PRINCIPAL
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const resendApiKey = process.env.RESEND_ADMIN_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!webhookSecret || !resendApiKey) {
      console.error("Variables Resend manquantes");

      return new NextResponse("Configuration manquante", {
        status: 500,
      });
    }

    /* =====================================================
       VÉRIFICATION DU WEBHOOK
    ===================================================== */

    const rawBody = await req.text();

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new NextResponse("Webhook invalide", {
        status: 400,
      });
    }

    const valid = verifyWebhookSignature({
      rawBody,
      id: svixId,
      timestamp: svixTimestamp,
      signatureHeader: svixSignature,
      secret: webhookSecret,
    });

    if (!valid) {
      return new NextResponse("Signature invalide", {
        status: 400,
      });
    }

    const event = JSON.parse(rawBody) as ResendEvent;

    if (event.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    /* =====================================================
       VÉRIFIER L'ADRESSE DESTINATAIRE
    ===================================================== */

    const recipients = (event.data.to ?? []).map((email) =>
      email.toLowerCase().trim()
    );

    const destination = recipients.find((email) =>
      ALLOWED_RECIPIENTS.includes(email)
    );

    if (!destination) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    /* =====================================================
       RÉCUPÉRER LE COURRIEL COMPLET
    ===================================================== */

    const emailResponse = await fetch(
      `https://api.resend.com/emails/receiving/${event.data.email_id}`,
      {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
        cache: "no-store",
      }
    );

    if (!emailResponse.ok) {
      console.error(
        "Erreur récupération courriel :",
        await emailResponse.text()
      );

      return new NextResponse(
        "Impossible de récupérer le courriel",
        { status: 500 }
      );
    }

    const email: any = await emailResponse.json();

    const senderRaw =
      email.reply_to?.[0] ||
      email.from ||
      event.data.from ||
      "";

    const senderEmail = extractEmail(senderRaw);

    const subject =
      email.subject ||
      event.data.subject ||
      "(Sans objet)";

    const emailText = String(
      email.text ||
        stripHtml(email.html || "")
    ).trim();

    /* =====================================================
       PIÈCES JOINTES
    ===================================================== */

    const attachmentMetadata: ResendAttachment[] =
      Array.isArray(email.attachments) &&
      email.attachments.length > 0
        ? email.attachments
        : event.data.attachments ?? [];

    const hasAnyAttachments =
      attachmentMetadata.length > 0;

    /*
     * Une image intégrée dans une signature courriel
     * ne doit pas automatiquement transformer
     * le message en dossier manuel.
     */
    const hasUserAttachments =
      attachmentMetadata.some((attachment) => {
        const disposition =
          attachment.content_disposition?.toLowerCase();

        return disposition !== "inline";
      });

    /*
     * On récupère toutes les pièces jointes,
     * y compris les images inline, afin que
     * le courriel transféré reste complet.
     */
    let forwardedAttachments: ForwardAttachment[] = [];

    if (hasAnyAttachments) {
      try {
        forwardedAttachments =
          await getForwardableAttachments({
            apiKey: resendApiKey,
            emailId: event.data.email_id,
            fallback: attachmentMetadata,
          });
      } catch (error) {
        /*
         * On ne transfère jamais un courriel
         * en perdant silencieusement ses documents.
         * Le HTTP 500 permet à Resend de réessayer.
         */
        console.error(
          "Erreur récupération pièces jointes :",
          error
        );

        return new NextResponse(
          "Impossible de récupérer les pièces jointes",
          { status: 500 }
        );
      }
    }

    /* =====================================================
       BLOQUER LES AUTO-RÉPONSES INDÉSIRABLES
    ===================================================== */

    const blockedSender =
      !senderEmail ||
      shouldNeverAutoReply(senderEmail) ||
      isAutomatedMessage(
        email.headers,
        senderEmail
      );

    /* =====================================================
       TRIAGE
    ===================================================== */

    let category: TriageCategory;
    let aiReplyText = "";

    const ruleCategory = classifyByRules({
      subject,
      text: emailText,
      hasUserAttachments,
    });

    if (blockedSender) {
      category = "manual";
    } else if (ruleCategory) {
      category = ruleCategory;
    } else if (!openaiApiKey || !emailText) {
      category = "manual";
    } else {
      /*
       * Seuls les messages administratifs généraux
       * qui ont passé nos filtres arrivent à OpenAI.
       */
      try {
        const decision = await getAIReply({
          apiKey: openaiApiKey,
          destination,
          subject,
          message: emailText,
        });

        category = decision.category;

        if (category === "auto") {
          aiReplyText = decision.message.trim();

          if (!aiReplyText) {
            category = "manual";
          }
        }
      } catch (error) {
        console.error("Erreur OpenAI :", error);
        category = "manual";
      }
    }

    /* =====================================================
       RÉPONSE AU CLIENT
    ===================================================== */

    let customerReplyType: CustomerReplyType = "none";
    let customerReplySent = false;

    /*
     * AUTO-RÉPONSE IA
     */
    if (
      category === "auto" &&
      aiReplyText &&
      !blockedSender
    ) {
      const replyResult = await sendResendEmail({
        apiKey: resendApiKey,
        idempotencyKey:
          `inbound-auto-reply/${event.data.email_id}`,
        payload: {
          from:
            "ComptaNet Québec <contact@comptanetquebec.com>",

          to: [senderEmail],

          reply_to: destination,

          subject: makeReplySubject(subject),

          text: aiReplyText,

          html: `
            <div style="
              font-family:Arial,sans-serif;
              font-size:15px;
              line-height:1.65;
              color:#222;
            ">
              ${formatTextAsHtml(aiReplyText)}
            </div>
          `,
        },
      });

      if (replyResult.ok) {
        customerReplyType = "ai";
        customerReplySent = true;
      } else {
        /*
         * Si l'auto-réponse échoue,
         * on classe le courriel À RÉPONDRE
         * afin que Gmail ne dise pas faussement
         * qu'il a été auto-répondu.
         */
        console.error(
          "Erreur réponse automatique :",
          replyResult.data
        );

        category = "manual";
      }
    }

    /*
     * ACCUSÉ DE RÉCEPTION
     * pour MANUEL ou PRIORITÉ
     */
    if (
      (category === "manual" ||
        category === "priority") &&
      !blockedSender
    ) {
      const language = detectLanguage(
        `${subject}\n${emailText}`
      );

      const acknowledgement = getAcknowledgement({
        language,
        priority: category === "priority",
      });

      const acknowledgementResult =
        await sendResendEmail({
          apiKey: resendApiKey,

          idempotencyKey:
            `inbound-ack/${event.data.email_id}`,

          payload: {
            from:
              "ComptaNet Québec <contact@comptanetquebec.com>",

            to: [senderEmail],

            reply_to: destination,

            subject: makeReplySubject(subject),

            text: acknowledgement,

            html: `
              <div style="
                font-family:Arial,sans-serif;
                font-size:15px;
                line-height:1.65;
                color:#222;
              ">
                ${formatTextAsHtml(
                  acknowledgement
                )}
              </div>
            `,
          },
        });

      if (acknowledgementResult.ok) {
        customerReplyType =
          "acknowledgement";

        customerReplySent = true;
      } else {
        console.error(
          "Erreur accusé réception :",
          acknowledgementResult.data
        );
      }
    }

    /* =====================================================
       TRANSFERT VERS TON GMAIL
    ===================================================== */

    const label = getLabel(category);

    const gmailSubject =
      `${label} ${subject}`;

    const bannerColor =
      category === "priority"
        ? "#b42318"
        : category === "auto"
        ? "#16803c"
        : "#c27a00";

    const bannerText =
      category === "priority"
        ? "PRIORITÉ — intervention requise"
        : category === "auto"
        ? "AUTO-RÉPONDU — aucune action requise"
        : "À RÉPONDRE — intervention requise";

    const attachmentInfo =
      forwardedAttachments.length > 0
        ? `
          <br>
          <strong>Pièce(s) jointe(s) :</strong>
          ${forwardedAttachments.length}
        `
        : "";

    const forwardHtml = `
      <div style="
        font-family:Arial,sans-serif;
        background:#f5f7fa;
        border-left:5px solid ${bannerColor};
        padding:14px 18px;
        margin-bottom:20px;
        line-height:1.55;
      ">
        <div style="
          font-size:16px;
          font-weight:700;
          color:${bannerColor};
          margin-bottom:8px;
        ">
          ${escapeHtml(bannerText)}
        </div>

        <strong>Adresse :</strong>
        ${escapeHtml(destination)}
        <br>

        <strong>De :</strong>
        ${escapeHtml(senderRaw)}
        <br>

        <strong>Sujet original :</strong>
        ${escapeHtml(subject)}

        ${attachmentInfo}
      </div>

      ${
        email.html ||
        `<div style="
          font-family:Arial,sans-serif;
          white-space:pre-wrap;
        ">${escapeHtml(emailText)}</div>`
      }
    `;

    const forwardText =
      `${bannerText}\n\n` +
      `Adresse : ${destination}\n` +
      `De : ${senderRaw}\n` +
      `Sujet original : ${subject}\n` +
      `Pièces jointes : ${forwardedAttachments.length}\n\n` +
      emailText;

    const forwardResult = await sendResendEmail({
      apiKey: resendApiKey,

      idempotencyKey:
        `inbound-forward/${event.data.email_id}`,

      payload: {
        from:
          "ComptaNet Québec <contact@comptanetquebec.com>",

        to: [FORWARD_TO],

        /*
         * Dans Gmail, Répondre renverra
         * directement au vrai client.
         */
        reply_to:
          senderEmail ||
          senderRaw,

        subject: gmailSubject,

        html: forwardHtml,

        text: forwardText,

        attachments:
          forwardedAttachments.length > 0
            ? forwardedAttachments
            : undefined,
      },
    });

    if (!forwardResult.ok) {
      console.error(
        "Erreur transfert Gmail :",
        forwardResult.data
      );

      return NextResponse.json(
        {
          ok: false,
          step: "forward",
          error: forwardResult.data,
        },
        { status: 500 }
      );
    }

    /* =====================================================
       RÉSULTAT
    ===================================================== */

    return NextResponse.json({
      ok: true,
      forwarded: true,
      category,
      customerReplySent,
      customerReplyType,
      attachmentsForwarded:
        forwardedAttachments.length,
      originalRecipient: destination,
      forwardId: forwardResult.data?.id,
    });
  } catch (error) {
    console.error(
      "Erreur inbound email :",
      error
    );

    return new NextResponse(
      "Erreur webhook",
      {
        status: 400,
      }
    );
  }
}

/* =========================================================
   PIÈCES JOINTES RESEND
========================================================= */

async function getForwardableAttachments({
  apiKey,
  emailId,
  fallback,
}: {
  apiKey: string;
  emailId: string;
  fallback: ResendAttachment[];
}): Promise<ForwardAttachment[]> {
  /*
   * Resend fournit un endpoint pour lister
   * les pièces jointes du courriel reçu.
   */
  const listResponse = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}/attachments?limit=100`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  let listedAttachments: ResendAttachment[] = [];

  if (listResponse.ok) {
    const listData: any =
      await listResponse
        .json()
        .catch(() => null);

    if (Array.isArray(listData?.data)) {
      listedAttachments =
        listData.data;
    }
  } else {
    console.error(
      "Erreur liste pièces jointes :",
      await listResponse.text()
    );
  }

  /*
   * Si la liste ne retourne rien,
   * on utilise les métadonnées du webhook.
   */
  const source =
    listedAttachments.length > 0
      ? listedAttachments
      : fallback;

  if (source.length === 0) {
    return [];
  }

  const attachments =
    await Promise.all(
      source.map(
        async (
          attachment,
          index
        ): Promise<ForwardAttachment> => {
          let details: any =
            attachment;

          /*
           * Selon la réponse API,
           * download_url peut déjà être présent.
           * Sinon on récupère le détail
           * de cette pièce jointe.
           */
          if (
            !details.download_url &&
            !details.path &&
            attachment.id
          ) {
            const detailResponse =
              await fetch(
                `https://api.resend.com/emails/receiving/${emailId}/attachments/${attachment.id}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${apiKey}`,
                  },
                  cache: "no-store",
                }
              );

            if (
              !detailResponse.ok
            ) {
              throw new Error(
                `Impossible de récupérer la pièce jointe ${attachment.id}`
              );
            }

            const detailData: any =
              await detailResponse
                .json()
                .catch(() => null);

            details =
              detailData?.data ??
              detailData ??
              attachment;
          }

          const downloadUrl =
            details.download_url ||
            details.path ||
            attachment.download_url ||
            attachment.path;

          if (!downloadUrl) {
            throw new Error(
              `Aucune URL de téléchargement pour la pièce jointe ${
                attachment.filename ||
                attachment.id ||
                index + 1
              }`
            );
          }

          const filename =
            details.filename ||
            attachment.filename ||
            `piece-jointe-${index + 1}`;

          const contentType =
            details.content_type ||
            attachment.content_type;

          const contentId =
            details.content_id ||
            attachment.content_id;

          return {
            /*
             * Resend récupère lui-même
             * le fichier à partir de cette URL.
             * On évite ainsi de charger les PDF
             * en mémoire dans Vercel.
             */
            path: downloadUrl,

            filename,

            ...(contentType
              ? {
                  content_type:
                    contentType,
                }
              : {}),

            ...(contentId
              ? {
                  content_id:
                    contentId,
                }
              : {}),
          };
        }
      )
    );

  return attachments;
}

/* =========================================================
   TRIAGE PAR RÈGLES
========================================================= */

function classifyByRules({
  subject,
  text,
  hasUserAttachments,
}: {
  subject: string;
  text: string;
  hasUserAttachments: boolean;
}): TriageCategory | null {
  const value =
    `${subject}\n${text}`.toLowerCase();

  /*
   * PRIORITÉ
   */
  const priorityTerms =
    /\b(urgent|urgence|urgentement|aujourd'hui|aujourd’hui|demain|échéance|echeance|deadline|mise en demeure|saisie|garnishment|plainte|complaint|avocat|lawyer|audit|vérification fiscale|verification fiscale|revenu québec|revenu quebec|canada revenue agency|agence du revenu du canada|arc|cra|avis de cotisation|notice of assessment|paiement refusé|paiement refuse|payment declined|carte refusée|carte refusee)\b/i;

  if (priorityTerms.test(value)) {
    return "priority";
  }

  /*
   * NAS canadien
   */
  if (
    /\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/.test(
      value
    )
  ) {
    return "manual";
  }

  /*
   * Cartes / comptes / longues séries numériques
   */
  if (
    /(?:\d[ -]*?){13,19}/.test(
      value
    )
  ) {
    return "manual";
  }

  /*
   * Un vrai document joint =
   * intervention humaine.
   *
   * Les images inline d'une signature
   * ne comptent pas.
   */
  if (hasUserAttachments) {
    return "manual";
  }

  /*
   * Fiscalité / dossier personnel
   */
  const sensitiveTerms =
    /\b(NAS|SIN|social insurance|assurance sociale|T1|T2|T3|T4|T4A|T5|RL[- ]?\d+|TP[- ]?\d+|imp[oô]t|impots|tax return|déclaration de revenus|declaration de revenus|déduction|deduction|crédit d'impôt|credit d'impot|tax credit|cotisation|pension alimentaire|revenu|income|salaire|salary|travailleur autonome|self-employed|TPS|TVQ|GST|QST|remboursement d'impôt|remboursement d'impot|tax refund)\b/i;

  if (sensitiveTerms.test(value)) {
    return "manual";
  }

  return null;
}

/* =========================================================
   IA COMPTANET QUÉBEC
========================================================= */

async function getAIReply({
  apiKey,
  destination,
  subject,
  message,
}: {
  apiKey: string;
  destination: string;
  subject: string;
  message: string;
}): Promise<AIDecision> {
  const instructions = `
Tu es le service à la clientèle automatisé de ComptaNet Québec.

Le message qui t'est transmis a déjà passé un filtre de sécurité.
Les questions fiscales personnelles et les données sensibles ne devraient normalement pas t'être transmises.

Tu dois classer le courriel dans UNE catégorie :

1. "auto"
Tu peux répondre immédiatement avec certitude.

2. "manual"
Une personne de ComptaNet Québec doit intervenir.

3. "priority"
Une personne doit intervenir rapidement.

UTILISE "auto" pour les questions administratives générales, par exemple :

- comment créer un compte;
- comment accéder à l'Espace client;
- comment transmettre des documents;
- comment ajouter plus tard des documents manquants;
- comment utiliser le site;
- problème général de connexion;
- question générale sur le fonctionnement;
- demande de confirmation de réception;
- demande générale de contact.

Informations vérifiées que tu peux utiliser :

- l'entreprise s'appelle ComptaNet Québec;
- le site officiel est https://www.comptanetquebec.com;
- les clients peuvent utiliser leur Espace client;
- ils répondent aux questions directement en ligne;
- ils peuvent transmettre leurs documents dans l'Espace client;
- ils peuvent revenir plus tard pour ajouter des documents manquants.

UTILISE "manual" si :

- tu ne connais pas la réponse avec certitude;
- le client demande un prix qui n'est pas fourni ici;
- une décision professionnelle est nécessaire;
- la demande concerne un dossier particulier;
- le client affirme qu'une information de son dossier est incorrecte;
- tu dois consulter des données qui ne sont pas dans le courriel.

UTILISE "priority" si :

- le client indique une échéance imminente;
- il y a une plainte sérieuse;
- il y a un problème important de paiement;
- la situation nécessite clairement une intervention rapide.

RÈGLES ABSOLUES :

- ne jamais inventer;
- ne jamais deviner;
- ne jamais donner de conseil fiscal personnalisé;
- ne jamais prétendre avoir consulté le dossier du client;
- ne jamais demander un NAS par courriel;
- ne jamais demander un numéro de carte bancaire par courriel;
- ne jamais promettre un délai précis;
- répondre dans la même langue que le client;
- réponse courte, professionnelle et claire;
- signer : ComptaNet Québec.
`;

  /*
   * On masque certaines données évidentes
   * avant de les transmettre au modèle.
   */
  const sanitizedSubject =
    sanitizeForAI(subject);

  const sanitizedMessage =
    sanitizeForAI(message);

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${apiKey}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        model: OPENAI_MODEL,

        store: false,

        max_output_tokens: 450,

        instructions,

        /*
         * Structured Outputs :
         * le modèle doit retourner
         * exactement notre structure JSON.
         */
        text: {
          format: {
            type: "json_schema",
            name: "comptanet_email_triage",
            strict: true,
            schema: {
              type: "object",

              properties: {
                category: {
                  type: "string",
                  enum: [
                    "auto",
                    "manual",
                    "priority",
                  ],
                },

                message: {
                  type: "string",
                },
              },

              required: [
                "category",
                "message",
              ],

              additionalProperties:
                false,
            },
          },
        },

        input:
          `Adresse ComptaNet : ${destination}\n` +
          `Sujet : ${sanitizedSubject}\n\n` +
          `Message :\n${sanitizedMessage}`,
      }),
    }
  );

  const data: any =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      `OpenAI ${response.status}: ${JSON.stringify(
        data
      )}`
    );
  }

  const output =
    extractOpenAIText(data);

  if (!output) {
    throw new Error(
      "Réponse OpenAI vide"
    );
  }

  return parseAIJSON(output);
}

/* =========================================================
   ACCUSÉS DE RÉCEPTION
========================================================= */

function getAcknowledgement({
  language,
  priority,
}: {
  language: "fr" | "en" | "es";
  priority: boolean;
}) {
  if (language === "en") {
    return priority
      ? `Hello,

We have received your message. It requires priority review by ComptaNet Québec.

Your message has been forwarded for verification.

Thank you,

ComptaNet Québec`
      : `Hello,

We have received your message. It requires verification by ComptaNet Québec.

Your message has been forwarded for review.

Thank you,

ComptaNet Québec`;
  }

  if (language === "es") {
    return priority
      ? `Hola,

Hemos recibido su mensaje. Requiere una revisión prioritaria por parte de ComptaNet Québec.

Su mensaje ha sido enviado para verificación.

Gracias,

ComptaNet Québec`
      : `Hola,

Hemos recibido su mensaje. Requiere una verificación por parte de ComptaNet Québec.

Su mensaje ha sido enviado para revisión.

Gracias,

ComptaNet Québec`;
  }

  return priority
    ? `Bonjour,

Nous avons bien reçu votre message. Celui-ci nécessite une vérification prioritaire par ComptaNet Québec.

Votre message a été transmis pour vérification.

Merci,

ComptaNet Québec`
    : `Bonjour,

Nous avons bien reçu votre message. Celui-ci nécessite une vérification par ComptaNet Québec.

Votre message a été transmis pour traitement.

Merci,

ComptaNet Québec`;
}

/* =========================================================
   DÉTECTION DE LANGUE
========================================================= */

function detectLanguage(
  value: string
): "fr" | "en" | "es" {
  const text =
    value.toLowerCase();

  let fr = 0;
  let en = 0;
  let es = 0;

  const frenchWords = [
    "bonjour",
    "merci",
    " je ",
    " vous ",
    " mon ",
    " mes ",
    "comment",
    "pourquoi",
    "document",
    "impôt",
    "compte",
    "déclaration",
    "revenu",
  ];

  const englishWords = [
    "hello",
    " hi ",
    "thank",
    "thanks",
    " my ",
    " how ",
    " what ",
    "please",
    "account",
    "documents",
    "income",
    "tax",
  ];

  const spanishWords = [
    "hola",
    "gracias",
    "por favor",
    "cómo",
    "como ",
    " mi ",
    " mis ",
    "cuenta",
    "documentos",
    "quiero",
  ];

  for (const word of frenchWords) {
    if (text.includes(word)) fr++;
  }

  for (const word of englishWords) {
    if (text.includes(word)) en++;
  }

  for (const word of spanishWords) {
    if (text.includes(word)) es++;
  }

  if (
    es > fr &&
    es > en
  ) {
    return "es";
  }

  if (
    en > fr &&
    en > es
  ) {
    return "en";
  }

  return "fr";
}

/* =========================================================
   CATÉGORIES DANS L'OBJET GMAIL
========================================================= */

function getLabel(
  category: TriageCategory
) {
  if (category === "auto") {
    return "[AUTO-RÉPONDU]";
  }

  if (category === "priority") {
    return "[PRIORITÉ]";
  }

  return "[À RÉPONDRE]";
}

/* =========================================================
   EXPÉDITEURS À NE JAMAIS AUTO-RÉPONDRE
========================================================= */

function shouldNeverAutoReply(
  senderEmail: string
) {
  const email =
    senderEmail.toLowerCase();

  if (
    email ===
    FORWARD_TO.toLowerCase()
  ) {
    return true;
  }

  if (
    email.endsWith(
      "@comptanetquebec.com"
    )
  ) {
    return true;
  }

  const blockedPatterns = [
    "mailer-daemon",
    "postmaster",
    "no-reply",
    "noreply",
    "no_reply",
    "auto-reply",
    "autoreply",
    "notification",
    "notifications",
  ];

  return blockedPatterns.some(
    (pattern) =>
      email.includes(pattern)
  );
}

/* =========================================================
   DÉTECTION DES MESSAGES AUTOMATIQUES
========================================================= */

function isAutomatedMessage(
  headers: any,
  senderEmail: string
) {
  if (
    shouldNeverAutoReply(
      senderEmail
    )
  ) {
    return true;
  }

  if (!headers) {
    return false;
  }

  const normalized:
    Record<string, string> = {};

  for (
    const [key, value] of
    Object.entries(headers)
  ) {
    normalized[
      key.toLowerCase()
    ] = Array.isArray(value)
      ? value.join(", ")
      : String(value ?? "");
  }

  const autoSubmitted =
    normalized[
      "auto-submitted"
    ]?.toLowerCase();

  if (
    autoSubmitted &&
    autoSubmitted !== "no"
  ) {
    return true;
  }

  const precedence =
    normalized[
      "precedence"
    ]?.toLowerCase();

  if (
    precedence === "bulk" ||
    precedence === "list" ||
    precedence === "junk"
  ) {
    return true;
  }

  if (
    normalized["x-autoreply"] ||
    normalized[
      "x-autorespond"
    ] ||
    normalized[
      "x-auto-response-suppress"
    ]
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   ENVOI RESEND
========================================================= */

async function sendResendEmail({
  apiKey,
  idempotencyKey,
  payload,
}: {
  apiKey: string;
  idempotencyKey: string;
  payload: Record<
    string,
    unknown
  >;
}) {
  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${apiKey}`,

        "Content-Type":
          "application/json",

        "Idempotency-Key":
          idempotencyKey.slice(
            0,
            256
          ),
      },

      body:
        JSON.stringify(payload),
    }
  );

  const data =
    await response
      .json()
      .catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

/* =========================================================
   OPENAI
========================================================= */

function extractOpenAIText(
  data: any
) {
  if (
    typeof data?.output_text ===
    "string"
  ) {
    return data.output_text.trim();
  }

  const texts: string[] = [];

  for (
    const item of
    data?.output ?? []
  ) {
    for (
      const content of
      item?.content ?? []
    ) {
      if (
        content?.type ===
          "output_text" &&
        typeof content.text ===
          "string"
      ) {
        texts.push(
          content.text
        );
      }
    }
  }

  return texts
    .join("\n")
    .trim();
}

function parseAIJSON(
  text: string
): AIDecision {
  const cleaned = text
    .replace(
      /^```json\s*/i,
      ""
    )
    .replace(
      /^```\s*/i,
      ""
    )
    .replace(
      /\s*```$/,
      ""
    )
    .trim();

  try {
    const parsed =
      JSON.parse(cleaned);

    if (
      parsed.category !==
        "auto" &&
      parsed.category !==
        "manual" &&
      parsed.category !==
        "priority"
    ) {
      return {
        category: "manual",
        message: "",
      };
    }

    return {
      category:
        parsed.category,

      message:
        typeof parsed.message ===
        "string"
          ? parsed.message
          : "",
    };
  } catch {
    return {
      category: "manual",
      message: "",
    };
  }
}

/* =========================================================
   MASQUAGE AVANT IA
========================================================= */

function sanitizeForAI(
  value: string
) {
  return value
    /*
     * Courriels
     */
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[courriel masqué]"
    )

    /*
     * NAS 000-000-000
     */
    .replace(
      /\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/g,
      "[numéro masqué]"
    )

    /*
     * Cartes / longues séries
     */
    .replace(
      /(?:\d[ -]*?){13,19}/g,
      "[numéro masqué]"
    );
}

/* =========================================================
   UTILITAIRES
========================================================= */

function extractEmail(
  value: string
) {
  const match = value.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  return match?.[0] || "";
}

function makeReplySubject(
  subject: string
) {
  if (
    /^\s*re:/i.test(subject)
  ) {
    return subject;
  }

  return `Re: ${subject}`;
}

function stripHtml(
  html: string
) {
  return html
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&lt;/gi,
      "<"
    )
    .replace(
      /&gt;/gi,
      ">"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function formatTextAsHtml(
  text: string
) {
  return escapeHtml(text)
    .replace(
      /\n/g,
      "<br>"
    );
}

/* =========================================================
   VÉRIFICATION WEBHOOK RESEND
========================================================= */

function verifyWebhookSignature({
  rawBody,
  id,
  timestamp,
  signatureHeader,
  secret,
}: {
  rawBody: string;
  id: string;
  timestamp: string;
  signatureHeader: string;
  secret: string;
}) {
  const timestampNumber =
    Number(timestamp);

  if (
    !Number.isFinite(
      timestampNumber
    )
  ) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );

  /*
   * Rejette un webhook
   * vieux de plus de 5 minutes.
   */
  if (
    Math.abs(
      now -
        timestampNumber
    ) > 300
  ) {
    return false;
  }

  const secretValue =
    secret.startsWith(
      "whsec_"
    )
      ? secret.slice(6)
      : secret;

  const secretBytes =
    Buffer.from(
      secretValue,
      "base64"
    );

  const expectedSignature =
    createHmac(
      "sha256",
      secretBytes
    )
      .update(
        `${id}.${timestamp}.${rawBody}`
      )
      .digest("base64");

  const signatures =
    signatureHeader
      .split(" ")
      .map((value) =>
        value.trim()
      )
      .filter((value) =>
        value.startsWith(
          "v1,"
        )
      )
      .map((value) =>
        value.slice(3)
      );

  return signatures.some(
    (signature) => {
      try {
        const received =
          Buffer.from(
            signature,
            "base64"
          );

        const expected =
          Buffer.from(
            expectedSignature,
            "base64"
          );

        return (
          received.length ===
            expected.length &&
          timingSafeEqual(
            received,
            expected
          )
        );
      } catch {
        return false;
      }
    }
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}
