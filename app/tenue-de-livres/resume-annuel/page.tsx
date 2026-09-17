"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type Business = {
  id: string;
  business_name: string;
  tax_status: string | null;
};

type Transaction = {
  id: string;
  transaction_date: string;
  entry_type: string;
  subtotal: number | string | null;
  gst: number | string | null;
  qst: number | string | null;
  total: number | string | null;
};

type MonthTotals = {
  income: number;
  expenses: number;
  gstCollected: number;
  qstCollected: number;
  gstPaid: number;
  qstPaid: number;
};

const MONTHS = {
  fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
} as const;

function n(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRegistered(value: string | null) {
  const v = String(value ?? "").trim().toLowerCase();
  return ["registered", "registrant", "inscrit", "gst_qst", "gst-qst"].includes(v);
}

export default function ResumeAnnuelPage() {
  const currentYear = new Date().getFullYear();
  const [lang, setLang] = useState<Lang>("fr");
  const [year, setYear] = useState(currentYear);
  const [business, setBusiness] = useState<Business | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text = {
    fr: {
      title: "Résumé annuel",
      subtitle: "Vue d’ensemble de vos revenus, dépenses, résultat et taxes pour l’année sélectionnée.",
      back: "Retour à la tenue de livres",
      year: "Année",
      income: "Revenus",
      expenses: "Dépenses",
      result: "Résultat",
      taxes: "TPS / TVQ",
      gstCollected: "TPS perçue",
      gstPaid: "TPS payée",
      gstNet: "TPS nette",
      qstCollected: "TVQ perçue",
      qstPaid: "TVQ payée",
      qstNet: "TVQ nette",
      netTaxes: "Solde net TPS/TVQ",
      remit: "À remettre",
      credit: "Crédit / remboursement estimé",
      monthly: "Détail mensuel",
      month: "Mois",
      noData: "Aucune transaction confirmée pour cette année.",
      loading: "Chargement du résumé annuel…",
      loadError: "Impossible de charger le résumé annuel.",
      note: "Résumé basé sur les transactions confirmées enregistrées dans ComptaNet Québec.",
      taxNote: "Les taxes payées sont basées sur les montants saisis dans les dépenses. L’admissibilité réelle aux CTI/RTI peut dépendre de la nature de la dépense et de votre situation.",
      notRegistered: "Cette entreprise n’est pas enregistrée comme inscrite à la TPS/TVQ dans ComptaNet Québec.",
      beforeTaxInfo: "Les revenus et dépenses ci-dessous correspondent aux montants totaux des transactions, taxes comprises, comme sur votre tableau de bord.",
      viewTaxes: "Voir TPS/TVQ",
    },
    en: {
      title: "Annual summary",
      subtitle: "Overview of your income, expenses, net result and taxes for the selected year.",
      back: "Back to bookkeeping",
      year: "Year",
      income: "Income",
      expenses: "Expenses",
      result: "Net result",
      taxes: "GST / QST",
      gstCollected: "GST collected",
      gstPaid: "GST paid",
      gstNet: "Net GST",
      qstCollected: "QST collected",
      qstPaid: "QST paid",
      qstNet: "Net QST",
      netTaxes: "Net GST/QST balance",
      remit: "To remit",
      credit: "Estimated credit / refund",
      monthly: "Monthly detail",
      month: "Month",
      noData: "No confirmed transactions for this year.",
      loading: "Loading annual summary…",
      loadError: "Unable to load annual summary.",
      note: "Summary based on confirmed transactions recorded in ComptaNet Québec.",
      taxNote: "Taxes paid are based on amounts entered on expenses. Actual ITC/ITR eligibility can depend on the nature of the expense and your situation.",
      notRegistered: "This business is not recorded as registered for GST/QST in ComptaNet Québec.",
      beforeTaxInfo: "Income and expenses below are transaction totals including taxes, matching your dashboard.",
      viewTaxes: "View GST/QST",
    },
    es: {
      title: "Resumen anual",
      subtitle: "Resumen de ingresos, gastos, resultado e impuestos del año seleccionado.",
      back: "Volver a contabilidad",
      year: "Año",
      income: "Ingresos",
      expenses: "Gastos",
      result: "Resultado",
      taxes: "GST / QST",
      gstCollected: "GST cobrado",
      gstPaid: "GST pagado",
      gstNet: "GST neto",
      qstCollected: "QST cobrado",
      qstPaid: "QST pagado",
      qstNet: "QST neto",
      netTaxes: "Saldo neto GST/QST",
      remit: "A remitir",
      credit: "Crédito / reembolso estimado",
      monthly: "Detalle mensual",
      month: "Mes",
      noData: "No hay transacciones confirmadas para este año.",
      loading: "Cargando resumen anual…",
      loadError: "No se puede cargar el resumen anual.",
      note: "Resumen basado en transacciones confirmadas registradas en ComptaNet Québec.",
      taxNote: "Los impuestos pagados se basan en los importes ingresados en los gastos. La elegibilidad real de los créditos puede depender del tipo de gasto y de su situación.",
      notRegistered: "Esta empresa no está registrada como inscrita para GST/QST en ComptaNet Québec.",
      beforeTaxInfo: "Los ingresos y gastos siguientes son los totales de las transacciones, impuestos incluidos, igual que en su panel.",
      viewTaxes: "Ver GST/QST",
    },
  }[lang];

  const years = useMemo(
    () => Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i).reverse(),
    [currentYear]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const l = params.get("lang");
    const y = Number(params.get("year"));
    const initialLang: Lang = l === "en" || l === "es" ? l : "fr";
    const initialYear =
      Number.isInteger(y) && y >= 2020 && y <= currentYear + 5 ? y : currentYear;

    setLang(initialLang);
    setYear(initialYear);
    void initialize(initialLang, initialYear);
  }, []);

  async function initialize(initialLang: Lang, initialYear: number) {
    try {
      setLoading(true);
      setError("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        const next = encodeURIComponent(`/tenue-de-livres/resume-annuel?lang=${initialLang}&year=${initialYear}`);
        window.location.replace(`/espace-client?lang=${initialLang}&next=${next}`);
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from("bookkeeping_businesses")
        .select("id, business_name, tax_status")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (businessError) throw new Error(businessError.message);

      if (!businessData) {
        window.location.replace(`/tenue-de-livres/configuration?lang=${initialLang}&year=${initialYear}`);
        return;
      }

      const loadedBusiness = businessData as Business;
      setBusiness(loadedBusiness);
      await loadTransactions(loadedBusiness.id, initialYear);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(businessId: string, selectedYear: number) {
    const { data, error: txError } = await supabase
      .from("bookkeeping_transactions")
      .select("id, transaction_date, entry_type, subtotal, gst, qst, total")
      .eq("business_id", businessId)
      .eq("status", "confirmed")
      .gte("transaction_date", `${selectedYear}-01-01`)
      .lte("transaction_date", `${selectedYear}-12-31`)
      .order("transaction_date", { ascending: true });

    if (txError) throw new Error(txError.message);
    setTransactions((data ?? []) as Transaction[]);
  }

  async function changeYear(nextYear: number) {
    setYear(nextYear);
    const url = new URL(window.location.href);
    url.searchParams.set("year", String(nextYear));
    window.history.replaceState({}, "", url.toString());

    if (!business) return;
    try {
      setLoading(true);
      setError("");
      await loadTransactions(business.id, nextYear);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.loadError);
    } finally {
      setLoading(false);
    }
  }

  function changeLang(next: Lang) {
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState({}, "", url.toString());
  }

  function money(value: number) {
    const locale = lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const monthly = useMemo<MonthTotals[]>(() => {
    const result = Array.from({ length: 12 }, (): MonthTotals => ({
      income: 0,
      expenses: 0,
      gstCollected: 0,
      qstCollected: 0,
      gstPaid: 0,
      qstPaid: 0,
    }));

    for (const tx of transactions) {
      const parts = tx.transaction_date.split("-");
      const month = Number(parts[1]) - 1;
      if (month < 0 || month > 11) continue;

      const subtotal = n(tx.subtotal);
      const gst = n(tx.gst);
      const qst = n(tx.qst);
      const total = n(tx.total) || subtotal + gst + qst;

      if (tx.entry_type === "income") {
        result[month].income += total;
        result[month].gstCollected += gst;
        result[month].qstCollected += qst;
      } else if (tx.entry_type === "expense") {
        result[month].expenses += total;
        result[month].gstPaid += gst;
        result[month].qstPaid += qst;
      }
    }

    return result;
  }, [transactions]);

  const totals = useMemo(
    () => monthly.reduce(
      (a, m) => ({
        income: a.income + m.income,
        expenses: a.expenses + m.expenses,
        gstCollected: a.gstCollected + m.gstCollected,
        qstCollected: a.qstCollected + m.qstCollected,
        gstPaid: a.gstPaid + m.gstPaid,
        qstPaid: a.qstPaid + m.qstPaid,
      }),
      { income: 0, expenses: 0, gstCollected: 0, qstCollected: 0, gstPaid: 0, qstPaid: 0 }
    ),
    [monthly]
  );

  const result = totals.income - totals.expenses;
  const netGst = totals.gstCollected - totals.gstPaid;
  const netQst = totals.qstCollected - totals.qstPaid;
  const netTaxes = netGst + netQst;
  const registered = isRegistered(business?.tax_status ?? null);

  if (loading && !business) {
    return <main style={pageStyle}><div style={loadingStyle}>📊 {text.loading}</div></main>;
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link href={`/tenue-de-livres?lang=${lang}&year=${year}`} style={brandStyle}>
            ComptaNet Québec
          </Link>
          <div style={{ display: "flex", gap: 6 }}>
            {(["fr", "en", "es"] as const).map((item) => (
              <button key={item} type="button" onClick={() => changeLang(item)}
                style={{ ...langButtonStyle,
                  background: lang === item ? "#004aad" : "#fff",
                  color: lang === item ? "#fff" : "#334155",
                  borderColor: lang === item ? "#004aad" : "#dbe3ef",
                }}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={containerStyle}>
        <Link href={`/tenue-de-livres?lang=${lang}&year=${year}`} style={backStyle}>← {text.back}</Link>

        <section style={heroStyle}>
          <div style={{ flex: "1 1 600px" }}>
            <div style={eyebrowStyle}>📊 ComptaNet Québec</div>
            <h1 style={titleStyle}>{text.title}</h1>
            <p style={subtitleStyle}>{text.subtitle}</p>
            {business?.business_name && <div style={businessStyle}>{business.business_name}</div>}
          </div>
          <label style={controlLabelStyle}>
            <span>{text.year}</span>
            <select value={year} onChange={(e) => void changeYear(Number(e.target.value))} style={selectStyle}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </section>

        {error && <div style={errorStyle}><strong>{text.loadError}</strong><div>{error}</div></div>}
        {loading && business && <div style={miniLoadingStyle}>{text.loading}</div>}

        {!loading && !error && (
          <>
            <div style={noteStyle}>ℹ️ {text.beforeTaxInfo}</div>

            <section style={summaryGridStyle}>
              <SummaryCard title={text.income} value={money(totals.income)} icon="💰" />
              <SummaryCard title={text.expenses} value={money(totals.expenses)} icon="🧾" />
              <SummaryCard title={text.result} value={money(result)} icon="📈" />
            </section>

            {registered ? (
              <>
                <section style={taxSectionStyle}>
                  <div style={sectionHeaderStyle}>
                    <div>
                      <h2 style={sectionTitleStyle}>{text.taxes}</h2>
                      <div style={sectionSubStyle}>{year}</div>
                    </div>
                    <Link href={`/tenue-de-livres/taxes?lang=${lang}&year=${year}`} style={taxLinkStyle}>
                      🧮 {text.viewTaxes}
                    </Link>
                  </div>

                  <div style={taxGridStyle}>
                    <TaxCard title="TPS / GST" collectedLabel={text.gstCollected} collected={totals.gstCollected}
                      paidLabel={text.gstPaid} paid={totals.gstPaid} netLabel={text.gstNet} net={netGst} money={money} />
                    <TaxCard title="TVQ / QST" collectedLabel={text.qstCollected} collected={totals.qstCollected}
                      paidLabel={text.qstPaid} paid={totals.qstPaid} netLabel={text.qstNet} net={netQst} money={money} />
                    <section style={balanceStyle}>
                      <div style={smallLabelStyle}>{text.netTaxes}</div>
                      <div style={balanceValueStyle}>{money(Math.abs(netTaxes))}</div>
                      <div style={{ fontWeight: 900, color: netTaxes >= 0 ? "#b45309" : "#047857" }}>
                        {netTaxes >= 0 ? text.remit : text.credit}
                      </div>
                    </section>
                  </div>
                </section>

                <div style={taxNoteStyle}><strong>Note :</strong> {text.taxNote}</div>
              </>
            ) : (
              <div style={warningStyle}>ℹ️ {text.notRegistered}</div>
            )}

            <section style={tableSectionStyle}>
              <div style={tableHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>{text.monthly} — {year}</h2>
                  <div style={sectionSubStyle}>{text.note}</div>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div style={emptyStyle}>{text.noData}</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>{text.month}</th>
                        <th style={thRightStyle}>{text.income}</th>
                        <th style={thRightStyle}>{text.expenses}</th>
                        <th style={thRightStyle}>{text.result}</th>
                        {registered && <th style={thRightStyle}>{text.netTaxes}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m, index) => {
                        const monthResult = m.income - m.expenses;
                        const monthTaxes =
                          (m.gstCollected - m.gstPaid) + (m.qstCollected - m.qstPaid);
                        return (
                          <tr key={index}>
                            <td style={{ ...tdStyle, fontWeight: 900 }}>{MONTHS[lang][index]}</td>
                            <td style={tdRightStyle}>{money(m.income)}</td>
                            <td style={tdRightStyle}>{money(m.expenses)}</td>
                            <td style={{ ...tdRightStyle, fontWeight: 900 }}>{money(monthResult)}</td>
                            {registered && <td style={tdRightStyle}>{money(monthTaxes)}</td>}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={totalLabelStyle}>TOTAL {year}</td>
                        <td style={totalRightStyle}>{money(totals.income)}</td>
                        <td style={totalRightStyle}>{money(totals.expenses)}</td>
                        <td style={totalRightStyle}>{money(result)}</td>
                        {registered && <td style={totalRightStyle}>{money(netTaxes)}</td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <section style={summaryCardStyle}>
      <div style={summaryTopStyle}><span style={summaryLabelStyle}>{title}</span><span style={{fontSize:22}}>{icon}</span></div>
      <div style={summaryValueStyle}>{value}</div>
    </section>
  );
}

function TaxCard({
  title, collectedLabel, collected, paidLabel, paid, netLabel, net, money,
}: {
  title: string; collectedLabel: string; collected: number; paidLabel: string; paid: number;
  netLabel: string; net: number; money: (value: number) => string;
}) {
  return (
    <section style={taxCardStyle}>
      <div style={{fontWeight:900,fontSize:18,marginBottom:8}}>{title}</div>
      <div style={taxLineStyle}><span>{collectedLabel}</span><strong>{money(collected)}</strong></div>
      <div style={taxLineStyle}><span>{paidLabel}</span><strong>− {money(paid)}</strong></div>
      <div style={taxNetStyle}><span>{netLabel}</span><strong>{money(net)}</strong></div>
    </section>
  );
}

const pageStyle: React.CSSProperties = { minHeight:"100vh", background:"#f5f9ff", color:"#0f172a", fontFamily:"Arial, Helvetica, sans-serif" };
const headerStyle: React.CSSProperties = { background:"#fff", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0, zIndex:20 };
const headerInnerStyle: React.CSSProperties = { maxWidth:1200, margin:"0 auto", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" };
const brandStyle: React.CSSProperties = { textDecoration:"none", color:"#0f172a", fontWeight:900, fontSize:19 };
const langButtonStyle: React.CSSProperties = { border:"1px solid #dbe3ef", borderRadius:8, padding:"7px 10px", fontWeight:800, cursor:"pointer" };
const containerStyle: React.CSSProperties = { maxWidth:1200, margin:"0 auto", padding:"26px 20px 60px" };
const backStyle: React.CSSProperties = { display:"inline-block", color:"#004aad", fontWeight:800, textDecoration:"none", marginBottom:18 };
const heroStyle: React.CSSProperties = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:18, padding:26, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:22, flexWrap:"wrap", marginBottom:18 };
const eyebrowStyle: React.CSSProperties = { color:"#004aad", fontWeight:900, marginBottom:7 };
const titleStyle: React.CSSProperties = { margin:0, fontSize:"clamp(30px, 5vw, 42px)" };
const subtitleStyle: React.CSSProperties = { margin:"10px 0 0", color:"#64748b", lineHeight:1.55, maxWidth:720 };
const businessStyle: React.CSSProperties = { marginTop:12, fontWeight:900, color:"#334155" };
const controlLabelStyle: React.CSSProperties = { display:"flex", flexDirection:"column", gap:5, color:"#475569", fontWeight:800, fontSize:13 };
const selectStyle: React.CSSProperties = { border:"1px solid #cbd5e1", borderRadius:9, background:"#fff", color:"#0f172a", padding:"10px 34px 10px 10px", fontWeight:800, minWidth:150 };
const noteStyle: React.CSSProperties = { background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1e3a8a", borderRadius:12, padding:14, marginBottom:18, lineHeight:1.5 };
const summaryGridStyle: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:14, marginBottom:18 };
const summaryCardStyle: React.CSSProperties = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18 };
const summaryTopStyle: React.CSSProperties = { display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:11 };
const summaryLabelStyle: React.CSSProperties = { color:"#64748b", fontWeight:800, fontSize:14 };
const summaryValueStyle: React.CSSProperties = { fontSize:27, fontWeight:900 };
const taxSectionStyle: React.CSSProperties = { background:"#fff", border:"1px solid #dbe5f1", borderRadius:16, padding:20, marginBottom:12 };
const sectionHeaderStyle: React.CSSProperties = { display:"flex", justifyContent:"space-between", alignItems:"center", gap:15, flexWrap:"wrap", marginBottom:16 };
const sectionTitleStyle: React.CSSProperties = { margin:0, fontSize:21 };
const sectionSubStyle: React.CSSProperties = { color:"#64748b", fontSize:13, marginTop:5 };
const taxLinkStyle: React.CSSProperties = { textDecoration:"none", background:"#004aad", color:"#fff", borderRadius:10, padding:"10px 14px", fontWeight:900 };
const taxGridStyle: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap:14 };
const taxCardStyle: React.CSSProperties = { background:"#f8fbff", border:"1px solid #dbe5f1", borderRadius:14, padding:18 };
const taxLineStyle: React.CSSProperties = { display:"flex", justifyContent:"space-between", gap:15, padding:"8px 0", color:"#475569" };
const taxNetStyle: React.CSSProperties = { display:"flex", justifyContent:"space-between", gap:15, paddingTop:13, marginTop:6, borderTop:"1px solid #dbe5f1", fontWeight:900 };
const balanceStyle: React.CSSProperties = { background:"#f8fbff", border:"2px solid #cfe3ff", borderRadius:14, padding:18 };
const smallLabelStyle: React.CSSProperties = { color:"#64748b", fontWeight:800, fontSize:13 };
const balanceValueStyle: React.CSSProperties = { fontSize:28, fontWeight:900, margin:"10px 0" };
const taxNoteStyle: React.CSSProperties = { background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1e3a8a", borderRadius:12, padding:14, lineHeight:1.5, fontSize:13, marginBottom:18 };
const warningStyle: React.CSSProperties = { background:"#fff7ed", border:"1px solid #fed7aa", color:"#9a3412", borderRadius:12, padding:15, marginBottom:18, lineHeight:1.5 };
const tableSectionStyle: React.CSSProperties = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden" };
const tableHeaderStyle: React.CSSProperties = { padding:20, borderBottom:"1px solid #e5e7eb" };
const tableStyle: React.CSSProperties = { width:"100%", borderCollapse:"collapse", minWidth:720 };
const thStyle: React.CSSProperties = { textAlign:"left", padding:"12px 14px", background:"#f8fafc", color:"#475569", fontSize:12, fontWeight:900, borderBottom:"1px solid #e5e7eb" };
const thRightStyle: React.CSSProperties = { ...thStyle, textAlign:"right" };
const tdStyle: React.CSSProperties = { padding:"13px 14px", borderBottom:"1px solid #eef2f7", fontSize:14 };
const tdRightStyle: React.CSSProperties = { ...tdStyle, textAlign:"right", whiteSpace:"nowrap" };
const totalLabelStyle: React.CSSProperties = { padding:"14px", background:"#eef6ff", fontWeight:900, color:"#004aad" };
const totalRightStyle: React.CSSProperties = { ...totalLabelStyle, textAlign:"right", whiteSpace:"nowrap" };
const emptyStyle: React.CSSProperties = { padding:32, textAlign:"center", color:"#64748b" };
const errorStyle: React.CSSProperties = { background:"#fef2f2", border:"1px solid #fecaca", color:"#b91c1c", borderRadius:12, padding:14, marginBottom:18 };
const loadingStyle: React.CSSProperties = { width:"calc(100% - 40px)", maxWidth:520, margin:"80px auto", background:"#fff", border:"1px solid #dbe5f1", borderRadius:16, padding:28, textAlign:"center", fontWeight:900 };
const miniLoadingStyle: React.CSSProperties = { background:"#fff", border:"1px solid #dbe5f1", borderRadius:12, padding:16, marginBottom:18, textAlign:"center", fontWeight:800 };
