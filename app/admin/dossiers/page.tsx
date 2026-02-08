// comptanetquebec/app/admin/dossiers/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, { type AdminDossierRow } from "./AdminDossiersClient";

type StatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

type DocRow = {
  formulaire_id: string | null;
  created_at: string | null;
};

function AccessDenied() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Accès refusé</h1>
      <p className="mt-2 text-sm opacity-80">
        Vous n’avez pas l’autorisation d’accéder à cette section.
      </p>
    </div>
  );
}

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  // ✅ Auth obligatoire : pas connecté (ou souci auth) → redirect login
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) {
    redirect("/espace-client?next=/admin/dossiers");
  }

  const userId = auth.user.id;

  // ✅ Admin check : connecté mais pas admin → Accès refusé
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return <AccessDenied />;
  }

  // ✅ Docs : dossiers existants (triés du plus récent au plus vieux)
  const { data: docs, error: docsError } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id, created_at")
    .order("created_at", { ascending: false });

  if (docsError) {
    // pas de leak : page générique (ou AccessDenied si tu préfères)
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm opacity-80">Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  const docsRows = (docs ?? []) as DocRow[];

  // ✅ created_at le plus récent par formulaire_id
  const createdAtMap = new Map<string, string | null>();
  for (const d of docsRows) {
    const id = (d.formulaire_id ?? "").trim();
    if (!id) continue;
    if (!createdAtMap.has(id)) {
      // tri desc → premier rencontré = plus récent
      createdAtMap.set(id, d.created_at ?? null);
    }
  }

  const dossierIds = Array.from(createdAtMap.keys());

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
          <p className="mt-2 text-sm opacity-80">Veuillez réessayer plus tard.</p>
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
  const rows: AdminDossierRow[] = dossierIds.map((id) => {
    const st = statusMap.get(id)?.status ?? "recu";
    const up = statusMap.get(id)?.updated_at ?? null;

    return {
      formulaire_id: id,
      created_at: createdAtMap.get(id) ?? null,
      status: st,
      updated_at: up,
    };
  });

  return <AdminDossiersClient initialRows={rows} />;
}
