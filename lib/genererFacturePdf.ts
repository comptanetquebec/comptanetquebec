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
    tagline: "IMPÔTS  •  TENUE DE LIVRES  •  SERVICES AUX ENTREPRISES",
    partner: ["VOTRE", "PARTENAIRE", "DE CONFIANCE"],
    service: [
      "AU SERVICE DES PARTICULIERS",
      "ET DES ENTREPRISES DU QUÉBEC",
    ],
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
    tagline: "TAXES  •  BOOKKEEPING  •  BUSINESS SERVICES",
    partner: ["YOUR", "TRUSTED", "PARTNER"],
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
    tagline:
      "IMPUESTOS  •  TENEDURÍA DE LIBROS  •  SERVICIOS PARA EMPRESAS",
    partner: ["SU", "SOCIO", "DE CONFIANZA"],
    service: [
      "AL SERVICIO DE PARTICULARES",
      "Y EMPRESAS DE QUÉBEC",
    ],
  },
} as const;

function money(value: number | null | undefined, lang: Lang) {
  const locale =
    lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null, lang: Lang) {
  if (!value) return "—";

  const locale =
    lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger ${url}`));

    img.src = url;
  });
}

function imageToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Impossible de préparer le logo.");
  }

  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL("image/png");
}

export async function genererFacturePdf(
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

  const navy: [number, number, number] = [7, 65, 105];
  const blue: [number, number, number] = [39, 111, 166];
  const lightBlue: [number, number, number] = [236, 246, 253];
  const paleBlue: [number, number, number] = [247, 251, 254];
  const dark: [number, number, number] = [25, 34, 45];
  const grey: [number, number, number] = [78, 91, 105];
  const line: [number, number, number] = [196, 216, 231];

  const green: [number, number, number] = [27, 120, 67];
  const greenBg: [number, number, number] = [226, 247, 234];
  const amber: [number, number, number] = [145, 91, 13];
  const amberBg: [number, number, number] = [255, 246, 210];

  const status = (facture.statut ?? "").toLowerCase();

  const isPaid =
    status === "paid" ||
    status === "payee" ||
    status === "payée";

  const isStripe =
    (facture.mode_paiement ?? "").toLowerCase() === "stripe";

  // =========================================================
  // LOGO — PROPORTIONS CONSERVÉES
  // =========================================================

  try {
    const img = await loadImage("/logo-cq.png");
    const dataUrl = imageToDataUrl(img);

    const maxWidth = 88;
    const maxHeight = 25;

    const ratio = img.naturalWidth / img.naturalHeight;

    let logoWidth = maxWidth;
    let logoHeight = logoWidth / ratio;

    if (logoHeight > maxHeight) {
      logoHeight = maxHeight;
      logoWidth = logoHeight * ratio;
    }

    doc.addImage(
      dataUrl,
      "PNG",
      10,
      7,
      logoWidth,
      logoHeight,
      undefined,
      "FAST"
    );
  } catch (error) {
    console.error(error);

    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("ComptaNet Québec", 12, 20);
  }

  // =========================================================
  // PARTENAIRE
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setCharSpace(1.5);

  L.partner.forEach((text, index) => {
    doc.text(text, 176, 11 + index * 5);
  });

  doc.setCharSpace(0);
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(176, 28, 190, 28);

  // =========================================================
  // SLOGAN
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setCharSpace(1.15);
  doc.text(L.tagline, 11, 39);
  doc.setCharSpace(0);

  // =========================================================
  // COORDONNÉES
  // =========================================================

  doc.setTextColor(...blue);
  doc.setLineWidth(0.5);

  // Pin
  doc.circle(14, 51, 1.8, "S");
  doc.circle(14, 51, 0.5, "F");
  doc.line(14, 52.8, 14, 55);

  // Téléphone
  doc.line(12.5, 63, 15.2, 65.7);
  doc.line(15.2, 65.7, 17, 64);

  // Courriel
  doc.rect(11.3, 71, 6, 4.4, "S");
  doc.line(11.3, 71, 14.3, 73.2);
  doc.line(17.3, 71, 14.3, 73.2);

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);

  doc.text("849, boulevard Pie XII", 22, 50.5);
  doc.text("Québec, Québec  G1X 3T2", 22, 56.5);
  doc.text("581-985-2599", 22, 65);
  doc.text("comptanetquebec@gmail.com", 22, 74);

  // =========================================================
  // FACTURE
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);

  doc.text(L.invoice, 199, 52, {
    align: "right",
  });

  // =========================================================
  // BLOC FACTURE
  // =========================================================

  doc.setFillColor(...paleBlue);
  doc.roundedRect(125, 58, 75, facture.cq_id ? 38 : 31, 3, 3, "F");

  const lx = 131;
  const colonX = 158;
  const valueX = 164;

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);

  doc.text(L.invoiceNo, lx, 67);
  doc.text(":", colonX, 67);

  doc.text(L.date, lx, 75);
  doc.text(":", colonX, 75);

  doc.text(L.for, lx, 83);
  doc.text(":", colonX, 83);

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");

  doc.text(facture.numero_facture || "—", valueX, 67);
  doc.text(formatDate(facture.date_facture, lang), valueX, 75);

  const pour = doc.splitTextToSize(facture.description || "—", 32);
  doc.text(pour.slice(0, 1), valueX, 83);

  if (facture.cq_id) {
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.text(L.clientNo, lx, 91);
    doc.text(":", colonX, 91);

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.text(facture.cq_id, valueX, 91);
  }

  // =========================================================
  // CLIENT
  // =========================================================

  const clientY = 82;

  doc.setFillColor(...lightBlue);
  doc.roundedRect(10, clientY, 94, 43, 3, 3, "F");

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(L.billedTo, 15, clientY + 9);

  doc.setTextColor(...dark);
  doc.setFontSize(10.5);
  doc.text(facture.client_nom || "—", 15, clientY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);

  let clientLine = clientY + 26;

  if (facture.client_adresse) {
    doc.text(facture.client_adresse, 15, clientLine);
    clientLine += 5;
  }

  const city = [
    facture.client_ville,
    facture.client_province,
    facture.client_code_postal,
  ]
    .filter(Boolean)
    .join(", ");

  if (city) {
    doc.text(city, 15, clientLine);
    clientLine += 5;
  }

  if (facture.client_courriel) {
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(facture.client_courriel, 15, clientLine);
  }

  // =========================================================
  // TABLEAU — PLUS COMPACT
  // =========================================================

  const qty = Number(facture.quantite ?? 1);
  const unitPrice = Number(facture.prix_unitaire ?? 0);

  autoTable(doc, {
    startY: 131,

    head: [[
      L.description,
      L.quantity,
      L.unitPrice,
      L.amount,
    ]],

    body: [[
      facture.description || "—",
      qty.toFixed(2).replace(".", ","),
      money(unitPrice, lang),
      money(facture.sous_total ?? qty * unitPrice, lang),
    ]],

    margin: {
      left: 10,
      right: 10,
    },

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 8.7,
      cellPadding: 4,
      textColor: dark,
      lineColor: line,
      lineWidth: 0.25,
      valign: "middle",
    },

    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      minCellHeight: 11,
    },

    bodyStyles: {
      fillColor: [250, 252, 254],
      minCellHeight: 17,
    },

    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 23, halign: "center" },
      2: { cellWidth: 34, halign: "right" },
      3: { cellWidth: 39, halign: "right" },
    },
  });

  // =========================================================
  // TOTAUX — REMONTÉS
  // =========================================================

  const totalLeft = 119;
  const totalRight = 200;
  const totalY = 165;

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);

  doc.text(L.subtotal, totalLeft, totalY);
  doc.text(money(facture.sous_total, lang), totalRight, totalY, {
    align: "right",
  });

  doc.setDrawColor(...line);
  doc.line(totalLeft, totalY + 4, totalRight, totalY + 4);

  doc.text(L.gst, totalLeft, totalY + 12);
  doc.text(money(facture.tps, lang), totalRight, totalY + 12, {
    align: "right",
  });

  doc.line(totalLeft, totalY + 16, totalRight, totalY + 16);

  doc.text(L.qst, totalLeft, totalY + 24);
  doc.text(money(facture.tvq, lang), totalRight, totalY + 24, {
    align: "right",
  });

  // =========================================================
  // TOTAL
  // =========================================================

  doc.setFillColor(...lightBlue);
  doc.roundedRect(114, 195, 86, 15, 2.5, 2.5, "F");

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);

  doc.text(isPaid ? L.totalPaid : L.totalDue, 120, 204.5);

  doc.setFontSize(13);
  doc.text(money(facture.total, lang), 194, 204.5, {
    align: "right",
  });

  // Statut directement sous le total, plus petit
  if (isPaid) {
    doc.setFillColor(...greenBg);
    doc.setTextColor(...green);
  } else {
    doc.setFillColor(...amberBg);
    doc.setTextColor(...amber);
  }

  doc.roundedRect(169, 212, 31, 7, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(isPaid ? L.paid : L.unpaid, 184.5, 216.6, {
    align: "center",
  });

  // =========================================================
  // PAIEMENT — REMONTÉ
  // =========================================================

  const payY = 214;

  doc.setFillColor(...lightBlue);
  doc.roundedRect(10, payY, 103, 27, 3, 3, "F");

  // Icône banque dessinée
  doc.setFillColor(255, 255, 255);
  doc.circle(23, payY + 13.5, 8.5, "F");

  doc.setDrawColor(...navy);
  doc.setFillColor(...navy);
  doc.setLineWidth(0.5);

  // toit
  doc.triangle(
    18,
    payY + 10,
    23,
    payY + 6.5,
    28,
    payY + 10,
    "F"
  );

  // colonnes
  doc.rect(19, payY + 11, 1.3, 6, "F");
  doc.rect(22.3, payY + 11, 1.3, 6, "F");
  doc.rect(25.6, payY + 11, 1.3, 6, "F");

  // base
  doc.rect(18, payY + 17.5, 10, 1.2, "F");

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  doc.text(
    isStripe ? L.paymentOnline : L.paymentInterac,
    36,
    payY + 10
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);

  doc.text(
    isStripe ? "ComptaNet Québec" : "comptanetquebec@gmail.com",
    36,
    payY + 18
  );

  // =========================================================
  // MERCI
  // =========================================================

  doc.setDrawColor(...line);
  doc.line(122, 222, 122, 253);

  doc.setTextColor(...navy);
  doc.setFont("times", "italic");
  doc.setFontSize(15);

  doc.text(L.trust, 161, 232, {
    align: "center",
  });

  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(155, 237, 167, 237);

  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setCharSpace(1);

  doc.text(L.service[0], 161, 245, {
    align: "center",
  });

  doc.text(L.service[1], 161, 250, {
    align: "center",
  });

  doc.setCharSpace(0);

  // =========================================================
  // TPS / TVQ — PLUS LISIBLES
  // =========================================================

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.7);

  doc.text(`${L.gstNumber} : 701807737`, 14, 249);
  doc.text(`${L.qstNumber} : 1227932399`, 14, 256);

  // =========================================================
  // VAGUES PLUS HAUTES
  // =========================================================

  doc.setFillColor(225, 240, 253);

  doc.lines(
    [
      [30, 8],
      [35, 4],
      [38, 0],
      [38, -5],
      [40, -3],
      [35, 0],
      [0, 17],
      [-216, 0],
    ],
    0,
    261,
    [1, 1],
    "F",
    true
  );

  doc.setFillColor(157, 199, 231);

  doc.lines(
    [
      [38, 8],
      [42, 4],
      [45, -1],
      [45, -5],
      [46, -3],
      [0, 13],
      [-216, 0],
    ],
    0,
    268,
    [1, 1],
    "F",
    true
  );

  doc.setFillColor(77, 137, 184);

  doc.lines(
    [
      [45, 7],
      [50, 3],
      [50, -3],
      [45, -4],
      [26, 0],
      [0, 9],
      [-216, 0],
    ],
    0,
    273,
    [1, 1],
    "F",
    true
  );

  // =========================================================
  // ENREGISTRER
  // =========================================================

  const numero =
    facture.numero_facture?.replace(/[^a-zA-Z0-9-_]/g, "_") ||
    "facture";

  doc.save(`${numero}.pdf`);
}
