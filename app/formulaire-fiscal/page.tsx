"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { jsPDF } from "jspdf";

/* =========================
   Types & constantes
   ========================= */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];
type T1Type = "salarie" | "autonome";
type FormStatus = "draft" | "submitted";

type Row = {
  id: string;
  user_id: string;
  tax_year: number;
  form_type: "T1" | "T2";
  status: FormStatus;
  data: any;
};

type StoredFile = { name: string; id?: string; created_at?: string; };

const TABLE = "formulaires_fiscaux";
const BUCKET = "client-files";

/* =========================
   I18N minimal
   ========================= */
const I18N: Record<Lang, any> = {
  fr: {
    title_salarie: "Déclaration T1 — Particulier",
    title_auto: "Déclaration T1 — Travailleur autonome",
    intro_salarie: "Remplissez vos informations T1 (salarié).",
    intro_auto: "Remplissez vos informations T1 (travailleur autonome).",
    year: "Année d'imposition",
    emp: "Revenus d'emploi (T4)",
    rrsp: "Cotisations REER",
    notes: "Notes",
    biz_rev: "Revenus d'entreprise",
    biz_exp: "Dépenses d'entreprise",
    saving: "Enregistrement…",
    saved: "Enregistré",
    logout: "Se déconnecter",
    back: "Retour aux dossiers",
    upload_title: "Pièces jointes",
    upload_hint: "Téléversez vos relevés (PDF, JPG, PNG).",
    choose: "Choisir des fichiers",
    uploading: "Téléversement…",
    files: "Fichiers",
    empty_files: "Aucun fichier pour cette année.",
    download: "Télécharger",
    remove: "Supprimer",
    submit: "Soumettre",
    confirm_submit:
      "Une fois soumis, le dossier sera verrouillé. Confirmez-vous la soumission ?",
    submitted: "Soumis",
    submitted_info:
      "Dossier soumis : le formulaire et les pièces sont maintenant verrouillés.",
    recap: "Télécharger le récapitulatif PDF",
  },
  en: {
    title_salarie: "T1 Return — Personal",
    title_auto: "T1 Return — Self-employed",
    intro_salarie: "Fill your T1 information (employee).",
    intro_auto: "Fill your T1 information (self-employed).",
    year: "Tax year",
    emp: "Employment income (T4)",
    rrsp: "RRSP contributions",
    notes: "Notes",
    biz_rev: "Business income",
    biz_exp: "Business expenses",
    saving: "Saving…",
    saved: "Saved",
    logout: "Log out",
    back: "Back to files",
    upload_title: "Attachments",
    upload_hint: "Upload your slips (PDF, JPG, PNG).",
    choose: "Choose files",
    uploading: "Uploading…",
    files: "Files",
    empty_files: "No file for this year.",
    download: "Download",
    remove: "Delete",
    submit: "Submit",
    confirm_submit:
      "Once submitted, your file will be locked. Do you confirm?",
    submitted: "Submitted",
    submitted_info:
      "File submitted: the form and attachments are now locked.",
    recap: "Download PDF Summary",
  },
  es: {
    title_salarie: "Declaración T1 — Persona",
    title_auto: "Declaración T1 — Autónomo",
    intro_salarie: "Complete su T1 (empleado).",
    intro_auto: "Complete su T1 (autónomo).",
    year: "Año fiscal",
    emp: "Ingresos laborales (T4)",
    rrsp: "Aportes RRSP",
    notes: "Notas",
    biz_rev: "Ingresos de negocio",
    biz_exp: "Gastos de negocio",
    saving: "Guardando…",
    saved: "Guardado",
    logout: "Cerrar sesión",
    back: "Volver a expedientes",
    upload_title: "Adjuntos",
    upload_hint: "Suba comprobantes (PDF, JPG, PNG).",
    choose: "Elegir archivos",
    uploading: "Subiendo…",
    files: "Archivos",
    empty_files: "No hay archivos.",
    download: "Descargar",
    remove: "Eliminar",
    submit: "Enviar",
    confirm_submit:
      "Una vez enviado, el expediente quedará bloqueado. ¿Confirma?",
    submitted: "Enviado",
    submitted_info:
      "Expediente enviado: el formulario y adjuntos están bloqueados.",
    recap: "Descargar PDF resumen",
  },
};

/* =========================
   Page
   ========================= */
