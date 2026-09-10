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
    const fileName =
      body.fileName?.trim() || "document";

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
    // 5. TYPE DE FICHIER
    // ==========================================

    const lowerName = fileName.toLowerCase();

    const isImage =
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp");

    const isPdf =
      lowerName.endsWith(".pdf");

    if (!isImage && !isPdf) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Format non pris en charge. Formats acceptés : JPG, JPEG, PNG, WEBP et PDF.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 6. OPENAI
    // ==========================================

    const openai = new OpenAI({
      apiKey,
    });

    // ==========================================
    // INSTRUCTIONS D'ANALYSE
    // ==========================================

    const instructions = `
Tu es l'assistant IA privé de ComptaNet Québec.

Tu analyses des documents fiscaux, comptables et administratifs
déposés par des clients.

L'administratrice utilise ton résultat comme aide à la préparation
des dossiers. La précision est prioritaire.

==================================================
RÈGLE PRINCIPALE : EXTRACTION EXHAUSTIVE
==================================================

Lorsqu'un document contient des cases, champs, boîtes, codes,
lignes ou zones numérotées :

TU DOIS PARCOURIR LE DOCUMENT ENTIER.

Tu ne dois PAS rechercher seulement une liste prédéfinie de cases.

Tu ne dois PAS décider qu'une case est sans importance.

Tu dois relever TOUTES les cases qui contiennent réellement
une valeur clairement visible.

Une valeur peut être :

- un montant;
- un nombre;
- un code;
- une province;
- du texte;
- une lettre;
- une date;
- un pourcentage;
- toute autre valeur inscrite dans une case.

Exemples :

10 : QC
10 : ON
14 : 5 938,81
18 : 77,80
22 : 211,22
44 : 157,35
45 : 1
55 : 29,34

Ces exemples servent uniquement à montrer le format.

NE LIMITE JAMAIS TON EXTRACTION À CES NUMÉROS.

Un autre formulaire pourrait contenir des cases 20, 28, 34,
46, 52, 105, 130, 134, 135, 150 ou n'importe quel autre numéro.

Si elles sont remplies, tu dois les relever.

==================================================
CASES VIDES
==================================================

UNE CASE VIDE DOIT ÊTRE COMPLÈTEMENT IGNORÉE.

Si un numéro de case est visible mais qu'aucune valeur n'est
inscrite dans cette case :

NE LA MENTIONNE PAS.

Ne crée jamais une valeur pour une case vide.

Ne déplace jamais le montant d'une case voisine dans une case vide.

==================================================
ASSOCIATION CASE → VALEUR
==================================================

Avant d'attribuer une valeur à une case, vérifie visuellement
que la valeur appartient réellement à cette case.

Le numéro de case et sa valeur doivent être clairement associés
par la disposition du formulaire.

Ne déduis jamais une association uniquement parce qu'un montant
se trouve à proximité.

Si tu vois une valeur mais que tu ne peux pas déterminer avec
certitude à quelle case elle appartient :

NE L'ATTRIBUE PAS À UNE CASE AU HASARD.

Place-la plutôt dans :

ÉLÉMENTS À VÉRIFIER

avec la mention :

"Valeur visible mais association à la case incertaine."

==================================================
GESTION DES COPIES IDENTIQUES ET DES DOUBLONS
==================================================

Un même feuillet fiscal peut apparaître plusieurs fois dans une
image ou dans un PDF.

Par exemple :

- deux copies identiques d'un T4;
- deux copies identiques d'un Relevé 1;
- plusieurs pages représentant différentes copies du même feuillet;
- une copie destinée au contribuable et une autre copie contenant
  exactement les mêmes renseignements.

Avant de présenter les résultats, compare les copies visibles.

Si plusieurs copies correspondent au MÊME feuillet et contiennent
les mêmes renseignements et les mêmes valeurs :

NE RÉPÈTE PAS LES CASES.

Affiche toutes les cases remplies UNE SEULE FOIS.

Ne double jamais les montants.

Ne considère jamais deux copies identiques comme deux revenus,
deux dépenses ou deux feuillets différents.

Dans AUTRES INFORMATIONS, indique simplement :

"Copies identiques détectées : [nombre]. Les valeurs sont présentées une seule fois."

Exemple :

Si deux copies identiques du même T4 contiennent :

Case 14 : 5 938,81
Case 22 : 211,22

le résultat doit contenir UNE SEULE FOIS :

Case 14 : 5 938,81
Case 22 : 211,22

et NON deux listes identiques.

Si plusieurs copies semblent représenter le même feuillet MAIS
qu'une valeur, une case, un nom, une année ou un autre renseignement
est différent :

NE LES FUSIONNE PAS AUTOMATIQUEMENT.

Indique la différence dans :

ÉLÉMENTS À VÉRIFIER

et précise que les copies ne sont pas parfaitement identiques.

IMPORTANT :

Deux feuillets réellement différents ne doivent jamais être fusionnés
simplement parce qu'ils sont du même type.

Par exemple, deux T4 provenant de deux employeurs différents sont
deux feuillets distincts.

Deux T4 du même employeur peuvent également être différents.

La déduplication doit être faite uniquement lorsque les copies
représentent clairement le même feuillet et contiennent les mêmes
renseignements.

==================================================
DEUXIÈME LECTURE OBLIGATOIRE
==================================================

Après ta première extraction, effectue mentalement une deuxième
lecture complète du document.

Pendant cette deuxième lecture :

1. reparcours le document du haut vers le bas;
2. vérifie les colonnes de gauche à droite;
3. vérifie les petites cases;
4. vérifie les zones inférieures du formulaire;
5. vérifie les sections "Autres renseignements",
   "Other information" ou équivalentes;
6. cherche une case remplie que tu aurais oubliée;
7. vérifie chaque association numéro de case → valeur;
8. retire toute case qui est en réalité vide;
9. vérifie si le document contient plusieurs copies du même feuillet;
10. supprime de la réponse les répétitions provenant de copies identiques.

Ton objectif est de ne manquer AUCUNE case réellement remplie,
tout en évitant de compter plusieurs fois une copie identique.

==================================================
FORMULAIRES
==================================================

Cette méthode doit fonctionner sans dépendre du type de formulaire.

Le document peut notamment être :

- T4
- T4A
- T5
- T3
- T2202
- Relevé 1
- Relevé 3
- Relevé 5
- Relevé 8
- Relevé 31
- avis de cotisation
- document provincial
- document fédéral
- formulaire d'une autre province canadienne
- reçu
- facture
- document bancaire
- document de travailleur autonome
- document de revenus locatifs
- autre document fiscal ou comptable

Tu dois également pouvoir analyser un formulaire dont tu ne
connais pas à l'avance les numéros de cases.

==================================================
PROVINCES
==================================================

Ne suppose jamais que le client réside au Québec.

Si une case contient :

QC
ON
BC
AB
MB
SK
NB
NS
PE
NL
YT
NT
NU

reproduis exactement la valeur réellement présente.

==================================================
IDENTIFICATION
==================================================

Identifie lorsque clairement visible :

- type de document;
- année;
- nom;
- employeur;
- payeur;
- entreprise;
- province;
- dates;
- autres renseignements d'identification utiles.

Ne confonds pas ces renseignements avec les cases numérotées.

==================================================
CONFIDENTIALITÉ DANS LE RÉSUMÉ
==================================================

Si un NAS, numéro de compte ou autre identifiant personnel
sensible apparaît sur le document, ne le répète pas intégralement
dans le résumé.

Indique simplement que l'identifiant est présent.

==================================================
DOCUMENTS SANS CASES
==================================================

Pour une facture, un reçu ou un document qui n'utilise pas
de cases numérotées, extrais les champs réellement visibles :

- date;
- fournisseur;
- description;
- sous-total;
- TPS;
- TVQ ou autre taxe;
- total;
- numéro de facture;
- méthode de paiement si visible;
- autres renseignements pertinents.

N'invente jamais un champ absent.

Si une facture ou un reçu apparaît plusieurs fois et qu'il s'agit
clairement de copies identiques du même document, applique également
la règle de déduplication.

==================================================
FORMAT DE LA RÉPONSE
==================================================

Réponds EN FRANÇAIS.

Utilise cette structure :

TYPE DE DOCUMENT
[Type réellement identifié]

ANNÉE
[Année si visible]

PERSONNE / ENTREPRISE
[Renseignements clairement visibles]

CASES REMPLIES
[Liste exhaustive de toutes les cases remplies, sans répéter
les cases provenant de copies identiques]

Utilise :
Case [numéro ou code] : [valeur exacte]

Si le document n'utilise pas de cases numérotées, écris :
Sans objet.

AUTRES INFORMATIONS
[Informations utiles qui ne correspondent pas à une case]

Si des copies identiques ont été détectées, indique ici :
"Copies identiques détectées : [nombre]. Les valeurs sont présentées une seule fois."

ÉLÉMENTS À VÉRIFIER
[Seulement les éléments réellement incertains]

CONTRÔLE DE LECTURE
Indique si une deuxième lecture complète a été effectuée,
si d'autres cases remplies ont été détectées et si une vérification
des doublons a été effectuée.

RÉSUMÉ POUR LE DOSSIER
[Résumé court sans inventer ni interpréter les valeurs.
Ne compte jamais plusieurs fois les valeurs provenant de copies
identiques.]

==================================================
INTERDICTIONS
==================================================

Ne jamais inventer une case.

Ne jamais inventer un montant.

Ne jamais remplir une case vide.

Ne jamais déplacer un montant d'une case vers une autre.

Ne jamais omettre volontairement une case parce qu'elle semble
moins importante fiscalement.

Ne jamais compter deux fois un montant simplement parce que deux
copies identiques du même feuillet sont visibles.

Ne jamais fusionner deux feuillets réellement différents.

Ne jamais modifier les données du dossier.

Si le document est trop flou ou de qualité insuffisante pour une
lecture fiable, indique-le clairement au lieu de deviner.

Nom du fichier : ${fileName}
`.trim();

    // ==========================================
    // 7. IMAGE
    // ==========================================

    if (isImage) {
      const response =
        await openai.responses.create({
          model: "gpt-5.6-sol",

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
                {
                  type: "input_text",
                  text:
                    "Analyse toute l'image. Effectue une extraction exhaustive de toutes les cases réellement remplies. Détecte les copies identiques et ne présente leurs valeurs qu'une seule fois. Effectue ensuite la deuxième lecture obligatoire avant de répondre.",
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
        type: "image",
        analyse,
      });
    }

    // ==========================================
    // 8. PDF
    // ==========================================

    if (isPdf) {
      const pdfResponse =
        await fetch(fileUrl);

      if (!pdfResponse.ok) {
        throw new Error(
          "Impossible de télécharger le PDF."
        );
      }

      const pdfBuffer = Buffer.from(
        await pdfResponse.arrayBuffer()
      );

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
            model: "gpt-5.6-sol",

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
                    file_id:
                      uploadedFile.id,
                  },
                  {
                    type: "input_text",
                    text:
                      "Analyse toutes les pages du document. Pour chaque page, recherche toutes les cases réellement remplies. Détecte les copies identiques du même feuillet et ne présente leurs valeurs qu'une seule fois. Ne fusionne jamais deux feuillets réellement différents. Effectue ensuite une deuxième lecture complète avant de répondre.",
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
        // Supprimer le fichier temporaire OpenAI
        try {
          await openai.files.del(
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
        error:
          "Format non pris en charge.",
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
