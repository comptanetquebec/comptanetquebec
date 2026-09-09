import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type FacturePdfLigne = {
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
};

export type FacturePdf = {
  numero_facture: string | null;
  cq_id?: string | null;

  client_nom: string;
  client_courriel?: string | null;
  client_adresse?: string | null;
  client_ville?: string | null;
  client_province?: string | null;
  client_code_postal?: string | null;

  // Ancien format conservé pour compatibilité
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

  // Nouveau format
  lignes?: FacturePdfLigne[];
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
    paymentStripe: "PAIEMENT EN LIGNE",
    paymentCash: "PAIEMENT COMPTANT",
    paymentOther: "PAIEMENT",

    paid: "PAYÉE",
    unpaid: "À PAYER",

    gstNumber: "N° d'inscription TPS",
    qstNumber: "N° d'inscription TVQ",

    trust: "Merci de votre confiance !",

    tagline:
      "IMPÔTS  •  TENUE DE LIVRES  •  SERVICES AUX ENTREPRISES",

    partner: [
      "VOTRE",
      "PARTENAIRE",
      "DE CONFIANCE",
    ],

    service: [
      "AU SERVICE DES PARTICULIERS",
      "ET DES ENTREPRISES DU QUÉBEC",
    ],

    continued: "SUITE",
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
    paymentStripe: "ONLINE PAYMENT",
    paymentCash: "CASH PAYMENT",
    paymentOther: "PAYMENT",

    paid: "PAID",
    unpaid: "AMOUNT DUE",

    gstNumber: "GST registration no.",
    qstNumber: "QST registration no.",

    trust: "Thank you for your trust!",

    tagline:
      "TAXES  •  BOOKKEEPING  •  BUSINESS SERVICES",

    partner: [
      "YOUR",
      "TRUSTED",
      "PARTNER",
    ],

    service: [
      "SERVING INDIVIDUALS",
      "AND BUSINESSES IN QUÉBEC",
    ],

    continued: "CONTINUED",
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

    paymentInterac:
      "PAGO POR TRANSFERENCIA INTERAC",
    paymentStripe: "PAGO EN LÍNEA",
    paymentCash: "PAGO EN EFECTIVO",
    paymentOther: "PAGO",

    paid: "PAGADA",
    unpaid: "POR PAGAR",

    gstNumber: "N.º de registro GST/TPS",
    qstNumber: "N.º de registro QST/TVQ",

    trust: "¡Gracias por su confianza!",

    tagline:
      "IMPUESTOS  •  TENEDURÍA DE LIBROS  •  SERVICIOS PARA EMPRESAS",

    partner: [
      "SU",
      "SOCIO",
      "DE CONFIANZA",
    ],

    service: [
      "AL SERVICIO DE PARTICULARES",
      "Y EMPRESAS DE QUÉBEC",
    ],

    continued: "CONTINUACIÓN",
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

function formatQty(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value
    .toFixed(2)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

function formatDate(
  value: string | null,
  lang: Lang
) {
  if (!value) {
    return "—";
  }

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
  }).format(
    new Date(`${value}T12:00:00`)
  );
}

function loadImage(
  url: string
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const img = new Image();

      img.onload = () =>
        resolve(img);

      img.onerror = () =>
        reject(
          new Error(
            `Impossible de charger ${url}`
          )
        );

      img.src = url;
    }
  );
}

