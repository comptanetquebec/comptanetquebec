// app/admin/factures/nouvelle/page.tsx

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import NouvelleFactureClient from "./NouvelleFactureClient";

type ProfileRow = {
  is_admin: boolean | null;
};

type Lang = "fr" | "en" | "es";

function normalizeLang(value?: string): Lang {
  return value === "en" || value === "es" ? value : "fr";
}

type PageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function NouvelleFacturePage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const lang = normalizeLang(params?.lang);

  const supabase = await supabaseServer();

  const { data: auth, error: authErr } =
    await supabase.auth.getUser();

  if (authErr || !auth?.user) {
    redirect(
      `/espace-client?next=${encodeURIComponent(
        `/admin/factures/nouvelle?lang=${lang}`
      )}&lang=${lang}`
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (profileErr || !profile?.is_admin) {
    return <div className="p-6">Accès refusé</div>;
  }

  return <NouvelleFactureClient lang={lang} />;
}
