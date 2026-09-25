// app/api/signatures/send/route.ts

import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK_VALID_DAYS = 7;

type RequestRow = {
  id: string;
  formulaire_id: string;
  signer_name: string;
  signer_email: string;
  status: string;
};

type FactureRow = {
  id: string;
  numero_facture: string | null;
  formulaire_id: string | null;
  cq_id: string | null;

  client_nom: string | null;
  client_courriel: string | null;
  client_adresse: string | null;
  client_ville: string | null;
  client_province: string | null;
  client_code_postal: string | null;

  description: string | null;
  quantite: number | string | null;
  prix_unitaire: number | string | null;

  sous_total: number | string | null;
  tps: number | string | null;
  tvq: number | string | null;
  total: number | string | null;

  montant_paye: number | string | null;
  mode_paiement: string | null;
  statut: string | null;
  date_facture: string | null;
};

type FactureLigneRow = {
  description: string | null;
  quantite: number | string | null;
  prix_unitaire: number | string | null;
  montant: number | string | null;
  ordre: number | null;
};

type ProfileRow = {
  is_admin: boolean | null;
};

type DocumentRow = {
  tax_year: number;
  document_type: string;
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "fr-CA",
    {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function toNumber(
  value: number | string | null | undefined
) {
  const n =
    typeof value === "number"
      ? value
      : Number(value ?? 0);

  return Number.isFinite(n)
    ? n
    : 0;
}

async function creerFacturePdf(
  facture: FactureRow,
  lignes: FactureLigneRow[]
): Promise<Buffer> {
  const pdf = await PDFDocument.create();

  const page = pdf.addPage([612, 792]);

  const regular = await pdf.embedFont(
    StandardFonts.Helvetica
  );

  const bold = await pdf.embedFont(
    StandardFonts.HelveticaBold
  );

  const navy = rgb(
    7 / 255,
    65 / 255,
    105 / 255
  );

  const blue = rgb(
    29 / 255,
    78 / 255,
    216 / 255
  );

  const dark = rgb(
    30 / 255,
    41 / 255,
    59 / 255
  );

  const light = rgb(
    239 / 255,
    246 / 255,
    255 / 255
  );

  const red = rgb(
    185 / 255,
    28 / 255,
    28 / 255
  );

  const total =
    toNumber(
      facture.total
    );

  const montantPaye =
    Math.max(
      0,
      toNumber(
        facture.montant_paye
      )
    );

  const solde =
    Math.max(
      0,
      Math.round(
        (
          total -
          montantPaye
        ) * 100
      ) / 100
    );

  const estPayee =
    facture.statut === "paid" ||
    (
      total > 0 &&
      montantPaye >=
        total - 0.005
    );

  const moneyPdf = (
    value: number
  ) =>
    new Intl.NumberFormat(
      "fr-CA",
      {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(value);

  const safe = (
    value:
      | string
      | null
      | undefined
  ) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

  page.drawRectangle({
    x: 0,
    y: 700,
    width: 612,
    height: 92,
    color: light,
  });

  page.drawText(
    "ComptaNet Québec",
    {
      x: 42,
      y: 750,
      size: 22,
      font: bold,
      color: navy,
    }
  );

  page.drawText(
    "FACTURE",
    {
      x: 470,
      y: 748,
      size: 22,
      font: bold,
      color: navy,
    }
  );

  page.drawText(
    "849, boulevard Pie XII",
    {
      x: 42,
      y: 681,
      size: 9,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    "Québec, Québec  G1X 3T2",
    {
      x: 42,
      y: 668,
      size: 9,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    "581-985-2599",
    {
      x: 42,
      y: 655,
      size: 9,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    "comptanetquebec@gmail.com",
    {
      x: 42,
      y: 642,
      size: 9,
      font: regular,
      color: dark,
    }
  );

  page.drawRectangle({
    x: 382,
    y: 630,
    width: 188,
    height: 60,
    color: light,
  });

  page.drawText(
    `N° FACTURE : ${
      safe(
        facture.numero_facture
      ) || "—"
    }`,
    {
      x: 395,
      y: 670,
      size: 9,
      font: bold,
      color: dark,
    }
  );

  page.drawText(
    `DATE : ${
      safe(
        facture.date_facture
      ) || "—"
    }`,
    {
      x: 395,
      y: 652,
      size: 9,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    `N° CLIENT : ${
      safe(
        facture.cq_id
      ) || "—"
    }`,
    {
      x: 395,
      y: 634,
      size: 9,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    "FACTURÉ À",
    {
      x: 42,
      y: 595,
      size: 9,
      font: bold,
      color: navy,
    }
  );

  page.drawText(
    safe(
      facture.client_nom
    ) || "Client",
    {
      x: 42,
      y: 576,
      size: 11,
      font: bold,
      color: dark,
    }
  );

  const adresse = [
    safe(
      facture.client_adresse
    ),
    [
      safe(
        facture.client_ville
      ),
      safe(
        facture.client_province
      ),
      safe(
        facture.client_code_postal
      ),
    ]
      .filter(Boolean)
      .join(" "),
  ].filter(Boolean);

  let adresseY = 560;

  for (const ligne of adresse) {
    page.drawText(
      ligne,
      {
        x: 42,
        y: adresseY,
        size: 9,
        font: regular,
        color: dark,
      }
    );

    adresseY -= 13;
  }

  page.drawRectangle({
    x: 42,
    y: 495,
    width: 528,
    height: 24,
    color: navy,
  });

  page.drawText(
    "DESCRIPTION",
    {
      x: 50,
      y: 503,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    }
  );

  page.drawText(
    "QTÉ",
    {
      x: 360,
      y: 503,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    }
  );

  page.drawText(
    "PRIX UNITAIRE",
    {
      x: 405,
      y: 503,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    }
  );

  page.drawText(
    "MONTANT",
    {
      x: 518,
      y: 503,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    }
  );

  const lignesPdf =
    lignes.length > 0
      ? lignes
      : [
          {
            description:
              facture.description,
            quantite:
              facture.quantite,
            prix_unitaire:
              facture.prix_unitaire,
            montant:
              facture.sous_total,
            ordre: 1,
          },
        ];

  let y = 475;

  for (
    const ligne of
    lignesPdf.slice(0, 10)
  ) {
    page.drawText(
      safe(
        ligne.description
      ).slice(0, 58),
      {
        x: 50,
        y,
        size: 8.5,
        font: regular,
        color: dark,
      }
    );

    page.drawText(
      String(
        toNumber(
          ligne.quantite
        ) || 1
      ),
      {
        x: 362,
        y,
        size: 8.5,
        font: regular,
        color: dark,
      }
    );

    page.drawText(
      moneyPdf(
        toNumber(
          ligne.prix_unitaire
        )
      ),
      {
        x: 405,
        y,
        size: 8.5,
        font: regular,
        color: dark,
      }
    );

    page.drawText(
      moneyPdf(
        toNumber(
          ligne.montant
        )
      ),
      {
        x: 510,
        y,
        size: 8.5,
        font: regular,
        color: dark,
      }
    );

    y -= 24;
  }

  const totalX = 370;
  let totalY =
    Math.max(
      190,
      y - 20
    );

  const drawAmount = (
    label: string,
    value: string,
    color = dark,
    font = regular
  ) => {
    page.drawText(
      label,
      {
        x: totalX,
        y: totalY,
        size: 9,
        font,
        color,
      }
    );

    page.drawText(
      value,
      {
        x: 500,
        y: totalY,
        size: 9,
        font,
        color,
      }
    );

    totalY -= 18;
  };

  drawAmount(
    "Sous-total",
    moneyPdf(
      toNumber(
        facture.sous_total
      )
    )
  );

  drawAmount(
    "TPS (5 %)",
    moneyPdf(
      toNumber(
        facture.tps
      )
    )
  );

  drawAmount(
    "TVQ (9,975 %)",
    moneyPdf(
      toNumber(
        facture.tvq
      )
    )
  );

  if (
    montantPaye > 0 &&
    !estPayee
  ) {
    drawAmount(
      "Total",
      moneyPdf(total),
      dark,
      bold
    );

    drawAmount(
      "Acompte déjà reçu",
      `- ${moneyPdf(
        montantPaye
      )}`,
      red,
      regular
    );
  }

  /*
   * Laisse un espace sous la dernière ligne des totaux
   * pour que le cadre du solde ne recouvre pas
   * "Acompte déjà reçu".
   */
  totalY -= 18;

  page.drawRectangle({
    x: totalX - 8,
    y: totalY - 6,
    width: 205,
    height: 32,
    color: light,
    borderColor: blue,
    borderWidth: 1,
  });

  page.drawText(
    estPayee
      ? "TOTAL PAYÉ"
      : montantPaye > 0
        ? "SOLDE À PAYER"
        : "TOTAL À PAYER",
    {
      x: totalX,
      y: totalY + 5,
      size: 10,
      font: bold,
      color: navy,
    }
  );

  page.drawText(
    moneyPdf(
      estPayee
        ? total
        : montantPaye > 0
          ? solde
          : total
    ),
    {
      x: 500,
      y: totalY + 5,
      size: 11,
      font: bold,
      color: navy,
    }
  );

  page.drawText(
    "N° d'inscription TPS : 701807737",
    {
      x: 42,
      y: 42,
      size: 7.5,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    "N° d'inscription TVQ : 1227932399",
    {
      x: 42,
      y: 29,
      size: 7.5,
      font: regular,
      color: dark,
    }
  );

  page.drawText(
    "Merci de votre confiance !",
    {
      x: 425,
      y: 35,
      size: 9,
      font: bold,
      color: navy,
    }
  );

  const bytes =
    await pdf.save({
      useObjectStreams: false,
    });

  return Buffer.from(bytes);
}

export async function GET(request: Request) {
  try {
    const url =
      new URL(request.url);

    const requestId =
      (
        url.searchParams.get(
          "requestId"
        ) || ""
      ).trim();

    if (!requestId) {
      return json(400, {
        ok: false,
        error:
          "Demande de signature manquante.",
      });
    }

    const supabase =
      await supabaseServer();

    const {
      data: auth,
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !auth?.user
    ) {
      return json(401, {
        ok: false,
        error:
          "Non connecté.",
      });
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
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
          "Accès refusé.",
      });
    }

    const {
      data: signatureRequest,
      error: requestError,
    } =
      await supabase
        .from(
          "signature_requests"
        )
        .select(
          "id, formulaire_id, signer_name, signer_email, status"
        )
        .eq(
          "id",
          requestId
        )
        .maybeSingle<RequestRow>();

    if (
      requestError ||
      !signatureRequest
    ) {
      return json(404, {
        ok: false,
        error:
          "Demande de signature introuvable.",
      });
    }

    if (
      signatureRequest.status !==
        "draft" &&
      signatureRequest.status !==
        "sent"
    ) {
      return json(400, {
        ok: false,
        error:
          "Cette demande ne peut plus être envoyée.",
      });
    }

    const {
      data: facture,
      error: factureError,
    } =
      await supabase
        .from("factures")
        .select(
          `
            id,
            numero_facture,
            formulaire_id,
            cq_id,
            client_nom,
            client_courriel,
            client_adresse,
            client_ville,
            client_province,
            client_code_postal,
            description,
            quantite,
            prix_unitaire,
            sous_total,
            tps,
            tvq,
            total,
            montant_paye,
            mode_paiement,
            statut,
            date_facture
          `
        )
        .eq(
          "formulaire_id",
          signatureRequest
            .formulaire_id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle<FactureRow>();

    if (factureError) {
      return json(400, {
        ok: false,
        error:
          factureError.message,
      });
    }

    if (!facture) {
      return json(200, {
        ok: true,
        facture: null,
      });
    }

    const {
      data: lignesFacture,
      error: lignesError,
    } =
      await supabase
        .from(
          "facture_lignes"
        )
        .select(
          "description, quantite, prix_unitaire, montant, ordre"
        )
        .eq(
          "facture_id",
          facture.id
        )
        .order(
          "ordre",
          {
            ascending: true,
          }
        )
        .returns<
          FactureLigneRow[]
        >();

    if (lignesError) {
      return json(400, {
        ok: false,
        error:
          lignesError.message,
      });
    }

    const lignes =
      lignesFacture &&
      lignesFacture.length > 0
        ? lignesFacture.map(
            (ligne) => ({
              description:
                ligne.description ??
                "",
              quantite:
                toNumber(
                  ligne.quantite
                ) || 1,
              prix_unitaire:
                toNumber(
                  ligne
                    .prix_unitaire
                ),
              montant:
                toNumber(
                  ligne.montant
                ),
            })
          )
        : [
            {
              description:
                facture.description ??
                "",
              quantite:
                toNumber(
                  facture.quantite
                ) || 1,
              prix_unitaire:
                toNumber(
                  facture
                    .prix_unitaire
                ),
              montant:
                toNumber(
                  facture
                    .sous_total
                ),
            },
          ];

    return json(200, {
      ok: true,
      facture: {
        numero_facture:
          facture
            .numero_facture,
        cq_id:
          facture.cq_id,

        client_nom:
          facture.client_nom ??
          "",
        client_courriel:
          facture
            .client_courriel,
        client_adresse:
          facture
            .client_adresse,
        client_ville:
          facture.client_ville,
        client_province:
          facture
            .client_province,
        client_code_postal:
          facture
            .client_code_postal,

        description:
          facture.description,
        quantite:
          toNumber(
            facture.quantite
          ),
        prix_unitaire:
          toNumber(
            facture
              .prix_unitaire
          ),

        sous_total:
          toNumber(
            facture
              .sous_total
          ),
        tps:
          toNumber(
            facture.tps
          ),
        tvq:
          toNumber(
            facture.tvq
          ),
        total:
          toNumber(
            facture.total
          ),

        statut:
          facture.statut,
        montant_paye:
          toNumber(
            facture
              .montant_paye
          ),
        mode_paiement:
          facture
            .mode_paiement,
        date_facture:
          facture
            .date_facture,

        lignes,
      },
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const requestId =
      typeof body?.requestId === "string"
        ? body.requestId.trim()
        : "";

    const facturePdfBase64 =
      typeof body?.facturePdfBase64 === "string"
        ? body.facturePdfBase64.trim()
        : "";

    const facturePdfName =
      typeof body?.facturePdfName === "string"
        ? body.facturePdfName.trim()
        : "";

    if (!requestId) {
      return json(400, {
        ok: false,
        error: "Demande de signature manquante.",
      });
    }

    const supabase = await supabaseServer();

    const { data: auth, error: authError } =
      await supabase.auth.getUser();

    if (authError || !auth?.user) {
      return json(401, {
        ok: false,
        error: "Non connecté.",
      });
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user.id)
        .maybeSingle<ProfileRow>();

    if (
      profileError ||
      !profile?.is_admin
    ) {
      return json(403, {
        ok: false,
        error: "Accès refusé.",
      });
    }

    const { data: signatureRequest, error: requestError } =
      await supabase
        .from("signature_requests")
        .select(
          "id, formulaire_id, signer_name, signer_email, status"
        )
        .eq("id", requestId)
        .maybeSingle<RequestRow>();

    if (
      requestError ||
      !signatureRequest
    ) {
      return json(404, {
        ok: false,
        error: "Demande de signature introuvable.",
      });
    }

    const isResend =
      signatureRequest.status ===
      "sent";

    if (
      signatureRequest.status !==
        "draft" &&
      !isResend
    ) {
      return json(400, {
        ok: false,
        error:
          "Cette demande ne peut plus être envoyée.",
      });
    }

    const email =
      signatureRequest.signer_email
        .trim()
        .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return json(400, {
        ok: false,
        error: "Courriel du signataire invalide.",
      });
    }

    const { data: documents, error: docsError } =
      await supabase
        .from("signature_documents")
        .select("tax_year, document_type")
        .eq("signature_request_id", requestId)
        .returns<DocumentRow[]>();

    if (docsError) {
      return json(400, {
        ok: false,
        error: docsError.message,
      });
    }

    if (!documents || documents.length === 0) {
      return json(400, {
        ok: false,
        error:
          "Aucun document à signer dans cette demande.",
      });
    }

    /*
     * Facture liée au même dossier.
     * Si aucune facture n'existe, on envoie
     * quand même la demande de signature.
     */
    const { data: facture } =
      await supabase
        .from("factures")
        .select(
          `
            id,
            numero_facture,
            formulaire_id,
            cq_id,
            client_nom,
            client_courriel,
            client_adresse,
            client_ville,
            client_province,
            client_code_postal,
            description,
            quantite,
            prix_unitaire,
            sous_total,
            tps,
            tvq,
            total,
            montant_paye,
            mode_paiement,
            statut,
            date_facture
          `
        )
        .eq(
          "formulaire_id",
          signatureRequest.formulaire_id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle<FactureRow>();

    const totalFacture =
      toNumber(
        facture?.total
      );

    const montantPaye =
      toNumber(
        facture?.montant_paye
      );

    const solde =
      Math.max(
        0,
        Math.round(
          (
            totalFacture -
            montantPaye
          ) * 100
        ) / 100
      );

    const paiementRequis =
      Boolean(facture) &&
      facture?.statut !== "paid" &&
      solde > 0;

    let factureAttachment:
      | {
          filename: string;
          content: Buffer;
        }
      | null = null;

    if (
      facturePdfBase64.length >
      12_000_000
    ) {
      return json(400, {
        ok: false,
        error:
          "La facture PDF est trop volumineuse.",
      });
    }

    if (
      facture &&
      facturePdfBase64
    ) {
      const nomFacture =
        (
          facturePdfName ||
          facture.numero_facture ||
          "facture"
        )
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          )
          .replace(
            /_+/g,
            "_"
          );

      factureAttachment = {
        filename:
          nomFacture
            .toLowerCase()
            .endsWith(".pdf")
            ? nomFacture
            : `${nomFacture}.pdf`,
        content:
          Buffer.from(
            facturePdfBase64,
            "base64"
          ),
      };
    } else if (facture) {
      /*
       * Secours : on garde ton ancien générateur serveur.
       * Normalement le nouveau bouton envoie maintenant
       * le PDF original généré par @/lib/genererFacturePdf.
       */
      const {
        data: lignesFacture,
      } =
        await supabase
          .from("facture_lignes")
          .select(
            "description, quantite, prix_unitaire, montant, ordre"
          )
          .eq(
            "facture_id",
            facture.id
          )
          .order(
            "ordre",
            {
              ascending: true,
            }
          )
          .returns<FactureLigneRow[]>();

      const pdfFacture =
        await creerFacturePdf(
          facture,
          lignesFacture ?? []
        );

      const nomFacture =
        (
          facture.numero_facture ||
          "facture"
        ).replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );

      factureAttachment = {
        filename:
          `${nomFacture}.pdf`,
        content:
          pdfFacture,
      };
    }

    const resendApiKey =
      process.env.RESEND_API_KEY?.trim();

    if (!resendApiKey) {
      return json(500, {
        ok: false,
        error:
          "RESEND_API_KEY est manquante dans Vercel.",
      });
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://comptanetquebec.com"
    ).replace(/\/$/, "");

    const fromEmail =
      process.env.FROM_EMAIL?.trim() ||
      "ComptaNet Québec <info@comptanetquebec.com>";

    const replyTo =
      process.env.RESEND_REPLY_TO?.trim() ||
      undefined;

    const rawToken =
      randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() +
        LINK_VALID_DAYS *
          24 *
          60 *
          60 *
          1000
    ).toISOString();

    const { error: tokenError } =
      await supabase
        .from("signature_requests")
        .update({
          token_hash: tokenHash,
          expires_at: expiresAt,
        })
        .eq("id", requestId);

    if (tokenError) {
      return json(400, {
        ok: false,
        error: tokenError.message,
      });
    }

    const years = [
      ...new Set(
        documents
          .map((document) => Number(document.tax_year))
          .filter(Number.isFinite)
      ),
    ].sort((a, b) => a - b);

    const yearsText =
      years.length > 0
        ? years.join(", ")
        : "";

    const signingUrl =
      `${siteUrl}/signature/${rawToken}`;

    const paymentUrl =
      `${siteUrl}/paiement/solde?token=${encodeURIComponent(
        rawToken
      )}&lang=fr`;

    const interacUrl =
      `${paymentUrl}&view=interac`;

    const safeName = escapeHtml(
      signatureRequest.signer_name || "Client"
    );

    const cqId =
      facture?.cq_id ||
      "votre numéro de dossier";

    const invoiceNo =
      facture?.numero_facture ||
      "";

    const paymentHtml =
      paiementRequis
        ? `
          <div
            style="
              margin-top:28px;
              padding:20px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:12px;
            "
          >
            <h3
              style="
                margin:0 0 12px 0;
                color:#0f172a;
              "
            >
              Solde à payer : ${escapeHtml(
                money(solde)
              )}
            </h3>

            ${
              invoiceNo
                ? `<p style="margin:0 0 14px 0;color:#475569">
                    Facture ${escapeHtml(invoiceNo)}
                  </p>`
                : ""
            }

            <div
              style="
                padding:14px;
                background:#eff6ff;
                border-radius:10px;
                margin-bottom:14px;
              "
            >
              <strong>
                Virement Interac — recommandé
              </strong>
              <br>
              Montant :
              <strong>${escapeHtml(
                money(solde)
              )}</strong>
              <br>
              Envoyer à :
              <strong>
                comptanetquebec@gmail.com
              </strong>
              <br>
              ou au :
              <strong>
                581-985-2599
              </strong>
              <br>
              Dépôt automatique activé —
              aucune question de sécurité.
              <br>
              Message :
              <strong>${escapeHtml(
                cqId
              )}</strong>
            </div>

            <p style="margin:0">
              <a
                href="${interacUrl}"
                style="
                  display:inline-block;
                  padding:12px 18px;
                  margin-right:10px;
                  margin-bottom:10px;
                  background:#facc15;
                  color:#111827;
                  border-radius:10px;
                  text-decoration:none;
                  font-weight:700;
                "
              >
                Payer par Interac
              </a>

              <a
                href="${paymentUrl}"
                style="
                  display:inline-block;
                  padding:12px 18px;
                  margin-bottom:10px;
                  background:#1d4ed8;
                  color:#ffffff;
                  border-radius:10px;
                  text-decoration:none;
                  font-weight:700;
                "
              >
                Payer par carte
              </a>
            </p>
          </div>
        `
        : "";

    const html = `
      <div
        style="
          font-family:Arial,sans-serif;
          max-width:650px;
          margin:auto;
          color:#1e293b;
          line-height:1.6;
        "
      >
        <h2 style="color:#1d4ed8">
          ComptaNet Québec
        </h2>

        <p>Bonjour ${safeName},</p>

        <p>
          Des documents fiscaux sont prêts pour votre
          signature électronique${
            yearsText
              ? ` pour l’année ou les années ${yearsText}`
              : ""
          }.
        </p>

        <p>
          Utilisez le bouton ci-dessous pour consulter
          les documents et poursuivre la signature.
        </p>

        ${
          factureAttachment
            ? `<p>
                Votre facture est jointe à ce courriel en PDF.
              </p>`
            : ""
        }

        <p style="margin:24px 0">
          <a
            href="${signingUrl}"
            style="
              display:inline-block;
              padding:12px 18px;
              background:#7c3aed;
              color:#ffffff;
              border-radius:10px;
              text-decoration:none;
              font-weight:700;
            "
          >
            Consulter et signer
          </a>
        </p>

        ${paymentHtml}

        <p
          style="
            margin-top:24px;
            font-size:13px;
            color:#64748b;
          "
        >
          Le lien de signature et de paiement est
          personnel et expire dans
          ${LINK_VALID_DAYS} jours.
          Ne le transférez pas.
        </p>

        <p>
          Merci,<br>
          <strong>ComptaNet Québec</strong>
        </p>
      </div>
    `;

    const paymentText =
      paiementRequis
        ? (
            `\n\nSolde à payer : ${money(solde)}` +
            (invoiceNo
              ? `\nFacture : ${invoiceNo}`
              : "") +
            `\n\nVirement Interac — recommandé` +
            `\nMontant : ${money(solde)}` +
            `\nEnvoyer à : comptanetquebec@gmail.com` +
            `\nou au : 581-985-2599` +
            `\nDépôt automatique activé — aucune question de sécurité.` +
            `\nMessage : ${cqId}` +
            `\n\nPayer par Interac : ${interacUrl}` +
            `\nPayer par carte : ${paymentUrl}`
          )
        : "";

    const text =
      `Bonjour ${signatureRequest.signer_name},\n\n` +
      `Des documents fiscaux sont prêts pour votre signature` +
      (yearsText
        ? ` pour l’année ou les années ${yearsText}`
        : "") +
      `.\n\nConsulter et signer : ${signingUrl}` +
      paymentText +
      `\n\nCe lien expire dans ${LINK_VALID_DAYS} jours.\n\n` +
      `ComptaNet Québec`;

    const resend = new Resend(resendApiKey);

    const { data: emailData, error: emailError } =
      await resend.emails.send({
        from: fromEmail,
        to: email,
        replyTo,
        subject:
          paiementRequis
            ? "Documents à signer et solde à payer — ComptaNet Québec"
            : "Documents à signer — ComptaNet Québec",
        html,
        text,
        attachments:
          factureAttachment
            ? [
                factureAttachment,
              ]
            : undefined,
        tags: [
          {
            name: "type",
            value: "signature",
          },
        ],
      });

    if (emailError) {
      return json(400, {
        ok: false,
        error:
          emailError.message ||
          "Erreur pendant l’envoi du courriel.",
      });
    }

    const sentAt =
      new Date().toISOString();

    const { error: updateError } =
      await supabase
        .from("signature_requests")
        .update({
          status: "sent",
          sent_at: sentAt,
        })
        .eq("id", requestId);

    if (updateError) {
      return json(400, {
        ok: false,
        error: updateError.message,
      });
    }

    await supabase
      .from("signature_events")
      .insert({
        signature_request_id: requestId,
        signature_document_id: null,
        event_type: "email_sent",
        metadata: {
          email_id: emailData?.id ?? null,
          expires_at: expiresAt,
          tax_years: years,
          facture_id:
            facture?.id ?? null,
          facture_jointe:
            Boolean(
              factureAttachment
            ),
          renvoi:
            isResend,
          solde:
            paiementRequis
              ? solde
              : 0,
        },
      });

    return json(200, {
      ok: true,
      sentTo: email,
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
