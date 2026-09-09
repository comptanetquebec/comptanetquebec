import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type FacturePdf = {
  numero_facture: string | null;
  cq_id?: string | null;

  client_nom: string;
  client_courriel?: string | null;
  client_adresse?: string | null;
  client_ville?: string | null;
  client_province?: string | null;
  client_code_postal?: string | null;

  description: string | null;
  quantite: number | null;
  prix_unitaire: number | null;

  sous_total: number | null;
  tps: number | null;
  tvq: number | null;
  total: number | null;

  statut: string | null;
  mode_paiement?: string | null;

  date_facture: string | null;
};

type Lang = "fr" | "en" | "es";

const COPY = {
  fr: {
    invoice: "FACTURE",
    invoiceNumber: "No de facture",
    clientNumber: "No client",
    date: "Date",
    billedTo: "FACTURÉ À",
    description: "DESCRIPTION",
    quantity: "QTÉ",
    price: "PRIX",
    amount: "MONTANT",
    subtotal: "Sous-total",
    gst: "TPS (5 %)",
    qst: "TVQ (9,975 %)",
    total: "TOTAL À PAYER",
    payment: "PAIEMENT",
    interac: "Virement Interac",
    paid: "PAYÉE",
    unpaid: "À PAYER",
    thanks: "Merci de votre confiance !",
    tagline: "IMPÔTS • TENUE DE LIVRES • SERVICES AUX ENTREPRISES",
  },

  en: {
    invoice: "INVOICE",
    invoiceNumber: "Invoice no.",
    clientNumber: "Client no.",
    date: "Date",
    billedTo: "BILLED TO",
    description: "DESCRIPTION",
    quantity: "QTY",
    price: "PRICE",
    amount: "AMOUNT",
    subtotal: "Subtotal",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    total: "TOTAL DUE",
    payment: "PAYMENT",
    interac: "Interac e-Transfer",
    paid: "PAID",
    unpaid: "AMOUNT DUE",
    thanks: "Thank you for your trust!",
    tagline: "TAXES • BOOKKEEPING • BUSINESS SERVICES",
  },

  es: {
    invoice: "FACTURA",
    invoiceNumber: "N.º de factura",
    clientNumber: "N.º de cliente",
    date: "Fecha",
    billedTo: "FACTURADO A",
    description: "DESCRIPCIÓN",
    quantity: "CANT.",
    price: "PRECIO",
    amount: "IMPORTE",
    subtotal: "Subtotal",
    gst: "GST/TPS (5 %)",
    qst: "QST/TVQ (9,975 %)",
    total: "TOTAL A PAGAR",
    payment: "PAGO",
    interac: "Transferencia Interac",
    paid: "PAGADA",
    unpaid: "POR PAGAR",
    thanks: "¡Gracias por su confianza!",
    tagline: "IMPUESTOS • TENEDURÍA DE LIBROS • SERVICIOS PARA EMPRESAS",
  },
} as const;

function argent(value: number | null | undefined, lang: Lang) {
  const locale =
    lang === "fr" ? "fr-CA" :
    lang === "es" ? "es-CA" :
    "en-CA";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(Number(value ?? 0));
}

function dateFormat(date: string | null, lang: Lang) {
  if (!date) return "—";

  const locale =
    lang === "fr" ? "fr-CA" :
    lang === "es" ? "es-CA" :
    "en-CA";

  return new Intl.DateTimeFormat(locale).format(
    new Date(`${date}T12:00:00`)
  );
}

