import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import BoutonPdf from "./BoutonPdf";

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
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  ordre: number;
};

const COPY = {
  fr: {
    back: "← Retour aux factures",
    edit: "Modifier la facture",
    invoice: "FACTURE",
    invoiceNumber: "No de facture",
    clientNumber: "No client",
    date: "Date",
    billedTo: "FACTURÉ À",
    description: "DESCRIPTION",
    quantity: "QTÉ",
    unitPrice: "PRIX",
    amount: "MONTANT",
    subtotal: "Sous-total",
    gst: "TPS (5 %)",
    qst: "TVQ (9,975 %)",
    totalDue: "TOTAL À PAYER",
    payment: "PAIEMENT",
    interac: "Virement Interac",
    paid: "PAYÉE",
    unpaid: "À PAYER",
    thankYou: "Merci de votre confiance !",
    tagline:
      "IMPÔTS • TENUE DE LIVRES • SERVICES AUX ENTREPRISES",
  },

  en: {
    back: "← Back to invoices",
    edit: "Edit invoice",
    invoice: "INVOICE",
    invoiceNumber: "Invoice no.",
    clientNumber: "Client no.",
    date: "Date",
    billedTo: "BILLED TO",
    description: "DESCRIPTION",
    quantity: "QTY",
    unitPrice: "PRICE",
    amount: "AMOUNT",
    subtotal: "Subtotal",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    totalDue: "TOTAL DUE",
    payment: "PAYMENT",
    interac: "Interac e-Transfer",
    paid: "PAID",
    unpaid: "AMOUNT DUE",
    thankYou: "Thank you for your trust!",
    tagline:
      "TAXES • BOOKKEEPING • BUSINESS SERVICES",
  },

  es: {
    back: "← Volver a las facturas",
    edit: "Modificar factura",
    invoice: "FACTURA",
    invoiceNumber: "N.º de factura",
    clientNumber: "N.º de cliente",
    date: "Fecha",
    billedTo: "FACTURADO A",
    description: "DESCRIPCIÓN",
    quantity: "CANT.",
    unitPrice: "PRECIO",
    amount: "IMPORTE",
    subtotal: "Subtotal",
    gst: "GST/TPS (5 %)",
    qst: "QST/TVQ (9,975 %)",
    totalDue: "TOTAL A PAGAR",
    payment: "PAGO",
    interac: "Transferencia Interac",
    paid: "PAGADA",
    unpaid: "POR PAGAR",
    thankYou: "¡Gracias por su confianza!",
    tagline:
      "IMPUESTOS • TENEDURÍA DE LIBROS • SERVICIOS PARA EMPRESAS",
  },
} as const;

function normalizeLang(value?: string): Lang {
  return value === "en" || value === "es"
    ? value
    : "fr";
}

