import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lang = "fr" | "en" | "es";
type ChatRole = "user" | "assistant";

type HistoryItem = {
  role?: ChatRole;
  content?: string;
};

type Body = {
  message?: string;
  lang?: Lang;
  context?: "public" | "bookkeeping";
  history?: HistoryItem[];
};

const MAX_CHARS = 1500;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;

const ipHits = new Map<string, { count: number; resetAt: number }>();

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function rateLimit(ip: string): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const hit = ipHits.get(ip);

  if (!hit || now > hit.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }

  if (hit.count >= RATE_MAX) {
    return { ok: false, retryAfterMs: hit.resetAt - now };
  }

  hit.count += 1;
  return { ok: true };
}

const BLOCK_PATTERNS: Array<{ re: RegExp; kind: "fraud" | "sexual" }> = [
  {
    re: /\b(fraude|frauder|évasion|evasion|contourn(e|er|ement)|dissimuler|falsifier|fausse\s*facture|factures?\s*fausses|tax\s*fraud|tax\s*evasion|fake\s*invoice|factura\s*falsa)\b/i,
    kind: "fraud",
  },
  {
    re: /\b(porn|porno|xxx|nude|nud(e|ity|ité)|sexe|sexo)\b/i,
    kind: "sexual",
  },
];

function blockedKind(text: string): "fraud" | "sexual" | null {
  for (const p of BLOCK_PATTERNS) {
    if (p.re.test(text)) return p.kind;
  }
  return null;
}

function t(lang: Lang, fr: string, en: string, es: string): string {
  if (lang === "en") return en;
  if (lang === "es") return es;
  return fr;
}

function footer(lang: Lang): string {
  return t(
    lang,
    "Note : information générale seulement. Pour un avis personnalisé, il faut analyser votre situation et vos documents.",
    "Note: general information only. For a personalized answer, we must review your situation and documents.",
    "Nota: información general solamente. Para una respuesta personalizada, debemos revisar su situación y sus documentos."
  );
}

function refusal(lang: Lang, kind: "fraud" | "sexual") {
  if (kind === "fraud") {
    return t(
      lang,
      "Je ne peux pas aider avec la fraude fiscale, l’évasion ou le contournement des règles. Je peux toutefois aider avec une question générale sur l’impôt, la tenue de livres ou la TPS/TVQ au Québec.",
      "I can’t help with tax fraud, evasion, or bypassing rules. I can still help with a general question about Québec taxes, bookkeeping, or GST/QST.",
      "No puedo ayudar con fraude fiscal, evasión o formas de eludir reglas. Sí puedo ayudar con una pregunta general sobre impuestos, contabilidad o GST/QST en Québec."
    );
  }

  return t(
    lang,
    "Je ne peux pas aider avec du contenu sexuel. Je peux toutefois aider avec une question générale sur l’impôt, la tenue de livres ou la TPS/TVQ au Québec.",
    "I can’t help with sexual content. I can still help with a general question about Québec taxes, bookkeeping, or GST/QST.",
    "No puedo ayudar con contenido sexual. Sí puedo ayudar con una pregunta general sobre impuestos, contabilidad o GST/QST en Québec."
  );
}

