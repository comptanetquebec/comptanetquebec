import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { documentId?: string };

type ParsedTransaction = {
  entry_type: "income" | "expense" | "unknown";
  transaction_date: string | null;
  source: string | null;
  description: string | null;
  reference: string | null;
  subtotal: number | null;
  gst: number | null;
  qst: number | null;
  total: number | null;
  payment_method: "transfer" | "card" | "cash" | "cheque" | "platform" | "other" | "unknown";
  confidence: number;
  notes: string[];
};

type ParsedExtraction = {
  relevant: boolean;
  transactions: ParsedTransaction[];
  document_notes: string[];
};

const transactionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    entry_type: { type: "string", enum: ["income", "expense", "unknown"] },
    transaction_date: { type: ["string", "null"] },
    source: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    reference: { type: ["string", "null"] },
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
    "entry_type", "transaction_date", "source", "description", "reference",
    "subtotal", "gst", "qst", "total", "payment_method", "confidence", "notes",
  ],
} as const;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    relevant: { type: "boolean" },
    transactions: {
      type: "array",
      maxItems: 100,
      items: transactionSchema,
    },
    document_notes: { type: "array", items: { type: "string" } },
  },
  required: ["relevant", "transactions", "document_notes"],
} as const;

function money(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round((value + Number.EPSILON) * 100) / 100
    : null;
}

function normalizeTransaction(item: ParsedTransaction): ParsedTransaction {
  return {
    entry_type: item.entry_type,
    transaction_date: item.transaction_date,
    source: item.source,
    description: item.description,
    reference: item.reference,
    subtotal: money(item.subtotal),
    gst: money(item.gst),
    qst: money(item.qst),
    total: money(item.total),
    payment_method: item.payment_method,
    confidence: typeof item.confidence === "number"
      ? Math.min(1, Math.max(0, item.confidence))
      : 0,
    notes: Array.isArray(item.notes) ? item.notes : [],
  };
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
      return NextResponse.json(
        { ok: false, error: "Document introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    if (doc.size_bytes > 20 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Fichier trop volumineux." }, { status: 400 });
    }

    const { error: analyzingError } = await supabase
      .from("bookkeeping_documents")
      .update({ status: "analyzing", error_message: null })
      .eq("id", documentId);
    if (analyzingError) throw new Error(analyzingError.message);

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("bookkeeping-documents")
      .download(doc.storage_path);
    if (downloadError || !fileBlob) {
      throw new Error("Impossible de télécharger le document sécurisé.");
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const dataUrl = `data:${doc.mime_type};base64,${buffer.toString("base64")}`;
    const isPdf = doc.mime_type === "application/pdf"
      || doc.original_file_name.toLowerCase().endsWith(".pdf");
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(doc.mime_type);
    if (!isPdf && !isImage) {
      throw new Error("Format non pris en charge. Utilisez PDF, JPG, PNG ou WebP.");
    }

    const fileContent = isPdf
      ? { type: "input_file" as const, filename: doc.original_file_name, file_data: dataUrl }
      : { type: "input_image" as const, image_url: dataUrl, detail: "high" as const };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-5.6-sol",
      input: [{
        role: "user",
        content: [
          fileContent,
          {
            type: "input_text",
            text: `Analyse toutes les pages de ce fichier pour la tenue de livres d'une petite entreprise au Québec.

RÈGLES OBLIGATOIRES
- Retourne une transaction distincte pour chaque facture, reçu, vente ou ligne de transaction réellement visible.
- Un fichier contenant 30 transactions doit produire 30 éléments dans transactions.
- Une même facture répartie sur plusieurs pages constitue une seule transaction.
- Si une copie identique apparaît plusieurs fois dans ce fichier, retourne-la une seule fois et indique le doublon dans document_notes.
- Ne devine jamais une date, un montant, une taxe, une source ou un mode de paiement.
- transaction_date doit être AAAA-MM-JJ ou null.
- gst est uniquement la TPS réellement indiquée; qst est uniquement la TVQ réellement indiquée.
- Ne calcule pas une taxe absente. Utilise null lorsqu'une valeur n'est pas lisible.
- Une facture émise par l'entreprise peut être un revenu. Un reçu ou une facture fournisseur peut être une dépense.
- Si le sens est incertain, utilise entry_type=unknown et explique pourquoi dans notes.
- Pour un relevé bancaire ou de plateforme, sépare chaque ligne de transaction exploitable.
- Utilise relevant=false et transactions=[] si le fichier ne contient aucune pièce comptable exploitable.
- N'extrais jamais un numéro complet de carte, compte bancaire, NAS ou autre identifiant sensible.
- Retourne au maximum 100 transactions. Si le fichier en contient davantage, indique-le dans document_notes.`,
          },
        ],
      }],
      text: {
        format: {
          type: "json_schema",
          name: "bookkeeping_multiple_transactions",
          strict: true,
          schema,
        },
      },
    });

    if (!response.output_text) throw new Error("L'IA n'a retourné aucune analyse.");
    const parsed = JSON.parse(response.output_text) as ParsedExtraction;
    const transactions = Array.isArray(parsed.transactions)
      ? parsed.transactions.map(normalizeTransaction)
      : [];
    const extraction: ParsedExtraction = {
      relevant: Boolean(parsed.relevant && transactions.length > 0),
      transactions,
      document_notes: Array.isArray(parsed.document_notes) ? parsed.document_notes : [],
    };

    const confidence = transactions.length
      ? transactions.reduce((total, item) => total + item.confidence, 0) / transactions.length
      : 0;

    const { error: saveError } = await supabase
      .from("bookkeeping_documents")
      .update({
        status: "ready",
        extraction,
        ai_confidence: confidence,
        error_message: null,
      })
      .eq("id", documentId);

    if (saveError) {
      throw new Error(`Analyse réussie, mais sauvegarde impossible : ${saveError.message}`);
    }

    return NextResponse.json({
      ok: true,
      documentId,
      transactionCount: transactions.length,
      extraction,
    });
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
