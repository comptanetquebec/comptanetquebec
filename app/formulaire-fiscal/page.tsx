"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { jsPDF } from "jspdf";

/* ---------- Langues ---------- */
const LANGS_LIST = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS_LIST)[number];

type T1Type = "salarie" | "autonome";
type FormStatus = "draft" | "submitted";

/* ---------- Types de données ---------- */
type TaxPayloadBase = {
  type: T1Type;
  employment?: string;
  rrsp?: string;
  notes?: string;
};

type TaxPayloadAuto = TaxPayloadBase & {
  type: "autonome";
  bizRev?: string;
  bizExp?: string;
};

type TaxPayloadSalarie = TaxPayloadBase & {
  type: "salarie";
};

type TaxPayload = TaxPayloadAuto | TaxPayloadSalarie;

type TaxFormRow = {
  id: string;
  user_id: string;
  year: number;
  payload: TaxPayload;
  status: FormStatus;
  created_at?: string;
  updated_at?: string;
};

/* Fichiers (Supabase Storage) */
type StoredFile = {
  name: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
};

/* ---------- i18n ---------- */
const I18N: Record<
  Lang,
  {
    title_salarie: string;
    title_auto: string;
    intro_salarie: string;
    intro_auto: string;
    year: string;
    emp: string;
    rrsp: string;
    notes: string;
    biz_rev: string;
    biz_exp: string;
    saving: string;
    saved: string;
    logout: string;
    back: string;
    upload_title: string;
    upload_hint: string;
    choose: string;
    uploading: string;
    files: string;
    empty_files: string;
    download: string;
    remove: string;
    submit: string;
    confirm_submit: string;
    submitted: string;
    submitted_info: string;
    recap: string;
  }
> = {
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
    back: "Volver a los expedientes",
    upload_title: "Adjuntos",
    upload_hint: "Suba sus comprobantes (PDF, JPG, PNG).",
    choose: "Elegir archivos",
    uploading: "Subiendo…",
    files: "Archivos",
    empty_files: "No hay archivos para este año.",
    download: "Descargar",
    remove: "Eliminar",
    submit: "Enviar",
    confirm_submit:
      "Una vez enviado, el expediente quedará bloqueado. ¿Confirma?",
    submitted: "Enviado",
    submitted_info:
      "Expediente enviado: el formulario y los adjuntos están bloqueados.",
    recap: "Descargar resumen PDF",
  },
};