function money(
  value: number | null,
  lang: Lang
) {
  return new Intl.NumberFormat(
    lang === "fr"
      ? "fr-CA"
      : lang === "es"
      ? "es-CA"
      : "en-CA",
    {
      style: "currency",
      currency: "CAD",
    }
  ).format(value ?? 0);
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function FacturePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;

  const query = searchParams
    ? await searchParams
    : undefined;

  const lang = normalizeLang(query?.lang);
  const L = COPY[lang];

  const supabase =
    await supabaseServer();

  /* AUTH */

  const {
    data: auth,
    error: authError,
  } = await supabase.auth.getUser();

  if (
    authError ||
    !auth?.user
  ) {
    redirect("/espace-client");
  }

  /* ADMIN */

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("is_admin")
      .eq(
        "id",
        auth.user.id
      )
      .maybeSingle<ProfileRow>();

  if (!profile?.is_admin) {
    return (
      <div className="p-6">
        Accès refusé
      </div>
    );
  }

  /* FACTURE */

  const {
    data: facture,
    error,
  } = await supabase
    .from("factures")
    .select("*")
    .eq("id", id)
    .maybeSingle<FactureRow>();

  if (
    error ||
    !facture
  ) {
    notFound();
  }

  /* LIGNES */

  const {
    data: lignesData,
  } = await supabase
    .from("facture_lignes")
    .select(
      "id, description, quantite, prix_unitaire, montant, ordre"
    )
    .eq(
      "facture_id",
      facture.id
    )
    .order("ordre", {
      ascending: true,
    });

  /*
    Anciennes factures :
    si aucune facture_lignes n'existe,
    on affiche l'ancienne ligne.
  */

  const lignes: LigneRow[] =
    lignesData &&
    lignesData.length > 0
      ? (lignesData as LigneRow[])
      : [
          {
            id: `legacy-${facture.id}`,

            description:
              facture.description ??
              "",

            quantite:
              facture.quantite ??
              1,

            prix_unitaire:
              facture.prix_unitaire ??
              0,

            montant:
              (facture.quantite ??
                1) *
              (facture.prix_unitaire ??
                0),

            ordre: 1,
          },
        ];

  const estPayee =
    facture.statut === "paid";

  const adresseClient = [
    facture.client_adresse,
    facture.client_ville,
    facture.client_province,
    facture.client_code_postal,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">

        {/* RETOUR + ACTIONS */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">

          <Link
            href={`/admin/factures?lang=${lang}`}
            className="font-semibold text-blue-700 hover:underline"
          >
            {L.back}
          </Link>

          <div className="flex flex-wrap items-center gap-3">

            {/* MODIFIER */}

            <Link
              href={`/admin/factures/${facture.id}/modifier?lang=${lang}`}
              className="rounded-xl border border-blue-700 bg-white px-5 py-3 font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              ✏️ {L.edit}
            </Link>

            {/* PDF */}

            <BoutonPdf
              lang={lang}
              facture={{
                numero_facture:
                  facture.numero_facture,

                cq_id:
                  facture.cq_id,

                client_nom:
                  facture.client_nom ??
                  "",

                client_courriel:
                  facture.client_courriel,

                client_adresse:
                  facture.client_adresse,

                client_ville:
                  facture.client_ville,

                client_province:
                  facture.client_province,

                client_code_postal:
                  facture.client_code_postal,

                description:
                  facture.description,

                quantite:
                  facture.quantite,

                prix_unitaire:
                  facture.prix_unitaire,

                sous_total:
                  facture.sous_total,

                tps:
                  facture.tps,

                tvq:
                  facture.tvq,

                total:
                  facture.total,

                statut:
                  facture.statut,

                mode_paiement:
                  facture.mode_paiement,

                date_facture:
                  facture.date_facture,
              }}
            />
          </div>
        </div>

        {/* FACTURE */}

        <article className="overflow-hidden rounded-2xl bg-white shadow-lg">

          <div className="border-t-8 border-blue-800 p-8 md:p-12">

            {/* ENTREPRISE + FACTURE */}

            <div className="flex flex-col justify-between gap-8 md:flex-row">

              <div>
                <div className="text-3xl font-black tracking-tight text-blue-900">
                  ComptaNet Québec
                </div>

                <div className="mt-2 text-xs font-bold tracking-wider text-slate-500">
                  {L.tagline}
                </div>

                <div className="mt-6 space-y-1 text-sm text-slate-600">
                  <div>
                    849, boulevard Pie-XII
                  </div>

                  <div>
                    Québec (Québec) G1X 3T2
                  </div>

                  <div>
                    581-985-2599
                  </div>

                  <div>
                    comptanetquebec@gmail.com
                  </div>
                </div>
              </div>

              <div className="md:text-right">

                <h1 className="text-4xl font-black tracking-wide text-blue-900">
                  {L.invoice}
                </h1>

                <div className="mt-5 space-y-2 text-sm">

                  <div>
                    <span className="font-semibold text-slate-500">
                      {L.invoiceNumber} :
                    </span>{" "}

                    <span className="font-bold text-slate-900">
                      {facture.numero_facture ??
                        "—"}
                    </span>
                  </div>

                  {facture.cq_id && (
                    <div>
                      <span className="font-semibold text-slate-500">
                        {L.clientNumber} :
                      </span>{" "}

                      <span className="font-bold text-slate-900">
                        {facture.cq_id}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-500">
                      {L.date} :
                    </span>{" "}

                    <span className="font-bold text-slate-900">
                      {facture.date_facture ??
                        "—"}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* CLIENT */}

            <div className="mt-10 rounded-2xl bg-blue-50 p-6">

              <div className="text-xs font-bold tracking-widest text-blue-700">
                {L.billedTo}
              </div>

              <div className="mt-3 text-xl font-bold text-slate-900">
                {facture.client_nom ??
                  "—"}
              </div>

              {facture.client_courriel && (
                <div className="mt-1 text-sm text-slate-600">
                  {
                    facture.client_courriel
                  }
                </div>
              )}

              {adresseClient && (
                <div className="mt-1 text-sm text-slate-600">
                  {adresseClient}
                </div>
              )}

            </div>

            {/* TABLEAU */}

            <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">

              <table className="w-full text-sm">

                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-5 py-4 text-left">
                      {L.description}
                    </th>

                    <th className="px-5 py-4 text-center">
                      {L.quantity}
                    </th>

                    <th className="px-5 py-4 text-right">
                      {L.unitPrice}
                    </th>

                    <th className="px-5 py-4 text-right">
                      {L.amount}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lignes.map(
                    (
                      ligne,
                      index
                    ) => (
                      <tr
                        key={
                          ligne.id
                        }
                        className={
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50"
                        }
                      >
                        <td className="px-5 py-5 text-slate-800">
                          {
                            ligne.description
                          }
                        </td>

                        <td className="px-5 py-5 text-center text-slate-700">
                          {
                            ligne.quantite
                          }
                        </td>

                        <td
                          className={`px-5 py-5 text-right ${
                            ligne.prix_unitaire <
                            0
                              ? "text-red-600"
                              : "text-slate-700"
                          }`}
                        >
                          {money(
                            ligne.prix_unitaire,
                            lang
                          )}
                        </td>

                        <td
                          className={`px-5 py-5 text-right font-semibold ${
                            ligne.montant <
                            0
                              ? "text-red-600"
                              : "text-slate-900"
                          }`}
                        >
                          {money(
                            ligne.montant,
                            lang
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>

            {/* TOTAUX */}

            <div className="mt-8 ml-auto max-w-sm">

              <div className="flex justify-between py-2 text-slate-600">
                <span>
                  {L.subtotal}
                </span>

                <span>
                  {money(
                    facture.sous_total,
                    lang
                  )}
                </span>
              </div>

              <div className="flex justify-between py-2 text-slate-600">
                <span>
                  {L.gst}
                </span>

                <span>
                  {money(
                    facture.tps,
                    lang
                  )}
                </span>
              </div>

              <div className="flex justify-between py-2 text-slate-600">
                <span>
                  {L.qst}
                </span>

                <span>
                  {money(
                    facture.tvq,
                    lang
                  )}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t-2 border-blue-900 pt-4">

                <span className="font-black text-slate-900">
                  {L.totalDue}
                </span>

                <span className="text-2xl font-black text-blue-800">
                  {money(
                    facture.total,
                    lang
                  )}
                </span>

              </div>
            </div>

            {/* PAIEMENT */}

            <div className="mt-10 grid gap-5 md:grid-cols-2">

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

                <div className="font-bold text-blue-900">
                  {L.payment}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  {L.interac}
                </div>

                <div className="font-semibold text-slate-900">
                  comptanetquebec@gmail.com
                </div>

              </div>

              <div
                className={`flex items-center justify-center rounded-xl p-5 text-lg font-black ${
                  estPayee
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {estPayee
                  ? L.paid
                  : L.unpaid}
              </div>

            </div>

            {/* NUMÉROS TAXES */}

            <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">

              <div>
                TPS : 701807737
              </div>

              <div>
                TVQ : 1227932399
              </div>

            </div>

            <div className="mt-8 text-center text-lg font-bold text-blue-900">
              {L.thankYou}
            </div>

          </div>

          <div className="h-4 bg-blue-900" />

        </article>
      </div>
    </main>
  );
}
