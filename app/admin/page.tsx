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

  if (!profile?.is_admin) {
    return <div className="p-6">Accès refusé</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-2">
          Créer un dossier (présentiel)
        </h1>

        <p className="text-gray-600 mb-8">
          Crée un dossier et ouvre immédiatement le formulaire — sans paiement en ligne.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/presentiel?flow=t1"
            className="border rounded-xl p-6 text-center hover:bg-gray-50 transition"
          >
            <div className="text-xl font-semibold mb-2">T1</div>
            <div className="text-gray-600">
              Impôt personnel (Québec)
            </div>
          </Link>

          <Link
            href="/admin/presentiel?flow=ta"
            className="border rounded-xl p-6 text-center hover:bg-gray-50 transition"
          >
            <div className="text-xl font-semibold mb-2">TA</div>
            <div className="text-gray-600">
              Travailleur autonome
            </div>
          </Link>

          <Link
            href="/admin/presentiel?flow=t2"
            className="border rounded-xl p-6 text-center hover:bg-gray-50 transition"
          >
            <div className="text-xl font-semibold mb-2">T2</div>
            <div className="text-gray-600">
              Société (T2 + CO-17)
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/admin/dossiers"
            className="text-blue-700 hover:underline"
          >
            Voir la liste des dossiers
          </Link>
        </div>
      </div>
    </div>
  );
}
