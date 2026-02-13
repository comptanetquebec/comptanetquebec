// app/admin/dossiers/[fid]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

type ProfileRow = { is_admin: boolean | null };
type FormRow = { id: string; form_type: string | null };

function routeForFormPresentiel(form_type: string | null) {
  const t = (form_type ?? "").toLowerCase();

  if (t === "t1" || t.includes("t1")) return "/formulaire-fiscal-presentiel-t1";
  if (t === "ta" || t.includes("autonome") || t.includes("travailleur")) return "/formulaire-fiscal-presentiel-ta";
  if (t === "t2" || t.includes("t2")) return "/formulaire-fiscal-presentiel-t2";

  return "/formulaire-fiscal-presentiel-t1";
}

export default async function AdminOpenDossierPage({
  params,
}: {
  params: { fid: string };
}) {
  const supabase = await supabaseServer();

  // 1) Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect("/espace-client?next=/admin/dossiers");

  // 2) Admin check
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (profErr) return <div className="p-6">Erreur: {profErr.message}</div>;
  if (!profile?.is_admin) return <div className="p-6">Accès refusé</div>;

  // 3) Charger le dossier (formulaires_fiscaux)
  const { data: form, error: formErr } = await supabase
    .from("formulaires_fiscaux")
    .select("id, form_type")
    .eq("id", params.fid)
    .maybeSingle<FormRow>();

  if (formErr) return <div className="p-6">Erreur: {formErr.message}</div>;
  if (!form) return <div className="p-6">Dossier introuvable.</div>;

  const lang = "fr"; // stable
  const baseForm = routeForFormPresentiel(form.form_type);

  const formUrl = `${baseForm}?fid=${encodeURIComponent(form.id)}&lang=${lang}`;
  const docsUrl = `/admin/dossiers/docs?fid=${encodeURIComponent(form.id)}&lang=${lang}`;

  // ✅ Page choix simple: Formulaire / Docs
  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Dossier</h1>
      <p className="text-sm text-gray-600 mb-6">Choisis ce que tu veux ouvrir.</p>

      <div className="flex gap-3">
        <Link className="px-4 py-2 rounded bg-black text-white" href={formUrl}>
          Ouvrir le formulaire
        </Link>

        <Link className="px-4 py-2 rounded bg-gray-200" href={docsUrl}>
          Voir les documents
        </Link>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <div>fid: {form.id}</div>
        <div>type: {form.form_type ?? "?"}</div>
      </div>
    </main>
  );
}
