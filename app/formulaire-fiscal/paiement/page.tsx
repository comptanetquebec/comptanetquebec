"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal.css";
import Steps from "../Steps";

function normalizeLang(
  v: string | null | undefined
): "fr" | "en" | "es" {
  const x = (v || "").toLowerCase();

  return x === "fr" || x === "en" || x === "es"
    ? x
    : "fr";
}

export default function PaiementPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1";
  const lang = normalizeLang(params.get("lang"));

  const [loadingInterac, setLoadingInterac] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cqId, setCqId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = (fr: string, en: string, es: string) =>
    lang === "fr" ? fr : lang === "en" ? en : es;

  useEffect(() => {
    const loadCqId = async () => {
      if (!fid) return;

      const { data, error } = await supabase
        .from("formulaires_fiscaux")
        .select("cq_id")
        .eq("id", fid)
        .single();

      if (error) {
        console.error("Erreur chargement cq_id:", error);
        return;
      }

      if (data?.cq_id) {
        setCqId(data.cq_id);
      }
    };

    loadCqId();
  }, [fid]);

  const copyCqId = async () => {
    if (!cqId) return;

    try {
      await navigator.clipboard.writeText(cqId);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur copie cq_id:", error);
    }
  };

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

    if (!cqId) {
      setErrorMsg(
        t(
          "Le numéro de dossier n'est pas encore disponible. Veuillez patienter quelques secondes.",
          "The file number is not available yet. Please wait a few seconds.",
          "El número de expediente aún no está disponible. Espere unos segundos."
        )
      );
      return;
    }

    try {
      setLoadingInterac(true);

      const { error } = await supabase
        .from("formulaires_fiscaux")
        .update({
          payment_status: "interac_sent",
          payment_sent_at: new Date().toISOString(),
        })
        .eq("id", fid);

      if (error) {
        throw error;
      }

      router.push(
        `/formulaire-fiscal/confirmation?fid=${encodeURIComponent(
          fid
        )}&type=${encodeURIComponent(
          type
        )}&lang=${encodeURIComponent(
          lang
        )}&cq=${encodeURIComponent(
          cqId
        )}&payment=interac_sent`
      );
    } catch (error: unknown) {
      console.error("Erreur Supabase:", error);

      const message =
        error instanceof Error
          ? error.message
          : t("inconnue", "unknown", "desconocido");

      setErrorMsg(
        t(
          `Erreur : ${message}`,
          `Error: ${message}`,
          `Error: ${message}`
        )
      );
    } finally {
      setLoadingInterac(false);
    }
  };

  const goStripe = () => {
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

    router.push(
      `/formulaire-fiscal/envoyer-dossier?fid=${encodeURIComponent(
        fid
      )}&type=${encodeURIComponent(
        type
      )}&lang=${encodeURIComponent(lang)}`
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
              style={{
                height: 40,
                width: "auto",
              }}
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
            <Steps
              step={3}
              lang={lang}
              fid={fid}
              type={type}
            />
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
          {/* VIREMENT INTERAC */}
          <section
            className="ff-card"
            style={{ marginBottom: 20 }}
          >
            <h2 style={{ marginTop: 0 }}>
              {t(
                "Virement Interac (recommandé)",
                "Interac e-Transfer (recommended)",
                "Transferencia Interac (recomendada)"
              )}
            </h2>

            <p>
              {t(
                "Payez votre acompte de 100 $ par virement Interac.",
                "Pay your $100 deposit by Interac e-Transfer.",
                "Pague su depósito de $100 mediante transferencia Interac."
              )}
            </p>

            {/* INFORMATIONS DU VIREMENT */}
            <div
              style={{
                marginTop: 16,
                padding: 18,
                borderRadius: 12,
                background: "#f7f9fc",
                border: "1px solid #dde5ef",
              }}
            >
              <p style={{ marginTop: 0 }}>
                <strong>
                  {t(
                    "Montant à envoyer :",
                    "Amount to send:",
                    "Monto a enviar:"
                  )}
                </strong>{" "}
                100 $
              </p>

              <p>
                <strong>
                  {t(
                    "Envoyer à :",
                    "Send to:",
                    "Enviar a:"
                  )}
                </strong>{" "}
                comptanetquebec@gmail.com
              </p>

              <p style={{ marginBottom: 0 }}>
                <strong>
                  {t(
                    "Dépôt automatique :",
                    "Autodeposit:",
                    "Depósito automático:"
                  )}
                </strong>{" "}
                {t(
                  "Activé — aucune question de sécurité.",
                  "Enabled — no security question.",
                  "Activado — sin pregunta de seguridad."
                )}
              </p>
            </div>

            {/* NUMÉRO DE DOSSIER + MESSAGE INTERAC */}
            <div
              style={{
                marginTop: 16,
                padding: 18,
                borderRadius: 12,
                border: "2px solid #b00020",
                background: "#fff8f8",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  color: "#b00020",
                  fontWeight: 800,
                }}
              >
                {t(
                  "IMPORTANT — Votre numéro de dossier",
                  "IMPORTANT — Your file number",
                  "IMPORTANTE — Su número de expediente"
                )}
              </p>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                {t(
                  "Voici votre numéro de dossier ComptaNet Québec :",
                  "This is your ComptaNet Québec file number:",
                  "Este es su número de expediente de ComptaNet Québec:"
                )}
              </p>

              <div
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1px solid #e5c4c4",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                {cqId || "..."}
              </div>

              <p
                style={{
                  marginTop: 14,
                  marginBottom: 10,
                  fontWeight: 700,
                }}
              >
                {t(
                  "Inscrivez exactement ce numéro dans le message de votre virement Interac.",
                  "Enter this exact number in the message of your Interac e-Transfer.",
                  "Escriba exactamente este número en el mensaje de su transferencia Interac."
                )}
              </p>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 12,
                  fontSize: 14,
                }}
              >
                {t(
                  "Ce numéro permet à ComptaNet Québec d’identifier votre dossier et d’associer votre paiement au bon compte.",
                  "This number allows ComptaNet Québec to identify your file and apply your payment to the correct account.",
                  "Este número permite a ComptaNet Québec identificar su expediente y asociar su pago a la cuenta correcta."
                )}
              </p>

              <button
                type="button"
                className="ff-btn ff-btn-outline"
                onClick={copyCqId}
                disabled={!cqId}
              >
                {copied
                  ? t(
                      "Numéro copié !",
                      "Number copied!",
                      "¡Número copiado!"
                    )
                  : t(
                      "Copier le numéro",
                      "Copy number",
                      "Copiar número"
                    )}
              </button>
            </div>

            {/* APRÈS LE VIREMENT */}
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 10,
                background: "#f4f8ff",
              }}
            >
              <strong>
                {t(
                  "Après avoir effectué votre virement :",
                  "After sending your transfer:",
                  "Después de realizar su transferencia:"
                )}
              </strong>

              <p
                style={{
                  marginBottom: 0,
                  marginTop: 6,
                }}
              >
                {t(
                  "Cliquez sur « J’ai envoyé le virement Interac ». Votre dossier sera indiqué comme virement envoyé, en attente de confirmation par ComptaNet Québec.",
                  "Click “I sent the Interac transfer”. Your file will be marked as transfer sent, awaiting confirmation by ComptaNet Québec.",
                  "Haga clic en « Ya envié la transferencia Interac ». Su expediente quedará marcado como transferencia enviada, pendiente de confirmación por ComptaNet Québec."
                )}
              </p>
            </div>

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

            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                className="ff-btn ff-btn-primary ff-btn-big"
                onClick={goInterac}
                disabled={loadingInterac || !cqId}
                aria-busy={loadingInterac}
              >
                {loadingInterac
                  ? t(
                      "Enregistrement...",
                      "Saving...",
                      "Guardando..."
                    )
                  : t(
                      "J’ai envoyé le virement Interac",
                      "I sent the Interac transfer",
                      "Ya envié la transferencia Interac"
                    )}
              </button>
            </div>

            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                fontSize: 14,
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              {t(
                "Ne cliquez sur ce bouton qu’après avoir réellement envoyé le virement.",
                "Only click this button after you have actually sent the transfer.",
                "Haga clic en este botón únicamente después de haber enviado realmente la transferencia."
              )}
            </p>
          </section>

          {/* CARTE + LINK */}
          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>
              {t(
                "Paiement par carte ou Link",
                "Card or Link payment",
                "Pago con tarjeta o Link"
              )}
            </h2>

            <p>
              {t(
                "Paiement sécurisé directement dans ComptaNet Québec.",
                "Secure payment directly within ComptaNet Québec.",
                "Pago seguro directamente en ComptaNet Québec."
              )}
            </p>

            <p>
              <strong>
                {t(
                  "Montant :",
                  "Amount:",
                  "Monto:"
                )}
              </strong>{" "}
              100 $
            </p>

            <p>
              {t(
                "Payez par carte ou utilisez Link pour un paiement plus rapide.",
                "Pay by card or use Link for faster checkout.",
                "Pague con tarjeta o utilice Link para un pago más rápido."
              )}
            </p>

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="ff-btn ff-btn-outline ff-btn-big"
                onClick={goStripe}
              >
                {t(
                  "Payer par carte ou Link",
                  "Pay by card or Link",
                  "Pagar con tarjeta o Link"
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
