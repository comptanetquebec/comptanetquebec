import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type DocRow = {
  id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

async function assertAdmin(supabase: ReturnType<typeof supabaseServer>) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return false;

  const { data: prof } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  return !!prof?.is_admin;
}

function prettySize(n: number | null) {
  if (!n || n <= 0) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export default async function AdminDossierPage({
  params,
}: {
  params: { formulaireId: string };
}) {
  const supabase = supabaseServer();

  const ok = await assertAdmin(supabase);
  if (!ok) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Admin</h1>
        <p>Accès refusé.</p>
        <Link href="/">Retour</Link>
      </div>
    );
  }

  const { data: docs, error } = await supabase
    .from("formulaire_documents")
    .select("id, original_name, storage_path, mime_type, size_bytes, created_at")
    .eq("formulaire_id", params.formulaireId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dossier {params.formulaireId}</h1>
        <p>Erreur: {error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        Dossier: {params.formulaireId}
      </h1>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Documents reçus: {docs?.length ?? 0}
      </p>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        {(docs as DocRow[] | null)?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Nom</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Type</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Taille</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Date</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(docs as DocRow[]).map((d) => (
                <tr key={d.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {d.original_name}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {d.mime_type ?? "—"}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {prettySize(d.size_bytes)}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {new Date(d.created_at).toLocaleString("fr-CA")}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    <OpenDocButton docId={d.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 16 }}>Aucun document pour ce dossier.</div>
        )}
      </div>
    </div>
  );
}

/** Petit bouton client-side qui appelle l’API et ouvre le lien signé */
function OpenDocButton({ docId }: { docId: string }) {
  return (
    <button
      onClick={async () => {
        const res = await fetch("/api/admin/doc-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId }),
        });
        const json = await res.json();
        if (!res.ok) {
          alert(json?.error || "Erreur");
          return;
        }
        window.open(json.signedUrl, "_blank", "noopener,noreferrer");
      }}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #ddd",
        cursor: "pointer",
        background: "white",
      }}
    >
      Ouvrir
    </button>
  );
}