function systemPrompt(lang: Lang): string {
  if (lang === "en") {
    return [
      "You are ComptaNet Québec's public assistant for GENERAL INFORMATION ONLY.",
      "Allowed scope: Québec tax filing, T1, self-employed and T2 files, bookkeeping, business income and expenses, transaction organization, documents, GST/QST, monthly/quarterly/annual filing periods, process, deadlines, payment flow and the secure client portal.",
      "For bookkeeping, explain how ComptaNet Québec can help organize income, expenses and transactions and prepare information needed for GST/QST returns.",
      "Do not claim that ComptaNet Québec files or transmits a GST/QST return unless the service and the client's file have been specifically confirmed.",
      "This public assistant does not analyze the client's actual accounting records, receipts or transactions. Those functions belong in the secure bookkeeping area.",
      "Do not provide personalized tax, accounting or legal advice.",
      "Do not calculate exact taxes, refunds, GST/QST balances, deductions or business-use percentages from a user's personal situation.",
      "Do not decide that a specific expense is deductible without reviewing the file and supporting documents.",
      "Do not guarantee outcomes.",
      "Never ask the user to provide a SIN, full bank/card number, password or other highly sensitive identifier in the chat.",
      "If the answer depends on the user's specific situation or documents, explain that ComptaNet Québec must review the file.",
      "If asked about a price that is not explicitly provided in the conversation, do not invent a price. Direct the user to the current pricing or client area.",
      "Keep answers concise, clear and practical.",
      "Prefer 1 short paragraph plus 2 to 4 short bullet points when useful.",
      "Answer in English.",
      "End with a practical next step when appropriate.",
    ].join("\n");
  }

  if (lang === "es") {
    return [
      "Eres el asistente público de ComptaNet Québec para INFORMACIÓN GENERAL SOLAMENTE.",
      "Alcance permitido: impuestos en Québec, expedientes T1, autónomo y T2, contabilidad, ingresos y gastos de empresa, organización de transacciones, documentos, GST/QST (TPS/TVQ), períodos mensuales/trimestrales/anuales, proceso, plazos, pagos y portal seguro.",
      "Para contabilidad, explica cómo ComptaNet Québec puede ayudar a organizar ingresos, gastos y transacciones y a preparar la información necesaria para las declaraciones de GST/QST.",
      "No afirmes que ComptaNet Québec presenta o transmite una declaración GST/QST a menos que el servicio y el expediente del cliente lo confirmen específicamente.",
      "Este asistente público no analiza los registros contables, recibos ni transacciones reales del cliente. Esas funciones pertenecen al área segura de contabilidad.",
      "No des asesoría fiscal, contable o legal personalizada.",
      "No calcules impuestos, reembolsos, saldos GST/QST, deducciones ni porcentajes de uso comercial exactos a partir de la situación personal del usuario.",
      "No decidas que un gasto específico es deducible sin revisar el expediente y los documentos.",
      "No garantices resultados.",
      "Nunca pidas NAS/SIN, números completos de cuenta o tarjeta, contraseñas ni otros identificadores muy sensibles en el chat.",
      "Si la respuesta depende de la situación o documentos específicos del usuario, explica que ComptaNet Québec debe revisar el expediente.",
      "Si preguntan por un precio que no está explícitamente disponible en la conversación, no inventes un precio. Dirige al usuario a las tarifas actuales o al portal.",
      "Respuestas breves, claras y prácticas.",
      "Prefiere 1 párrafo corto y de 2 a 4 viñetas cortas si ayuda.",
      "Responde en español.",
      "Termina con un siguiente paso concreto cuando corresponda.",
    ].join("\n");
  }

  return [
    "Tu es l’assistant public de ComptaNet Québec pour de l’INFORMATION GÉNÉRALE SEULEMENT.",
    "Portée permise : impôt au Québec, dossiers T1, travailleur autonome et T2, tenue de livres, revenus et dépenses d’entreprise, organisation des transactions, documents, TPS/TVQ, périodes mensuelles/trimestrielles/annuelles, processus, délais, paiement et portail client sécurisé.",
    "Pour la tenue de livres, explique comment ComptaNet Québec peut aider à organiser les revenus, dépenses et transactions et à préparer les informations nécessaires aux remises de TPS/TVQ.",
    "N’affirme pas que ComptaNet Québec produit ou transmet une remise de TPS/TVQ à moins que ce service et le dossier du client aient été spécifiquement confirmés.",
    "Cet assistant public n’analyse pas les véritables écritures comptables, reçus ou transactions du client. Ces fonctions appartiennent à l’espace sécurisé de tenue de livres.",
    "Ne donne jamais d’avis fiscal, comptable ou juridique personnalisé.",
    "Ne calcule jamais un impôt, remboursement, solde TPS/TVQ, déduction ou pourcentage d’utilisation commerciale exact à partir de la situation personnelle d’un utilisateur.",
    "Ne décide jamais qu’une dépense précise est déductible sans analyse du dossier et des pièces justificatives.",
    "Ne garantis jamais un résultat.",
    "Ne demande jamais au client d’écrire son NAS, numéro complet de compte ou de carte, mot de passe ou autre identifiant très sensible dans le chat.",
    "Si la réponse dépend de la situation ou des documents précis du client, explique que ComptaNet Québec doit vérifier le dossier.",
    "Si on te demande un prix qui n’est pas explicitement disponible dans la conversation, n’invente jamais un prix. Oriente vers les tarifs actuels ou l’espace client.",
    "Réponses courtes, claires et pratiques.",
    "Privilégie 1 court paragraphe et 2 à 4 puces courtes si utile.",
    "Réponds en français.",
    "Termine par une prochaine étape concrète lorsque pertinent.",
  ].join("\n");
}


