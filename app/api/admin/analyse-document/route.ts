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
- plusieurs exemplaires identiques d'un reçu REER;
- une copie destinée au contribuable et une autre copie contenant
  exactement les mêmes renseignements.

Avant de présenter les résultats, compare les copies visibles.

Si plusieurs copies correspondent au MÊME document et contiennent
les mêmes renseignements et les mêmes valeurs :

NE RÉPÈTE PAS LES CASES OU LES MONTANTS.

Affiche toutes les informations UNE SEULE FOIS.

Ne double jamais les montants.

Ne considère jamais deux copies identiques comme deux revenus,
deux dépenses, deux cotisations ou deux feuillets différents.

Dans AUTRES INFORMATIONS, indique simplement :

"Copies identiques détectées : [nombre]. Les valeurs sont présentées une seule fois."

Si plusieurs copies semblent représenter le même document MAIS
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
représentent clairement le même document et contiennent les mêmes
renseignements.

==================================================
RÈGLE SPÉCIALE : REÇUS REER
==================================================

Lorsqu'un document est un reçu de cotisation REER / RRSP :

Identifie et reproduis exactement, lorsqu'ils sont visibles :

- le nom du rentier;
- l'année d'imposition indiquée;
- la période indiquée sur le reçu;
- le montant exact de la cotisation;
- le numéro du reçu;
- l'émetteur;
- les autres renseignements utiles clairement visibles.

La période est particulièrement importante.

Si le reçu indique une période correspondant clairement à
JANVIER et/ou FÉVRIER de l'année suivant l'année d'imposition,
indique clairement dans AUTRES INFORMATIONS :

"Période REER : 60 premiers jours de [année]."

Exemple :

Année d'imposition : 2025
Période indiquée : JAN-FEV 26

Tu dois indiquer :

"Période REER : 60 premiers jours de 2026."

Conserve TOUJOURS également la période originale exactement
comme elle apparaît sur le reçu.

Par exemple :

"Période originale du reçu : JAN-FEV 26."

Si le reçu correspond clairement au reste de l'année plutôt
qu'aux 60 premiers jours, indique :

"Période REER : hors des 60 premiers jours de l'année suivante."

Si la période est absente, illisible ou ambiguë :

NE DEVINE PAS.

Indique dans ÉLÉMENTS À VÉRIFIER :

"Période REER à vérifier manuellement."

IMPORTANT :

Identifier la période ne signifie PAS décider dans quelle année
la cotisation doit être déduite.

Ne décide jamais automatiquement de l'année de déduction.

Ne donne jamais automatiquement une déduction fiscale.

Présente seulement la période et le montant afin que
l'administratrice puisse effectuer le traitement fiscal approprié.

Si plusieurs exemplaires identiques du même reçu REER sont visibles,
le montant de cotisation doit être présenté UNE SEULE FOIS.

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
6. cherche une case ou un champ rempli que tu aurais oublié;
7. vérifie chaque association numéro de case → valeur;
8. retire toute case qui est en réalité vide;
9. vérifie si le document contient plusieurs copies du même document;
10. supprime de la réponse les répétitions provenant de copies identiques;
11. pour un REER, vérifie une deuxième fois la période et le montant;
12. vérifie qu'aucun NAS ou identifiant personnel sensible complet
    n'apparaît dans ta réponse finale.

Ton objectif est de ne manquer AUCUNE donnée réellement remplie,
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
- reçu REER / RRSP
- avis de cotisation
- document provincial
- document fédéral
- formulaire d'une autre province canadienne
- reçu
- facture
- reçu médical
- facture médicale
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
CONFIDENTIALITÉ — IDENTIFIANTS SENSIBLES
==================================================

Les identifiants personnels sensibles doivent être détectés,
mais ne doivent JAMAIS être reproduits intégralement dans la réponse.

Cette règle s'applique à TOUTES les sections de la réponse,
notamment :

- PERSONNE / ENTREPRISE;
- CASES REMPLIES;
- AUTRES INFORMATIONS;
- ÉLÉMENTS À VÉRIFIER;
- CONTRÔLE DE LECTURE;
- RÉSUMÉ POUR LE DOSSIER.

Sont notamment considérés comme identifiants personnels sensibles :

