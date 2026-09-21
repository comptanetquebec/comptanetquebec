"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lang = "fr" | "en" | "es";

type Props = {
  factureId: string;
  numeroFacture: string | null;
  lang: Lang;
};

const TEXT = {
  fr: {
    confirm: "Voulez-vous vraiment supprimer cette facture ? Cette action est définitive.",
    title: "Supprimer la facture",
    error: "Impossible de supprimer la facture.",
  },
  en: {
    confirm: "Are you sure you want to delete this invoice? This action cannot be undone.",
    title: "Delete invoice",
    error: "Unable to delete the invoice.",
  },
  es: {
    confirm: "¿Seguro que desea eliminar esta factura? Esta acción es definitiva.",
    title: "Eliminar factura",
    error: "No se pudo eliminar la factura.",
  },
} as const;

export default function DeleteFactureButton({
  factureId,
  numeroFacture,
  lang,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function supprimer() {
    if (loading) return;

    const message = numeroFacture
      ? `${TEXT[lang].confirm}\n\n${numeroFacture}`
      : TEXT[lang].confirm;

    if (!window.confirm(message)) return;

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("factures")
        .delete()
        .eq("id", factureId);

      if (error) {
        console.error(error);
        alert(TEXT[lang].error);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(TEXT[lang].error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={supprimer}
      disabled={loading}
      title={TEXT[lang].title}
      aria-label={TEXT[lang].title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                 text-red-600 transition hover:bg-red-50 hover:text-red-700
                 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? (
        <span className="text-xs">...</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 6l-1 14H6L5 6"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v5" />
        </svg>
      )}
    </button>
  );
}
