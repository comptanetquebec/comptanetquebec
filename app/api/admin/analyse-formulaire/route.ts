import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  fid?: string;
};

type FormRow = {
  id: string;
  form_type: string | null;
  tax_year: number | null;
  data: unknown;
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

    if (!fid) {
      return NextResponse.json(
        { ok: false, error: "fid manquant." },
        { status: 400 }
      );
    }

    const { data: form, error: formError } = await supabase
      .from("formulaires_fiscaux")
      .select("id, form_type, tax_year, data")
      .eq("id", fid)
      .maybeSingle<FormRow>();

    if (formError) {
      return NextResponse.json(
        { ok: false, error: formError.message },
        { status: 500 }
      );
    }

    if (!form) {
      return NextResponse.json(
        { ok: false, error: "Formulaire introuvable." },
        { status: 404 }
      );
    }

    if (!form.data || typeof form.data !== "object") {
      return NextResponse.json(
        { ok: false, error: "Le formulaire ne contient aucune donnée exploitable." },
        { status: 400 }
      );
    }

    const instructions = `
Tu es l'assistant de travail fiscal interne de ComptaNet Québec.

Tu reçois les DONNÉES STRUCTURÉES d'un formulaire fiscal rempli par un client.
Ton travail est de produire une FEUILLE DE TRAVAIL compacte destinée à la préparatrice de déclarations.

IMPORTANT :
- Ce n'est PAS une analyse de T4 ou de relevé fiscal.
- Ce n'est PAS un rapport narratif.
- N'invente aucune information.
- Ne calcule aucune donnée qui n'est pas explicitement fournie.
- Ne donne aucun conseil fiscal.
- N'affiche jamais un NAS complet, numéro de compte complet, mot de passe ou autre identifiant personnel sensible.
- Si un NAS est présent, écris seulement : "NAS : présent — valeur non reproduite".
- Ignore les champs purement techniques, identifiants internes et valeurs vides.
- Respecte les réponses Oui/Non du client.
- Fais ressortir clairement les informations manquantes ou contradictoires dans une courte section À VÉRIFIER.

FORMAT PRIORITAIRE :

FORMULAIRE CLIENT — [TYPE] — [ANNÉE]

CLIENT
Nom : ...
Date de naissance : ...
État civil : ...
Adresse : ...
Téléphone : ...
Courriel : ...
NAS : présent — valeur non reproduite

CONJOINT
[uniquement si applicable et si des données existent]

PERSONNES À CHARGE
[une personne par bloc, uniquement si applicable]

ASSURANCE MÉDICAMENTS / FRAIS MÉDICAUX
[uniquement les données réellement fournies]

QUESTIONS FISCALES
Première déclaration ARC : Oui/Non
Première déclaration Québec : Oui/Non
Cryptoactifs : Oui/Non
Biens étrangers > 100 000 $ : Oui/Non
Citoyen canadien : Oui/Non
Non-résident : Oui/Non
Achat première habitation ou vente résidence principale : Oui/Non
[et les autres questions fiscales réellement présentes]

TRAVAIL AUTONOME
[uniquement si le formulaire contient réellement cette section]

REVENUS LOCATIFS
[uniquement si le formulaire contient réellement cette section]

AUTRES INFORMATIONS UTILES
[seulement les données fiscalement pertinentes qui ne vont pas ailleurs]

À VÉRIFIER
- uniquement les informations réellement manquantes, ambiguës ou contradictoires.

RÈGLES :
1. Utilise les libellés compréhensibles plutôt que les noms techniques JSON lorsque leur sens est évident.
2. Ne reproduis pas les sections vides.
3. Ne transforme jamais une absence de donnée en "Non".
4. Ne suppose jamais qu'une réponse est vraie ou fausse.
5. Conserve les montants tels qu'ils sont fournis.
6. N'invente jamais une déduction, un crédit, un revenu, une dépense ou une admissibilité.
7. La sortie doit être compacte et facile à lire pendant la saisie dans ImpôtExpert.
8. Évite les longues phrases lorsqu'une ligne courte suffit.
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
                `Dossier : ${fid}\n` +
                `Type : ${form.form_type ?? "?"}\n` +
                `Année : ${form.tax_year ?? "?"}\n\n` +
                `Données du formulaire client :\n` +
                JSON.stringify(form.data, null, 2),
            },
          ],
        },
      ],
    });

    const analyse = response.output_text?.trim();

    if (!analyse) {
      return NextResponse.json(
        { ok: false, error: "L'analyse IA du formulaire est vide." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      analyse,
      fid: form.id,
      formType: form.form_type,
      taxYear: form.tax_year,
    });
  } catch (error: unknown) {
    console.error("Erreur analyse-formulaire:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant l'analyse IA du formulaire.",
      },
      { status: 500 }
    );
  }
}
