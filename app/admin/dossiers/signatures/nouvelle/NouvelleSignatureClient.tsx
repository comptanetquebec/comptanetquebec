"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PDFDocument } from "pdf-lib";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  fid: string;
  cqId: string;
  initialName: string;
  initialEmail: string;
  initialYear: number | null;
};

type DocumentType = "T183" | "TP1000TE";

type YearBlock = {
  key: string;
  year: string;
  t183File: File | null;
  tp1000File1: File | null;
  tp1000File2: File | null;
};

type PreparedDocument = {
  year: number;
  type: DocumentType;
  label: string;
  files: File[];
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function makeKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isPdf(file: File) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

async function sha256Text(
  value: string
) {
  const bytes =
    new TextEncoder().encode(value);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

function validEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function validateFile(
  file: File | null,
  label: string
) {
  if (!file) {
    return null;
  }

  if (!isPdf(file)) {
    return `${label} doit être un fichier PDF.`;
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    return `${label} dépasse la limite de 20 Mo.`;
  }

  return null;
}

async function mergePdfFiles(
  files: File[],
  year: number
) {
  if (
    files.length === 0
  ) {
    throw new Error(
      `Aucun TP-1000.TE pour ${year}.`
    );
  }

  if (
    files.length === 1
  ) {
    return files[0];
  }

  const merged =
    await PDFDocument.create();

  for (const file of files) {
    const sourceBytes =
      await file.arrayBuffer();

    const source =
      await PDFDocument.load(
        sourceBytes,
        {
          ignoreEncryption: true,
        }
      );

    const pageIndexes =
      source.getPageIndices();

    const copiedPages =
      await merged.copyPages(
        source,
        pageIndexes
      );

    for (
      const page of copiedPages
    ) {
      merged.addPage(page);
    }
  }

  const mergedBytes =
    await merged.save({
      useObjectStreams: false,
    });

  // pdf-lib retourne un Uint8Array<ArrayBufferLike>.
  // Blob attend ici un ArrayBuffer standard avec TypeScript 5.6+.
  // On copie donc les octets dans un vrai ArrayBuffer.
  const mergedArrayBuffer =
    new ArrayBuffer(
      mergedBytes.byteLength
    );

  new Uint8Array(
    mergedArrayBuffer
  ).set(mergedBytes);

  const blob =
    new Blob(
      [mergedArrayBuffer],
      {
        type: "application/pdf",
      }
    );

  if (
    blob.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      `Le TP-1000.TE fusionné ${year} dépasse 20 Mo.`
    );
  }

  return new File(
    [blob],
    `TP-1000-TE-${year}-fusionne.pdf`,
    {
      type: "application/pdf",
    }
  );
}

export default function NouvelleSignatureClient({
  fid,
  cqId,
  initialName,
  initialEmail,
  initialYear,
}: Props) {
  const router =
    useRouter();

  const [
    signerName,
    setSignerName,
  ] =
    useState(initialName);

  const [
    signerEmail,
    setSignerEmail,
  ] =
    useState(initialEmail);

  const [
    years,
    setYears,
  ] =
    useState<YearBlock[]>(
      () => [
        {
          key: makeKey(),
          year:
            initialYear
              ? String(
                  initialYear
                )
              : "",
          t183File: null,
          tp1000File1: null,
          tp1000File2: null,
        },
      ]
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );

  const preparedDocuments =
    useMemo<
      PreparedDocument[]
    >(() => {
      const items:
        PreparedDocument[] =
        [];

      for (
        const block of years
      ) {
        const year =
          Number(block.year);

        if (
          !Number.isInteger(
            year
          )
        ) {
          continue;
        }

        if (
          block.t183File
        ) {
          items.push({
            year,
            type: "T183",
            label:
              `T183 ${year}`,
            files: [
              block.t183File,
            ],
          });
        }

        const tpFiles =
          [
            block.tp1000File1,
            block.tp1000File2,
          ].filter(
            (
              file
            ): file is File =>
              Boolean(file)
          );

        if (
          tpFiles.length > 0
        ) {
          items.push({
            year,
            type:
              "TP1000TE",
            label:
              `TP-1000.TE ${year}`,
            files: tpFiles,
          });
        }
      }

      return items;
    }, [years]);

  function addYear() {
    setYears(
      (current) => [
        ...current,
        {
          key: makeKey(),
          year: "",
          t183File: null,
          tp1000File1:
            null,
          tp1000File2:
            null,
        },
      ]
    );
  }

  function removeYear(
    key: string
  ) {
    setYears(
      (current) => {
        if (
          current.length ===
          1
        ) {
          return current;
        }

        return current.filter(
          (block) =>
            block.key !== key
        );
      }
    );
  }

  function updateYear(
    key: string,
    patch: Partial<
      Omit<
        YearBlock,
        "key"
      >
    >
  ) {
    setYears(
      (current) =>
        current.map(
          (block) =>
            block.key ===
            key
              ? {
                  ...block,
                  ...patch,
                }
              : block
        )
    );
  }

  function validateYears() {
    const seen =
      new Set<number>();

    for (
      const block of years
    ) {
      const year =
        Number(block.year);

      if (
        !Number.isInteger(
          year
        ) ||
        year < 2000 ||
        year > 2100
      ) {
        return "Une des années d’imposition est invalide.";
      }

      if (
        seen.has(year)
      ) {
        return `L’année ${year} est inscrite deux fois.`;
      }

      seen.add(year);

      if (
        !block.t183File &&
        !block.tp1000File1 &&
        !block.tp1000File2
      ) {
        return `Ajoute au moins un PDF pour l’année ${year}, ou retire cette année.`;
      }

      if (
        block.tp1000File2 &&
        !block.tp1000File1
      ) {
        return `Pour le TP-1000.TE ${year}, ajoute d’abord le PDF 1 avant le PDF 2.`;
      }

      const t183Error =
        validateFile(
          block.t183File,
          `Le T183 ${year}`
        );

      if (t183Error) {
        return t183Error;
      }

      const tp1Error =
        validateFile(
          block.tp1000File1,
          `Le TP-1000.TE ${year} — PDF 1`
        );

      if (tp1Error) {
        return tp1Error;
      }

      const tp2Error =
        validateFile(
          block.tp1000File2,
          `Le TP-1000.TE ${year} — PDF 2`
        );

      if (tp2Error) {
        return tp2Error;
      }
    }

    return null;
  }

  async function prepareRequest() {
    if (saving) {
      return;
    }

    setMessage(null);

    const name =
      signerName.trim();

    const email =
      signerEmail
        .trim()
        .toLowerCase();

    if (!name) {
      setMessage(
        "❌ Le nom du client est obligatoire."
      );
      return;
    }

    if (
      !validEmail(email)
    ) {
      setMessage(
        "❌ Le courriel du client est invalide."
      );
      return;
    }

    const yearsError =
      validateYears();

    if (
      yearsError
    ) {
      setMessage(
        `❌ ${yearsError}`
      );
      return;
    }

    if (
      preparedDocuments.length ===
      0
    ) {
      setMessage(
        "❌ Ajoute au moins un PDF à signer."
      );
      return;
    }

    setSaving(true);

    let requestId:
      string | null =
      null;

    const uploadedPaths:
      string[] = [];

    try {
      const {
        data: request,
        error:
          requestError,
      } =
        await supabase
          .from(
            "signature_requests"
          )
          .insert({
            client_id:
              null,
            formulaire_id:
              fid,
            signer_name:
              name,
            signer_email:
              email,
            status:
              "draft",
          })
          .select("id")
          .single<{
            id: string;
          }>();

      if (
        requestError ||
        !request?.id
      ) {
        throw new Error(
          requestError?.message ??
            "Impossible de créer la demande de signature."
        );
      }

      requestId =
        request.id;

      const clientHash =
        await sha256Text(
          email
        );

      const clientFolder =
        clientHash.slice(
          0,
          24
        );

      for (
        const document of
          preparedDocuments
      ) {
        let finalFile:
          File;

        if (
          document.type ===
          "TP1000TE"
        ) {
          finalFile =
            await mergePdfFiles(
              document.files,
              document.year
            );
        } else {
          finalFile =
            document.files[0];
        }

        const fileHash =
          await sha256File(
            finalFile
          );

        const storagePath =
          `clients/${clientFolder}/${document.year}/` +
          `${request.id}/${document.type}-original.pdf`;

        const {
          data:
            uploadData,
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "tax-signatures"
            )
            .upload(
              storagePath,
              finalFile,
              {
                cacheControl:
                  "3600",
                upsert:
                  false,
                contentType:
                  "application/pdf",
              }
            );

        if (
          uploadError ||
          !uploadData?.path
        ) {
          throw new Error(
            uploadError?.message ??
              `Impossible de téléverser ${document.label}.`
          );
        }

        uploadedPaths.push(
          uploadData.path
        );

        const documentName =
          document.type ===
          "T183"
            ? `T183 — Déclaration de revenus ${document.year}`
            : `TP-1000.TE — Déclaration de revenus ${document.year}`;

        const {
          data:
            insertedDocument,
          error:
            documentError,
        } =
          await supabase
            .from(
              "signature_documents"
            )
            .insert({
              signature_request_id:
                request.id,
              formulaire_id:
                fid,
              tax_year:
                document.year,
              document_type:
                document.type,
              document_name:
                documentName,
              original_file_path:
                uploadData.path,
              signed_file_path:
                null,
              original_sha256:
                fileHash,
              signed_sha256:
                null,
              signature_image_path:
                null,
              status:
                "pending",
            })
            .select("id")
            .single<{
              id: string;
            }>();

        if (
          documentError ||
          !insertedDocument?.id
        ) {
          throw new Error(
            documentError?.message ??
              `Impossible d'enregistrer ${document.label}.`
          );
        }

        await supabase
          .from(
            "signature_events"
          )
          .insert({
            signature_request_id:
              request.id,
            signature_document_id:
              insertedDocument.id,
            event_type:
              "document_uploaded",
            user_agent:
              typeof navigator !==
              "undefined"
                ? navigator.userAgent
                : null,
            metadata: {
              document_type:
                document.type,
              tax_year:
                document.year,
              original_sha256:
                fileHash,
              source_file_count:
                document.files
                  .length,
              merged:
                document.type ===
                  "TP1000TE" &&
                document.files
                  .length > 1,
            },
          });
      }

      await supabase
        .from(
          "signature_events"
        )
        .insert({
          signature_request_id:
            request.id,
          signature_document_id:
            null,
          event_type:
            "request_created",
          user_agent:
            typeof navigator !==
            "undefined"
              ? navigator.userAgent
              : null,
          metadata: {
            formulaire_id:
              fid,
            cq_id:
              cqId || null,
            tax_years:
              years.map(
                (block) =>
                  Number(
                    block.year
                  )
              ),
            document_types:
              preparedDocuments.map(
                (document) => ({
                  year:
                    document.year,
                  type:
                    document.type,
                  source_file_count:
                    document.files
                      .length,
                })
              ),
          },
        });

      setMessage(
        "✅ Tous les PDF sont enregistrés dans une seule demande de signature."
      );

      router.push(
        `/admin/dossiers/signatures?fid=${encodeURIComponent(
          fid
        )}`
      );

      router.refresh();
    } catch (error) {
      if (
        uploadedPaths.length >
        0
      ) {
        await supabase.storage
          .from(
            "tax-signatures"
          )
          .remove(
            uploadedPaths
          );
      }

      if (
        requestId
      ) {
        await supabase
          .from(
            "signature_events"
          )
          .delete()
          .eq(
            "signature_request_id",
            requestId
          );

        await supabase
          .from(
            "signature_documents"
          )
          .delete()
          .eq(
            "signature_request_id",
            requestId
          );

        await supabase
          .from(
            "signature_requests"
          )
          .delete()
          .eq(
            "id",
            requestId
          );
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

      <main className="mx-auto max-w-6xl px-5 py-7">
        <div className="mb-6">
          <div className="text-sm font-bold uppercase tracking-wide text-violet-600">
            Nouvelle demande
          </div>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Préparer les PDF à signer
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Un seul client peut avoir plusieurs années dans la même demande de signature.
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
                  value={
                    signerName
                  }
                  onChange={(
                    event
                  ) =>
                    setSignerName(
                      event.target
                        .value
                    )
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
                  value={
                    signerEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setSignerEmail(
                      event.target
                        .value
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Dossier de départ
                </span>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {cqId || fid}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Années et documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pour Québec, tu peux mettre un seul PDF ou deux PDF séparés. ComptaNet les fusionnera automatiquement.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addYear
                }
                className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100"
              >
                + Ajouter une année
              </button>
            </div>

            <div className="mt-5 grid gap-5">
              {years.map(
                (block) => (
                  <div
                    key={
                      block.key
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5"
                  >
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          Année d’imposition
                        </span>

                        <input
                          inputMode="numeric"
                          value={
                            block.year
                          }
                          onChange={(
                            event
                          ) =>
                            updateYear(
                              block.key,
                              {
                                year:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          placeholder="2025"
                          className="w-36 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      {years.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeYear(
                              block.key
                            )
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Retirer cette année
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                          onChange={(
                            event
                          ) =>
                            updateYear(
                              block.key,
                              {
                                t183File:
                                  event
                                    .target
                                    .files?.[0] ??
                                  null,
                              }
                            )
                          }
                          className="mt-4 block w-full text-sm text-slate-600"
                        />

                        {block.t183File && (
                          <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                            📄{" "}
                            {
                              block
                                .t183File
                                .name
                            }
                          </div>
                        )}
                      </label>

                      <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-5">
                        <div className="font-bold text-violet-800">
                          TP-1000.TE — Revenu Québec
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Si ton logiciel te donne deux PDF, mets la première partie dans PDF 1 et la page de signature dans PDF 2. ComptaNet créera un seul PDF.
                        </div>

                        <label className="mt-4 grid gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            PDF 1
                          </span>

                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(
                              event
                            ) =>
                              updateYear(
                                block.key,
                                {
                                  tp1000File1:
                                    event
                                      .target
                                      .files?.[0] ??
                                    null,
                                }
                              )
                            }
                            className="block w-full text-sm text-slate-600"
                          />

                          {block.tp1000File1 && (
                            <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                              📄{" "}
                              {
                                block
                                  .tp1000File1
                                  .name
                              }
                            </div>
                          )}
                        </label>

                        <label className="mt-4 grid gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            PDF 2 — page de signature (facultatif)
                          </span>

                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(
                              event
                            ) =>
                              updateYear(
                                block.key,
                                {
                                  tp1000File2:
                                    event
                                      .target
                                      .files?.[0] ??
                                    null,
                                }
                              )
                            }
                            className="block w-full text-sm text-slate-600"
                          />

                          {block.tp1000File2 && (
                            <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                              📄{" "}
                              {
                                block
                                  .tp1000File2
                                  .name
                              }
                            </div>
                          )}
                        </label>

                        {block.tp1000File1 &&
                          block.tp1000File2 && (
                            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                              ✓ Les 2 PDF seront fusionnés automatiquement avant l’envoi.
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {message && (
            <div
              className={`rounded-xl border p-4 text-sm font-semibold ${
                message.startsWith(
                  "✅"
                )
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
              onClick={() =>
                void prepareRequest()
              }
              disabled={
                saving
              }
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : `Enregistrer ${
                    preparedDocuments.length ||
                    ""
                  } PDF${
                    preparedDocuments.length >
                    1
                      ? "s"
                      : ""
                  }`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
