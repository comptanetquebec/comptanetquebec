"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Flow = "t1" | "ta" | "t2";
type Lang = "fr" | "en" | "es";

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}
function isValidEmail(v: string) {
  const x = normalizeEmail(v);
  return x.length >= 6 && x.includes("@") && x.includes(".");
}
function normalizeFlow(v: string | null): Flow {
  return v === "ta" || v === "t2" ? v : "t1";
}

export default function AdminPresentielPage() {
  const router = useRouter();
  const params = useSearchParams();

  const flow = useMemo(() => normalizeFlow(params.get("flow")), [params]);

  const [email, setEmail] = useState("");
  const [lang, setLang] = useState<Lang>("fr");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    const e = normalizeEmail(email);
    if (!isValidEmail(e)) {
      setMsg("Email invalide.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/create-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, flow, lang }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        fid?: string;
        error?: string;
      };

      if (!res.ok || !data?.fid) throw new Error(data?.error || "Erreur création");

      // ➜ Ouvre directement le bon formulaire (sans Stripe)
      if (flow === "t1") router.push(`/formulaire-fiscal?fid=${encodeURIComponent(data.fid)}&lang=${lang}`);
      else if (flow === "ta") router.push(`/formulaire-fiscal-ta?fid=${encodeURIComponent(data.fid)}&lang=${lang}`);
      else router.push(`/formulaire-fiscal-t2?fid=${encodeURIComponent(data.fid)}&lang=${lang}`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erreur");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Créer dossier (présentiel)</h1>
      <p className="text-sm text-gray-600 mb-4">
        Flow: <span className="font-semibold">{flow.toUpperCase()}</span> — aucun paiement en ligne.
      </p>

      <div className="grid gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Email du client"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          inputMode="email"
        />

        <select
          className="border rounded px-3 py-2"
          value={lang}
          onChange={(e) => setLang(e.currentTarget.value as Lang)}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>

        <button
          className="border rounded px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
          onClick={create}
          disabled={loading || !isValidEmail(email)}
        >
          {loading ? "Création…" : "Créer et ouvrir le formulaire"}
        </button>

        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </div>
    </div>
  );
}
