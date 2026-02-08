import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function POST(req: Request) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!prof?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const docId: string | undefined = body?.docId;
  if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });

  const { data: doc } = await supabase
    .from("formulaire_documents")
    .select("storage_path, original_name, mime_type")
    .eq("id", docId)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Doc not found" }, { status: 404 });

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 10);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Cannot sign url" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
