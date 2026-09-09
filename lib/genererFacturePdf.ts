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
    invoiceNo: "N° FACTURE",
    clientNo: "N° CLIENT",
    date: "DATE",
    for: "POUR",
    billedTo: "FACTURÉ À",
    description: "DESCRIPTION",
    quantity: "QTÉ",
    unitPrice: "PRIX UNITAIRE",
    amount: "MONTANT",
    subtotal: "Sous-total",
    gst: "TPS (5 %)",
    qst: "TVQ (9,975 %)",
    totalDue: "TOTAL À PAYER",
    totalPaid: "TOTAL PAYÉ",
    paymentInterac: "PAIEMENT PAR VIREMENT INTERAC",
    paymentOnline: "PAIEMENT EN LIGNE",
    paid: "PAYÉE",
    unpaid: "À PAYER",
    gstNumber: "N° d'inscription TPS",
    qstNumber: "N° d'inscription TVQ",
    trust: "Merci de votre confiance !",
    partner: ["VOTRE", "PARTENAIRE", "DE CONFIANCE"],
    tagline: "IMPÔTS  •  TENUE DE LIVRES  •  SERVICES AUX ENTREPRISES",
    service: ["AU SERVICE DES PARTICULIERS", "ET DES ENTREPRISES DU QUÉBEC"],
  },

  en: {
    invoice: "INVOICE",
    invoiceNo: "INVOICE NO.",
    clientNo: "CLIENT NO.",
    date: "DATE",
    for: "FOR",
    billedTo: "BILLED TO",
    description: "DESCRIPTION",
    quantity: "QTY",
    unitPrice: "UNIT PRICE",
    amount: "AMOUNT",
    subtotal: "Subtotal",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    totalDue: "TOTAL DUE",
    totalPaid: "TOTAL PAID",
    paymentInterac: "PAYMENT BY INTERAC E-TRANSFER",
    paymentOnline: "ONLINE PAYMENT",
    paid: "PAID",
    unpaid: "AMOUNT DUE",
    gstNumber: "GST registration no.",
    qstNumber: "QST registration no.",
    trust: "Thank you for your trust!",
    partner: ["YOUR", "TRUSTED", "PARTNER"],
    tagline: "TAXES  •  BOOKKEEPING  •  BUSINESS SERVICES",
    service: ["SERVING INDIVIDUALS", "AND BUSINESSES IN QUÉBEC"],
  },

  es: {
    invoice: "FACTURA",
    invoiceNo: "N.º FACTURA",
    clientNo: "N.º CLIENTE",
    date: "FECHA",
    for: "POR",
    billedTo: "FACTURADO A",
    description: "DESCRIPCIÓN",
    quantity: "CANT.",
    unitPrice: "PRECIO UNITARIO",
    amount: "IMPORTE",
    subtotal: "Subtotal",
    gst: "GST/TPS (5 %)",
    qst: "QST/TVQ (9,975 %)",
    totalDue: "TOTAL A PAGAR",
    totalPaid: "TOTAL PAGADO",
    paymentInterac: "PAGO POR TRANSFERENCIA INTERAC",
    paymentOnline: "PAGO EN LÍNEA",
    paid: "PAGADA",
    unpaid: "POR PAGAR",
    gstNumber: "N.º de registro GST/TPS",
    qstNumber: "N.º de registro QST/TVQ",
    trust: "¡Gracias por su confianza!",
    partner: ["SU", "SOCIO", "DE CONFIANZA"],
    tagline:
      "IMPUESTOS  •  TENEDURÍA DE LIBROS  •  SERVICIOS PARA EMPRESAS",
    service: ["AL SERVICIO DE PARTICULARES", "Y EMPRESAS DE QUÉBEC"],
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

  // =========================================================
  // COULEURS
  // =========================================================

  const navy: [number, number, number] = [8, 62, 103];
  const blue: [number, number, number] = [22, 94, 145];
  const mediumBlue: [number, number, number] = [69, 132, 186];

  const lightBlue: [number, number, number] = [235, 245, 253];
  const lighterBlue: [number, number, number] = [246, 250, 254];

  const dark: [number, number, number] = [22, 34, 49];
  const grey: [number, number, number] = [76, 91, 107];
  const line: [number, number, number] = [199, 216, 230];

  const green: [number, number, number] = [31, 122, 72];
  const greenBg: [number, number, number] = [226, 247, 234];

  const amber: [number, number, number] = [153, 92, 10];
  const amberBg: [number, number, number] = [255, 246, 210];

  const isPaid =
    facture.statut?.toLowerCase() === "paid" ||
    facture.statut?.toLowerCase() === "payee" ||
    facture.statut?.toLowerCase() === "payée";

  // =========================================================
  // LOGO CQ
  // =========================================================

  doc.setFillColor(...navy);
  doc.circle(23, 19, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CQ", 23, 22.5, {
    align: "center",
  });

  // =========================================================
  // COMPTANET QUÉBEC
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ComptaNet", 38, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.text("Québec", 38, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setCharSpace(1.2);
  doc.text(L.tagline, 13, 36);
  doc.setCharSpace(0);

  // =========================================================
  // VOTRE PARTENAIRE DE CONFIANCE
  // =========================================================

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setCharSpace(1.6);

  let partnerY = 12;

  L.partner.forEach((text) => {
    doc.text(text, 178, partnerY);
    partnerY += 5;
  });

  doc.setCharSpace(0);

  doc.setDrawColor(...mediumBlue);
  doc.setLineWidth(0.5);
  doc.line(178, 29, 190, 29);

  // =========================================================
  // COORDONNÉES ENTREPRISE
  // =========================================================

  const contactX = 14;
  const textX = 22;

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  // Pin
  doc.circle(contactX, 50, 1.7, "S");
  doc.circle(contactX, 50, 0.5, "F");
  doc.line(contactX, 51.7, contactX, 54);

  // Téléphone
  doc.setLineWidth(0.8);
  doc.line(12.8, 61.5, 15.5, 64.2);
  doc.line(15.5, 64.2, 17.2, 62.7);

  // Courriel
  doc.setLineWidth(0.4);
  doc.rect(11.5, 69, 5.5, 4, "S");
  doc.line(11.5, 69, 14.25, 71);
  doc.line(17, 69, 14.25, 71);

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  doc.text(
    "849, boulevard Pie XII",
    textX,
    50
  );

  doc.text(
    "Québec, Québec  G1X 3T2",
    textX,
    56
  );

  doc.text(
    "581-985-2599",
    textX,
    64
  );

  doc.text(
    "comptanetquebec@gmail.com",
    textX,
    72
  );

  // =========================================================
  // TITRE FACTURE
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);

  doc.text(
    L.invoice,
    200,
    54,
    {
      align: "right",
    }
  );

  // =========================================================
  // BLOC INFOS FACTURE
  // =========================================================

  doc.setFillColor(...lighterBlue);
  doc.roundedRect(
    126,
    60,
    74,
    facture.cq_id ? 36 : 30,
    3,
    3,
    "F"
  );

  const labelX = 132;
  const colonX = 159;
  const valueX = 166;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);

  doc.text(L.invoiceNo, labelX, 69);
  doc.text(":", colonX, 69);

  doc.text(L.date, labelX, 77);
  doc.text(":", colonX, 77);

  doc.text(L.for, labelX, 85);
  doc.text(":", colonX, 85);

  if (facture.cq_id) {
    doc.text(L.clientNo, labelX, 93);
    doc.text(":", colonX, 93);
  }

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");

  doc.text(
    facture.numero_facture ?? "—",
    valueX,
    69
  );

  doc.text(
    formatDate(
      facture.date_facture,
      lang
    ),
    valueX,
    77
  );

  const shortDescription =
    facture.description &&
    facture.description.length > 30
      ? facture.description.substring(0, 30) + "..."
      : facture.description || "—";

  doc.text(
    shortDescription,
    valueX,
    85
  );

  if (facture.cq_id) {
    doc.text(
      facture.cq_id,
      valueX,
      93
    );
  }

  // =========================================================
  // FACTURÉ À
  // =========================================================

  const clientY = 82;

  doc.setFillColor(...lightBlue);
  doc.roundedRect(
    10,
    clientY,
    94,
    39,
    3,
    3,
    "F"
  );

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    L.billedTo,
    15,
    clientY + 10
  );

  doc.setTextColor(...dark);
  doc.setFontSize(10.5);
  doc.text(
    facture.client_nom || "—",
    15,
    clientY + 19
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  let clientLineY = clientY + 27;

  if (facture.client_adresse) {
    doc.text(
      facture.client_adresse,
      15,
      clientLineY
    );
    clientLineY += 6;
  }

  const ville = [
    facture.client_ville,
    facture.client_province,
  ]
    .filter(Boolean)
    .join(" (");

  if (
    facture.client_ville &&
    facture.client_province
  ) {
    doc.text(
      `${facture.client_ville} (${facture.client_province})`,
      15,
      clientLineY
    );
    clientLineY += 6;
  } else if (ville) {
    doc.text(ville, 15, clientLineY);
    clientLineY += 6;
  }

  if (facture.client_code_postal) {
    doc.text(
      facture.client_code_postal,
      15,
      clientLineY
    );
  }

  // =========================================================
  // TABLEAU
  // =========================================================

  const qty = Number(
    facture.quantite ?? 1
  );

  const price = Number(
    facture.prix_unitaire ?? 0
  );

  autoTable(doc, {
    startY: 128,

    head: [[
      L.description,
      L.quantity,
      L.unitPrice,
      L.amount,
    ]],

    body: [[
      facture.description || "—",
      qty.toFixed(2).replace(".", ","),
      money(price, lang),
      money(
        facture.sous_total ??
          qty * price,
        lang
      ),
    ]],

    margin: {
      left: 10,
      right: 10,
    },

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 5,
      textColor: dark,
      lineColor: line,
      lineWidth: 0.25,
      valign: "middle",
    },

    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      minCellHeight: 12,
      lineColor: [150, 190, 220],
    },

    bodyStyles: {
      fillColor: [249, 252, 255],
      minCellHeight: 21,
    },

    columnStyles: {
      0: {
        cellWidth: 100,
      },

      1: {
        cellWidth: 23,
        halign: "center",
      },

      2: {
        cellWidth: 34,
        halign: "right",
      },

      3: {
        cellWidth: 39,
        halign: "right",
      },
    },
  });

  // =========================================================
  // TOTAUX
  // =========================================================

  const totalsX = 121;
  const totalsRight = 200;
  const totalsY = 169;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...dark);

  doc.text(
    L.subtotal,
    totalsX,
    totalsY
  );

  doc.text(
    money(
      facture.sous_total,
      lang
    ),
    totalsRight,
    totalsY,
    {
      align: "right",
    }
  );

  doc.setDrawColor(...line);
  doc.line(
    totalsX,
    totalsY + 4,
    totalsRight,
    totalsY + 4
  );

  doc.text(
    L.gst,
    totalsX,
    totalsY + 12
  );

  doc.text(
    money(facture.tps, lang),
    totalsRight,
    totalsY + 12,
    {
      align: "right",
    }
  );

  doc.line(
    totalsX,
    totalsY + 16,
    totalsRight,
    totalsY + 16
  );

  doc.text(
    L.qst,
    totalsX,
    totalsY + 24
  );

  doc.text(
    money(facture.tvq, lang),
    totalsRight,
    totalsY + 24,
    {
      align: "right",
    }
  );

  // Total
  doc.setFillColor(...lightBlue);
  doc.roundedRect(
    totalsX - 5,
    totalsY + 30,
    84,
    15,
    2,
    2,
    "F"
  );

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text(
    isPaid
      ? L.totalPaid
      : L.totalDue,
    totalsX,
    totalsY + 39.5
  );

  doc.setFontSize(13);

  doc.text(
    money(facture.total, lang),
    totalsRight - 2,
    totalsY + 39.5,
    {
      align: "right",
    }
  );

  // =========================================================
  // PAIEMENT
  // =========================================================

  const paymentY = 219;

  doc.setFillColor(...lightBlue);
  doc.roundedRect(
    10,
    paymentY,
    103,
    25,
    3,
    3,
    "F"
  );

  // Icône banque simplifiée
  doc.setFillColor(255, 255, 255);
  doc.circle(
    23,
    paymentY + 12.5,
    8,
    "F"
  );

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    "$",
    23,
    paymentY + 16,
    {
      align: "center",
    }
  );

  doc.setFontSize(7.7);

  const isStripe =
    facture.mode_paiement?.toLowerCase() ===
    "stripe";

  doc.text(
    isStripe
      ? L.paymentOnline
      : L.paymentInterac,
    36,
    paymentY + 10
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  if (!isStripe) {
    doc.text(
      "comptanetquebec@gmail.com",
      36,
      paymentY + 18
    );
  } else {
    doc.text(
      "ComptaNet Québec",
      36,
      paymentY + 18
    );
  }

  // =========================================================
  // STATUT
  // =========================================================

  if (isPaid) {
    doc.setFillColor(...greenBg);
    doc.setTextColor(...green);
  } else {
    doc.setFillColor(...amberBg);
    doc.setTextColor(...amber);
  }

  doc.roundedRect(
    122,
    paymentY,
    78,
    10,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.text(
    isPaid
      ? L.paid
      : L.unpaid,
    161,
    paymentY + 6.5,
    {
      align: "center",
    }
  );

  // =========================================================
  // NUMÉROS TPS / TVQ
  // =========================================================

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  doc.text(
    `${L.gstNumber} : 701807737`,
    14,
    252
  );

  doc.text(
    `${L.qstNumber} : 1227932399`,
    14,
    258
  );

  // =========================================================
  // MERCI DE VOTRE CONFIANCE
  // =========================================================

  doc.setDrawColor(...line);
  doc.line(
    122,
    219,
    122,
    258
  );

  doc.setTextColor(...navy);
  doc.setFont(
    "times",
    "italic"
  );
  doc.setFontSize(15);

  doc.text(
    L.trust,
    161,
    239,
    {
      align: "center",
    }
  );

  doc.setDrawColor(...mediumBlue);
  doc.setLineWidth(0.5);
  doc.line(
    155,
    244,
    167,
    244
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(5.8);
  doc.setCharSpace(1.1);
  doc.setTextColor(...grey);

  doc.text(
    L.service[0],
    161,
    251,
    {
      align: "center",
    }
  );

  doc.text(
    L.service[1],
    161,
    256,
    {
      align: "center",
    }
  );

  doc.setCharSpace(0);

  // =========================================================
  // VAGUES DU BAS
  // =========================================================

  // Vague bleu très pâle
  doc.setFillColor(225, 240, 253);

  doc.lines(
    [
      [30, 7],
      [35, 4],
      [35, -2],
      [35, -5],
      [35, -4],
      [45, 0],
      [0, 16],
      [-180, 0],
    ],
    0,
    H - 16,
    [1, 1],
    "F",
    true
  );

  // Vague intermédiaire
  doc.setFillColor(150, 194, 229);

  doc.lines(
    [
      [38, 7],
      [42, 3],
      [42, -4],
      [40, -5],
      [54, -1],
      [0, 12],
      [-216, 0],
    ],
    0,
    H - 10,
    [1, 1],
    "F",
    true
  );

  // Vague foncée
  doc.setFillColor(79, 137, 184);

  doc.lines(
    [
      [45, 7],
      [50, 2],
      [50, -5],
      [45, -4],
      [26, 0],
      [0, 8],
      [-216, 0],
    ],
    0,
    H - 5,
    [1, 1],
    "F",
    true
  );

  // =========================================================
  // SAUVEGARDE
  // =========================================================

  const numero =
    facture.numero_facture?.replace(
      /[^a-zA-Z0-9-_]/g,
      "_"
    ) || "facture";

  doc.save(`${numero}.pdf`);
}
