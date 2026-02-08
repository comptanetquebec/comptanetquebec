import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export default async function AdminDossiersList() {
  const supabase = supabaseServer();

  // check admin
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return <div style={{ padding: 24 }}>Non connecté.</div>;

  const { data: prof } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!prof?.is_admin) return <div style={{ padding: 24 }}>Accès refusé.</div>;

  // liste des dossiers (formulaire_id) qui ont au moins 1 document
  const { data, error } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id, created_at")
    .order("created_at", { ascending: false });

  if (error) return <div style={{ padding: 24 }}>Erreur: {error.message}</div>;

  // dédoublonner (on garde l’ordre)
  const seen = new Set<string>();
  const dossiers = (data ?? [])
    .map((r) => r.formulaire_id as string)
    .filter((id) => (seen.has(id) ? false : (seen.add(id), true)));

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin — Dossiers</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>Dossiers avec documents: {dossiers.length}</p>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        {dossiers.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {dossiers.map((id) => (
              <li key={id} style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                <Link href={`/admin/dossiers/${id}`} style={{ textDecoration: "underline" }}>
                  Ouvrir dossier {id}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ padding: 16 }}>Aucun dossier trouvé.</div>
        )}
      </div>
    </div>
  );
}
