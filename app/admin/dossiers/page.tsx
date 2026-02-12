// app/admin/dossiers/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, { type AdminDossierRow } from "./AdminDossiersClient";

type ProfileRow = { is_admin: boolean | null };

type FormRow = {
  id: string;
  created_at: string | null;
  form_type: string | null;
  annee: number | null;
  data: Record<string, unknown> | null;
  user_id: string | null;
};

type DocCountRow = { formulaire_id: string; count: number };

type StatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

export default async function AdminDossiersPage() {
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

  if (profErr || !profile?.is_admin) {
    return <div className="p-6">Accès refusé</div>;
  }

  // 3) Formulaires (dossiers)
  const { data: forms, error: formsErr } = await supabase
    .from("formulaires_fiscaux")
    .select("id, created_at, form_type, annee, data, user_id")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<FormRow[]>();

  if (formsErr) {
    return (
      <div className="p-6">
        Erreur chargement formulaires: {formsErr.message}
      </div>
    );
  }

  const list = forms ?? [];
  const ids = list.map((f) => f.id);

  if (ids.length === 0) {
    return <AdminDossiersClient initialRows={[]} />;
  }

  // 4) Docs count (optionnel)
  const { data: docsAgg, error: docsErr } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id, count:id")
    .in("formulaire_id", ids)
    .returns<DocCountRow[]>();

  const safeDocsAgg: DocCountRow[] = docsErr ? [] : (docsAgg ?? []);

  // 5) Status (optionnel)
  let statuses: StatusRow[] = [];
  const { data: stData, error: stErr } = await supabase
    .from("dossier_statuses")
    .select("formulaire_id, status, updated_at")
    .in("formulaire_id", ids)
    .returns<StatusRow[]>();

  if (!stErr && stData) statuses = stData;

  // Maps
  const docsMap = new Map<string, number>();
  safeDocsAgg.forEach((r) =>
    docsMap.set(r.formulaire_id, Number(r.count ?? 0))
  );

  const statusMap = new Map<string, StatusRow>();
  statuses.forEach((s) => statusMap.set(s.formulaire_id, s));

  // Rows UI
  const rows: AdminDossierRow[] = list.map((f) => {
    const filled =
      !!(f.data && typeof f.data === "object" && Object.keys(f.data).length > 0);

    const st = statusMap.get(f.id);

    return {
      formulaire_id: f.id,
      cq_id: f.user_id ?? null,
      payment_status: null, // si tu ajoutes payment_status plus tard
      created_at: f.created_at ?? null,
      status: st?.status ?? "recu",
      updated_at: st?.updated_at ?? null,
      form_type: f.form_type ?? null,
      tax_year: f.annee ?? null,
      form_filled: filled,
      docs_count: docsMap.get(f.id) ?? 0,
    };
  });

  return <AdminDossiersClient initialRows={rows} />;
}
