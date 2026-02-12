"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type DocRow = {
  id: string;
  formulaire_id: string;
  user_id: string | null;
  original_name: string;
  created_at: string;
};

type FormRow = {
  id: string;
  user_id: string | null;
  form_type: "T1" | "autonome" | "T2" | string | null;
  data: unknown;
  status: string | null;
  tax_year: number | null;
  lang: string | null;
};

function routeForFormType(ft: string | null | undefined) {
  if (ft === "autonome") return "/formulaire-fiscal-presentiel-ta";
  if (ft === "T2") return "/formulaire-fiscal-presentiel-t2";
  return "/formulaire-fiscal-presentiel-t1"; // default T1
}

function encodeQS(v: string) {
  return encodeURIComponent(v ?? "");
}

export default function PresentielClient({
  userId,
  lang,
  fid,
}: {
  userId: string;
  lang: Lang;
  fid: string;
}) {
  const router = useRouter();

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [form, setForm] = useState<FormRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      setForm(null);
      setDocs([]);

      const cleanFid = (fid || "").trim();
      if (!cleanFid) {
        setLoading(false);
        return;
      }

      // 1) Charger le dossier (formulaire) — ✅ filtré par user_id
      const { data: f, error: fErr } = await supabase
        .from("formulaires_fiscaux")
        .select("id, user_id, form_type, data, status, tax_year, lang")
        .eq("id", cleanFid)
        .eq("user_id", userId)
        .maybeSingle<FormRow>();

      if (cancelled) return;

      if (fErr) {
        setError(fErr.message);
        setLoading(false);
        return;
      }

      setForm(f ?? null);

      // 2) Charger les documents — ✅ filtré par formulaire_id + user_id
      const { data: d, error: dErr } = await supabase
        .from("formulaire_documents")
        .select("id, formulaire_id, user_id, original_name, created_at")
        .eq("formulaire_id", cleanFid)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (dErr) {
        setError(dErr.message);
      } else {
        setDocs(d ?? []);
      }

      setLoading(false);
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [fid, userId]);

  const openExisting = () => {
    const cleanFid = (fid || "").trim();
    if (!form?.form_type || !cleanFid) return;

    const base = routeForFormType(form.form_type);
    router.push(`${base}?lang=${encodeQS(lang)}&fid=${encodeQS(cleanFid)}`);
  };

  const goStart = (path: string) => {
    router.push(`${path}?lang=${encodeQS(lang)}`);
  };

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <h1>Présentiel — Admin</h1>
          <p className="ff-muted">Utilisateur : {userId}</p>

          {(fid || "").trim() && (
            <p className="ff-muted">
              Dossier (fid) : <strong>{(fid || "").trim()}</strong>
            </p>
          )}
        </header>

        {/* === Actions === */}
        <div className="ff-card">
          <h2>Démarrer un dossier</h2>

          <div className="ff-actions">
            <button className="ff-btn" type="button" onClick={() => goStart("/formulaire-fiscal-presentiel-ta")}>
              Travailleur autonome
            </button>

            <button className="ff-btn" type="button" onClick={() => goStart("/formulaire-fiscal-presentiel-t1")}>
              Déclaration T1
            </button>

            <button className="ff-btn" type="button" onClick={() => goStart("/formulaire-fiscal-presentiel-t2")}>
              Société (T2)
            </button>
          </div>

          {/* ✅ Ouvrir le dossier existant */}
          {(fid || "").trim() && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ marginBottom: 8 }}>Dossier existant</h3>

              {loading ? (
                <p className="ff-muted">Chargement…</p>
              ) : form ? (
                <>
                  <p className="ff-muted" style={{ marginBottom: 10 }}>
                    Type: <strong>{String(form.form_type)}</strong> — Statut:{" "}
                    <strong>{String(form.status ?? "")}</strong>
                  </p>

                  <button className="ff-btn" type="button" onClick={openExisting}>
                    Ouvrir le formulaire du dossier
                  </button>
                </>
              ) : (
                <p className="ff-muted">Aucun dossier trouvé pour ce fid (ou accès refusé).</p>
              )}
            </div>
          )}
        </div>

        {/* === Documents === */}
        <div className="ff-card">
          <h2>Documents au dossier</h2>

          {error && <p className="ff-error">{error}</p>}
          {loading && <p>Chargement…</p>}

          {!loading && !error && docs.length === 0 && (
            <p className="ff-muted">Aucun document pour ce dossier.</p>
          )}

          {!loading && docs.length > 0 && (
            <ul className="ff-doclist">
              {docs.map((d) => (
                <li key={d.id}>
                  <strong>{d.original_name}</strong>
                  <br />
                  <small>Ajouté le {new Date(d.created_at).toLocaleDateString("fr-CA")}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
