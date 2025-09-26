"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ───────────── i18n ───────────── */

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

const I18N: Record<
  Lang,
  {
    title: string;
    intro: string;
    addFiles: string;
    uploading: string;
    empty: string;
    table_name: string;
    table_size: string;
    table_updated: string;
    action_download: string;
    action_delete: string;
    confirm_delete: (n: string) => string;
    error_auth: string;
    error_list: string;
    error_upload: string;
    error_delete: string;
  }
> = {
  fr: {
    title: "Mes documents",
    intro:
      "Déposez ici vos formulaires et pièces (T4, reçus, relevés, etc.). Seuls vous et ComptaNet y avez accès.",
    addFiles: "Ajouter des fichiers",
    uploading: "Téléversement…",
    empty: "Aucun fichier pour le moment.",
    table_name: "Nom",
    table_size: "Taille",
    table_updated: "Modifié le",
    action_download: "Télécharger",
    action_delete: "Supprimer",
    confirm_delete: (n) => `Supprimer « ${n} » ?`,
    error_auth: "Vous devez être connecté pour accéder à vos documents.",
    error_list: "Impossible de lister les fichiers.",
    error_upload: "Échec du téléversement.",
    error_delete: "Échec de la suppression.",
  },
  en: {
    title: "My documents",
    intro:
      "Upload your tax forms and receipts here. Only you and ComptaNet can access them.",
    addFiles: "Add files",
    uploading: "Uploading…",
    empty: "No files yet.",
    table_name: "Name",
    table_size: "Size",
    table_updated: "Updated",
    action_download: "Download",
    action_delete: "Delete",
    confirm_delete: (n) => `Delete “${n}”?`,
    error_auth: "You must be logged in to access your documents.",
    error_list: "Could not list files.",
    error_upload: "Upload failed.",
    error_delete: "Delete failed.",
  },
  es: {
    title: "Mis documentos",
    intro:
      "Sube aquí tus formularios y comprobantes. Solo tú y ComptaNet tienen acceso.",
    addFiles: "Añadir archivos",
    uploading: "Subiendo…",
    empty: "Aún no hay archivos.",
    table_name: "Nombre",
    table_size: "Tamaño",
    table_updated: "Actualizado",
    action_download: "Descargar",
    action_delete: "Eliminar",
    confirm_delete: (n) => `¿Eliminar “${n}”?`,
    error_auth: "Debes iniciar sesión para acceder a tus documentos.",
    error_list: "No se pudo listar los archivos.",
    error_upload: "Fallo al subir.",
    error_delete: "Fallo al eliminar.",
  },
};

/* ───────────── Types ───────────── */

type SbFileObject = {
  name: string;
  updated_at?: string | null;
  metadata?: { size?: number } | null;
};

type Row = { name: string; size: number; updatedAt: string | null };

/* ───────────── Component ───────────── */

export default function DocumentsPageInner() {
  // langue via ?lang=
  const params = useSearchParams();
  const langParam = (params.get("lang") || "fr").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(langParam as Lang)
    ? (langParam as Lang)
    : "fr";
  const t = I18N[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Session + listing initial
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const currentUid = data.user?.id ?? null;
      setUid(currentUid);
      if (!currentUid) {
        setLoading(false);
        return;
      }
      await refreshList(currentUid);
    })();
  }, []);

  async function refreshList(currentUid: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("clients")
        .list(currentUid, { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;

      const mapped: Row[] =
        (data as SbFileObject[] | null)?.map((f) => ({
          name: f.name,
          size: f.metadata?.size ?? 0,
          updatedAt: f.updated_at ?? null,
        })) ?? [];

      setRows(mapped);
    } catch (e) {
      console.error(e);
      alert(t.error_list);
    } finally {
      setLoading(false);
    }
  }

  function openPicker() {
    fileInputRef.current?.click();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (!files || !uid) return;

    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${uid}/${file.name}`;
        const { error } = await supabase.storage
          .from("clients")
          .upload(path, file, { upsert: true, cacheControl: "3600" });
        if (error) throw error;
      }
      await refreshList(uid);
    } catch (e) {
      console.error(e);
      alert(t.error_upload);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function download(name: string) {
    if (!uid) return;
    const { data, error } = await supabase.storage
      .from("clients")
      .createSignedUrl(`${uid}/${name}`, 60);
    if (error || !data?.signedUrl) {
      alert(t.error_list);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove(name: string) {
    if (!uid) return;
    if (!confirm(t.confirm_delete(name))) return;

    setBusy(true);
    try {
      const { error } = await supabase.storage
        .from("clients")
        .remove([`${uid}/${name}`]);
      if (error) throw error;
      await refreshList(uid);
    } catch (e) {
      console.error(e);
      alert(t.error_delete);
    } finally {
      setBusy(false);
    }
  }

  // Non connecté
  if (!uid) {
    return (
      <main className="hero">
        <div className="card container">
          <Header />
          <h1>{t.title}</h1>
          <p className="note" style={{ color: "red" }}>{t.error_auth}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="hero">
      <div className="card container">
        <Header />
        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>

        <div className="cta-row" style={{ justifyContent: "flex-start" }}>
          <button className="btn btn-primary" onClick={openPicker} disabled={busy}>
            {busy ? t.uploading : t.addFiles}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.heic,.zip,.csv,.xls,.xlsx,.doc,.docx,.txt"
            onChange={onUpload}
            hidden
          />
        </div>

        <div style={{ marginTop: 18 }}>
          {loading ? (
            <p className="note">…</p>
          ) : rows.length === 0 ? (
            <p className="note">{t.empty}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #e6ecf5",
                  borderRadius: 12,
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <Th>{t.table_name}</Th>
                    <Th style={{ width: 120 }}>{t.table_size}</Th>
                    <Th style={{ width: 180 }}>{t.table_updated}</Th>
                    <Th style={{ width: 220 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} style={{ borderTop: "1px solid #eef2f7" }}>
                      <Td>{r.name}</Td>
                      <Td>{formatSize(r.size)}</Td>
                      <Td>{r.updatedAt ? formatDate(r.updatedAt) : "—"}</Td>
                      <Td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-outline" onClick={() => download(r.name)}>
                            {t.action_download}
                          </button>
                          <button className="btn btn-outline" onClick={() => remove(r.name)} disabled={busy}>
                            {t.action_delete}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ───────────── Sub-components ───────────── */

function Header() {
  return (
    <header className="brand" style={{ justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image
          src="/logo-cq.png"
          alt="ComptaNet Québec"
          width={120}
          height={40}
          style={{ height: 40, width: "auto" }}
          priority
        />
        <span className="brand-text">ComptaNet Québec</span>
      </div>
    </header>
  );
}

function Th({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontWeight: 700,
        fontSize: 14,
        ...style,
      }}
    >
      {children ?? "\u00A0"}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "10px 12px",
        fontSize: 14,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

/* ───────────── Helpers ───────────── */

function formatSize(n: number): string {
  if (!n || n < 0) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
