"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Lang = "fr" | "en" | "es";
type TaxMode = "none" | "gst" | "gst_qst";

type Revenue = {
  id: string;
  date: string;
  source: string;
  description: string;
  subtotal: number;
  taxMode: TaxMode;
  gst: number;
  qst: number;
  total: number;
  paymentMethod: string;
};

const GST_RATE = 0.05;
const QST_RATE = 0.09975;

const money = (value: number, lang: Lang) =>
  new Intl.NumberFormat(lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export default function RevenusPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxMode, setTaxMode] = useState<TaxMode>("gst_qst");
  const [paymentMethod, setPaymentMethod] = useState("transfer");

  const currentYear = new Date().getFullYear();
  const date =
    day && month && year
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("lang");
    if (value === "fr" || value === "en" || value === "es") setLang(value);
  }, []);

  const copy = {
    fr: {
      title: "Revenus",
      subtitle: "Ajoutez et consultez les revenus de votre entreprise.",
      back: "Retour à la tenue de livres",
      add: "Ajouter un revenu",
      edit: "Modifier le revenu",
      date: "Date",
      day: "Jour",
      month: "Mois",
      year: "Année",
      source: "Client ou source",
      sourcePlaceholder: "Ex. Airbnb, client, contrat",
      description: "Description",
      descriptionPlaceholder: "Ex. Service rendu ou vente",
      subtotal: "Montant avant taxes",
      taxes: "Taxes applicables",
      noTax: "Aucune taxe",
      gstOnly: "TPS seulement (5 %)",
      gstQst: "TPS (5 %) + TVQ (9,975 %)",
      gst: "TPS",
      qst: "TVQ",
      total: "Total",
      payment: "Mode de paiement",
      transfer: "Virement Interac",
      card: "Carte",
      cash: "Comptant",
      cheque: "Chèque",
      platform: "Plateforme",
      other: "Autre",
      save: "Enregistrer",
      update: "Mettre à jour",
      cancel: "Annuler",
      list: "Revenus enregistrés",
      empty: "Aucun revenu enregistré pour le moment.",
      actions: "Actions",
      modify: "Modifier",
      remove: "Supprimer",
      confirm: "Supprimer ce revenu?",
      required: "Remplissez la date, la source et un montant valide.",
      count: "Transactions",
      beforeTax: "Avant taxes",
      collected: "Taxes perçues",
      notice: "La sauvegarde sécurisée dans le compte client sera branchée à Supabase à la prochaine étape.",
    },
    en: {
      title: "Income",
      subtitle: "Add and review your business income.",
      back: "Back to bookkeeping",
      add: "Add income",
      edit: "Edit income",
      date: "Date",
      day: "Day",
      month: "Month",
      year: "Year",
      source: "Client or source",
      sourcePlaceholder: "E.g. Airbnb, client, contract",
      description: "Description",
      descriptionPlaceholder: "E.g. Service or sale",
      subtotal: "Amount before tax",
      taxes: "Applicable taxes",
      noTax: "No tax",
      gstOnly: "GST only (5%)",
      gstQst: "GST (5%) + QST (9.975%)",
      gst: "GST",
      qst: "QST",
      total: "Total",
      payment: "Payment method",
      transfer: "Interac e-Transfer",
      card: "Card",
      cash: "Cash",
      cheque: "Cheque",
      platform: "Platform",
      other: "Other",
      save: "Save",
      update: "Update",
      cancel: "Cancel",
      list: "Recorded income",
      empty: "No income recorded yet.",
      actions: "Actions",
      modify: "Edit",
      remove: "Delete",
      confirm: "Delete this income entry?",
      required: "Enter a date, a source and a valid amount.",
      count: "Transactions",
      beforeTax: "Before tax",
      collected: "Tax collected",
      notice: "Secure saving to the client account will be connected to Supabase in the next step.",
    },
    es: {
      title: "Ingresos",
      subtitle: "Añada y consulte los ingresos de su empresa.",
      back: "Volver a contabilidad",
      add: "Añadir un ingreso",
      edit: "Modificar el ingreso",
      date: "Fecha",
      day: "Día",
      month: "Mes",
      year: "Año",
      source: "Cliente o fuente",
      sourcePlaceholder: "Ej. Airbnb, cliente, contrato",
      description: "Descripción",
      descriptionPlaceholder: "Ej. Servicio o venta",
      subtotal: "Importe antes de impuestos",
      taxes: "Impuestos aplicables",
      noTax: "Sin impuestos",
      gstOnly: "GST solamente (5 %) ",
      gstQst: "GST (5 %) + QST (9,975 %)",
      gst: "GST",
      qst: "QST",
      total: "Total",
      payment: "Método de pago",
      transfer: "Transferencia Interac",
      card: "Tarjeta",
      cash: "Efectivo",
      cheque: "Cheque",
      platform: "Plataforma",
      other: "Otro",
      save: "Guardar",
      update: "Actualizar",
      cancel: "Cancelar",
      list: "Ingresos registrados",
      empty: "Todavía no hay ingresos registrados.",
      actions: "Acciones",
      modify: "Modificar",
      remove: "Eliminar",
      confirm: "¿Eliminar este ingreso?",
      required: "Introduzca una fecha, una fuente y un importe válido.",
      count: "Transacciones",
      beforeTax: "Antes de impuestos",
      collected: "Impuestos cobrados",
      notice: "El guardado seguro en la cuenta del cliente se conectará a Supabase en el próximo paso.",
    },
  }[lang];

  const amount = Number.parseFloat(subtotal.replace(",", ".")) || 0;
  const calculatedGst = taxMode === "none" ? 0 : roundMoney(amount * GST_RATE);
  const calculatedQst = taxMode === "gst_qst" ? roundMoney(amount * QST_RATE) : 0;
  const calculatedTotal = roundMoney(amount + calculatedGst + calculatedQst);

  const summary = useMemo(() => {
    return revenues.reduce(
      (sum, item) => ({
        subtotal: sum.subtotal + item.subtotal,
        gst: sum.gst + item.gst,
        qst: sum.qst + item.qst,
        total: sum.total + item.total,
      }),
      { subtotal: 0, gst: 0, qst: 0, total: 0 }
    );
  }, [revenues]);

  function resetForm() {
    setEditingId(null);
    setDay("");
    setMonth("");
    setYear("");
    setSource("");
    setDescription("");
    setSubtotal("");
    setTaxMode("gst_qst");
    setPaymentMethod("transfer");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDate = new Date(`${date}T12:00:00`);
    const validDate =
      Boolean(date) &&
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.getFullYear() === Number(year) &&
      parsedDate.getMonth() + 1 === Number(month) &&
      parsedDate.getDate() === Number(day);

    if (!validDate || !source.trim() || amount <= 0) {
      window.alert(copy.required);
      return;
    }

    const entry: Revenue = {
      id: editingId ?? crypto.randomUUID(),
      date,
      source: source.trim(),
      description: description.trim(),
      subtotal: roundMoney(amount),
      taxMode,
      gst: calculatedGst,
      qst: calculatedQst,
      total: calculatedTotal,
      paymentMethod,
    };

    setRevenues((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? entry : item))
        : [entry, ...current]
    );
    resetForm();
  }

  function edit(item: Revenue) {
    setEditingId(item.id);
    const [savedYear, savedMonth, savedDay] = item.date.split("-");
    setDay(savedDay);
    setMonth(savedMonth);
    setYear(savedYear);
    setSource(item.source);
    setDescription(item.description);
    setSubtotal(item.subtotal.toFixed(2));
    setTaxMode(item.taxMode);
    setPaymentMethod(item.paymentMethod);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    if (window.confirm(copy.confirm)) {
      setRevenues((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    }
  }

  const panel = {
    background: "#ffffff",
    border: "1px solid #dbe5f1",
    borderRadius: 18,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  } as const;
  const input = {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "11px 12px",
    fontSize: 15,
    background: "#fff",
    color: "#0f172a",
  };
  const label = { display: "grid", gap: 7, fontWeight: 800, fontSize: 14 } as const;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f9ff", color: "#0f172a", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href={`/tenue-de-livres?lang=${lang}`} style={{ color: "#004aad", textDecoration: "none", fontWeight: 900 }}>
            ← {copy.back}
          </Link>
          <div style={{ display: "flex", gap: 6 }}>
            {(["fr", "en", "es"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setLang(item)} style={{ border: "1px solid #004aad", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontWeight: 800, background: lang === item ? "#004aad" : "#fff", color: lang === item ? "#fff" : "#004aad" }}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 22 }}>
          <div>
            <div style={{ color: "#004aad", fontWeight: 900, marginBottom: 7 }}>💰 ComptaNet Québec</div>
            <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 44px)" }}>{copy.title}</h1>
            <p style={{ color: "#64748b", marginBottom: 0 }}>{copy.subtitle}</p>
          </div>
          <div style={{ background: "#eaf3ff", border: "1px solid #bfdbfe", color: "#004aad", borderRadius: 10, padding: "10px 14px", fontWeight: 900 }}>{currentYear}</div>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 22 }}>
          <Summary title={copy.count} value={String(revenues.length)} />
          <Summary title={copy.beforeTax} value={money(summary.subtotal, lang)} />
          <Summary title={copy.collected} value={money(summary.gst + summary.qst, lang)} />
          <Summary title={copy.total} value={money(summary.total, lang)} strong />
        </section>

        <section style={{ ...panel, padding: 22, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 22 }}>{editingId ? copy.edit : copy.add}</h2>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 800, fontSize: 14, marginBottom: 7 }}>{copy.date}</legend>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <label style={label}>
                    {copy.day}
                    <select required value={day} onChange={(e) => setDay(e.target.value)} style={input}>
                      <option value="">JJ</option>
                      {Array.from({ length: 31 }, (_, index) => index + 1).map((value) => (
                        <option key={value} value={String(value).padStart(2, "0")}>{String(value).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </label>
                  <label style={label}>
                    {copy.month}
                    <select required value={month} onChange={(e) => setMonth(e.target.value)} style={input}>
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                        <option key={value} value={String(value).padStart(2, "0")}>{String(value).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </label>
                  <label style={label}>
                    {copy.year}
                    <select required value={year} onChange={(e) => setYear(e.target.value)} style={input}>
                      <option value="">AAAA</option>
                      {Array.from({ length: 8 }, (_, index) => currentYear + 1 - index).map((value) => (
                        <option key={value} value={String(value)}>{value}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
              <label style={label}>{copy.source}<input required value={source} onChange={(e) => setSource(e.target.value)} placeholder={copy.sourcePlaceholder} style={input} /></label>
              <label style={label}>{copy.description}<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={copy.descriptionPlaceholder} style={input} /></label>
              <label style={label}>{copy.subtotal}<input required min="0.01" step="0.01" inputMode="decimal" type="number" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="0.00" style={input} /></label>
              <label style={label}>{copy.taxes}<select value={taxMode} onChange={(e) => setTaxMode(e.target.value as TaxMode)} style={input}><option value="none">{copy.noTax}</option><option value="gst">{copy.gstOnly}</option><option value="gst_qst">{copy.gstQst}</option></select></label>
              <label style={label}>{copy.payment}<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={input}><option value="transfer">{copy.transfer}</option><option value="card">{copy.card}</option><option value="cash">{copy.cash}</option><option value="cheque">{copy.cheque}</option><option value="platform">{copy.platform}</option><option value="other">{copy.other}</option></select></label>
            </div>

            <div style={{ background: "#f0f7ff", border: "1px solid #cfe3ff", borderRadius: 12, padding: 15, marginTop: 18, display: "flex", gap: 22, flexWrap: "wrap" }}>
              <span><strong>{copy.gst}:</strong> {money(calculatedGst, lang)}</span>
              <span><strong>{copy.qst}:</strong> {money(calculatedQst, lang)}</span>
              <span style={{ color: "#004aad" }}><strong>{copy.total}:</strong> {money(calculatedTotal, lang)}</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button type="submit" style={{ border: 0, borderRadius: 10, padding: "11px 18px", background: "#004aad", color: "#fff", fontWeight: 900, cursor: "pointer" }}>{editingId ? copy.update : copy.save}</button>
              {editingId && <button type="button" onClick={resetForm} style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "11px 18px", background: "#fff", color: "#334155", fontWeight: 800, cursor: "pointer" }}>{copy.cancel}</button>}
            </div>
          </form>
        </section>

        <section style={{ ...panel, overflow: "hidden" }}>
          <h2 style={{ margin: 0, padding: "20px 22px", fontSize: 22, borderBottom: "1px solid #e2e8f0" }}>{copy.list}</h2>
          {revenues.length === 0 ? (
            <p style={{ color: "#64748b", padding: 22, margin: 0 }}>{copy.empty}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
                <thead><tr style={{ background: "#f8fafc", textAlign: "left" }}><Th>{copy.date}</Th><Th>{copy.source}</Th><Th>{copy.description}</Th><Th>{copy.beforeTax}</Th><Th>{copy.gst}</Th><Th>{copy.qst}</Th><Th>{copy.total}</Th><Th>{copy.actions}</Th></tr></thead>
                <tbody>
                  {revenues.map((item) => (
                    <tr key={item.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                     <Td>{item.date.split("-").reverse().join("/")}</Td>
<Td>{item.source}</Td>
<Td>{item.description || "—"}</Td>
<Td>{money(item.subtotal, lang)}</Td>
<Td>{money(item.gst, lang)}</Td>
<Td>{money(item.qst, lang)}</Td>
<Td>
  <strong>{money(item.total, lang)}</strong>
</Td>
                      <Td><div style={{ display: "flex", gap: 7 }}><button type="button" onClick={() => edit(item)} style={smallButton}>{copy.modify}</button><button type="button" onClick={() => remove(item.id)} style={{ ...smallButton, color: "#b91c1c", borderColor: "#fecaca" }}>{copy.remove}</button></div></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 10, padding: 13, fontSize: 13, marginTop: 18 }}>ℹ️ {copy.notice}</p>
      </div>
    </main>
  );
}

const smallButton = { border: "1px solid #bfdbfe", background: "#fff", color: "#004aad", borderRadius: 7, padding: "6px 9px", fontWeight: 800, cursor: "pointer" } as const;

function Summary({ title, value, strong = false }: { title: string; value: string; strong?: boolean }) {
  return <div style={{ background: strong ? "#004aad" : "#fff", color: strong ? "#fff" : "#0f172a", border: "1px solid #dbe5f1", borderRadius: 14, padding: 18 }}><div style={{ opacity: strong ? 0.86 : 1, color: strong ? "#fff" : "#64748b", fontSize: 13, fontWeight: 800 }}>{title}</div><div style={{ fontSize: 24, fontWeight: 900, marginTop: 9 }}>{value}</div></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "12px 14px", color: "#475569", fontSize: 13 }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "13px 14px", fontSize: 14 }}>{children}</td>;
}
