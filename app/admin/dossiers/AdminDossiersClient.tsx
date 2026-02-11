"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export type DossierStatus = "recu" | "en_cours" | "attente_client" | "termine";
export type PaymentStatus = "draft" | "ready_for_payment" | "paid";

export type AdminDossierRow = {
  formulaire_id: string;
  cq_id: string | null;
  payment_status: PaymentStatus | null;

  created_at: string | null;

  status: DossierStatus;
  updated_at: string | null;

  form_type?: string | null;
  tax_year?: number | null;

  // ✅ NOUVEAU
  form_filled: boolean;
  docs_count: number;
};

type TabKey = "todo" | "waiting" | "done";
type SortKey = "created_desc" | "created_asc" | "updated_desc" | "cq_asc";

const LABEL: Record<DossierStatus, string> = {
  recu: "Reçu",
  en_cours: "En cours",
  attente_client: "En attente client",
  termine: "Terminé",
};

const BADGE_CLASS: Record<DossierStatus, string> = {
  recu: "bg-yellow-100 text-yellow-800 border-yellow-200",
  en_cours: "bg-blue-100 text-blue-800 border-blue-200",
  attente_client: "bg-orange-100 text-orange-800 border-orange-200",
  termine: "bg-green-100 text-green-800 border-green-200",
};

const PAY_LABEL: Record<PaymentStatus, string> = {
  draft: "Draft",
  ready_for_payment: "Prêt paiement",
  paid: "Payé",
};

const PAY_BADGE_CLASS: Record<PaymentStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  ready_for_payment: "bg-purple-100 text-purple-800 border-purple-200",
  paid: "bg-green-100 text-green-800 border-green-200",
};

function tabTitle(key: TabKey) {
  if (key === "todo") return "À faire";
  if (key === "waiting") return "En attente client";
  return "Terminé";
}

function rowTab(status: DossierStatus): TabKey {
  if (status === "attente_client") return "waiting";
  if (status === "termine") return "done";
  return "todo";
}

