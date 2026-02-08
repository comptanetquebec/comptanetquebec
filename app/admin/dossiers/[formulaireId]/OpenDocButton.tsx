"use client";

export default function OpenDocButton({ docId }: { docId: string }) {
  return (
    <button
      onClick={async () => {
        const res = await fetch("/api/admin/doc-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId }),
        });
        const json = await res.json();
        if (!res.ok) return alert(json?.error || "Erreur");
        window.open(json.signedUrl, "_blank", "noopener,noreferrer");
      }}
      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
    >
      Ouvrir
    </button>
  );
}
