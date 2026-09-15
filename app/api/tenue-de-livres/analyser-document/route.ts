import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { documentId?: string };

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    relevant: { type: "boolean" },
    entry_type: { type: "string", enum: ["income", "expense", "unknown"] },
    transaction_date: { type: ["string", "null"] },
    source: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    subtotal: { type: ["number", "null"] },
    gst: { type: ["number", "null"] },
    qst: { type: ["number", "null"] },
    total: { type: ["number", "null"] },
    payment_method: {
      type: "string",
      enum: ["transfer", "card", "cash", "cheque", "platform", "other", "unknown"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    notes: { type: "array", items: { type: "string" } },
  },
  required: [
    "relevant", "entry_type", "transaction_date", "source", "description",
    "subtotal", "gst", "qst", "total", "payment_method", "confidence", "notes",
  ],
} as const;

function round(value: number | null) {
  return value === null || !Number.isFinite(value)
    ? null
    : Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  let documentId = "";

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY manquante." }, { status: 500 });
    }

    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    documentId = body.documentId?.trim() ?? "";
    if (!documentId) {
      return NextResponse.json({ ok: false, error: "Document manquant." }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from("bookkeeping_documents")
      .select("id, business_id, storage_path, original_file_name, mime_type, size_bytes")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ ok: false, error: "Document introuvable ou accès refusé." }, { status: 404 });
    }

    if (doc.size_bytes > 20 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Fichier trop volumineux." }, { status: 400 });
    }

    await supabase
      .from("bookkeeping_documents")
      .update({ status: "analyzing", error_message: null })
      .eq("id", documentId);

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("bookkeeping-documents")
      .download(doc.storage_path);

    if (downloadError || !fileBlob) throw new Error("Impossible de télécharger le document sécurisé.");

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const dataUrl = `data:${doc.mime_type};base64,${buffer.toString("base64")}`;
    const isPdf = doc.mime_type === "application/pdf" || doc.original_file_name.toLowerCase().endsWith(".pdf");
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(doc.mime_type);
    if (!isPdf && !isImage) throw new Error("Format non pris en charge. Utilisez PDF, JPG, PNG ou WebP.");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const fileContent = isPdf
      ? { type: "input_file" as const, filename: doc.original_file_name, file_data: dataUrl }
      : { type: "input_image" as const, image_url: dataUrl, detail: "high" as const };

    const response = await openai.responses.create({
      model: "gpt-5.6-sol",
      input: [{
        role: "user",
        content: [
          fileContent,
          {
            type: "input_text",
            text: `Analyse ce document uniquement pour la tenue de livres d'une petite entreprise au Québec.
Lis toutes les pages ou toute l'image. Retourne seulement les renseignements réellement visibles.
Ne devine jamais une date, un montant, une taxe, une source ou un mode de paiement.
Une facture émise par l'entreprise peut être un revenu; un reçu ou une facture fournisseur peut être une dépense.
Si le sens est incertain, utilise entry_type=unknown et explique-le dans notes.
transaction_date doit être AAAA-MM-JJ ou null.
gst correspond à la TPS réellement indiquée; qst correspond à la TVQ réellement indiquée.
Ne calcule pas une taxe absente du document. Utilise null si une valeur n'est pas lisible.
Marque relevant=false si le document n'est pas une pièce comptable exploitable.
Masque et n'extrais aucun numéro complet de carte, compte bancaire, NAS ou autre identifiant sensible.`,
          },
        ],
      }],
      text: {
        format: {
          type: "json_schema",
          name: "bookkeeping_document_extraction",
          strict: true,
          schema,
        },
      },
    });

    if (!response.output_text) throw new Error("L'IA n'a retourné aucune analyse.");
    const parsed = JSON.parse(response.output_text) as Record<string, unknown>;
    const extraction = {
      ...parsed,
      subtotal: round(typeof parsed.subtotal === "number" ? parsed.subtotal : null),
      gst: round(typeof parsed.gst === "number" ? parsed.gst : null),
      qst: round(typeof parsed.qst === "number" ? parsed.qst : null),
      total: round(typeof parsed.total === "number" ? parsed.total : null),
    };

    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
    const { error: saveError } = await supabase
      .from("bookkeeping_documents")
      .update({
        status: "ready",
        extraction,
        ai_confidence: confidence,
        error_message: null,
      })
      .eq("id", documentId);

    if (saveError) throw new Error(`Analyse réussie, mais sauvegarde impossible : ${saveError.message}`);
    return NextResponse.json({ ok: true, documentId, extraction });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur pendant l'analyse.";
    if (documentId) {
      await supabase
        .from("bookkeeping_documents")
        .update({ status: "error", error_message: message })
        .eq("id", documentId);
    }
    console.error("Analyse tenue de livres:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
