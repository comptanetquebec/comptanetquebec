import { Suspense } from "react";
import ChoixDossierClient from "./ChoixDossierClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <ChoixDossierClient />
    </Suspense>
  );
}
