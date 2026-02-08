// comptanetquebec/app/admin/dossiers/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, { type AdminDossierRow } from "./AdminDossiersClient";

type DocRow = {
  formulaire_id: string | null;
  created_at: string | null;
};

type StatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  // ✅ Auth obligatoire (si pas connecté → login)
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return (
      <pre className="p-6 whitespace-pre-wrap">
        auth.getUser error: {authError.message}
      </pre>
    );
  }
  if (!auth?.user) {
    // Mets ici ta page de login réelle si différente
    redirect("/espace-client?next=/admin/dossiers");
  }

  // ✅ Admin check (profiles.is_admin)
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

  // ✅ Docs (dossiers existants) — distinct formulaire_id
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

  const cleanIds =
    (docs as DocRow[] | null)
      ?.map((d) => (d.formulaire_id ?? "").trim())
      .filter(Boolean) ?? [];

  // unique (en gardant l’ordre du plus récent)
  const seen = new Set<string>();
  const dossierIds = cleanIds.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));

  // ✅ Statuts
  // (si pas de statut → "recu" par défaut)
  let statusRows: StatusRow[] = [];
  if (dossierIds.length > 0) {
    const { data: s, error: sErr } = await supabase
      .from("dossier_statuses")
      .select("formulaire_id, status, updated_at")
      .in("formulaire_id", dossierIds);

    if (sErr) {
      return (
        <pre className="p-6 whitespace-pre-wrap">
          dossier_statuses select error: {sErr.message}
        </pre>
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

  // ✅ construire rows pour l’UI (onglets + compteurs)
  const rows: AdminDossierRow[] = dossierIds.map((id) => {
    const created = (docs as DocRow[] | null)?.find((x) => (x.formulaire_id ?? "").trim() === id)
      ?.created_at ?? null;

    const st = statusMap.get(id)?.status ?? "recu";
    const up = statusMap.get(id)?.updated_at ?? null;

    return {
      formulaire_id: id,
      created_at: created,
      status: st,
      updated_at: up,
    };
  });

  return <AdminDossiersClient initialRows={rows} />;
}
