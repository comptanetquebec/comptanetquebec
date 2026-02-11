import { supabase } from "@/lib/supabaseClient";

export async function loadPresentiel(fid: string) {
  return supabase
    .from("formulaires_fiscaux")
    .select("id, data, lang, form_type")
    .eq("id", fid)
    .maybeSingle();
}

export async function savePresentiel(
  fid: string,
  data: unknown,
  lang: string
) {
  return supabase
    .from("formulaires_fiscaux")
    .update({ data, lang })
    .eq("id", fid);
}
