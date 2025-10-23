"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];
type T1Type = "salarie" | "autonome";
type FormStatus = "draft" | "submitted" | "processing" | "done";

type StoredFile = {
  name: string;
  created_at?: string;
  updated_at?: string;
  size?: number;
  metadata?: any;
};

const I18N: Record<Lang, any> = {
  fr: {
    title_salarie: "Déclaration T1 — Particulier",
    title_auto: "Déclaration T1 — Travailleur autonome",
    intro_salarie: "Remplissez vos informations T1 (salarié).",
    intro_auto: "Remplissez vos informations T1 (travailleur autonome).",
    year: "Année d'imposition",
    employment: "Revenus d'emploi (T4)",
    rrsp: "Cotisations REER",
    notes: "Notes",
    biz_rev: "Revenus d'entreprise (autonome)",
    biz_exp: "Dépenses d'entreprise",
    saving: "Enregistrement…",
    saved: "Enregistré",
    logout: "Se déconnecter",
    back: "Retour à l'accueil dossiers",

    // Upload
    upload_title: "Pièces jointes",
    upload_hint: "Déposez vos relevés (PDF, JPG, PNG). Taille max typique 10 Mo.",
    choose_files: "Choisir des fichiers",
    uploading: "Téléversement…",
    files: "Fichiers",
    download: "Télécharger",
    remove: "Supprimer",
    empty_files: "Aucun fichier téléversé pour cette année.",
    up_ok: "Fichier téléversé.",
    up_err: "Erreur de téléversement.",
    del_ok: "Fichier supprimé.",
    del_err: "Erreur de suppression.",

    // Submission
    submit: "Soumettre",
    submitted_badge: "Soumis",
    submitted_info:
      "Votre dossier a été soumis. Le formulaire et les pièces sont maintenant verrouillés.",
    submit_confirm_title: "Confirmer la soumission",
    submit_confirm_text:
      "Une fois soumis, vous ne pourrez plus modifier ce dossier. Confirmez-vous la soumission ?",
    submit_ok: "Dossier soumis.",
    submit_err: "Impossible de soumettre le dossier.",
    validate_err_year: "Veuillez saisir une année valide (>= 2000).",
    validate_err_emp: "Veuillez saisir vos revenus d'emploi (T4).",
    validate_err_biz: "Veuillez saisir vos revenus d'entreprise (autonome).",
  },
  en: {
    title_salarie: "T1 Return — Personal",
    title_auto: "T1 Return — Self-employed",
    intro_salarie: "Fill your T1 information (employee).",
    intro_auto: "Fill your T1 information (self-employed).",
    year: "Tax year",
    employment: "Employment income (T4)",
    rrsp: "RRSP contributions",
    notes: "Notes",
    biz_rev: "Business income (self-employed)",
    biz_exp: "Business expenses",
    saving: "Saving…",
    saved: "Saved",
    logout: "Log out",
    back: "Back to files hub",

    // Upload
    upload_title: "Attachments",
    upload_hint: "Upload your slips (PDF, JPG, PNG). Typical max size 10 MB.",
    choose_files: "Choose files",
    uploading: "Uploading…",
    files: "Files",
    download: "Download",
    remove: "Delete",
    empty_files: "No files uploaded for this year.",
    up_ok: "File uploaded.",
    up_err: "Upload error.",
    del_ok: "File deleted.",
    del_err: "Delete error.",

    // Submission
    submit: "Submit",
    submitted_badge: "Submitted",
    submitted_info:
      "Your file has been submitted. The form and attachments are now locked.",
    submit_confirm_title: "Confirm submission",
    submit_confirm_text:
      "After submission, you won’t be able to edit this file. Do you confirm?",
    submit_ok: "File submitted.",
    submit_err: "Could not submit the file.",
    validate_err_year: "Please enter a valid year (>= 2000).",
    validate_err_emp: "Please enter your employment income (T4).",
    validate_err_biz: "Please enter your business income (self-employed).",
  },
  es: {
    title_salarie: "Declaración T1 — Persona",
    title_auto: "Declaración T1 — Autónomo",
    intro_salarie: "Complete su T1 (empleado).",
    intro_auto: "Complete su T1 (autónomo).",
    year: "Año fiscal",
    employment: "Ingresos laborales (T4)",
    rrsp: "Aportes RRSP",
    notes: "Notas",
    biz_rev: "Ingresos de negocio (autónomo)",
    biz_exp: "Gastos de negocio",
    saving: "Guardando…",
    saved: "Guardado",
    logout: "Cerrar sesión",
    back: "Volver al inicio de expedientes",

    // Upload
    upload_title: "Adjuntos",
    upload_hint: "Suba sus comprobantes (PDF, JPG, PNG). Tamaño máx. típico 10 MB.",
    choose_files: "Elegir archivos",
    uploading: "Subiendo…",
    files: "Archivos",
    download: "Descargar",
    remove: "Eliminar",
    empty_files: "No hay archivos subidos para este año.",
    up_ok: "Archivo subido.",
    up_err: "Error al subir.",
    del_ok: "Archivo eliminado.",
    del_err: "Error al eliminar.",

    // Submission
    submit: "Enviar",
    submitted_badge: "Enviado",
    submitted_info:
      "Su expediente ha sido enviado. El formulario y los adjuntos están bloqueados.",
    submit_confirm_title: "Confirmar envío",
    submit_confirm_text:
      "Después del envío, no podrá editar este expediente. ¿Confirma?",
    submit_ok: "Expediente enviado.",
    submit_err: "No se pudo enviar el expediente.",
    validate_err_year: "Ingrese un año válido (>= 2000).",
    validate_err_emp: "Ingrese sus ingresos laborales (T4).",
    validate_err_biz: "Ingrese sus ingresos de negocio (autónomo).",
  },
};

