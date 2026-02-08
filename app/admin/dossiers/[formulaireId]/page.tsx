import { supabaseServer } from "@/lib/supabaseServer";
import OpenDocButton from "./OpenDocButton";

export default async function AdminDossierPage({
  params,
}: {
  params: { formulaireId: string };
}) {
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

  // docs
  const { data: docs } = await supabase
    .from("formulaire_documents")
    .select("id, original_name, mime_type, size_bytes, created_at")
    .eq("formulaire_id", params.formulaireId)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">
        Dossier {params.formulaireId}
      </h1>

      {!docs?.length && <p>Aucun document.</p>}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Nom</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Date</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {docs?.map((d) => (
            <tr key={d.id} className="border-b">
              <td className="p-2">{d.original_name}</td>
              <td className="p-2">{d.mime_type ?? "-"}</td>
              <td className="p-2">
                {new Date(d.created_at).toLocaleString("fr-CA")}
              </td>
              <td className="p-2">
                <OpenDocButton docId={d.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