export default function FormulaireFiscalPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // Langue depuis ?lang=fr|en|es
  const urlLang = (sp.get("lang") || "").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(urlLang as any)
    ? (urlLang as Lang)
    : "fr";
  const t = I18N[lang];

  // Type T1 (salarie / autonome)
  const t1Type: T1Type =
    (sp.get("type") || "salarie").toLowerCase() === "autonome"
      ? "autonome"
      : "salarie";

  // Auth / user
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Form state
  const [rowId, setRowId] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [employment, setEmployment] = useState("");
  const [rrsp, setRrsp] = useState("");
  const [notes, setNotes] = useState("");
  const [bizRev, setBizRev] = useState("");
  const [bizExp, setBizExp] = useState("");
  const [status, setStatus] = useState<FormStatus>("draft");

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Files
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = status === "submitted";

  /* ---------- Auth protect ---------- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace(
          `/espace-client?lang=${lang}&next=/formulaire-fiscal${
            t1Type === "autonome" ? "?type=autonome" : ""
          }`
        );
        return;
      }
      setUid(u.id);
      setEmail(u.email ?? null);
    })();
  }, [router, lang, t1Type]);

  /* ---------- Charger le brouillon existant ---------- */
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, tax_year, form_type, status, data")
        .eq("user_id", uid)
        .eq("tax_year", year)
        .eq("form_type", "T1")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error || !data || !data[0]) {
        setRowId(null);
        setStatus("draft");
        return;
      }

      const row = data[0] as Row;
      setRowId(row.id);
      setStatus(row.status);
      const d = row.data || {};
      const dType = (d.type as T1Type) || "salarie";

      // Charger champs
      setEmployment(d.employment || "");
      setRrsp(d.rrsp || "");
      setNotes(d.notes || "");
      setBizRev(d.bizRev || "");
      setBizExp(d.bizExp || "");

      // Si le type du brouillon ne correspond pas à l’URL, on laisse les valeurs mais on ne force pas
      if (dType !== t1Type) {
        // rien, l’utilisateur peut changer l’URL si besoin
      }
    })();
  }, [uid, year]);

  /* ---------- Autosave ---------- */
  function queueSave() {
    if (locked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void saveNow(), 600);
  }

  async function saveNow() {
    if (!uid || locked) return;
    setSaving(true);

    const payload = {
      type: t1Type,
      employment,
      rrsp,
      notes,
      bizRev,
      bizExp,
    };

    if (rowId) {
      const { error } = await supabase
        .from(TABLE)
        .update({
          data: payload,
          status: "draft" as FormStatus,
          tax_year: year,
          form_type: "T1",
        })
        .eq("id", rowId);
      if (error) console.error(error);
    } else {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: uid,
          tax_year: year,
          form_type: "T1",
          status: "draft" as FormStatus,
          data: payload,
        })
        .select("id")
        .single();
      if (!error && data?.id) setRowId(data.id);
      if (error) console.error(error);
    }

    setSavedAt(new Date());
    setSaving(false);
  }

  /* ---------- Storage ---------- */
  const folderPath = useMemo(() => {
    if (!uid) return null;
    return `user-${uid}/${year}`;
  }, [uid, year]);

  async function listFiles() {
    if (!folderPath) return;
    const { data, error } = await supabase.storage.from(BUCKET).list(folderPath, {
      limit: 100,
      offset: 0,
    });
    if (error) {
      console.error(error);
      setFiles([]);
      return;
    }
    setFiles(data || []);
  }

  useEffect(() => {
    void listFiles();
  }, [folderPath]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!folderPath || locked) return;
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;

    setUploading(true);
    for (const f of Array.from(fl)) {
      const path = `${folderPath}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, f, {
        upsert: false,
      });
      if (error) console.error(error);
    }
    setUploading(false);
    void listFiles();
    // enregistrer aussi les champs
    queueSave();
  }

  async function removeFile(name: string) {
    if (!folderPath || locked) return;
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${folderPath}/${name}`]);
    if (error) console.error(error);
    void listFiles();
  }

  async function download(name: string) {
    if (!folderPath) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${folderPath}/${name}`, 60);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  /* ---------- Soumettre ---------- */
  async function submitForm() {
    if (!uid || !rowId) return;
    if (!window.confirm(t.confirm_submit)) return;

    await saveNow();

    const { error } = await supabase
      .from(TABLE)
      .update({ status: "submitted" as FormStatus })
      .eq("id", rowId);

    if (!error) setStatus("submitted");
  }

  /* ---------- PDF récap ---------- */
  async function downloadPDF() {
    const pdf = new jsPDF();
    const title = t1Type === "autonome" ? t.title_auto : t.title_salarie;

    // Titre / en-tête simple
    pdf.setFontSize(16);
    pdf.text("ComptaNet Québec", 14, 18);
    pdf.setFontSize(12);
    pdf.text(title, 14, 28);

    let y = 40;
    pdf.setFontSize(11);
    pdf.text(`${t.year}: ${year}`, 14, y); y += 8;
    pdf.text(`${t.emp}: ${employment || "-"}`, 14, y); y += 8;
    pdf.text(`${t.rrsp}: ${rrsp || "-"}`, 14, y); y += 8;

    if (t1Type === "autonome") {
      pdf.text(`${t.biz_rev}: ${bizRev || "-"}`, 14, y); y += 8;
      pdf.text(`${t.biz_exp}: ${bizExp || "-"}`, 14, y); y += 8;
    }

    pdf.text(`${t.notes}:`, 14, y); y += 6;
    const wrapped = pdf.splitTextToSize(notes || "-", 180);
    pdf.text(wrapped, 14, y); y += wrapped.length * 6 + 8;

    pdf.text(`${t.files}:`, 14, y); y += 6;
    if (files.length === 0) {
      pdf.text(t.empty_files, 18, y); y += 8;
    } else {
      files.forEach((f) => { pdf.text(`• ${f.name}`, 18, y); y += 6; });
      y += 4;
    }

    pdf.setFontSize(9);
    pdf.text(
      `Client: ${email || "—"}  |  Généré le ${new Date().toLocaleString()}`,
      14,
      y + 6
    );

    pdf.save(`Comptanet-${year}-${t1Type}.pdf`);
  }

  /* ---------- Render ---------- */
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {t1Type === "autonome" ? t.title_auto : t.title_salarie}
            {locked && (
              <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">
                {t.submitted}
              </span>
            )}
          </h1>
          <div className="flex gap-2 text-sm items-center">
            {saving ? <span>{t.saving}</span> : savedAt && <span>{t.saved}</span>}
            <button
              onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}
              className="btn btn-outline"
            >
              {t.back}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="btn btn-outline"
            >
              {t.logout}
            </button>
          </div>
        </header>

        {locked && (
          <p className="mb-3 text-sm bg-green-50 text-green-700 p-2 rounded border border-green-200">
            {t.submitted_info}
          </p>
        )}

        <p className="text-gray-600 mb-4">
          {t1Type === "autonome" ? t.intro_auto : t.intro_salarie}
        </p>

        {/* Formulaire */}
        <div className="grid gap-4">
          <label>
            {t.year}
            <input
              type="number"
              value={year}
              disabled={locked}
              onChange={(e) => {
                const v = parseInt(e.target.value || "0", 10);
                setYear(Number.isFinite(v) ? v : year);
                queueSave();
              }}
              className="w-40 rounded border px-3 py-2 block"
            />
          </label>

          <label>
            {t.emp}
            <input
              value={employment}
              disabled={locked}
              onChange={(e) => { setEmployment(e.target.value); queueSave(); }}
              className="w-full rounded border px-3 py-2 block"
            />
          </label>

          <label>
            {t.rrsp}
            <input
              value={rrsp}
              disabled={locked}
              onChange={(e) => { setRrsp(e.target.value); queueSave(); }}
              className="w-full rounded border px-3 py-2 block"
            />
          </label>

          {t1Type === "autonome" && (
            <>
              <label>
                {t.biz_rev}
                <input
                  value={bizRev}
                  disabled={locked}
                  onChange={(e) => { setBizRev(e.target.value); queueSave(); }}
                  className="w-full rounded border px-3 py-2 block"
                />
              </label>
              <label>
                {t.biz_exp}
                <input
                  value={bizExp}
                  disabled={locked}
                  onChange={(e) => { setBizExp(e.target.value); queueSave(); }}
                  className="w-full rounded border px-3 py-2 block"
                />
              </label>
            </>
          )}

          <label>
            {t.notes}
            <textarea
              value={notes}
              disabled={locked}
              onChange={(e) => { setNotes(e.target.value); queueSave(); }}
              rows={4}
              className="w-full rounded border px-3 py-2 block"
            />
          </label>
        </div>

        {/* Upload */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t.upload_title}</h2>
          <p className="text-sm text-gray-600 mb-2">{t.upload_hint}</p>

          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            onChange={onFiles}
            disabled={uploading || locked}
          />

          <ul className="mt-3 space-y-1 text-sm">
            {files.length === 0 && <li>{t.empty_files}</li>}
            {files.map((f) => (
              <li
                key={f.name}
                className="flex justify-between items-center border rounded px-2 py-1 bg-white"
              >
                <span className="truncate">{f.name}</span>
                <span className="flex gap-2">
                  <button onClick={() => download(f.name)} className="btn btn-outline">
                    {t.download}
                  </button>
                  {!locked && (
                    <button
                      onClick={() => removeFile(f.name)}
                      className="btn btn-outline"
                    >
                      {t.remove}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button onClick={submitForm} disabled={locked} className="btn btn-primary">
            {t.submit}
          </button>
          <button onClick={downloadPDF} className="btn btn-outline">
            {t.recap}
          </button>
        </div>
      </div>
    </main>
  );
}
