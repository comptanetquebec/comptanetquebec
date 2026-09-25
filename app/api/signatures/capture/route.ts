// app/api/signatures/capture/route.ts

import {
  createHash,
} from "crypto";
import {
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

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
  tax_year: number;
  document_type:
    | "T183"
    | "TP1000TE"
    | "OTHER";
  original_file_path: string;
  signed_file_path: string | null;
  signature_image_path: string | null;
  status: string;
};

type ZonedParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
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
    return (
      forwarded.split(",")[0]?.trim() ||
      null
    );
  }

  return (
    request.headers
      .get("x-real-ip")
      ?.trim() ||
    null
  );
}

function safeTimeZone(
  value: unknown
) {
  const zone =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!zone) {
    return "America/Toronto";
  }

  try {
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: zone,
      }
    ).format(new Date());

    return zone;
  } catch {
    return "America/Toronto";
  }
}

function zonedParts(
  date: Date,
  timeZone: string
): ZonedParts {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        hourCycle: "h23",
      }
    );

  const result:
    Record<string, string> = {};

  for (
    const part of
    formatter.formatToParts(date)
  ) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return {
    year: result.year || "0000",
    month: result.month || "00",
    day: result.day || "00",
    hour:
      result.hour === "24"
        ? "00"
        : result.hour || "00",
    minute: result.minute || "00",
    second: result.second || "00",
  };
}

function signedPathFromOriginal(
  original: string,
  documentId: string
) {
  if (
    /-original\.pdf$/i.test(original)
  ) {
    return original.replace(
      /-original\.pdf$/i,
      "-signed.pdf"
    );
  }

  const slash =
    original.lastIndexOf("/");

  const folder =
    slash >= 0
      ? original.slice(0, slash + 1)
      : "";

  return (
    `${folder}${documentId}-signed.pdf`
  );
}

function fitImage(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const scale =
    Math.min(
      maxWidth / imageWidth,
      maxHeight / imageHeight
    );

  return {
    width:
      imageWidth * scale,
    height:
      imageHeight * scale,
  };
}

async function stampT183(
  pdfDoc: PDFDocument,
  signaturePng: Uint8Array,
  parts: ZonedParts
) {
  const pages =
    pdfDoc.getPages();

  if (pages.length < 1) {
    throw new Error(
      "Le T183 ne contient aucune page."
    );
  }

  const page = pages[0];

  const width =
    page.getWidth();

  const height =
    page.getHeight();

  // Coordonnées calibrées sur le T183 2023 fourni :
  // 576 x 756 pts. Le formulaire 2025 montré suit
  // le même emplacement de signature.
  const sx =
    width / 576;

  const sy =
    height / 756;

  const png =
    await pdfDoc.embedPng(
      signaturePng
    );

  const size =
    fitImage(
      png.width,
      png.height,
      190 * sx,
      26 * sy
    );

  page.drawImage(
    png,
    {
      x: 40 * sx,
      y: 72 * sy,
      width: size.width,
      height: size.height,
    }
  );

  // Le logiciel d'impôt a déjà inscrit l'année,
  // le mois et le jour sur le T183 fourni.
  // On conserve donc la date existante et on ajoute
  // seulement l'heure exacte de la signature : HH MM SS.
  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const values = [
    {
      value: parts.hour,
      x: 436,
    },
    {
      value: parts.minute,
      x: 462,
    },
    {
      value: parts.second,
      x: 486,
    },
  ];

  for (const item of values) {
    page.drawText(
      item.value,
      {
        x: item.x * sx,
        y: 49 * sy,
        size: 8 * sy,
        font,
        color: rgb(0, 0, 0),
      }
    );
  }
}

