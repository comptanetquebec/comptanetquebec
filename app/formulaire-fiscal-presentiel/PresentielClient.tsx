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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 charger les documents EXACTEMENT comme dans le web
  useEffect(() => {
    async function loadDocs() {
      if (!fid) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("formulaire_documents")
        .select("id, formulaire_id, original_name, created_at")
        .eq("formulaire_id", fid)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setDocs(data ?? []);
      }

      setLoading(false);
    }

    loadDocs();
  }, [fid]);

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <h1>Présentiel — Admin</h1>
          <p className="ff-muted">
            Utilisateur : {userId}
          </p>
        </header>

        {/* === Actions === */}
        <div className="ff-card">
          <h2>Démarrer un dossier</h2>

          <div className="ff-actions">
            <button
              className="ff-btn"
              onClick={() =>
                router.push(`/formulaire-fiscal-presentiel-ta?lang=${lang}`)
              }
            >
              Travailleur autonome
            </button>

            <button
              className="ff-btn"
              onClick={() =>
                router.push(`/formulaire-fiscal-presentiel-t1?lang=${lang}`)
              }
            >
              Déclaration T1
            </button>

            <button
              className="ff-btn"
              onClick={() =>
                router.push(`/formulaire-fiscal-presentiel-t2?lang=${lang}`)
              }
            >
              Société (T2)
            </button>
          </div>
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
                    Ajouté le{" "}
                    {new Date(d.created_at).toLocaleDateString("fr-CA")}
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
