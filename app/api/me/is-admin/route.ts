// app/api/me/is-admin/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    isAdmin: !!profile?.is_admin,
  });
}
