"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
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

  const [loadingInterac, setLoadingInterac] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return null;
    return createClient(url, anonKey);
  }, []);

  const t = (fr: string, en: string, es: string) =>
    lang === "fr" ? fr : lang === "en" ? en : es;

  const goInterac = async () => {
    setErrorMsg("");

    if (!fid) {
      setErrorMsg(
        t(
          "Numéro de dossier introuvable.",
          "File ID not found.",
          "No se encontró el número de expediente."
        )
      );
      return;
    }

    if (!supabase) {
      setErrorMsg(
        t(
          "Configuration Supabase manquante.",
          "Missing Supabase configuration.",
          "Falta la configuración de Supabase."
        )
      );
      return;
    }

    try {
      setLoadingInterac(true);

      const { error } = await supabase
        .from("formulaires_fiscaux")
        .update({
          payment_status: "sent",
          payment_sent_at: new Date().toISOString(),
        })
        .eq("id", fid);

      if (error) {
        throw error;
      }

      router.push(
        `/formulaire-fiscal/confirmation?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`
      );
    } catch (error: any) {
      console.error("Erreur Supabase:", error);

      setErrorMsg(
        t(
          `Erreur : ${error?.message || "inconnue"}`,
          `Error: ${error?.message || "unknown"}`,
          `Error: ${error?.message || "desconocido"}`
        )
      );
    } finally {
      setLoadingInterac(false);
    }
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
              <span>
                {t(
                  "Étape 3/4 — Paiement",
                  "Step 3/4 — Payment",
                  "Paso 3/4 — Pago"
                )}
              </span>
            </div>
          </div>

          <div className="ff-header-right">
            <Steps step={3} lang={lang} fid={fid} type={type} />
          </div>
        </header>

        <div className="ff-title">
          <h1>
            {t(
              "Paiement de votre dossier",
              "Payment for your file",
              "Pago de su expediente"
            )}
          </h1>
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
              {t(
                "Virement Interac (recommandé)",
                "Interac e-Transfer (recommended)",
                "Transferencia Interac (recomendada)"
              )}
            </h2>

            <p>
              {t(
                "Méthode simple et rapide.",
                "Simple and fast method.",
                "Método simple y rápido."
              )}
            </p>

            <p>
              <strong>{t("Montant :", "Amount:", "Monto:")}</strong> 100 $
            </p>

            <p>
              <strong>{t("Courriel :", "Email:", "Correo:")}</strong>{" "}
              comptanetquebec@gmail.com
            </p>

            <p>
              {t(
                "Dépôt automatique activé. Aucune question de sécurité requise.",
                "Autodeposit enabled. No security question required.",
                "Depósito automático activado. No se requiere pregunta de seguridad."
              )}
            </p>

            {errorMsg ? (
              <p
                style={{
                  marginTop: 12,
                  color: "#b00020",
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </p>
            ) : null}

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="ff-btn ff-btn-primary ff-btn-big"
                onClick={goInterac}
                disabled={loadingInterac}
                aria-busy={loadingInterac}
              >
                {loadingInterac
                  ? t("Enregistrement...", "Saving...", "Guardando...")
                  : t(
                      "J’ai envoyé le virement",
                      "I sent the transfer",
                      "Ya envié la transferencia"
                    )}
              </button>
            </div>
          </section>

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>
              {t(
                "Paiement par carte",
                "Card payment",
                "Pago con tarjeta"
              )}
            </h2>

            <p>
              {t(
                "Paiement sécurisé avec Stripe.",
                "Secure payment with Stripe.",
                "Pago seguro con Stripe."
              )}
            </p>

            <p>
              <strong>{t("Montant :", "Amount:", "Monto:")}</strong> 100 $
            </p>

            <p>
              {t(
                "Vous serez redirigé vers l’étape finale de paiement sécurisé.",
                "You will be redirected to the final secure payment step.",
                "Será redirigido al paso final de pago seguro."
              )}
            </p>

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="ff-btn ff-btn-outline ff-btn-big"
                onClick={goStripe}
              >
                {t(
                  "Payer par carte",
                  "Pay by card",
                  "Pagar con tarjeta"
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
