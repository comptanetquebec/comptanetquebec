// app/api/contact/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_MODEL = "gpt-5.6-luna";

type TriageCategory = "auto" | "manual" | "priority";

type Body = {
  name?: string;
  email?: string;
  message?: string;
  token?: string;
  company?: string;
};

type RecaptchaVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

type AIDecision = {
  category: TriageCategory;
  message: string;
};

function s(v: unknown) {
  return (v == null ? "" : String(v)).trim();
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for") || "";
  return xf.split(",")[0]?.trim() || "";
}

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTextAsHtml(text: string) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erreur inconnue.";
}

/* =========================================================
   RATE LIMIT
========================================================= */

const hits = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkRateLimit(
  key: string,
  limit = 8,
  windowMs = 10 * 60 * 1000
) {
  const now = Date.now();
  const cur = hits.get(key);

  if (!cur || cur.resetAt < now) {
    hits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return { ok: true };
  }

  if (cur.count >= limit) {
    return {
      ok: false,
      retryAfterMs: cur.resetAt - now,
    };
  }

  cur.count += 1;

  return { ok: true };
}

/* =========================================================
   ROUTE
========================================================= */

export async function POST(req: Request) {
  try {
    let body: Body;

    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "JSON invalide.",
        },
        { status: 400 }
      );
    }

    const name = s(body.name);
    const email = s(body.email).toLowerCase();
    const message = s(body.message);
    const token = s(body.token);
    const honeypot = s(body.company);

    /* =====================================================
       HONEYPOT
    ===================================================== */

    if (honeypot) {
      return NextResponse.json({ ok: true });
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Champs manquants.",
        },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email invalide.",
        },
        { status: 400 }
      );
    }

    if (
      name.length > 120 ||
      email.length > 200 ||
      message.length > 5000
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Message trop long.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       RATE LIMIT
    ===================================================== */

    const ip = getClientIp(req);

    const rlKey =
      `${ip || "noip"}:${email}`;

    const rl = checkRateLimit(rlKey);

    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Trop de messages. Réessayez plus tard.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil(
                (rl.retryAfterMs ?? 0) / 1000
              )
            ),
          },
        }
      );
    }

    /* =====================================================
       RECAPTCHA
    ===================================================== */

    const recaptchaSecret =
      process.env.RECAPTCHA_SECRET ?? "";

    if (!recaptchaSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing RECAPTCHA_SECRET",
        },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "reCAPTCHA manquant.",
        },
        { status: 400 }
      );
    }

    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          secret: recaptchaSecret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
      }
    );

    const recaptcha =
      (await verifyRes.json()) as
        RecaptchaVerifyResponse;

    if (!recaptcha?.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Échec reCAPTCHA.",
          details:
            recaptcha?.["error-codes"] ?? [],
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VARIABLES
    ===================================================== */

    const resendApiKey =
      process.env.RESEND_API_KEY ?? "";

    const openaiApiKey =
      process.env.OPENAI_API_KEY ?? "";

    const to =
      process.env.CONTACT_TO ?? "";

    const from =
      process.env.CONTACT_FROM ?? "";

    if (!resendApiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing RESEND_API_KEY",
        },
        { status: 500 }
      );
    }

    if (!to) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing CONTACT_TO",
        },
        { status: 500 }
      );
    }

    if (!from) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing CONTACT_FROM",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       TRIAGE
    ===================================================== */

    let category: TriageCategory = "manual";
    let aiReplyText = "";

    const ruleCategory =
      classifyByRules(message);

    if (ruleCategory) {
      category = ruleCategory;
    } else if (openaiApiKey) {
      try {
        const decision =
          await getAIReply({
            apiKey: openaiApiKey,
            message,
          });

        category = decision.category;

        if (category === "auto") {
          aiReplyText =
            decision.message.trim();

          if (!aiReplyText) {
            category = "manual";
          }
        }
      } catch (error) {
        console.error(
          "Erreur OpenAI :",
          error
        );

        category = "manual";
      }
    }

    /* =====================================================
       LANGUE
    ===================================================== */

    const language =
      detectLanguage(message);

    /* =====================================================
       RÉPONSE AU CLIENT
    ===================================================== */

    let customerReplySent = false;
    let customerReplyType:
      | "ai"
      | "acknowledgement"
      | "none" = "none";

    if (
      category === "auto" &&
      aiReplyText
    ) {
      const customerResult =
        await sendResendEmail({
          apiKey: resendApiKey,

          payload: {
            from,

            to: [email],

            reply_to:
              "info@comptanetquebec.com",

            subject:
              getCustomerSubject(language),

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

      if (customerResult.ok) {
        customerReplySent = true;
        customerReplyType = "ai";
      } else {
        console.error(
          "Erreur auto-réponse :",
          customerResult.data
        );

        category = "manual";
      }
    }

    /* =====================================================
       ACCUSÉ DE RÉCEPTION
       seulement si humain requis
    ===================================================== */

    if (
      (category === "manual" ||
        category === "priority") &&
      !customerReplySent
    ) {
      const acknowledgement =
        getAcknowledgement({
          language,
          priority:
            category === "priority",
        });

      const ackResult =
        await sendResendEmail({
          apiKey: resendApiKey,

          payload: {
            from,

            to: [email],

            reply_to:
              "info@comptanetquebec.com",

            subject:
              getCustomerSubject(language),

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

      if (ackResult.ok) {
        customerReplySent = true;
        customerReplyType =
          "acknowledgement";
      }
    }

    /* =====================================================
       COURRIEL POUR TON GMAIL
    ===================================================== */

    const label =
      getLabel(category);

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

    const safeName =
      escapeHtml(name);

    const safeEmail =
      escapeHtml(email);

    const safeMessageHtml =
      escapeHtml(message).replace(
        /\n/g,
        "<br/>"
      );

    const gmailSubject =
      `${label} Nouveau message — ${name}`;

    const gmailHtml = `
      <div style="
        font-family:Arial,sans-serif;
        font-size:14px;
        line-height:1.5;
      ">

        <div style="
          background:#f5f7fa;
          border-left:5px solid ${bannerColor};
          padding:14px 18px;
          margin-bottom:20px;
        ">
          <div style="
            font-size:16px;
            font-weight:700;
            color:${bannerColor};
            margin-bottom:8px;
          ">
            ${escapeHtml(bannerText)}
          </div>

          <strong>Nom :</strong>
          ${safeName}
          <br>

          <strong>Courriel :</strong>
          ${safeEmail}

          ${
            ip
              ? `
                <br>
                <strong>IP :</strong>
                ${escapeHtml(ip)}
              `
              : ""
          }
        </div>

        <p>
          <strong>Message :</strong>
        </p>

        <div style="
          padding:12px;
          border:1px solid #e5e7eb;
          border-radius:8px;
          background:#fafafa;
        ">
          ${safeMessageHtml}
        </div>

        ${
          category === "auto" &&
          aiReplyText
            ? `
              <div style="
                margin-top:20px;
                padding:12px;
                border:1px solid #bbf7d0;
                border-radius:8px;
                background:#f0fdf4;
              ">
                <strong>
                  Réponse envoyée automatiquement :
                </strong>
                <br><br>
                ${formatTextAsHtml(
                  aiReplyText
                )}
              </div>
            `
            : ""
        }

      </div>
    `.trim();

    const gmailText = [
      bannerText,
      "",
      `Nom : ${name}`,
      `Courriel : ${email}`,
      ip ? `IP : ${ip}` : "",
      "",
      "Message :",
      message,
      "",
      category === "auto" &&
      aiReplyText
        ? `Réponse automatique :\n${aiReplyText}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const gmailResult =
      await sendResendEmail({
        apiKey: resendApiKey,

        payload: {
          from,

          to: [to],

          reply_to: email,

          subject: gmailSubject,

          text: gmailText,

          html: gmailHtml,
        },
      });

    if (!gmailResult.ok) {
      console.error(
        "Erreur transfert Gmail :",
        gmailResult.data
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Échec d’envoi email.",
          details:
            gmailResult.data,
        },
        { status: 502 }
      );
    }

    /* =====================================================
       RÉSULTAT
    ===================================================== */

    return NextResponse.json({
      ok: true,
      category,
      customerReplySent,
      customerReplyType,
    });
  } catch (e: unknown) {
    console.error(
      "Erreur contact :",
      e
    );

    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(e),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   TRIAGE PAR RÈGLES
========================================================= */

function classifyByRules(
  message: string
): TriageCategory | null {
  const value =
    message.toLowerCase();

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
   * Carte / longue série numérique
   */
  if (
    /(?:\d[ -]*?){13,19}/.test(
      value
    )
  ) {
    return "manual";
  }

  /*
   * Dossier personnel ou fiscal précis.
   *
   * IMPORTANT :
   * le simple mot "impôt" ne bloque plus
   * une question générale.
   */
  const personalTerms =
    /\b(mon dossier|ma déclaration|ma declaration|mon remboursement|mon avis|ma cotisation|mon t4|mon t4a|mon relevé|mon releve|rl[- ]?\d+|tp[- ]?\d+|pension alimentaire|travailleur autonome|self-employed|mes revenus|mon revenu|mon salaire|mes déductions|mes deductions|mes crédits|mes credits|tps|tvq|gst|qst)\b/i;

  if (personalTerms.test(value)) {
    return "manual";
  }

  return null;
}

/* =========================================================
   IA
========================================================= */

async function getAIReply({
  apiKey,
  message,
}: {
  apiKey: string;
  message: string;
}): Promise<AIDecision> {
  const instructions = `
Tu es le service à la clientèle automatisé de ComptaNet Québec.

Tu dois classer le message dans UNE catégorie :

1. "auto"
Tu peux répondre immédiatement avec certitude.

2. "manual"
Une personne de ComptaNet Québec doit intervenir.

3. "priority"
Une personne doit intervenir rapidement.

UTILISE "auto" pour les questions administratives générales :

- comment faire ses impôts avec ComptaNet Québec;
- comment commencer;
- quels documents transmettre de façon générale;
- comment créer un compte;
- comment ouvrir l'Espace client;
- comment transmettre des documents;
- comment ajouter plus tard des documents manquants;
- comment utiliser le site;
- question générale sur le fonctionnement;
- problème général de connexion;
- demande générale de contact.

Informations vérifiées :

- l'entreprise s'appelle ComptaNet Québec;
- le site officiel est https://www.comptanetquebec.com;
- le service se fait principalement en ligne;
- les clients peuvent utiliser leur Espace client;
- le client répond aux questions dans son Espace client;
- il peut transmettre ses documents dans son Espace client;
- il peut revenir plus tard pour ajouter les documents manquants;
- ne donne jamais une liste universelle de documents comme si elle s'appliquait à tout le monde;
- explique que les documents nécessaires varient selon la situation du client et que l'Espace client permet de fournir les renseignements et documents pertinents.

UTILISE "manual" si :

- tu ne connais pas la réponse avec certitude;
- la demande concerne le dossier fiscal personnel du client;
- le client demande une analyse de sa situation;
- le client demande un conseil fiscal personnalisé;
- le client demande un prix qui n'est pas fourni ici;
- une décision professionnelle est nécessaire;
- le client affirme qu'une information de son dossier est incorrecte;
- tu dois consulter des données qui ne sont pas présentes.

UTILISE "priority" si :

- le client indique une échéance imminente;
- il parle d'une saisie ou mise en demeure;
- il mentionne ARC ou Revenu Québec dans un problème urgent;
- il y a une plainte sérieuse;
- il y a un problème important de paiement;
- une intervention rapide est clairement nécessaire.

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
- si le client demande quels documents fournir, expliquer que cela dépend de sa situation et le diriger vers l'Espace client;
- signer : ComptaNet Québec.
`;

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

        text: {
          format: {
            type: "json_schema",

            name:
              "comptanet_contact_triage",

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
          `Message du client :\n${sanitizedMessage}`,
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
   OPENAI UTILS
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
   MASQUAGE AVANT IA
========================================================= */

function sanitizeForAI(
  value: string
) {
  return value
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[courriel masqué]"
    )
    .replace(
      /\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/g,
      "[numéro masqué]"
    )
    .replace(
      /(?:\d[ -]*?){13,19}/g,
      "[numéro masqué]"
    );
}

/* =========================================================
   ACCUSÉ DE RÉCEPTION
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
  const text =
    ` ${value.toLowerCase()} `;

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
    " comment ",
    " pourquoi ",
    " document",
    " impôt",
    " compte",
    " déclaration",
    " revenu",
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
    " como ",
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
   OBJET CLIENT
========================================================= */

function getCustomerSubject(
  language: "fr" | "en" | "es"
) {
  if (language === "en") {
    return "Re: Your message to ComptaNet Québec";
  }

  if (language === "es") {
    return "Re: Su mensaje a ComptaNet Québec";
  }

  return "Re: Votre message à ComptaNet Québec";
}

/* =========================================================
   LABELS GMAIL
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
   RESEND
========================================================= */

async function sendResendEmail({
  apiKey,
  payload,
}: {
  apiKey: string;
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