export default function FormulaireFiscalPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // Langue
  const urlLang = (sp.get("lang") || "").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(urlLang)
    ? (urlLang as Lang)
    : "fr";
  const t = I18N[lang];

  // Type: salarié par défaut ; autonome avec ?type=autonome
  const typeParam = (sp.get("type") || "salarie").toLowerCase();
  const t1Type: T1Type = typeParam === "autonome" ? "autonome" : "salarie";

  // Auth
  const [email, setEmail] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // Form data
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [employmentIncome, setEmploymentIncome] = useState<string>("");
  const [rrsp, setRrsp] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [bizIncome, setBizIncome] = useState<string>("");
  const [bizExpenses, setBizExpenses] = useState<string>("");

  // State
  const [status, setStatus] = useState<FormStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const debounceRef = useRef<any>(null);

  // Upload state
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const locked = status !== "draft";

  // Protection
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        const suffix = t1Type === "autonome" ? "?type=autonome" : "";
        router.replace(`/espace-client?lang=${lang}&next=/formulaire-fiscal${suffix}`);
        return;
      }
      setEmail(u.email ?? null);
      setUid(u.id);
    })();
  }, [router, lang, t1Type]);

  // Charger brouillon/ligne existante
  useEffect(() => {
    (async () => {
      if (!uid) return;

      const { data, error } = await supabase
        .from("tax_forms")
        .select("id, payload, status")
        .eq("user_id", uid)
        .eq("year", year)
        .contains("payload", { type: t1Type })
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) return;

      if (data && data.length > 0) {
        const row = data[0];
        setRowId(row.id);
        setStatus((row.status as FormStatus) || "draft");
        const p = (row.payload || {}) as any;
        setEmploymentIncome(p.employmentIncome || "");
        setRrsp(p.rrsp || "");
        setNotes(p.notes || "");
        setBizIncome(p.bizIncome || "");
        setBizExpenses(p.bizExpenses || "");
      } else {
        setRowId(null);
        setStatus("draft");
        setEmploymentIncome("");
        setRrsp("");
        setNotes("");
        setBizIncome("");
        setBizExpenses("");
      }
    })();
  }, [uid, year, t1Type]);

  // Lister fichiers
  useEffect(() => {
    listFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, year]);

  function queueSave() {
    if (locked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNow, 700);
  }

  async function saveNow() {
    if (!uid || locked) return;
    setSaving(true);
    setError(null);

    const payload = {
      type: t1Type,
      employmentIncome,
      rrsp,
      notes,
      bizIncome,
      bizExpenses,
    };

    if (rowId) {
      const { error } = await supabase.from("tax_forms").update({ payload }).eq("id", rowId);
      if (!error) setSavedAt(new Date());
    } else {
      const { data, error } = await supabase
        .from("tax_forms")
        .insert({ user_id: uid, year, payload, status: "draft" })
        .select("id")
        .single();
      if (!error && data) {
        setRowId(data.id);
        setSavedAt(new Date());
      }
    }

    setSaving(false);
  }

  // Validation minimale pour soumission
  function validateBeforeSubmit(): string | null {
    if (!year || year < 2000) return t.validate_err_year;
    if (t1Type === "salarie") {
      if (!String(employmentIncome || "").trim()) return t.validate_err_emp;
    } else {
      if (!String(bizIncome || "").trim()) return t.validate_err_biz;
    }
    return null;
  }

  async function handleSubmit() {
    setError(null);
    setInfo(null);

    const err = validateBeforeSubmit();
    if (err) {
      setError(err);
      return;
    }

    const confirmed = window.confirm(`${t.submit_confirm_title}\n\n${t.submit_confirm_text}`);
    if (!confirmed) return;

    // S'assurer que la ligne existe et est à jour
    await saveNow();

    // Créer si besoin
    let id = rowId;
    if (!id) {
      const payload = {
        type: t1Type,
        employmentIncome,
        rrsp,
        notes,
        bizIncome,
        bizExpenses,
      };
      const { data, error } = await supabase
        .from("tax_forms")
        .insert({ user_id: uid, year, payload, status: "draft" })
        .select("id")
        .single();
      if (error || !data) {
        setError(t.submit_err);
        return;
      }
      id = data.id;
      setRowId(id);
    }

    // Passer en submitted
    const { error } = await supabase
      .from("tax_forms")
      .update({ status: "submitted" })
      .eq("id", id as string);

    if (error) {
      setError(t.submit_err);
      return;
    }

    setStatus("submitted");
    setInfo(t.submit_ok);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${lang}`);
  }

  // ---------- Upload ----------
  function folderPath() {
    return `user-${uid}/${year}`;
  }

  async function listFiles() {
    if (!uid) return;
    const path = folderPath();

    const { data, error } = await supabase.storage
      .from("client-files")
      .list(path, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) return;
    setFiles((data || []) as StoredFile[]);
  }

  async function onChooseFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || !uid || locked) return;

    setUploading(true);
    const bucket = supabase.storage.from("client-files");
    const base = folderPath();

    for (const f of Array.from(fileList)) {
      const okType =
        f.type === "application/pdf" ||
        f.type === "image/jpeg" ||
        f.type === "image/png";
      if (!okType) continue;

      const path = `${base}/${crypto.randomUUID()}-${f.name}`;
      const { error } = await bucket.upload(path, f, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        setToast(t.up_err);
      } else {
        setToast(t.up_ok);
      }
    }

    setUploading(false);
    await listFiles();
    e.target.value = "";
  }

  async function download(name: string) {
    if (!uid) return;
    const path = `${folderPath()}/${name}`;
    const { data, error } = await supabase.storage
      .from("client-files")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove(name: string) {
    if (!uid || locked) return;
    const path = `${folderPath()}/${name}`;
    const { error } = await supabase.storage.from("client-files").remove([path]);
    if (error) setToast(t.del_err);
    else {
      setToast(t.del_ok);
      await listFiles();
    }
  }

  const title = useMemo(
    () => (t1Type === "autonome" ? t.title_auto : t.title_salarie),
    [t1Type, t]
  );
  const intro = useMemo(
    () => (t1Type === "autonome" ? t.intro_auto : t.intro_salarie),
    [t1Type, t]
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-3">
            {title}
            {locked && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                {t.submitted_badge}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 text-sm">
            {saving ? <span>{t.saving}</span> : savedAt ? <span>{t.saved}</span> : null}
            <button
              className="btn btn-outline"
              onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}
            >
              {t.back}
            </button>
            <button className="btn btn-outline" onClick={logout}>
              {t.logout}
            </button>
          </div>
        </header>

        {/* Info état */}
        {locked && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t.submitted_info}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {info}
          </div>
        )}

        <p className="text-gray-600 mb-4">{intro}</p>

        {/* --- Formulaire --- */}
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-medium">{t.year}</span>
            <input
              type="number"
              value={year}
              disabled={locked}
              onChange={(e) => {
                const v = parseInt(e.target.value || "0", 10);
                if (!Number.isNaN(v)) setYear(v);
              }}
              className="mt-1 w-40 rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.employment}</span>
            <input
              value={employmentIncome}
              disabled={locked}
              onChange={(e) => {
                setEmploymentIncome(e.target.value);
                queueSave();
              }}
              placeholder="ex. 48 500"
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.rrsp}</span>
            <input
              value={rrsp}
              disabled={locked}
              onChange={(e) => {
                setRrsp(e.target.value);
                queueSave();
              }}
              placeholder="ex. 2 000"
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          {t1Type === "autonome" && (
            <>
              <label className="block">
                <span className="text-sm font-medium">{t.biz_rev}</span>
                <input
                  value={bizIncome}
                  disabled={locked}
                  onChange={(e) => {
                    setBizIncome(e.target.value);
                    queueSave();
                  }}
                  placeholder="ex. 22 000"
                  className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">{t.biz_exp}</span>
                <input
                  value={bizExpenses}
                  disabled={locked}
                  onChange={(e) => {
                    setBizExpenses(e.target.value);
                    queueSave();
                  }}
                  placeholder="ex. 6 500"
                  className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="text-sm font-medium">{t.notes}</span>
            <textarea
              value={notes}
              disabled={locked}
              onChange={(e) => {
                setNotes(e.target.value);
                queueSave();
              }}
              rows={4}
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>
        </div>

        {/* --- Upload de pièces --- */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t.upload_title}</h2>
          <p className="text-sm text-gray-600 mb-2">{t.upload_hint}</p>

          <label className={`inline-flex items-center gap-2 ${locked ? "opacity-60" : ""}`}>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={onChooseFiles}
              disabled={uploading || !uid || locked}
              className="hidden"
              id="file-input"
            />
            <span className="btn btn-outline">
              <label htmlFor="file-input" className="cursor-pointer">
                {uploading ? t.uploading : t.choose_files}
              </label>
            </span>
          </label>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">{t.files}</h3>
            {files.length === 0 ? (
              <p className="text-sm text-gray-500">{t.empty_files}</p>
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between rounded border bg-white px-3 py-2"
                  >
                    <div className="truncate">
                      <span className="text-sm">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-outline" onClick={() => download(f.name)}>
                        {t.download}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => remove(f.name)}
                        disabled={locked}
                        title={locked ? t.submitted_info : ""}
                      >
                        {t.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {toast && <p className="mt-2 text-sm text-gray-700">{toast}</p>}
        </section>

        {/* --- Actions --- */}
        <div className="mt-8 flex items-center gap-3">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={locked}
            title={locked ? t.submitted_info : ""}
          >
            {t.submit}
          </button>
        </div>
      </div>
    </main>
  );
}
