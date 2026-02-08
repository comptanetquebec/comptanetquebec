"use client";

export default function OpenDocButton({ docId }: { docId: string }) {
  return (
    <button
      className="border px-3 py-1 rounded"
      onClick={async () => {
        const res = await fetch("/api/admin/doc-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId }),
        });

        const json = await res.json();
        if (!res.ok) {
          alert(json.error || "Erreur");
          return;
        }

        window.open(json.signedUrl, "_blank");
      }}
    >
      Ouvrir
    </button>
  );
}
