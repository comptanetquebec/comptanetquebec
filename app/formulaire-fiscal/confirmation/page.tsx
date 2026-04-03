"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import "../formulaire-fiscal.css";
import Steps from "../Steps";

function normalizeLang(v: string | null | undefined): "fr" | "en" | "es" {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? x : "fr";
}

export default function ConfirmationPage() {
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1";
  const lang = normalizeLang(params.get("lang"));

  const t = (fr: string, en: string, es: string) =>
    lang === "fr" ? fr : lang === "en" ? en : es;

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <div className="ff-brand">
            <Image
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              width={120}
              height={40}
              priority
              style={{ height: 40, width: "auto" }}
            />
            <div className="ff-brand-text">
              <strong>ComptaNet Québec</strong>
              <span>{t("Étape 4/4 — Confirmation", "Step 4/4 — Confirmation", "Paso 4/4 — Confirmación")}</span>
            </div>
          </div>

          <div className="ff-header-right">
            <Steps step={4} lang={lang} fid={fid} type={type} />
          </div>
        </header>

        <div className="ff-title">
          <h1>{t("Merci", "Thank you", "Gracias")}</h1>
          <p>
            {t(
              "Votre dossier a bien été reçu.",
              "Your file has been received.",
              "Su expediente ha sido recibido."
            )}
          </p>
          <p>
            {t(
              "Le traitement débutera après validation du paiement.",
              "Processing will begin after payment validation.",
              "El tratamiento comenzará después de la validación del pago."
            )}
          </p>

          {fid && (
            <p>
              <strong>{t("Numéro de dossier :", "File number:", "Número de expediente:")}</strong> {fid}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
