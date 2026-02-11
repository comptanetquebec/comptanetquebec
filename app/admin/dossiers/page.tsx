// comptanetquebec/app/admin/dossiers/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, { type AdminDossierRow } from "./AdminDossiersClient";

type WorkStatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

type FormRow = {
  id: string;
  created_at: string | null;

  // ✅ statut paiement (Stripe / workflow formulaire)
  // tes valeurs vues dans Supabase: draft | ready_for_payment | paid
  status: "draft" | "ready_for_payment" | "paid" | null;

  // optionnels si tu veux
  form_type?: string | null; // T1 / TA / T2 (si présent)
  annee?: string | number | null; // selon ta DB (si présent)
};

type DossierRow = {
  formulaire_id: string;
  cq_id: string | null;
  annee: string | number | null; // selon ta DB
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

  // ✅ Source: formulaires_fiscaux (même si 0 documents)
  const { data: forms, error: formsErr } = await supabase
    .from("formulaires_fiscaux")
    .select("id, created_at, status, form_type, annee")
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

  // ✅ Statut de travail (dossier_statuses)
  let workStatusRows: WorkStatusRow[] = [];
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

    workStatusRows = (s ?? []) as WorkStatusRow[];
  }

  const workStatusMap = new Map<
    string,
    { status: WorkStatusRow["status"]; updated_at: string | null }
  >();
  for (const s of workStatusRows) {
    workStatusMap.set(String(s.formulaire_id), {
      status: s.status,
      updated_at: s.updated_at ?? null,
    });
  }

  // ✅ CQ + année: table public.dossiers
  // (Si ta table s'appelle autrement, change ici)
  const cqMap = new Map<string, { cq_id: string | null; annee: string | number | null }>();

  if (dossierIds.length > 0) {
    const { data: d, error: dErr } = await supabase
      .from("dossiers")
      .select("formulaire_id, cq_id, annee")
      .in("formulaire_id", dossierIds);

    // On ne bloque pas l'admin si dossiers n'est pas prêt
    if (!dErr && d) {
      const dossierRows = d as DossierRow[];
      for (const r of dossierRows) {
        cqMap.set(String(r.formulaire_id), { cq_id: r.cq_id ?? null, annee: r.annee ?? null });
      }
    }
  }

  // ✅ Rows UI (avec CQ + paiement)
  const rows: AdminDossierRow[] = formRows.map((f) => {
    const work = workStatusMap.get(f.id);
    const cq = cqMap.get(f.id);

    // statut de travail (ton pipeline)
    const st = work?.status ?? "recu";
    const up = work?.updated_at ?? null;

    // statut paiement (Stripe/workflow)
    const payment_status = (f.status ?? null) as AdminDossierRow["payment_status"];

    // année (priorité: dossiers.annee sinon formulaires_fiscaux.annee)
    const yearRaw = cq?.annee ?? f.annee ?? null;
    const yearNum =
      typeof yearRaw === "number"
        ? yearRaw
        : typeof yearRaw === "string" && /^\d{4}$/.test(yearRaw)
        ? Number(yearRaw)
        : null;

    return {
      formulaire_id: f.id,
      cq_id: cq?.cq_id ?? null,
      payment_status,

      created_at: f.created_at ?? null,

      status: st,
      updated_at: up,

      // optionnels si ton composant les affiche
      form_type: f.form_type ?? null,
      tax_year: yearNum,
    };
  });

  return <AdminDossiersClient initialRows={rows} />;
}
