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
    service: [
      "SERVING INDIVIDUALS",
      "AND BUSINESSES IN QUÉBEC",
    ],
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

function imageToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Impossible de charger le logo."));
        return;
      }

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      reject(new Error("Impossible de charger /logo-cq.png"));
    };

    img.src = url;
  });
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

  const navy: [number, number, number] = [8, 62, 103];
  const blue: [number, number, number] = [28, 102, 157];
  const mediumBlue: [number, number, number] = [102, 158, 205];
  const lightBlue: [number, number, number] = [237, 246, 253];
  const lighterBlue: [number, number, number] = [247, 251, 254];
  const dark: [number, number, number] = [25, 34, 45];
  const grey: [number, number, number] = [75, 88, 103];
  const line: [number, number, number] = [199, 216, 230];

  const green: [number, number, number] = [27, 120, 67];
  const greenBg: [number, number, number] = [226, 247, 234];

  const amber: [number, number, number] = [145, 91, 13];
  const amberBg: [number, number, number] = [255, 246, 210];

  const statut = (facture.statut ?? "").toLowerCase();

  const isPaid =
    statut === "paid" ||
    statut === "payee" ||
    statut === "payée";

  const isStripe =
    (facture.mode_paiement ?? "").toLowerCase() === "stripe";

  // =========================================================
  // VRAI LOGO COMPTANET
  // =========================================================

  try {
    const logo = await imageToDataUrl("/logo-cq.png");

    // Logo complet CQ + ComptaNet Québec
    doc.addImage(
      logo,
      "PNG",
      10,
      8,
      91,
      30,
      undefined,
      "FAST"
    );
  } catch (error) {
    console.error("Logo ComptaNet :", error);

    // Secours seulement si l'image ne charge pas
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ComptaNet", 12, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Québec", 12, 28);
  }

  // =========================================================
  // PARTENAIRE DE CONFIANCE
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setCharSpace(1.4);

  let py = 12;

  for (const text of L.partner) {
    doc.text(text, 177, py);
    py += 5;
  }

  doc.setCharSpace(0);

  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(177, 29, 190, 29);

  // =========================================================
  // SLOGAN
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setCharSpace(1.15);

  doc.text(L.tagline, 11, 42);

  doc.setCharSpace(0);

  // =========================================================
  // COORDONNÉES COMPTANET
  // =========================================================

  doc.setTextColor(...blue);
  doc.setFont("helvetica", "bold");

  // emplacement
  doc.circle(14, 54, 1.8, "S");
  doc.circle(14, 54, 0.55, "F");
  doc.line(14, 55.8, 14, 58);

  // téléphone
  doc.setLineWidth(0.8);
  doc.line(12.5, 65.5, 15.3, 68.2);
  doc.line(15.3, 68.2, 17.2, 66.3);

  // courriel
  doc.setLineWidth(0.4);
  doc.rect(11.3, 73, 6, 4.5, "S");
  doc.line(11.3, 73, 14.3, 75.3);
  doc.line(17.3, 73, 14.3, 75.3);

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);

  doc.text("849, boulevard Pie XII", 22, 53.5);
  doc.text("Québec, Québec  G1X 3T2", 22, 59.5);
  doc.text("581-985-2599", 22, 67.5);
  doc.text("comptanetquebec@gmail.com", 22, 76);

  // =========================================================
  // FACTURE
  // =========================================================

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);

  doc.text(L.invoice, 199, 53, {
    align: "right",
  });

  // =========================================================
  // INFOS FACTURE
  // =========================================================

  const invoiceBoxY = 59;
  const invoiceBoxHeight = facture.cq_id ? 39 : 32;

  doc.setFillColor(...lighterBlue);

  doc.roundedRect(
    125,
    invoiceBoxY,
    75,
    invoiceBoxHeight,
    3,
    3,
    "F"
  );

  const lx = 131;
  const cx = 158;
  const vx = 165;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.7);
  doc.setTextColor(...navy);

  doc.text(L.invoiceNo, lx, 68);
  doc.text(":", cx, 68);

  doc.text(L.date, lx, 76);
  doc.text(":", cx, 76);

  doc.text(L.for, lx, 84);
  doc.text(":", cx, 84);

  if (facture.cq_id) {
    doc.text(L.clientNo, lx, 92);
    doc.text(":", cx, 92);
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...dark);

  doc.text(
    facture.numero_facture || "—",
    vx,
    68
  );

  doc.text(
    formatDate(facture.date_facture, lang),
    vx,
    76
  );

  // POUR : on affiche le service sans couper n'importe comment
  const pourText = facture.description || "—";

  const pourLines = doc.splitTextToSize(
    pourText,
    32
  );

  doc.text(
    pourLines.slice(0, 2),
    vx,
    84
  );

  if (facture.cq_id) {
    doc.text(
      facture.cq_id,
      vx,
      92
    );
  }

  // =========================================================
  // CLIENT
  // =========================================================

  const clientY = 84;

  doc.setFillColor(...lightBlue);

  doc.roundedRect(
    10,
    clientY,
    94,
    40,
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
    clientY + 9
  );

  doc.setTextColor(...dark);
  doc.setFontSize(10.5);

  doc.text(
    facture.client_nom || "—",
    15,
    clientY + 18
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);

  let y = clientY + 26;

  if (facture.client_adresse) {
    doc.text(
      facture.client_adresse,
      15,
      y
    );
    y += 5;
  }

  const cityLine = [
    facture.client_ville,
    facture.client_province,
    facture.client_code_postal,
  ]
    .filter(Boolean)
    .join(", ");

  if (cityLine) {
    doc.text(cityLine, 15, y);
    y += 5;
  }

  // CORRECTION : courriel cliente
  if (facture.client_courriel) {
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    doc.text(
      facture.client_courriel,
      15,
      y
    );
  }

  // =========================================================
  // TABLEAU
  // =========================================================

  const qty = Number(facture.quantite ?? 1);
  const price = Number(facture.prix_unitaire ?? 0);

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
      money(price, lang),
      money(
        facture.sous_total ?? qty * price,
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
      lineColor: [145, 185, 216],
    },

    bodyStyles: {
      fillColor: [250, 252, 254],
      minCellHeight: 18,
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

  const totalsLeft = 119;
  const totalsRight = 200;
  const totalsY = 169;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.7);
  doc.setTextColor(...dark);

  doc.text(L.subtotal, totalsLeft, totalsY);

  doc.text(
    money(facture.sous_total, lang),
    totalsRight,
    totalsY,
    { align: "right" }
  );

  doc.setDrawColor(...line);
  doc.line(
    totalsLeft,
    totalsY + 4,
    totalsRight,
    totalsY + 4
  );

  doc.text(
    L.gst,
    totalsLeft,
    totalsY + 12
  );

  doc.text(
    money(facture.tps, lang),
    totalsRight,
    totalsY + 12,
    { align: "right" }
  );

  doc.line(
    totalsLeft,
    totalsY + 16,
    totalsRight,
    totalsY + 16
  );

  doc.text(
    L.qst,
    totalsLeft,
    totalsY + 24
  );

  doc.text(
    money(facture.tvq, lang),
    totalsRight,
    totalsY + 24,
    { align: "right" }
  );

  // =========================================================
  // TOTAL + STATUT ENSEMBLE
  // =========================================================

  doc.setFillColor(...lightBlue);

  doc.roundedRect(
    114,
    199,
    86,
    16,
    2.5,
    2.5,
    "F"
  );

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);

  doc.text(
    isPaid ? L.totalPaid : L.totalDue,
    120,
    209
  );

  doc.setFontSize(13);

  doc.text(
    money(facture.total, lang),
    194,
    209,
    {
      align: "right",
    }
  );

  // Petit statut intégré au total
  if (isPaid) {
    doc.setFillColor(...greenBg);
    doc.setTextColor(...green);
  } else {
    doc.setFillColor(...amberBg);
    doc.setTextColor(...amber);
  }

  doc.roundedRect(
    164,
    216.5,
    36,
    8,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  doc.text(
    isPaid ? L.paid : L.unpaid,
    182,
    221.7,
    {
      align: "center",
    }
  );

  // =========================================================
  // PAIEMENT INTERAC / STRIPE
  // =========================================================

  const paymentY = 221;

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

  // Icône ronde
  doc.setFillColor(255, 255, 255);
  doc.circle(
    23,
    paymentY + 12.5,
    8,
    "F"
  );

  // Symbole simple de banque
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    "$",
    23,
    paymentY + 15.5,
    {
      align: "center",
    }
  );

  doc.setFontSize(7.5);

  doc.text(
    isStripe
      ? L.paymentOnline
      : L.paymentInterac,
    36,
    paymentY + 10
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);

  doc.text(
    isStripe
      ? "ComptaNet Québec"
      : "comptanetquebec@gmail.com",
    36,
    paymentY + 18
  );

  // =========================================================
  // MERCI - PLUS DE STATUT ICI
  // =========================================================

  doc.setDrawColor(...line);
  doc.setLineWidth(0.4);
  doc.line(
    122,
    226,
    122,
    257
  );

  doc.setTextColor(...navy);
  doc.setFont("times", "italic");
  doc.setFontSize(14);

  doc.text(
    L.trust,
    161,
    237,
    {
      align: "center",
    }
  );

  doc.setDrawColor(...mediumBlue);
  doc.setLineWidth(0.5);
  doc.line(
    155,
    242,
    167,
    242
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setCharSpace(1);
  doc.setTextColor(...grey);

  doc.text(
    L.service[0],
    161,
    250,
    {
      align: "center",
    }
  );

  doc.text(
    L.service[1],
    161,
    255,
    {
      align: "center",
    }
  );

  doc.setCharSpace(0);

  // =========================================================
  // NUMÉROS TPS / TVQ
  // =========================================================

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);

  doc.text(
    `${L.gstNumber} : 701807737`,
    14,
    253
  );

  doc.text(
    `${L.qstNumber} : 1227932399`,
    14,
    259
  );

  // =========================================================
  // VAGUES
  // =========================================================

  // Vague pâle
  doc.setFillColor(225, 240, 253);

  doc.lines(
    [
      [28, 7],
      [35, 4],
      [38, -1],
      [37, -4],
      [38, -3],
      [40, 0],
      [0, 15],
      [-216, 0],
    ],
    0,
    264,
    [1, 1],
    "F",
    true
  );

  // Vague moyenne
  doc.setFillColor(155, 198, 231);

  doc.lines(
    [
      [35, 7],
      [40, 4],
      [45, -2],
      [43, -5],
      [53, -1],
      [0, 11],
      [-216, 0],
    ],
    0,
    270,
    [1, 1],
    "F",
    true
  );

  // Vague foncée
  doc.setFillColor(82, 142, 190);

  doc.lines(
    [
      [45, 6],
      [50, 3],
      [50, -3],
      [45, -4],
      [26, 0],
      [0, 7],
      [-216, 0],
    ],
    0,
    274,
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
