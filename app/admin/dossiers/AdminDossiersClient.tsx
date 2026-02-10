"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type Flow = "t1" | "ta" | "t2";
type Lang = "fr" | "en" | "es";

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

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function isValidEmail(v: string) {
  const x = normalizeEmail(v);
  // validation simple (suffisante pour éviter les erreurs évidentes)
  return x.length >= 6 && x.includes("@") && x.includes(".");
}

/* ===========================
   Component
=========================== */

export default function AdminDossiersClient({
  initialRows,
}: {
  initialRows: AdminDossierRow[];
}) {
  const router = useRouter();

  const [rows, setRows] = useState<AdminDossierRow[]>(initialRows);
  const [tab, setTab] = useState<TabKey>("todo");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Création dossier (présentiel)
  const [email, setEmail] = useState("");
  const [flow, setFlow] = useState<Flow>("t1");
  const [lang, setLang] = useState<Lang>("fr");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  async function createDossierPresentiel() {
    setCreateError(null);

    const e = normalizeEmail(email);
    if (!isValidEmail(e)) {
      setCreateError("Email invalide.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, flow, lang }),
      });

      const json: unknown = await res.json().catch(() => ({}));
      const data = json as { ok?: boolean; fid?: string; error?: string };

      if (!res.ok || !data?.fid) {
        throw new Error(data?.error || "Erreur création dossier");
      }

      const now = new Date().toISOString();
      const newRow: AdminDossierRow = {
        formulaire_id: data.fid,
        created_at: now,
        updated_at: now,
        status: "recu",
      };

      // Ajoute en haut + bascule sur onglet À faire
      setRows((p) => [newRow, ...p]);
      setTab("todo");

      // Option: ouvrir directement le dossier créé
      // (tu peux commenter cette ligne si tu préfères rester sur la liste)
      router.push(`/admin/dossiers/${encodeURIComponent(data.fid)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setCreateError(msg);
    } finally {
      setCreating(false);
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

      {/* ✅ Créer dossier client (présentiel) */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-semibold">Créer un dossier client (présentiel)</div>
            <div className="text-sm text-gray-500">
              Tu crées le dossier dans l’admin (pas de Stripe au départ).
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_140px_140px_160px] gap-2 items-center">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Email du client"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            inputMode="email"
          />

          <select
            className="border rounded px-2 py-2 text-sm"
            value={flow}
            onChange={(e) => setFlow(e.currentTarget.value as Flow)}
          >
            <option value="t1">T1</option>
            <option value="ta">TA</option>
            <option value="t2">T2</option>
          </select>

          <select
            className="border rounded px-2 py-2 text-sm"
            value={lang}
            onChange={(e) => setLang(e.currentTarget.value as Lang)}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>

          <button
            onClick={createDossierPresentiel}
            disabled={creating || !isValidEmail(email)}
            className={`rounded px-3 py-2 text-sm border ${
              creating ? "opacity-60" : "hover:bg-gray-50"
            }`}
          >
            {creating ? "Création…" : "Créer le dossier"}
          </button>
        </div>

        {createError ? (
          <div className="mt-2 text-sm" style={{ color: "crimson" }}>
            {createError}
          </div>
        ) : null}
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
                        updateStatus(r.formulaire_id, e.target.value as DossierStatus)
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
                      href={`/admin/dossiers/${encodeURIComponent(r.formulaire_id)}`}
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