- numéro d'assurance sociale (NAS / SIN);
- numéro d'assurance maladie;
- numéro de passeport;
- numéro de permis de conduire;
- numéro de carte de crédit;
- numéro de compte bancaire;
- autres identifiants personnels de nature comparable.

Lorsqu'un tel identifiant est visible, indique seulement :

"NAS : présent sur le document"

ou, selon le cas :

"Identifiant personnel sensible : présent sur le document"

NE reproduis jamais les chiffres ou caractères de cet identifiant.

IMPORTANT :

Si un NAS apparaît dans une case numérotée d'un formulaire,
conserve le numéro de la case, mais masque sa valeur.

Exemple :

Case 17 : NAS présent — valeur non reproduite

et NON :

Case 17 : 123 456 789

Les numéros qui servent à identifier le document lui-même,
comme un numéro de reçu, numéro de facture, numéro de feuillet,
code de formulaire ou référence de l'émetteur, peuvent être
reproduits lorsqu'ils ne constituent pas un identifiant personnel
sensible.

Un code permanent d'étudiant peut être indiqué comme présent,
mais ne doit pas être reproduit intégralement lorsqu'il permet
d'identifier directement la personne.

Cette règle de confidentialité est prioritaire sur la règle
d'extraction exhaustive.

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

Pour un reçu REER, applique en plus la règle spéciale REER.

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
[Renseignements clairement visibles, sans reproduire intégralement
les identifiants personnels sensibles]

CASES REMPLIES
[Liste exhaustive de toutes les cases remplies, sans répéter
les cases provenant de copies identiques]

Utilise :
Case [numéro ou code] : [valeur exacte]

EXCEPTION :
si la valeur est un NAS ou un autre identifiant personnel sensible,
masque la valeur conformément à la règle de confidentialité.

Si le document n'utilise pas de cases numérotées, écris :
Sans objet.

AUTRES INFORMATIONS
[Informations utiles qui ne correspondent pas à une case,
sans reproduire intégralement les identifiants personnels sensibles]

Pour un reçu REER, indique clairement ici :
- montant de la cotisation;
- période originale du reçu;
- si elle correspond aux 60 premiers jours de l'année suivante,
  lorsque cela peut être déterminé clairement.

Si des copies identiques ont été détectées, indique ici :
"Copies identiques détectées : [nombre]. Les valeurs sont présentées une seule fois."

ÉLÉMENTS À VÉRIFIER
[Seulement les éléments réellement incertains]

CONTRÔLE DE LECTURE
Indique si une deuxième lecture complète a été effectuée,
si d'autres cases ou champs remplis ont été détectés et si une
vérification des doublons a été effectuée.

RÉSUMÉ POUR LE DOSSIER
[Résumé court sans inventer ni interpréter les valeurs.
Ne compte jamais plusieurs fois les valeurs provenant de copies
identiques.

Ne reproduis jamais intégralement un NAS ou autre identifiant
personnel sensible.

Pour un REER, indique clairement le montant et la période,
mais ne décide pas de l'année de déduction.]

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
copies identiques du même document sont visibles.

Ne jamais fusionner deux documents réellement différents.

Ne jamais décider automatiquement de l'année de déduction d'une
cotisation REER.

Ne jamais reproduire intégralement un NAS ou un autre identifiant
personnel sensible dans aucune section de la réponse.

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
                    "Analyse toute l'image. Effectue une extraction exhaustive de toutes les cases et de tous les champs réellement remplis. Détecte les copies identiques et ne présente leurs valeurs qu'une seule fois. S'il s'agit d'un reçu REER, identifie clairement la période originale et indique si elle correspond aux 60 premiers jours de l'année suivante. Ne reproduis jamais intégralement un NAS ou un autre identifiant personnel sensible dans ta réponse. Effectue ensuite la deuxième lecture obligatoire avant de répondre.",
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
                      "Analyse toutes les pages du document. Pour chaque page, recherche toutes les cases et tous les champs réellement remplis. Détecte les copies identiques du même document et ne présente leurs valeurs qu'une seule fois. Ne fusionne jamais deux documents réellement différents. S'il s'agit d'un reçu REER, identifie clairement la période originale et indique si elle correspond aux 60 premiers jours de l'année suivante. Ne reproduis jamais intégralement un NAS ou un autre identifiant personnel sensible dans ta réponse. Effectue ensuite une deuxième lecture complète avant de répondre.",
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
