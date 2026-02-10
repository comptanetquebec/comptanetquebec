"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* ===========================
   Types
=========================== */

export type DossierStatus = "recu" | "en_cours" | "attente_client" | "termine";

export type AdminDossierRow = {
  formulaire_id: string;
  created_at: string | null;
  status: DossierStatus;
  updated_at: string | null;
};

type TabKey = "todo" | "waiting" | "done";

/* ===========================
   UI helpers
=========================== */

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

/* ===========================
   Component
=========================== */

export default function AdminDossiersClient({
  initialRows,
}: {
  initialRows: AdminDossierRow[];
}) {
  const [rows, setRows] = useState<AdminDossierRow[]>(initialRows);
  const [tab, setTab] = useState<TabKey>("todo");
  const [savingId, setSavingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { todo: 0, waiting: 0, done: 0 };
    for (const r of rows) c[rowTab(r.status)]++;
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((r) => rowTab(r.status) === tab),
    [rows, tab]
  );

  async function updateStatus(formulaire_id: string, status: DossierStatus) {
    const prev = rows;

    // Optimistic UI
    setRows((p) =>
      p.map((r) => (r.formulaire_id === formulaire_id ? { ...r, status } : r))
    );

    setSavingId(formulaire_id);

    const { error } = await supabase
      .from("dossier_statuses")
      .upsert(
        { formulaire_id, status, updated_at: new Date().toISOString() },
        { onConflict: "formulaire_id" }
      );

    setSavingId(null);

    if (error) {
      setRows(prev);
      alert("Erreur sauvegarde statut: " + error.message);
    }
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin – Dossiers</h1>
          <div className="text-sm text-gray-500">
            {savingId ? "Sauvegarde en cours…" : " "}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/espace-client"
            className="text-sm text-blue-700 hover:underline"
          >
            Espace client
          </Link>
          <Link href="/admin" className="text-sm text-blue-700 hover:underline">
            Admin
          </Link>
        </div>
      </div>

      {/* Cartes stats */}
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

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["todo", "waiting", "done"] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 rounded border text-sm ${
              tab === k ? "bg-black text-white" : "bg-white"
            }`}
          >
            {tabTitle(k)} ({counts[k]})
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="rounded-lg border bg-white">
        <div className="hidden md:grid grid-cols-[1fr_220px_120px] gap-4 px-4 py-3 border-b text-sm text-gray-500">
          <div>Dossier</div>
          <div>Statut</div>
          <div className="text-right">Action</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-gray-500 min-h-[260px] flex items-center">
            Aucun dossier.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((r) => (
              <li key={r.formulaire_id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_120px] gap-4 items-start">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      ID: {r.formulaire_id}
                    </div>

                    {r.created_at && (
                      <div className="text-sm text-gray-500">
                        Créé: {new Date(r.created_at).toLocaleString()}
                      </div>
                    )}

                    {r.updated_at && (
                      <div className="text-sm text-gray-500">
                        Maj: {new Date(r.updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded border text-sm ${BADGE_CLASS[r.status]}`}
                    >
                      {LABEL[r.status]}
                    </span>

                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateStatus(
                          r.formulaire_id,
                          e.target.value as DossierStatus
                        )
                      }
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
                    <Link
                      href={`/admin/dossiers/${encodeURIComponent(
                        r.formulaire_id
                      )}`}
                      className="text-blue-700 hover:underline text-sm"
                    >
                      Ouvrir
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
