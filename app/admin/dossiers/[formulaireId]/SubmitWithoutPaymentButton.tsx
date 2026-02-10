"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitWithoutPaymentButton({
  fid,
}: {
  fid: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    if (!fid) return;

    const confirm = window.confirm(
      "Soumettre ce dossier sans paiement en ligne ?"
    );
    if (!confirm) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(
        "/api/admin/dossiers/submit-without-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de la soumission");
      }

      setMsg("✅ Dossier soumis sans paiement.");
      router.refresh(); // rafraîchit statut + UI admin
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue";
      setMsg("❌ " + message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className={`border rounded px-3 py-2 text-sm ${
          loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
        }`}
      >
        {loading
          ? "Soumission en cours…"
          : "Soumettre sans paiement (présentiel)"}
      </button>

      {msg && (
        <div className="mt-2 text-sm text-gray-600">
          {msg}
        </div>
      )}
    </div>
  );
}
