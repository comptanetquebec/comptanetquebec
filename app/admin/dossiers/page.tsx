// comptanetquebec/app/admin/dossiers/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type DocRow = {
  formulaire_id: string | null;
  created_at: string | null;
};

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  // ✅ Auth
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return (
      <pre className="p-6 whitespace-pre-wrap">
        auth.getUser error: {authError.message}
      </pre>
    );
  }
  if (!auth?.user) return <div className="p-6">Non connecté</div>;

  // ✅ Admin check
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return (
      <pre className="p-6 whitespace-pre-wrap">
        profiles select error: {profileError.message}
      </pre>
    );
  }
  if (!profile?.is_admin) return <div className="p-6">Accès refusé</div>;

  // ✅ Docs
  const { data: docs, error: docsError } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id, created_at")
    .order("created_at", { ascending: false });

  if (docsError) {
    return (
      <pre className="p-6 whitespace-pre-wrap">
        formulaire_documents select error: {docsError.message}
      </pre>
    );
  }

  // ✅ Dossiers uniques (première occurrence = plus récent grâce au order)
  const seen = new Set<string>();
  const dossiers =
    (docs as DocRow[] | null)
      ?.map((d) => (d.formulaire_id ?? "").trim())
      .filter(Boolean)
      .filter((id) => (seen.has(id) ? false : (seen.add(id), true))) ?? [];

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin – Dossiers</h1>
        <Link href="/admin" className="text-blue-600 underline">
          Retour admin
        </Link>
      </div>

      {dossiers.length === 0 ? (
        <p>Aucun dossier.</p>
      ) : (
        <ul className="space-y-2">
          {dossiers.map((id) => (
            <li key={id} className="border rounded p-3">
              <Link
                href={`/admin/dossiers/${encodeURIComponent(id)}`}
                className="text-blue-600 underline"
              >
                Ouvrir dossier {id}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
