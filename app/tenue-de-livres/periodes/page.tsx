"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
type FilingFrequency = "monthly" | "quarterly" | "annual";

type Business = {
  id: string;
  business_name: string;
  tax_status: string | null;
  filing_frequency: string | null;
};

type Period = {
  key: string;
  label: string;
  dates: string;
  start: string;
  end: string;
};

const MONTHS = {
  fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
} as const;

function normalizeFrequency(value: string | null): FilingFrequency {
  if (value === "monthly" || value === "quarterly" || value === "annual") return value;
  return "annual";
}

function isoDate(year: number, monthIndex: number, day: number) {
  const d = new Date(year, monthIndex, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lastDay(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function PeriodesPage() {
  const currentYear = new Date().getFullYear();
  const [lang, setLang] = useState<Lang>("fr");
  const [year, setYear] = useState(currentYear);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [newFrequency, setNewFrequency] = useState<FilingFrequency>("annual");

  const text = {
    fr: {
      title: "Périodes",
      subtitle: "Consultez vos périodes de déclaration et accédez directement au calcul de TPS/TVQ.",
      back: "Retour à la tenue de livres",
      year: "Année",
      frequency: "Fréquence de déclaration",
      monthly: "Mensuelle",
      quarterly: "Trimestrielle",
      annual: "Annuelle",
      change: "Modifier la fréquence",
      cancel: "Annuler",
      save: "Enregistrer",
      confirm: "Cette modification changera les périodes utilisées pour votre suivi TPS/TVQ. Voulez-vous continuer?",
      saved: "La fréquence de déclaration a été mise à jour.",
      periodTitle: "Vos périodes",
      viewTaxes: "Voir TPS/TVQ",
      loading: "Chargement des périodes…",
      error: "Impossible de charger les périodes.",
      q: "Trimestre",
      fullYear: "Année complète",
      official: "Fréquence enregistrée dans votre profil",
    },
    en: {
      title: "Periods",
      subtitle: "View your filing periods and open the GST/QST calculation for each period.",
      back: "Back to bookkeeping",
      year: "Year",
      frequency: "Filing frequency",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",
      change: "Change frequency",
      cancel: "Cancel",
      save: "Save",
      confirm: "This change will modify the periods used for your GST/QST tracking. Continue?",
      saved: "The filing frequency has been updated.",
      periodTitle: "Your periods",
      viewTaxes: "View GST/QST",
      loading: "Loading periods…",
      error: "Unable to load periods.",
      q: "Quarter",
      fullYear: "Full year",
      official: "Frequency saved in your profile",
    },
    es: {
      title: "Períodos",
      subtitle: "Consulte sus períodos de declaración y abra el cálculo de GST/QST para cada período.",
      back: "Volver a contabilidad",
      year: "Año",
      frequency: "Frecuencia de declaración",
      monthly: "Mensual",
      quarterly: "Trimestral",
      annual: "Anual",
      change: "Modificar la frecuencia",
      cancel: "Cancelar",
      save: "Guardar",
      confirm: "Este cambio modificará los períodos utilizados para el seguimiento de GST/QST. ¿Continuar?",
      saved: "La frecuencia de declaración se actualizó.",
      periodTitle: "Sus períodos",
      viewTaxes: "Ver GST/QST",
      loading: "Cargando períodos…",
      error: "No se pueden cargar los períodos.",
      q: "Trimestre",
      fullYear: "Año completo",
      official: "Frecuencia guardada en su perfil",
    },
  }[lang];

  const frequency = normalizeFrequency(business?.filing_frequency ?? null);

  const availableYears = useMemo(
    () => Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i).reverse(),
    [currentYear]
  );

  const periods = useMemo<Period[]>(() => {
    if (frequency === "monthly") {
      return MONTHS[lang].map((month, index) => ({
        key: `m-${index + 1}`,
        label: month,
        dates: `${isoDate(year, index, 1)} — ${isoDate(year, index, lastDay(year, index))}`,
        start: isoDate(year, index, 1),
        end: isoDate(year, index, lastDay(year, index)),
      }));
    }

    if (frequency === "quarterly") {
      return [0, 1, 2, 3].map((q) => {
        const startMonth = q * 3;
        const endMonth = startMonth + 2;
        return {
          key: `q-${q + 1}`,
          label: `${text.q} ${q + 1}`,
          dates: `${MONTHS[lang][startMonth]} — ${MONTHS[lang][endMonth]} ${year}`,
          start: isoDate(year, startMonth, 1),
          end: isoDate(year, endMonth, lastDay(year, endMonth)),
        };
      });
    }

    return [{
      key: `y-${year}`,
      label: text.fullYear,
      dates: `1 ${MONTHS[lang][0]} ${year} — 31 ${MONTHS[lang][11]} ${year}`,
      start: `${year}-01-01`,
      end: `${year}-12-31`,
    }];
  }, [frequency, lang, year, text.q, text.fullYear]);

  useEffect(() => {
    let selectedLang: Lang = "fr";
    let selectedYear = currentYear;

    const params = new URLSearchParams(window.location.search);
    const l = params.get("lang");
    const y = Number(params.get("year"));

    if (l === "fr" || l === "en" || l === "es") selectedLang = l;
    if (Number.isInteger(y) && y >= 2020 && y <= currentYear + 5) selectedYear = y;

    setLang(selectedLang);
    setYear(selectedYear);
    void loadBusiness(selectedLang, selectedYear);
  }, []);

  async function loadBusiness(selectedLang: Lang, selectedYear: number) {
    try {
      setLoading(true);
      setError("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        const next = encodeURIComponent(`/tenue-de-livres/periodes?lang=${selectedLang}&year=${selectedYear}`);
        window.location.replace(`/espace-client?lang=${selectedLang}&next=${next}`);
        return;
      }

      const { data, error: businessError } = await supabase
        .from("bookkeeping_businesses")
        .select("id, business_name, tax_status, filing_frequency")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (businessError) throw new Error(businessError.message);

      if (!data) {
        window.location.replace(`/tenue-de-livres/configuration?lang=${selectedLang}&year=${selectedYear}`);
        return;
      }

      const loaded = data as Business;
      setBusiness(loaded);
      setNewFrequency(normalizeFrequency(loaded.filing_frequency));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.error);
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

  function changeYear(next: number) {
    setYear(next);
    const url = new URL(window.location.href);
    url.searchParams.set("year", String(next));
    window.history.replaceState({}, "", url.toString());
  }

  async function saveFrequency() {
    if (!business || saving) return;
    if (newFrequency === frequency) {
      setEditingFrequency(false);
      return;
    }

    if (!window.confirm(text.confirm)) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { error: updateError } = await supabase
        .from("bookkeeping_businesses")
        .update({ filing_frequency: newFrequency })
        .eq("id", business.id);

      if (updateError) throw new Error(updateError.message);

      setBusiness({ ...business, filing_frequency: newFrequency });
      setMessage(text.saved);
      setEditingFrequency(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.error);
    } finally {
      setSaving(false);
    }
  }

  function frequencyLabel(value: FilingFrequency) {
    return value === "monthly" ? text.monthly : value === "quarterly" ? text.quarterly : text.annual;
  }

  if (loading) {
    return <main style={pageStyle}><div style={loadingStyle}>📅 {text.loading}</div></main>;
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
                style={{...langButtonStyle, background: lang === item ? "#004aad" : "#fff",
                  color: lang === item ? "#fff" : "#334155",
                  borderColor: lang === item ? "#004aad" : "#dbe3ef"}}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={containerStyle}>
        <Link href={`/tenue-de-livres?lang=${lang}&year=${year}`} style={backStyle}>← {text.back}</Link>

        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>📅 ComptaNet Québec</div>
            <h1 style={titleStyle}>{text.title}</h1>
            <p style={subtitleStyle}>{text.subtitle}</p>
          </div>
          <label style={controlLabelStyle}>
            <span>{text.year}</span>
            <select value={year} onChange={(e) => changeYear(Number(e.target.value))} style={selectStyle}>
              {availableYears.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </section>

        {error && <div style={errorStyle}><strong>{text.error}</strong><div>{error}</div></div>}
        {message && <div style={successStyle}>{message}</div>}

        <section style={frequencyStyle}>
          <div>
            <div style={smallLabelStyle}>{text.official}</div>
            <div style={{fontSize: 21, fontWeight: 900}}>{frequencyLabel(frequency)}</div>
            <div style={{marginTop: 5, color: "#64748b"}}>{business?.business_name}</div>
          </div>

          {!editingFrequency ? (
            <button type="button" style={secondaryButtonStyle} onClick={() => {
              setNewFrequency(frequency);
              setEditingFrequency(true);
              setMessage("");
            }}>{text.change}</button>
          ) : (
            <div style={editBoxStyle}>
              <select value={newFrequency} onChange={(e) => setNewFrequency(e.target.value as FilingFrequency)} style={selectStyle}>
                <option value="monthly">{text.monthly}</option>
                <option value="quarterly">{text.quarterly}</option>
                <option value="annual">{text.annual}</option>
              </select>
              <button type="button" disabled={saving} onClick={() => void saveFrequency()} style={primaryButtonStyle}>
                {saving ? "…" : text.save}
              </button>
              <button type="button" disabled={saving} onClick={() => setEditingFrequency(false)} style={secondaryButtonStyle}>
                {text.cancel}
              </button>
            </div>
          )}
        </section>

        <h2 style={{fontSize: 22, margin: "26px 0 14px"}}>{text.periodTitle} — {year}</h2>

        <section style={periodGridStyle}>
          {periods.map((period) => (
            <article key={period.key} style={periodCardStyle}>
              <div>
                <div style={periodTitleStyle}>{period.label}</div>
                <div style={periodDateStyle}>{period.dates}</div>
              </div>
              <Link
                href={`/tenue-de-livres/taxes?lang=${lang}&year=${year}&period=${encodeURIComponent(period.key)}`}
                style={primaryLinkStyle}
              >
                🧮 {text.viewTaxes}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {minHeight:"100vh",background:"#f5f9ff",color:"#0f172a",fontFamily:"Arial, Helvetica, sans-serif"};
const headerStyle: React.CSSProperties = {background:"#fff",borderBottom:"1px solid #e5e7eb",position:"sticky",top:0,zIndex:20};
const headerInnerStyle: React.CSSProperties = {maxWidth:1200,margin:"0 auto",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"};
const brandStyle: React.CSSProperties = {textDecoration:"none",color:"#0f172a",fontWeight:900,fontSize:19};
const langButtonStyle: React.CSSProperties = {border:"1px solid #dbe3ef",borderRadius:8,padding:"7px 10px",fontWeight:800,cursor:"pointer"};
const containerStyle: React.CSSProperties = {maxWidth:1200,margin:"0 auto",padding:"26px 20px 60px"};
const backStyle: React.CSSProperties = {display:"inline-block",color:"#004aad",fontWeight:800,textDecoration:"none",marginBottom:18};
const heroStyle: React.CSSProperties = {background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:26,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:22,flexWrap:"wrap",marginBottom:18};
const eyebrowStyle: React.CSSProperties = {color:"#004aad",fontWeight:900,marginBottom:7};
const titleStyle: React.CSSProperties = {margin:0,fontSize:"clamp(30px, 5vw, 42px)"};
const subtitleStyle: React.CSSProperties = {margin:"10px 0 0",color:"#64748b",lineHeight:1.55,maxWidth:700};
const controlLabelStyle: React.CSSProperties = {display:"flex",flexDirection:"column",gap:5,color:"#475569",fontWeight:800,fontSize:13};
const selectStyle: React.CSSProperties = {border:"1px solid #cbd5e1",borderRadius:9,background:"#fff",color:"#0f172a",padding:"10px 34px 10px 10px",fontWeight:800,minWidth:150};
const frequencyStyle: React.CSSProperties = {background:"#fff",border:"1px solid #dbe5f1",borderRadius:16,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap"};
const smallLabelStyle: React.CSSProperties = {color:"#64748b",fontWeight:800,fontSize:13,marginBottom:5};
const editBoxStyle: React.CSSProperties = {display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"};
const primaryButtonStyle: React.CSSProperties = {border:"1px solid #004aad",borderRadius:10,padding:"10px 15px",background:"#004aad",color:"#fff",fontWeight:900,cursor:"pointer"};
const secondaryButtonStyle: React.CSSProperties = {border:"1px solid #cbd5e1",borderRadius:10,padding:"10px 15px",background:"#fff",color:"#004aad",fontWeight:900,cursor:"pointer"};
const periodGridStyle: React.CSSProperties = {display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:14};
const periodCardStyle: React.CSSProperties = {background:"#fff",border:"1px solid #dbe5f1",borderRadius:16,padding:20,minHeight:145,display:"flex",flexDirection:"column",justifyContent:"space-between",gap:20};
const periodTitleStyle: React.CSSProperties = {fontSize:20,fontWeight:900};
const periodDateStyle: React.CSSProperties = {marginTop:7,color:"#64748b",fontSize:14,lineHeight:1.45};
const primaryLinkStyle: React.CSSProperties = {display:"inline-block",alignSelf:"flex-start",textDecoration:"none",borderRadius:10,padding:"10px 14px",background:"#004aad",color:"#fff",fontWeight:900};
const errorStyle: React.CSSProperties = {background:"#fef2f2",border:"1px solid #fecaca",color:"#b91c1c",borderRadius:12,padding:14,marginBottom:18};
const successStyle: React.CSSProperties = {background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857",borderRadius:12,padding:14,marginBottom:18,fontWeight:800};
const loadingStyle: React.CSSProperties = {width:"calc(100% - 40px)",maxWidth:520,margin:"80px auto",background:"#fff",border:"1px solid #dbe5f1",borderRadius:16,padding:28,textAlign:"center",fontWeight:900};