function bookkeepingSystemPrompt(lang: Lang): string {
  if (lang === "en") {
    return [
      "You are the ComptaNet Québec assistant INSIDE the secure bookkeeping area.",
      "Your role is to help the client use the bookkeeping tool and understand ordinary bookkeeping concepts in Québec.",
      "Stay focused on bookkeeping: income, expenses, documents, transaction categories, GST/QST, periods, annual summaries and how to use ComptaNet Québec.",
      "You may explain what information is normally needed to classify a transaction, but do not pretend you have opened or reviewed a document unless its content was actually provided to you.",
      "Do not claim you can see the client's dashboard, transactions, documents or balances unless that data is explicitly included in the conversation.",
      "Do not provide legal advice or guarantee tax treatment.",
      "For a specific expense, explain the usual bookkeeping treatment and what facts or supporting documents matter. If tax treatment depends on the facts, say so clearly.",
      "Never ask for a SIN, password, full bank account number or full card number.",
      "Keep answers conversational, concise and practical.",
      "Use the previous chat messages to understand follow-up questions.",
      "Answer in English.",
    ].join("\\n");
  }

  if (lang === "es") {
    return [
      "Eres el asistente de ComptaNet Québec DENTRO del área segura de contabilidad.",
      "Tu función es ayudar al cliente a usar la herramienta de contabilidad y comprender conceptos habituales de contabilidad en Québec.",
      "Concéntrate en contabilidad: ingresos, gastos, documentos, categorías de transacciones, GST/QST (TPS/TVQ), períodos, resúmenes anuales y uso de ComptaNet Québec.",
      "Puedes explicar qué información suele ser necesaria para clasificar una transacción, pero no afirmes haber abierto o revisado un documento si su contenido no fue proporcionado.",
      "No afirmes que puedes ver el panel, las transacciones, los documentos o los saldos del cliente si esos datos no aparecen explícitamente en la conversación.",
      "No des asesoría legal ni garantices un tratamiento fiscal.",
      "Para un gasto específico, explica el tratamiento contable habitual y qué hechos o comprobantes son importantes. Si el tratamiento fiscal depende de los hechos, indícalo claramente.",
      "Nunca pidas NAS/SIN, contraseñas, números completos de cuenta bancaria o tarjeta.",
      "Responde de forma conversacional, breve y práctica.",
      "Usa los mensajes anteriores del chat para comprender las preguntas de seguimiento.",
      "Responde en español.",
    ].join("\\n");
  }

  return [
    "Tu es l’assistant ComptaNet Québec À L’INTÉRIEUR de l’espace sécurisé de tenue de livres.",
    "Ton rôle est d’aider le client à utiliser l’outil de tenue de livres et à comprendre les notions courantes de tenue de livres au Québec.",
    "Reste centré sur la tenue de livres : revenus, dépenses, documents, catégories de transactions, TPS/TVQ, périodes, résumé annuel et utilisation de ComptaNet Québec.",
    "Tu peux expliquer quelles informations sont normalement nécessaires pour classer une transaction, mais ne prétends jamais avoir ouvert ou vérifié un document si son contenu ne t’a pas été fourni.",
    "Ne prétends pas voir le tableau de bord, les transactions, les documents ou les soldes du client si ces données ne sont pas explicitement présentes dans la conversation.",
    "Ne donne pas d’avis juridique et ne garantis pas un traitement fiscal.",
    "Pour une dépense précise, explique le traitement habituel en tenue de livres et les faits ou pièces justificatives qui comptent. Si le traitement fiscal dépend des faits, dis-le clairement.",
    "Ne demande jamais le NAS, un mot de passe, un numéro complet de compte bancaire ou de carte.",
    "Réponds comme dans un vrai chat : court, clair, naturel et pratique.",
    "Utilise les messages précédents de la conversation pour comprendre les questions de suivi.",
    "Réponds en français.",
  ].join("\\n");
}

type Intent =
  | "docs"
  | "t1_ta_t2"
  | "bookkeeping"
  | "gst_qst"
  | "process"
  | "pricing"
  | "deadline"
  | "portal"
  | "contact"
  | "unknown";

