"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

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

    invoice: "Facture",
    description: "Description du service",
    descriptionPlaceholder: "Ex. : Préparation de la déclaration de revenus",
    quantity: "Quantité",
    price: "Prix avant taxes",

    subtotal: "Sous-total",
    gst: "TPS (5 %)",
    qst: "TVQ (9,975 %)",
    total: "TOTAL",

    payment: "Paiement",
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
    required: "Le nom du client, la description et le prix sont obligatoires.",
    saveError: "Impossible d'enregistrer la facture.",
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

    invoice: "Invoice",
    description: "Service description",
    descriptionPlaceholder: "E.g. Personal income tax return preparation",
    quantity: "Quantity",
    price: "Price before taxes",

    subtotal: "Subtotal",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    total: "TOTAL",

    payment: "Payment",
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
    required: "Client name, description and price are required.",
    saveError: "Unable to save invoice.",
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

    invoice: "Factura",
    description: "Descripción del servicio",
    descriptionPlaceholder: "Ej.: Preparación de la declaración de impuestos",
    quantity: "Cantidad",
    price: "Precio antes de impuestos",

    subtotal: "Subtotal",
    gst: "GST/TPS (5 %)",
    qst: "QST/TVQ (9,975 %)",
    total: "TOTAL",

    payment: "Pago",
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
    required: "El nombre del cliente, la descripción y el precio son obligatorios.",
    saveError: "No se pudo guardar la factura.",
  },
} as const;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

  const [description, setDescription] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState("");

  const [statut, setStatut] = useState("unpaid");
  const [modePaiement, setModePaiement] = useState("interac");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const montants = useMemo(() => {
    const prix = Number(prixUnitaire.replace(",", ".")) || 0;
    const qty = Number(quantite) || 1;

    const sousTotal = roundMoney(prix * qty);
    const tps = roundMoney(sousTotal * 0.05);
    const tvq = roundMoney(sousTotal * 0.09975);
    const total = roundMoney(sousTotal + tps + tvq);

    return {
      sousTotal,
      tps,
      tvq,
      total,
    };
  }, [prixUnitaire, quantite]);

  function money(value: number) {
    return new Intl.NumberFormat(
      lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA",
      {
        style: "currency",
        currency: "CAD",
      }
    ).format(value);
  }

  async function enregistrer() {
    setMessage(null);

    if (
      !clientNom.trim() ||
      !description.trim() ||
      montants.sousTotal <= 0
    ) {
      setMessage(L.required);
      return;
    }

    setSaving(true);

    const now = new Date();
    const dateFacture = now.toISOString().slice(0, 10);

    /*
      Numéro temporaire unique.
      On remplacera ensuite ceci par notre numérotation CQ définitive
      directement dans Supabase.
    */
    const numeroFacture = `CQ-${Date.now()}`;

    const estPayee = statut === "paid";

    const { error } = await supabase.from("factures").insert({
      numero_facture: numeroFacture,

      client_nom: clientNom.trim(),
      client_courriel: clientCourriel.trim().toLowerCase() || null,
      client_adresse: clientAdresse.trim() || null,
      client_ville: clientVille.trim() || null,
      client_province: clientProvince.trim() || null,
      client_code_postal: clientCodePostal.trim().toUpperCase() || null,

      formulaire_id: null,

      description: description.trim(),
      quantite,
      prix_unitaire: Number(prixUnitaire.replace(",", ".")) || 0,

      sous_total: montants.sousTotal,
      tps: montants.tps,
      tvq: montants.tvq,
      total: montants.total,

      statut,
      montant_paye: estPayee ? montants.total : 0,
      mode_paiement: estPayee ? modePaiement : null,

      date_facture: dateFacture,
      date_paiement: estPayee ? now.toISOString() : null,

      updated_at: now.toISOString(),
    });

    setSaving(false);

    if (error) {
      setMessage(`${L.saveError} ${error.message}`);
      return;
    }

    setMessage(L.success);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href={`/admin/factures?lang=${lang}`}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          {L.back}
        </Link>

        <div className="mt-5 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {L.title}
          </h1>

          <p className="mt-1 text-slate-500">
            {L.subtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* CLIENT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {L.client}
            </h2>

            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <Field
                label={L.postal}
                value={clientCodePostal}
                onChange={setClientCodePostal}
              />
            </div>
          </section>

          {/* FACTURE */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {L.invoice}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {L.description}
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={L.descriptionPlaceholder}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    {L.quantity}
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={quantite}
                    onChange={(e) =>
                      setQuantite(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    {L.price}
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={prixUnitaire}
                    onChange={(e) => setPrixUnitaire(e.target.value)}
                    placeholder="150.00"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* TOTAL */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="ml-auto max-w-md space-y-3">

            <MoneyLine
              label={L.subtotal}
              value={money(montants.sousTotal)}
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
          <h2 className="mb-5 text-xl font-bold">
            {L.payment}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                {L.status}
              </label>

              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="unpaid">{L.unpaid}</option>
                <option value="paid">{L.paid}</option>
              </select>
            </div>

            {statut === "paid" && (
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  {L.paymentMethod}
                </label>

                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="interac">{L.interac}</option>
                  <option value="stripe">{L.stripe}</option>
                  <option value="cash">{L.cash}</option>
                  <option value="other">{L.other}</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {message && (
          <div className="mt-5 rounded-xl bg-slate-100 p-4 font-medium">
            {message}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={enregistrer}
            className="rounded-xl bg-blue-700 px-7 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? L.saving : L.save}
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
        onChange={(e) => onChange(e.target.value)}
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
      <span className="font-semibold">{value}</span>
    </div>
  );
}