async function stampTP1000TE(
  pdfDoc: PDFDocument,
  signaturePng: Uint8Array,
  parts: ZonedParts
) {
  const pages =
    pdfDoc.getPages();

  if (pages.length < 2) {
    throw new Error(
      "Le TP-1000.TE ne contient pas la page de signature."
    );
  }

  const png =
    await pdfDoc.embedPng(
      signaturePng
    );

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  // Le PDF 2023 fourni contient deux exemplaires :
  // pages 2 et 4. Un PDF ne contenant qu'un seul
  // exemplaire utilisera seulement la page 2.
  const indexes =
    pages.length >= 4
      ? [1, 3]
      : [1];

  const dateText =
    `${parts.year}-` +
    `${parts.month}-` +
    `${parts.day}`;

  for (const index of indexes) {
    if (index >= pages.length) {
      continue;
    }

    const page =
      pages[index];

    const sx =
      page.getWidth() / 612;

    const sy =
      page.getHeight() / 792;

    const size =
      fitImage(
        png.width,
        png.height,
        215 * sx,
        32 * sy
      );

    page.drawImage(
      png,
      {
        x: 38 * sx,
        y: 298 * sy,
        width: size.width,
        height: size.height,
      }
    );

    // Le TP-1000.TE fourni contient un champ de date
    // ("date" pour le premier exemplaire et "rep_date"
    // pour le deuxième). Si le logiciel d'impôt l'a déjà
    // rempli, on conserve cette date. Si le champ est vide,
    // ComptaNet inscrit la date du moment de la signature.
    let existingDate = "";

    try {
      const form =
        pdfDoc.getForm();

      const fieldName =
        index === 1
          ? "date"
          : "rep_date";

      const field =
        form.getTextField(
          fieldName
        );

      existingDate =
        field.getText()?.trim() ||
        "";
    } catch {
      existingDate = "";
    }

    if (!existingDate) {
      page.drawText(
        dateText,
        {
          x: 333 * sx,
          y: 301 * sy,
          size: 9 * sy,
          font,
          color: rgb(0, 0, 0),
        }
      );
    }
  }
}

