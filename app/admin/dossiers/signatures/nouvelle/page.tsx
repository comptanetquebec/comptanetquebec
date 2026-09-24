"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  fid: string;
  cqId: string;
  initialName: string;
  initialEmail: string;
  initialYear: number | null;
};

type DocumentType = "T183" | "TP1000TE";

type PreparedDocument = {
  type: DocumentType;
  label: string;
  file: File;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function isPdf(file: File) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Text(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function NouvelleSignatureClient({
  fid,
  cqId,
  initialName,
  initialEmail,
  initialYear,
}: Props) {
  const router = useRouter();

  const [signerName, setSignerName] = useState(initialName);
  const [signerEmail, setSignerEmail] = useState(initialEmail);
  const [taxYear, setTaxYear] = useState(
    initialYear ? String(initialYear) : ""
  );

  const [t183File, setT183File] = useState<File | null>(null);
  const [tp1000File, setTp1000File] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const preparedDocuments = useMemo<PreparedDocument[]>(() => {
    const items: PreparedDocument[] = [];

    if (t183File) {
      items.push({
        type: "T183",
        label: "T183",
        file: t183File,
      });
    }

    if (tp1000File) {
      items.push({
        type: "TP1000TE",
        label: "TP-1000.TE",
        file: tp1000File,
      });
    }

    return items;
  }, [t183File, tp1000File]);

  function validateFile(file: File | null, label: string) {
    if (!file) return null;

    if (!isPdf(file)) {
      return `${label} doit être un fichier PDF.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${label} dépasse la limite de 20 Mo.`;
    }

    return null;
  }

  async function prepareRequest() {
    if (saving) return;

    setMessage(null);

    const name = signerName.trim();
    const email = signerEmail.trim().toLowerCase();
    const year = Number(taxYear);

    if (!name) {
      setMessage("❌ Le nom du client est obligatoire.");
      return;
    }

    if (!validEmail(email)) {
      setMessage("❌ Le courriel du client est invalide.");
      return;
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      setMessage("❌ L’année d’imposition est invalide.");
      return;
    }

    if (preparedDocuments.length === 0) {
      setMessage(
        "❌ Ajoute au moins un PDF à signer : T183 ou TP-1000.TE."
      );
      return;
    }

    const t183Error = validateFile(t183File, "Le T183");
    if (t183Error) {
      setMessage(`❌ ${t183Error}`);
      return;
    }

    const tpError = validateFile(tp1000File, "Le TP-1000.TE");
    if (tpError) {
      setMessage(`❌ ${tpError}`);
      return;
    }

    setSaving(true);

    let requestId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      const { data: request, error: requestError } = await supabase
        .from("signature_requests")
        .insert({
          client_id: null,
          formulaire_id: fid,
          signer_name: name,
          signer_email: email,
          status: "draft",
        })
        .select("id")
        .single<{ id: string }>();

      if (requestError || !request?.id) {
        throw new Error(
          requestError?.message ??
            "Impossible de créer la demande de signature."
        );
      }

      requestId = request.id;

      // Le dossier Storage est stable par client grâce au hash du courriel,
      // sans exposer le courriel lui-même dans le chemin.
      const clientHash = await sha256Text(email);
      const clientFolder = clientHash.slice(0, 24);

      for (const document of preparedDocuments) {
        const fileHash = await sha256File(document.file);

        const storagePath =
          `clients/${clientFolder}/${year}/` +
          `${request.id}/${document.type}-original.pdf`;

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("tax-signatures")
            .upload(storagePath, document.file, {
              cacheControl: "3600",
              upsert: false,
              contentType: "application/pdf",
            });

        if (uploadError || !uploadData?.path) {
          throw new Error(
            uploadError?.message ??
              `Impossible de téléverser ${document.label}.`
          );
        }

        uploadedPaths.push(uploadData.path);

        const documentName =
          document.type === "T183"
            ? `T183 — Déclaration de revenus ${year}`
            : `TP-1000.TE — Déclaration de revenus ${year}`;

        const { error: documentError } = await supabase
          .from("signature_documents")
          .insert({
            signature_request_id: request.id,
            formulaire_id: fid,
            tax_year: year,
            document_type: document.type,
            document_name: documentName,
            original_file_path: uploadData.path,
            signed_file_path: null,
            original_sha256: fileHash,
            signed_sha256: null,
            signature_image_path: null,
            status: "pending",
          });

        if (documentError) {
          throw new Error(documentError.message);
        }

        await supabase.from("signature_events").insert({
          signature_request_id: request.id,
          signature_document_id: null,
          event_type: "document_uploaded",
          user_agent:
            typeof navigator !== "undefined"
              ? navigator.userAgent
              : null,
          metadata: {
            document_type: document.type,
            tax_year: year,
            original_sha256: fileHash,
          },
        });
      }

      await supabase.from("signature_events").insert({
        signature_request_id: request.id,
        signature_document_id: null,
        event_type: "request_created",
        user_agent:
          typeof navigator !== "undefined"
            ? navigator.userAgent
            : null,
        metadata: {
          formulaire_id: fid,
          cq_id: cqId || null,
          tax_year: year,
          document_types: preparedDocuments.map(
            (document) => document.type
          ),
        },
      });

      setMessage(
        "✅ Les PDF sont enregistrés dans la demande de signature."
      );

      router.push(
        `/admin/dossiers/signatures?fid=${encodeURIComponent(fid)}`
      );
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from("tax-signatures")
          .remove(uploadedPaths);
      }

      if (requestId) {
        await supabase
          .from("signature_requests")
          .delete()
          .eq("id", requestId);
      }

      setMessage(
        `❌ ${
          error instanceof Error
            ? error.message
            : "Erreur pendant la préparation de la demande."
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
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

          <Link
            href={`/admin/dossiers/signatures?fid=${encodeURIComponent(
              fid
            )}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Retour aux signatures
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-7">
        <div className="mb-6">
          <div className="text-sm font-bold uppercase tracking-wide text-violet-600">
            Nouvelle demande
          </div>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Préparer les PDF à signer
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Exporte les formulaires depuis ton logiciel d’impôt,
            puis ajoute simplement les PDF ici.
          </p>
        </div>

        <div className="grid gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Client
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Nom
                </span>

                <input
                  value={signerName}
                  onChange={(event) =>
                    setSignerName(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Courriel
                </span>

                <input
                  type="email"
                  value={signerEmail}
                  onChange={(event) =>
                    setSignerEmail(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Année d’imposition
                </span>

                <input
                  inputMode="numeric"
                  value={taxYear}
                  onChange={(event) =>
                    setTaxYear(event.target.value)
                  }
                  placeholder="2025"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Dossier
                </span>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {cqId || fid}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Documents à signer
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tu peux ajouter les deux PDF ou seulement celui dont
              tu as besoin.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-5">
                <div className="font-bold text-blue-800">
                  T183 — ARC
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  PDF exporté de ton logiciel d’impôt
                </div>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setT183File(
                      event.target.files?.[0] ?? null
                    )
                  }
                  className="mt-4 block w-full text-sm text-slate-600"
                />

                {t183File && (
                  <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    📄 {t183File.name}
                  </div>
                )}
              </label>

              <label className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-5">
                <div className="font-bold text-violet-800">
                  TP-1000.TE — Revenu Québec
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  PDF exporté de ton logiciel d’impôt
                </div>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setTp1000File(
                      event.target.files?.[0] ?? null
                    )
                  }
                  className="mt-4 block w-full text-sm text-slate-600"
                />

                {tp1000File && (
                  <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    📄 {tp1000File.name}
                  </div>
                )}
              </label>
            </div>
          </section>

          {message && (
            <div
              className={`rounded-xl border p-4 text-sm font-semibold ${
                message.startsWith("✅")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href={`/admin/dossiers/signatures?fid=${encodeURIComponent(
                fid
              )}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </Link>

            <button
              type="button"
              onClick={() => void prepareRequest()}
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : "Enregistrer les PDF"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
