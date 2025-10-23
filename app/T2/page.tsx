"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Types ---------- */
type Lang = "fr" | "en" | "es";

interface FormData {
  companyName: string;
  year: number;
  revenue: string;
  expenses: string;
  notes: string;
}

interface SaveRow {
  user_id: string;
  year: number;
  payload: FormData;
}

/* ---------- Traductions ---------- */
const I18N: Record<Lang, Record<string, string>> = {
  fr: {
    title: "Déclaration T2 (Société)",
    intro: "Remplissez les informations de votre société et enregistrez.",
    company: "Nom de l’entreprise",
    year: "Année d’imposition",
    revenue: "Revenus",
    expenses: "Dépenses",
    notes: "Notes",
    save: "Enregistrer",
    saving: "Enregistrement…",
    savedAt: "Sauvegardé à",
    back: "Retour aux dossiers",
    mustLogin: "Redirection vers l’espace client…",
  },
  en: {
    title: "T2 Corporate Return",
    intro: "Fill in your corporation details and save.",
    company: "Company name",
    year: "Tax year",
    revenue: "Revenue",
    expenses: "Expenses",
    notes: "Notes",
    save: "Save",
    saving: "Saving…",
    savedAt: "Saved at",
    back: "Back to files",
    mustLogin: "Redirecting to client area…",
  },
  es: {
    title: "Declaración T2 (Sociedad)",
    intro: "Complete los datos de su sociedad y guarde.",
    company: "Nombre de la empresa",
    year: "Año fiscal",
    revenue: "Ingresos",
    expenses: "Gastos",
    notes: "Notas",
    save: "Guardar",
    saving: "Guardando…",
    savedAt: "Guardado a las",
    back: "Volver a expedientes",
    mustLogin: "Redirigiendo al área de cliente…",
  },
};

/* ---------- Composant principal ---------- */
export default function T2Page() {
  const router = useRouter();
  const params = useSearchParams();

  // Langue via ?lang=fr|en|es
  const urlLang = (params.get("lang") || "fr").toLowerCase();
  const lang: Lang = ["fr", "en", "es"].includes(urlLang) ? (urlLang as Lang) : "fr";
  const t = I18N[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    companyName: "",
    year: new Date().getFullYear() - 1,
    revenue: "",
    expenses: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  /* ---------- Vérification Auth + Brouillon ---------- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.replace(`/espace-client?lang=${lang}&next=/T2`);
        return;
      }
      setUid(user.id);

      // charge le dernier brouillon
      const { data: rows } = await supabase
        .from("t2_forms")
        .select("payload, year")
        .eq("user_id", user.id)
        .eq("year", form.year)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (rows && rows[0]?.payload) {
        setForm(rows[0].payload as FormData);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, lang]);

  /* ---------- Helpers ---------- */
  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const save = useCallback(async () => {
    if (!uid) return;
    setSaving(true);

    const row: SaveRow = {
      user_id: uid,
      year: form.year,
      payload: form,
    };

    await supabase.from("t2_forms").upsert(row);
    setSavedAt(new Date());
    setSaving(false);
  }, [uid, form]);

  /* ---------- Interface ---------- */
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <button
            className="btn btn-outline"
            onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}
          >
            {t.back}
          </button>
        </header>

        {!uid && (
          <p className="text-sm text-gray-600 mb-4">{t.mustLogin}</p>
        )}

        <p className="text-gray-600 mb-6">{t.intro}</p>

        <div className="grid gap-5 bg-white p-5 rounded shadow-sm border">
          <label className="block">
            <span className="text-sm font-medium">{t.company}</span>
            <input
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Ex.: 1234-5678 Québec inc."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.year}</span>
            <input
              type="number"
              value={form.year}
              onChange={(e) =>
                setField("year", parseInt(e.target.value || "0", 10) || form.year)
              }
              className="mt-1 w-40 rounded border px-3 py-2"
              min={1990}
              max={9999}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.revenue}</span>
            <input
              value={form.revenue}
              onChange={(e) => setField("revenue", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Ex.: 250000"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.expenses}</span>
            <input
              value={form.expenses}
              onChange={(e) => setField("expenses", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Ex.: 120000"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.notes}</span>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Informations complémentaires (banque, exercice décalé, etc.)"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !uid}
            className="btn btn-primary"
          >
            {saving ? t.saving : t.save}
          </button>
          {savedAt && (
            <span className="text-sm text-green-700">
              {t.savedAt} {savedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
