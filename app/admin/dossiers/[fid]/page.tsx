// app/admin/dossiers/[fid]/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

type ProfileRow = { is_admin: boolean | null };
type FormRow = { id: string; form_type: string | null };

function routeForFormPresentiel(form_type: string | null) {
  const t = (form_type ?? "").toLowerCase();

  if (t === "t1" || t.includes("t1")) return "/formulaire-fiscal-presentiel-t1";
  if (t === "ta" || t.includes("autonome") || t.includes("ta")) return "/formulaire-fiscal-presentiel-ta";
  if (t === "t2" || t.includes("t2")) return "/formulaire-fiscal-presentiel-t2";

  return "/formulaire-fiscal-presentiel-t1";
}

export default async function AdminOpenDossierPage({
  params,
}: {
  params: { fid: string };
}) {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/espace-client?next=/admin/dossiers");

  // Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.is_admin) return <div className="p-6">Accès refusé</div>;

  // Load dossier (✅ colonnes qui existent)
  const { data: form, error } = await supabase
    .from("formulaires_fiscaux")
    .select("id, form_type")
    .eq("id", params.fid)
    .maybeSingle<FormRow>();

  if (error) return <div className="p-6">Erreur: {error.message}</div>;
  if (!form) return <div className="p-6">Dossier introuvable.</div>;

  const base = routeForFormPresentiel(form.form_type);

  // ✅ langue fixée à fr pour l’instant (simple, stable)
  redirect(`${base}?fid=${encodeURIComponent(form.id)}&lang=fr`);
}
