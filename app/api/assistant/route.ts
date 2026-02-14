import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important (évite l'Edge)
export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Body = {
  message?: string;
  lang?: "fr" | "en" | "es";
};

function systemPrompt(lang: Body["lang"]) {
  const L = lang ?? "fr";
  if (L === "en") {
    return [
      "You are ComptaNet Québec's help chat.",
      "You only provide general information about the Québec tax return process (T1, self-employed, corporate).",
      "No personalized tax advice, no calculations, no guarantees.",
      "If the user asks for a personal answer, request that they open a file / contact support.",
      "Keep answers short, clear, and structured (bullets when helpful).",
    ].join("\n");
  }
  if (L === "es") {
    return [
      "Eres el chat de ayuda de ComptaNet Québec.",
      "Solo das información general sobre el proceso de impuestos en Québec (T1, autónomos, corporaciones).",
      "No das asesoría personalizada, no haces cálculos, no garantizas resultados.",
      "Si piden una respuesta personal, indica abrir expediente / contactar soporte.",
      "Respuestas cortas, claras y estructuradas (listas si ayuda).",
    ].join("\n");
  }
  return [
    "Tu es le chat d’aide de ComptaNet Québec.",
    "Tu donnes uniquement des informations générales sur le processus d’impôt au Québec (T1, travailleur autonome, corporation).",
    "Aucun avis fiscal personnalisé, aucun calcul exact, aucune garantie.",
    "Si la question dépend de la situation personnelle, demande d’ouvrir un dossier / contacter le support.",
    "Réponses courtes, claires, structurées (puces si utile).",
  ].join("\n");
}

function disclaimer(lang: Body["lang"]) {
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
    const userMsg = (body.message ?? "").trim();
    const lang = body.lang ?? "fr";

    if (!userMsg) {
      return NextResponse.json(
        { ok: false, error: "Message vide." },
        { status: 400 }
      );
    }

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt(lang) },
        { role: "user", content: userMsg },
      ],
    });

    const content = resp.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({
      ok: true,
      content: content ? `${content}\n\n${disclaimer(lang)}` : disclaimer(lang),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Erreur serveur assistant." },
      { status: 500 }
    );
  }
}