export function genererFacturePdf(
  facture: FacturePdf,
  lang: Lang = "fr"
) {
  const L = COPY[lang];

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const bleu = [22, 55, 112] as const;
  const bleuPale = [239, 246, 255] as const;
  const gris = [71, 85, 105] as const;

  // Ligne supérieure
  doc.setFillColor(...bleu);
  doc.rect(0, 0, 216, 5, "F");

  // Entreprise
  doc.setTextColor(...bleu);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("ComptaNet Québec", 18, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gris);
  doc.text(L.tagline, 18, 31);

  doc.setFontSize(9);
  doc.text("849, boulevard Pie XII", 18, 41);
  doc.text("Québec (Québec) G1X 3T2", 18, 46);
  doc.text("581-985-2599", 18, 51);
  doc.text("comptanetquebec@gmail.com", 18, 56);

  // FACTURE
  doc.setTextColor(...bleu);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.text(L.invoice, 198, 25, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...gris);

  doc.text(
    `${L.invoiceNumber}: ${facture.numero_facture ?? "—"}`,
    198,
    36,
    { align: "right" }
  );

  if (facture.cq_id) {
    doc.text(
      `${L.clientNumber}: ${facture.cq_id}`,
      198,
      42,
      { align: "right" }
    );
  }

  doc.text(
    `${L.date}: ${dateFormat(facture.date_facture, lang)}`,
    198,
    facture.cq_id ? 48 : 42,
    { align: "right" }
  );

  // Client
  doc.setFillColor(...bleuPale);
  doc.roundedRect(18, 68, 180, 38, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...bleu);
  doc.setFontSize(9);
  doc.text(L.billedTo, 25, 78);

  doc.setFontSize(11);
  doc.text(facture.client_nom || "—", 25, 86);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gris);
  doc.setFontSize(9);

  let clientY = 92;

  if (facture.client_adresse) {
    doc.text(facture.client_adresse, 25, clientY);
    clientY += 5;
  }

  const ville = [
    facture.client_ville,
    facture.client_province,
    facture.client_code_postal,
  ]
    .filter(Boolean)
    .join(", ");

  if (ville) {
    doc.text(ville, 25, clientY);
    clientY += 5;
  }

  if (facture.client_courriel) {
    doc.text(facture.client_courriel, 25, clientY);
  }

  // Tableau
  const qty = Number(facture.quantite ?? 1);
  const prix = Number(facture.prix_unitaire ?? 0);

  autoTable(doc, {
    startY: 116,

    head: [[
      L.description,
      L.quantity,
      L.price,
      L.amount,
    ]],

    body: [[
      facture.description ?? "",
      String(qty),
      argent(prix, lang),
      argent(prix * qty, lang),
    ]],

    theme: "plain",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
    },

    headStyles: {
      fillColor: [22, 55, 112],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },

    margin: {
      left: 18,
      right: 18,
    },
  });

  // Totaux
  const y = 158;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...gris);

  doc.text(L.subtotal, 130, y);
  doc.text(
    argent(facture.sous_total, lang),
    198,
    y,
    { align: "right" }
  );

  doc.text(L.gst, 130, y + 8);
  doc.text(
    argent(facture.tps, lang),
    198,
    y + 8,
    { align: "right" }
  );

  doc.text(L.qst, 130, y + 16);
  doc.text(
    argent(facture.tvq, lang),
    198,
    y + 16,
    { align: "right" }
  );

  doc.setDrawColor(...bleu);
  doc.line(130, y + 23, 198, y + 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);

  doc.text(L.total, 130, y + 33);

  doc.setFontSize(16);
  doc.setTextColor(...bleu);
  doc.text(
    argent(facture.total, lang),
    198,
    y + 33,
    { align: "right" }
  );

  // Paiement
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(18, 205, 84, 34, 3, 3, "F");

  doc.setTextColor(...bleu);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(L.payment, 24, 215);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gris);
  doc.text(L.interac, 24, 223);
  doc.text("comptanetquebec@gmail.com", 24, 230);

  // Statut
  const payee = facture.statut === "paid";

  if (payee) {
    doc.setFillColor(236, 253, 245);
  } else {
    doc.setFillColor(254, 249, 195);
  }

  doc.roundedRect(114, 205, 84, 34, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  if (payee) {
    doc.setTextColor(22, 101, 52);
    doc.text(L.paid, 156, 224, { align: "center" });
  } else {
    doc.setTextColor(146, 64, 14);
    doc.text(L.unpaid, 156, 224, { align: "center" });
  }

  // Numéros de taxes
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gris);
  doc.setFontSize(8);

  doc.text("TPS : 701807737", 18, 254);
  doc.text("TVQ : 1227932399", 18, 259);

  // Merci
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(L.thanks, 108, 270, { align: "center" });

  // Ligne inférieure
  doc.setFillColor(...bleu);
  doc.rect(0, 274, 216, 5, "F");

  // Téléchargement
  const numero =
    facture.numero_facture?.replace(/[^a-zA-Z0-9-_]/g, "_") ??
    "facture";

  doc.save(`${numero}.pdf`);
}
