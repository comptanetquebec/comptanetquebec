"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  requestId: string;
  status: string;
};

export default function SendSignatureButton({
  requestId,
  status,
}: Props) {
  const router = useRouter();

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isResend = status === "sent";

  async function send() {
    if (sending) return;

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/signatures/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Impossible d’envoyer la demande de signature."
        );
      }

      setMessage(
        isResend
          ? "✅ Courriel renvoyé."
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
        onClick={() => void send()}
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
            message.startsWith("✅")
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
