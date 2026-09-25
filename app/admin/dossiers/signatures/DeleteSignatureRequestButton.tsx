"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  requestId: string;
  signerName: string;
};

export default function DeleteSignatureRequestButton({
  requestId,
  signerName,
}: Props) {
  const router = useRouter();

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleDelete() {
    if (deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        `Supprimer définitivement cette demande de signature de ${signerName} ?\n\n` +
          "Les PDF originaux, les PDF signés, la signature et l’historique de cette demande seront supprimés.\n\n" +
          "Utilise ceci seulement pour supprimer un test ou une demande créée par erreur."
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/signatures/delete",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              requestId,
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
            "Impossible de supprimer la demande."
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la demande."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() =>
          void handleDelete()
        }
        disabled={deleting}
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting
          ? "Suppression…"
          : "🗑️ Supprimer"}
      </button>

      {error && (
        <div className="max-w-xs text-right text-xs font-semibold text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
