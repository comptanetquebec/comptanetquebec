"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { jsPDF } from "jspdf";

const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];
type T1Type = "salarie" | "autonome";
type FormStatus = "draft" | "submitted";

type StoredFile = {
  name: string;
  size?: number;
  created_at?: string;
};

export default function FormulaireFiscalPage() {
  const router = useRouter();
  const sp = useSearchParams();

  /** Langue */
  const urlLang = (sp.get("lang") || "").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(urlLang)
    ? (urlLang as Lang)
    : "fr";

  const texts = {
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
      save: "Enregistrement…",
      saved: "Enregistré",
      logout: "Se déconnecter",
      back: "Retour à l’accueil dossiers",
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
      save: "Saving…",
      saved: "Saved",
      logout: "Log out",
      back: "Back to files hub",
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
      save: "Guardando…",
      saved: "Guardado",
      logout: "Cerrar sesión",
      back: "Volver al inicio",
      upload_title: "Adjuntos",
      upload_hint: "Suba sus comprobantes (PDF, JPG, PNG).",
      choose: "Elegir archivos",
      uploading: "Subiendo…",
      files: "Archivos",
      empty_files: "No hay archivos.",
      download: "Descargar",
      remove: "Eliminar",
      submit: "Enviar",
      confirm_submit:
        "Una vez enviado, el expediente estará bloqueado. ¿Confirma?",
      submitted: "Enviado",
      submitted_info:
        "Expediente enviado: el formulario y los adjuntos están bloqueados.",
      recap: "Descargar resumen PDF",
    },
  }[lang];

  /** Type */
  const t1Type: T1Type =
    (sp.get("type") || "salarie").toLowerCase() === "autonome"
      ? "autonome"
      : "salarie";

  const t = texts;
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [employment, setEmployment] = useState("");
  const [rrsp, setRrsp] = useState("");
  const [notes, setNotes] = useState("");
  const [bizRev, setBizRev] = useState("");
  const [bizExp, setBizExp] = useState("");
  const [status, setStatus] = useState<FormStatus>("draft");

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const debounceRef = useRef<any>(null);
  const locked = status === "submitted";

  /** Auth protect */
  const router = useRouter();
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
      setEmail(u.email || null);
    })();
  }, [router, lang, t1Type]);

  /** Load existing draft */
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { data } = await supabase
        .from("tax_forms")
        .select("id, payload, status")
        .eq("user_id", uid)
        .eq("year", year)
        .contains("payload", { type: t1Type })
        .order("updated_at", { ascending: false })
        .limit(1);
      if (!data || !data[0]) return;
      const row = data[0];
      setStatus(row.status);
      const p = row.payload || {};
      setEmployment(p.employment || "");
      setRrsp(p.rrsp || "");
      setNotes(p.notes || "");
      setBizRev(p.bizRev || "");
      setBizExp(p.bizExp || "");
    })();
  }, [uid, year, t1Type]);

  /** Autosave */
  function queueSave() {
    if (locked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNow, 600);
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
    await supabase
      .from("tax_forms")
      .upsert({ user_id: uid, year, payload, status: "draft" });
    setSavedAt(new Date());
    setSaving(false);
  }

  /** Upload */
  const folderPath = () => `user-${uid}/${year}`;
  async function listFiles() {
    if (!uid) return;
    const { data } = await supabase.storage
      .from("client-files")
      .list(folderPath());
    setFiles(data || []);
  }
  useEffect(() => {
    listFiles();
  }, [uid, year]);

  async function onFiles(e: any) {
    const fl = e.target.files;
    if (!fl || locked) return;
    setUploading(true);
    for (const f of fl) {
      const path = `${folderPath()}/${Date.now()}-${f.name}`;
      await supabase.storage.from("client-files").upload(path, f);
    }
    setUploading(false);
    listFiles();
  }

  async function removeFile(name: string) {
    if (locked) return;
    await supabase.storage.from("client-files").remove([`${folderPath()}/${name}`]);
    listFiles();
  }

  async function download(name: string) {
    const { data } = await supabase.storage
      .from("client-files")
      .createSignedUrl(`${folderPath()}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  /** Soumettre */
  async function submitForm() {
    if (!window.confirm(t.confirm_submit)) return;
    await saveNow();
    await supabase
      .from("tax_forms")
      .update({ status: "submitted" })
      .eq("user_id", uid)
      .eq("year", year);
    setStatus("submitted");
  }

  /** PDF Récap */
  async function downloadPDF() {
    const pdf = new jsPDF();
    const title = t1Type === "autonome" ? t.title_auto : t.title_salarie;

    // Logo si présent
    try {
      const img = await fetch("/logo-cq.png");
      const blob = await img.blob();
      const reader = new FileReader();
      reader.onload = function () {
        pdf.addImage(reader.result as string, "PNG", 10, 10, 40, 15);
        pdf.setFontSize(18);
        pdf.text("ComptaNet Québec", 60, 20);
        generate();
      };
      reader.readAsDataURL(blob);
    } catch {
      generate();
    }

    function generate() {
      let y = 40;
      pdf.setFontSize(14);
      pdf.text(title, 10, y);
      y += 10;
      pdf.setFontSize(11);
      pdf.text(`${t.year}: ${year}`, 10, y);
      y += 8;
      pdf.text(`${t.emp}: ${employment || "-"}`, 10, y);
      y += 8;
      pdf.text(`${t.rrsp}: ${rrsp || "-"}`, 10, y);
      y += 8;
      if (t1Type === "autonome") {
        pdf.text(`${t.biz_rev}: ${bizRev || "-"}`, 10, y);
        y += 8;
        pdf.text(`${t.biz_exp}: ${bizExp || "-"}`, 10, y);
        y += 8;
      }
      pdf.text(`${t.notes}:`, 10, y);
      y += 6;
      const noteText = notes || "-";
      const wrapped = pdf.splitTextToSize(noteText, 180);
      pdf.text(wrapped, 10, y);
      y += wrapped.length * 6 + 8;

      pdf.text(`${t.files}:`, 10, y);
      y += 6;
      if (files.length === 0) pdf.text(t.empty_files, 15, y);
      else {
        files.forEach((f) => {
          pdf.text(`• ${f.name}`, 15, y);
          y += 6;
        });
      }

      y += 10;
      pdf.setFontSize(9);
      pdf.text(
        `Client: ${email || "—"} | Généré le ${new Date().toLocaleString()}`,
        10,
        y
      );

      pdf.save(`Comptanet-${year}-${t1Type}.pdf`);
    }
  }

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
          <div className="flex gap-2 text-sm">
            {saving ? <span>{t.save}</span> : savedAt && <span>{t.saved}</span>}
            <button
              onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}
              className="btn btn-outline"
            >
              {t.back}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="btn btn-outline">
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
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-40 rounded border px-3 py-2 block"
            />
          </label>
          <label>
            {t.emp}
            <input
              value={employment}
              disabled={locked}
              onChange={(e) => {
                setEmployment(e.target.value);
                queueSave();
              }}
              className="w-full rounded border px-3 py-2 block"
            />
          </label>
          <label>
            {t.rrsp}
            <input
              value={rrsp}
              disabled={locked}
              onChange={(e) => {
                setRrsp(e.target.value);
                queueSave();
              }}
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
                  onChange={(e) => {
                    setBizRev(e.target.value);
                    queueSave();
                  }}
                  className="w-full rounded border px-3 py-2 block"
                />
              </label>
              <label>
                {t.biz_exp}
                <input
                  value={bizExp}
                  disabled={locked}
                  onChange={(e) => {
                    setBizExp(e.target.value);
                    queueSave();
                  }}
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
              onChange={(e) => {
                setNotes(e.target.value);
                queueSave();
              }}
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
                      className="btn btn-outline text-red-600"
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
          <button
            onClick={submitForm}
            disabled={locked}
            className="btn btn-primary"
          >
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

