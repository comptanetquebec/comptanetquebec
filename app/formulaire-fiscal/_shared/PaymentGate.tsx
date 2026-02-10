"use client";

import React from "react";

type Props = {
  paiement_mode?: "avant" | "apres" | null;
  acompte_paye?: boolean | null;
  paywall: React.ReactNode;   // ton bloc Stripe actuel
  children: React.ReactNode;  // le contenu normal de l’étape
};

export default function PaymentGate({
  paiement_mode,
  acompte_paye,
  paywall,
  children,
}: Props) {
  const mustPayBefore = paiement_mode === "avant" && !acompte_paye;
  if (mustPayBefore) return <>{paywall}</>;
  return <>{children}</>;
}
