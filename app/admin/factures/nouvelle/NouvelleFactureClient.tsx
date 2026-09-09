"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type LigneFacture = {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: string;
};

const COPY = {
  fr: {
    title: "Nouvelle facture",
    subtitle: "Créer une facture ComptaNet Québec",
    back: "← Retour aux factures",

    client: "Client",
    name: "Nom du client",
    email: "Courriel",
    address: "Adresse",
    city: "Ville",
    province: "Province",
    postal: "Code postal",

    invoice: "Services facturés",
    description: "Description",
    descriptionPlaceholder: "Ex. : Déclaration de revenus T1",
    quantity: "Quantité",
    price: "Prix avant taxes",
    amount: "Montant",
    addLine: "+ Ajouter une ligne",
    removeLine: "Retirer",

    subtotal: "Sous-total",
    gst: "TPS (5 %)",
    qst: "TVQ (9,975 %)",
    total: "TOTAL",

    payment: "Paiement",
    status: "Statut",
    unpaid: "À payer",
    paid: "Payée",
    paymentMethod: "Mode de paiement",
    interac: "Virement Interac",
    stripe: "Stripe",
    cash: "Comptant",
    other: "Autre",

    save: "Enregistrer la facture",
    saving: "Enregistrement...",
    success: "Facture enregistrée.",
    required:
      "Le nom du client et au moins une ligne avec une description et un montant sont obligatoires.",
    invalidTotal:
      "Le total de la facture doit être supérieur à 0 $.",
    saveError: "Impossible d'enregistrer la facture.",
    lineError:
      "La facture a été créée, mais les lignes n'ont pas pu être enregistrées.",
  },

  en: {
    title: "New invoice",
    subtitle: "Create a ComptaNet Québec invoice",
    back: "← Back to invoices",

    client: "Client",
    name: "Client name",
    email: "Email",
    address: "Address",
    city: "City",
    province: "Province",
    postal: "Postal code",

    invoice: "Services billed",
    description: "Description",
    descriptionPlaceholder: "E.g. Personal income tax return",
    quantity: "Quantity",
    price: "Price before taxes",
    amount: "Amount",
    addLine: "+ Add a line",
    removeLine: "Remove",

    subtotal: "Subtotal",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    total: "TOTAL",

    payment: "Payment",
    status: "Status",
    unpaid: "Amount due",
    paid: "Paid",
    paymentMethod: "Payment method",
    interac: "Interac e-Transfer",
    stripe: "Stripe",
    cash: "Cash",
    other: "Other",

    save: "Save invoice",
    saving: "Saving...",
    success: "Invoice saved.",
    required:
      "Client name and at least one line with a description and amount are required.",
    invalidTotal:
      "The invoice total must be greater than $0.",
    saveError: "Unable to save invoice.",
    lineError:
      "The invoice was created, but the invoice lines could not be saved.",
  },

  es: {
    title: "Nueva factura",
    subtitle: "Crear una factura de ComptaNet Québec",
    back: "← Volver a las facturas",

    client: "Cliente",
    name: "Nombre del cliente",
    email: "Correo electrónico",
    address: "Dirección",
    city: "Ciudad",
    province: "Provincia",
    postal: "Código postal",

    invoice: "Servicios facturados",
    description: "Descripción",
    descriptionPlaceholder: "Ej.: Declaración de impuestos",
    quantity: "Cantidad",
    price: "Precio antes de impuestos",
    amount: "Importe",
    addLine: "+ Agregar una línea",
    removeLine: "Eliminar",

    subtotal: "Subtotal",
    gst: "GST/TPS (5 %)",
    qst: "QST/TVQ (9,975 %)",
    total: "TOTAL",

    payment: "Pago",
    status: "Estado",
    unpaid: "Por pagar",
    paid: "Pagada",
    paymentMethod: "Método de pago",
    interac: "Transferencia Interac",
    stripe: "Stripe",
    cash: "Efectivo",
    other: "Otro",

    save: "Guardar factura",
    saving: "Guardando...",
    success: "Factura guardada.",
    required:
      "El nombre del cliente y al menos una línea con descripción e importe son obligatorios.",
    invalidTotal:
      "El total de la factura debe ser superior a $0.",
    saveError: "No se pudo guardar la factura.",
    lineError:
      "La factura fue creada, pero no se pudieron guardar las líneas.",
  },
} as const;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function nouvelleLigne(): LigneFacture {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantite: 1,
    prixUnitaire: "",
  };
}

