"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type Facture = {
  id: string;
  numero_facture: string | null;
  cq_id: string | null;

  client_nom: string;
  client_courriel: string;
  client_adresse: string;
  client_ville: string;
  client_province: string;
  client_code_postal: string;

  sous_total: number;
  tps: number;
  tvq: number;
  total: number;

  statut: string;
  montant_paye: number;
  mode_paiement: string;

  date_facture: string | null;
};

type LigneInitiale = {
  id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  ordre: number;
};

type LigneForm = {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: string;
};

const COPY = {
  fr: {
    title: "Modifier la facture",
    invoice: "Facture",
    client: "Client",
    name: "Nom du client",
    email: "Courriel",
    address: "Adresse",
    city: "Ville",
    province: "Province",
    postal: "Code postal",

    services: "Services facturés",
    description: "Description",
    quantity: "Quantité",
    price: "Prix avant taxes",
    amount: "Montant",
    addLine: "+ Ajouter une ligne",
    remove: "Retirer",

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

    save: "Enregistrer les modifications",
    saving: "Enregistrement...",
    success: "Facture modifiée avec succès.",
    required:
      "Le nom du client et au moins une ligne avec une description et un montant sont obligatoires.",
    invalidTotal:
      "Le sous-total de la facture doit être supérieur à 0 $.",
    error: "Impossible de modifier la facture.",
  },

  en: {
    title: "Edit invoice",
    invoice: "Invoice",
    client: "Client",
    name: "Client name",
    email: "Email",
    address: "Address",
    city: "City",
    province: "Province",
    postal: "Postal code",

    services: "Services billed",
    description: "Description",
    quantity: "Quantity",
    price: "Price before taxes",
    amount: "Amount",
    addLine: "+ Add a line",
    remove: "Remove",

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

    save: "Save changes",
    saving: "Saving...",
    success: "Invoice updated successfully.",
    required:
      "Client name and at least one line with a description and amount are required.",
    invalidTotal:
      "The invoice subtotal must be greater than $0.",
    error: "Unable to update invoice.",
  },

  es: {
    title: "Modificar factura",
    invoice: "Factura",
    client: "Cliente",
    name: "Nombre del cliente",
    email: "Correo electrónico",
    address: "Dirección",
    city: "Ciudad",
    province: "Provincia",
    postal: "Código postal",

    services: "Servicios facturados",
    description: "Descripción",
    quantity: "Cantidad",
    price: "Precio antes de impuestos",
    amount: "Importe",
    addLine: "+ Agregar una línea",
    remove: "Eliminar",

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

    save: "Guardar cambios",
    saving: "Guardando...",
    success: "Factura modificada correctamente.",
    required:
      "El nombre del cliente y al menos una línea con descripción e importe son obligatorios.",
    invalidTotal:
      "El subtotal de la factura debe ser superior a $0.",
    error: "No se pudo modificar la factura.",
  },
} as const;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function newId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

