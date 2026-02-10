// app/formulaire-fiscal-presentiel/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import PresentielClient from "./PresentielClient";
import "../../formulaire-fiscal/formulaire-fiscal-presentiel.css";

type Lang = "fr" | "en" | "es";

export default async function Page({
  searchParams,
}: {
  searchParams: { fid?: string; lang?: string };
}) {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect("/espace-client");

  // Admin
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr || !profile?.is_admin) redirect("/espace-client");

  const lang = (searchParams.lang as Lang) ?? "fr";
  const fid = searchParams.fid ?? "";

  return <PresentielClient userId={auth.user.id} lang={lang} fid={fid} />;
}
