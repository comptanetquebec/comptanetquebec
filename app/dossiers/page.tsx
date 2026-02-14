"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type PaymentStatus = "draft" | "ready_for_payment" | "paid" | "unpaid" | null;
type DossierStatus = "draft" | "recu" | "en_cours" | "attente_client" | "termine" | null;

type Row = {
  id: string;
  created_at?: string | null;
  form_type?: string | null;
  annee?: string | number | null;
  status?: DossierStatus;
  payment_status?: PaymentStatus;
};

function labelStatus(v: DossierStatus) {
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

function labelPayment(v: PaymentStatus) {
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

// classes simples pour badges (sans logique compliquée)
function badgeClasses(kind: "ok" | "warn" | "info" | "muted") {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium";
  if (kind === "ok") return `${base} bg-green-100 text-green-800`;
  if (kind === "warn") return `${base} bg-yellow-100 text-yellow-800`;
  if (kind === "info") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-gray-100 text-gray-700`;
}

function statusKind(v: DossierStatus): "ok" | "warn" | "info" | "muted" {
  if (v === "termine") return "ok";
  if (v === "attente_client") return "warn";
  if (v === "en_cours" || v === "recu") return "info";
  return "muted";
}

function paymentKind(v: PaymentStatus): "ok" | "warn" | "info" | "muted" {
  if (v === "paid") return "ok";
  if (v === "ready_for_payment" || v === "unpaid") return "warn";
  if (v === "draft") return "info";
  return "muted";
}

export default function EspaceClientDashboard() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "fr";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        if (!cancelled) setError(authErr.message);
        setLoading(false);
        return;
      }

      if (!userData.user) {
        router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=/dossiers`);
        return;
      }

      const { data, error: qErr } = await supabase
        .from("formulaires_fiscaux")
        .select("id, created_at, form_type, annee, status, payment_status")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (qErr) {
        if (!cancelled) setError(qErr.message);
      } else {
        if (!cancelled) setRows((data as Row[]) || []);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, lang]);

  const title = useMemo(() => (lang === "en" ? "Client portal" : lang === "es" ? "Portal del cliente" : "Espace client"), [
    lang,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Chargement…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Suivi de vos dossiers et dépôt de documents.
            </p>
          </div>

          <Link
            href={`/dossiers/nouveau?lang=${encodeURIComponent(lang)}`}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Commencer un dossier
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Content */}
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-700">Aucun dossier pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {r.form_type || "Dossier"} <span className="text-gray-400">—</span>{" "}
                      <span className="text-gray-700">{r.annee ?? "—"}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={badgeClasses(statusKind(r.status ?? null))}>
                        Statut: {labelStatus(r.status ?? null)}
                      </span>
                      <span className={badgeClasses(paymentKind(r.payment_status ?? null))}>
                        Paiement: {labelPayment(r.payment_status ?? null)}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      ID: {r.id}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/formulaire-fiscal?fid=${encodeURIComponent(r.id)}&lang=${encodeURIComponent(lang)}`}
                      className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                    >
                      Continuer
                    </Link>

                    <Link
                      href={`/formulaire-fiscal/depot-documents?fid=${encodeURIComponent(r.id)}&lang=${encodeURIComponent(lang)}`}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Déposer documents
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
