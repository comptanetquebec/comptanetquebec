import { redirect } from "next/navigation";
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

  return <>{children}</>;
}
