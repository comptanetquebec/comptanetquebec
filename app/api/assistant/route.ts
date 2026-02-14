import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lang = "fr" | "en" | "es";

type Body = {
  message?: string;
  lang?: Lang;
};

function systemPrompt(lang: Lang) {
  if (lang === "en") {
    return [
      "You are ComptaNet Québec's help chat.",
      "Provide general information only about Québec tax filing (individual, self-employed, incorporated).",
      "No personalized tax advice, no exact calculations, no guarantees.",
      "If the user asks something personal/specific, ask them to open a file or contact support.",
      "Keep answers short and structured.",
    ].join("\n");
  }

  if (lang === "es") {
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

function footer(lang: Lang) {
  if (lang === "en")
    return "Note: general information only. For a personalized answer, we must review your situation and documents.";
  if (lang === "es")
    return "Nota: información general. Para una respuesta personalizada, debemos revisar tu situación y documentos.";
  return "Note : information générale seulement. Pour un avis personnalisé, il faut analyser votre situation et vos documents.";
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

    const client = new OpenAI({ apiKey });

    const body = (await req.json()) as Body;
    const message = (body.message ?? "").trim();
    const lang: Lang = body.lang ?? "fr";

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
  } catch (e: unknown) {
    // ✅ log complet dans Vercel Logs
    console.error("Assistant API error:", e);

    // ✅ renvoie un message lisible dans Network → Response
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
