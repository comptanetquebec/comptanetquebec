// app/signature/[token]/page.tsx

import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

type SignatureRequestRow = {
  id: string;
  signer_name: string;
  status: string;
  expires_at: string | null;
  opened_at: string | null;
};

type SignatureDocumentRow = {
  id: string;
  tax_year: number;
  document_type: string;
  document_name: string;
  original_file_path: string;
  status: string;
};

function makeAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SE_CE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function SignaturePage({
  params,
}: PageProps) {
  const { token } = await params;

  if (!token) {
    return <InvalidLink />;
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const supabase = makeAdminClient();

  const { data: request } =
    await supabase
      .from("signature_requests")
      .select(
        "id, signer_name, status, expires_at, opened_at"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle<SignatureRequestRow>();

  if (!request) {
    return <InvalidLink />;
  }

  if (
    request.status === "cancelled" ||
    request.status === "expired"
  ) {
    return <InvalidLink />;
  }

  if (
    request.expires_at &&
    new Date(request.expires_at).getTime() <
      Date.now()
  ) {
    await supabase
      .from("signature_requests")
      .update({
        status: "expired",
      })
      .eq("id", request.id);

    return <ExpiredLink />;
  }

  if (request.status === "sent") {
    const now = new Date().toISOString();

    await supabase
      .from("signature_requests")
      .update({
        status: "opened",
        opened_at: now,
      })
      .eq("id", request.id);

    await supabase
      .from("signature_events")
      .insert({
        signature_request_id: request.id,
        signature_document_id: null,
        event_type: "link_opened",
        metadata: {},
      });
  }

  const { data: documents } =
    await supabase
      .from("signature_documents")
      .select(
        "id, tax_year, document_type, document_name, original_file_path, status"
      )
      .eq(
        "signature_request_id",
        request.id
      )
      .order("tax_year", {
        ascending: true,
      })
      .returns<SignatureDocumentRow[]>();

  const rows = [];

  for (const document of documents ?? []) {
    const { data: signed } =
      await supabase.storage
        .from("tax-signatures")
        .createSignedUrl(
          document.original_file_path,
          15 * 60
        );

    rows.push({
      ...document,
      signedUrl:
        signed?.signedUrl ?? null,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8">
      <main className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <img
            src="/logo-cq.png"
            alt="ComptaNet Québec"
            className="h-16 w-auto object-contain"
          />

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Documents à signer
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Bonjour {request.signer_name}. Vérifiez les
            documents ci-dessous avant de poursuivre.
          </p>

          <div className="mt-6 grid gap-3">
            {rows.map((document) => (
              <div
                key={document.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {document.document_name}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {document.document_type} · année{" "}
                    {document.tax_year}
                  </div>
                </div>

                {document.signedUrl ? (
                  <a
                    href={document.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                  >
                    Voir le PDF
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-red-600">
                    PDF indisponible
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
            La consultation des PDF fonctionne. L’étape
            suivante ajoutera la zone de signature directement
            sur cette page.
          </div>
        </div>
      </main>
    </div>
  );
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-red-700">
          Lien invalide
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Ce lien de signature est invalide ou n’est plus
          disponible.
        </p>
      </div>
    </div>
  );
}

function ExpiredLink() {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-amber-700">
          Lien expiré
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Demandez à ComptaNet Québec de vous envoyer un
          nouveau lien de signature.
        </p>
      </div>
    </div>
  );
}
