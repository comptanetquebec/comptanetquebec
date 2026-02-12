"use client";

import React, { useMemo, useState } from "react";
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

const FLOW_LABEL: Record<Flow, { title: string; desc: string }> = {
  t1: { title: "T1", desc: "Impôt personnel (Québec)" },
  ta: { title: "TA", desc: "Travailleur autonome" },
  t2: { title: "T2", desc: "Société (T2 + CO-17)" },
};

const LANG_LABEL: Record<Lang, string> = {
  fr: "Français (FR)",
  en: "English (EN)",
  es: "Español (ES)",
};

function formUrl(flow: Flow, fid: string, lang: Lang) {
  const base =
    flow === "t1"
      ? "/formulaire-fiscal-presentiel-t1"
      : flow === "ta"
      ? "/formulaire-fiscal-presentiel-ta"
      : "/formulaire-fiscal-presentiel-t2";

  const q = new URLSearchParams({
    fid,
    lang,
  });

  return `${base}?${q.toString()}`;
}

export default function AdminPresentielPage() {
  const router = useRouter();
  const params = useSearchParams();

  const initialFlow = useMemo(() => normalizeFlow(params.get("flow")), [params]);

  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [email, setEmail] = useState("");
  const [lang, setLang] = useState<Lang>("fr");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(
    null
  );

  const emailOk = isValidEmail(email);

  async function create() {
    const e = normalizeEmail(email);
    if (!isValidEmail(e)) {
      setMsg({ type: "error", text: "Email invalide." });
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
        id?: string; // ✅ ton API renvoie { id }
        fid?: string; // au cas où
        error?: string;
      };

      const fid = data.id ?? data.fid;
      if (!res.ok || !fid) {
        throw new Error(data?.error || "Erreur création dossier");
      }

      setMsg({ type: "ok", text: "Dossier créé. Ouverture du formulaire…" });

      router.push(formUrl(flow, fid, lang));
      router.refresh();
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Erreur";
      setMsg({ type: "error", text });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full px-4 py-10 bg-gray-50">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Créer un dossier (présentiel)
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Crée un dossier et ouvre le formulaire immédiatement —{" "}
            <span className="font-medium">sans paiement en ligne</span>.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="p-6">
            {/* Flow selector */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Type de dossier
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["t1", "ta", "t2"] as Flow[]).map((k) => {
                  const active = flow === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFlow(k)}
                      className={[
                        "rounded-xl border p-4 text-left transition",
                        active
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <div className="text-lg font-bold">{FLOW_LABEL[k].title}</div>
                      <div
                        className={[
                          "mt-1 text-sm",
                          active ? "text-white/80" : "text-gray-600",
                        ].join(" ")}
                      >
                        {FLOW_LABEL[k].desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email du client
                </label>
                <input
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-base",
                    email.length === 0
                      ? "border-gray-200"
                      : emailOk
                      ? "border-gray-300"
                      : "border-red-400",
                  ].join(" ")}
                  placeholder="ex: client@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  inputMode="email"
                  autoComplete="email"
                />
                {!emailOk && email.length > 0 ? (
                  <div className="mt-2 text-sm text-red-600">
                    Entre un email valide.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Langue du formulaire
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base"
                  value={lang}
                  onChange={(e) => setLang(e.currentTarget.value as Lang)}
                >
                  <option value="fr">{LANG_LABEL.fr}</option>
                  <option value="en">{LANG_LABEL.en}</option>
                  <option value="es">{LANG_LABEL.es}</option>
                </select>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  Sélection:{" "}
                  <span className="font-semibold">{FLOW_LABEL[flow].title}</span>{" "}
                  — {FLOW_LABEL[flow].desc}
                </div>

                <button
                  type="button"
                  onClick={create}
                  disabled={loading || !emailOk}
                  className={[
                    "rounded-xl px-5 py-3 text-base font-semibold border transition",
                    loading || !emailOk
                      ? "opacity-60 cursor-not-allowed bg-white"
                      : "bg-black text-white border-black hover:opacity-90",
                  ].join(" ")}
                >
                  {loading ? "Création…" : "Créer et ouvrir"}
                </button>
              </div>

              {/* Message */}
              {msg ? (
                <div
                  className={[
                    "mt-2 rounded-xl border px-4 py-3 text-sm",
                    msg.type === "ok"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800",
                  ].join(" ")}
                >
                  {msg.text}
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 text-sm text-gray-600">
            Astuce : tu peux garder cette page ouverte et créer plusieurs dossiers
            rapidement (un client après l’autre).
          </div>
        </div>
      </div>
    </div>
  );
}
