import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Body = {
  message?: string;
  lang?: "fr" | "en" | "es";
};

function systemPrompt(lang: Body["lang"]) {
  const L = lang ?? "fr";

  if (L === "en") {
    return [
      "You are ComptaNet Québec's help chat.",
      "Provide general information only about Québec tax filing (individual, self-employed, incorporated).",
      "No personalized tax advice, no exact calculations, no guarantees.",
      "If the user asks something personal/specific, ask them to open a file or contact support.",
      "Keep answers short and structured.",
    ].join("\n");
  }

  if (L === "es") {
    return [
      "Eres el chat de ayuda de ComptaNet Québec.",
      "Solo información general sobre impuestos en Québec (particular, autónomo, corporación).",
      "Sin asesoría personalizada, sin cálculos exactos, sin garantías.",
      "Si la pregunta es personal/específica, pedir abrir expediente o contactar soporte.",
      "Respuestas cortas y estructuradas.",
    ].join("\n");
  }

  return [
    "Tu es le chat d’aide de ComptaNet Québec.",
    "Tu donnes uniquement de l’information générale sur l’impôt au Québec (particulier, travailleur autonome, incorporé).",
    "Aucun avis fiscal personnalisé, aucun calcul exact, aucune garantie.",
    "Si la question dépend d’une situation personnelle, invite à ouvrir un dossier ou contacter le support.",
    "Réponses courtes et structurées.",
  ].join("\n");
}

function footer(lang: Body["lang"]) {
  const L = lang ?? "fr";
  if (L === "en")
    return "Note: general information only. For a personalized answer, we must review your situation and documents.";
  if (L === "es")
    return "Nota: información general. Para una respuesta personalizada, debemos revisar tu situación y documentos.";
  return "Note : information générale seulement. Pour un avis personnalisé, il faut analyser votre situation et vos documents.";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY manquante côté serveur." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Body;
    const message = (body.message ?? "").trim();
    const lang = body.lang ?? "fr";

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message vide." }, { status: 400 });
    }

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt(lang) },
        { role: "user", content: message },
      ],
    });

    const content = resp.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({
      ok: true,
      content: content ? `${content}\n\n${footer(lang)}` : footer(lang),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erreur serveur assistant." },
      { status: 500 }
    );
  }
}
