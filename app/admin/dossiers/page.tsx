// comptanetquebec/app/admin/dossiers/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, { type AdminDossierRow } from "./AdminDossiersClient";

type StatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

type FormRow = {
  id: string;
  created_at: string | null;
};

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  // ✅ Auth obligatoire
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect("/espace-client?next=/admin/dossiers");

  // ✅ Admin obligatoire
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr || !profile?.is_admin) redirect("/espace-client?next=/admin/dossiers");

  // ✅ Source de vérité: formulaires_fiscaux (même si 0 documents)
  const { data: forms, error: formsErr } = await supabase
    .from("formulaires_fiscaux")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  if (formsErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm opacity-80">{formsErr.message}</p>
      </div>
    );
  }

  const formRows = (forms ?? []) as FormRow[];
  const dossierIds = formRows.map((f) => f.id);

  // ✅ Statuts
  let statusRows: StatusRow[] = [];
  if (dossierIds.length > 0) {
    const { data: s, error: sErr } = await supabase
      .from("dossier_statuses")
      .select("formulaire_id, status, updated_at")
      .in("formulaire_id", dossierIds);

    if (sErr) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
          <p className="mt-2 text-sm opacity-80">{sErr.message}</p>
        </div>
      );
    }

    statusRows = (s ?? []) as StatusRow[];
  }

  const statusMap = new Map<string, { status: StatusRow["status"]; updated_at: string | null }>();
  for (const s of statusRows) {
    statusMap.set(String(s.formulaire_id), {
      status: s.status,
      updated_at: s.updated_at ?? null,
    });
  }

  // ✅ Rows UI
  const rows: AdminDossierRow[] = formRows.map((f) => {
    const st = statusMap.get(f.id)?.status ?? "recu";
    const up = statusMap.get(f.id)?.updated_at ?? null;

    return {
      formulaire_id: f.id,
      created_at: f.created_at ?? null,
      status: st,
      updated_at: up,
    };
  });

  return <AdminDossiersClient initialRows={rows} />;
}