/*
  Enlève automatiquement les grands espaces
  blancs autour du logo.

  C'est important parce que logo-cq.png est
  très large et pouvait paraître minuscule
  même avec une grande largeur dans le PDF.
*/
function cropImageWhitespace(
  img: HTMLImageElement
): {
  dataUrl: string;
  width: number;
  height: number;
} {
  const source =
    document.createElement("canvas");

  source.width =
    img.naturalWidth;

  source.height =
    img.naturalHeight;

  const ctx =
    source.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Impossible de préparer le logo."
    );
  }

  ctx.drawImage(
    img,
    0,
    0
  );

  const imageData =
    ctx.getImageData(
      0,
      0,
      source.width,
      source.height
    );

  const data =
    imageData.data;

  let minX =
    source.width;

  let minY =
    source.height;

  let maxX = -1;
  let maxY = -1;

  /*
    On considère comme espace vide :
    - transparent
    - ou presque blanc
  */
  for (
    let y = 0;
    y < source.height;
    y++
  ) {
    for (
      let x = 0;
      x < source.width;
      x++
    ) {
      const i =
        (y * source.width + x) *
        4;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const transparent =
        a < 15;

      const almostWhite =
        r > 247 &&
        g > 247 &&
        b > 247;

      if (
        !transparent &&
        !almostWhite
      ) {
        minX =
          Math.min(minX, x);

        minY =
          Math.min(minY, y);

        maxX =
          Math.max(maxX, x);

        maxY =
          Math.max(maxY, y);
      }
    }
  }

  /*
    Si rien n'est trouvé,
    on retourne l'image originale.
  */
  if (
    maxX < minX ||
    maxY < minY
  ) {
    return {
      dataUrl:
        source.toDataURL(
          "image/png"
        ),

      width:
        source.width,

      height:
        source.height,
    };
  }

  const padding = 4;

  minX =
    Math.max(
      0,
      minX - padding
    );

  minY =
    Math.max(
      0,
      minY - padding
    );

  maxX =
    Math.min(
      source.width - 1,
      maxX + padding
    );

  maxY =
    Math.min(
      source.height - 1,
      maxY + padding
    );

  const width =
    maxX - minX + 1;

  const height =
    maxY - minY + 1;

  const cropped =
    document.createElement(
      "canvas"
    );

  cropped.width = width;
  cropped.height = height;

  const croppedCtx =
    cropped.getContext("2d");

  if (!croppedCtx) {
    throw new Error(
      "Impossible de préparer le logo."
    );
  }

  croppedCtx.drawImage(
    source,
    minX,
    minY,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return {
    dataUrl:
      cropped.toDataURL(
        "image/png"
      ),

    width,
    height,
  };
}

