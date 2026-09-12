"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export type DossierStatus =
  | "recu"
  | "en_cours"
  | "attente_client"
  | "termine";

export type PaymentStatus = "unpaid" | "paid";

export type AdminDossierRow = {
  formulaire_id: string;
  cq_id: string | null;

  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;

  payment_status: PaymentStatus | null;
  created_at: string | null;

  status: DossierStatus;
  updated_at: string | null;

  form_type?: string | null;
  tax_year?: number | null;

  form_filled: boolean;
  docs_count: number;
};

type TabKey = "all" | "todo" | "waiting" | "done";

type SortKey =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "cq_asc";

const LABEL: Record<DossierStatus, string> = {
  recu: "Reçu",
  en_cours: "En cours",
  attente_client: "En attente client",
  termine: "Terminé",
};

const BADGE_CLASS: Record<DossierStatus, string> = {
  recu: "border-amber-200 bg-amber-50 text-amber-800",
  en_cours: "border-blue-200 bg-blue-50 text-blue-800",
  attente_client: "border-orange-200 bg-orange-50 text-orange-800",
  termine: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const PAY_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Non payé",
  paid: "Payé",
};

const PAY_BADGE_CLASS: Record<PaymentStatus, string> = {
  unpaid: "border-slate-200 bg-slate-50 text-slate-600",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function rowTab(status: DossierStatus): Exclude<TabKey, "all"> {
  if (status === "attente_client") return "waiting";
  if (status === "termine") return "done";
  return "todo";
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(iso: string | null | undefined) {
  const d = toDate(iso);

  if (!d) return "—";

  return d.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function safeInt(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safePaymentStatus(value: unknown): PaymentStatus {
  return value === "paid" ? "paid" : "unpaid";
}

function normalizeRows(input: AdminDossierRow[]): AdminDossierRow[] {
  return (input ?? []).map((row) => ({
    ...row,
    form_filled: Boolean(row.form_filled),
    docs_count: safeInt(row.docs_count, 0),
    payment_status: row.payment_status
      ? safePaymentStatus(row.payment_status)
      : null,
  }));
}

function rowSearchText(row: AdminDossierRow) {
  return normalizeSearch(
    [
      row.client_name ?? "",
      row.client_email ?? "",
      row.client_phone ?? "",
      row.cq_id ?? "",
      row.formulaire_id ?? "",
      row.form_type ?? "",
      row.tax_year != null ? String(row.tax_year) : "",
      row.payment_status ?? "",
      row.status ?? "",
      String(row.docs_count ?? 0),
    ].join(" ")
  );
}

function StatCard({
  icon,
  title,
  value,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-left transition ${
        active
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
          {icon}
        </div>

        <div>
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </button>
  );
}

export default function AdminDossiersClient({
  initialRows,
}: {
  initialRows: AdminDossierRow[];
}) {
  const normalizedInitial = useMemo(
    () => normalizeRows(initialRows),
    [initialRows]
  );

  const [rows, setRows] =
    useState<AdminDossierRow[]>(normalizedInitial);

  const [tab, setTab] = useState<TabKey>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("created_desc");

  const counts = useMemo(() => {
    const result = {
      all: rows.length,
      todo: 0,
      waiting: 0,
      done: 0,
    };

    for (const row of rows) {
      result[rowTab(row.status)]++;
    }

    return result;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);

    let result =
      tab === "all"
        ? rows
        : rows.filter((row) => rowTab(row.status) === tab);

    if (q) {
      result = result.filter((row) =>
        rowSearchText(row).includes(q)
      );
    }

    return [...result].sort((a, b) => {
      const ac = toDate(a.created_at)?.getTime() ?? 0;
      const bc = toDate(b.created_at)?.getTime() ?? 0;

      const au = toDate(a.updated_at)?.getTime() ?? 0;
      const bu = toDate(b.updated_at)?.getTime() ?? 0;

      if (sort === "created_desc") return bc - ac;
      if (sort === "created_asc") return ac - bc;
      if (sort === "updated_desc") return bu - au;

      const as = (
        a.client_name ??
        a.cq_id ??
        ""
      ).toLowerCase();

      const bs = (
        b.client_name ??
        b.cq_id ??
        ""
      ).toLowerCase();

      return as.localeCompare(bs);
    });
  }, [rows, tab, query, sort]);

  async function updateStatus(
    formulaire_id: string,
    status: DossierStatus
  ) {
    const previousRows = rows.map((row) => ({ ...row }));

    setRows((current) =>
      current.map((row) =>
        row.formulaire_id === formulaire_id
          ? {
              ...row,
              status,
              updated_at: new Date().toISOString(),
            }
          : row
      )
    );

    setSavingId(formulaire_id);

    const { error } = await supabase
      .from("dossier_statuses")
      .upsert(
        {
          formulaire_id,
          status,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "formulaire_id",
        }
      );

    setSavingId(null);

    if (error) {
      setRows(previousRows);
      alert("Erreur sauvegarde statut: " + error.message);
    }
  }


  function resetFilters() {
    setQuery("");
    setSort("created_desc");
    setTab("all");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/admin/dossiers" className="flex shrink-0 items-center">
            <img
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              className="h-16 w-auto object-contain"
            />
          </Link>

          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/admin/dossiers"
              className="rounded-2xl bg-blue-50 px-6 py-3 text-base font-bold text-blue-700 transition hover:bg-blue-100 sm:text-lg"
            >
              📁 Dossiers
            </Link>

            <Link
              href="/admin/factures"
              className="rounded-2xl px-6 py-3 text-base font-bold text-slate-700 transition hover:bg-slate-100 sm:text-lg"
            >
              🧾 Factures
            </Link>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8">
        {/* TITLE */}
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                📁
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                  Admin – Dossiers
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Gérez tous les dossiers de vos clients au même endroit.
                </p>
              </div>
            </div>

            {savingId && (
              <div className="mt-2 text-xs font-medium text-blue-600">
                Sauvegarde en cours…
              </div>
            )}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="📂"
            title="À faire"
            value={counts.todo}
            active={tab === "todo"}
            onClick={() => setTab("todo")}
          />

          <StatCard
            icon="⏱️"
            title="En attente client"
            value={counts.waiting}
            active={tab === "waiting"}
            onClick={() => setTab("waiting")}
          />

          <StatCard
            icon="✓"
            title="Terminé"
            value={counts.done}
            active={tab === "done"}
            onClick={() => setTab("done")}
          />

          <StatCard
            icon="👥"
            title="Total dossiers"
            value={counts.all}
            active={tab === "all"}
            onClick={() => setTab("all")}
          />
        </div>

        {/* TABS + SORT */}
        <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Tous", counts.all],
              ["todo", "À faire", counts.todo],
              ["waiting", "En attente client", counts.waiting],
              ["done", "Terminé", counts.done],
            ].map(([key, label, count]) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setTab(key as TabKey)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as SortKey)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="created_desc">
              Tri : Création (récent)
            </option>
            <option value="created_asc">
              Tri : Création (ancien)
            </option>
            <option value="updated_desc">
              Tri : Dernière maj
            </option>
            <option value="cq_asc">
              Tri : Nom / CQ (A→Z)
            </option>
          </select>
        </div>

        {/* SEARCH */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                🔎
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom, courriel, téléphone, CQ, année…"
                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              ↻ Réinitialiser
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(210px,1.3fr)_minmax(190px,1fr)_120px_90px_130px_150px_210px] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
            <div>Client</div>
            <div>Contact</div>
            <div>Dossier</div>
            <div>Année</div>
            <div>Type</div>
            <div>Statut</div>
            <div className="text-right">Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 text-6xl">📂</div>

              <div className="text-lg font-bold text-slate-800">
                Aucun dossier
              </div>

              <div className="mt-1 max-w-md text-sm text-slate-500">
                {query
                  ? "Aucun dossier ne correspond à votre recherche."
                  : tab === "all"
                  ? "Aucun dossier n'est disponible."
                  : "Aucun dossier dans cette catégorie."}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const pay: PaymentStatus =
                  row.payment_status ?? "unpaid";

                const docsCount = safeInt(
                  row.docs_count,
                  0
                );

                return (
                  <li
                    key={row.formulaire_id}
                    className="px-5 py-5 transition hover:bg-slate-50/70"
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(210px,1.3fr)_minmax(190px,1fr)_120px_90px_130px_150px_210px] xl:items-center xl:gap-3">
                      {/* CLIENT */}
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">
                          {row.client_name ||
                            "Client sans nom"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          Créé le {formatDate(row.created_at)}
                        </div>
                      </div>

                      {/* CONTACT */}
                      <div className="min-w-0 text-sm">
                        {row.client_email && (
                          <div className="truncate text-slate-700">
                            {row.client_email}
                          </div>
                        )}

                        {row.client_phone && (
                          <div className="truncate text-slate-500">
                            {row.client_phone}
                          </div>
                        )}

                        {!row.client_email &&
                          !row.client_phone && (
                            <span className="text-slate-400">
                              —
                            </span>
                          )}
                      </div>

                      {/* DOSSIER */}
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {row.cq_id ?? "—"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {docsCount} doc
                          {docsCount !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* YEAR */}
                      <div className="text-sm font-semibold text-slate-700">
                        {row.tax_year ?? "—"}
                      </div>

                      {/* TYPE */}
                      <div>
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {row.form_type ?? "—"}
                        </span>

                        <div className="mt-2 flex flex-wrap gap-1">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                              row.form_filled
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            {row.form_filled
                              ? "Formulaire OK"
                              : "Formulaire vide"}
                          </span>

                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${PAY_BADGE_CLASS[pay]}`}
                          >
                            {PAY_LABEL[pay]}
                          </span>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div>
                        <span
                          className={`mb-2 inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${BADGE_CLASS[row.status]}`}
                        >
                          {LABEL[row.status]}
                        </span>

                        <select
                          value={row.status}
                          onChange={(e) =>
                            updateStatus(
                              row.formulaire_id,
                              e.target
                                .value as DossierStatus
                            )
                          }
                          disabled={
                            savingId ===
                            row.formulaire_id
                          }
                          className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        >
                          <option value="recu">
                            Reçu
                          </option>
                          <option value="en_cours">
                            En cours
                          </option>
                          <option value="attente_client">
                            En attente client
                          </option>
                          <option value="termine">
                            Terminé
                          </option>
                        </select>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2 xl:justify-end">
                        <Link
                          href={`/admin/dossiers/formulaire?fid=${encodeURIComponent(
                            row.formulaire_id
                          )}&type=${encodeURIComponent(
                            row.form_type ?? "t1"
                          )}&lang=fr`}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          📋 Formulaire
                        </Link>

                        <Link
                          href={`/admin/dossiers/docs?fid=${encodeURIComponent(
                            row.formulaire_id
                          )}`}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          📄 Docs
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-3 text-right text-xs text-slate-400">
          {filtered.length} dossier
          {filtered.length !== 1 ? "s" : ""} affiché
          {filtered.length !== 1 ? "s" : ""}
        </div>
      </main>
    </div>
  );
}