export default function NouvelleFactureClient({
  lang,
}: {
  lang: Lang;
}) {
  const L = COPY[lang];

  const [clientNom, setClientNom] = useState("");
  const [clientCourriel, setClientCourriel] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [clientVille, setClientVille] = useState("");
  const [clientProvince, setClientProvince] = useState("QC");
  const [clientCodePostal, setClientCodePostal] = useState("");

  const [lignes, setLignes] = useState<LigneFacture[]>([
    nouvelleLigne(),
  ]);

  const [statut, setStatut] = useState("unpaid");
  const [modePaiement, setModePaiement] = useState("interac");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function prixNombre(value: string) {
    return Number(value.replace(",", ".")) || 0;
  }

  function montantLigne(ligne: LigneFacture) {
    const quantite = Number(ligne.quantite) || 1;
    const prix = prixNombre(ligne.prixUnitaire);

    return roundMoney(quantite * prix);
  }

  const montants = useMemo(() => {
    const sousTotal = roundMoney(
      lignes.reduce((total, ligne) => {
        return total + montantLigne(ligne);
      }, 0)
    );

    const tps = roundMoney(sousTotal * 0.05);
    const tvq = roundMoney(sousTotal * 0.09975);
    const total = roundMoney(sousTotal + tps + tvq);

    return {
      sousTotal,
      tps,
      tvq,
      total,
    };
  }, [lignes]);

  function money(value: number) {
    const locale =
      lang === "fr"
        ? "fr-CA"
        : lang === "es"
        ? "es-CA"
        : "en-CA";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
    }).format(value);
  }

  function modifierLigne(
    id: string,
    champ: "description" | "quantite" | "prixUnitaire",
    valeur: string | number
  ) {
    setLignes((actuelles) =>
      actuelles.map((ligne) =>
        ligne.id === id
          ? {
              ...ligne,
              [champ]: valeur,
            }
          : ligne
      )
    );
  }

  function ajouterLigne() {
    setLignes((actuelles) => [
      ...actuelles,
      nouvelleLigne(),
    ]);
  }

  function retirerLigne(id: string) {
    setLignes((actuelles) => {
      if (actuelles.length === 1) {
        return actuelles;
      }

      return actuelles.filter(
        (ligne) => ligne.id !== id
      );
    });
  }

  async function enregistrer() {
    setMessage(null);

    /*
      Une ligne est valide si :
      - elle possède une description
      - son montant n'est pas égal à zéro

      Les montants négatifs sont permis :
      Rabais = -20
      Crédit = -50
      Ajustement = -10
    */
    const lignesValides = lignes.filter(
      (ligne) =>
        ligne.description.trim() &&
        prixNombre(ligne.prixUnitaire) !== 0
    );

    if (
      !clientNom.trim() ||
      lignesValides.length === 0
    ) {
      setMessage(L.required);
      return;
    }

    /*
      Une facture normale doit quand même
      terminer avec un sous-total positif.
    */
    if (montants.sousTotal < 0.01) {
      setMessage(L.invalidTotal);
      return;
    }

    setSaving(true);

    const now = new Date();
    const dateFacture =
      now.toISOString().slice(0, 10);

    const estPayee = statut === "paid";

    /*
      On conserve la première ligne dans
      les anciennes colonnes de "factures"
      pour garder la compatibilité avec
      l'affichage et le PDF actuels.

      Les vraies lignes complètes sont
      enregistrées dans "facture_lignes".
    */
    const premiereLigne = lignesValides[0];

    const {
      data: factureCreee,
      error: factureError,
    } = await supabase
      .from("factures")
      .insert({
        client_nom: clientNom.trim(),

        client_courriel:
          clientCourriel.trim().toLowerCase() ||
          null,

        client_adresse:
          clientAdresse.trim() || null,

        client_ville:
          clientVille.trim() || null,

        client_province:
          clientProvince.trim() || null,

        client_code_postal:
          clientCodePostal
            .trim()
            .toUpperCase() || null,

        formulaire_id: null,
        cq_id: null,

        description:
          premiereLigne.description.trim(),

        quantite:
          Number(premiereLigne.quantite) || 1,

        prix_unitaire:
          prixNombre(
            premiereLigne.prixUnitaire
          ),

        sous_total: montants.sousTotal,
        tps: montants.tps,
        tvq: montants.tvq,
        total: montants.total,

        statut,

        montant_paye:
          estPayee ? montants.total : 0,

        mode_paiement:
          estPayee ? modePaiement : null,

        date_facture: dateFacture,

        date_paiement:
          estPayee
            ? now.toISOString()
            : null,

        updated_at: now.toISOString(),
      })
      .select("id, numero_facture")
      .single();

    if (factureError || !factureCreee) {
      setSaving(false);

      setMessage(
        `${L.saveError} ${
          factureError?.message ?? ""
        }`.trim()
      );

      return;
    }

    /*
      Enregistrement de toutes les lignes,
      incluant les rabais négatifs.
    */
    const lignesAInserer =
      lignesValides.map(
        (ligne, index) => ({
          facture_id: factureCreee.id,

          description:
            ligne.description.trim(),

          quantite:
            Number(ligne.quantite) || 1,

          prix_unitaire:
            prixNombre(
              ligne.prixUnitaire
            ),

          montant:
            montantLigne(ligne),

          ordre: index + 1,
        })
      );

    const { error: lignesError } =
      await supabase
        .from("facture_lignes")
        .insert(lignesAInserer);

    setSaving(false);

    if (lignesError) {
      setMessage(
        `${L.lineError} ${lignesError.message}`
      );
      return;
    }

    setMessage(
      `${L.success} ${
        factureCreee.numero_facture ?? ""
      }`.trim()
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/admin/factures?lang=${lang}`}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          {L.back}
        </Link>

        <div className="mb-8 mt-5">
          <h1 className="text-3xl font-bold text-slate-900">
            {L.title}
          </h1>

          <p className="mt-1 text-slate-500">
            {L.subtitle}
          </p>
        </div>

        {/* CLIENT */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            {L.client}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={L.name}
              value={clientNom}
              onChange={setClientNom}
            />

            <Field
              label={L.email}
              type="email"
              value={clientCourriel}
              onChange={setClientCourriel}
            />

            <Field
              label={L.address}
              value={clientAdresse}
              onChange={setClientAdresse}
            />

            <Field
              label={L.city}
              value={clientVille}
              onChange={setClientVille}
            />

            <Field
              label={L.province}
              value={clientProvince}
              onChange={setClientProvince}
            />

            <Field
              label={L.postal}
              value={clientCodePostal}
              onChange={setClientCodePostal}
            />
          </div>
        </section>

        {/* SERVICES */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {L.invoice}
            </h2>

            <button
              type="button"
              onClick={ajouterLigne}
              className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              {L.addLine}
            </button>
          </div>

          <div className="space-y-4">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">
                    #{index + 1}
                  </span>

                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        retirerLigne(ligne.id)
                      }
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      {L.removeLine}
                    </button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_110px_160px_150px]">
                  {/* DESCRIPTION */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {L.description}
                    </label>

                    <input
                      type="text"
                      value={ligne.description}
                      placeholder={
                        L.descriptionPlaceholder
                      }
                      onChange={(e) =>
                        modifierLigne(
                          ligne.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* QUANTITÉ */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {L.quantity}
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) =>
                        modifierLigne(
                          ligne.id,
                          "quantite",
                          Math.max(
                            1,
                            Number(
                              e.target.value
                            ) || 1
                          )
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                    />
                  </div>

                  {/* PRIX */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {L.price}
                    </label>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={ligne.prixUnitaire}
                      placeholder="125.00"
                      onChange={(e) =>
                        modifierLigne(
                          ligne.id,
                          "prixUnitaire",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Ex. 125 ou -20
                    </p>
                  </div>

                  {/* MONTANT */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {L.amount}
                    </label>

                    <div
                      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-right font-bold ${
                        montantLigne(ligne) < 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {money(
                        montantLigne(ligne)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CALCUL DES TAXES */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="ml-auto max-w-md space-y-3">
            <MoneyLine
              label={L.subtotal}
              value={money(
                montants.sousTotal
              )}
            />

            <MoneyLine
              label={L.gst}
              value={money(montants.tps)}
            />

            <MoneyLine
              label={L.qst}
              value={money(montants.tvq)}
            />

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900">
                  {L.total}
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {money(montants.total)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PAIEMENT */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            {L.payment}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* STATUT */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {L.status}
              </label>

              <select
                value={statut}
                onChange={(e) =>
                  setStatut(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="unpaid">
                  {L.unpaid}
                </option>

                <option value="paid">
                  {L.paid}
                </option>
              </select>
            </div>

            {/* MODE DE PAIEMENT */}
            {statut === "paid" && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {L.paymentMethod}
                </label>

                <select
                  value={modePaiement}
                  onChange={(e) =>
                    setModePaiement(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="interac">
                    {L.interac}
                  </option>

                  <option value="stripe">
                    {L.stripe}
                  </option>

                  <option value="cash">
                    {L.cash}
                  </option>

                  <option value="other">
                    {L.other}
                  </option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 font-medium text-slate-700">
            {message}
          </div>
        )}

        {/* ENREGISTRER */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={enregistrer}
            className="rounded-xl bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? L.saving
              : L.save}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </div>
  );
}

function MoneyLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}