function normalizeLines(
  facture: FacturePdf
): FacturePdfLigne[] {
  if (
    facture.lignes &&
    facture.lignes.length > 0
  ) {
    return facture.lignes.map(
      (ligne) => ({
        description:
          ligne.description ||
          "—",

        quantite:
          Number(
            ligne.quantite ?? 1
          ),

        prix_unitaire:
          Number(
            ligne.prix_unitaire ??
              0
          ),

        montant:
          Number(
            ligne.montant ?? 0
          ),
      })
    );
  }

  const qty =
    Number(
      facture.quantite ?? 1
    );

  const unit =
    Number(
      facture.prix_unitaire ?? 0
    );

  return [
    {
      description:
        facture.description ||
        "—",

      quantite: qty,

      prix_unitaire: unit,

      montant:
        Number(
          facture.sous_total ??
            qty * unit
        ),
    },
  ];
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

  const navy:
    [number, number, number] =
      [7, 65, 105];

  const blue:
    [number, number, number] =
      [39, 111, 166];

  const lightBlue:
    [number, number, number] =
      [236, 246, 253];

  const paleBlue:
    [number, number, number] =
      [247, 251, 254];

  const dark:
    [number, number, number] =
      [25, 34, 45];

  const grey:
    [number, number, number] =
      [78, 91, 105];

  const line:
    [number, number, number] =
      [196, 216, 231];

  const green:
    [number, number, number] =
      [27, 120, 67];

  const greenBg:
    [number, number, number] =
      [226, 247, 234];

  const amber:
    [number, number, number] =
      [145, 91, 13];

  const amberBg:
    [number, number, number] =
      [255, 246, 210];

  const negative:
    [number, number, number] =
      [185, 28, 28];

  const status =
    (
      facture.statut ?? ""
    ).toLowerCase();

  const isPaid =
    status === "paid" ||
    status === "payee" ||
    status === "payée";

  const paymentMethod =
    (
      facture.mode_paiement ??
      ""
    ).toLowerCase();

  const lignes =
    normalizeLines(facture);

  /*
    Pour la première page, on garde volontairement
    un maximum de 5 lignes.

    Cela empêche les totaux et le paiement
    de descendre vers le bas de la page.
  */
  const MAX_FIRST_PAGE = 5;

  const firstPageLines =
    lignes.slice(
      0,
      MAX_FIRST_PAGE
    );

  const remainingLines =
    lignes.slice(
      MAX_FIRST_PAGE
    );

  // =========================================================
  // OUTILS DE DESSIN
  // =========================================================

  async function drawLogo() {
    try {
      const img =
        await loadImage(
          "/logo-cq.png"
        );

      const cropped =
        cropImageWhitespace(
          img
        );

      const ratio =
        cropped.width /
        cropped.height;

      /*
        Logo volontairement plus gros.
      */
      const maxWidth = 103;
      const maxHeight = 28;

      let logoWidth =
        maxWidth;

      let logoHeight =
        logoWidth / ratio;

      if (
        logoHeight >
        maxHeight
      ) {
        logoHeight =
          maxHeight;

        logoWidth =
          logoHeight *
          ratio;
      }

      doc.addImage(
        cropped.dataUrl,
        "PNG",
        10,
        6,
        logoWidth,
        logoHeight,
        undefined,
        "FAST"
      );
    } catch (error) {
      console.error(error);

      doc.setTextColor(
        ...navy
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(19);

      doc.text(
        "ComptaNet Québec",
        12,
        20
      );
    }
  }

  function drawPartner() {
    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(6.5);
    doc.setCharSpace(1.5);

    L.partner.forEach(
      (
        text,
        index
      ) => {
        doc.text(
          text,
          176,
          11 +
            index * 5
        );
      }
    );

    doc.setCharSpace(0);

    doc.setDrawColor(
      ...blue
    );

    doc.setLineWidth(0.5);

    doc.line(
      176,
      28,
      190,
      28
    );
  }

  function drawTagline() {
    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(6.8);
    doc.setCharSpace(1.1);

    doc.text(
      L.tagline,
      11,
      39
    );

    doc.setCharSpace(0);
  }

  /*
    Icônes volontairement simples et propres.
    On évite les anciens dessins improvisés.
  */
  function drawContact() {
    doc.setDrawColor(
      ...blue
    );

    doc.setFillColor(
      ...blue
    );

    doc.setLineWidth(0.45);

    // Adresse : petit marqueur propre
    doc.circle(
      14,
      50,
      2.1,
      "S"
    );

    doc.circle(
      14,
      50,
      0.65,
      "F"
    );

    doc.triangle(
      12.6,
      51.2,
      15.4,
      51.2,
      14,
      54,
      "F"
    );

    // Téléphone : combiné simplifié
    doc.setLineWidth(1);

    doc.line(
      12,
      62,
      13.4,
      64
    );

    doc.line(
      13.4,
      64,
      15.6,
      65.5
    );

    doc.line(
      15.6,
      65.5,
      17,
      64
    );

    // Courriel
    doc.setLineWidth(0.45);

    doc.rect(
      11,
      71,
      7,
      5,
      "S"
    );

    doc.line(
      11,
      71,
      14.5,
      73.7
    );

    doc.line(
      18,
      71,
      14.5,
      73.7
    );

    doc.setTextColor(
      ...dark
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8.4);

    doc.text(
      "849, boulevard Pie XII",
      22,
      49.5
    );

    doc.text(
      "Québec, Québec  G1X 3T2",
      22,
      55.5
    );

    doc.text(
      "581-985-2599",
      22,
      64.5
    );

    doc.text(
      "comptanetquebec@gmail.com",
      22,
      74
    );
  }

  function drawInvoiceHeader() {
    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(28);

    doc.text(
      L.invoice,
      199,
      52,
      {
        align: "right",
      }
    );

    const blockHeight =
      facture.cq_id
        ? 38
        : 31;

    doc.setFillColor(
      ...paleBlue
    );

    doc.roundedRect(
      125,
      58,
      75,
      blockHeight,
      3,
      3,
      "F"
    );

    const lx = 131;
    const colonX = 158;
    const valueX = 164;

    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7.6);

    doc.text(
      L.invoiceNo,
      lx,
      67
    );

    doc.text(
      ":",
      colonX,
      67
    );

    doc.text(
      L.date,
      lx,
      75
    );

    doc.text(
      ":",
      colonX,
      75
    );

    doc.text(
      L.for,
      lx,
      83
    );

    doc.text(
      ":",
      colonX,
      83
    );

    doc.setTextColor(
      ...dark
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      facture.numero_facture ||
        "—",
      valueX,
      67
    );

    doc.text(
      formatDate(
        facture.date_facture,
        lang
      ),
      valueX,
      75
    );

    /*
      POUR :
      on utilise la première description,
      mais sans afficher une énorme phrase.
    */
    const firstDescription =
      lignes[0]
        ?.description ||
      facture.description ||
      "—";

    const pour =
      doc.splitTextToSize(
        firstDescription,
        32
      );

    doc.text(
      pour.slice(0, 1),
      valueX,
      83
    );

    if (
      facture.cq_id
    ) {
      doc.setTextColor(
        ...navy
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        L.clientNo,
        lx,
        91
      );

      doc.text(
        ":",
        colonX,
        91
      );

      doc.setTextColor(
        ...dark
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        facture.cq_id,
        valueX,
        91
      );
    }
  }

  function drawClient() {
    const clientY = 82;

    doc.setFillColor(
      ...lightBlue
    );

    doc.roundedRect(
      10,
      clientY,
      94,
      43,
      3,
      3,
      "F"
    );

    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(8.5);

    doc.text(
      L.billedTo,
      15,
      clientY + 9
    );

    doc.setTextColor(
      ...dark
    );

    doc.setFontSize(10.5);

    doc.text(
      facture.client_nom ||
        "—",
      15,
      clientY + 18
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.8);

    let clientLine =
      clientY + 26;

    if (
      facture.client_adresse
    ) {
      doc.text(
        facture.client_adresse,
        15,
        clientLine
      );

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
      doc.text(
        city,
        15,
        clientLine
      );

      clientLine += 5;
    }

    if (
      facture.client_courriel
    ) {
      doc.setTextColor(
        ...navy
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(7);

      doc.text(
        facture.client_courriel,
        15,
        clientLine
      );
    }
  }

  function drawTable(
    tableLines: FacturePdfLigne[],
    startY: number
  ) {
    autoTable(doc, {
      startY,

      head: [
        [
          L.description,
          L.quantity,
          L.unitPrice,
          L.amount,
        ],
      ],

      body:
        tableLines.map(
          (ligne) => [
            ligne.description ||
              "—",

            formatQty(
              Number(
                ligne.quantite
              )
            ),

            money(
              ligne.prix_unitaire,
              lang
            ),

            money(
              ligne.montant,
              lang
            ),
          ]
        ),

      margin: {
        left: 10,
        right: 10,
      },

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.8,
        textColor: dark,
        lineColor: line,
        lineWidth: 0.25,
        valign: "middle",
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: navy,
        textColor: [
          255,
          255,
          255,
        ],
        fontStyle: "bold",
        minCellHeight: 10,
      },

      bodyStyles: {
        fillColor: [
          250,
          252,
          254,
        ],
        minCellHeight: 8,
      },

      alternateRowStyles: {
        fillColor: [
          244,
          249,
          252,
        ],
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

      didParseCell: (
        data
      ) => {
        if (
          data.section !==
            "body" ||
          (
            data.column
              .index !== 2 &&
            data.column
              .index !== 3
          )
        ) {
          return;
        }

        const row =
          tableLines[
            data.row.index
          ];

        if (!row) {
          return;
        }

        const value =
          data.column.index ===
          2
            ? row.prix_unitaire
            : row.montant;

        if (
          Number(value) < 0
        ) {
          data.cell.styles.textColor =
            negative;
        }
      },
    });
  }

  function drawTotals() {
    /*
      POSITION FIXE.

      Peu importe qu'il y ait 1, 2, 3, 4 ou 5
      lignes, ces totaux restent ici.
    */
    const left = 119;
    const right = 200;
    const y = 174;

    doc.setTextColor(
      ...dark
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8.6);

    doc.text(
      L.subtotal,
      left,
      y
    );

    doc.text(
      money(
        facture.sous_total,
        lang
      ),
      right,
      y,
      {
        align: "right",
      }
    );

    doc.setDrawColor(
      ...line
    );

    doc.line(
      left,
      y + 4,
      right,
      y + 4
    );

    doc.text(
      L.gst,
      left,
      y + 11
    );

    doc.text(
      money(
        facture.tps,
        lang
      ),
      right,
      y + 11,
      {
        align: "right",
      }
    );

    doc.line(
      left,
      y + 15,
      right,
      y + 15
    );

    doc.text(
      L.qst,
      left,
      y + 22
    );

    doc.text(
      money(
        facture.tvq,
        lang
      ),
      right,
      y + 22,
      {
        align: "right",
      }
    );

    doc.setFillColor(
      ...lightBlue
    );

    doc.roundedRect(
      114,
      201,
      86,
      15,
      2.5,
      2.5,
      "F"
    );

    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9.5);

    doc.text(
      isPaid
        ? L.totalPaid
        : L.totalDue,
      120,
      210.5
    );

    doc.setFontSize(13);

    doc.text(
      money(
        facture.total,
        lang
      ),
      194,
      210.5,
      {
        align: "right",
      }
    );

    if (isPaid) {
      doc.setFillColor(
        ...greenBg
      );

      doc.setTextColor(
        ...green
      );
    } else {
      doc.setFillColor(
        ...amberBg
      );

      doc.setTextColor(
        ...amber
      );
    }

    doc.roundedRect(
      169,
      218,
      31,
      7,
      2.5,
      2.5,
      "F"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(6.5);

    doc.text(
      isPaid
        ? L.paid
        : L.unpaid,
      184.5,
      222.6,
      {
        align: "center",
      }
    );
  }

  function paymentTitle() {
    if (
      paymentMethod ===
      "stripe"
    ) {
      return L.paymentStripe;
    }

    if (
      paymentMethod ===
      "cash"
    ) {
      return L.paymentCash;
    }

    if (
      paymentMethod ===
      "other"
    ) {
      return L.paymentOther;
    }

    return L.paymentInterac;
  }

  function paymentValue() {
    if (
      paymentMethod ===
      "stripe"
    ) {
      return "ComptaNet Québec";
    }

    if (
      paymentMethod ===
      "cash"
    ) {
      return "ComptaNet Québec";
    }

    if (
      paymentMethod ===
      "other"
    ) {
      return "ComptaNet Québec";
    }

    return "comptanetquebec@gmail.com";
  }

  function drawPayment() {
    /*
      Paiement à gauche.
      Totaux restent à droite.
    */
    const payY = 215;

    doc.setFillColor(
      ...lightBlue
    );

    doc.roundedRect(
      10,
      payY,
      100,
      27,
      3,
      3,
      "F"
    );

    // Cercle blanc
    doc.setFillColor(
      255,
      255,
      255
    );

    doc.circle(
      23,
      payY + 13.5,
      8.5,
      "F"
    );

    /*
      Icône banque propre
    */
    doc.setFillColor(
      ...navy
    );

    doc.setDrawColor(
      ...navy
    );

    doc.triangle(
      17.5,
      payY + 10,
      23,
      payY + 6,
      28.5,
      payY + 10,
      "F"
    );

    doc.rect(
      18.5,
      payY + 10.5,
      9,
      1,
      "F"
    );

    doc.rect(
      19,
      payY + 12,
      1.3,
      5.5,
      "F"
    );

    doc.rect(
      22.35,
      payY + 12,
      1.3,
      5.5,
      "F"
    );

    doc.rect(
      25.7,
      payY + 12,
      1.3,
      5.5,
      "F"
    );

    doc.rect(
      18,
      payY + 18,
      10,
      1.2,
      "F"
    );

    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7.1);

    doc.text(
      paymentTitle(),
      36,
      payY + 10
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.5);

    doc.text(
      paymentValue(),
      36,
      payY + 18
    );
  }

  function drawTaxNumbers() {
    doc.setTextColor(
      ...dark
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.4);

    doc.text(
      `${L.gstNumber} : 701807737`,
      14,
      250
    );

    doc.text(
      `${L.qstNumber} : 1227932399`,
      14,
      257
    );
  }

  function drawThankYou() {
    doc.setDrawColor(
      ...line
    );

    doc.line(
      118,
      228,
      118,
      256
    );

    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "times",
      "italic"
    );

    doc.setFontSize(14);

    doc.text(
      L.trust,
      160,
      237,
      {
        align: "center",
      }
    );

    doc.setDrawColor(
      ...blue
    );

    doc.setLineWidth(0.5);

    doc.line(
      154,
      242,
      166,
      242
    );

    doc.setTextColor(
      ...grey
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(5.4);
    doc.setCharSpace(0.9);

    doc.text(
      L.service[0],
      160,
      250,
      {
        align: "center",
      }
    );

    doc.text(
      L.service[1],
      160,
      255,
      {
        align: "center",
      }
    );

    doc.setCharSpace(0);
  }

  function drawWaves() {
    doc.setFillColor(
      225,
      240,
      253
    );

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

    doc.setFillColor(
      157,
      199,
      231
    );

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

    doc.setFillColor(
      77,
      137,
      184
    );

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
  }

  async function drawFirstPage() {
    await drawLogo();

    drawPartner();
    drawTagline();
    drawContact();
    drawInvoiceHeader();
    drawClient();

    /*
      Tableau commence toujours ici.
      Il a une zone réservée jusqu'aux totaux.
    */
    drawTable(
      firstPageLines,
      131
    );

    drawTotals();
    drawPayment();
    drawTaxNumbers();
    drawThankYou();
    drawWaves();
  }

  function drawContinuationPage(
    pageLines: FacturePdfLigne[],
    pageNumber: number,
    finalPage: boolean
  ) {
    doc.addPage(
      "letter",
      "portrait"
    );

    /*
      En-tête simple des pages suivantes.
    */
    doc.setTextColor(
      ...navy
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(18);

    doc.text(
      "ComptaNet Québec",
      12,
      18
    );

    doc.setFontSize(16);

    doc.text(
      `${L.invoice} ${
        facture.numero_facture ??
        ""
      }`,
      200,
      18,
      {
        align: "right",
      }
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      ...grey
    );

    doc.text(
      `${L.continued} — ${pageNumber}`,
      200,
      25,
      {
        align: "right",
      }
    );

    drawTable(
      pageLines,
      35
    );

    /*
      Si c'est la dernière page supplémentaire,
      on rappelle le total en bas.
    */
    if (finalPage) {
      doc.setFillColor(
        ...lightBlue
      );

      doc.roundedRect(
        114,
        220,
        86,
        15,
        2.5,
        2.5,
        "F"
      );

      doc.setTextColor(
        ...navy
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(9.5);

      doc.text(
        isPaid
          ? L.totalPaid
          : L.totalDue,
        120,
        229.5
      );

      doc.setFontSize(13);

      doc.text(
        money(
          facture.total,
          lang
        ),
        194,
        229.5,
        {
          align: "right",
        }
      );
    }

    drawWaves();
  }

  // =========================================================
  // PAGE 1
  // =========================================================

  await drawFirstPage();

  // =========================================================
  // PAGES SUPPLÉMENTAIRES
  // =========================================================

  /*
    Cas normal ComptaNet :
    1 à 5 lignes = une seule page.

    Au-delà de 5 lignes, les lignes supplémentaires
    sont placées sur une nouvelle page au lieu de
    faire descendre les totaux.
  */

  if (
    remainingLines.length >
    0
  ) {
    const LINES_PER_EXTRA_PAGE =
      14;

    const pages:
      FacturePdfLigne[][] =
        [];

    for (
      let i = 0;
      i <
      remainingLines.length;
      i +=
        LINES_PER_EXTRA_PAGE
    ) {
      pages.push(
        remainingLines.slice(
          i,
          i +
            LINES_PER_EXTRA_PAGE
        )
      );
    }

    pages.forEach(
      (
        pageLines,
        index
      ) => {
        drawContinuationPage(
          pageLines,
          index + 2,
          index ===
            pages.length - 1
        );
      }
    );
  }

  // =========================================================
  // ENREGISTRER
  // =========================================================

  const numero =
    facture.numero_facture
      ?.replace(
        /[^a-zA-Z0-9-_]/g,
        "_"
      ) ||
    "facture";

  doc.save(
    `${numero}.pdf`
  );
}
