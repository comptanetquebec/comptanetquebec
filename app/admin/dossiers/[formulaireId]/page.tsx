import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import OpenDocButton from "./OpenDocButton";
import SubmitWithoutPaymentButton from "./SubmitWithoutPaymentButton";

type FormRow = {
  id: string;
  form_type: string | null; // "T1" | "TA" | "T2" (selon ta DB)
  annee: string | number | null;
  status: "draft" | "ready_for_payment" | "paid" | null;
  cq_id: string | null;
  created_at: string | null;
};

function toTaxYear(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\d{4}$/.test(v)) return Number(v);
  return null;
}

function formLink(form_type: string | null, fid: string) {
  const q = new URLSearchParams();
  q.set("fid", fid);
  // si tu veux forcer langue admin:
  // q.set("lang", "fr");

  // ⚠️ adapte ici si tes routes exactes sont différentes
  if (form_type === "T1") return `/formulaire-fiscal?${q}`;
  if (form_type === "TA") return `/formulaire-fiscal-ta?${q}`;
  if (form_type === "T2") return `/formulaire-fiscal-t2?${q}`;

  // fallback
  return `/admin/dossiers/${encodeURIComponent(fid)}`;
}

export default async function AdminDossierPage({
  params,
}: {
  params: { formulaireId: string };
}) {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return <div className="p-6">Non connecté</div>;

  // Admin check
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr) return <div className="p-6">Erreur: {profErr.message}</div>;
  if (!profile?.is_admin) return <div className="p-6">Accès refusé</div>;

  const fid = params.formulaireId;

  // ✅ Lire le formulaire (pour afficher type, année, paiement, etc.)
  const { data: form, error: formErr } = await supabase
    .from("formulaires_fiscaux")
    .select("id, form_type, annee, status, cq_id, created_at")
    .eq("id", fid)
    .maybeSingle<FormRow>();

  if (formErr) return <div className="p-6">Erreur form: {formErr.message}</div>;
  if (!form) return <div className="p-6">Dossier introuvable</div>;

  // Docs
  const { data: docs, error: docsErr } = await supabase
    .from("formulaire_documents")
    .select("id, original_name, mime_type, size_bytes, created_at")
    .eq("formulaire_id", fid)
    .order("created_at", { ascending: false });

  if (docsErr) return <div className="p-6">Erreur docs: {docsErr.message}</div>;

  const year = toTaxYear(form.annee);
  const openHref = formLink(form.form_type, fid);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dossier {form.cq_id ?? "CQ: (en attente)"}</h1>
          <div className="text-sm text-gray-600 mt-1">
            ID: {fid}
            {form.created_at ? ` • Créé: ${new Date(form.created_at).toLocaleString("fr-CA")}` : ""}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {form.form_type ? `Type: ${form.form_type}` : "Type: -"}
            {year ? ` • Année: ${year}` : ""}
            {form.status ? ` • Paiement: ${form.status}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/dossiers" className="text-sm text-blue-700 hover:underline">
            ← Retour dossiers
          </Link>

          {/* ✅ Ouvrir le formulaire (auto selon type) */}
          <Link
            href={openHref}
            className="text-sm bg-black text-white px-3 py-2 rounded"
          >
            Ouvrir le formulaire
          </Link>
        </div>
      </div>

      {/* ✅ Bouton admin (présentiel) : soumettre sans paiement */}
      <div className="mb-6">
        <SubmitWithoutPaymentButton fid={fid} />
      </div>

      {/* Docs */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Documents déposés</h2>
        <div className="text-sm text-gray-600">Total: {docs?.length ?? 0}</div>
      </div>

      {!docs?.length ? (
        <p className="mt-2">Aucun document.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nom</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Date</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="p-2">{d.original_name}</td>
                <td className="p-2">{d.mime_type ?? "-"}</td>
                <td className="p-2">
                  {d.created_at ? new Date(d.created_at).toLocaleString("fr-CA") : "-"}
                </td>
                <td className="p-2 text-right">
                  <OpenDocButton docId={d.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
