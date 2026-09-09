import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();

  const { data: auth, error } = await supabase.auth.getUser();

  if (error || !auth?.user) {
    redirect("/espace-client?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return <AccessDenied />;
  }

  return (
    <>
      {/* NAVIGATION ADMIN */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 md:px-6">

          <Link
            href="/admin/dossiers"
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
          >
            Dossiers
          </Link>

          <Link
            href="/admin/presentiel"
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
          >
            Présentiel
          </Link>

          <Link
            href="/admin/factures?lang=fr"
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
          >
            Factures
          </Link>

        </div>
      </div>

      {/* CONTENU ADMIN */}
      {children}
    </>
  );
}
