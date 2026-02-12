"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type DocRow = {
  id: string;
  formulaire_id: string;
  original_name: string;
  created_at: string;
};

type FormRow = {
  id: string;
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
    async function loadAll() {
      setError(null);

      if (!fid) {
        setLoading(false);
        return;
      }

      // 1) Charger le dossier (formulaire)
      const { data: f, error: fErr } = await supabase
        .from("formulaires_fiscaux")
        .select("id, form_type, data, status, tax_year, lang")
        .eq("id", fid)
        .maybeSingle<FormRow>();

      if (fErr) {
        setError(fErr.message);
        setLoading(false);
        return;
      }

      setForm(f ?? null);

      // 2) Charger les documents
      const { data: d, error: dErr } = await supabase
        .from("formulaire_documents")
        .select("id, formulaire_id, original_name, created_at")
        .eq("formulaire_id", fid)
        .order("created_at", { ascending: false });

      if (dErr) {
        setError(dErr.message);
      } else {
        setDocs(d ?? []);
      }

      setLoading(false);
    }

    loadAll();
  }, [fid]);

  const openExisting = () => {
    if (!form?.form_type || !fid) return;
    const base = routeForFormType(form.form_type);
    router.push(`${base}?lang=${lang}&fid=${fid}`);
  };

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <h1>Présentiel — Admin</h1>
          <p className="ff-muted">Utilisateur : {userId}</p>
          {fid && (
            <p className="ff-muted">
              Dossier (fid) : <strong>{fid}</strong>
            </p>
          )}
        </header>

        {/* === Actions === */}
        <div className="ff-card">
          <h2>Démarrer un dossier</h2>

          <div className="ff-actions">
            <button
              className="ff-btn"
              onClick={() => router.push(`/formulaire-fiscal-presentiel-ta?lang=${lang}`)}
            >
              Travailleur autonome
            </button>

            <button
              className="ff-btn"
              onClick={() => router.push(`/formulaire-fiscal-presentiel-t1?lang=${lang}`)}
            >
              Déclaration T1
            </button>

            <button
              className="ff-btn"
              onClick={() => router.push(`/formulaire-fiscal-presentiel-t2?lang=${lang}`)}
            >
              Société (T2)
            </button>
          </div>

          {/* ✅ Ouvrir le dossier existant */}
          {fid && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ marginBottom: 8 }}>Dossier existant</h3>

              {form ? (
                <>
                  <p className="ff-muted" style={{ marginBottom: 10 }}>
                    Type: <strong>{String(form.form_type)}</strong> — Statut:{" "}
                    <strong>{String(form.status ?? "")}</strong>
                  </p>

                  <button className="ff-btn" onClick={openExisting}>
                    Ouvrir le formulaire du dossier
                  </button>
                </>
              ) : (
                !loading && (
                  <p className="ff-muted">Aucun dossier trouvé pour ce fid.</p>
                )
              )}
            </div>
          )}
        </div>

        {/* === Documents === */}
        <div className="ff-card">
          <h2>Documents au dossier</h2>

          {loading && <p>Chargement…</p>}
          {error && <p className="ff-error">{error}</p>}

          {!loading && docs.length === 0 && (
            <p className="ff-muted">Aucun document pour ce dossier.</p>
          )}

          {docs.length > 0 && (
            <ul className="ff-doclist">
              {docs.map((d) => (
                <li key={d.id}>
                  <strong>{d.original_name}</strong>
                  <br />
                  <small>
                    Ajouté le {new Date(d.created_at).toLocaleDateString("fr-CA")}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
