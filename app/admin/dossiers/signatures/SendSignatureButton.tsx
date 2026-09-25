"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  genererFacturePdf,
  type FacturePdf,
} from "@/lib/genererFacturePdf";

type Props = {
  requestId: string;
  status: string;
};

type PrepareResponse = {
  ok?: boolean;
  facture?: FacturePdf | null;
  error?: string;
};

function pdfFileName(
  numeroFacture:
    | string
    | null
    | undefined
) {
  const safe =
    (numeroFacture || "facture")
      .replace(
        /[^a-zA-Z0-9-_]/g,
        "_"
      );

  return `${safe}.pdf`;
}

export default function SendSignatureButton({
  requestId,
  status,
}: Props) {
  const router = useRouter();

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const isResend =
    status === "sent";

  async function send() {
    if (sending) return;

    setSending(true);
    setMessage(null);

    try {
      /*
       * 1. Récupérer la facture liée au dossier.
       */
      const prepareResponse =
        await fetch(
          `/api/signatures/send?requestId=${encodeURIComponent(
            requestId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const prepared =
        (await prepareResponse
          .json()
          .catch(
            () => null
          )) as PrepareResponse | null;

      if (
        !prepareResponse.ok ||
        !prepared?.ok
      ) {
        throw new Error(
          prepared?.error ||
            "Impossible de préparer l’envoi."
        );
      }

      let facturePdfBase64:
        | string
        | undefined;

      let facturePdfName:
        | string
        | undefined;

      /*
       * 2. Générer EXACTEMENT la même facture
       * que le bouton "Télécharger le PDF".
       */
      if (prepared.facture) {
        const generated =
          await genererFacturePdf(
            prepared.facture,
            "fr",
            "base64"
          );

        if (
          !generated ||
          typeof generated !==
            "string"
        ) {
          throw new Error(
            "Impossible de préparer la facture PDF."
          );
        }

        facturePdfBase64 =
          generated;

        facturePdfName =
          pdfFileName(
            prepared.facture
              .numero_facture
          );
      }

      /*
       * 3. Envoyer ou renvoyer la demande
       * avec la facture jointe.
       */
      const response =
        await fetch(
          "/api/signatures/send",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                requestId,
                facturePdfBase64,
                facturePdfName,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !data?.ok
      ) {
        throw new Error(
          data?.error ||
            "Impossible d’envoyer la demande de signature."
        );
      }

      setMessage(
        isResend
          ? prepared.facture
            ? "✅ Courriel renvoyé avec la facture."
            : "✅ Courriel renvoyé."
          : prepared.facture
          ? "✅ Courriel envoyé avec la facture."
          : "✅ Courriel envoyé."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        `❌ ${
          error instanceof Error
            ? error.message
            : "Erreur d’envoi."
        }`
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <button
        type="button"
        onClick={() =>
          void send()
        }
        disabled={sending}
        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending
          ? isResend
            ? "Renvoi en cours…"
            : "Envoi en cours…"
          : isResend
          ? "📧 Renvoyer la signature"
          : "📧 Envoyer pour signature"}
      </button>

      {message && (
        <div
          className={`text-xs font-semibold ${
            message.startsWith(
              "✅"
            )
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
