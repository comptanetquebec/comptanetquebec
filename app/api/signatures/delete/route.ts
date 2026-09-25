// app/api/signatures/delete/route.ts

import {
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";
import {
  supabaseServer,
} from "@/lib/supabaseServer";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ProfileRow = {
  is_admin: boolean | null;
};

type SignatureRequestRow = {
  id: string;
};

type SignatureDocumentRow = {
  id: string;
  original_file_path: string | null;
  signed_file_path: string | null;
  signature_image_path: string | null;
};

function json(
  status: number,
  payload: Record<
    string,
    unknown
  >
) {
  return NextResponse.json(
    payload,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

function makeAdminClient() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL
      ?.trim();

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY
      ?.trim() ||
    process.env
      .SUPABASE_SE_CE_ROLE_KEY
      ?.trim();

  if (!url || !key) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken:
          false,
      },
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(() => null);

    const requestId =
      typeof body?.requestId ===
      "string"
        ? body.requestId.trim()
        : "";

    if (!requestId) {
      return json(400, {
        ok: false,
        error:
          "Demande de signature invalide.",
      });
    }

    // Vérifie d'abord que la personne connectée
    // est bien administratrice.
    const userClient =
      await supabaseServer();

    const {
      data: auth,
      error: authError,
    } =
      await userClient.auth
        .getUser();

    if (
      authError ||
      !auth?.user
    ) {
      return json(401, {
        ok: false,
        error:
          "Connexion requise.",
      });
    }

    const {
      data: profile,
      error: profileError,
    } =
      await userClient
        .from("profiles")
        .select("is_admin")
        .eq(
          "id",
          auth.user.id
        )
        .maybeSingle<ProfileRow>();

    if (
      profileError ||
      !profile?.is_admin
    ) {
      return json(403, {
        ok: false,
        error:
          "Accès administrateur requis.",
      });
    }

    // À partir d'ici, le service role reste
    // uniquement côté serveur.
    const admin =
      makeAdminClient();

    const {
      data:
        signatureRequest,
      error:
        requestError,
    } =
      await admin
        .from(
          "signature_requests"
        )
        .select("id")
        .eq(
          "id",
          requestId
        )
        .maybeSingle<
          SignatureRequestRow
        >();

    if (requestError) {
      return json(400, {
        ok: false,
        error:
          requestError.message,
      });
    }

    if (
      !signatureRequest
    ) {
      return json(404, {
        ok: false,
        error:
          "Demande de signature introuvable.",
      });
    }

    const {
      data: documents,
      error:
        documentsError,
    } =
      await admin
        .from(
          "signature_documents"
        )
        .select(
          "id, original_file_path, signed_file_path, signature_image_path"
        )
        .eq(
          "signature_request_id",
          requestId
        )
        .returns<
          SignatureDocumentRow[]
        >();

    if (documentsError) {
      return json(400, {
        ok: false,
        error:
          documentsError.message,
      });
    }

    const storagePaths =
      Array.from(
        new Set(
          (documents ?? [])
            .flatMap(
              (document) => [
                document.original_file_path,
                document.signed_file_path,
                document.signature_image_path,
              ]
            )
            .filter(
              (
                path
              ): path is string =>
                Boolean(path)
            )
        )
      );

    // On supprime d'abord les traces relationnelles,
    // puis la demande elle-même.
    const {
      error: eventsError,
    } =
      await admin
        .from(
          "signature_events"
        )
        .delete()
        .eq(
          "signature_request_id",
          requestId
        );

    if (eventsError) {
      return json(400, {
        ok: false,
        error:
          eventsError.message,
      });
    }

    const {
      error:
        documentsDeleteError,
    } =
      await admin
        .from(
          "signature_documents"
        )
        .delete()
        .eq(
          "signature_request_id",
          requestId
        );

    if (
      documentsDeleteError
    ) {
      return json(400, {
        ok: false,
        error:
          documentsDeleteError.message,
      });
    }

    const {
      error:
        requestDeleteError,
    } =
      await admin
        .from(
          "signature_requests"
        )
        .delete()
        .eq(
          "id",
          requestId
        );

    if (
      requestDeleteError
    ) {
      return json(400, {
        ok: false,
        error:
          requestDeleteError.message,
      });
    }

    // Nettoyage des fichiers privés après la suppression
    // de la demande. S'il reste un ancien fichier orphelin,
    // cela ne bloque pas la disparition de la demande admin.
    let storageWarning:
      string | null =
      null;

    if (
      storagePaths.length >
      0
    ) {
      const {
        error:
          storageError,
      } =
        await admin.storage
          .from(
            "tax-signatures"
          )
          .remove(
            storagePaths
          );

      if (storageError) {
        storageWarning =
          storageError.message;
      }
    }

    return json(200, {
      ok: true,
      storageWarning,
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
