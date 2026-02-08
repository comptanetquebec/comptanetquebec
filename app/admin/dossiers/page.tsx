import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  // auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return <div className="p-6">Non connecté</div>;

  // admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) return <div className="p-6">Accès refusé</div>;

  // dossiers (distinct formulaire_id)
  const { data } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id, created_at")
    .order("created_at", { ascending: false });

  const seen = new Set<string>();
  const dossiers =
    data
      ?.map((d) => d.formulaire_id as string)
      .filter((id) => (seen.has(id) ? false : (seen.add(id), true))) ?? [];

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Admin – Dossiers</h1>

      {dossiers.length === 0 && <p>Aucun dossier.</p>}

      <ul className="space-y-2">
        {dossiers.map((id) => (
          <li key={id} className="border rounded p-3">
            <Link
              href={`/admin/dossiers/${id}`}
              className="text-blue-600 underline"
            >
              Ouvrir dossier {id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
