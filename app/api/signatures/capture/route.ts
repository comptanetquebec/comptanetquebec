// app/api/signatures/capture/route.ts

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignatureRequestRow = {
  id: string;
  status: string;
  expires_at: string | null;
};

type SignatureDocumentRow = {
  id: string;
  signature_request_id: string;
  signature_image_path: string | null;
};

function json(
  status: number,
  payload: Record<string, unknown>
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function makeAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SE_CE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getIp(request: Request) {
  const forwarded =
    request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

export async function POST(request: Request) {
  try {
    const body =
      await request.json().catch(() => null);

    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";

    const documentId =
      typeof body?.documentId === "string"
        ? body.documentId.trim()
        : "";

    const signatureDataUrl =
      typeof body?.signatureDataUrl === "string"
        ? body.signatureDataUrl
        : "";

    const consent = body?.consent === true;

    if (
      !token ||
      !documentId ||
      !signatureDataUrl ||
      !consent
    ) {
      return json(400, {
        ok: false,
        error:
          "Informations de signature incomplètes.",
      });
    }

    if (
      !signatureDataUrl.startsWith(
        "data:image/png;base64,"
      )
    ) {
      return json(400, {
        ok: false,
        error:
          "Format de signature invalide.",
      });
    }

    const base64 =
      signatureDataUrl.split(",")[1] || "";

    const signatureBuffer =
      Buffer.from(base64, "base64");

    if (
      signatureBuffer.length < 100 ||
      signatureBuffer.length >
        1024 * 1024
    ) {
      return json(400, {
        ok: false,
        error:
          "Image de signature invalide ou trop volumineuse.",
      });
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const supabase = makeAdminClient();

    const { data: signatureRequest } =
      await supabase
        .from("signature_requests")
        .select(
          "id, status, expires_at"
        )
        .eq("token_hash", tokenHash)
        .maybeSingle<SignatureRequestRow>();

    if (!signatureRequest) {
      return json(404, {
        ok: false,
        error:
          "Lien de signature invalide.",
      });
    }

    if (
      signatureRequest.status === "cancelled" ||
      signatureRequest.status === "expired"
    ) {
      return json(400, {
        ok: false,
        error:
          "Cette demande de signature n’est plus active.",
      });
    }

    if (
      signatureRequest.expires_at &&
      new Date(
        signatureRequest.expires_at
      ).getTime() < Date.now()
    ) {
      await supabase
        .from("signature_requests")
        .update({
          status: "expired",
        })
        .eq("id", signatureRequest.id);

      return json(400, {
        ok: false,
        error:
          "Le lien de signature a expiré.",
      });
    }

    const { data: document } =
      await supabase
        .from("signature_documents")
        .select(
          "id, signature_request_id, signature_image_path"
        )
        .eq("id", documentId)
        .eq(
          "signature_request_id",
          signatureRequest.id
        )
        .maybeSingle<SignatureDocumentRow>();

    if (!document) {
      return json(404, {
        ok: false,
        error:
          "Document de signature introuvable.",
      });
    }

    const storagePath =
      `captured/${signatureRequest.id}/` +
      `${document.id}.png`;

    const { error: uploadError } =
      await supabase.storage
        .from("tax-signatures")
        .upload(
          storagePath,
          signatureBuffer,
          {
            contentType: "image/png",
            cacheControl: "3600",
            upsert: true,
          }
        );

    if (uploadError) {
      return json(400, {
        ok: false,
        error: uploadError.message,
      });
    }

    const { error: updateError } =
      await supabase
        .from("signature_documents")
        .update({
          signature_image_path:
            storagePath,
        })
        .eq("id", document.id);

    if (updateError) {
      return json(400, {
        ok: false,
        error: updateError.message,
      });
    }

    await supabase
      .from("signature_events")
      .insert({
        signature_request_id:
          signatureRequest.id,
        signature_document_id:
          document.id,
        event_type:
          "signature_captured",
        ip_address: getIp(request),
        user_agent:
          request.headers.get("user-agent"),
        metadata: {
          consent: true,
          captured_at:
            new Date().toISOString(),
        },
      });

    return json(200, {
      ok: true,
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur serveur.",
    });
  }
}
