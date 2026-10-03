import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const FORWARD_TO = "comptanetquebec@gmail.com";

const ALLOWED_RECIPIENTS = [
  "info@comptanetquebec.com",
  "contact@comptanetquebec.com",
];

const OPENAI_MODEL = "gpt-6-luna";

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
  action: "reply" | "manual";
  message: string;
};

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

    /*
     * Récupère le courriel complet depuis Resend
     */
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

    const emailText =
      String(
        email.text ||
          stripHtml(email.html || "")
      ).trim();

    /*
     * 1 — Transfert systématique dans ton Gmail
     */
    const forwardHtml = `
      <div style="
        font-family:Arial,sans-serif;
        background:#f4f6f8;
        border-left:4px solid #173f8a;
        padding:14px 18px;
        margin-bottom:20px;
        line-height:1.5;
      ">
        <strong>Courriel reçu sur ${escapeHtml(destination)}</strong><br>
        De : ${escapeHtml(senderRaw)}
      </div>

      ${
        email.html ||
        `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;">${escapeHtml(
          emailText
        )}</pre>`
      }
    `;

    const forwardResult = await sendResendEmail({
      apiKey: resendApiKey,
      idempotencyKey: `inbound-forward/${event.data.email_id}`,
      payload: {
        from: "ComptaNet Québec <contact@comptanetquebec.com>",
        to: [FORWARD_TO],
        reply_to: senderEmail || senderRaw,
        subject,
        html: forwardHtml,
        text:
          `Courriel reçu sur ${destination}\n` +
          `De : ${senderRaw}\n\n` +
          emailText,
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

    /*
     * 2 — Vérifie si on permet à l'IA de traiter ce message
     */
    if (
      !openaiApiKey ||
      !senderEmail ||
      !emailText ||
      shouldNeverAutoReply(senderEmail) ||
      !isSafeForAI({
        subject,
        text: emailText,
        hasAttachments:
          (event.data.attachments?.length ?? 0) > 0,
      })
    ) {
      return NextResponse.json({
        ok: true,
        forwarded: true,
        aiReply: false,
        reason: "manual_review",
      });
    }

    /*
     * 3 — L'IA décide si elle peut répondre
     */
    let decision: AIDecision;

    try {
      decision = await getAIReply({
        apiKey: openaiApiKey,
        destination,
        sender: senderRaw,
        subject,
        message: emailText,
      });
    } catch (error) {
      console.error("Erreur OpenAI :", error);

      /*
       * Le courriel est déjà dans Gmail.
       * On retourne 200 pour éviter des doublons de transfert.
       */
      return NextResponse.json({
        ok: true,
        forwarded: true,
        aiReply: false,
        reason: "ai_error",
      });
    }

    if (
      decision.action !== "reply" ||
      !decision.message.trim()
    ) {
      return NextResponse.json({
        ok: true,
        forwarded: true,
        aiReply: false,
        reason: "ai_manual_review",
      });
    }

    /*
     * 4 — Envoie automatiquement la réponse au client
     */
    const replyText = decision.message.trim();

    const replyResult = await sendResendEmail({
      apiKey: resendApiKey,
      idempotencyKey: `inbound-ai-reply/${event.data.email_id}`,
      payload: {
        from: "ComptaNet Québec <contact@comptanetquebec.com>",
        to: [senderEmail],
        reply_to: destination,
        subject: makeReplySubject(subject),
        text: replyText,
        html: `
          <div style="
            font-family:Arial,sans-serif;
            font-size:15px;
            line-height:1.6;
            color:#222;
          ">
            ${formatTextAsHtml(replyText)}
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
        aiReply: false,
        reason: "reply_send_error",
      });
    }

    return NextResponse.json({
      ok: true,
      forwarded: true,
      aiReply: true,
      originalRecipient: destination,
      forwardId: forwardResult.data?.id,
      replyId: replyResult.data?.id,
    });
  } catch (error) {
    console.error("Erreur inbound email :", error);

    return new NextResponse("Erreur webhook", {
      status: 400,
    });
  }
}

/*
 * IA ComptaNet Québec
 */
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
Tu es l'assistant courriel automatique de ComptaNet Québec.

Tu dois décider si le message peut recevoir une réponse automatique sans risque.

Retourne UNIQUEMENT du JSON valide, sans markdown, exactement sous cette forme :

{
  "action": "reply" ou "manual",
  "message": "texte de la réponse ou chaîne vide"
}

Utilise "reply" UNIQUEMENT pour des questions administratives simples et générales.

Exemples possibles :
- comment utiliser le site;
- comment créer ou utiliser l'Espace client;
- comment transmettre des documents;
- problème général de connexion;
- demande générale de contact;
- confirmation qu'un message a été reçu;
- fonctionnement général du service.

Informations que tu peux utiliser :
- l'entreprise s'appelle ComptaNet Québec;
- le site est https://www.comptanetquebec.com;
- les clients peuvent utiliser leur Espace client;
- ils peuvent répondre aux questions et transmettre leurs documents en ligne;
- ils peuvent revenir plus tard pour ajouter des documents manquants.

Utilise "manual" si :
- tu ne connais pas la réponse avec certitude;
- on demande un prix qui n'est pas fourni dans le message;
- la question concerne un dossier personnel;
- la question concerne une déclaration de revenus;
- la question demande un calcul fiscal;
- ARC ou Revenu Québec est impliqué;
- il est question d'un avis de cotisation;
- il faut interpréter une règle fiscale;
- il y a une question juridique;
- il y a une plainte ou un litige;
- il faut prendre une décision professionnelle;
- des renseignements personnels ou financiers sont nécessaires.

Règles absolues :
- ne jamais inventer;
- ne jamais supposer;
- ne jamais donner de conseil fiscal personnalisé;
- ne jamais prétendre avoir consulté le dossier du client;
- répondre dans la même langue que le client;
- réponse courte, professionnelle et chaleureuse;
- signer simplement : ComptaNet Québec.
`;

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        store: false,
        max_output_tokens: 400,
        instructions,
        input:
          `Adresse ComptaNet : ${destination}\n` +
          `Expéditeur : ${sender}\n` +
          `Sujet : ${subject}\n\n` +
          `Message :\n${message}`,
      }),
    }
  );

  const data: any = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      `OpenAI ${response.status}: ${JSON.stringify(data)}`
    );
  }

  const output = extractOpenAIText(data);

  if (!output) {
    throw new Error("Réponse OpenAI vide");
  }

  const parsed = parseAIJSON(output);

  if (
    parsed.action !== "reply" &&
    parsed.action !== "manual"
  ) {
    return {
      action: "manual",
      message: "",
    };
  }

  return {
    action: parsed.action,
    message:
      typeof parsed.message === "string"
        ? parsed.message
        : "",
  };
}

