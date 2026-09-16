import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { documentId?: string };

type TaxCategory =
  | "advertising"
  | "meals_entertainment"
  | "bad_debts"
  | "insurance"
  | "interest_bank"
  | "licenses_dues"
  | "office"
  | "supplies"
  | "professional_fees"
  | "management_admin"
  | "rent"
  | "repairs_maintenance"
  | "salaries_wages"
  | "property_taxes"
  | "travel"
  | "utilities"
  | "fuel_non_vehicle"
  | "delivery_freight"
  | "motor_vehicle"
  | "home_office"
  | "capital_asset"
  | "other";

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
  payment_method:
    | "transfer"
    | "card"
    | "cash"
    | "cheque"
    | "platform"
    | "other"
    | "unknown";
  confidence: number;
  notes: string[];

  tax_category: TaxCategory | null;
  tax_category_confidence: number | null;
  tax_category_note: string | null;
};

type ParsedExtraction = {
  relevant: boolean;
  transactions: ParsedTransaction[];
  document_notes: string[];
};

const TAX_CATEGORIES = [
  "advertising",
  "meals_entertainment",
  "bad_debts",
  "insurance",
  "interest_bank",
  "licenses_dues",
  "office",
  "supplies",
  "professional_fees",
  "management_admin",
  "rent",
  "repairs_maintenance",
  "salaries_wages",
  "property_taxes",
  "travel",
  "utilities",
  "fuel_non_vehicle",
  "delivery_freight",
  "motor_vehicle",
  "home_office",
  "capital_asset",
  "other",
] as const;

const transactionSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    entry_type: {
      type: "string",
      enum: ["income", "expense", "unknown"],
    },

    transaction_date: {
      type: ["string", "null"],
    },

    source: {
      type: ["string", "null"],
    },

    description: {
      type: ["string", "null"],
    },

    reference: {
      type: ["string", "null"],
    },

    subtotal: {
      type: ["number", "null"],
    },

    gst: {
      type: ["number", "null"],
    },

    qst: {
      type: ["number", "null"],
    },

    total: {
      type: ["number", "null"],
    },

    payment_method: {
      type: "string",
      enum: [
        "transfer",
        "card",
        "cash",
        "cheque",
        "platform",
        "other",
        "unknown",
      ],
    },

    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },

    notes: {
      type: "array",
      items: {
        type: "string",
      },
    },

    tax_category: {
      type: ["string", "null"],
      enum: [...TAX_CATEGORIES, null],
    },

    tax_category_confidence: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 1,
    },

    tax_category_note: {
      type: ["string", "null"],
    },
  },

  required: [
    "entry_type",
    "transaction_date",
    "source",
    "description",
    "reference",
    "subtotal",
    "gst",
    "qst",
    "total",
    "payment_method",
    "confidence",
    "notes",
    "tax_category",
    "tax_category_confidence",
    "tax_category_note",
  ],
} as const;

const schema = {
  type: "object",
  additionalProperties: false,

  properties: {
    relevant: {
      type: "boolean",
    },

    transactions: {
      type: "array",
      maxItems: 100,
      items: transactionSchema,
    },

    document_notes: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },

  required: [
    "relevant",
    "transactions",
    "document_notes",
  ],
} as const;

function money(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round((value + Number.EPSILON) * 100) / 100
    : null;
}

function confidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : null;
}

function isTaxCategory(value: unknown): value is TaxCategory {
  return (
    typeof value === "string" &&
    (TAX_CATEGORIES as readonly string[]).includes(value)
  );
}

