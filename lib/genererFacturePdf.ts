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
    invoiceNo: "N° DE FACTURE",
    clientNo: "N° CLIENT",
    date: "DATE",
    billedTo: "FACTURÉ À",
    description: "DESCRIPTION",
    quantity: "QTÉ",
    unitPrice: "PRIX UNITAIRE",
    amount: "MONTANT",
    subtotal: "Sous-total",
    gst: "TPS (5 %)",
    qst: "TVQ (9,975 %)",
    total: "TOTAL",
    payment: "MODE DE PAIEMENT",
    interac: "Virement Interac",
    stripe: "Paiement en ligne",
    paid: "PAYÉE",
    unpaid: "À PAYER",
    thanks: "MERCI DE VOTRE CONFIANCE",
    tagline: "IMPÔTS  •  TENUE DE LIVRES  •  SERVICES AUX ENTREPRISES",
  },

  en: {
    invoice: "INVOICE",
    invoiceNo: "INVOICE NO.",
    clientNo: "CLIENT NO.",
    date: "DATE",
    billedTo: "BILLED TO",
    description: "DESCRIPTION",
    quantity: "QTY",
    unitPrice: "UNIT PRICE",
    amount: "AMOUNT",
    subtotal: "Subtotal",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    total: "TOTAL",
    payment: "PAYMENT METHOD",
    interac: "Interac e-Transfer",
    stripe: "Online payment",
    paid: "PAID",
    unpaid: "AMOUNT DUE",
    thanks: "THANK YOU FOR YOUR TRUST",
    tagline: "TAXES  •  BOOKKEEPING  •  BUSINESS SERVICES",
  },

  es: {
    invoice: "FACTURA",
    invoiceNo: "N.º DE FACTURA",
    clientNo: "N.º DE CLIENTE",
    date: "FECHA",
    billedTo: "FACTURADO A",
    description: "DESCRIPCIÓN",
    quantity: "CANT.",
    unitPrice: "PRECIO UNITARIO",
    amount: "IMPORTE",
    subtotal: "Subtotal",
    gst: "GST/TPS (5 %)",
    qst: "QST/TVQ (9,975 %)",
    total: "TOTAL",
    payment: "MÉTODO DE PAGO",
    interac: "Transferencia Interac",
    stripe: "Pago en línea",
    paid: "PAGADA",
    unpaid: "POR PAGAR",
    thanks: "GRACIAS POR SU CONFIANZA",
    tagline:
      "IMPUESTOS  •  TENEDURÍA DE LIBROS  •  SERVICIOS PARA EMPRESAS",
  },
} as const;

function money(
  value: number | null | undefined,
  lang: Lang
) {
  const locale =
    lang === "fr"
      ? "fr-CA"
      : lang === "es"
      ? "es-CA"
      : "en-CA";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(Number(value ?? 0));
}

