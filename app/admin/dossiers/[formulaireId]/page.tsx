import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import OpenDocButton from "./OpenDocButton";

type DocRow = {
  id: string;
  original_name: string;
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

function prettySize(n: number | null) {
  if (!n || n <= 0) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export default async function Page({ params }: { params: { formulaireId: string } }) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return <div style={{ padding: 24 }}>Non connecté.</div>;

  const { data: prof } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!prof?.is_admin) return <div style={{ padding: 24 }}>Accès refusé.</div>;

  const { data: docs, error } = await supabase
    .from("formulaire_documents")
    .select("id, original_name, mime_type, size_bytes, created_at")
    .eq("formulaire_id", params.formulaireId)
    .order("created_at", { ascending: false });

  if (error) return <div style={{ padding: 24 }}>Erreur: {error.message}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Documents — {params.formulaireId}</h1>

      <div style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 12 }}>
        {docs?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Nom</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Type</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Taille</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Date</th>
                <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d: DocRow) => (
                <tr key={d.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{d.original_name}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{d.mime_type ?? "—"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{prettySize(d.size_bytes)}</td>
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
          <div style={{ padding: 16 }}>Aucun document.</div>
        )}
      </div>
    </div>
  );
}
