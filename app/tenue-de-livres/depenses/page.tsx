"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type ExpenseRow = {
  id: string;
  transaction_date: string;
  source: string | null;
  description: string | null;
  subtotal: number | string | null;
  gst: number | string | null;
  qst: number | string | null;
  total: number | string | null;
  payment_method: string | null;
  status: string | null;
  original_file_name: string | null;
};

function getLang(): Lang {
  if (typeof window === "undefined") return "fr";

  const value = new URLSearchParams(window.location.search).get("lang");

  if (value === "en" || value === "es") {
    return value;
  }

  return "fr";
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DepensesPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const selectedLang = getLang();
    setLang(selectedLang);
    void loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const next = encodeURIComponent(
          `/tenue-de-livres/depenses?lang=${getLang()}`
        );

        window.location.replace(
          `/espace-client?lang=${getLang()}&next=${next}`
        );

        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("bookkeeping_businesses")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (!business) {
        window.location.replace(
          `/tenue-de-livres/configuration?lang=${getLang()}`
        );

        return;
      }

      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      const { data, error: expenseError } = await supabase
        .from("bookkeeping_transactions")
        .select(
          `
            id,
            transaction_date,
            source,
            description,
            subtotal,
            gst,
            qst,
            total,
            payment_method,
            status,
            original_file_name
          `
        )
        .eq("business_id", business.id)
        .eq("entry_type", "expense")
        .eq("status", "confirmed")
        .gte("transaction_date", yearStart)
        .lte("transaction_date", yearEnd)
        .order("transaction_date", { ascending: false });

      if (expenseError) {
        throw new Error(expenseError.message);
      }

      setExpenses((data ?? []) as ExpenseRow[]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: string) {
    if (!value) return "—";

    const date = new Date(`${value}T12:00:00`);

    return new Intl.DateTimeFormat(
      lang === "fr"
        ? "fr-CA"
        : lang === "es"
          ? "es-CA"
          : "en-CA",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(date);
  }

  const text = {
    fr: {
      title: "Dépenses",
      subtitle:
        "Consultez les dépenses confirmées de votre entreprise.",
      year: "Année",
      total: "Total des dépenses",
      count: "Dépenses",
      date: "Date",
      supplier: "Fournisseur",
      description: "Description",
      subtotal: "Avant taxes",
      gst: "TPS",
      qst: "TVQ",
      amount: "Total",
      document: "Document",
      empty: `Aucune dépense confirmée pour ${currentYear}.`,
      loading: "Chargement des dépenses…",
      back: "Retour à la tenue de livres",
      error: "Impossible de charger les dépenses.",
    },

    en: {
      title: "Expenses",
      subtitle:
        "Review your company's confirmed expenses.",
      year: "Year",
      total: "Total expenses",
      count: "Expenses",
      date: "Date",
      supplier: "Supplier",
      description: "Description",
      subtotal: "Before tax",
      gst: "GST",
      qst: "QST",
      amount: "Total",
      document: "Document",
      empty: `No confirmed expenses for ${currentYear}.`,
      loading: "Loading expenses…",
      back: "Back to bookkeeping",
      error: "Unable to load expenses.",
    },

    es: {
      title: "Gastos",
      subtitle:
        "Consulte los gastos confirmados de su empresa.",
      year: "Año",
      total: "Total de gastos",
      count: "Gastos",
      date: "Fecha",
      supplier: "Proveedor",
      description: "Descripción",
      subtotal: "Antes de impuestos",
      gst: "GST",
      qst: "QST",
      amount: "Total",
      document: "Documento",
      empty: `No hay gastos confirmados para ${currentYear}.`,
      loading: "Cargando gastos…",
      back: "Volver a contabilidad",
      error: "No se pueden cargar los gastos.",
    },
  }[lang];

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, row) => {
      const storedTotal = numberValue(row.total);

      if (storedTotal > 0) {
        return sum + storedTotal;
      }

      return (
        sum +
        numberValue(row.subtotal) +
        numberValue(row.gst) +
        numberValue(row.qst)
      );
    }, 0);
  }, [expenses]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f9ff",
        color: "#0f172a",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Link
            href={`/tenue-de-livres?lang=${lang}`}
            style={{
              textDecoration: "none",
              color: "#0f172a",
              fontWeight: 900,
              fontSize: 19,
            }}
          >
            ComptaNet Québec
          </Link>

          <div
            style={{
              background: "#eef6ff",
              color: "#004aad",
              border: "1px solid #cfe3ff",
              padding: "8px 12px",
              borderRadius: 9,
              fontWeight: 900,
            }}
          >
            {text.year} {currentYear}
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 20px 60px",
        }}
      >
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 26,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              color: "#004aad",
              fontWeight: 900,
              marginBottom: 7,
            }}
          >
            🧾 ComptaNet Québec
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "clamp(30px, 5vw, 42px)",
            }}
          >
            {text.title}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            {text.subtitle}
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <Summary
            label={text.total}
            value={money(totalExpenses)}
          />

          <Summary
            label={text.count}
            value={String(expenses.length)}
          />
        </div>

        {loading && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 25,
            }}
          >
            {text.loading}
          </section>
        )}

        {!loading && error && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: 16,
              padding: 25,
              color: "#b91c1c",
            }}
          >
            <strong>{text.error}</strong>
            <div style={{ marginTop: 8 }}>{error}</div>
          </section>
        )}

        {!loading && !error && expenses.length === 0 && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 30,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 10,
              }}
            >
              🧾
            </div>

            {text.empty}
          </section>
        )}

        {!loading && !error && expenses.length > 0 && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 1000,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#eef6ff",
                      textAlign: "left",
                    }}
                  >
                    <Th>{text.date}</Th>
                    <Th>{text.supplier}</Th>
                    <Th>{text.description}</Th>
                    <Th>{text.subtotal}</Th>
                    <Th>{text.gst}</Th>
                    <Th>{text.qst}</Th>
                    <Th>{text.amount}</Th>
                    <Th>{text.document}</Th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense) => {
                    const subtotal = numberValue(
                      expense.subtotal
                    );

                    const gst = numberValue(expense.gst);
                    const qst = numberValue(expense.qst);

                    const total =
                      numberValue(expense.total) ||
                      subtotal + gst + qst;

                    return (
                      <tr
                        key={expense.id}
                        style={{
                          borderTop:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <Td>
                          {formatDate(
                            expense.transaction_date
                          )}
                        </Td>

                        <Td>
                          <strong>
                            {expense.source || "—"}
                          </strong>
                        </Td>

                        <Td>
                          {expense.description || "—"}
                        </Td>

                        <Td>{money(subtotal)}</Td>
                        <Td>{money(gst)}</Td>
                        <Td>{money(qst)}</Td>

                        <Td>
                          <strong>{money(total)}</strong>
                        </Td>

                        <Td>
                          {expense.original_file_name ||
                            "—"}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div
          style={{
            marginTop: 26,
          }}
        >
          <Link
            href={`/tenue-de-livres?lang=${lang}`}
            style={{
              color: "#004aad",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            ← {text.back}
          </Link>
        </div>
      </div>
    </main>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 19,
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 14,
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 27,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        padding: "14px 15px",
        fontSize: 13,
        color: "#334155",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: "15px",
        fontSize: 14,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}
