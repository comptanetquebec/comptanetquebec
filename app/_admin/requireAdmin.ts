// app/_admin/requireAdmin.ts
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export async function requireAdmin() {
  const supabase = await supabaseServer();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect("/espace-client");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr || !profile?.is_admin) redirect("/espace-client");

  return { userId: auth.user.id };
}