/*
 * On ne transmet pas à l'IA les messages qui semblent contenir
 * des renseignements fiscaux/personnels sensibles.
 */
function isSafeForAI({
  subject,
  text,
  hasAttachments,
}: {
  subject: string;
  text: string;
  hasAttachments: boolean;
}) {
  if (hasAttachments) {
    return false;
  }

  const value = `${subject}\n${text}`;

  /*
   * NAS canadien : 000 000 000 / 000-000-000
   */
  if (/\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/.test(value)) {
    return false;
  }

  /*
   * Longues suites de chiffres :
   * cartes, comptes, numéros de dossiers, etc.
   */
  if (/(?:\d[ -]*?){13,19}/.test(value)) {
    return false;
  }

  const sensitiveTerms =
    /\b(NAS|SIN|social insurance|assurance sociale|ARC|CRA|Revenu Québec|avis de cotisation|notice of assessment|T1|T2|T4|T4A|T5|RL[- ]?\d+|TP[- ]?\d+|imp[oô]t|tax return|déduction|deduction|crédit d'impôt|tax credit|cotisation|pension alimentaire|saisie|garnishment|audit|vérification fiscale|revenu|income|salaire|salary|travailleur autonome|self-employed|TPS|TVQ|GST|QST)\b/i;

  if (sensitiveTerms.test(value)) {
    return false;
  }

  return true;
}

function shouldNeverAutoReply(senderEmail: string) {
  const email = senderEmail.toLowerCase();

  if (email === FORWARD_TO.toLowerCase()) {
    return true;
  }

  if (email.endsWith("@comptanetquebec.com")) {
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
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey.slice(
          0,
          256
        ),
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

function extractOpenAIText(data: any) {
  if (typeof data?.output_text === "string") {
    return data.output_text.trim();
  }

  const texts: string[] = [];

  for (const item of data?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (
        content?.type === "output_text" &&
        typeof content.text === "string"
      ) {
        texts.push(content.text);
      }
    }
  }

  return texts.join("\n").trim();
}

function parseAIJSON(text: string): AIDecision {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      action: "manual",
      message: "",
    };
  }
}

function extractEmail(value: string) {
  const match = value.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  return match?.[0] || "";
}

function makeReplySubject(subject: string) {
  if (/^\s*re:/i.test(subject)) {
    return subject;
  }

  return `Re: ${subject}`;
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTextAsHtml(text: string) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

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
  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestampNumber) > 300) {
    return false;
  }

  const secretValue = secret.startsWith("whsec_")
    ? secret.slice(6)
    : secret;

  const secretBytes = Buffer.from(
    secretValue,
    "base64"
  );

  const expectedSignature = createHmac(
    "sha256",
    secretBytes
  )
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");

  const signatures = signatureHeader
    .split(" ")
    .map((value) => value.trim())
    .filter((value) =>
      value.startsWith("v1,")
    )
    .map((value) => value.slice(3));

  return signatures.some((signature) => {
    try {
      const received = Buffer.from(
        signature,
        "base64"
      );

      const expected = Buffer.from(
        expectedSignature,
        "base64"
      );

      return (
        received.length === expected.length &&
        timingSafeEqual(received, expected)
      );
    } catch {
      return false;
    }
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
