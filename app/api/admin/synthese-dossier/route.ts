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
        const name = doc.fileName?.trim() || `Document ${index + 1}`;
        const analyse = doc.analyse?.trim();
        const error = doc.error?.trim();

        return [
          "============================================================",
          `DOCUMENT ${index + 1} : ${name}`,
          "============================================================",
          analyse ? analyse : "AUCUNE ANALYSE DISPONIBLE",
          error ? `ERREUR / AVERTISSEMENT : ${error}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const instructions = `
Tu es l'assistant de travail fiscal interne de ComptaNet Québec.

Tu reçois les ANALYSES DÉJÀ PRODUITES de plusieurs documents d'un même dossier fiscal T1.
Tu ne reçois pas les pièces originales dans cette étape.

OBJECTIF
Créer une synthèse finale très claire et immédiatement utilisable par une préparatrice d'impôts québécoise.
La synthèse doit réduire le fouillis, PAS le reproduire.

RÈGLES ABSOLUES
1. N'invente jamais un montant, une catégorie fiscale, une déduction, un revenu ou un lien entre deux transactions.
2. N'assume jamais qu'une transaction bancaire est professionnelle, locative ou personnelle simplement à cause du compte où elle apparaît.
3. N'assume jamais qu'un virement est un revenu. Un transfert, remboursement, avance, prêt, mouvement entre comptes ou paiement de carte doit rester distinct tant que sa nature n'est pas démontrée.
4. Si deux documents donnent des montants différents pour la même chose, ne choisis pas arbitrairement. Affiche la contradiction dans ÉLÉMENTS À VÉRIFIER.
5. Repère les doublons évidents et évite de compter deux fois la même pièce ou le même montant. Si le doublon n'est que probable, indique-le comme probable.
6. Ne mélange jamais les années fiscales. Si plusieurs années apparaissent, sépare-les et signale les pièces hors année.
7. La section LOCATION n'apparaît que si les analyses démontrent réellement des revenus ou dépenses de location.
8. La section TRAVAILLEUR AUTONOME n'apparaît que si les analyses démontrent réellement une activité autonome.
9. NE CRÉE PAS DE SECTION T2 / COMPAGNIE dans cette synthèse T1.
10. Si une information semble appartenir à une société/incorporation, place-la dans ÉLÉMENTS À VÉRIFIER avec la mention « Possiblement relié à une société — à vérifier » et explique brièvement pourquoi.
11. Pour un REER, distingue toujours une cotisation/reçu officiel d'une valeur marchande, d'un solde de compte ou d'une simple estimation.
12. Pour les relevés bancaires, ne recopie pas toutes les transactions. Résume seulement les montants et opérations fiscalement utiles ou nécessitant une vérification.
13. Les soldes bancaires, paiements de carte, remboursements de prêt et transferts ne doivent pas être additionnés aux dépenses fiscales sans justification.
14. Si un document n'a pas pu être analysé, mentionne-le clairement dans DOCUMENTS NON ANALYSÉS / MANQUANTS.
15. Une information incertaine va dans ÉLÉMENTS À VÉRIFIER. Ne la transforme jamais en certitude.

FORMAT ATTENDU
Commence directement par :
SYNTHÈSE FINALE — T1

Puis utilise uniquement les sections pertinentes parmi :

1. RÉSUMÉ DU DOSSIER
- année fiscale si identifiable
- contribuable si identifiable
- portrait très court des éléments présents

2. T1 — PARTICULIER
Regroupe uniquement les éléments personnels pertinents et confirmés : feuillets, revenus, REER, frais médicaux, dons, enfants, frais de garde, crédits, etc.

3. REVENUS LOCATIFS
Seulement si applicable.
Présente séparément :
- revenus locatifs
- dépenses locatives par catégorie
- totaux seulement lorsqu'ils sont soutenus par les analyses
- résultat locatif seulement s'il peut être calculé sans hypothèse
- éléments locatifs à vérifier

4. TRAVAILLEUR AUTONOME
Seulement si applicable.
Présente revenus, dépenses et taxes seulement lorsque leur nature est suffisamment démontrée.

5. ÉLÉMENTS À VÉRIFIER
Liste courte et priorisée : contradictions, classification incertaine, justificatifs manquants, éléments possiblement reliés à une société, montants estimés, etc.

6. DOCUMENTS NON ANALYSÉS / MANQUANTS
Seulement s'il y en a.

7. CHIFFRES CLÉS POUR LA PRÉPARATION
Termine par un tableau texte très court des montants réellement utilisables, avec une colonne STATUT : CONFIRMÉ / À VÉRIFIER.

STYLE
- Français québécois clair.
- Très lisible.
- Pas de longues explications théoriques.
- Pas de répétition de chaque transaction bancaire.
- Conserve la traçabilité en mentionnant le nom du document source entre parenthèses lorsque c'est utile.
- Le but est qu'une préparatrice puisse comprendre le dossier en quelques secondes puis aller vérifier les points problématiques.
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
              text: `Dossier : ${fid}\n\nVoici les analyses individuelles à synthétiser :\n\n${dossierText}`,
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
