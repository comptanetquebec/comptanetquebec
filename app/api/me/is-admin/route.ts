// app/api/me/is-admin/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json(
      { isAdmin: false, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  // ✅ On crée une réponse vide qu’on retourne à la fin
  const res = NextResponse.next();

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          const sameSite =
            options?.sameSite === false ? undefined : options?.sameSite;

          res.cookies.set(name, value, { ...options, sameSite });
        });
      },
    },
  });

  const { data: auth } = await supabase.auth.getUser();
  const isAdminUser = !!auth?.user;

  let isAdmin = false;

  if (isAdminUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", auth.user.id)
      .maybeSingle();

    isAdmin = !!profile?.is_admin;
  }

  // ✅ Retourner du JSON en gardant les cookies de res
  const json = NextResponse.json({ isAdmin }, { status: 200 });

  // recopier les cookies que Supabase a posés
  res.cookies.getAll().forEach((c) => json.cookies.set(c));

  return json;
}
