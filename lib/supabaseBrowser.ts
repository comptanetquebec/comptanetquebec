// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");

export const supabase = createBrowserClient(url, anon);
