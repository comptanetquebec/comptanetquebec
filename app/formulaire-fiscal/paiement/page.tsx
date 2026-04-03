"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "../formulaire-fiscal.css";
import Steps from "../Steps";

function normalizeLang(v: string | null | undefined): "fr" | "en" | "es" {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? x : "fr";
}

export default function PaiementPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1";
  const lang = normalizeLang(params.get("lang"));

  const t = (fr: string, en: string, es: string) =>
    lang === "fr" ? fr : lang === "en" ? en : es;

  const goInterac = () => {
    router.push(
      `/formulaire-fiscal/confirmation?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`
    );
  };

  const goStripe = () => {
    router.push(
      `/formulaire-fiscal/envoyer-dossier?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`
    );
  };

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
              <span>{t("Étape 3/4 — Paiement", "Step 3/4 — Payment", "Paso 3/4 — Pago")}</span>
            </div>
          </div>

          <div className="ff-header-right">
            <Steps step={3} lang={lang} fid={fid} type={type} />
          </div>
        </header>

        <div className="ff-title">
          <h1>{t("Paiement de votre dossier", "Payment for your file", "Pago de su expediente")}</h1>
          <p>
            {t(
              "Choisissez votre mode de paiement pour poursuivre.",
              "Choose your payment method to continue.",
              "Elija su método de pago para continuar."
            )}
          </p>
        </div>

        <div className="ff-form">
          <section className="ff-card" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>
              {t("Virement Interac (recommandé)", "Interac e-Transfer (recommended)", "Transferencia Interac (recomendada)")}
            </h2>

            <p>{t("Méthode simple et rapide.", "Simple and fast method.", "Método simple y rápido.")}</p>

            <p><strong>{t("Montant :", "Amount:", "Monto:")}</strong> 100 $</p>
            <p><strong>{t("Courriel :", "Email:", "Correo:")}</strong> comptanetquebec@gmail.com</p>

            <p style={{ fontWeight: 600 }}>
              {t(
                "Traitement prioritaire avec cette méthode.",
                "Priority processing with this method.",
                "Procesamiento prioritario con este método."
              )}
            </p>

            <p>
              {t(
                "Dépôt automatique activé. Aucune question de sécurité requise.",
                "Autodeposit enabled. No security question required.",
                "Depósito automático activado. No se requiere pregunta de seguridad."
              )}
            </p>

            {fid && (
              <p>
                <strong>{t("Numéro de dossier :", "File number:", "Número de expediente:")}</strong> {fid}
              </p>
            )}

            <p>
              {t(
                "Veuillez inscrire votre nom complet et votre numéro de dossier dans le message du virement.",
                "Please include your full name and file number in the transfer message.",
                "Indique su nombre completo y su número de expediente en el mensaje de la transferencia."
              )}
            </p>

            <div style={{ marginTop: 16 }}>
              <button type="button" className="ff-btn ff-btn-primary ff-btn-big" onClick={goInterac}>
                {t("J’ai effectué le virement", "I sent the transfer", "Ya envié la transferencia")}
              </button>
            </div>
          </section>

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>
              {t("Paiement par carte", "Card payment", "Pago con tarjeta")}
            </h2>

            <p>{t("Paiement sécurisé avec Stripe.", "Secure payment with Stripe.", "Pago seguro con Stripe.")}</p>

            <p><strong>{t("Montant :", "Amount:", "Monto:")}</strong> 100 $</p>

            <p>
              {t(
                "Vous serez redirigé vers l’étape finale de paiement sécurisé.",
                "You will be redirected to the final secure payment step.",
                "Será redirigido al paso final de pago seguro."
              )}
            </p>

            <div style={{ marginTop: 16 }}>
              <button type="button" className="ff-btn ff-btn-outline ff-btn-big" onClick={goStripe}>
                {t("Payer par carte", "Pay by card", "Pagar con tarjeta")}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
