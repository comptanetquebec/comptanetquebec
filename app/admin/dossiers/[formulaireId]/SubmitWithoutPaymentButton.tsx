"use client";

import React, { useState } from "react";

export default function SubmitWithoutPaymentButton({
  fid,
}: {
  fid: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    if (!fid) return;

    // mini confirmation
    const ok = window.confirm("Soumettre ce dossier sans paiement en ligne ?");
    if (!ok) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/dossiers/submit-without-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Erreur");

      setMsg("✅ Dossier soumis (sans paiement).");
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Erreur";
      setMsg("❌ " + m);
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
          loading ? "opacity-60" : "hover:bg-gray-50"
        }`}
      >
        {loading ? "Soumission..." : "Soumettre sans paiement (présentiel)"}
      </button>

      {msg ? <div className="text-sm text-gray-600 mt-2">{msg}</div> : null}
    </div>
  );
}