async function createSignedPdf(
  originalBytes: Uint8Array,
  signaturePng: Uint8Array,
  documentType:
    SignatureDocumentRow["document_type"],
  signedAt: Date,
  timeZone: string
) {
  const pdfDoc =
    await PDFDocument.load(
      originalBytes,
      {
        ignoreEncryption: true,
      }
    );

  const parts =
    zonedParts(
      signedAt,
      timeZone
    );

  if (
    documentType === "T183"
  ) {
    await stampT183(
      pdfDoc,
      signaturePng,
      parts
    );
  } else if (
    documentType === "TP1000TE"
  ) {
    await stampTP1000TE(
      pdfDoc,
      signaturePng,
      parts
    );
  } else {
    throw new Error(
      "Ce type de document n'a pas encore de zone de signature configurée."
    );
  }

  return new Uint8Array(
    await pdfDoc.save({
      useObjectStreams: false,
    })
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

    const consent =
      body?.consent === true;

    const clientTimeZone =
      safeTimeZone(
        body?.clientTimeZone
      );

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
      signatureDataUrl
        .split(",")[1] || "";

    const signatureBuffer =
      Buffer.from(
        base64,
        "base64"
      );

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

    const tokenHash =
      createHash("sha256")
        .update(token)
        .digest("hex");

    const supabase =
      makeAdminClient();

    const {
      data: signatureRequest,
    } =
      await supabase
        .from("signature_requests")
        .select(
          "id, status, expires_at"
        )
        .eq(
          "token_hash",
          tokenHash
        )
        .maybeSingle<SignatureRequestRow>();

    if (!signatureRequest) {
      return json(404, {
        ok: false,
        error:
          "Lien de signature invalide.",
      });
    }

    if (
      signatureRequest.status ===
        "cancelled" ||
      signatureRequest.status ===
        "expired"
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
      ).getTime() <
        Date.now()
    ) {
      await supabase
        .from("signature_requests")
        .update({
          status: "expired",
        })
        .eq(
          "id",
          signatureRequest.id
        );

      return json(400, {
        ok: false,
        error:
          "Le lien de signature a expiré.",
      });
    }

    const {
      data: document,
    } =
      await supabase
        .from(
          "signature_documents"
        )
        .select(
          "id, signature_request_id, tax_year, document_type, original_file_path, signed_file_path, signature_image_path, status"
        )
        .eq(
          "id",
          documentId
        )
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

    if (
      document.status === "signed" &&
      document.signed_file_path
    ) {
      return json(200, {
        ok: true,
        alreadySigned: true,
      });
    }

    const signedAt =
      new Date();

    const signatureStoragePath =
      `captured/${signatureRequest.id}/` +
      `${document.id}.png`;

    const {
      error: signatureUploadError,
    } =
      await supabase.storage
        .from("tax-signatures")
        .upload(
          signatureStoragePath,
          signatureBuffer,
          {
            contentType:
              "image/png",
            cacheControl: "3600",
            upsert: true,
          }
        );

    if (
      signatureUploadError
    ) {
      return json(400, {
        ok: false,
        error:
          signatureUploadError.message,
      });
    }

    const {
      data: originalBlob,
      error: downloadError,
    } =
      await supabase.storage
        .from("tax-signatures")
        .download(
          document.original_file_path
        );

    if (
      downloadError ||
      !originalBlob
    ) {
      return json(400, {
        ok: false,
        error:
          downloadError?.message ||
          "Impossible de lire le PDF original.",
      });
    }

    const originalBytes =
      new Uint8Array(
        await originalBlob
          .arrayBuffer()
      );

    let signedBytes:
      Uint8Array;

    try {
      signedBytes =
        await createSignedPdf(
          originalBytes,
          signatureBuffer,
          document.document_type,
          signedAt,
          clientTimeZone
        );
    } catch (error) {
      return json(400, {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de créer le PDF signé.",
      });
    }

    const signedHash =
      createHash("sha256")
        .update(signedBytes)
        .digest("hex");

    const signedPath =
      signedPathFromOriginal(
        document.original_file_path,
        document.id
      );

    const {
      error: signedUploadError,
    } =
      await supabase.storage
        .from("tax-signatures")
        .upload(
          signedPath,
          signedBytes,
          {
            contentType:
              "application/pdf",
            cacheControl: "3600",
            upsert: true,
          }
        );

    if (
      signedUploadError
    ) {
      return json(400, {
        ok: false,
        error:
          signedUploadError.message,
      });
    }

    const signedAtIso =
      signedAt.toISOString();

    const {
      error: documentUpdateError,
    } =
      await supabase
        .from(
          "signature_documents"
        )
        .update({
          signature_image_path:
            signatureStoragePath,
          signed_file_path:
            signedPath,
          signed_sha256:
            signedHash,
          signed_at:
            signedAtIso,
          status:
            "signed",
        })
        .eq(
          "id",
          document.id
        );

    if (
      documentUpdateError
    ) {
      return json(400, {
        ok: false,
        error:
          documentUpdateError.message,
      });
    }

    const {
      data: allDocuments,
      error: allDocumentsError,
    } =
      await supabase
        .from(
          "signature_documents"
        )
        .select(
          "id, status"
        )
        .eq(
          "signature_request_id",
          signatureRequest.id
        );

    if (
      allDocumentsError
    ) {
      return json(400, {
        ok: false,
        error:
          allDocumentsError.message,
      });
    }

    const allSigned =
      (allDocuments ?? [])
        .length > 0 &&
      (allDocuments ?? [])
        .every(
          (row) =>
            row.status === "signed"
        );

    const requestUpdate:
      Record<string, unknown> =
      allSigned
        ? {
            status: "signed",
            completed_at:
              signedAtIso,
          }
        : {
            status:
              "partially_signed",
          };

    const {
      error:
        requestUpdateError,
    } =
      await supabase
        .from(
          "signature_requests"
        )
        .update(
          requestUpdate
        )
        .eq(
          "id",
          signatureRequest.id
        );

    if (
      requestUpdateError
    ) {
      return json(400, {
        ok: false,
        error:
          requestUpdateError.message,
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
          "document_signed",
        ip_address:
          getIp(request),
        user_agent:
          request.headers.get(
            "user-agent"
          ),
        metadata: {
          consent: true,
          signed_at:
            signedAtIso,
          client_time_zone:
            clientTimeZone,
          signed_file_path:
            signedPath,
          signed_sha256:
            signedHash,
          document_type:
            document.document_type,
          tax_year:
            document.tax_year,
        },
      });

    return json(200, {
      ok: true,
      signedFilePath:
        signedPath,
      requestComplete:
        allSigned,
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
