// app/admin/factures/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type Lang = "fr" | "en" | "es";

type ProfileRow = {
  is_admin: boolean | null;
};

type FactureRow = {
  id: string;
  numero_facture: string | null;
  client_nom: string | null;
  client_courriel: string | null;
  description: string | null;
  sous_total: number | null;
  tps: number | null;
  tvq: number | null;
  total: number | null;
  statut: string | null;
  montant_paye: number | null;
  mode_paiement: string | null;
  date_facture: string | null;
  created_at: string | null;
};

function normalizeLang(value?: string): Lang {
  const v = (value || "").toLowerCase();

  if (v === "en" || v === "es") {
    return v;
  }

  return "fr";
}

const COPY = {
  fr: {
    title: "Factures",
    subtitle: "Gestion des factures ComptaNet Québec",
    newInvoice: "+ Nouvelle facture",
    noInvoice: "Aucune facture",
    noInvoiceText: "Tes nouvelles factures apparaîtront ici.",
    firstInvoice: "Créer une première facture",
    invoice: "Facture",
    client: "Client",
    description: "Description",
    total: "Total",
    paidAmount: "Payé",
    status: "Statut",
    date: "Date",
    paid: "Payée",
    unpaid: "À payer",
    error: "Erreur de chargement",
    accessDenied: "Accès refusé",
  },

  en: {
    title: "Invoices",
    subtitle: "ComptaNet Québec invoice management",
    newInvoice: "+ New invoice",
    noInvoice: "No invoices",
    noInvoiceText: "Your new invoices will appear here.",
    firstInvoice: "Create your first invoice",
    invoice: "Invoice",
    client: "Client",
    description: "Description",
    total: "Total",
    paidAmount: "Paid",
    status: "Status",
    date: "Date",
    paid: "Paid",
    unpaid: "Amount due",
    error: "Loading error",
    accessDenied: "Access denied",
  },

  es: {
    title: "Facturas",
    subtitle: "Gestión de facturas de ComptaNet Québec",
    newInvoice: "+ Nueva factura",
    noInvoice: "No hay facturas",
    noInvoiceText: "Tus nuevas facturas aparecerán aquí.",
    firstInvoice: "Crear la primera factura",
    invoice: "Factura",
    client: "Cliente",
    description: "Descripción",
    total: "Total",
    paidAmount: "Pagado",
    status: "Estado",
    date: "Fecha",
    paid: "Pagada",
    unpaid: "Por pagar",
    error: "Error de carga",
    accessDenied: "Acceso denegado",
  },
} as const;

function argent(value: number | null, lang: Lang) {
  const locale =
    lang === "fr"
      ? "fr-CA"
      : lang === "es"
      ? "es-CA"
      : "en-CA";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(value ?? 0);
}

type PageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function AdminFacturesPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const lang = normalizeLang(params?.lang);
  const L = COPY[lang];

  const supabase = await supabaseServer();

  // Vérification connexion
  const { data: auth, error: authErr } =
    await supabase.auth.getUser();

  if (authErr || !auth?.user) {
    redirect(
      `/espace-client?next=${encodeURIComponent(
        `/admin/factures?lang=${lang}`
      )}&lang=${lang}`
    );
  }

  // Vérification admin
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (profileErr || !profile?.is_admin) {
    return <div className="p-6">{L.accessDenied}</div>;
  }

  // Charger les factures
  const { data, error } = await supabase
    .from("factures")
    .select(
      `
        id,
        numero_facture,
        client_nom,
        client_courriel,
        description,
        sous_total,
        tps,
        tvq,
        total,
        statut,
        montant_paye,
        mode_paiement,
        date_facture,
        created_at
      `
    )
    .order("created_at", { ascending: false })
    .returns<FactureRow[]>();

  const factures = data ?? [];

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* LANGUES */}
        <div className="mb-5 flex justify-end gap-2">
          <Link
            href="/admin/factures?lang=fr"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              lang === "fr"
                ? "bg-blue-700 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            FR
          </Link>

          <Link
            href="/admin/factures?lang=en"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              lang === "en"
                ? "bg-blue-700 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            EN
          </Link>

          <Link
            href="/admin/factures?lang=es"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              lang === "es"
                ? "bg-blue-700 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            ES
          </Link>
        </div>

        {/* EN-TÊTE */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {L.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {L.subtitle}
            </p>
          </div>

          <Link
            href={`/admin/factures/nouvelle?lang=${lang}`}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            {L.newInvoice}
          </Link>
        </div>

        {/* ERREUR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {L.error}: {error.message}
          </div>
        )}

        {/* AUCUNE FACTURE */}
        {!error && factures.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="text-xl font-semibold text-slate-800">
              {L.noInvoice}
            </div>

            <p className="mt-2 text-slate-500">
              {L.noInvoiceText}
            </p>

            <Link
              href={`/admin/factures/nouvelle?lang=${lang}`}
              className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              {L.firstInvoice}
            </Link>
          </div>
        )}

        {/* TABLEAU */}
        {factures.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">

                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      {L.invoice}
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      {L.client}
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      {L.description}
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      {L.total}
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      {L.paidAmount}
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      {L.status}
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      {L.date}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {factures.map((facture) => {
                    const paye =
                      facture.statut === "paid" ||
                      facture.statut === "payee" ||
                      facture.statut === "paid_stripe";

                    return (
                      <tr
                        key={facture.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-700">
                          {facture.numero_facture ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">
                            {facture.client_nom ?? "—"}
                          </div>

                          {facture.client_courriel && (
                            <div className="text-xs text-slate-500">
                              {facture.client_courriel}
                            </div>
                          )}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-600">
                          {facture.description ?? "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                          {argent(facture.total, lang)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {argent(facture.montant_paye, lang)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              paye
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {paye ? L.paid : L.unpaid}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {facture.date_facture
                            ? new Date(
                                `${facture.date_facture}T12:00:00`
                              ).toLocaleDateString(
                                lang === "fr"
                                  ? "fr-CA"
                                  : lang === "es"
                                  ? "es-CA"
                                  : "en-CA"
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
