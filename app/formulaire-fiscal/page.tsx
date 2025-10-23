"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FormulaireFiscalPage() {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get("type") || "t1";

  const [nom, setNom] = useState("");
  const [revenu, setRevenu] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(`Formulaire ${type.toUpperCase()} soumis pour ${nom} (${revenu}$).`);
    router.push("/dossiers/nouveau");
  }

  return (
    <main className="p-6 container">
      <h1 className="text-2xl font-bold mb-4">Formulaire fiscal {type.toUpperCase()}</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 max-w-md">
        <label>
          Nom complet :
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </label>
        <label>
          Revenu annuel :
          <input
            type="number"
            value={revenu}
            onChange={(e) => setRevenu(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </label>
        <button className="btn btn-primary w-full" type="submit">
          Soumettre
        </button>
      </form>
    </main>
  );
}
