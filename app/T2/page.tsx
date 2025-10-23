"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];
type FormStatus = "draft" | "submitted";

type StoredFile = {
  name: string;
  created_at?: string;
  size?: number;
};

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
    submitted_info: "Votre dossier T2 a été soumis et est maintenant verrouillé.",
    submit_confirm: "Confirmez-vous la soumission de la déclaration T2 ?",
    submit_ok: "Déclaration T2 soumise.",
    submit_err: "Impossible de soumettre le dossier.",
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
    back: "Back to files hub",
    submit: "Submit",
    submitted: "Submitted",
    submitted_info: "Your T2 file has been submitted and is now locked.",
    submit_confirm: "Do you confirm the T2 submission?",
    submit_ok: "T2 form submitted.",
    submit_err: "Could not submit the file.",
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
    submitted_info: "Su declaración T2 ha sido enviada y bloqueada.",
    submit_confirm: "¿Confirma el envío de la declaración T2?",
    submit_ok: "Declaración T2 enviada.",
    submit_err: "No se pudo enviar el expediente.",
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

  // Lang
  const urlLang = (sp.get("lang") || "fr").toLowerCase() as Lang;
  const lang: Lang = (LANGS as readonly string[]).includes(urlLang) ? urlLang : "fr";
  const t = I18N[lang];

  // Auth
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Form state
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [company, setCompany] = useState("");
  const [neq, setNeq] = useState("");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [dividends, setDividends] = useState("");
  const [notes, setNotes] = useState("");

  // DB state
  const [rowId, setRowId] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("draft");

  // UI state
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Files
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Debounce & lock
  const debounceRef = useRef<any>(null);
  const locked = status === "submitted";

  /* ---------- Auth protect ---------- */
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

  /* ---------- Load existing draft ---------- */
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { data, error } = await supabase
        .from("formulaires_fiscaux")
        .select("id, status, data")
        .eq("user_id", uid)
        .eq("form_type", "T2")
        .eq("tax_year", year)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) return;
      if (data && data[0]) {
        const row = data[0] as any;
        setRowId(row.id);
        setStatus((row.status as FormStatus) || "draft");
        const p = (row.data || {}) as any;
        setCompany(p.company || "");
        setNeq(p.neq || "");
        setRevenue(p.revenue || "");
        setExpenses(p.expenses || "");
        setDividends(p.dividends || "");
        setNotes(p.notes || "");
      } else {
        setRowId(null);
        setStatus("draft");
        setCompany("");
        setNeq("");
        setRevenue("");
        setExpenses("");
        setDividends("");
        setNotes("");
      }
    })();
  }, [uid, year]);

  /* ---------- Files list ---------- */
  useEffect(() => {
    listFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, year]);

  /* ---------- Autosave ---------- */
  function queueSave() {
    if (locked) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNow, 700);
  }

  async function saveNow() {
    if (!uid || locked) return;
    setSaving(true);
    setError(null);

    const payload = { company, neq, revenue, expenses, dividends, notes };

    if (rowId) {
      await supabase.from("formulaires_fiscaux").update({ data: payload }).eq("id", rowId);
    } else {
      const { data, error } = await supabase
        .from("formulaires_fiscaux")
        .insert({
          user_id: uid,
          form_type: "T2",
          tax_year: year,
          status: "draft",
          data: payload,
        })
        .select("id")
        .single();
      if (!error && data) setRowId(data.id);
    }

    setSavedAt(new Date());
    setSaving(false);
  }

  /* ---------- Submit (lock) ---------- */
  async function handleSubmit() {
    setError(null);
    setInfo(null);

    const ok = window.confirm(t.submit_confirm);
    if (!ok) return;

    await saveNow();

    let id = rowId;
    if (!id && uid) {
      // Insert draft if missing
      const payload = { company, neq, revenue, expenses, dividends, notes };
      const { data, error } = await supabase
        .from("formulaires_fiscaux")
        .insert({
          user_id: uid,
          form_type: "T2",
          tax_year: year,
          status: "draft",
          data: payload,
        })
        .select("id")
        .single();
      if (error || !data) {
        setError(t.submit_err);
        return;
      }
      id = data.id;
      setRowId(id);
    }

    if (!id) {
      setError(t.submit_err);
      return;
    }

    const { error } = await supabase
      .from("formulaires_fiscaux")
      .update({ status: "submitted" })
      .eq("id", id);

    if (error) {
      setError(t.submit_err);
      return;
    }
    setStatus("submitted");
    setInfo(t.submit_ok);
  }

  /* ---------- Storage helpers ---------- */
  const folderPath = () => `user-${uid}/t2/${year}`;

  async function listFiles() {
    if (!uid) return;
    const { data } = await supabase.storage
      .from("client-files")
      .list(folderPath(), { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    setFiles((data || []) as StoredFile[]);
  }

  async function onChooseFiles(e: React.ChangeEvent<HTMLInputElement>) {
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
    const { data } = await supabase.storage
      .from("client-files")
      .createSignedUrl(`${folderPath()}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeFile(name: string) {
    if (locked) return;
    await supabase.storage.from("client-files").remove([`${folderPath()}/${name}`]);
    listFiles();
  }

  /* ---------- PDF ---------- */
  async function downloadPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo (facultatif)
    try {
      const res = await fetch("/logo-cq.png");
      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            try {
              doc.addImage(reader.result as string, "PNG", 10, 8, 30, 12);
            } catch {}
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch {}

    doc.setFontSize(16);
    doc.text("ComptaNet Québec", 44, 15);
    doc.setFontSize(12);
    doc.text(t.pdf_title, 10, 28);

    doc.setFontSize(10);
    doc.text(`Client: ${email ?? "—"}`, 10, 34);
    doc.text(`${t.year}: ${year}`, 10, 40);
    doc.text(`${t.pdf_generated}: ${new Date().toLocaleString()}`, 10, 46);

    autoTable(doc, {
      startY: 52,
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
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {t.title}
            {locked && (
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

        {/* Info */}
        {locked && (
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

        {/* Form */}
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
              onChange={(e) => setYear(parseInt(e.target.value || "0", 10))}
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

        {/* Uploads */}
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
            <span className="btn btn-outline">{uploading ? t.uploading : t.choose_files}</span>
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
                      <button className="btn btn-outline" onClick={() => removeFile(f.name)} disabled={locked}>
                        {t.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={locked} title={locked ? t.submitted_info : ""}>
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
