import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lang = "fr" | "en" | "es";
type Body = { message?: string; lang?: Lang };

const MAX_CHARS = 1500;

// Rate limit simple en mémoire (utile, mais pas parfait sur Vercel multi-instances)
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 12; // 12 requêtes / minute / IP
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

  hit.count++;
  return { ok: true };
}

// Filtre minimal "high risk" (pas besoin d'une liste infinie)
const BLOCK_PATTERNS: Array<{ re: RegExp; kind: "fraud" | "sexual" }> = [
  // fraude / contournement / falsification
  { re: /\b(fraude|frauder|évasion|evasion|contourn(e|er|ement)|dissimuler|falsifier|fausse\s*facture|factures?\s*fausses)\b/i, kind: "fraud" },
  // contenu sexuel explicite (au cas où)
  { re: /\b(porn|porno|xxx|nude|nud(e|ité)|sexe)\b/i, kind: "sexual" },
];

function blockedKind(text: string): "fraud" | "sexual" | null {
  for (const p of BLOCK_PATTERNS) if (p.re.test(text)) return p.kind;
  return null;
}

function refusal(lang: Lang, kind: "fraud" | "sexual") {
  if (lang === "en") {
    return kind === "fraud"
      ? "I can’t help with tax fraud, evasion, or bypassing rules. If you have a general question about Québec tax filing, I can help."
      : "I can’t help with sexual content. If you have a general question about Québec tax filing, I can help.";
  }
  if (lang === "es") {
    return kind === "fraud"
      ? "No puedo ayudar con fraude fiscal, evasión o formas de eludir reglas. Si tienes una pregunta general sobre impuestos en Québec, puedo ayudar."
      : "No puedo ayudar con contenido sexual. Si tienes una pregunta general sobre impuestos en Québec, puedo ayudar.";
  }
  return kind === "fraud"
    ? "Je ne peux pas aider avec la fraude fiscale, l’évasion ou le contournement des règles. Si vous avez une question générale sur l’impôt au Québec, je peux aider."
    : "Je ne peux pas aider avec du contenu sexuel. Si vous avez une question générale sur l’impôt au Québec, je peux aider.";
}

function systemPrompt(lang: Lang) {
  if (lang === "en") {
    return [
      "You are ComptaNet Québec's help chat for general information only.",
      "Scope: general guidance about Québec tax filing (individual, self-employed, incorporated), documents, process, timelines, pricing pages, how to use the portal.",
      "Do NOT provide personalized tax advice, do NOT compute exact tax amounts, do NOT guarantee outcomes.",
      "If the user asks for a personalized answer, request they open a file / contact support.",
      "Refuse any request related to tax fraud, evasion, bypassing rules, falsification, or illegal activity.",
      "Keep answers short, structured, and clear.",
    ].join("\n");
  }

  if (lang === "es") {
    return [
      "Eres el chat de ayuda de ComptaNet Québec (solo información general).",
      "Alcance: orientación general sobre impuestos en Québec (particular, autónomo, corporación), documentos, proceso, plazos, precios, uso del portal.",
      "NO des asesoría personalizada, NO calcules montos exactos, NO garantices resultados.",
      "Si piden una respuesta personalizada, indica abrir expediente / contactar soporte.",
      "Rechaza solicitudes de fraude, evasión, eludir reglas, falsificación o actividades ilegales.",
      "Respuestas cortas, claras y estructuradas.",
    ].join("\n");
  }

  return [
    "Tu es le chat d’aide de ComptaNet Québec (information générale seulement).",
    "Portée : info générale sur l’impôt au Québec (particulier, travailleur autonome, incorporé), documents, processus, délais, pages de tarifs, utilisation du portail.",
    "Aucun avis fiscal personnalisé, aucun calcul exact, aucune garantie de résultat.",
    "Si la question dépend d’une situation personnelle, invite à ouvrir un dossier / contacter le support.",
    "Refuse toute demande liée à la fraude fiscale, l’évasion, le contournement des règles, la falsification ou une activité illégale.",
    "Réponses courtes, claires, structurées.",
  ].join("\n");
}

function footer(lang: Lang) {
  if (lang === "en")
    return "Note: general information only. For a personalized answer, we must review your situation and documents.";
  if (lang === "es")
    return "Nota: información general. Para una respuesta personalizada, debemos revisar tu situación y documentos.";
  return "Note : information générale seulement. Pour un avis personnalisé, il faut analyser votre situation et vos documents.";
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

    // Rate limit
    const ip = getIp(req);
    const rl = rateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Trop de requêtes. Réessayez dans 1 minute." },
        { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = (await req.json()) as Body;
    const lang: Lang = body.lang ?? "fr";
    const message = (body.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message vide." }, { status: 400 });
    }

    if (message.length > MAX_CHARS) {
      return NextResponse.json(
        { ok: false, error: "Message trop long. Merci de résumer (max 1500 caractères)." },
        { status: 400 }
      );
    }

    // Filtre "high risk"
    const kind = blockedKind(message);
    if (kind) {
      return NextResponse.json(
        { ok: true, content: `${refusal(lang, kind)}\n\n${footer(lang)}` },
        { status: 200 }
      );
    }

    const client = new OpenAI({ apiKey });

    const resp = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt(lang) },
          { role: "user", content: message },
        ],
      }),
      15_000
    );

    const content = resp.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({
      ok: true,
      content: content ? `${content}\n\n${footer(lang)}` : footer(lang),
    });
  } catch (e: unknown) {
    console.error("Assistant API error:", e);
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
