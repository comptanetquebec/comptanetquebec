import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const BUCKET = "client-documents";

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

async function assertAdmin(supabase: ReturnType<typeof supabaseServer>) {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth?.user) return { ok: false };

  // Option A (recommandé) : table profiles avec is_admin
  const { data: prof } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (prof?.is_admin) return { ok: true as const };

  return { ok: false as const };
}

export async function POST(req: Request) {
  const supabase = supabaseServer();

  const isAdmin = await assertAdmin(supabase);
  if (!isAdmin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const docId: string | undefined = body?.docId;

  if (!docId) {
    return NextResponse.json({ error: "Missing docId" }, { status: 400 });
  }

  const { data: doc, error: docErr } = await supabase
    .from("formulaire_documents")
    .select("storage_path, original_name, mime_type")
    .eq("id", docId)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 10); // 10 minutes

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Cannot sign url" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    name: doc.original_name,
    mime: doc.mime_type ?? null,
  });
}