function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(iso: string | null) {
  const d = toDate(iso);
  if (!d) return null;
  return d.toLocaleString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSearch(s: string) {
  return s.trim().toLowerCase();
}

function rowSearchText(r: AdminDossierRow) {
  const parts = [
    r.cq_id ?? "",
    r.formulaire_id ?? "",
    r.form_type ?? "",
    r.tax_year ? String(r.tax_year) : "",
    r.payment_status ?? "",
    r.status ?? "",
    r.form_filled ? "formulaire_rempli" : "formulaire_vide",
    String(r.docs_count ?? 0),
  ];
  return normalizeSearch(parts.join(" "));
}

export default function AdminDossiersClient({ initialRows }: { initialRows: AdminDossierRow[] }) {
  const [rows, setRows] = useState<AdminDossierRow[]>(initialRows);
  const [tab, setTab] = useState<TabKey>("todo");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("created_desc");

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { todo: 0, waiting: 0, done: 0 };
    for (const r of rows) c[rowTab(r.status)]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    const base = rows.filter((r) => rowTab(r.status) === tab);

    const searched = q.length === 0 ? base : base.filter((r) => rowSearchText(r).includes(q));

    const sorted = [...searched].sort((a, b) => {
      const ac = toDate(a.created_at)?.getTime() ?? 0;
      const bc = toDate(b.created_at)?.getTime() ?? 0;

      const au = toDate(a.updated_at)?.getTime() ?? 0;
      const bu = toDate(b.updated_at)?.getTime() ?? 0;

      if (sort === "created_desc") return bc - ac;
      if (sort === "created_asc") return ac - bc;
      if (sort === "updated_desc") return bu - au;

      const as = (a.cq_id ?? "").toLowerCase();
      const bs = (b.cq_id ?? "").toLowerCase();
      return as.localeCompare(bs);
    });

    return sorted;
  }, [rows, tab, query, sort]);

  async function updateStatus(formulaire_id: string, status: DossierStatus) {
    const prev = rows;

    setRows((p) => p.map((r) => (r.formulaire_id === formulaire_id ? { ...r, status } : r)));
    setSavingId(formulaire_id);

    const { error } = await supabase
      .from("dossier_statuses")
      .upsert({ formulaire_id, status, updated_at: new Date().toISOString() }, { onConflict: "formulaire_id" });

    setSavingId(null);

    if (error) {
      setRows(prev);
      alert("Erreur sauvegarde statut: " + error.message);
    }
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin – Dossiers</h1>
          <div className="text-sm text-gray-500">{savingId ? "Sauvegarde en cours…" : " "}</div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/espace-client" className="text-sm text-blue-700 hover:underline">
            Espace client
          </Link>
          <Link href="/admin" className="text-sm text-blue-700 hover:underline">
            Admin
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">À faire</div>
          <div className="text-2xl font-semibold">{counts.todo}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">En attente client</div>
          <div className="text-2xl font-semibold">{counts.waiting}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Terminé</div>
          <div className="text-2xl font-semibold">{counts.done}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["todo", "waiting", "done"] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 rounded border text-sm ${tab === k ? "bg-black text-white" : "bg-white"}`}
          >
            {tabTitle(k)} ({counts[k]})
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (CQ, ID, type, année)…"
          className="border rounded px-3 py-2 text-sm w-full sm:max-w-md"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="border rounded px-3 py-2 text-sm w-full sm:w-auto"
        >
          <option value="created_desc">Tri: Création (récent)</option>
          <option value="created_asc">Tri: Création (ancien)</option>
          <option value="updated_desc">Tri: Dernière maj (récent)</option>
          <option value="cq_asc">Tri: CQ (A→Z)</option>
        </select>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="hidden md:grid grid-cols-[1fr_420px_120px] gap-4 px-4 py-3 border-b text-sm text-gray-500">
          <div>Dossier</div>
          <div>Statuts</div>
          <div className="text-right">Action</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-gray-500 min-h-[260px] flex items-center">Aucun dossier.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((r) => {
              const created = formatDate(r.created_at);
              const updated = formatDate(r.updated_at);
              const mainRight = created ? ` • ${created}` : "";

              const mainLeftNode = r.cq_id ? <span>{r.cq_id}</span> : <span className="text-gray-400">CQ: (en attente)</span>;

              const formBadgeClass = r.form_filled
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-gray-100 text-gray-700 border-gray-200";

              return (
                <li key={r.formulaire_id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_420px_120px] gap-4 items-start">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {mainLeftNode}
                        <span className="text-gray-500 font-normal">{mainRight}</span>
                      </div>

                      <div className="text-sm text-gray-500 truncate">ID: {r.formulaire_id}</div>

                      {(r.form_type || r.tax_year) && (
                        <div className="text-sm text-gray-500">
                          {r.form_type ? `Type: ${r.form_type}` : null}
                          {r.form_type && r.tax_year ? " • " : null}
                          {r.tax_year ? `Année: ${r.tax_year}` : null}
                        </div>
                      )}

                      {updated && <div className="text-sm text-gray-500">Maj: {updated}</div>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {r.payment_status && (
                        <span className={`px-2 py-1 rounded border text-sm ${PAY_BADGE_CLASS[r.payment_status]}`} title="Statut paiement">
                          {PAY_LABEL[r.payment_status]}
                        </span>
                      )}

                      <span className={`px-2 py-1 rounded border text-sm ${BADGE_CLASS[r.status]}`} title="Statut de travail">
                        {LABEL[r.status]}
                      </span>

                      {/* ✅ Formulaire rempli / non */}
                      <span className={`px-2 py-1 rounded border text-sm ${formBadgeClass}`} title="Formulaire rempli">
                        {r.form_filled ? "Formulaire: OK" : "Formulaire: vide"}
                      </span>

                      {/* ✅ Docs count */}
                      <span className="px-2 py-1 rounded border text-sm bg-slate-100 text-slate-700 border-slate-200" title="Documents déposés">
                        Docs: {r.docs_count}
                      </span>

                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.formulaire_id, e.target.value as DossierStatus)}
                        className="border rounded px-2 py-1 text-sm"
                        disabled={savingId === r.formulaire_id}
                      >
                        <option value="recu">Reçu</option>
                        <option value="en_cours">En cours</option>
                        <option value="attente_client">En attente client</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </div>

                    <div className="md:text-right">
                      <Link href={`/admin/dossiers/${encodeURIComponent(r.formulaire_id)}`} className="text-blue-700 hover:underline text-sm">
                        Ouvrir
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
