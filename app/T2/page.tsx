"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];
type FormStatus = "draft" | "submitted";

const I18N: Record<Lang, any> = {
  fr: {
    title: "Déclaration T2 — Société incorporée",
    intro: "Remplissez les informations relatives à votre société incorporée.",
    company: "Nom de l’entreprise",
    neq: "Numéro d’entreprise (NEQ)",
    year: "Année fiscale",
    revenue: "Revenus de l’entreprise",
    expenses: "Dépenses de l’entreprise",
    dividends: "Dividendes versés",
    notes: "Notes",
    saving: "Enregistrement…",
    saved: "Enregistré",
    logout: "Se déconnecter",
    back: "Retour à l’accueil dossiers",
    submit: "Soumettre",
    submitted: "Soumis",
    submitted_info:
      "Votre dossier T2 a été soumis et est maintenant verrouillé.",
    submit_confirm: "Confirmez-vous la soumission de la déclaration T2 ?",
    submit_ok: "Déclaration T2 soumise.",
    upload_title: "Pièces jointes (États financiers, relevés, etc.)",
    choose_files: "Choisir des fichiers",
    uploading: "Téléversement…",
    files: "Fichiers",
    download: "Télécharger",
    remove: "Supprimer",
    empty_files: "Aucun fichier téléversé pour cette année.",
    pdf_btn: "Télécharger le récap PDF",
    pdf_title: "Récapitulatif — Déclaration T2",
    pdf_generated: "Généré le",
  },
  en: {
    title: "T2 Return — Corporation",
    intro: "Fill in your incorporated company details.",
    company: "Company name",
    neq: "Business number",
    year: "Fiscal year",
    revenue: "Business revenue",
    expenses: "Business expenses",
    dividends: "Dividends paid",
    notes: "Notes",
    saving: "Saving…",
    saved: "Saved",
    logout: "Log out",
    back: "Back to dashboard",
    submit: "Submit",
    submitted: "Submitted",
    submitted_info:
      "Your T2 file has been submitted and is now locked.",
    submit_confirm: "Do you confirm the T2 submission?",
    submit_ok: "T2 form submitted.",
    upload_title: "Attachments (financial statements, slips, etc.)",
    choose_files: "Choose files",
    uploading: "Uploading…",
    files: "Files",
    download: "Download",
    remove: "Delete",
    empty_files: "No files uploaded for this year.",
    pdf_btn: "Download PDF Summary",
    pdf_title: "Summary — T2 Return",
    pdf_generated: "Generated on",
  },
  es: {
    title: "Declaración T2 — Sociedad incorporada",
    intro: "Complete los datos de su empresa incorporada.",
    company: "Nombre de la empresa",
    neq: "Número de empresa",
    year: "Año fiscal",
    revenue: "Ingresos de la empresa",
    expenses: "Gastos de la empresa",
    dividends: "Dividendos pagados",
    notes: "Notas",
    saving: "Guardando…",
    saved: "Guardado",
    logout: "Cerrar sesión",
    back: "Volver",
    submit: "Enviar",
    submitted: "Enviado",
    submitted_info:
      "Su declaración T2 ha sido enviada y bloqueada.",
    submit_confirm: "¿Confirma el envío de la declaración T2?",
    submit_ok: "Declaración T2 enviada.",
    upload_title: "Adjuntos (estados financieros, comprobantes, etc.)",
    choose_files: "Elegir archivos",
    uploading: "Subiendo…",
    files: "Archivos",
    download: "Descargar",
    remove: "Eliminar",
    empty_files: "No hay archivos cargados.",
    pdf_btn: "Descargar resumen PDF",
    pdf_title: "Resumen — Declaración T2",
    pdf_generated: "Generado el",
  },
};