function formatDate(
  value: string | null,
  lang: Lang
) {
  if (!value) return "—";

  const locale =
    lang === "fr"
      ? "fr-CA"
      : lang === "es"
      ? "es-CA"
      : "en-CA";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
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

  const W = 215.9;
  const H = 279.4;

  // Couleurs ComptaNet
  const navy: [number, number, number] = [18, 52, 100];
  const blue: [number, number, number] = [36, 99, 170];
  const lightBlue: [number, number, number] = [234, 244, 253];
  const paleBlue: [number, number, number] = [246, 250, 254];
  const dark: [number, number, number] = [30, 41, 59];
  const grey: [number, number, number] = [100, 116, 139];
  const line: [number, number, number] = [218, 228, 238];

  const green: [number, number, number] = [22, 101, 52];
  const greenBg: [number, number, number] = [220, 252, 231];

  const amber: [number, number, number] = [146, 64, 14];
  const amberBg: [number, number, number] = [254, 249, 195];

  const isPaid = facture.statut === "paid";

  // =====================================================
  // GRAND EN-TÊTE BLEU
  // =====================================================

  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 55, "F");

  // Petit accent bleu
  doc.setFillColor(...blue);
  doc.rect(0, 55, W, 3, "F");

  // Marque
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("ComptaNet", 18, 23);

  doc.setTextColor(156, 211, 255);
  doc.text("Québec", 18, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(220, 235, 250);
  doc.text(L.tagline, 18, 42);

  // FACTURE à droite
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(L.invoice, 198, 24, {
    align: "right",
  });

  doc.setFontSize(11);
  doc.setTextColor(190, 220, 245);
  doc.text(
    facture.numero_facture ?? "—",
    198,
    34,
    { align: "right" }
  );

  // =====================================================
  // CARTES INFOS FACTURE
  // =====================================================

  const cardY = 68;
  const cardW = facture.cq_id ? 54 : 83;

  function infoCard(
    x: number,
    title: string,
    value: string
  ) {
    doc.setFillColor(...paleBlue);
    doc.roundedRect(
      x,
      cardY,
      cardW,
      25,
      3,
      3,
      "F"
    );

    doc.setTextColor(...grey);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(title, x + 6, cardY + 8);

    doc.setTextColor(...navy);
    doc.setFontSize(10);
    doc.text(value, x + 6, cardY + 17);
  }

  if (facture.cq_id) {
    infoCard(
      18,
      L.invoiceNo,
      facture.numero_facture ?? "—"
    );

    infoCard(
      80,
      L.clientNo,
      facture.cq_id
    );

    infoCard(
      142,
      L.date,
      formatDate(facture.date_facture, lang)
    );
  } else {
    infoCard(
      18,
      L.invoiceNo,
      facture.numero_facture ?? "—"
    );

    infoCard(
      115,
      L.date,
      formatDate(facture.date_facture, lang)
    );
  }

  // =====================================================
  // CLIENT
  // =====================================================

  const clientY = 104;

  doc.setFillColor(...lightBlue);
  doc.roundedRect(
    18,
    clientY,
    180,
    48,
    4,
    4,
    "F"
  );

  // Accent vertical
  doc.setFillColor(...blue);
  doc.roundedRect(
    18,
    clientY,
    4,
    48,
    2,
    2,
    "F"
  );

  doc.setTextColor(...blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(
    L.billedTo,
    29,
    clientY + 11
  );

  doc.setTextColor(...dark);
  doc.setFontSize(14);
  doc.text(
    facture.client_nom || "—",
    29,
    clientY + 22
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);

  let addressY = clientY + 31;

  if (facture.client_adresse) {
    doc.text(
      facture.client_adresse,
      29,
      addressY
    );
    addressY += 5;
  }

  const city = [
    facture.client_ville,
    facture.client_province,
    facture.client_code_postal,
  ]
    .filter(Boolean)
    .join(", ");

  if (city) {
    doc.text(city, 29, addressY);
  }

  if (facture.client_courriel) {
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.text(
      facture.client_courriel,
      190,
      clientY + 30,
      { align: "right" }
    );
  }

  // =====================================================
  // TABLEAU SERVICE
  // =====================================================

  const qty = Number(facture.quantite ?? 1);
  const price = Number(
    facture.prix_unitaire ?? 0
  );

  autoTable(doc, {
    startY: 164,

    head: [[
      L.description,
      L.quantity,
      L.unitPrice,
      L.amount,
    ]],

    body: [[
      facture.description || "—",
      String(qty),
      money(price, lang),
      money(
        facture.sous_total ??
          qty * price,
        lang
      ),
    ]],

    margin: {
      left: 18,
      right: 18,
    },

    theme: "plain",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5,
      textColor: dark,
    },

    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      minCellHeight: 12,
    },

    bodyStyles: {
      fillColor: [250, 252, 254],
      minCellHeight: 17,
    },

    columnStyles: {
      0: {
        cellWidth: 86,
      },
      1: {
        cellWidth: 22,
        halign: "center",
      },
      2: {
        cellWidth: 36,
        halign: "right",
      },
      3: {
        cellWidth: 36,
        halign: "right",
        fontStyle: "bold",
      },
    },
  });

  // =====================================================
  // ZONE PAIEMENT À GAUCHE
  // =====================================================

  const paymentY = 205;

  doc.setFillColor(...paleBlue);
  doc.roundedRect(
    18,
    paymentY,
    82,
    44,
    4,
    4,
    "F"
  );

  doc.setTextColor(...blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(
    L.payment,
    26,
    paymentY + 10
  );

  const mode =
    facture.mode_paiement === "stripe"
      ? L.stripe
      : L.interac;

  doc.setTextColor(...dark);
  doc.setFontSize(11);
  doc.text(
    mode,
    26,
    paymentY + 21
  );

  if (
    !facture.mode_paiement ||
    facture.mode_paiement === "interac"
  ) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.setFontSize(7.5);

    doc.text(
      "comptanetquebec@gmail.com",
      26,
      paymentY + 30
    );
  }

  // Statut comme sceau
  if (isPaid) {
    doc.setFillColor(...greenBg);
    doc.setTextColor(...green);
  } else {
    doc.setFillColor(...amberBg);
    doc.setTextColor(...amber);
  }

  doc.roundedRect(
    26,
    paymentY + 34,
    65,
    7,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  doc.text(
    isPaid
      ? L.paid
      : L.unpaid,
    58.5,
    paymentY + 39,
    {
      align: "center",
    }
  );

  // =====================================================
  // TOTAUX À DROITE
  // =====================================================

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...line);
  doc.roundedRect(
    109,
    paymentY,
    89,
    44,
    4,
    4,
    "FD"
  );

  const labelX = 118;
  const amountX = 190;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.setFontSize(8.5);

  doc.text(
    L.subtotal,
    labelX,
    paymentY + 10
  );

  doc.text(
    money(facture.sous_total, lang),
    amountX,
    paymentY + 10,
    { align: "right" }
  );

  doc.text(
    L.gst,
    labelX,
    paymentY + 18
  );

  doc.text(
    money(facture.tps, lang),
    amountX,
    paymentY + 18,
    { align: "right" }
  );

  doc.text(
    L.qst,
    labelX,
    paymentY + 26
  );

  doc.text(
    money(facture.tvq, lang),
    amountX,
    paymentY + 26,
    { align: "right" }
  );

  // Total bleu foncé
  doc.setFillColor(...navy);
  doc.roundedRect(
    113,
    paymentY + 31,
    81,
    10,
    2,
    2,
    "F"
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    L.total,
    119,
    paymentY + 37.5
  );

  doc.setFontSize(12);

  doc.text(
    money(facture.total, lang),
    189,
    paymentY + 37.5,
    {
      align: "right",
    }
  );

  // =====================================================
  // CONTACT / NUMÉROS DE TAXES
  // =====================================================

  doc.setDrawColor(...line);
  doc.line(18, 258, 198, 258);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grey);

  doc.text(
    "849, boulevard Pie-XII • Québec (Québec) G1X 3T2",
    18,
    266
  );

  doc.text(
    "581-985-2599 • comptanetquebec@gmail.com",
    18,
    271
  );

  doc.text(
    "TPS : 701807737   •   TVQ : 1227932399",
    198,
    266,
    {
      align: "right",
    }
  );

  // =====================================================
  // BANDEAU MERCI
  // =====================================================

  doc.setFillColor(...navy);
  doc.rect(0, H - 8, W, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    L.thanks,
    W / 2,
    H - 3,
    {
      align: "center",
    }
  );

  // =====================================================
  // TÉLÉCHARGEMENT
  // =====================================================

  const numero =
    facture.numero_facture?.replace(
      /[^a-zA-Z0-9-_]/g,
      "_"
    ) || "facture";

  doc.save(`${numero}.pdf`);
}
