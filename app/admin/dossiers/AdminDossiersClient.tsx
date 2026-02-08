"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export type DossierStatus = "recu" | "en_cours" | "attente_client" | "termine";

export type AdminDossierRow = {
  formulaire_id: string;
  created_at: string | null;
  status: DossierStatus;
  updated_at: string | null;
};

const LABEL: Record<DossierStatus, string> = {
  recu: "Reçu",
  en_cours: "En cours",
  attente_client: "En attente client",
  termine: "Terminé",
};

// badges (texte + couleur)
const BADGE_CLASS: Record<DossierStatus, string> = {
  recu: "bg-yellow-100 text-yellow-800 border-yellow-200",
  en_cours: "bg-blue-100 text-blue-800 border-blue-200",
  attente_client: "bg-orange-100 text-orange-800 border-orange-200",
  termine: "bg-green-100 text-green-800 border-green-200",
};

type TabKey = "todo" | "waiting" | "done";

function tabTitle(key: TabKey) {
  if (key === "todo") return "À faire";
  if (key === "waiting") return "En attente client";
  return "Terminé";
}

function rowTab(status: DossierStatus): TabKey {
  if (status === "attente_client") return "waiting";
  if (status === "termine") return "done";
  return "todo"; // recu + en_cours
}

export default function AdminDossiersClient({ initialRows }: { initialRows: AdminDossierRow[] }) {
  const [rows, setRows] = useState<AdminDossierRow[]>(initialRows);
  const [tab, setTab] = useState<TabKey>("todo"); // ✅ par défaut : À faire
  const [savingId, setSavingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { todo: 0, waiting: 0, done: 0 };
    for (const r of rows) c[rowTab(r.status)]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) => rowTab(r.status) === tab), [rows, tab]);

  async function updateStatus(formulaire_id: string, status: DossierStatus) {
    const prev = rows;
    // UI optimiste
    setRows((p) => p.map((r) => (r.formulaire_id === formulaire_id ? { ...r, status } : r)));

    setSavingId(formulaire_id);
    const { error } = await supabase
      .from("dossier_statuses")
      .upsert(
        {
          formulaire_id,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "formulaire_id" }
      );
    setSavingId(null);

    if (error) {
      setRows(prev);
      alert("Erreur sauvegarde statut: " + error.message);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin – Dossiers</h1>
        <div className="text-sm opacity-70">{savingId ? "Sauvegarde..." : ""}</div>
      </div>

      {/* Onglets + compteurs */}
      <div className="flex gap-2 mb-4">
        {(["todo", "waiting", "done"] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 rounded border ${
              tab === k ? "bg-black text-white" : "bg-white"
            }`}
          >
            {tabTitle(k)} ({counts[k]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="opacity-70">Aucun dossier.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.formulaire_id} className="border rounded p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate">Dossier</div>

                  <div className="text-sm opacity-70 break-all">ID: {r.formulaire_id}</div>

                  {r.created_at && (
                    <div className="text-sm opacity-70">
                      Créé: {new Date(r.created_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded border text-sm ${BADGE_CLASS[r.status]}`}>
                    {LABEL[r.status]}
                  </span>

                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.formulaire_id, e.target.value as DossierStatus)}
                    className="border rounded px-2 py-1"
                    disabled={savingId === r.formulaire_id}
                  >
                    <option value="recu">Reçu</option>
                    <option value="en_cours">En cours</option>
                    <option value="attente_client">En attente client</option>
                    <option value="termine">Terminé</option>
                  </select>

                  <Link
                    href={`/admin/dossiers/${encodeURIComponent(r.formulaire_id)}`}
                    className="text-blue-600 hover:underline"
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
  );
}