function detectIntent(text: string): Intent {
  const value = text.toLowerCase();

  // Check the most specific service intents first.
  if (
    /(tps|tvq|gst|qst|sales tax|taxes de vente|taxe de vente|remise|remises|return gst|return qst|declaraci[oó]n gst|declaraci[oó]n qst|mensuel|mensuelle|monthly|trimestriel|trimestrielle|quarterly|annuel|annuelle|annual)/i.test(
      value
    )
  ) {
    return "gst_qst";
  }

  if (
    /(tenue de livres|tenue des livres|bookkeeping|contabilidad|revenu d['’]?entreprise|revenus d['’]?entreprise|business income|ingresos de empresa|d[eé]pense d['’]?entreprise|d[eé]penses d['’]?entreprise|business expense|business expenses|gastos de empresa|transaction|transactions|cat[eé]gorisation|classification|categorization)/i.test(
      value
    )
  ) {
    return "bookkeeping";
  }

  if (
    /(document|documents|documento|documentos|pi[eè]ce|pi[eè]ces|facture|factures|factura|facturas|justificatif|justificatifs|justificante|preuve|proof|receipt|receipts|reçu|reçus|relev[ée]|slip)/i.test(
      value
    )
  ) {
    return "docs";
  }

  if (
    /(t1|t2|travailleur autonome|autonome|self-employed|autónomo|incorpor|corporation|compagnie|company|empresa|sociedad)/i.test(
      value
    )
  ) {
    return "t1_ta_t2";
  }

  if (
    /(prix|tarif|co[uû]t|pricing|price|cost|acompte|deposit|payer|paiement|payment|pago)/i.test(
      value
    )
  ) {
    return "pricing";
  }

  if (
    /(date limite|[eé]ch[eé]ance|deadline|due date|retard|late|penalit[eé]|penalty|fecha l[ií]mite|vencimiento)/i.test(
      value
    )
  ) {
    return "deadline";
  }

  if (
    /(portail|portal|espace client|client area|portal seguro)/i.test(value)
  ) {
    return "portal";
  }

  if (
    /(contact|appeler|t[eé]l[eé]phone|phone|email|courriel|correo|parler|speak|hablar)/i.test(
      value
    )
  ) {
    return "contact";
  }

  if (
    /(comment|how|como|c[oó]mo|proc[eé]dure|procedure|steps?|pasos?|[eé]tape|d[eé]poser|upload|envoyer|submit|send|dossier|file|fonctionne|funciona)/i.test(
      value
    )
  ) {
    return "process";
  }

  return "unknown";
}

function nextActionsFor(intent: Intent, lang: Lang): string[] {
  const map = {
    fr: {
      openTax: "Ouvrir un dossier — Impôt",
      openBookkeeping: "Espace client — Tenue de livres",
      docs: "Quels documents ?",
      diff: "Différence T1, autonome, T2",
      process: "Comment ça fonctionne ?",
      portal: "Portail sécurisé",
      t1: "T1",
      ta: "Travailleur autonome",
      t2: "T2",
      bookkeeping: "Tenue de livres",
      gstqst: "TPS/TVQ",
      periods: "Mensuel, trimestriel ou annuel ?",
      pay: "Paiement",
      deadline: "Date limite",
    },
    en: {
      openTax: "Open a file — Tax",
      openBookkeeping: "Client portal — Bookkeeping",
      docs: "Which documents?",
      diff: "Difference T1, self-employed, T2",
      process: "How does it work?",
      portal: "Secure portal",
      t1: "T1",
      ta: "Self-employed",
      t2: "T2",
      bookkeeping: "Bookkeeping",
      gstqst: "GST/QST",
      periods: "Monthly, quarterly or annual?",
      pay: "Payment",
      deadline: "Deadline",
    },
    es: {
      openTax: "Abrir expediente — Impuestos",
      openBookkeeping: "Portal del cliente — Contabilidad",
      docs: "¿Qué documentos?",
      diff: "Diferencia T1, autónomo, T2",
      process: "¿Cómo funciona?",
      portal: "Portal seguro",
      t1: "T1",
      ta: "Autónomo",
      t2: "T2",
      bookkeeping: "Contabilidad",
      gstqst: "GST/QST (TPS/TVQ)",
      periods: "¿Mensual, trimestral o anual?",
      pay: "Pago",
      deadline: "Fecha límite",
    },
  } as const;

  const c = map[lang];

  switch (intent) {
    case "docs":
      return [c.t1, c.ta, c.bookkeeping, c.openTax];

    case "t1_ta_t2":
      return [c.t1, c.ta, c.t2, c.openTax];

    case "bookkeeping":
      return [c.gstqst, c.docs, c.periods, c.openBookkeeping];

    case "gst_qst":
      return [c.bookkeeping, c.periods, c.docs, c.openBookkeeping];

    case "process":
      return [c.openTax, c.openBookkeeping, c.docs, c.portal];

    case "pricing":
      return [c.t1, c.ta, c.bookkeeping, c.pay];

    case "deadline":
      return [c.t1, c.ta, c.gstqst, c.deadline];

    case "portal":
      return [c.openTax, c.openBookkeeping, c.docs, c.portal];

    case "contact":
      return [c.openTax, c.openBookkeeping, c.process, c.docs];

    default:
      return [c.bookkeeping, c.gstqst, c.docs, c.diff];
  }
}

