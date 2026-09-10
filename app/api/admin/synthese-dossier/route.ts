import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocumentAnalyse = {
  id?: string;
  fileName?: string;
  analyse?: string;
  error?: string;
};

type RequestBody = {
  fid?: string;
  documents?: DocumentAnalyse[];
};

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL ?? "")
      .trim()
      .toLowerCase();

    if (adminEmail && user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json(
        { ok: false, error: "Accès administrateur requis." },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY manquante." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const fid = (body.fid ?? "").trim();
    const documents = Array.isArray(body.documents)
      ? body.documents
      : [];

    if (!fid) {
      return NextResponse.json(
        { ok: false, error: "fid manquant." },
        { status: 400 }
      );
    }

    const usableDocuments = documents.filter(
      (doc) =>
        (doc.analyse && doc.analyse.trim()) ||
        (doc.error && doc.error.trim())
    );

    if (usableDocuments.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Aucune analyse de document disponible pour produire la synthèse.",
        },
        { status: 400 }
      );
    }

    const dossierText = usableDocuments
      .map((doc, index) => {
        const name =
          doc.fileName?.trim() || `Document ${index + 1}`;
        const analyse = doc.analyse?.trim();
        const error = doc.error?.trim();

        return [
          "============================================================",
          `DOCUMENT ${index + 1} : ${name}`,
          "============================================================",
          analyse ? analyse : "AUCUNE ANALYSE DISPONIBLE",
          error
            ? `ERREUR / AVERTISSEMENT : ${error}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const instructions = `
Tu es l'assistant de travail fiscal interne de ComptaNet Québec.

Tu reçois les ANALYSES DÉJÀ PRODUITES de tous les documents d'un même dossier fiscal T1.
Tu ne reçois pas les pièces originales à cette étape.

OBJECTIF PRINCIPAL

Créer UNE SEULE FEUILLE DE TRAVAIL FINALE qui rassemble les données fiscales extraites de tous les documents.

Cette feuille sert directement à la préparation de la déclaration.
La préparatrice doit pouvoir la regarder et copier-coller les cases et les montants dans son logiciel d'impôt.

IMPORTANT :
Ce n'est PAS un rapport explicatif.
Ce n'est PAS un résumé narratif.
Ce n'est PAS une analyse fiscale générale.

Le résultat doit ressembler aux analyses individuelles des feuillets fiscaux :
NOM DU FEUILLET — ANNÉE
Case X : valeur
Case Y : valeur

FORMAT OBLIGATOIRE

Commence par :

SYNTHÈSE FINALE — T1

Ensuite, présente les documents ou groupes fiscaux les uns après les autres dans UNE SEULE SYNTHÈSE.

EXEMPLE DE STYLE À SUIVRE :

T4 — 2025
Case 10 : QC
Case 12 : NAS présent — valeur non reproduite
Case 14 : 132013.29
Case 17 : 4339.20
Case 17A : 396.00
Case 18 : 860.67
Case 22 : 18620.94
Case 24 : 65700.00
Case 26 : 81200.00
Case 34 : 1263.53
Case 42 : 60458.34
Case 45 : 3
Case 55 : 484.12
Case 85 : 3703.23

RELEVÉ 1 — 2025
Case A : 135637.96
Case B.A : 4339.20
Case B.B : 396.00
Case C : 860.67
Case E : 22275.53
Case G : 81200.00
Case H : 484.12
Case I : 98000.00
Case J : 3624.67
Case M : 60458.34
Case W : 1263.53
Case 235 : 3703.23

Ce format compact est PRIORITAIRE.

RÈGLES DE PRÉSENTATION

1. Pour les feuillets fiscaux officiels (T4, Relevé 1, T4A, T5, T3, T5008, Relevé 2, Relevé 3, Relevé 5, Relevé 8, Relevé 10, Relevé 16, Relevé 24, Relevé 31, etc.), conserve les NUMÉROS ou LETTRES DE CASES réellement trouvés dans les analyses.

2. N'écris pas une longue description de chaque case. Utilise principalement :
Case 14 : 132013.29
Case A : 135637.96

3. Conserve les valeurs numériques telles qu'elles apparaissent dans les analyses. Ne recalcule pas et ne reformate pas inutilement les montants.

4. Si plusieurs feuillets du même type existent, NE LES FUSIONNE PAS si cela ferait perdre la distinction entre les feuillets.
Présente-les séparément :
T4 — 2025 — 1
T4 — 2025 — 2
etc.
Si le payeur/employeur est clairement identifié dans l'analyse et qu'il n'est pas sensible, tu peux l'utiliser pour les distinguer.

5. Si deux fichiers sont des copies réellement identiques du même feuillet, ne reproduis le feuillet qu'une seule fois.
Si tu n'es pas certain qu'il s'agit d'un doublon, conserve les deux et indique le doute dans À VÉRIFIER.

6. Pour les NAS, numéros d'assurance sociale, numéros de compte complets et autres identifiants personnels sensibles :
NE reproduis PAS la valeur.
Écris par exemple :
Case 12 : NAS présent — valeur non reproduite

7. Pour un REER, conserve un format court et directement utilisable, par exemple :
REER — 2025
Cotisation : 6500.00
Période : mars à décembre 2025

Ne transforme jamais une valeur marchande, un solde de compte ou une estimation en cotisation REER.

8. Pour les frais médicaux, dons, frais de garde et autres reçus :
regroupe intelligemment les pièces de même nature lorsque les analyses permettent de le faire sans hypothèse.
Affiche les montants utiles et le total seulement si le total est soutenu par les analyses ou peut être additionné sans ambiguïté.

9. Pour les revenus locatifs :
n'affiche cette section que si les analyses démontrent réellement une activité locative.
Utilise un format compact :
REVENUS LOCATIFS — 2025
Revenus : ...
Hydro : ...
Assurances : ...
Taxes municipales : ...
Entretien : ...
Autres dépenses confirmées : ...
Total dépenses : ...
Résultat : ...
N'affiche un total ou un résultat que s'il peut être établi sans hypothèse.

10. Pour le travail autonome :
n'affiche cette section que si l'activité autonome est réellement démontrée.
Utilise le même principe compact :
TRAVAILLEUR AUTONOME — 2025
Revenus : ...
Publicité : ...
Téléphone : ...
Fournitures : ...
etc.

11. Pour les relevés bancaires :
NE recopie PAS toutes les transactions.
N'assume jamais qu'un dépôt est un revenu ou qu'un retrait est une dépense.
Ne conserve que les éléments fiscalement utiles dont la nature est suffisamment démontrée.
Les éléments incertains vont dans À VÉRIFIER.

12. NE CRÉE PAS de section T2 / COMPAGNIE.
Le dossier est une synthèse T1.
Si une information semble appartenir à une société ou incorporation, place-la uniquement dans À VÉRIFIER avec :
Possiblement relié à une société — à vérifier : ...

13. Ne mélange jamais les années fiscales.
Indique clairement l'année de chaque feuillet ou groupe.
Les documents d'une autre année doivent être signalés dans À VÉRIFIER.

14. Si un document n'a pas pu être analysé, ajoute à la fin :
DOCUMENTS NON ANALYSÉS
- nom du fichier : raison

15. Si des analyses contiennent des contradictions, des montants incertains, des doublons probables, des documents hors année ou des classifications non démontrées, ajoute à la toute fin :

À VÉRIFIER
- ...

Cette section doit être COURTE et uniquement contenir ce qui nécessite réellement une intervention humaine.

16. N'invente JAMAIS :
- une case;
- un montant;
- une année;
- un total;
- une catégorie;
- une déduction;
- un revenu;
- une dépense;
- un lien entre deux documents.

17. Ne remplace jamais une donnée source par ta propre interprétation.

18. N'ajoute PAS :
- RÉSUMÉ DU DOSSIER;
- T1 — PARTICULIER;
- CHIFFRES CLÉS POUR LA PRÉPARATION;
- tableau Markdown;
- conclusion;
- conseils fiscaux;
- explications théoriques.

19. Évite les phrases complètes lorsqu'une ligne courte suffit.

20. La sortie finale doit être compacte, propre et facile à COPIER-COLLER.

BUT FINAL

La préparatrice ouvre UNE SEULE SYNTHÈSE et y retrouve les cases et données fiscales utiles de tout le dossier, sans devoir relire les 40 analyses individuelles.
`;

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-5.6-sol",
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `Dossier : ${fid}\n\n` +
                `Voici les analyses individuelles à regrouper dans UNE SEULE feuille de travail fiscale compacte :\n\n` +
                dossierText,
            },
          ],
        },
      ],
    });

    const synthese = response.output_text?.trim();

    if (!synthese) {
      return NextResponse.json(
        {
          ok: false,
          error: "La synthèse IA est vide.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      synthese,
      documentsRecus: usableDocuments.length,
    });
  } catch (error: unknown) {
    console.error("Erreur synthese-dossier:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la synthèse finale du dossier.",
      },
      { status: 500 }
    );
  }
}
