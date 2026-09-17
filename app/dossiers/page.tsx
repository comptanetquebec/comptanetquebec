"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type PaymentStatus =
  | "draft"
  | "ready_for_payment"
  | "paid"
  | "unpaid"
  | null;

type DossierStatus =
  | "draft"
  | "recu"
  | "en_cours"
  | "attente_client"
  | "termine"
  | null;

type Lang = "fr" | "en" | "es";

type Row = {
  id: string;
  created_at?: string | null;
  form_type?: string | null;
  annee?: string | number | null;
  status?: DossierStatus;
  payment_status?: PaymentStatus;
};

function normalizeLang(value: string | null): Lang {
  if (value === "en") return "en";
  if (value === "es") return "es";
  return "fr";
}

function labelStatus(
  v: DossierStatus,
  lang: Lang
) {
  if (lang === "en") {
    switch (v) {
      case "recu":
        return "Received";
      case "en_cours":
        return "In progress";
      case "attente_client":
        return "Waiting for client";
      case "termine":
        return "Completed";
      case "draft":
        return "Draft";
      default:
        return "—";
    }
  }

  if (lang === "es") {
    switch (v) {
      case "recu":
        return "Recibido";
      case "en_cours":
        return "En curso";
      case "attente_client":
        return "Esperando al cliente";
      case "termine":
        return "Completado";
      case "draft":
        return "Borrador";
      default:
        return "—";
    }
  }

  switch (v) {
    case "recu":
      return "Reçu";
    case "en_cours":
      return "En cours";
    case "attente_client":
      return "En attente client";
    case "termine":
      return "Terminé";
    case "draft":
      return "Brouillon";
    default:
      return "—";
  }
}

function labelPayment(
  v: PaymentStatus,
  lang: Lang
) {
  if (lang === "en") {
    switch (v) {
      case "paid":
        return "Paid";
      case "ready_for_payment":
        return "Ready for payment";
      case "unpaid":
        return "Unpaid";
      case "draft":
        return "Draft";
      default:
        return "—";
    }
  }

  if (lang === "es") {
    switch (v) {
      case "paid":
        return "Pagado";
      case "ready_for_payment":
        return "Listo para pagar";
      case "unpaid":
        return "No pagado";
      case "draft":
        return "Borrador";
      default:
        return "—";
    }
  }

  switch (v) {
    case "paid":
      return "Payé";
    case "ready_for_payment":
      return "Prêt pour paiement";
    case "unpaid":
      return "Non payé";
    case "draft":
      return "Brouillon";
    default:
      return "—";
  }
}

function badgeClasses(
  kind: "ok" | "warn" | "info" | "muted"
) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium";

  if (kind === "ok") {
    return `${base} bg-green-100 text-green-800`;
  }

  if (kind === "warn") {
    return `${base} bg-yellow-100 text-yellow-800`;
  }

  if (kind === "info") {
    return `${base} bg-blue-100 text-blue-800`;
  }

  return `${base} bg-gray-100 text-gray-700`;
}

function statusKind(
  v: DossierStatus
): "ok" | "warn" | "info" | "muted" {
  if (v === "termine") return "ok";

  if (v === "attente_client") {
    return "warn";
  }

  if (
    v === "en_cours" ||
    v === "recu"
  ) {
    return "info";
  }

  return "muted";
}

function paymentKind(
  v: PaymentStatus
): "ok" | "warn" | "info" | "muted" {
  if (v === "paid") return "ok";

  if (
    v === "ready_for_payment" ||
    v === "unpaid"
  ) {
    return "warn";
  }

  if (v === "draft") {
    return "info";
  }

  return "muted";
}

