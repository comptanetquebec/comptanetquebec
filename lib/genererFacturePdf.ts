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
    total: "TOTAL",
    payment: "MODE DE PAIEMENT",
    interac: "Virement Interac",
    stripe: "Paiement en ligne",
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
    total: "TOTAL",
    payment: "PAYMENT METHOD",
    interac: "Interac e-Transfer",
    stripe: "Online payment",
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
    total: "TOTAL",
    payment: "MÉTODO DE PAGO",
    interac: "Transferencia Interac",
    stripe: "Pago en línea",
    paid: "PAGADA",
    unpaid: "POR PAGAR",
    thanks: "¡Gracias por su confianza!",
    tagline:
      "IMPUESTOS • TENEDURÍA DE LIBROS • SERVICIOS PARA EMPRESAS",
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

  // COULEURS
  const navy: [number, number, number] = [24, 58, 112];
  const dark: [number, number, number] = [30, 41, 59];
  const grey: [number, number, number] = [100, 116, 139];
  const lightBlue: [number, number, number] = [239, 246, 255];
  const veryLight: [number, number, number] = [248, 250, 252];
  const green: [number, number, number] = [22, 101, 52];
  const greenLight: [number, number, number] = [220, 252, 231];
  const amber: [number, number, number] = [146, 64, 14];
  const amberLight: [number, number, number] = [254, 249, 195];

  const pageWidth = 215.9;

  // =====================================================
  // BANDE SUPÉRIEURE
  // =====================================================

  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 7, "F");

  // =====================================================
  // ENTREPRISE
  // =====================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ComptaNet Québec", 18, 25);

  doc.setTextColor(...grey);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(L.tagline, 18, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text("849, boulevard Pie-XII", 18, 43);
  doc.text("Québec (Québec) G1X 3T2", 18, 48);
  doc.text("581-985-2599", 18, 53);
  doc.text("comptanetquebec@gmail.com", 18, 58);

  // =====================================================
  // TITRE FACTURE
  // =====================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);

  doc.text(L.invoice, 198, 25, {
    align: "right",
  });

  doc.setFontSize(9);

  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");

  doc.text(
    `${L.invoiceNumber}:`,
    150,
    38
  );

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");

  doc.text(
    facture.numero_facture ?? "—",
    198,
    38,
    {
      align: "right",
    }
  );

  let detailY = 45;

  if (facture.cq_id) {
    doc.setTextColor(...grey);
    doc.setFont("helvetica", "normal");

    doc.text(
      `${L.clientNumber}:`,
      150,
      detailY
    );

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");

    doc.text(
      facture.cq_id,
      198,
      detailY,
      {
        align: "right",
      }
    );

    detailY += 7;
  }

  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");

  doc.text(
    `${L.date}:`,
    150,
    detailY
  );

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");

  doc.text(
    formatDate(facture.date_facture, lang),
    198,
    detailY,
    {
      align: "right",
    }
  );

  // =====================================================
  // SÉPARATEUR
  // =====================================================

  doc.setDrawColor(220, 228, 238);
  doc.line(18, 68, 198, 68);

  // =====================================================
  // CLIENT
  // =====================================================

  doc.setFillColor(...lightBlue);
  doc.roundedRect(
    18,
    77,
    180,
    42,
    3,
    3,
    "F"
  );

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(L.billedTo, 25, 87);

  doc.setTextColor(...dark);
  doc.setFontSize(13);

  doc.text(
    facture.client_nom || "—",
    25,
    96
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grey);

  let clientY = 103;

  if (facture.client_adresse) {
    doc.text(
      facture.client_adresse,
      25,
      clientY
    );

    clientY += 5;
  }

  const cityLine = [
    facture.client_ville,
    facture.client_province,
    facture.client_code_postal,
  ]
    .filter(Boolean)
    .join(", ");

  if (cityLine) {
    doc.text(
      cityLine,
      25,
      clientY
    );

    clientY += 5;
  }

  if (facture.client_courriel) {
    doc.text(
      facture.client_courriel,
      120,
      103
    );
  }

  // =====================================================
  // TABLEAU
  // =====================================================

  const qty = Number(
    facture.quantite ?? 1
  );

  const unitPrice = Number(
    facture.prix_unitaire ?? 0
  );

  autoTable(doc, {
    startY: 130,

    head: [
      [
        L.description,
        L.quantity,
        L.price,
        L.amount,
      ],
    ],

    body: [
      [
        facture.description || "—",
        String(qty),
        money(unitPrice, lang),
        money(
          facture.sous_total ??
            unitPrice * qty,
          lang
        ),
      ],
    ],

    theme: "plain",

    margin: {
      left: 18,
      right: 18,
    },

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
    },

    bodyStyles: {
      fillColor: veryLight,
    },

    columnStyles: {
      0: {
        cellWidth: 90,
      },

      1: {
        cellWidth: 20,
        halign: "center",
      },

      2: {
        cellWidth: 35,
        halign: "right",
      },

      3: {
        cellWidth: 35,
        halign: "right",
      },
    },
  });

  // =====================================================
  // TOTAUX
  // =====================================================

  const totalsX = 118;
  const valuesX = 198;
  const totalsY = 170;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);

  doc.text(
    L.subtotal,
    totalsX,
    totalsY
  );

  doc.text(
    money(facture.sous_total, lang),
    valuesX,
    totalsY,
    {
      align: "right",
    }
  );

  doc.text(
    L.gst,
    totalsX,
    totalsY + 8
  );

  doc.text(
    money(facture.tps, lang),
    valuesX,
    totalsY + 8,
    {
      align: "right",
    }
  );

  doc.text(
    L.qst,
    totalsX,
    totalsY + 16
  );

  doc.text(
    money(facture.tvq, lang),
    valuesX,
    totalsY + 16,
    {
      align: "right",
    }
  );

  doc.setDrawColor(...navy);

  doc.line(
    totalsX,
    totalsY + 23,
    valuesX,
    totalsY + 23
  );

  // TOTAL ENCADRÉ

  doc.setFillColor(...lightBlue);

  doc.roundedRect(
    113,
    totalsY + 28,
    85,
    21,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.setFontSize(10);

  doc.text(
    L.total,
    120,
    totalsY + 41
  );

  doc.setTextColor(...navy);
  doc.setFontSize(17);

  doc.text(
    money(facture.total, lang),
    192,
    totalsY + 41,
    {
      align: "right",
    }
  );

  // =====================================================
  // PAIEMENT
  // =====================================================

  const boxY = 228;

  doc.setFillColor(...lightBlue);

  doc.roundedRect(
    18,
    boxY,
    84,
    37,
    4,
    4,
    "F"
  );

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    L.payment,
    25,
    boxY + 10
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.setFontSize(9);

  const mode =
    facture.mode_paiement === "stripe"
      ? L.stripe
      : L.interac;

  doc.text(
    mode,
    25,
    boxY + 19
  );

  if (
    !facture.mode_paiement ||
    facture.mode_paiement === "interac"
  ) {
    doc.setTextColor(...dark);
    doc.setFontSize(8);

    doc.text(
      "comptanetquebec@gmail.com",
      25,
      boxY + 27
    );
  }

  // =====================================================
  // STATUT
  // =====================================================

  const isPaid =
    facture.statut === "paid";

  if (isPaid) {
    doc.setFillColor(...greenLight);
  } else {
    doc.setFillColor(...amberLight);
  }

  doc.roundedRect(
    111,
    boxY,
    87,
    37,
    4,
    4,
    "F"
  );

  if (isPaid) {
    doc.setTextColor(...green);
  } else {
    doc.setTextColor(...amber);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);

  doc.text(
    isPaid
      ? `✓ ${L.paid}`
      : L.unpaid,
    154.5,
    boxY + 22,
    {
      align: "center",
    }
  );

  // =====================================================
  // PIED DE PAGE
  // =====================================================

  doc.setDrawColor(220, 228, 238);

  doc.line(
    18,
    277,
    198,
    277
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.setFontSize(7.5);

  doc.text(
    "TPS : 701807737",
    18,
    285
  );

  doc.text(
    "TVQ : 1227932399",
    18,
    290
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.setFontSize(11);

  doc.text(
    L.thanks,
    198,
    287,
    {
      align: "right",
    }
  );

  // BANDE INFÉRIEURE

  doc.setFillColor(...navy);

  doc.rect(
    0,
    272.4,
    pageWidth,
    7,
    "F"
  );

  // =====================================================
  // ENREGISTRER
  // =====================================================

  const numero =
    facture.numero_facture?.replace(
      /[^a-zA-Z0-9-_]/g,
      "_"
    ) || "facture";

  doc.save(`${numero}.pdf`);
}
