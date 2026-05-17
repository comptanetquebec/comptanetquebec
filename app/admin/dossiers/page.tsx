// app/admin/dossiers/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, { type AdminDossierRow } from "./AdminDossiersClient";

type ProfileRow = { is_admin: boolean | null };

type PaymentStatus = "unpaid" | "paid";

type FormRow = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  form_type: string | null;
  annee: number | null;
  data: Record<string, unknown> | null;
  user_id: string | null;
  cq_id: string | null;
  payment_status: PaymentStatus | null;
};

type StatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

type ClientData = {
  client?: {
    prenom?: string;
    nom?: string;
    courriel?: string;
    tel?: string;
    telCell?: string;
  };
};

function safePayment(v: unknown): PaymentStatus {
  return v === "paid" ? "paid" : "unpaid";
}

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect("/espace-client?next=/admin/dossiers");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (profErr || !profile?.is_admin) {
    return <div className="p-6">Accès refusé</div>;
  }

  const { data: forms, error: formsErr } = await supabase
    .from("formulaires_fiscaux")
    .select("id, created_at, updated_at, form_type, annee, data, user_id, cq_id, payment_status")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<FormRow[]>();

  if (formsErr) {
    return <div className="p-6">Erreur chargement formulaires: {formsErr.message}</div>;
  }

  const list = forms ?? [];
  const ids = list.map((f) => f.id);

  if (ids.length === 0) {
    return <AdminDossiersClient initialRows={[]} />;
  }

  const { data: docsRows, error: docsErr } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id")
    .in("formulaire_id", ids)
    .limit(100000);

  const docsMap = new Map<string, number>();

  if (!docsErr && docsRows) {
    for (const r of docsRows as { formulaire_id: string }[]) {
      docsMap.set(r.formulaire_id, (docsMap.get(r.formulaire_id) ?? 0) + 1);
    }
  }

  const { data: stData, error: stErr } = await supabase
    .from("dossier_statuses")
    .select("formulaire_id, status, updated_at")
    .in("formulaire_id", ids)
    .returns<StatusRow[]>();

  const statusMap = new Map<string, StatusRow>();

  if (!stErr && stData) {
    for (const s of stData) {
      statusMap.set(s.formulaire_id, s);
    }
  }

  const rows: AdminDossierRow[] = list.map((f) => {
    const filled = !!(f.data && typeof f.data === "object" && Object.keys(f.data).length > 0);
    const st = statusMap.get(f.id);

    const data = f.data as ClientData | null;
    const client_name = `${data?.client?.prenom ?? ""} ${data?.client?.nom ?? ""}`.trim();
    const client_email = data?.client?.courriel ?? null;
    const client_phone = data?.client?.telCell || data?.client?.tel || null;

    return {
      formulaire_id: f.id,
      cq_id: f.cq_id ?? null,
      client_name: client_name || null,
      client_email,
      client_phone,
      payment_status: f.payment_status ? safePayment(f.payment_status) : "unpaid",
      created_at: f.created_at ?? null,
      status: st?.status ?? "recu",
      updated_at: st?.updated_at ?? f.updated_at ?? f.created_at ?? null,
      form_type: f.form_type ?? null,
      tax_year: f.annee ?? null,
      form_filled: filled,
      docs_count: docsMap.get(f.id) ?? 0,
    };
  });

  return <AdminDossiersClient initialRows={rows} />;
}
