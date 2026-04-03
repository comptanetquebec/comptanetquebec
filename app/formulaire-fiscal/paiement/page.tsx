"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "../formulaire-fiscal.css";
import Steps from "../Steps";

export default function PaiementPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1";
  const lang = params.get("lang") || "fr";

  const montant = "100 $";

  const goInterac = () => {
    router.push(`/merci?fid=${fid}&type=${type}&lang=${lang}`);
  };

  const goStripe = () => {
    router.push(`/paiement?fid=${fid}&type=${type}&lang=${lang}`);
  };

  return (
    <main className="ff-bg">
      <div className="ff-container">

        {/* HEADER */}
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
              <span>Paiement du dossier</span>
            </div>
          </div>

          <div className="ff-header-right">
            <Steps step={3} lang={lang as any} />
          </div>
        </header>

        {/* TITLE */}
        <div className="ff-title">
          <h1>Paiement de votre dossier</h1>
          <p>
            Vos documents ont bien été reçus. Veuillez choisir votre mode de paiement pour débuter le traitement.
          </p>
        </div>

        {/* CONTENU */}
        <div className="ff-form">

          {/* INTERAC */}
          <section className="ff-card" style={{ marginBottom: 20 }}>
            <h2>💸 Virement Interac (recommandé)</h2>

            <p><strong>Montant :</strong> {montant}</p>
            <p><strong>Courriel :</strong> comptanetquebec@gmail.com</p>

            <p style={{ fontWeight: 600, color: "#0f5132" }}>
              Traitement prioritaire avec cette méthode.
            </p>

            <p>
              Dépôt automatique activé. Aucune question de sécurité requise.
            </p>

            {fid && (
              <p><strong>Numéro de dossier :</strong> {fid}</p>
            )}

            <p>
              Veuillez inscrire votre nom complet{fid ? " et votre numéro de dossier" : ""} dans le message du virement.
            </p>

            <div style={{ marginTop: 14 }}>
              <button className="ff-btn" onClick={goInterac}>
                J’ai effectué le virement
              </button>
            </div>
          </section>

          {/* STRIPE */}
          <section className="ff-card">
            <h2>💳 Paiement par carte</h2>

            <p><strong>Montant :</strong> {montant}</p>

            <p>Paiement sécurisé par carte avec Stripe.</p>

            <p style={{ opacity: 0.7 }}>
              Le traitement débute après confirmation du paiement.
            </p>

            <div style={{ marginTop: 14 }}>
              <button className="ff-btn ff-btn-outline" onClick={goStripe}>
                Payer par carte
              </button>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
