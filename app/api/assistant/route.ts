import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lang = "fr" | "en" | "es";
type Body = { message?: string; lang?: Lang };

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
      "Je ne peux pas aider avec la fraude fiscale, l’évasion ou le contournement des règles. Je peux toutefois aider avec une question générale sur l’impôt au Québec.",
      "I can’t help with tax fraud, evasion, or bypassing rules. I can still help with a general question about Québec taxes.",
      "No puedo ayudar con fraude fiscal, evasión o formas de eludir reglas. Sí puedo ayudar con una pregunta general sobre impuestos en Québec."
    );
  }

  return t(
    lang,
    "Je ne peux pas aider avec du contenu sexuel. Je peux toutefois aider avec une question générale sur l’impôt au Québec.",
    "I can’t help with sexual content. I can still help with a general question about Québec taxes.",
    "No puedo ayudar con contenido sexual. Sí puedo ayudar con una pregunta general sobre impuestos en Québec."
  );
}

function systemPrompt(lang: Lang): string {
  if (lang === "en") {
    return [
      "You are ComptaNet Québec's assistant for GENERAL INFORMATION ONLY.",
      "Allowed scope: Québec tax filing general guidance, documents, process, deadlines, payment flow, secure portal, file types (T1, self-employed, T2).",
      "Do not provide personalized tax advice.",
      "Do not calculate exact taxes or refunds.",
      "Do not guarantee outcomes.",
      "If the answer depends on the user's personal situation, say they must open a file and submit documents.",
      "Keep answers concise, clear, and practical.",
      "Prefer 1 short paragraph plus 2 to 4 short bullet points when useful.",
      "End with a practical next step.",
    ].join("\n");
  }

  if (lang === "es") {
    return [
      "Eres el asistente de ComptaNet Québec para INFORMACIÓN GENERAL SOLAMENTE.",
      "Alcance permitido: orientación general sobre impuestos en Québec, documentos, proceso, plazos, pagos, portal seguro y tipos de expediente (T1, autónomo, T2).",
      "No des asesoría fiscal personalizada.",
      "No calcules montos exactos de impuestos o reembolsos.",
      "No garantices resultados.",
      "Si la respuesta depende de la situación personal del usuario, indica que debe abrir un expediente y subir sus documentos.",
      "Respuestas breves, claras y prácticas.",
      "Prefiere 1 párrafo corto y de 2 a 4 viñetas cortas si ayuda.",
      "Termina con un siguiente paso concreto.",
    ].join("\n");
  }

  return [
    "Tu es l’assistant de ComptaNet Québec pour de l’INFORMATION GÉNÉRALE SEULEMENT.",
    "Portée permise : info générale sur l’impôt au Québec, documents, processus, délais, paiement, portail sécurisé et types de dossier (T1, autonome, T2).",
    "Ne donne jamais d’avis fiscal personnalisé.",
    "Ne calcule jamais d’impôt ou de remboursement exact.",
    "Ne garantis jamais un résultat.",
    "Si la réponse dépend de la situation personnelle du client, indique qu’il faut ouvrir un dossier et transmettre les documents.",
    "Réponses courtes, claires et pratiques.",
    "Privilégie 1 court paragraphe et 2 à 4 puces courtes si utile.",
    "Termine par une prochaine étape concrète.",
  ].join("\n");
}

