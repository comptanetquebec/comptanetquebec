// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ retourner {name,value} (pas les objets Cookie complets)
        getAll() {
          return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },

        // ✅ ne pas typer le paramètre + corriger sameSite=false
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, {
              ...options,
              sameSite: options?.sameSite === false ? undefined : options?.sameSite,
            });
          });
        },
      },
    }
  );

  // 🔑 force le refresh de session SSR
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
