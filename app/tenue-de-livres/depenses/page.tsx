"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
type TaxMode = "none" | "gst" | "gst_qst";
type TaxStatus = "not_registered" | "gst_only" | "gst_qst";
type FilingFrequency = "monthly" | "quarterly" | "annual";

type ExtractedTransaction = {
  entry_type: "expense" | "expense" | "unknown";
  transaction_date: string | null;
  source: string | null;
  description: string | null;
  reference: string | null;
  subtotal: number | null;
  gst: number | null;
  qst: number | null;
  total: number | null;
  payment_method: "transfer" | "card" | "cash" | "cheque" | "platform" | "other" | "unknown";
  confidence: number;
  notes: string[];
};

type Extraction = {
  relevant: boolean;
  transactions: ExtractedTransaction[];
  document_notes: string[];
};

type Doc = {
  id: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  status: "uploaded" | "analyzing" | "ready" | "confirmed" | "error";
  extraction: Extraction | null;
  error_message: string | null;
  transaction_id: string | null;
  created_at: string;
};

const MAX_SIZE = 20 * 1024 * 1024;
const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const safeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

type Business = {
  id: string;
  business_name: string;
  tax_status: TaxStatus;
  filing_frequency: FilingFrequency;
};

type Expense = {
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

export default function DepensesPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxMode, setTaxMode] = useState<TaxMode>("gst_qst");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [business, setBusiness] = useState<Business | null>(null);
  const [userId, setUserId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxStatus, setTaxStatus] = useState<TaxStatus>("not_registered");
  const [filingFrequency, setFilingFrequency] = useState<FilingFrequency>("annual");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [entryMode, setEntryMode] = useState<"manual" | "document">("manual");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyDocId, setBusyDocId] = useState("");
  const [docMessage, setDocMessage] = useState("");

  const currentYear = new Date().getFullYear();
  const date =
    day && month && year
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("lang");
    const selectedLang: Lang = value === "en" || value === "es" ? value : "fr";
    setLang(selectedLang);
    void loadData(selectedLang);
  }, []);

  const copy = {
    fr: {
      title: "Dépenses",
      subtitle: "Ajoutez et consultez les dépenses de votre entreprise.",
      back: "Retour à la tenue de livres",
      add: "Ajouter une dépense",
      edit: "Modifier la dépense",
      date: "Date",
      day: "Jour",
      month: "Mois",
      year: "Année",
      source: "Fournisseur ou source",
      sourcePlaceholder: "Ex. Fournisseur, magasin, entrepreneur",
      description: "Description",
      descriptionPlaceholder: "Ex. Achat, matériel, réparation",
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
      list: "Dépenses enregistrées",
      empty: "Aucune dépense enregistrée pour le moment.",
      actions: "Actions",
      modify: "Modifier",
      remove: "Supprimer",
      confirm: "Supprimer cette dépense?",
      required: "Remplissez la date, la source et un montant valide.",
      count: "Transactions",
      beforeTax: "Avant taxes",
      collected: "Taxes payées",
      notice: "Les dépenses sont enregistrées de façon sécurisée dans le compte client.",
      loading: "Chargement…",
      loginRequired: "Vous devez ouvrir une session pour accéder à la tenue de livres.",
      databaseError: "Impossible de charger les dépenses.",
      setupTitle: "Configurer votre entreprise",
      setupText: "Ces renseignements servent à organiser vos périodes de TPS et de TVQ.",
      businessName: "Nom de l’entreprise",
      taxStatus: "Inscription aux taxes",
      notRegistered: "Non inscrit aux taxes",
      gstRegistered: "TPS seulement",
      gstQstRegistered: "TPS et TVQ",
      frequency: "Fréquence de déclaration",
      monthly: "Mensuelle",
      quarterly: "Trimestrielle",
      annual: "Annuelle",
      createBusiness: "Créer mon dossier",
      manualTab: "Saisie manuelle",
      documentTab: "Déposer un document",
      documentTitle: "Importer une dépense avec l’IA",
      documentText: "Déposez une facture, un reçu, une preuve de paiement ou une photo. L’IA analyse le document, puis vous vérifiez la dépense avant de la confirmer.",
      uploadDocument: "Déposer un PDF ou une photo",
      formats: "PDF, JPG, PNG ou WebP — maximum 20 Mo",
      analysing: "Analyse en cours…",
      analyze: "Analyser",
      open: "Ouvrir",
      deleteDocument: "Supprimer",
      confirmExpense: "Confirmer les dépenses détectées",
      detected: "transactions détectées",
      incomeDetected: "Revenu",
      expenseDetected: "Dépense",
      unknownDetected: "Type incertain",
      confidence: "Confiance IA",
      review: "À vérifier",
      documentSaved: "La ou les dépenses ont été confirmées.",
      badFile: "Utilisez un PDF, JPG, PNG ou WebP de 20 Mo maximum.",
      wrongType: "Ce document contient un revenu ou une transaction incertaine. Vérifiez-le dans Documents avant de confirmer.",
      incompleteDocument: "La dépense détectée est incomplète. Utilisez un document plus lisible ou vérifiez-la dans Documents.",
      noDocuments: "Aucun document de dépense en attente.",
      allDocuments: "Voir tous les documents",
      deleteDocumentConfirm: "Supprimer ce document?",
    },
    en: {
      title: "Expenses",
      subtitle: "Add and review your business expenses.",
      back: "Back to bookkeeping",
      add: "Add expense",
      edit: "Edit expense",
      date: "Date",
      day: "Day",
      month: "Month",
      year: "Year",
      source: "Supplier or source",
      sourcePlaceholder: "E.g. supplier, store, contractor",
      description: "Description",
      descriptionPlaceholder: "E.g. purchase, supplies, repair",
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
      list: "Recorded expenses",
      empty: "No expenses recorded yet.",
      actions: "Actions",
      modify: "Edit",
      remove: "Delete",
      confirm: "Delete this expense entry?",
      required: "Enter a date, a source and a valid amount.",
      count: "Transactions",
      beforeTax: "Before tax",
      collected: "Tax paid",
      notice: "Expenses are securely saved in the client account.",
      loading: "Loading…",
      loginRequired: "You must sign in to access bookkeeping.",
      databaseError: "Unable to load expenses.",
      setupTitle: "Set up your business",
      setupText: "This information is used to organize your GST and QST filing periods.",
      businessName: "Business name",
      taxStatus: "Tax registration",
      notRegistered: "Not registered for tax",
      gstRegistered: "GST only",
      gstQstRegistered: "GST and QST",
      frequency: "Filing frequency",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",
      createBusiness: "Create my file",
      manualTab: "Manual entry",
      documentTab: "Upload a document",
      documentTitle: "Import an expense with AI",
      documentText: "Upload an invoice, receipt, proof of payment or photo. AI analyzes the document, then you review the expense before confirming it.",
      uploadDocument: "Upload a PDF or photo",
      formats: "PDF, JPG, PNG or WebP — maximum 20 MB",
      analysing: "Analyzing…",
      analyze: "Analyze",
      open: "Open",
      deleteDocument: "Delete",
      confirmExpense: "Confirm detected expenses",
      detected: "transactions detected",
      incomeDetected: "Income",
      expenseDetected: "Expense",
      unknownDetected: "Uncertain type",
      confidence: "AI confidence",
      review: "Review",
      documentSaved: "The expense transaction(s) were confirmed.",
      badFile: "Use a PDF, JPG, PNG or WebP file up to 20 MB.",
      wrongType: "This document contains income or an uncertain transaction. Review it in Documents before confirming.",
      incompleteDocument: "The detected expense is incomplete. Use a clearer document or review it in Documents.",
      noDocuments: "No pending expense documents.",
      allDocuments: "View all documents",
      deleteDocumentConfirm: "Delete this document?",
    },
    es: {
      title: "Gastos",
      subtitle: "Añada y consulte los gastos de su empresa.",
      back: "Volver a contabilidad",
      add: "Añadir un gasto",
      edit: "Modificar el gasto",
      date: "Fecha",
      day: "Día",
      month: "Mes",
      year: "Año",
      source: "Proveedor o fuente",
      sourcePlaceholder: "Ej. proveedor, tienda, contratista",
      description: "Descripción",
      descriptionPlaceholder: "Ej. compra, material, reparación",
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
      list: "Gastos registrados",
      empty: "Todavía no hay gastos registrados.",
      actions: "Acciones",
      modify: "Modificar",
      remove: "Eliminar",
      confirm: "¿Eliminar este gasto?",
      required: "Introduzca una fecha, una fuente y un importe válido.",
      count: "Transacciones",
      beforeTax: "Antes de impuestos",
      collected: "Impuestos pagados",
      notice: "Los gastos se guardan de forma segura en la cuenta del cliente.",
      loading: "Cargando…",
      loginRequired: "Debe iniciar sesión para acceder a la contabilidad.",
      databaseError: "No se pueden cargar los gastos.",
      setupTitle: "Configurar su empresa",
      setupText: "Esta información se utiliza para organizar sus períodos de GST y QST.",
      businessName: "Nombre de la empresa",
      taxStatus: "Registro de impuestos",
      notRegistered: "No registrado para impuestos",
      gstRegistered: "GST solamente",
      gstQstRegistered: "GST y QST",
      frequency: "Frecuencia de declaración",
      monthly: "Mensual",
      quarterly: "Trimestral",
      annual: "Anual",
      createBusiness: "Crear mi expediente",
      manualTab: "Entrada manual",
      documentTab: "Subir un documento",
      documentTitle: "Importar gastos con IA",
      documentText: "Suba una factura, un recibo, un comprobante de pago o una foto. La IA analiza el documento y usted verifica el gasto antes de confirmarlo.",
      uploadDocument: "Subir un PDF o una foto",
      formats: "PDF, JPG, PNG o WebP — máximo 20 MB",
      analysing: "Analizando…",
      analyze: "Analizar",
      open: "Abrir",
      deleteDocument: "Eliminar",
      confirmExpense: "Confirmar los gastos detectados",
      detected: "transacciones detectadas",
      incomeDetected: "Ingreso",
      expenseDetected: "Gasto",
      unknownDetected: "Tipo incierto",
      confidence: "Confianza IA",
      review: "Por verificar",
      documentSaved: "Los gastos fueron confirmados.",
      badFile: "Use un PDF, JPG, PNG o WebP de hasta 20 MB.",
      wrongType: "Este documento contiene un ingreso o una transacción incierta. Revíselo en Documentos antes de confirmar.",
      incompleteDocument: "El gasto detectado está incompleto. Use un documento más legible o revíselo en Documentos.",
      noDocuments: "No hay documentos de gastos pendientes.",
      allDocuments: "Ver todos los documentos",
      deleteDocumentConfirm: "¿Eliminar este documento?",
    },
  }[lang];

  const amount = Number.parseFloat(subtotal.replace(",", ".")) || 0;
  const calculatedGst = taxMode === "none" ? 0 : roundMoney(amount * GST_RATE);
  const calculatedQst = taxMode === "gst_qst" ? roundMoney(amount * QST_RATE) : 0;
  const calculatedTotal = roundMoney(amount + calculatedGst + calculatedQst);

  const summary = useMemo(() => {
    return expenses.reduce(
      (sum, item) => ({
        subtotal: sum.subtotal + item.subtotal,
        gst: sum.gst + item.gst,
        qst: sum.qst + item.qst,
        total: sum.total + item.total,
      }),
      { subtotal: 0, gst: 0, qst: 0, total: 0 }
    );
  }, [expenses]);

  function mapExpense(row: Record<string, unknown>): Expense {
    return {
      id: String(row.id),
      date: String(row.transaction_date),
      source: String(row.source),
      description: row.description ? String(row.description) : "",
      subtotal: Number(row.subtotal),
      taxMode: row.tax_mode as TaxMode,
      gst: Number(row.gst),
      qst: Number(row.qst),
      total: Number(row.total),
      paymentMethod: row.payment_method ? String(row.payment_method) : "other",
    };
  }

  async function loadData(selectedLang: Lang) {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      const next = encodeURIComponent(`/tenue-de-livres/depenses?lang=${selectedLang}`);
      window.location.href = `/espace-client?lang=${selectedLang}&next=${next}`;
      return;
    }

    setUserId(user.id);

    const { data: businessData, error: businessError } = await supabase
      .from("bookkeeping_businesses")
      .select("id, business_name, tax_status, filing_frequency")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (businessError) {
      setError(businessError.message);
      setLoading(false);
      return;
    }

    if (!businessData) {
      const suggestedName =
        String(user.user_metadata?.business_name || user.user_metadata?.full_name || "").trim();
      setBusinessName(suggestedName);
      setLoading(false);
      return;
    }

    const selectedBusiness = businessData as Business;
    setBusiness(selectedBusiness);
    setTaxStatus(selectedBusiness.tax_status);
    setTaxMode(
      selectedBusiness.tax_status === "not_registered"
        ? "none"
        : selectedBusiness.tax_status === "gst_only"
          ? "gst"
          : "gst_qst"
    );

    const { data: transactionData, error: transactionError } = await supabase
      .from("bookkeeping_transactions")
      .select("id, transaction_date, source, description, subtotal, tax_mode, gst, qst, total, payment_method")
      .eq("business_id", selectedBusiness.id)
      .eq("entry_type", "expense")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (transactionError) setError(transactionError.message);
    else setExpenses((transactionData ?? []).map((row) => mapExpense(row)));

    await loadDocs(selectedBusiness.id);
    setLoading(false);
  }

  async function loadDocs(businessId: string) {
    const { data, error: docsError } = await supabase
      .from("bookkeeping_documents")
      .select("id, storage_path, original_file_name, mime_type, size_bytes, status, extraction, error_message, transaction_id, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (docsError) {
      setDocMessage(docsError.message);
      return;
    }

    const allDocs = (data ?? []) as Doc[];
    const expenseDocs = allDocs.filter((doc) => {
      if (doc.status === "confirmed") return false;
      const items = doc.extraction?.transactions ?? [];
      return items.length === 0 || items.some((item) => item.entry_type === "expense");
    });

    setDocs(expenseDocs);
  }

  async function analyzeDocument(documentId: string) {
    if (!business) return;
    setBusyDocId(documentId);
    setDocMessage("");

    try {
      const response = await fetch("/api/tenue-de-livres/analyser-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setDocMessage(result.error ?? "Erreur");
      }

      await loadDocs(business.id);
    } catch (err: unknown) {
      setDocMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusyDocId("");
    }
  }

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !business || !userId) return;

    if (!allowed.includes(file.type) || file.size > MAX_SIZE) {
      setDocMessage(copy.badFile);
      return;
    }

    setUploading(true);
    setDocMessage("");

    const path = `${userId}/${business.id}/${crypto.randomUUID()}-${safeName(file.name)}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("bookkeeping-documents")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setDocMessage(uploadError.message);
        return;
      }

      const { data: doc, error: rowError } = await supabase
        .from("bookkeeping_documents")
        .insert({
          business_id: business.id,
          storage_path: path,
          original_file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select("id")
        .single();

      if (rowError || !doc) {
        await supabase.storage.from("bookkeeping-documents").remove([path]);
        setDocMessage(rowError?.message ?? "Erreur");
        return;
      }

      await loadDocs(business.id);
      await analyzeDocument(doc.id);
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(path: string) {
    const { data, error: signedError } = await supabase.storage
      .from("bookkeeping-documents")
      .createSignedUrl(path, 600);

    if (signedError || !data?.signedUrl) {
      setDocMessage(signedError?.message ?? "Erreur");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function confirmExpenseDocument(doc: Doc) {
    if (!business || !doc.extraction?.relevant) {
      setDocMessage(copy.incompleteDocument);
      return;
    }

    const items = doc.extraction.transactions ?? [];
    const expenseItems = items.filter((item) => item.entry_type === "expense");
    const hasWrongType = items.some((item) => item.entry_type !== "expense");
    const complete =
      expenseItems.length > 0 &&
      expenseItems.every(
        (item) =>
          item.transaction_date &&
          item.source &&
          item.subtotal !== null
      );

    if (hasWrongType) {
      setDocMessage(copy.wrongType);
      return;
    }

    if (!complete) {
      setDocMessage(copy.incompleteDocument);
      return;
    }

    setBusyDocId(doc.id);
    setDocMessage("");

    const rows = expenseItems.map((item) => {
      const gst = item.gst ?? 0;
      const qst = item.qst ?? 0;

      return {
        business_id: business.id,
        entry_type: "expense",
        transaction_date: item.transaction_date,
        source: item.source,
        description: item.description,
        subtotal: item.subtotal,
        tax_mode: qst > 0 ? "gst_qst" : gst > 0 ? "gst" : "none",
        gst,
        qst,
        payment_method: item.payment_method === "unknown" ? "other" : item.payment_method,
        status: "confirmed",
        document_path: doc.storage_path,
        original_file_name: doc.original_file_name,
        document_mime_type: doc.mime_type,
        entered_by: "document_ai",
        ai_confidence: item.confidence,
        ai_extraction: item,
      };
    });

    const { data: transactions, error: insertError } = await supabase
      .from("bookkeeping_transactions")
      .insert(rows)
      .select("id, transaction_date, source, description, subtotal, tax_mode, gst, qst, total, payment_method");

    if (insertError || !transactions?.length) {
      setDocMessage(insertError?.message ?? "Erreur");
      setBusyDocId("");
      return;
    }

    const { error: updateError } = await supabase
      .from("bookkeeping_documents")
      .update({
        status: "confirmed",
        transaction_id: transactions[0].id,
      })
      .eq("id", doc.id);

    if (updateError) {
      await supabase
        .from("bookkeeping_transactions")
        .delete()
        .in("id", transactions.map((item) => item.id));

      setDocMessage(updateError.message);
      setBusyDocId("");
      return;
    }

    const saved = transactions.map((row) =>
      mapExpense(row as Record<string, unknown>)
    );

    setExpenses((current) => [...saved, ...current]);
    setDocMessage(copy.documentSaved);
    await loadDocs(business.id);
    setBusyDocId("");
  }

  async function removeDocument(doc: Doc) {
    if (!business || doc.status === "confirmed") return;
    if (!window.confirm(copy.deleteDocumentConfirm)) return;

    setBusyDocId(doc.id);
    setDocMessage("");

    const { error: deleteError } = await supabase
      .from("bookkeeping_documents")
      .delete()
      .eq("id", doc.id);

    if (deleteError) {
      setDocMessage(deleteError.message);
      setBusyDocId("");
      return;
    }

    await supabase.storage
      .from("bookkeeping-documents")
      .remove([doc.storage_path]);

    await loadDocs(business.id);
    setBusyDocId("");
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessName.trim() || !userId) return;

    setBusy(true);
    setError("");
    const { data, error: insertError } = await supabase
      .from("bookkeeping_businesses")
      .insert({
        owner_id: userId,
        business_name: businessName.trim(),
        tax_status: taxStatus,
        filing_frequency: filingFrequency,
      })
      .select("id, business_name, tax_status, filing_frequency")
      .single();

    if (insertError) setError(insertError.message);
    else {
      setBusiness(data as Business);
      setTaxMode(taxStatus === "not_registered" ? "none" : taxStatus === "gst_only" ? "gst" : "gst_qst");
    }
    setBusy(false);
  }

  function resetForm() {
    setEditingId(null);
    setDay("");
    setMonth("");
    setYear("");
    setSource("");
    setDescription("");
    setSubtotal("");
    setTaxMode(
      business?.tax_status === "not_registered"
        ? "none"
        : business?.tax_status === "gst_only"
          ? "gst"
          : "gst_qst"
    );
    setPaymentMethod("transfer");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
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

    if (!business) return;

    const payload = {
      business_id: business.id,
      entry_type: "expense",
      transaction_date: date,
      source: source.trim(),
      description: description.trim() || null,
      subtotal: roundMoney(amount),
      tax_mode: taxMode,
      gst: calculatedGst,
      qst: calculatedQst,
      payment_method: paymentMethod,
      status: "confirmed",
      entered_by: "manual",
    };

    setBusy(true);
    setError("");
    const request = editingId
      ? supabase.from("bookkeeping_transactions").update(payload).eq("id", editingId)
      : supabase.from("bookkeeping_transactions").insert(payload);
    const { data, error: saveError } = await request
      .select("id, transaction_date, source, description, subtotal, tax_mode, gst, qst, total, payment_method")
      .single();

    if (saveError) setError(saveError.message);
    else {
      const saved = mapExpense(data as Record<string, unknown>);
      setExpenses((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? saved : item))
          : [saved, ...current]
      );
      resetForm();
    }
    setBusy(false);
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

  async function remove(id: string) {
    if (window.confirm(copy.confirm)) {
      setBusy(true);
      setError("");
      const { error: deleteError } = await supabase
        .from("bookkeeping_transactions")
        .delete()
        .eq("id", id);
      if (deleteError) setError(deleteError.message);
      else {
        setExpenses((current) => current.filter((item) => item.id !== id));
        if (editingId === id) resetForm();
      }
      setBusy(false);
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

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f9ff", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div style={{ color: "#004aad", fontSize: 18, fontWeight: 900 }}>{copy.loading}</div>
      </main>
    );
  }

  if (!business) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5f9ff", color: "#0f172a", fontFamily: "Arial, Helvetica, sans-serif", padding: "40px 20px" }}>
        <section style={{ ...panel, maxWidth: 680, margin: "0 auto", padding: 26 }}>
          <Link href={`/tenue-de-livres?lang=${lang}`} style={{ color: "#004aad", textDecoration: "none", fontWeight: 900 }}>← {copy.back}</Link>
          <h1 style={{ margin: "24px 0 8px" }}>{copy.setupTitle}</h1>
          <p style={{ color: "#64748b", lineHeight: 1.5 }}>{copy.setupText}</p>
          {error && <p style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: 12 }}>{error}</p>}
          <form onSubmit={createBusiness} style={{ display: "grid", gap: 16, marginTop: 22 }}>
            <label style={label}>{copy.businessName}<input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={input} /></label>
            <label style={label}>{copy.taxStatus}<select value={taxStatus} onChange={(e) => setTaxStatus(e.target.value as TaxStatus)} style={input}><option value="not_registered">{copy.notRegistered}</option><option value="gst_only">{copy.gstRegistered}</option><option value="gst_qst">{copy.gstQstRegistered}</option></select></label>
            <label style={label}>{copy.frequency}<select value={filingFrequency} onChange={(e) => setFilingFrequency(e.target.value as FilingFrequency)} style={input}><option value="monthly">{copy.monthly}</option><option value="quarterly">{copy.quarterly}</option><option value="annual">{copy.annual}</option></select></label>
            <button disabled={busy} type="submit" style={{ border: 0, borderRadius: 10, padding: "12px 18px", background: "#004aad", color: "#fff", fontWeight: 900, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.65 : 1 }}>{copy.createBusiness}</button>
          </form>
        </section>
      </main>
    );
  }

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
            <div style={{ color: "#004aad", fontWeight: 900, marginBottom: 7 }}>🧾 ComptaNet Québec</div>
            <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 44px)" }}>{copy.title}</h1>
            <p style={{ color: "#64748b", marginBottom: 0 }}>{copy.subtitle}</p>
            <p style={{ color: "#334155", fontWeight: 800, margin: "8px 0 0" }}>{business.business_name}</p>
          </div>
          <div style={{ background: "#eaf3ff", border: "1px solid #bfdbfe", color: "#004aad", borderRadius: 10, padding: "10px 14px", fontWeight: 900 }}>{currentYear}</div>
        </div>

        {error && <p style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: 12 }}>{error}</p>}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 22 }}>
          <Summary title={copy.count} value={String(expenses.length)} />
          <Summary title={copy.beforeTax} value={money(summary.subtotal, lang)} />
          <Summary title={copy.collected} value={money(summary.gst + summary.qst, lang)} />
          <Summary title={copy.total} value={money(summary.total, lang)} strong />
        </section>

        <section style={{ ...panel, padding: 10, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              style={{
                border: entryMode === "manual" ? "1px solid #004aad" : "1px solid #dbe5f1",
                borderRadius: 11,
                padding: "13px 16px",
                background: entryMode === "manual" ? "#004aad" : "#fff",
                color: entryMode === "manual" ? "#fff" : "#334155",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ✏️ {copy.manualTab}
            </button>

            <button
              type="button"
              onClick={() => setEntryMode("document")}
              style={{
                border: entryMode === "document" ? "1px solid #004aad" : "1px solid #dbe5f1",
                borderRadius: 11,
                padding: "13px 16px",
                background: entryMode === "document" ? "#004aad" : "#fff",
                color: entryMode === "document" ? "#fff" : "#334155",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              📄 {copy.documentTab}
            </button>
          </div>
        </section>

        {entryMode === "manual" && <section style={{ ...panel, padding: 22, marginBottom: 24 }}>
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
              <button disabled={busy} type="submit" style={{ border: 0, borderRadius: 10, padding: "11px 18px", background: "#004aad", color: "#fff", fontWeight: 900, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.65 : 1 }}>{editingId ? copy.update : copy.save}</button>
              {editingId && <button type="button" onClick={resetForm} style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "11px 18px", background: "#fff", color: "#334155", fontWeight: 800, cursor: "pointer" }}>{copy.cancel}</button>}
            </div>
          </form>
        </section>}

        {entryMode === "document" && (
          <section style={{ ...panel, padding: 22, marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 7px", fontSize: 22 }}>{copy.documentTitle}</h2>
            <p style={{ color: "#64748b", lineHeight: 1.55, marginTop: 0 }}>{copy.documentText}</p>

            {docMessage && (
              <p style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a", padding: 12, borderRadius: 10 }}>
                {docMessage}
              </p>
            )}

            <label
              style={{
                display: "grid",
                placeItems: "center",
                background: "#004aad",
                color: "#fff",
                padding: 25,
                borderRadius: 16,
                fontWeight: 900,
                cursor: uploading ? "wait" : "pointer",
                margin: "20px 0",
              }}
            >
              <span style={{ fontSize: 31 }}>📄</span>
              <span style={{ marginTop: 5 }}>{uploading ? copy.analysing : copy.uploadDocument}</span>
              <small style={{ marginTop: 7, opacity: 0.85 }}>{copy.formats}</small>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={uploadDocument}
                disabled={uploading}
                hidden
              />
            </label>

            <div style={{ display: "grid", gap: 14 }}>
              {docs.length === 0 && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 18, borderRadius: 12, color: "#64748b" }}>
                  {copy.noDocuments}
                </div>
              )}

              {docs.map((doc) => {
                const items = doc.extraction?.transactions ?? [];
                const expenseItems = items.filter((item) => item.entry_type === "expense");
                const hasWrongType = items.some((item) => item.entry_type !== "income");
                const complete =
                  Boolean(doc.extraction?.relevant) &&
                  expenseItems.length > 0 &&
                  !hasWrongType &&
                  expenseItems.every(
                    (item) =>
                      item.transaction_date &&
                      item.source &&
                      item.subtotal !== null
                  );

                return (
                  <article
                    key={doc.id}
                    style={{
                      border: "1px solid #dbe5f1",
                      borderRadius: 14,
                      padding: 16,
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <strong>{doc.original_file_name}</strong>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
                          {doc.status === "analyzing"
                            ? copy.analysing
                            : doc.status === "ready"
                              ? copy.review
                              : doc.status}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => openDocument(doc.storage_path)} style={smallButton}>
                          {copy.open}
                        </button>

                        {doc.status !== "confirmed" && (
                          <button
                            type="button"
                            disabled={busyDocId === doc.id}
                            onClick={() => analyzeDocument(doc.id)}
                            style={smallButton}
                          >
                            {busyDocId === doc.id ? copy.analysing : copy.analyze}
                          </button>
                        )}

                        {doc.status !== "confirmed" && (
                          <button
                            type="button"
                            disabled={busyDocId === doc.id}
                            onClick={() => removeDocument(doc)}
                            style={{ ...smallButton, color: "#b91c1c", borderColor: "#fecaca" }}
                          >
                            {copy.deleteDocument}
                          </button>
                        )}
                      </div>
                    </div>

                    {doc.error_message && (
                      <p style={{ color: "#b91c1c" }}>{doc.error_message}</p>
                    )}

                    {doc.extraction && (
                      <div style={{ marginTop: 14 }}>
                        <p style={{ color: "#004aad", fontWeight: 900 }}>
                          {items.length} {copy.detected}
                        </p>

                        {(doc.extraction.document_notes ?? []).length > 0 && (
                          <p style={{ color: "#92400e" }}>
                            <strong>{copy.review} :</strong>{" "}
                            {doc.extraction.document_notes.join(" • ")}
                          </p>
                        )}

                        <div style={{ display: "grid", gap: 10 }}>
                          {items.map((item, index) => (
                            <div
                              key={`${doc.id}-${index}`}
                              style={{
                                background: item.entry_type === "expense" ? "#f0fdf4" : "#fff7ed",
                                border: item.entry_type === "expense" ? "1px solid #bbf7d0" : "1px solid #fed7aa",
                                borderRadius: 11,
                                padding: 13,
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
                                  gap: 10,
                                }}
                              >
                                <DocField
                                  label="Type"
                                  value={
                                    item.entry_type === "expense"
                                      ? copy.incomeDetected
                                      : item.entry_type === "expense"
                                        ? copy.expenseDetected
                                        : copy.unknownDetected
                                  }
                                />
                                <DocField label={copy.date} value={item.transaction_date ? item.transaction_date.split("-").reverse().join("/") : "—"} />
                                <DocField label={copy.source} value={item.source ?? "—"} />
                                <DocField label={copy.beforeTax} value={item.subtotal === null ? "—" : money(item.subtotal, lang)} />
                                <DocField label={copy.gst} value={item.gst === null ? "—" : money(item.gst, lang)} />
                                <DocField label={copy.qst} value={item.qst === null ? "—" : money(item.qst, lang)} />
                                <DocField label={copy.total} value={item.total === null ? "—" : money(item.total, lang)} />
                                <DocField label={copy.confidence} value={`${Math.round(item.confidence * 100)} %`} />
                              </div>

                              {item.notes.length > 0 && (
                                <p style={{ color: "#92400e", marginBottom: 0 }}>
                                  <strong>{copy.review} :</strong> {item.notes.join(" • ")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {hasWrongType && (
                          <p style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", padding: 12, borderRadius: 10 }}>
                            {copy.wrongType}
                          </p>
                        )}

                        {doc.status === "ready" && (
                          <button
                            type="button"
                            disabled={!complete || busyDocId === doc.id}
                            onClick={() => confirmExpenseDocument(doc)}
                            style={{
                              border: 0,
                              borderRadius: 10,
                              background: complete ? "#15803d" : "#94a3b8",
                              color: "#fff",
                              padding: "11px 16px",
                              marginTop: 14,
                              fontWeight: 900,
                              cursor: complete ? "pointer" : "not-allowed",
                            }}
                          >
                            {copy.confirmExpense}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <Link
              href={`/tenue-de-livres/documents?lang=${lang}`}
              style={{
                display: "inline-block",
                marginTop: 18,
                color: "#004aad",
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              {copy.allDocuments} →
            </Link>
          </section>
        )}

        <section style={{ ...panel, overflow: "hidden" }}>
          <h2 style={{ margin: 0, padding: "20px 22px", fontSize: 22, borderBottom: "1px solid #e2e8f0" }}>{copy.list}</h2>
          {expenses.length === 0 ? (
            <p style={{ color: "#64748b", padding: 22, margin: 0 }}>{copy.empty}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
                <thead><tr style={{ background: "#f8fafc", textAlign: "left" }}><Th>{copy.date}</Th><Th>{copy.source}</Th><Th>{copy.description}</Th><Th>{copy.beforeTax}</Th><Th>{copy.gst}</Th><Th>{copy.qst}</Th><Th>{copy.total}</Th><Th>{copy.actions}</Th></tr></thead>
                <tbody>
                  {expenses.map((item) => (
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

function DocField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,.72)", borderRadius: 8, padding: 9 }}>
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 900, marginTop: 4, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}