export default function PageT2() {
  const router = useRouter();
  const sp = useSearchParams();
  const langParam = (sp.get("lang") || "fr").toLowerCase() as Lang;
  const lang: Lang = LANGS.includes(langParam) ? langParam : "fr";
  const t = I18N[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);

  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [company, setCompany] = useState("");
  const [neq, setNeq] = useState("");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [dividends, setDividends] = useState("");
  const [notes, setNotes] = useState("");

  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const debounceRef = useRef<any>(null);
  const locked = status !== "draft";

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace(`/espace-client?lang=${lang}&next=/t2`);
        return;
      }
      setUid(u.id);
      setEmail(u.email ?? null);
    })();
  }, [router, lang]);

  useEffect(() => {
    if (uid) listFiles();
  }, [uid, year]);

  function queueSave() {
    if (locked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNow, 700);
  }

  async function saveNow() {
    if (!uid || locked) return;
    setSaving(true);
    const payload = { company, neq, year, revenue, expenses, dividends, notes };
    if (rowId) {
      await supabase.from("t2_forms").update({ payload }).eq("id", rowId);
    } else {
      const { data } = await supabase
        .from("t2_forms")
        .insert({ user_id: uid, payload, status: "draft" })
        .select("id")
        .single();
      if (data) setRowId(data.id);
    }
    setSavedAt(new Date());
    setSaving(false);
  }

  async function handleSubmit() {
    const confirmed = window.confirm(t.submit_confirm);
    if (!confirmed) return;
    await saveNow();
    if (!rowId) return;
    await supabase.from("t2_forms").update({ status: "submitted" }).eq("id", rowId);
    setStatus("submitted");
    setInfo(t.submit_ok);
  }

  /* Fichiers */
  function folderPath() {
    return `user-${uid}/t2/${year}`;
  }

  async function listFiles() {
    if (!uid) return;
    const { data } = await supabase.storage
      .from("client-files")
      .list(folderPath(), { limit: 100 });
    setFiles(data || []);
  }

  async function onChooseFiles(e: any) {
    const fl = e.target.files;
    if (!fl || !uid || locked) return;
    setUploading(true);
    const bucket = supabase.storage.from("client-files");
    const base = folderPath();
    for (const f of Array.from(fl)) {
      const okType =
        f.type === "application/pdf" || f.type === "image/jpeg" || f.type === "image/png";
      if (!okType) continue;
      const path = `${base}/${crypto.randomUUID()}-${f.name}`;
      await bucket.upload(path, f, { cacheControl: "3600", upsert: false });
    }
    setUploading(false);
    listFiles();
    e.target.value = "";
  }

  async function download(name: string) {
    const path = `${folderPath()}/${name}`;
    const { data } = await supabase.storage.from("client-files").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function removeFile(name: string) {
    if (locked) return;
    const path = `${folderPath()}/${name}`;
    await supabase.storage.from("client-files").remove([path]);
    listFiles();
  }

  async function downloadPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("ComptaNet Québec", 10, 15);
    doc.setFontSize(12);
    doc.text(t.pdf_title, 10, 25);
    doc.setFontSize(10);
    doc.text(`Client : ${email ?? "—"}`, 10, 33);
    doc.text(`${t.year}: ${year}`, 10, 39);
    doc.text(`${t.pdf_generated}: ${new Date().toLocaleString()}`, 10, 45);

    autoTable(doc, {
      startY: 50,
      head: [["Champ", "Valeur"]],
      body: [
        [t.company, company || "—"],
        [t.neq, neq || "—"],
        [t.revenue, revenue || "—"],
        [t.expenses, expenses || "—"],
        [t.dividends, dividends || "—"],
        [t.notes, notes || "—"],
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      theme: "grid",
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [[t.files]],
      body: files.length > 0 ? files.map((f) => [f.name]) : [[t.empty_files]],
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: pageWidth - 20 } },
      theme: "grid",
    });

    doc.save(`Comptanet-T2-${year}.pdf`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {t.title}
            {status === "submitted" && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                {t.submitted}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 text-sm">
            {saving ? <span>{t.saving}</span> : savedAt ? <span>{t.saved}</span> : null}
            <button className="btn btn-outline" onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}>
              {t.back}
            </button>
            <button
              className="btn btn-outline"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace(`/espace-client?lang=${lang}`);
              }}
            >
              {t.logout}
            </button>
          </div>
        </header>

        {status === "submitted" && (
          <div className="mb-4 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded px-3 py-2 text-sm">
            {t.submitted_info}
          </div>
        )}

        {error && (
          <div className="mb-3 border border-red-300 bg-red-50 text-red-700 rounded px-3 py-2 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 border border-blue-300 bg-blue-50 text-blue-700 rounded px-3 py-2 text-sm">
            {info}
          </div>
        )}

        <p className="text-gray-600 mb-4">{t.intro}</p>

        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-medium">{t.company}</span>
            <input
              value={company}
              disabled={locked}
              onChange={(e) => {
                setCompany(e.target.value);
                queueSave();
              }}
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.neq}</span>
            <input
              value={neq}
              disabled={locked}
              onChange={(e) => {
                setNeq(e.target.value);
                queueSave();
              }}
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.year}</span>
            <input
              type="number"
              value={year}
              disabled={locked}
              onChange={(e) => setYear(parseInt(e.target.value || "0"))}
              className="mt-1 w-40 rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.revenue}</span>
            <input
              value={revenue}
              disabled={locked}
              onChange={(e) => {
                setRevenue(e.target.value);
                queueSave();
              }}
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.expenses}</span>
            <input
              value={expenses}
              disabled={locked}
              onChange={(e) => {
                setExpenses(e.target.value);
                queueSave();
              }}
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.dividends}</span>
            <input
              value={dividends}
              disabled={locked}
              onChange={(e) => {
                setDividends(e.target.value);
                queueSave();
              }}
              className="mt-1 w-full rounded border px-3 py-2 disabled:bg-gray-100"
            />
          </label>

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

        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t.upload_title}</h2>
          <label className={`inline-flex items-center gap-2 mt-2 ${locked ? "opacity-60" : ""}`}>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={onChooseFiles}
              disabled={uploading || !uid || locked}
            />
            <span className="btn btn-outline">
              {uploading ? t.uploading : t.choose_files}
            </span>
          </label>

          <div className="mt-4">
            {files.length === 0 ? (
              <p className="text-sm text-gray-500">{t.empty_files}</p>
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center justify-between rounded border bg-white px-3 py-2">
                    <span className="truncate text-sm">{f.name}</span>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" onClick={() => download(f.name)}>
                        {t.download}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => removeFile(f.name)}
                        disabled={locked}
                      >
                        {t.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-8 flex gap-3">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={locked}>
            {t.submit}
          </button>
          <button className="btn btn-outline" onClick={downloadPDF}>
            {t.pdf_btn}
          </button>
        </div>
      </div>
    </main>
  );
}

