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

type JsonRecord = Record<string, unknown>;

type IdentiteNas = {
  client: string | null;
  conjoint: string | null;
  personnesACharge: Array<{
    prenom: string;
    nom: string;
    nas: string | null;
  }>;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFormType(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function extractNas(data: unknown): IdentiteNas {
  const root = isRecord(data) ? data : {};
  const client = isRecord(root.client) ? root.client : {};
  const conjoint = isRecord(root.conjoint) ? root.conjoint : null;
  const personnes = Array.isArray(root.personnesACharge)
    ? root.personnesACharge
    : [];

  return {
    client: asString(client.nas) || null,
    conjoint: conjoint ? asString(conjoint.nasConjoint) || null : null,
    personnesACharge: personnes
      .filter(isRecord)
      .map((personne) => ({
        prenom: asString(personne.prenom),
        nom: asString(personne.nom),
        nas: asString(personne.nas) || null,
      })),
  };
}

function emptyIdentiteNas(): IdentiteNas {
  return {
    client: null,
    conjoint: null,
    personnesACharge: [],
  };
}

function removeNas(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => removeNas(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const result: JsonRecord = {};

  for (const [childKey, childValue] of Object.entries(value)) {
    const normalizedKey = childKey.toLowerCase();

    // Retire les champs NAS avant tout envoi à l'IA.
    if (
      normalizedKey === "nas" ||
      normalizedKey === "nasconjoint" ||
      normalizedKey.includes("socialinsurancenumber") ||
      normalizedKey === "sin"
    ) {
      continue;
    }

    result[childKey] = removeNas(childValue);
  }

  return result;
}

function detectT2(formType: string | null, data: unknown): boolean {
  const normalized = normalizeFormType(formType);

  if (normalized === "t2" || normalized.includes("t2")) {
    return true;
  }

  if (!isRecord(data)) {
    return false;
  }

  const dossierType = normalizeFormType(data.dossierType);

  return (
    dossierType === "t2" ||
    dossierType.includes("t2") ||
    isRecord(data.t2)
  );
}

function t2YearFromData(data: unknown): string {
  if (!isRecord(data)) return "";

  const t2 = isRecord(data.t2) ? data.t2 : null;

  if (!t2) return "";

  return asString(t2.anneeImposition);
}

const COMMON_INSTRUCTIONS = `
Tu es l'assistant de travail fiscal interne de ComptaNet Québec.

Tu reçois les DONNÉES STRUCTURÉES d'un formulaire fiscal rempli par un client.
Ton travail est de produire une FEUILLE DE TRAVAIL compacte destinée à la préparatrice de déclarations.

IMPORTANT :
- Ce n'est PAS une analyse de T4, RL-1, T5, RL-3 ou d'un autre relevé fiscal.
- Ce n'est PAS un rapport narratif.
- N'invente aucune information.
- Ne calcule aucune donnée qui n'est pas explicitement fournie.
- Ne donne aucun conseil fiscal.
- Les NAS ont volontairement été retirés avant l'envoi à l'IA.
- Ne demande pas, ne devine pas et ne reconstitue jamais un NAS.
- Ne reproduis pas les mots de passe, numéros de compte bancaire ou autres identifiants personnels sensibles.
- Ignore les champs purement techniques, identifiants internes et valeurs vides.
- Respecte exactement les réponses Oui/Non du client.
- Ne transforme jamais une absence de donnée en "Non".
- Conserve les montants tels qu'ils sont fournis.
- Fais ressortir clairement les informations manquantes, ambiguës ou contradictoires dans une courte section À VÉRIFIER.
- Utilise des libellés compréhensibles plutôt que les noms techniques JSON lorsque leur sens est évident.
- Ne reproduis pas les sections vides.
- Évite les longues phrases lorsqu'une ligne courte suffit.
`;

const T1_INSTRUCTIONS = `
${COMMON_INSTRUCTIONS}

FORMAT PRIORITAIRE — T1 :

FORMULAIRE CLIENT — [TYPE] — [ANNÉE]

CLIENT
Nom : ...
Date de naissance : ...
État civil : ...
Adresse : ...
Téléphone : ...
Courriel : ...

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

RÈGLES T1 :
1. N'invente jamais une déduction, un crédit, un revenu, une dépense ou une admissibilité.
2. La sortie doit être compacte et facile à lire pendant la saisie de la déclaration T1.
3. Si une section ne s'applique pas, ne l'affiche pas.
`;

const T2_INSTRUCTIONS = `
${COMMON_INSTRUCTIONS}

Le dossier est une déclaration de société T2.
Le JSON peut contenir les renseignements dans une sous-section "t2".
Travaille seulement avec les données réellement présentes.

FORMAT PRIORITAIRE — T2 :

FORMULAIRE SOCIÉTÉ — T2 — [ANNÉE]

SOCIÉTÉ
Nom légal : ...
Numéro d'entreprise ARC : ...
NEQ : ...
Province d'incorporation : ...
Date d'incorporation : ...
Fin d'exercice : ...
Adresse : ...

ACTIVITÉ
Activité principale : ...
Activités au Québec : Oui/Non
Première déclaration T2 : Oui/Non

ACTIONNAIRES ET OPÉRATIONS
Actionnaire(s) / pourcentage(s) : ...
Salaires ou T4/RL-1 : Oui/Non
Dividendes ou T5/RL-3 : Oui/Non
Véhicules / équipements / immeubles / autres immobilisations : Oui/Non
Prêts ou marge de crédit : Oui/Non
Sommes dues à ou par un actionnaire : Oui/Non

TPS / TVQ
Inscription TPS : Oui/Non
Numéro TPS : ...
Inscription TVQ : Oui/Non
Numéro TVQ : ...
Fréquence de remise : ...

INFORMATIONS FINANCIÈRES
Revenus et dépenses déjà compilés : Oui/Non
Revenus durant l'exercice : Oui/Non
Revenus totaux : ...
Dépenses totales : ...
Notes / précisions : ...

CONTACT
Nom : ...
Téléphone : ...
Courriel : ...

DOCUMENTS / ÉLÉMENTS À SURVEILLER
- N'affiche cette section que lorsque les réponses du formulaire justifient clairement un suivi.
- Exemple : si salaires = Oui, mentionne simplement que les documents de paie/T4/RL-1 doivent être vérifiés.
- Exemple : si dividendes = Oui, mentionne les documents T5/RL-3 à vérifier.
- Exemple : si immobilisations = Oui, mentionne les pièces relatives aux acquisitions/dispositions à vérifier.
- N'invente jamais qu'un document manque si le formulaire ne permet pas de le savoir.

À VÉRIFIER
- uniquement les renseignements manquants, ambigus ou contradictoires qui sont réellement visibles dans les données.

RÈGLES T2 :
1. Ne calcule jamais le revenu imposable, les taxes, le capital versé, les dividendes disponibles, la DPA ou tout autre montant fiscal non fourni.
2. Ne détermine jamais l'admissibilité à une déduction ou à un crédit.
3. Ne remplace jamais une donnée absente par une supposition.
4. N'appelle pas les données du client "états financiers" à moins que le formulaire les identifie réellement ainsi.
5. Si les revenus/dépenses ne sont pas compilés, indique simplement : "Données financières à compiler" ou une formulation équivalente.
6. La sortie doit être une feuille de travail compacte, claire et facile à utiliser pendant la préparation du dossier T2.
`;

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
        {
          ok: false,
          error: "Le formulaire ne contient aucune donnée exploitable.",
        },
        { status: 400 }
      );
    }

    const isT2 = detectT2(form.form_type, form.data);

    // T1 : on garde les NAS séparément pour l'écran admin.
    // T2 : aucun NAS n'est nécessaire à l'analyse.
    const identiteNas = isT2
      ? emptyIdentiteNas()
      : extractNas(form.data);

    // Les NAS sont toujours retirés avant l'envoi à l'IA.
    const dataForAI = removeNas(form.data);

    const instructions = isT2
      ? T2_INSTRUCTIONS
      : T1_INSTRUCTIONS;

    const yearFromT2 = isT2
      ? t2YearFromData(form.data)
      : "";

    const displayYear =
      form.tax_year != null
        ? String(form.tax_year)
        : yearFromT2 || "?";

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
                `Type : ${form.form_type ?? (isT2 ? "T2" : "?")}\n` +
                `Année : ${displayYear}\n\n` +
                `Données du formulaire client (NAS retirés) :\n` +
                JSON.stringify(dataForAI, null, 2),
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
      identiteNas,
      fid: form.id,
      formType: form.form_type,
      taxYear: form.tax_year,
      detectedType: isT2 ? "T2" : "T1",
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
