import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import ModifierFactureClient from "./ModifierFactureClient";

type Lang = "fr" | "en" | "es";

type ProfileRow = {
  is_admin: boolean | null;
};

type FactureRow = {
  id: string;
  numero_facture: string | null;
  cq_id: string | null;

  client_nom: string | null;
  client_courriel: string | null;
  client_adresse: string | null;
  client_ville: string | null;
  client_province: string | null;
  client_code_postal: string | null;

  description: string | null;
  quantite: number | null;
  prix_unitaire: number | null;

  sous_total: number | null;
  tps: number | null;
  tvq: number | null;
  total: number | null;

  statut: string | null;
  montant_paye: number | null;
  mode_paiement: string | null;

  date_facture: string | null;
};

type LigneRow = {
  id: string;
  facture_id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  ordre: number;
};

function normalizeLang(value?: string): Lang {
  return value === "en" || value === "es"
    ? value
    : "fr";
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function ModifierFacturePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;

  const query = searchParams
    ? await searchParams
    : undefined;

  const lang = normalizeLang(query?.lang);

  const supabase = await supabaseServer();

  /* AUTHENTIFICATION */

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth?.user) {
    redirect("/espace-client");
  }

  /* VÉRIFICATION ADMIN */

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.is_admin) {
    return (
      <div className="p-6">
        Accès refusé
      </div>
    );
  }

  /* CHARGER LA FACTURE */

  const {
    data: facture,
    error: factureError,
  } = await supabase
    .from("factures")
    .select("*")
    .eq("id", id)
    .maybeSingle<FactureRow>();

  if (factureError || !facture) {
    notFound();
  }

  /* CHARGER LES LIGNES */

  const {
    data: lignesData,
    error: lignesError,
  } = await supabase
    .from("facture_lignes")
    .select(
      "id, facture_id, description, quantite, prix_unitaire, montant, ordre"
    )
    .eq("facture_id", id)
    .order("ordre", {
      ascending: true,
    });

  if (lignesError) {
    console.error(
      "Erreur facture_lignes :",
      lignesError
    );
  }

  /*
    Compatibilité avec les anciennes factures.

    Si une ancienne facture n'a aucune entrée
    dans facture_lignes, on utilise les anciennes
    colonnes description / quantité / prix.
  */

  const lignes: LigneRow[] =
    lignesData && lignesData.length > 0
      ? (lignesData as LigneRow[])
      : [
          {
            id: `legacy-${facture.id}`,
            facture_id: facture.id,
            description:
              facture.description ?? "",
            quantite:
              facture.quantite ?? 1,
            prix_unitaire:
              facture.prix_unitaire ?? 0,
            montant:
              (facture.quantite ?? 1) *
              (facture.prix_unitaire ?? 0),
            ordre: 1,
          },
        ];

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6">
          <Link
            href={`/admin/factures/${facture.id}?lang=${lang}`}
            className="font-semibold text-blue-700 hover:underline"
          >
            {lang === "fr"
              ? "← Retour à la facture"
              : lang === "en"
              ? "← Back to invoice"
              : "← Volver a la factura"}
          </Link>
        </div>

        <ModifierFactureClient
          lang={lang}
          facture={{
            id: facture.id,

            numero_facture:
              facture.numero_facture,

            cq_id:
              facture.cq_id,

            client_nom:
              facture.client_nom ?? "",

            client_courriel:
              facture.client_courriel ?? "",

            client_adresse:
              facture.client_adresse ?? "",

            client_ville:
              facture.client_ville ?? "",

            client_province:
              facture.client_province ?? "QC",

            client_code_postal:
              facture.client_code_postal ?? "",

            sous_total:
              facture.sous_total ?? 0,

            tps:
              facture.tps ?? 0,

            tvq:
              facture.tvq ?? 0,

            total:
              facture.total ?? 0,

            statut:
              facture.statut ?? "unpaid",

            montant_paye:
              facture.montant_paye ?? 0,

            mode_paiement:
              facture.mode_paiement ?? "interac",

            date_facture:
              facture.date_facture,
          }}
          lignes={lignes.map(
            (ligne) => ({
              id: ligne.id,

              description:
                ligne.description,

              quantite:
                Number(ligne.quantite),

              prix_unitaire:
                Number(
                  ligne.prix_unitaire
                ),

              montant:
                Number(ligne.montant),

              ordre:
                Number(ligne.ordre),
            })
          )}
        />
      </div>
    </main>
  );
}
