"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
const LANGS: Lang[] = ["fr", "en", "es"];

function getLang(params: URLSearchParams): Lang {
  const raw = (params.get("lang") || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(raw) ? (raw as Lang) : "fr";
}

type Answers = {
  multiIncomeSources: "oui" | "non" | ""; // plusieurs sources
  compiled: "oui" | "non" | ""; // revenus/dépenses compilés
  highVolume: "oui" | "non" | ""; // beaucoup de transactions
  gstqst: "oui" | "non" | ""; // TPS/TVQ
};

type Estimate = {
  rangeLabel: string; // "150–300" ou "300–800"
  note: string;
  score: number;
};

type Copy = {
  title: string;
  intro: string;
  mustLogin: string;

  q1: string;
  q2: string;
  q3: string;
  q4: string;

  yes: string;
  no: string;

  estimateTitle: string;
  estimateHint: string;

  save: string;
  saving: string;
  savedAt: string;

  back: string;

  errors: {
    generic: string;
    missing: string;
    save: string;
  };
};

const COPY: Record<Lang, Copy> = {
  fr: {
    title: "Devis rapide — Travailleur autonome",
    intro: "Répondez à 4 questions. Vous verrez une estimation immédiate, puis vous pouvez l’enregistrer.",
    mustLogin: "Redirection vers l’espace client…",
    q1: "Avez-vous plus d’une source de revenus (ex.: Uber + Etsy + contrats) ?",
    q2: "Vos revenus et dépenses sont-ils déjà compilés (totaux prêts) ?",
    q3: "Avez-vous beaucoup de transactions (plateformes, cartes, nombreuses factures) ?",
    q4: "Avez-vous besoin de la déclaration TPS/TVQ ?",
    yes: "Oui",
    no: "Non",
    estimateTitle: "Estimation",
    estimateHint: "Le prix final sera confirmé après validation complète du dossier.",
    save: "Enregistrer mon devis",
    saving: "Enregistrement…",
    savedAt: "Enregistré à",
    back: "Retour à l’espace client",
    errors: {
      generic: "Une erreur est survenue.",
      missing: "Veuillez répondre aux 4 questions.",
      save: "Impossible d’enregistrer votre devis.",
    },
  },
  en: {
    title: "Quick estimate — Self-employed",
    intro: "Answer 4 questions. You’ll get an instant estimate, then you can save it.",
    mustLogin: "Redirecting to client portal…",
    q1: "Do you have more than one income source (e.g., Uber + Etsy + contracts)?",
    q2: "Are your income and expenses already compiled (totals ready)?",
    q3: "Do you have a high volume of transactions (platforms, cards, many invoices)?",
    q4: "Do you need a GST/QST return?",
    yes: "Yes",
    no: "No",
    estimateTitle: "Estimate",
    estimateHint: "Final pricing will be confirmed after full file review.",
    save: "Save my estimate",
    saving: "Saving…",
    savedAt: "Saved at",
    back: "Back to client portal",
    errors: {
      generic: "Something went wrong.",
      missing: "Please answer all 4 questions.",
      save: "Could not save your estimate.",
    },
  },
  es: {
    title: "Estimación rápida — Autónomos",
    intro: "Responde 4 preguntas. Verás una estimación inmediata y podrás guardarla.",
    mustLogin: "Redirigiendo al área de cliente…",
    q1: "¿Tienes más de una fuente de ingresos (ej.: Uber + Etsy + contratos)?",
    q2: "¿Tus ingresos y gastos ya están compilados (totales listos)?",
    q3: "¿Tienes muchas transacciones (plataformas, tarjetas, muchas facturas)?",
    q4: "¿Necesitas declaración GST/QST?",
    yes: "Sí",
    no: "No",
    estimateTitle: "Estimación",
    estimateHint: "El precio final se confirmará tras revisar el expediente completo.",
    save: "Guardar mi estimación",
    saving: "Guardando…",
    savedAt: "Guardado a las",
    back: "Volver al área de cliente",
    errors: {
      generic: "Ocurrió un error.",
      missing: "Por favor responde las 4 preguntas.",
      save: "No se pudo guardar la estimación.",
    },
  },
};

function computeEstimate(a: Answers, lang: Lang): Estimate | null {
  const allAnswered =
    a.multiIncomeSources && a.compiled && a.highVolume && a.gstqst;

  if (!allAnswered) return null;

  // score simple → complexe
  // multi sources = +2
  // not compiled = +3
  // high volume = +2
  // gst/qst = +1
  let score = 0;
  if (a.multiIncomeSources === "oui") score += 2;
  if (a.compiled === "non") score += 3;
  if (a.highVolume === "oui") score += 2;
  if (a.gstqst === "oui") score += 1;

  const isComplex = score >= 4;

  const rangeLabel = isComplex ? "300 $ à 800 $" : "150 $ à 300 $";

  const noteByLang: Record<Lang, string> = {
    fr: "Le prix final dépend des pièces, du volume et des particularités (inventaire, amortissement, etc.).",
    en: "Final pricing depends on documents, volume, and specifics (inventory, depreciation, etc.).",
    es: "El precio final depende de los documentos, el volumen y detalles (inventario, amortización, etc.).",
  };

  return { rangeLabel, note: noteByLang[lang], score };
}

export default function DevisAutonomePage() {
  const router = useRouter();
  const params = useSearchParams();

  const lang = useMemo(() => getLang(new URLSearchParams(params.toString())), [params]);
  const t = COPY[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [answers, setAnswers] = useState<Answers>({
    multiIncomeSources: "",
    compiled: "",
    highVolume: "",
    gstqst: "",
  });

  const estimate = useMemo(() => computeEstimate(answers, lang), [answers, lang]);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        // adapte ici si ta route de login est différente
        router.replace(`/espace-client?lang=${lang}&next=/espace-client/devis-autonome`);
        return;
      }

      setUid(user.id);
      setChecking(false);
    })();
  }, [router, lang]);

  const setField = useCallback(<K extends keyof Answers>(k: K, v: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [k]: v }));
  }, []);

  const canSave =
    !!estimate &&
    answers.multiIncomeSources !== "" &&
    answers.compiled !== "" &&
    answers.highVolume !== "" &&
    answers.gstqst !== "";

  const save = useCallback(async () => {
    try {
      if (!uid) return;
      if (!canSave || !estimate) {
        alert(t.errors.missing);
        return;
      }

      setSaving(true);

      // ✅ Table Supabase: self_employed_quotes (SQL plus bas)
      const payload = {
        user_id: uid,
        lang,
        answers,
        estimate_range: estimate.rangeLabel,
        estimate_score: estimate.score,
        created_at_client: new Date().toISOString(),
      };

      const { error } = await supabase.from("self_employed_quotes").insert(payload);
      if (error) throw error;

      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
      alert(t.errors.save);
    } finally {
      setSaving(false);
    }
  }, [uid, canSave, estimate, answers, lang, t.errors.missing, t.errors.save]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">{t.mustLogin}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{t.intro}</p>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/espace-client?lang=${lang}`)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t.back}
            </button>
          </div>

          <div className="mt-6 grid gap-5">
            <YesNo
              label={t.q1}
              value={answers.multiIncomeSources}
              yesLabel={t.yes}
              noLabel={t.no}
              onChange={(v) => setField("multiIncomeSources", v)}
            />
            <YesNo
              label={t.q2}
              value={answers.compiled}
              yesLabel={t.yes}
              noLabel={t.no}
              onChange={(v) => setField("compiled", v)}
            />
            <YesNo
              label={t.q3}
              value={answers.highVolume}
              yesLabel={t.yes}
              noLabel={t.no}
              onChange={(v) => setField("highVolume", v)}
            />
            <YesNo
              label={t.q4}
              value={answers.gstqst}
              yesLabel={t.yes}
              noLabel={t.no}
              onChange={(v) => setField("gstqst", v)}
            />

            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-900">{t.estimateTitle}</div>
              {!estimate ? (
                <div className="mt-2 text-sm text-slate-600">—</div>
              ) : (
                <>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">
                    {estimate.rangeLabel}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">{t.estimateHint}</div>
                  <div className="mt-2 text-xs text-slate-500">{estimate.note}</div>
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={!uid || saving || !canSave}
                className="rounded-lg bg-[#004aad] px-4 py-2 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
              >
                {saving ? t.saving : t.save}
              </button>

              {savedAt && (
                <span className="text-sm text-green-700">
                  {t.savedAt}{" "}
                  {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function YesNo({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: "oui" | "non" | "";
  onChange: (v: "oui" | "non") => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <div className="mt-3 flex gap-6 text-sm text-slate-700">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={label}
            value="oui"
            checked={value === "oui"}
            onChange={() => onChange("oui")}
          />
          <span>{yesLabel}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={label}
            value="non"
            checked={value === "non"}
            onChange={() => onChange("non")}
          />
          <span>{noLabel}</span>
        </label>
      </div>
    </div>
  );
}