export default function EspaceClientDashboard() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = normalizeLang(
    sp.get("lang")
  );

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [rows, setRows] =
    useState<Row[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const {
        data: userData,
        error: authErr,
      } =
        await supabase.auth.getUser();

      if (authErr) {
        if (!cancelled) {
          setError(authErr.message);
          setLoading(false);
        }

        return;
      }

      if (!userData.user) {
        router.replace(
          `/espace-client?lang=${encodeURIComponent(
            lang
          )}&next=${encodeURIComponent(
            `/dossiers?lang=${lang}`
          )}`
        );

        return;
      }

      const {
        data,
        error: qErr,
      } = await supabase
        .from("formulaires_fiscaux")
        .select(
          "id, created_at, form_type, annee, status, payment_status"
        )
        .eq(
          "user_id",
          userData.user.id
        )
        .order("created_at", {
          ascending: false,
        });

      if (qErr) {
        if (!cancelled) {
          setError(qErr.message);
        }
      } else {
        if (!cancelled) {
          setRows(
            (data as Row[]) || []
          );
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, lang]);

  const text = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Client portal",
        subtitle:
          "Track your files and upload documents.",
        newFile: "+ Start a file",
        logout: "Log out",
        loggingOut: "Logging out…",
        loading: "Loading…",
        noFiles: "No files yet.",
        status: "Status",
        payment: "Payment",
        continue: "Continue",
        documents: "Upload documents",
        dossier: "File",
        logoutError:
          "Unable to log out.",
      };
    }

    if (lang === "es") {
      return {
        title: "Portal del cliente",
        subtitle:
          "Seguimiento de sus expedientes y carga de documentos.",
        newFile: "+ Iniciar un expediente",
        logout: "Cerrar sesión",
        loggingOut: "Cerrando sesión…",
        loading: "Cargando…",
        noFiles:
          "No hay expedientes por el momento.",
        status: "Estado",
        payment: "Pago",
        continue: "Continuar",
        documents: "Subir documentos",
        dossier: "Expediente",
        logoutError:
          "No se pudo cerrar la sesión.",
      };
    }

    return {
      title: "Espace client",
      subtitle:
        "Suivi de vos dossiers et dépôt de documents.",
      newFile: "+ Commencer un dossier",
      logout: "Déconnexion",
      loggingOut: "Déconnexion…",
      loading: "Chargement…",
      noFiles:
        "Aucun dossier pour le moment.",
      status: "Statut",
      payment: "Paiement",
      continue: "Continuer",
      documents: "Déposer documents",
      dossier: "Dossier",
      logoutError:
        "Impossible de vous déconnecter.",
    };
  }, [lang]);

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError(null);

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      setError(
        logoutError.message ||
          text.logoutError
      );

      setLoggingOut(false);
      return;
    }

    router.replace(
      `/espace-client?lang=${encodeURIComponent(
        lang
      )}`
    );

    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {text.loading}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {text.title}
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              {text.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dossiers/nouveau?lang=${encodeURIComponent(
                lang
              )}`}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {text.newFile}
            </Link>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut
                ? text.loggingOut
                : `🚪 ${text.logout}`}
            </button>
          </div>
        </div>

        {/* ERREUR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* DOSSIERS */}

        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-700">
              {text.noFiles}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {r.form_type ||
                        text.dossier}{" "}
                      <span className="text-gray-400">
                        —
                      </span>{" "}
                      <span className="text-gray-700">
                        {r.annee ?? "—"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={badgeClasses(
                          statusKind(
                            r.status ?? null
                          )
                        )}
                      >
                        {text.status}:{" "}
                        {labelStatus(
                          r.status ?? null,
                          lang
                        )}
                      </span>

                      <span
                        className={badgeClasses(
                          paymentKind(
                            r.payment_status ??
                              null
                          )
                        )}
                      >
                        {text.payment}:{" "}
                        {labelPayment(
                          r.payment_status ??
                            null,
                          lang
                        )}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      ID: {r.id}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/formulaire-fiscal?fid=${encodeURIComponent(
                        r.id
                      )}&lang=${encodeURIComponent(
                        lang
                      )}`}
                      className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      {text.continue}
                    </Link>

                    <Link
                      href={`/formulaire-fiscal/depot-documents?fid=${encodeURIComponent(
                        r.id
                      )}&lang=${encodeURIComponent(
                        lang
                      )}`}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      {text.documents}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
