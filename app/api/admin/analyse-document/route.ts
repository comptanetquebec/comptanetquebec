import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  fileUrl?: string;
  fileName?: string;
};

type ProfileRow = {
  is_admin: boolean | null;
};

export async function POST(req: Request) {
  try {
    // ==========================================
    // 1. VÉRIFIER L'UTILISATEUR
    // ==========================================

    const supabase = await supabaseServer();

    const { data: auth, error: authError } =
      await supabase.auth.getUser();

    if (authError || !auth?.user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Non connecté.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. VÉRIFIER QUE C'EST UN ADMIN
    // ==========================================

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user.id)
        .maybeSingle<ProfileRow>();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        {
          ok: false,
          error: "Accès refusé.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 3. VÉRIFIER OPENAI
    // ==========================================

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY manquante.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 4. LIRE LA DEMANDE
    // ==========================================

    const body = (await req.json()) as Body;

    const fileUrl = body.fileUrl?.trim();
    const fileName = body.fileName?.trim() || "document";

    if (!fileUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "URL du document manquante.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. DÉTECTER LE TYPE DE FICHIER
    // ==========================================

    const lowerName = fileName.toLowerCase();

    const isImage =
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp");

    const isPdf = lowerName.endsWith(".pdf");

    if (!isImage && !isPdf) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Ce type de fichier n'est pas encore pris en charge par l'analyse IA. Formats acceptés : JPG, JPEG, PNG, WEBP et PDF.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 6. CLIENT OPENAI
    // ==========================================

    const openai = new OpenAI({
      apiKey,
    });

    const instructions = `
Tu es l'assistant privé de ComptaNet Québec.

Tu travailles uniquement pour l'administratrice de ComptaNet Québec.

Tu analyses des documents transmis par des clients dans le cadre
de la préparation de dossiers fiscaux et de tenue de livres.

RÈGLES IMPORTANTES :

- Extrais uniquement les informations réellement présentes.
- N'invente jamais une donnée.
- Si une information est illisible, indique "illisible".
- Si tu n'es pas certain, indique clairement "à vérifier".
- Ne prends aucune décision fiscale automatiquement.
- Ne modifie aucune donnée du dossier.
- Ton rôle est d'assister l'administratrice qui effectuera la validation.

IDENTIFIE SI POSSIBLE :

- type de document;
- année;
- nom de la personne;
- nom de l'entreprise ou de l'émetteur;
- numéros de feuillets ou cases importantes;
- revenus;
- impôts retenus;
- cotisations;
- taxes;
- dépenses;
- TPS;
- TVQ;
- montants payés;
- dates;
- informations utiles à une déclaration fiscale;
- informations utiles à un travailleur autonome;
- informations utiles à des revenus de location.

DOCUMENTS POSSIBLES :

T4
Relevé 1
T4A
T5
T3
Relevé 3
Relevé 31
avis de cotisation
facture
reçu
dépense
revenu de travailleur autonome
revenu de location
document gouvernemental
document bancaire
autre pièce justificative

Réponds EN FRANÇAIS.

Utilise exactement cette structure :

TYPE DE DOCUMENT
...

ANNÉE
...

PERSONNE / ENTREPRISE
...

INFORMATIONS IMPORTANTES
...

MONTANTS
...

ÉLÉMENTS À VÉRIFIER
...

RÉSUMÉ POUR LE DOSSIER
...

Le fichier analysé s'appelle : ${fileName}
`.trim();

    // ==========================================
    // 7. ANALYSER UNE IMAGE
    // ==========================================

    if (isImage) {
      const response = await openai.responses.create({
        model: "gpt-4o-mini",

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: instructions,
              },
            ],
          },

          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: fileUrl,
                detail: "high",
              },
            ],
          },
        ],
      });

      const analyse = response.output_text?.trim();

      if (!analyse) {
        throw new Error(
          "Aucune analyse retournée par l'IA."
        );
      }

      return NextResponse.json({
        ok: true,
        fileName,
        type: "image",
        analyse,
      });
    }

    // ==========================================
    // 8. ANALYSER UN PDF
    // ==========================================

    if (isPdf) {
      const pdfResponse = await fetch(fileUrl);

      if (!pdfResponse.ok) {
        throw new Error(
          "Impossible de télécharger le PDF."
        );
      }

      const pdfBuffer =
        Buffer.from(await pdfResponse.arrayBuffer());

      const uploadedFile =
        await openai.files.create({
          file: new File(
            [pdfBuffer],
            fileName,
            {
              type: "application/pdf",
            }
          ),
          purpose: "user_data",
        });

      try {
        const response =
          await openai.responses.create({
            model: "gpt-4o-mini",

            input: [
              {
                role: "system",
                content: [
                  {
                    type: "input_text",
                    text: instructions,
                  },
                ],
              },

              {
                role: "user",
                content: [
                  {
                    type: "input_file",
                    file_id: uploadedFile.id,
                  },
                  {
                    type: "input_text",
                    text:
                      "Analyse ce document selon les instructions.",
                  },
                ],
              },
            ],
          });

        const analyse =
          response.output_text?.trim();

        if (!analyse) {
          throw new Error(
            "Aucune analyse retournée par l'IA."
          );
        }

        return NextResponse.json({
          ok: true,
          fileName,
          type: "pdf",
          analyse,
        });
      } finally {
        // Le PDF n'a pas besoin de rester chez OpenAI
        try {
          await openai.files.delete(
            uploadedFile.id
          );
        } catch (deleteError) {
          console.error(
            "Suppression fichier OpenAI:",
            deleteError
          );
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Format non pris en charge.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error(
      "Erreur analyse document IA:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue pendant l'analyse.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
