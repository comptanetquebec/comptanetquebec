"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "../formulaire-fiscal.css";
import Steps from "../Steps";

type Lang = "fr" | "en" | "es";

function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function t(lang: Lang, fr: string, en: string, es: string) {
  return lang === "fr" ? fr : lang === "en" ? en : es;
}

export default function PaiementPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1";
  const lang = normalizeLang(params.get("lang"));
  const montant = "100 $";

  const goInterac = () => {
    router.push(
      `/merci?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`
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
              <span>{t(lang, "Étape 3/4 — Paiement", "Step 3/4 — Payment", "Paso 3/4 — Pago")}</span>
            </div>
          </div>

          <div className="ff-header-right">
            <Steps step={3} lang={lang} fid={fid} type={type} />
          </div>
        </header>

        <div className="ff-title">
          <h1>{t(lang, "Paiement de votre dossier", "Payment for your file", "Pago de su expediente")}</h1>
          <p>
            {t(
              lang,
              "Vos documents ont bien été reçus. Veuillez choisir votre mode de paiement pour poursuivre.",
              "Your documents have been received. Please choose your payment method to continue.",
              "Sus documentos han sido recibidos. Elija su método de pago para continuar."
            )}
          </p>
        </div>

        <div className="ff-form">
          <section className="ff-card" style={{ marginBottom: 20 }}>
            <div className="ff-card-head">
              <h2>{t(lang, "Virement Interac (recommandé)", "Interac e-Transfer (recommended)", "Transferencia Interac (recomendada)")}</h2>
              <p>
                {t(
                  lang,
                  "Méthode simple et rapide.",
                  "Simple and fast method.",
                  "Método simple y rápido."
                )}
              </p>
            </div>

            <div className="ff-grid2">
              <div className="ff-field">
                <div className="ff-label">{t(lang, "Montant", "Amount", "Monto")}</div>
                <div className="ff-empty" style={{ borderStyle: "solid" }}>
                  {montant}
                </div>
              </div>

              <div className="ff-field">
                <div className="ff-label">{t(lang, "Courriel", "Email", "Correo")}</div>
                <div className="ff-empty" style={{ borderStyle: "solid" }}>
                  comptanetquebec@gmail.com
                </div>
              </div>
            </div>

            <div className="ff-mt">
              <div
                className="ff-empty"
                style={{ borderStyle: "solid", color: "#0f5132", fontWeight: 700 }}
              >
                {t(
                  lang,
                  "Traitement prioritaire avec cette méthode.",
                  "Priority processing with this method.",
                  "Procesamiento prioritario con este método."
                )}
              </div>
            </div>

            <div className="ff-mt">
              <div className="ff-empty" style={{ borderStyle: "solid" }}>
                {t(
                  lang,
                  "Dépôt automatique activé. Aucune question de sécurité requise.",
                  "Autodeposit enabled. No security question required.",
                  "Depósito automático activado. No se requiere pregunta de seguridad."
                )}
              </div>
            </div>

            {fid && (
              <div className="ff-mt">
                <div className="ff-field">
                  <div className="ff-label">{t(lang, "Numéro de dossier", "File number", "Número de expediente")}</div>
                  <div className="ff-empty" style={{ borderStyle: "solid" }}>
                    {fid}
                  </div>
                </div>
              </div>
            )}

            <div className="ff-mt">
              <p className="ff-footnote">
                {t(
                  lang,
                  "Veuillez inscrire votre nom complet" + (fid ? " et votre numéro de dossier" : "") + " dans le message du virement.",
                  "Please include your full name" + (fid ? " and your file number" : "") + " in the transfer message.",
                  "Indique su nombre completo" + (fid ? " y su número de expediente" : "") + " en el mensaje de la transferencia."
                )}
              </p>
            </div>

            <div className="ff-submit" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="ff-btn ff-btn-primary ff-btn-big"
                onClick={goInterac}
              >
                {t(lang, "J’ai effectué le virement", "I sent the transfer", "Ya envié la transferencia")}
              </button>
            </div>
          </section>

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>{t(lang, "Paiement par carte", "Card payment", "Pago con tarjeta")}</h2>
              <p>
                {t(
                  lang,
                  "Paiement sécurisé avec Stripe.",
                  "Secure payment with Stripe.",
                  "Pago seguro con Stripe."
                )}
              </p>
            </div>

            <div className="ff-grid2">
              <div className="ff-field">
                <div className="ff-label">{t(lang, "Montant", "Amount", "Monto")}</div>
                <div className="ff-empty" style={{ borderStyle: "solid" }}>
                  {montant}
                </div>
              </div>

              <div className="ff-field">
                <div className="ff-label">{t(lang, "Mode", "Method", "Método")}</div>
                <div className="ff-empty" style={{ borderStyle: "solid" }}>
                  Stripe
                </div>
              </div>
            </div>

            <div className="ff-mt">
              <p className="ff-footnote">
                {t(
                  lang,
                  "Le traitement débute après confirmation du paiement.",
                  "Processing begins after payment confirmation.",
                  "El tratamiento comienza después de la confirmación del pago."
                )}
              </p>
            </div>

            <div className="ff-submit" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="ff-btn ff-btn-outline ff-btn-big"
                onClick={goStripe}
              >
                {t(lang, "Payer par carte", "Pay by card", "Pagar con tarjeta")}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