export default function ModifierFactureClient({
  lang,
  facture,
  lignes,
}: {
  lang: Lang;
  facture: Facture;
  lignes: LigneInitiale[];
}) {
  const router = useRouter();
  const L = COPY[lang];

  const [clientNom, setClientNom] =
    useState(facture.client_nom);

  const [clientCourriel, setClientCourriel] =
    useState(facture.client_courriel);

  const [clientAdresse, setClientAdresse] =
    useState(facture.client_adresse);

  const [clientVille, setClientVille] =
    useState(facture.client_ville);

  const [clientProvince, setClientProvince] =
    useState(facture.client_province || "QC");

  const [clientCodePostal, setClientCodePostal] =
    useState(facture.client_code_postal);

  const [lignesForm, setLignesForm] = useState<LigneForm[]>(
    lignes.map((ligne) => ({
      id: ligne.id,
      description: ligne.description,
      quantite: Number(ligne.quantite) || 1,
      prixUnitaire: String(ligne.prix_unitaire ?? ""),
    }))
  );

  const [statut, setStatut] = useState(
    facture.statut || "unpaid"
  );

  const [modePaiement, setModePaiement] = useState(
    facture.mode_paiement || "interac"
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] =
    useState<string | null>(null);

  function prixNombre(value: string) {
    return Number(value.replace(",", ".")) || 0;
  }

  function montantLigne(ligne: LigneForm) {
    return roundMoney(
      (Number(ligne.quantite) || 1) *
        prixNombre(ligne.prixUnitaire)
    );
  }

  const montants = useMemo(() => {
    const sousTotal = roundMoney(
      lignesForm.reduce(
        (total, ligne) =>
          total + montantLigne(ligne),
        0
      )
    );

    const tps = roundMoney(
      sousTotal * 0.05
    );

    const tvq = roundMoney(
      sousTotal * 0.09975
    );

    const total = roundMoney(
      sousTotal + tps + tvq
    );

    return {
      sousTotal,
      tps,
      tvq,
      total,
    };
  }, [lignesForm]);

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
    champ:
      | "description"
      | "quantite"
      | "prixUnitaire",
    valeur: string | number
  ) {
    setLignesForm((actuelles) =>
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
    setLignesForm((actuelles) => [
      ...actuelles,
      {
        id: newId(),
        description: "",
        quantite: 1,
        prixUnitaire: "",
      },
    ]);
  }

  function retirerLigne(id: string) {
    setLignesForm((actuelles) => {
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

    const lignesValides =
      lignesForm.filter(
        (ligne) =>
          ligne.description.trim() &&
          prixNombre(
            ligne.prixUnitaire
          ) !== 0
      );

    if (
      !clientNom.trim() ||
      lignesValides.length === 0
    ) {
      setMessage(L.required);
      return;
    }

    if (montants.sousTotal < 0.01) {
      setMessage(L.invalidTotal);
      return;
    }

    setSaving(true);

    const maintenant = new Date();
    const estPayee =
      statut === "paid";

    const premiereLigne =
      lignesValides[0];

    /*
      1. METTRE À JOUR LA FACTURE

      On ne touche PAS à numero_facture.
      F-000001 restera F-000001.
    */

    const { error: factureError } =
      await supabase
        .from("factures")
        .update({
          client_nom:
            clientNom.trim(),

          client_courriel:
            clientCourriel
              .trim()
              .toLowerCase() || null,

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

          /*
            On garde aussi la première ligne
            dans les anciennes colonnes.
          */
          description:
            premiereLigne.description.trim(),

          quantite:
            Number(
              premiereLigne.quantite
            ) || 1,

          prix_unitaire:
            prixNombre(
              premiereLigne.prixUnitaire
            ),

          sous_total:
            montants.sousTotal,

          tps:
            montants.tps,

          tvq:
            montants.tvq,

          total:
            montants.total,

          statut,

          montant_paye:
            estPayee
              ? montants.total
              : 0,

          mode_paiement:
            estPayee
              ? modePaiement
              : null,

          date_paiement:
            estPayee
              ? maintenant.toISOString()
              : null,

          updated_at:
            maintenant.toISOString(),
        })
        .eq("id", facture.id);

    if (factureError) {
      setSaving(false);

      setMessage(
        `${L.error} ${factureError.message}`
      );

      return;
    }

    /*
      2. SUPPRIMER LES ANCIENNES LIGNES
    */

    const { error: deleteError } =
      await supabase
        .from("facture_lignes")
        .delete()
        .eq(
          "facture_id",
          facture.id
        );

    if (deleteError) {
      setSaving(false);

      setMessage(
        `${L.error} ${deleteError.message}`
      );

      return;
    }

    /*
      3. RÉENREGISTRER LES LIGNES
    */

    const nouvellesLignes =
      lignesValides.map(
        (ligne, index) => ({
          facture_id:
            facture.id,

          description:
            ligne.description.trim(),

          quantite:
            Number(
              ligne.quantite
            ) || 1,

          prix_unitaire:
            prixNombre(
              ligne.prixUnitaire
            ),

          montant:
            montantLigne(ligne),

          ordre:
            index + 1,
        })
      );

    const { error: insertError } =
      await supabase
        .from("facture_lignes")
        .insert(nouvellesLignes);

    if (insertError) {
      setSaving(false);

      setMessage(
        `${L.error} ${insertError.message}`
      );

      return;
    }

    setSaving(false);

    setMessage(L.success);

    /*
      Rafraîchit les données serveur,
      puis retourne à la facture.
    */

    router.push(
      `/admin/factures/${facture.id}?lang=${lang}`
    );

    router.refresh();
  }

  return (
    <div>
      {/* TITRE */}

      <div className="mb-8">
        <div className="text-sm font-bold text-blue-700">
          {L.invoice}{" "}
          {facture.numero_facture ?? ""}
        </div>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          {L.title}
        </h1>
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
            value={clientCourriel}
            type="email"
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

      {/* LIGNES */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {L.services}
          </h2>

          <button
            type="button"
            onClick={ajouterLigne}
            className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
          >
            {L.addLine}
          </button>
        </div>

        <div className="space-y-4">
          {lignesForm.map(
            (ligne, index) => (
              <div
                key={ligne.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">
                    #{index + 1}
                  </span>

                  {lignesForm.length >
                    1 && (
                    <button
                      type="button"
                      onClick={() =>
                        retirerLigne(
                          ligne.id
                        )
                      }
                      className="text-sm font-bold text-red-600 hover:underline"
                    >
                      {L.remove}
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
                      value={
                        ligne.description
                      }
                      onChange={(e) =>
                        modifierLigne(
                          ligne.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
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
                      value={
                        ligne.quantite
                      }
                      onChange={(e) =>
                        modifierLigne(
                          ligne.id,
                          "quantite",
                          Math.max(
                            1,
                            Number(
                              e.target
                                .value
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
                      value={
                        ligne.prixUnitaire
                      }
                      onChange={(e) =>
                        modifierLigne(
                          ligne.id,
                          "prixUnitaire",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    />

                    <div className="mt-1 text-xs text-slate-400">
                      Ex. 150 ou -20
                    </div>
                  </div>

                  {/* MONTANT */}

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {L.amount}
                    </label>

                    <div
                      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-right font-bold ${
                        montantLigne(
                          ligne
                        ) < 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {money(
                        montantLigne(
                          ligne
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* TOTAUX */}

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
            value={money(
              montants.tps
            )}
          />

          <MoneyLine
            label={L.qst}
            value={money(
              montants.tvq
            )}
          />

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-900">
                {L.total}
              </span>

              <span className="text-2xl font-black text-blue-700">
                {money(
                  montants.total
                )}
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
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              {L.status}
            </label>

            <select
              value={statut}
              onChange={(e) =>
                setStatut(
                  e.target.value
                )
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
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 font-semibold text-slate-700">
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
