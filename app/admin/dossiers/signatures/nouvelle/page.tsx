// app/admin/dossiers/signatures/nouvelle/page.tsx

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import NouvelleSignatureClient from "./NouvelleSignatureClient";

type PageProps = {
  searchParams: Promise<{
    fid?: string | string[];
  }>;
};

type ProfileRow = {
  is_admin: boolean | null;
};

type FormRow = {
  id: string;
  cq_id: string | null;
  annee: number | string | null;
  data: Record<string, unknown> | null;
};

type ClientData = {
  client?: {
    prenom?: string;
    nom?: string;
    courriel?: string;
  };
};

function asClientData(
  value: Record<string, unknown> | null
): ClientData {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as ClientData;
}

function parseYear(
  value: number | string | null
): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  return null;
}

export default async function NouvelleSignaturePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const rawFid = params.fid;
  const fid = Array.isArray(rawFid)
    ? rawFid[0]
    : rawFid;

  if (!fid) {
    redirect("/admin/dossiers");
  }

  const supabase = await supabaseServer();

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth?.user) {
    redirect(
      `/espace-client?next=${encodeURIComponent(
        `/admin/dossiers/signatures/nouvelle?fid=${fid}`
      )}`
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", auth.user.id)
      .maybeSingle<ProfileRow>();

  if (profileError || !profile?.is_admin) {
    redirect("/admin/dossiers");
  }

  const { data: form, error: formError } =
    await supabase
      .from("formulaires_fiscaux")
      .select("id, cq_id, annee, data")
      .eq("id", fid)
      .maybeSingle<FormRow>();

  if (formError || !form) {
    redirect("/admin/dossiers");
  }

  const data = asClientData(form.data);

  const clientName =
    `${data.client?.prenom ?? ""} ${
      data.client?.nom ?? ""
    }`.trim();

  const clientEmail =
    data.client?.courriel
      ?.trim()
      .toLowerCase() ?? "";

  return (
    <NouvelleSignatureClient
      fid={form.id}
      cqId={form.cq_id ?? ""}
      initialName={clientName}
      initialEmail={clientEmail}
      initialYear={parseYear(form.annee)}
    />
  );
}