function tagsFor(intent: Intent): string[] {
  switch (intent) {
    case "docs":
      return ["documents", "justificatifs"];

    case "t1_ta_t2":
      return ["T1", "TA", "T2"];

    case "bookkeeping":
      return ["tenue-de-livres", "revenus", "depenses", "transactions"];

    case "gst_qst":
      return ["TPS", "TVQ", "remises"];

    case "process":
      return ["processus", "portail"];

    case "pricing":
      return ["prix", "paiement"];

    case "deadline":
      return ["délais", "échéances"];

    case "portal":
      return ["portail", "sécurité"];

    case "contact":
      return ["contact", "orientation"];

    default:
      return ["aide", "orientation"];
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout assistant (réessayez).")), ms)
    ),
  ]);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY manquante côté serveur." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Body;
    const lang: Lang =
      body.lang === "en" || body.lang === "es" ? body.lang : "fr";
    const message = (body.message ?? "").trim();
    const context =
      body.context === "bookkeeping" ? "bookkeeping" : "public";

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is HistoryItem =>
              !!item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string" &&
              item.content.trim().length > 0
          )
          .slice(-10)
          .map((item) => ({
            role: item.role as ChatRole,
            content: item.content!.trim().slice(0, MAX_CHARS),
          }))
      : [];

    const ip = getIp(req);
    const rl = rateLimit(ip);

    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: t(
            lang,
            "Trop de requêtes. Réessayez dans 1 minute.",
            "Too many requests. Please try again in 1 minute.",
            "Demasiadas solicitudes. Inténtelo de nuevo en 1 minuto."
          ),
        },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)),
          },
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: t(lang, "Message vide.", "Empty message.", "Mensaje vacío.") },
        { status: 400 }
      );
    }

    if (message.length > MAX_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error: t(
            lang,
            "Message trop long. Merci de résumer (max 1500 caractères).",
            "Message too long. Please shorten it (max 1500 characters).",
            "Mensaje demasiado largo. Por favor resúmalo (máx. 1500 caracteres)."
          ),
        },
        { status: 400 }
      );
    }

    const kind = blockedKind(message);
    const intent = detectIntent(message);

    if (kind) {
      return NextResponse.json({
        ok: true,
        content:
          context === "bookkeeping"
            ? refusal(lang, kind)
            : `${refusal(lang, kind)}\n\n${footer(lang)}`,
        next_actions:
          context === "bookkeeping"
            ? []
            : nextActionsFor("unknown", lang),
        tags: ["safety"],
      });
    }

    const client = new OpenAI({ apiKey });

    const completion = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content:
              context === "bookkeeping"
                ? bookkeepingSystemPrompt(lang)
                : systemPrompt(lang),
          },
          ...history,
          { role: "user", content: message },
        ],
      }),
      15000
    );

    const modelText = completion.choices?.[0]?.message?.content?.trim() ?? "";

    const content =
      context === "bookkeeping"
        ? modelText ||
          t(
            lang,
            "Je n’ai pas réussi à générer une réponse. Réessayez.",
            "I couldn’t generate an answer. Please try again.",
            "No pude generar una respuesta. Inténtelo de nuevo."
          )
        : modelText
          ? `${modelText}\n\n${footer(lang)}`
          : footer(lang);

    return NextResponse.json({
      ok: true,
      content,
      next_actions:
        context === "bookkeeping"
          ? []
          : nextActionsFor(intent, lang),
      tags: tagsFor(intent),
    });
  } catch (e: unknown) {
    console.error("Assistant API error:", e);

    const msg =
      e instanceof Error ? e.message : "Erreur inconnue";

    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
