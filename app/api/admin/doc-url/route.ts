import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const BUCKET = "client-documents";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // payload
  const { docId } = await req.json();
  if (!docId) {
    return NextResponse.json({ error: "Missing docId" }, { status: 400 });
  }

  // doc
  const { data: doc } = await supabase
    .from("formulaire_documents")
    .select("storage_path")
    .eq("id", docId)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // signed url
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 10);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Cannot create signed URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
