// app/admin/dossiers/signatures/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import SendSignatureButton from "./SendSignatureButton";

type PageProps = {
  searchParams: Promise<{
    fid?: string | string[];
  }>;
};

type ProfileRow = {
  is_admin: boolean | null;
};

type FormRow = {
  id: string;
  cq_id: string | null;
  annee: number | string | null;
  data: Record<string, unknown> | null;
};

type SignatureRequestRow = {
  id: string;
  formulaire_id: string | null;
  signer_name: string;
  signer_email: string;
  status:
    | "draft"
    | "sent"
    | "opened"
    | "partially_signed"
    | "signed"
    | "expired"
    | "cancelled";
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type SignatureDocumentRow = {
  id: string;
  signature_request_id: string;
  formulaire_id: string | null;
  tax_year: number;
  document_type: "T183" | "TP1000TE" | "OTHER";
  document_name: string;
  original_file_path: string;
  signed_file_path: string | null;
  status: "pending" | "viewed" | "signed" | "cancelled";
  viewed_at: string | null;
  signed_at: string | null;
  created_at: string;
};

type ClientData = {
  client?: {
    prenom?: string;
    nom?: string;
    courriel?: string;
    tel?: string;
    telCell?: string;
  };
};

function asClientData(value: Record<string, unknown> | null): ClientData {
  if (!value || typeof value !== "object") return {};
  return value as ClientData;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function requestStatusLabel(status: SignatureRequestRow["status"]) {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyée";
    case "opened":
      return "Ouverte";
    case "partially_signed":
      return "Partiellement signée";
    case "signed":
      return "Signée";
    case "expired":
      return "Expirée";
    case "cancelled":
      return "Annulée";
  }
}

function requestStatusClass(status: SignatureRequestRow["status"]) {
  switch (status) {
    case "signed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "sent":
    case "opened":
    case "partially_signed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "expired":
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function documentStatusLabel(status: SignatureDocumentRow["status"]) {
  switch (status) {
    case "pending":
      return "À signer";
    case "viewed":
      return "Consulté";
    case "signed":
      return "Signé";
    case "cancelled":
      return "Annulé";
  }
}

function documentStatusClass(status: SignatureDocumentRow["status"]) {
  switch (status) {
    case "signed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "viewed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default async function AdminSignaturesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const rawFid = params.fid;
  const fid = Array.isArray(rawFid) ? rawFid[0] : rawFid;

  if (!fid) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            Dossier introuvable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Le paramètre fid est manquant.
          </p>

          <Link
            href="/admin/dossiers"
            className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Retour aux dossiers
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await supabaseServer();

  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth?.user) {
    redirect(
      `/espace-client?next=${encodeURIComponent(
        `/admin/dossiers/signatures?fid=${fid}`
      )}`
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile?.is_admin) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            Accès refusé
          </h1>
        </div>
      </main>
    );
  }

  const { data: form, error: formError } = await supabase
    .from("formulaires_fiscaux")
    .select("id, cq_id, annee, data")
    .eq("id", fid)
    .maybeSingle<FormRow>();

  if (formError) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            Erreur de chargement
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {formError.message}
          </p>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            Dossier introuvable
          </h1>

          <Link
            href="/admin/dossiers"
            className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Retour aux dossiers
          </Link>
        </div>
      </main>
    );
  }

  const clientData = asClientData(form.data);

  const clientName =
    `${clientData.client?.prenom ?? ""} ${
      clientData.client?.nom ?? ""
    }`.trim() || "Client sans nom";

  const clientEmail =
    clientData.client?.courriel?.trim() || null;

  const taxYear =
    typeof form.annee === "number"
      ? form.annee
      : typeof form.annee === "string" &&
        /^\d{4}$/.test(form.annee.trim())
      ? Number(form.annee.trim())
      : null;

  const { data: requestsData, error: requestsError } = await supabase
    .from("signature_requests")
    .select(
      "id, formulaire_id, signer_name, signer_email, status, sent_at, opened_at, completed_at, created_at"
    )
    .eq("formulaire_id", fid)
    .order("created_at", { ascending: false })
    .returns<SignatureRequestRow[]>();

  const requests = requestsData ?? [];

  const requestIds = requests.map((request) => request.id);

  let documents: SignatureDocumentRow[] = [];
  let documentsError: string | null = null;

  if (requestIds.length > 0) {
    const { data, error } = await supabase
      .from("signature_documents")
      .select(
        "id, signature_request_id, formulaire_id, tax_year, document_type, document_name, original_file_path, signed_file_path, status, viewed_at, signed_at, created_at"
      )
      .in("signature_request_id", requestIds)
      .order("created_at", { ascending: true })
      .returns<SignatureDocumentRow[]>();

    documents = data ?? [];
    documentsError = error?.message ?? null;
  }

  const docsByRequest = new Map<string, SignatureDocumentRow[]>();

  for (const document of documents) {
    const list = docsByRequest.get(document.signature_request_id) ?? [];
    list.push(document);
    docsByRequest.set(document.signature_request_id, list);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/admin/dossiers"
            className="flex items-center"
          >
            <img
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              className="h-16 w-auto object-contain"
            />
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/formulaire-fiscal?fid=${encodeURIComponent(
                fid
              )}&lang=fr&admin=1`}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              📋 Formulaire
            </Link>

            <Link
              href={`/admin/dossiers/docs?fid=${encodeURIComponent(
                fid
              )}`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              📄 Docs
            </Link>

            <Link
              href="/admin/dossiers"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← Dossiers
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-7">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-violet-600">
                Signatures électroniques
              </div>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {clientName}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                  {form.cq_id ?? "Sans numéro CQ"}
                </span>

                <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                  Année {taxYear ?? "—"}
                </span>

                {clientEmail && (
                  <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-600">
                    {clientEmail}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/admin/dossiers/signatures/nouvelle?fid=${encodeURIComponent(
                fid
              )}`}
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              + Préparer une demande
            </Link>
          </div>
        </div>

        {requestsError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erreur demandes de signature : {requestsError.message}
          </div>
        )}

        {documentsError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erreur documents de signature : {documentsError}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">✍️</div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Aucune demande de signature
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Quand une demande sera créée, les T183,
              TP-1000.TE et leurs versions signées apparaîtront ici.
            </p>

            <Link
              href={`/admin/dossiers/signatures/nouvelle?fid=${encodeURIComponent(
                fid
              )}`}
              className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700"
            >
              Préparer la première demande
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => {
              const requestDocs =
                docsByRequest.get(request.id) ?? [];

              return (
                <section
                  key={request.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${requestStatusClass(
                            request.status
                          )}`}
                        >
                          {requestStatusLabel(request.status)}
                        </span>

                        <span className="text-sm font-semibold text-slate-800">
                          {request.signer_name}
                        </span>

                        <span className="text-sm text-slate-500">
                          {request.signer_email}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-400">
                        Créée le {formatDateTime(request.created_at)}
                        {request.sent_at
                          ? ` · envoyée le ${formatDateTime(
                              request.sent_at
                            )}`
                          : ""}
                        {request.completed_at
                          ? ` · complétée le ${formatDateTime(
                              request.completed_at
                            )}`
                          : ""}
                      </div>
                    </div>

                    {request.status === "draft" &&
                      requestDocs.length > 0 && (
                        <SendSignatureButton
                          requestId={request.id}
                        />
                      )}
                  </div>

                  <div className="p-5">
                    {requestDocs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                        Aucun document dans cette demande.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {requestDocs.map((document) => (
                          <div
                            key={document.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">
                                {document.document_name}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {document.document_type} · année{" "}
                                {document.tax_year}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${documentStatusClass(
                                  document.status
                                )}`}
                              >
                                {documentStatusLabel(document.status)}
                              </span>

                              {document.signed_at && (
                                <span className="text-xs text-slate-500">
                                  {formatDateTime(document.signed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
