import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function AdminPage() {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/espace-client?next=/admin");

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) return <div className="p-6">Accès refusé</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Admin – Présentiel</h1>
      <p className="text-sm text-gray-600 mb-6">
        Crée un dossier et ouvre directement le formulaire (sans paiement en ligne).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link className="border rounded p-4 hover:bg-gray-50" href="/admin/presentiel?flow=t1">
          <div className="font-semibold">T1</div>
          <div className="text-sm text-gray-600">Impôt personnel</div>
        </Link>

        <Link className="border rounded p-4 hover:bg-gray-50" href="/admin/presentiel?flow=ta">
          <div className="font-semibold">TA</div>
          <div className="text-sm text-gray-600">Travailleur autonome</div>
        </Link>

        <Link className="border rounded p-4 hover:bg-gray-50" href="/admin/presentiel?flow=t2">
          <div className="font-semibold">T2</div>
          <div className="text-sm text-gray-600">Société</div>
        </Link>
      </div>

      <div className="mt-6">
        <Link className="text-blue-700 hover:underline" href="/admin/dossiers">
          Voir la liste des dossiers
        </Link>
      </div>
    </div>
  );
}