type Intent =
  | "docs"
  | "t1_ta_t2"
  | "process"
  | "pricing"
  | "deadline"
  | "portal"
  | "contact"
  | "unknown";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();

  if (/(document|documents|documento|documentos|pi[eè]ce|facture|factura|justificatif|justificante|preuve|proof|receipt|relev[ée]|slip)/i.test(t)) {
    return "docs";
  }

  if (/(t1|t2|travailleur autonome|autonome|self-employed|autónomo|incorpor|corporation|compagnie|company|empresa|sociedad)/i.test(t)) {
    return "t1_ta_t2";
  }

  if (/(comment|how|como|proc[eé]dure|procedure|steps?|pasos?|[eé]tape|d[eé]poser|upload|envoyer|submit|send|dossier|file|portal|portail|fonctionne|funciona)/i.test(t)) {
    return "process";
  }

  if (/(prix|tarif|co[uû]t|pricing|price|cost|acompte|deposit|payer|paiement|payment|pago)/i.test(t)) {
    return "pricing";
  }

  if (/(date limite|[eé]ch[eé]ance|deadline|due date|retard|late|penalit[eé]|penalty|fecha l[ií]mite|vencimiento)/i.test(t)) {
    return "deadline";
  }

  if (/(portail|portal|espace client|client area|portal seguro)/i.test(t)) {
    return "portal";
  }

  if (/(contact|appeler|t[eé]l[eé]phone|phone|email|courriel|correo|parler|speak|hablar)/i.test(t)) {
    return "contact";
  }

  return "unknown";
}

function nextActionsFor(intent: Intent, lang: Lang): string[] {
  const map = {
    fr: {
      open: "Ouvrir un dossier",
      docs: "Quels documents ?",
      diff: "Différence T1, autonome, T2",
      process: "Comment ça fonctionne ?",
      portal: "Portail sécurisé",
      t1: "T1",
      ta: "Travailleur autonome",
      t2: "T2",
      pay: "Paiement",
      deadline: "Date limite",
    },
    en: {
      open: "Open a file",
      docs: "Which documents?",
      diff: "Difference T1, self-employed, T2",
      process: "How does it work?",
      portal: "Secure portal",
      t1: "T1",
      ta: "Self-employed",
      t2: "T2",
      pay: "Payment",
      deadline: "Deadline",
    },
    es: {
      open: "Abrir expediente",
      docs: "¿Qué documentos?",
      diff: "Diferencia T1, autónomo, T2",
      process: "¿Cómo funciona?",
      portal: "Portal seguro",
      t1: "T1",
      ta: "Autónomo",
      t2: "T2",
      pay: "Pago",
      deadline: "Fecha límite",
    },
  } as const;

  const c = map[lang];

  switch (intent) {
    case "docs":
      return [c.t1, c.ta, c.t2, c.open];
    case "t1_ta_t2":
      return [c.t1, c.ta, c.t2, c.open];
    case "process":
      return [c.open, c.docs, c.portal];
    case "pricing":
      return [c.t1, c.ta, c.t2, c.pay];
    case "deadline":
      return [c.t1, c.ta, c.t2, c.deadline];
    case "portal":
      return [c.open, c.docs, c.portal];
    case "contact":
      return [c.open, c.process, c.docs];
    default:
      return [c.open, c.docs, c.diff, c.process];
  }
}

function tagsFor(intent: Intent): string[] {
  switch (intent) {
    case "docs":
      return ["documents", "justificatifs"];
    case "t1_ta_t2":
      return ["T1", "TA", "T2"];
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

    const ip = getIp(req);
    const rl = rateLimit(ip);

    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: t(
            "fr",
            "Trop de requêtes. Réessayez dans 1 minute.",
            "Too many requests. Please try again in 1 minute.",
            "Demasiadas solicitudes. Inténtelo de nuevo en 1 minuto."
          ),
        },
        {
          status: 429,
          headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      );
    }

    const body = (await req.json()) as Body;
    const lang: Lang = body.lang === "en" || body.lang === "es" ? body.lang : "fr";
    const message = (body.message ?? "").trim();

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
        content: `${refusal(lang, kind)}\n\n${footer(lang)}`,
        next_actions: nextActionsFor("unknown", lang),
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
          { role: "system", content: systemPrompt(lang) },
          { role: "user", content: message },
        ],
      }),
      15000
    );

    const modelText = completion.choices?.[0]?.message?.content?.trim() ?? "";

    const content = modelText
      ? `${modelText}\n\n${footer(lang)}`
      : footer(lang);

    return NextResponse.json({
      ok: true,
      content,
      next_actions: nextActionsFor(intent, lang),
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