function normalizeTransaction(
  item: ParsedTransaction
): ParsedTransaction {
  const entryType =
    item.entry_type === "income" ||
    item.entry_type === "expense" ||
    item.entry_type === "unknown"
      ? item.entry_type
      : "unknown";

  let taxCategory: TaxCategory | null = null;
  let taxCategoryConfidence: number | null = null;
  let taxCategoryNote: string | null = null;

  /*
   * Le classement fiscal est seulement pertinent
   * pour une dépense.
   */
  if (entryType === "expense") {
    taxCategory = isTaxCategory(item.tax_category)
      ? item.tax_category
      : "other";

    taxCategoryConfidence =
      confidence(item.tax_category_confidence) ?? 0;

    taxCategoryNote =
      typeof item.tax_category_note === "string" &&
      item.tax_category_note.trim()
        ? item.tax_category_note.trim()
        : null;
  }

  return {
    entry_type: entryType,

    transaction_date:
      typeof item.transaction_date === "string"
        ? item.transaction_date
        : null,

    source:
      typeof item.source === "string"
        ? item.source
        : null,

    description:
      typeof item.description === "string"
        ? item.description
        : null,

    reference:
      typeof item.reference === "string"
        ? item.reference
        : null,

    subtotal: money(item.subtotal),

    gst: money(item.gst),

    qst: money(item.qst),

    total: money(item.total),

    payment_method: item.payment_method,

    confidence:
      confidence(item.confidence) ?? 0,

    notes:
      Array.isArray(item.notes)
        ? item.notes
        : [],

    tax_category: taxCategory,

    tax_category_confidence: taxCategoryConfidence,

    tax_category_note: taxCategoryNote,
  };
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  let documentId = "";

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY manquante.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Vérification de l'utilisateur connecté.
     */
    const {
      data: auth,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !auth.user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Non connecté.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Lecture du document demandé.
     */
    const body = (await req.json()) as Body;

    documentId =
      body.documentId?.trim() ?? "";

    if (!documentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Document manquant.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Chargement du document.
     *
     * Les politiques RLS Supabase continuent
     * de contrôler l'accès.
     */
    const {
      data: doc,
      error: docError,
    } = await supabase
      .from("bookkeeping_documents")
      .select(
        "id, business_id, storage_path, original_file_name, mime_type, size_bytes"
      )
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Document introuvable ou accès refusé.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Protection contre les fichiers trop volumineux.
     */
    if (doc.size_bytes > 20 * 1024 * 1024) {
      return NextResponse.json(
        {
          ok: false,
          error: "Fichier trop volumineux.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Le document passe en analyse.
     */
    const {
      error: analyzingError,
    } = await supabase
      .from("bookkeeping_documents")
      .update({
        status: "analyzing",
        error_message: null,
      })
      .eq("id", documentId);

    if (analyzingError) {
      throw new Error(
        analyzingError.message
      );
    }

    /*
     * Téléchargement sécurisé depuis Supabase Storage.
     */
    const {
      data: fileBlob,
      error: downloadError,
    } = await supabase.storage
      .from("bookkeeping-documents")
      .download(doc.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error(
        "Impossible de télécharger le document sécurisé."
      );
    }

    const buffer = Buffer.from(
      await fileBlob.arrayBuffer()
    );

    const dataUrl =
      `data:${doc.mime_type};base64,${buffer.toString("base64")}`;

    const isPdf =
      doc.mime_type === "application/pdf" ||
      doc.original_file_name
        .toLowerCase()
        .endsWith(".pdf");

    const isImage = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(doc.mime_type);

    if (!isPdf && !isImage) {
      throw new Error(
        "Format non pris en charge. Utilisez PDF, JPG, PNG ou WebP."
      );
    }

    /*
     * Le même endpoint fonctionne pour
     * les PDF et les photos.
     */
    const fileContent = isPdf
      ? {
          type: "input_file" as const,
          filename: doc.original_file_name,
          file_data: dataUrl,
        }
      : {
          type: "input_image" as const,
          image_url: dataUrl,
          detail: "high" as const,
        };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    /*
     * Analyse comptable + proposition
     * de classement fiscal.
     */
    const response =
      await openai.responses.create({
        model: "gpt-5.6-sol",

        input: [
          {
            role: "user",

            content: [
              fileContent,

              {
                type: "input_text",

                text: `
Analyse toutes les pages de ce fichier pour la tenue de livres d'une petite entreprise au Québec.

OBJECTIFS

1. Extraire correctement toutes les transactions comptables visibles.

2. Lorsqu'une transaction est une dépense, proposer également une catégorie fiscale destinée à aider à préparer les dépenses d'entreprise du travailleur autonome.

3. Le classement fiscal est une PROPOSITION. Ne transforme jamais une situation ambiguë en certitude.

RÈGLES COMPTABLES OBLIGATOIRES

- Retourne une transaction distincte pour chaque facture, reçu, vente ou ligne de transaction réellement visible.

- Un fichier contenant 30 transactions doit produire 30 éléments dans transactions.

- Une même facture répartie sur plusieurs pages constitue une seule transaction.

- Si une copie identique apparaît plusieurs fois dans ce fichier, retourne-la une seule fois et indique le doublon dans document_notes.

- Ne devine jamais une date, un montant, une taxe, une source ou un mode de paiement.

- transaction_date doit être AAAA-MM-JJ ou null.

- gst est uniquement la TPS réellement indiquée.

- qst est uniquement la TVQ réellement indiquée.

- Ne calcule pas une taxe absente.

- Utilise null lorsqu'une valeur n'est pas lisible.

- Une facture émise par l'entreprise peut être un revenu.

- Un reçu ou une facture fournisseur peut être une dépense.

- Si le sens est incertain, utilise entry_type=unknown et explique pourquoi dans notes.

- Pour un relevé bancaire ou de plateforme, sépare chaque ligne de transaction exploitable.

- Utilise relevant=false et transactions=[] si le fichier ne contient aucune pièce comptable exploitable.

- N'extrais jamais un numéro complet de carte, compte bancaire, NAS ou autre identifiant sensible.

- Retourne au maximum 100 transactions.

- Si le fichier en contient davantage, indique-le dans document_notes.


CLASSEMENT FISCAL DES DÉPENSES

Pour entry_type="expense", choisis UNE des catégories suivantes :

advertising
Publicité.

meals_entertainment
Repas et représentation.

bad_debts
Mauvaises créances.

insurance
Assurances d'entreprise.

interest_bank
Intérêts et frais bancaires liés à l'entreprise.

licenses_dues
Taxes d'affaires, permis, licences et cotisations professionnelles admissibles.

office
Frais de bureau.

supplies
Fournitures consommables utilisées par l'entreprise.

professional_fees
Honoraires juridiques, comptables et autres honoraires professionnels.

management_admin
Frais de gestion et d'administration.

rent
Loyer payé pour des locaux utilisés par l'entreprise.

repairs_maintenance
Entretien et réparations visant généralement à maintenir ou remettre un bien dans son état de fonctionnement.

salaries_wages
Salaires, rémunération et frais de main-d'œuvre lorsqu'ils correspondent à cette catégorie.

property_taxes
Impôts fonciers liés aux locaux ou biens utilisés dans l'entreprise, lorsque cette catégorie est appropriée.

travel
Frais de déplacement ou de voyage d'affaires.

utilities
Services publics tels que chauffage, électricité ou services similaires lorsqu'ils constituent une dépense d'entreprise.

fuel_non_vehicle
Carburant qui ne constitue PAS une dépense de véhicule automobile.

delivery_freight
Livraison, fret, transport et messagerie.

motor_vehicle
Dépenses liées à un véhicule automobile. Cette catégorie pourra nécessiter ultérieurement un calcul du pourcentage d'utilisation commerciale.

home_office
Dépense liée à l'utilisation d'une partie du domicile pour l'entreprise. Cette catégorie pourra nécessiter ultérieurement un calcul spécifique des frais de bureau à domicile.

capital_asset
Achat ou amélioration pouvant constituer une immobilisation et potentiellement relever de la DPA plutôt que d'une dépense courante.

other
Dépense d'entreprise qui ne correspond pas clairement à une catégorie précédente.


RÈGLES DE PRUDENCE POUR LE CLASSEMENT

- Le contenu réel de la facture est plus important que le nom du fournisseur.

- Ne classe pas automatiquement une dépense uniquement parce que tu reconnais le fournisseur.

- Utilise la description des biens ou services achetés.

- Ne décide jamais qu'une dépense est déductible uniquement parce qu'elle apparaît sur une facture.

- Ne décide jamais du pourcentage d'utilisation commerciale d'une dépense mixte personnelle/entreprise.

- Pour une dépense de véhicule, propose motor_vehicle mais ne détermine pas le pourcentage affaires/personnel.

- Pour une dépense liée au domicile, propose home_office lorsqu'elle semble clairement reliée aux frais de bureau à domicile, mais ne calcule pas le pourcentage admissible.

- Une dépense importante pour un équipement ou un bien durable peut être une immobilisation. Dans ce cas, considère capital_asset.

- Une réparation qui maintient simplement un bien en état peut être repairs_maintenance.

- Une amélioration importante qui augmente la valeur, la capacité, la qualité ou la durée de vie d'un bien peut être capital_asset.

- Si une facture ne permet pas de déterminer raisonnablement si les travaux constituent une réparation courante ou une amélioration en capital, choisis la catégorie la plus plausible, DIMINUE tax_category_confidence et explique clairement l'incertitude dans tax_category_note.

- Ne tente pas de déterminer une catégorie de DPA précise à partir d'informations insuffisantes.

- Pour les situations nécessitant des renseignements absents du document, indique ce qui doit être vérifié dans tax_category_note.


CONFIANCE DU CLASSEMENT

tax_category_confidence doit être un nombre entre 0 et 1.

Exemples d'interprétation :

0.90 à 1.00
Le classement est très clairement supporté par le document.

0.75 à 0.89
Le classement est probable mais mérite une vérification normale.

0.50 à 0.74
Le classement est incertain et doit être vérifié.

Sous 0.50
Les informations sont insuffisantes ou plusieurs catégories sont plausibles.


NOTE DE CLASSEMENT

tax_category_note doit être :

- null lorsque le classement est clair et qu'aucune précision particulière n'est nécessaire;

OU

- une courte explication lorsque le classement nécessite une vérification.

Exemples :

"Vérifier si les travaux constituent une réparation courante ou une amélioration en capital."

"Le document ne permet pas de déterminer le pourcentage d'utilisation commerciale du véhicule."

"Le pourcentage d'utilisation du domicile pour l'entreprise doit être déterminé séparément."


REVENUS ET TRANSACTIONS INCONNUES

Pour entry_type="income" :

tax_category=null
tax_category_confidence=null
tax_category_note=null

Pour entry_type="unknown" :

tax_category=null
tax_category_confidence=null
tax_category_note=null
`,
              },
            ],
          },
        ],

        text: {
          format: {
            type: "json_schema",
            name:
              "bookkeeping_multiple_transactions_with_tax_classification",
            strict: true,
            schema,
          },
        },
      });

    if (!response.output_text) {
      throw new Error(
        "L'IA n'a retourné aucune analyse."
      );
    }

    /*
     * Conversion de la réponse structurée.
     */
    const parsed = JSON.parse(
      response.output_text
    ) as ParsedExtraction;

    const transactions =
      Array.isArray(parsed.transactions)
        ? parsed.transactions.map(
            normalizeTransaction
          )
        : [];

    const extraction: ParsedExtraction = {
      relevant: Boolean(
        parsed.relevant &&
          transactions.length > 0
      ),

      transactions,

      document_notes:
        Array.isArray(
          parsed.document_notes
        )
          ? parsed.document_notes
          : [],
    };

    /*
     * Confiance générale de lecture du document.
     *
     * Cette valeur demeure distincte de
     * tax_category_confidence.
     */
    const overallConfidence =
      transactions.length
        ? transactions.reduce(
            (total, item) =>
              total + item.confidence,
            0
          ) / transactions.length
        : 0;

    /*
     * Sauvegarde de l'extraction complète.
     *
     * Les informations de classement fiscal
     * sont maintenant conservées dans extraction.
     */
    const {
      error: saveError,
    } = await supabase
      .from("bookkeeping_documents")
      .update({
        status: "ready",
        extraction,
        ai_confidence:
          overallConfidence,
        error_message: null,
      })
      .eq("id", documentId);

    if (saveError) {
      throw new Error(
        `Analyse réussie, mais sauvegarde impossible : ${saveError.message}`
      );
    }

    return NextResponse.json({
      ok: true,

      documentId,

      transactionCount:
        transactions.length,

      extraction,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur pendant l'analyse.";

    if (documentId) {
      await supabase
        .from("bookkeeping_documents")
        .update({
          status: "error",
          error_message: message,
        })
        .eq("id", documentId);
    }

    console.error(
      "Analyse tenue de livres:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
