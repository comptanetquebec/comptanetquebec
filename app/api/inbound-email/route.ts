import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const FORWARD_TO = "comptanetquebec@gmail.com";

const ALLOWED_RECIPIENTS = [
  "info@comptanetquebec.com",
  "contact@comptanetquebec.com",
];

const OPENAI_MODEL = "gpt-6-luna";

type TriageCategory = "auto" | "manual" | "priority";

type ResendAttachment = {
  id?: string;
  filename?: string;
  content_type?: string;
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
   WEBHOOK
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

    const hasAttachments =
      (event.data.attachments?.length ?? 0) > 0;

    /* =====================================================
       NE JAMAIS AUTO-RÉPONDRE À CES EXPÉDITEURS
    ===================================================== */

    const blockedSender =
      !senderEmail ||
      shouldNeverAutoReply(senderEmail);

    /* =====================================================
       TRIAGE PAR RÈGLES
       Les cas sensibles ne vont PAS à l'IA.
    ===================================================== */

    let category: TriageCategory;
    let aiReplyText = "";

    const ruleCategory = classifyByRules({
      subject,
      text: emailText,
      hasAttachments,
    });

    if (blockedSender) {
      category = "manual";
    } else if (ruleCategory) {
      category = ruleCategory;
    } else if (!openaiApiKey || !emailText) {
      category = "manual";
    } else {
      /*
       * Seulement les messages généraux et non sensibles
       * arrivent ici.
       */
      try {
        const decision = await getAIReply({
          apiKey: openaiApiKey,
          destination,
          sender: senderRaw,
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
       TRANSFERT DANS TON GMAIL AVEC CATÉGORIE
    ===================================================== */

    const label = getLabel(category);

    const gmailSubject = `${label} ${subject}`;

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
      `Sujet original : ${subject}\n\n` +
      emailText;

    const forwardResult = await sendResendEmail({
      apiKey: resendApiKey,
      idempotencyKey:
        `inbound-forward/${event.data.email_id}`,
      payload: {
        from:
          "ComptaNet Québec <contact@comptanetquebec.com>",

        to: [FORWARD_TO],

        reply_to:
          senderEmail ||
          senderRaw,

        subject: gmailSubject,

        html: forwardHtml,

        text: forwardText,
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
       EXPÉDITEUR AUTOMATIQUE :
       ON TRANSFÈRE MAIS ON NE RÉPOND PAS
    ===================================================== */

    if (blockedSender) {
      return NextResponse.json({
        ok: true,
        forwarded: true,
        category,
        customerReply: false,
      });
    }

    /* =====================================================
       AUTO-RÉPONSE IA
    ===================================================== */

    if (
      category === "auto" &&
      aiReplyText
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

      if (!replyResult.ok) {
        console.error(
          "Erreur réponse automatique :",
          replyResult.data
        );

        return NextResponse.json({
          ok: true,
          forwarded: true,
          category,
          customerReply: false,
          reason: "reply_send_error",
        });
      }

      return NextResponse.json({
        ok: true,
        forwarded: true,
        category,
        customerReply: true,
        replyType: "ai",
      });
    }

    /* =====================================================
       MANUEL / PRIORITÉ :
       ACCUSÉ DE RÉCEPTION AUTOMATIQUE
    ===================================================== */

    const language =
      detectLanguage(emailText);

    const acknowledgement =
      getAcknowledgement({
        language,
        priority:
          category === "priority",
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
              ${formatTextAsHtml(acknowledgement)}
            </div>
          `,
        },
      });

    if (!acknowledgementResult.ok) {
      console.error(
        "Erreur accusé réception :",
        acknowledgementResult.data
      );
    }

    return NextResponse.json({
      ok: true,
      forwarded: true,
      category,
      customerReply:
        acknowledgementResult.ok,
      replyType: "acknowledgement",
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
   TRIAGE AUTOMATIQUE PAR RÈGLES
========================================================= */

function classifyByRules({
  subject,
  text,
  hasAttachments,
}: {
  subject: string;
  text: string;
  hasAttachments: boolean;
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
   * NAS
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
    /(?:\d[ -]*?){13,19}/.test(value)
  ) {
    return "manual";
  }

  /*
   * Pièces jointes :
   * intervention humaine par défaut.
   */
  if (hasAttachments) {
    return "manual";
  }

  /*
   * Fiscalité ou dossier personnel :
   * l'IA ne rédige pas de conseil.
   */
  const sensitiveTerms =
    /\b(NAS|SIN|social insurance|assurance sociale|T1|T2|T3|T4|T4A|T5|RL[- ]?\d+|TP[- ]?\d+|imp[oô]t|impots|tax return|déclaration de revenus|declaration de revenus|déduction|deduction|crédit d'impôt|credit d'impot|tax credit|cotisation|pension alimentaire|revenu|income|salaire|salary|travailleur autonome|self-employed|TPS|TVQ|GST|QST|remboursement d'impôt|remboursement d'impot|tax refund)\b/i;

  if (sensitiveTerms.test(value)) {
    return "manual";
  }

  return null;
}

/* =========================================================
   IA
========================================================= */

async function getAIReply({
  apiKey,
  destination,
  sender,
  subject,
  message,
}: {
  apiKey: string;
  destination: string;
  sender: string;
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

Retourne UNIQUEMENT du JSON valide :

{
  "category": "auto",
  "message": "réponse complète au client"
}

ou :

{
  "category": "manual",
  "message": ""
}

ou :

{
  "category": "priority",
  "message": ""
}

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

        input:
          `Adresse ComptaNet : ${destination}\n` +
          `Expéditeur : ${sender}\n` +
          `Sujet : ${subject}\n\n` +
          `Message :\n${message}`,
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
   LANGUE
========================================================= */

function detectLanguage(
  value: string
): "fr" | "en" | "es" {
  const text = value.toLowerCase();

  let fr = 0;
  let en = 0;
  let es = 0;

  const frenchWords = [
    "bonjour",
    "merci",
    "je ",
    "vous ",
    "mon ",
    "mes ",
    "comment",
    "pourquoi",
    "document",
    "impôt",
    "compte",
  ];

  const englishWords = [
    "hello",
    "hi ",
    "thank",
    "thanks",
    "my ",
    "how ",
    "what ",
    "please",
    "account",
    "documents",
  ];

  const spanishWords = [
    "hola",
    "gracias",
    "por favor",
    "cómo",
    "como ",
    "mi ",
    "mis ",
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

  if (es > fr && es > en) {
    return "es";
  }

  if (en > fr && en > es) {
    return "en";
  }

  return "fr";
}

/* =========================================================
   LIBELLÉS GMAIL
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
   NE JAMAIS AUTO-RÉPONDRE
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

  if (
    email.includes("mailer-daemon") ||
    email.includes("postmaster") ||
    email.includes("no-reply") ||
    email.includes("noreply")
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
  payload: Record<string, unknown>;
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
   LECTURE RÉPONSE OPENAI
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
        texts.push(content.text);
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
      parsed.category !== "auto" &&
      parsed.category !== "manual" &&
      parsed.category !== "priority"
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