/* ---------- Composant ---------- */
export default function FormulaireFiscalPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // Langue
  const urlLang = (sp.get("lang") || "fr").toLowerCase();
  const lang: Lang = (LANGS_LIST as readonly string[]).includes(urlLang as Lang)
    ? (urlLang as Lang)
    : "fr";
  const t = I18N[lang];

  // Type (salarié | autonome)
  const t1Type: T1Type =
    (sp.get("type") || "salarie").toLowerCase() === "autonome"
      ? "autonome"
      : "salarie";

  // Auth
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Form state
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [employment, setEmployment] = useState<string>("");
  const [rrsp, setRrsp] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [bizRev, setBizRev] = useState<string>("");
  const [bizExp, setBizExp] = useState<string>("");
  const [status, setStatus] = useState<FormStatus>("draft");

  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = status === "submitted";

  /* --- Protection / récupération session --- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        // renvoi vers l’espace client
        const next = `/formulaire-fiscal${t1Type === "autonome" ? "?type=autonome" : ""}`;
        router.replace(`/espace-client?lang=${lang}&next=${encodeURIComponent(next)}`);
        return;
      }
      setUid(u.id);
      setEmail(u.email ?? null);
    })();
  }, [router, lang, t1Type]);

  /* --- Charger un brouillon existant (si présent) --- */
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { data, error } = await supabase
        .from("tax_forms")
        .select("id,user_id,year,payload,status")
        .eq("user_id", uid)
        .eq("year", year)
        .contains("payload", { type: t1Type })
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) return;

      const row = data[0] as TaxFormRow;
      setStatus(row.status);
      const p = row.payload || ({} as TaxPayload);
      setEmployment(p.employment ?? "");
      setRrsp(p.rrsp ?? "");
      setNotes(p.notes ?? "");
      if (t1Type === "autonome") {
        setBizRev((p as TaxPayloadAuto).bizRev ?? "");
        setBizExp((p as TaxPayloadAuto).bizExp ?? "");
      } else {
        setBizRev("");
        setBizExp("");
      }
    })();
  }, [uid, year, t1Type]);

  /* --- Autosave (debounce) --- */
  function queueSave() {
    if (locked || !uid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNow, 600);
  }

  async function saveNow() {
    if (!uid || locked) return;
    setSaving(true);

    const payload: TaxPayload =
      t1Type === "autonome"
        ? { type: "autonome", employment, rrsp, notes, bizRev, bizExp }
        : { type: "salarie", employment, rrsp, notes };

    await supabase
      .from("tax_forms")
      .upsert({ user_id: uid, year, payload, status: "draft" as FormStatus }, { onConflict: "user_id,year" });

    setSavedAt(new Date());
    setSaving(false);
  }

  /* --- Storage: fichiers --- */
  const folderPath = (u: string, y: number) => `user-${u}/${y}`;

  async function listFiles() {
    if (!uid) return;
    const { data, error } = await supabase.storage
      .from("client-files")
      .list(folderPath(uid, year));
    if (!error && data) setFiles(data as StoredFile[]);
  }

  useEffect(() => {
    listFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, year]); // (liste actualisée quand user ou année change)

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!uid || locked) return;
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < fl.length; i++) {
        const f = fl.item(i);
        if (!f) continue;
        const path = `${folderPath(uid, year)}/${Date.now()}-${f.name}`;
        await supabase.storage.from("client-files").upload(path, f, {
          cacheControl: "3600",
          upsert: false,
        });
      }
    } finally {
      setUploading(false);
      await listFiles();
      // reset input pour pouvoir re-uploader le même nom
      e.target.value = "";
    }
  }

  async function removeFile(name: string) {
    if (!uid || locked) return;
    await supabase.storage
      .from("client-files")
      .remove([`${folderPath(uid, year)}/${name}`]);
    await listFiles();
  }

  async function download(name: string) {
    if (!uid) return;
    const { data } = await supabase.storage
      .from("client-files")
      .createSignedUrl(`${folderPath(uid, year)}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  /* --- Soumission --- */
  async function submitForm() {
    if (!uid) return;
    const ok = window.confirm(t.confirm_submit);
    if (!ok) return;
    await saveNow();
    await supabase
      .from("tax_forms")
      .update({ status: "submitted" as FormStatus })
      .eq("user_id", uid)
      .eq("year", year);
    setStatus("submitted");
  }

  /* --- PDF récap client --- */
  async function downloadPDF() {
    const pdf = new jsPDF();
    const title = t1Type === "autonome" ? t.title_auto : t.title_salarie;

    // Titre & logo (si dispo)
    try {
      const resp = await fetch("/logo-cq.png");
      if (resp.ok) {
        const blob = await resp.blob();
        const fr = new FileReader();
        fr.onload = () => {
          pdf.addImage(fr.result as string, "PNG", 10, 8, 38, 14);
          draw();
        };
        fr.readAsDataURL(blob);
        return;
      }
    } catch {
      // ignore et dessine quand même
    }
    draw();

    function draw() {
      let y = 28;
      pdf.setFontSize(16);
      pdf.text("ComptaNet Québec", 10, y);
      y += 10;

      pdf.setFontSize(13);
      pdf.text(title, 10, y);
      y += 8;

      pdf.setFontSize(11);
      pdf.text(`${t.year}: ${year}`, 10, y); y += 6;
      pdf.text(`${t.emp}: ${employment || "-"}`, 10, y); y += 6;
      pdf.text(`${t.rrsp}: ${rrsp || "-"}`, 10, y); y += 6;

      if (t1Type === "autonome") {
        pdf.text(`${t.biz_rev}: ${bizRev || "-"}`, 10, y); y += 6;
        pdf.text(`${t.biz_exp}: ${bizExp || "-"}`, 10, y); y += 6;
      }

      pdf.text(`${t.notes}:`, 10, y); y += 6;
      const wrap = pdf.splitTextToSize(notes || "-", 180);
      pdf.text(wrap, 10, y);
      y += wrap.length * 6 + 6;

      pdf.text(`${t.files}:`, 10, y); y += 6;
      if (files.length === 0) {
        pdf.text(`• ${t.empty_files}`, 12, y); y += 6;
      } else {
        files.forEach((f) => { pdf.text(`• ${f.name}`, 12, y); y += 6; });
      }

      y += 6;
      pdf.setFontSize(9);
      pdf.text(
        `Client: ${email || "—"}  •  Généré le ${new Date().toLocaleString()}`,
        10,
        y
      );

      pdf.save(`Comptanet-${year}-${t1Type}.pdf`);
    }
  }

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {t1Type === "autonome" ? t.title_auto : t.title_salarie}
            {locked && (
              <span className="bg-green-200 text-green-900 text-xs px-2 py-0.5 rounded-full">
                {t.submitted}
              </span>
            )}
          </h1>
          <div className="flex gap-2 text-sm">
            {saving ? <span>{t.saving}</span> : savedAt && <span>{t.saved}</span>}
            <button
              onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}
              className="btn btn-outline"
              type="button"
            >
              {t.back}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="btn btn-outline"
              type="button"
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
          <label className="block">
            <span className="block text-sm font-medium mb-1">{t.year}</span>
            <input
              type="number"
              value={year}
              min={2000}
              max={9999}
              disabled={locked}
              onChange={(e) => setYear(parseInt(e.target.value || String(year), 10))}
              className="w-40 rounded border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium mb-1">{t.emp}</span>
            <input
              value={employment}
              disabled={locked}
              onChange={(e) => { setEmployment(e.target.value); queueSave(); }}
              className="w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium mb-1">{t.rrsp}</span>
            <input
              value={rrsp}
              disabled={locked}
              onChange={(e) => { setRrsp(e.target.value); queueSave(); }}
              className="w-full rounded border px-3 py-2"
            />
          </label>

          {t1Type === "autonome" && (
            <>
              <label className="block">
                <span className="block text-sm font-medium mb-1">{t.biz_rev}</span>
                <input
                  value={bizRev}
                  disabled={locked}
                  onChange={(e) => { setBizRev(e.target.value); queueSave(); }}
                  className="w-full rounded border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">{t.biz_exp}</span>
                <input
                  value={bizExp}
                  disabled={locked}
                  onChange={(e) => { setBizExp(e.target.value); queueSave(); }}
                  className="w-full rounded border px-3 py-2"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="block text-sm font-medium mb-1">{t.notes}</span>
            <textarea
              value={notes}
              disabled={locked}
              onChange={(e) => { setNotes(e.target.value); queueSave(); }}
              rows={4}
              className="w-full rounded border px-3 py-2"
            />
          </label>
        </div>

        {/* Upload */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t.upload_title}</h2>
          <p className="text-sm text-gray-600 mb-2">{t.upload_hint}</p>
          <label className="inline-flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={onFiles}
              disabled={uploading || locked}
              className="hidden"
              id="fileUp"
            />
            <span className="btn btn-outline cursor-pointer" onClick={() => document.getElementById("fileUp")?.click()}>
              {uploading ? t.uploading : t.choose}
            </span>
          </label>

          <ul className="mt-3 space-y-1 text-sm">
            {files.length === 0 && <li>{t.empty_files}</li>}
            {files.map((f) => (
              <li key={f.name} className="flex justify-between items-center border rounded px-2 py-1 bg-white">
                <span className="truncate">{f.name}</span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => download(f.name)} className="btn btn-outline">
                    {t.download}
                  </button>
                  {!locked && (
                    <button type="button" onClick={() => removeFile(f.name)} className="btn btn-outline text-red-600">
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
          <button type="button" onClick={submitForm} disabled={locked} className="btn btn-primary">
            {t.submit}
          </button>
          <button type="button" onClick={downloadPDF} className="btn btn-outline">
            {t.recap}
          </button>
        </div>
      </div>
    </main>
  );
}
