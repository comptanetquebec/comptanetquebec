// app/api/me/is-admin/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
  };
};

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json(
      { isAdmin: false, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  // ✅ on utilise UNE seule response (res) pour ne pas perdre les cookies setAll()
  const res = NextResponse.json({ isAdmin: false }, { status: 200 });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return res;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  // ✅ on renvoie sur la même response pour garder les cookies
  res.headers.set("content-type", "application/json");
  return NextResponse.json({ isAdmin: !!profile?.is_admin }, { status: 200 });
}
