export type Lang = "fr" | "en" | "es";

export type AIResponse = {
  content: string;
  tags?: string[];
  next_actions?: string[];
};

type Intent =
  | "docs"
  | "t1_ta_t2"
  | "process"
  | "pricing"
  | "deadline"
  | "portal"
  | "contact"
  | "unknown";

type CopyItem = {
  tags?: string[];
  content: string;
  next_actions?: string[];
};

type CopySet = Record<Intent, CopyItem>;

const COPY: Record<Lang, CopySet> = {
  fr: {
    docs: {
      tags: ["documents", "pièces justificatives"],
      content:
        "Les documents requis varient selon votre situation.\n\n" +
        "En général, il faut prévoir vos relevés de revenus, vos pièces justificatives et les documents liés à votre dossier.\n\n" +
        "Pour vous orienter rapidement, choisissez votre type de dossier. Pour transmettre vos documents, utilisez toujours le portail sécurisé.",
      next_actions: [
        "T1 (particulier)",
        "Travailleur autonome",
        "T2 (compagnie incorporée)",
        "Ouvrir un dossier",
      ],
    },

    t1_ta_t2: {
      tags: ["T1", "TA", "T2"],
      content:
        "Voici la différence, en résumé :\n\n" +
        "• T1 : déclaration personnelle\n" +
        "• Travailleur autonome : déclaration personnelle avec revenus et dépenses d’entreprise non incorporée\n" +
        "• T2 : déclaration d’une société incorporée\n\n" +
        "Si vous me dites votre situation, je peux vous orienter vers le bon type de dossier.",
      next_actions: [
        "Je suis salarié(e), étudiant(e) ou retraité(e)",
        "Je suis travailleur autonome",
        "J’ai une compagnie incorporée",
        "Ouvrir un dossier",
      ],
    },

    process: {
      tags: ["processus", "étapes", "portail"],
      content:
        "Le fonctionnement est simple :\n\n" +
        "1. Choisir votre type de dossier\n" +
        "2. Remplir le formulaire en ligne\n" +
        "3. Déposer vos documents dans le portail sécurisé\n" +
        "4. Envoyer le dossier pour traitement\n\n" +
        "Le plus rapide est de commencer directement en ligne.",
      next_actions: [
        "Ouvrir un dossier",
        "Quels documents faut-il préparer ?",
        "Différence entre T1, TA et T2",
      ],
    },

    pricing: {
      tags: ["prix", "tarifs", "paiement"],
      content:
        "Les frais varient selon le type de dossier et la complexité.\n\n" +
        "Un acompte peut être demandé à l’ouverture du dossier, puis le montant final dépend du travail à effectuer.\n\n" +
        "Indiquez votre type de dossier pour une orientation plus précise.",
      next_actions: [
        "T1 (particulier)",
        "Travailleur autonome",
        "T2 (compagnie incorporée)",
        "Ouvrir un dossier",
      ],
    },

    deadline: {
      tags: ["dates limites", "échéances"],
      content:
        "Les échéances varient selon le type de déclaration et selon qu’il s’agit de produire la déclaration ou de payer un solde.\n\n" +
        "Précisez votre type de dossier et si votre question concerne la production ou le paiement.",
      next_actions: [
        "T1",
        "Travailleur autonome",
        "T2",
        "Production de la déclaration",
        "Paiement d’un solde",
      ],
    },

    portal: {
      tags: ["portail sécurisé", "espace client"],
      content:
        "Le portail sécurisé sert à ouvrir votre dossier et à transmettre vos documents de façon simple et sécuritaire.\n\n" +
        "N’envoyez pas d’informations sensibles dans le chat. Pour commencer, utilisez l’espace client.",
      next_actions: [
        "Ouvrir un dossier",
        "Quels documents faut-il préparer ?",
      ],
    },

    contact: {
      tags: ["contact", "orientation"],
      content:
        "Pour aller plus vite, il est recommandé de commencer directement par l’ouverture de votre dossier en ligne.\n\n" +
        "Le portail sécurisé permet de transmettre les informations et documents nécessaires.",
      next_actions: [
        "Ouvrir un dossier",
        "Quels documents faut-il préparer ?",
        "Différence entre T1, TA et T2",
      ],
    },

    unknown: {
      tags: ["aide", "orientation"],
      content:
        "Bonjour 👋\n\n" +
        "Je peux vous aider pour :\n" +
        "• les documents à fournir\n" +
        "• la différence entre T1, travailleur autonome et T2\n" +
        "• le fonctionnement du service\n" +
        "• les tarifs et acomptes\n" +
        "• les échéances générales\n\n" +
        "Pour un traitement rapide, le mieux est d’ouvrir votre dossier en ligne.",
      next_actions: [
        "Ouvrir un dossier",
        "Quels documents faut-il préparer ?",
        "Différence entre T1, TA et T2",
        "Comment fonctionne le service ?",
      ],
    },
  },

  en: {
    docs: {
      tags: ["documents", "supporting documents"],
      content:
        "Required documents depend on your situation.\n\n" +
        "In general, you should prepare your income slips, supporting documents, and any records related to your file.\n\n" +
        "To guide you quickly, choose your file type. To send documents, always use the secure portal.",
      next_actions: [
        "T1 (personal return)",
        "Self-employed",
        "T2 (incorporated company)",
        "Open a file",
      ],
    },

    t1_ta_t2: {
      tags: ["T1", "self-employed", "T2"],
      content:
        "Here is the difference, in short:\n\n" +
        "• T1: personal tax return\n" +
        "• Self-employed: personal return with business income and expenses from an unincorporated business\n" +
        "• T2: tax return for an incorporated company\n\n" +
        "If you tell me your situation, I can guide you to the right file type.",
      next_actions: [
        "I am employed, a student, or retired",
        "I am self-employed",
        "I have an incorporated company",
        "Open a file",
      ],
    },

    process: {
      tags: ["process", "steps", "portal"],
      content:
        "The process is simple:\n\n" +
        "1. Choose your file type\n" +
        "2. Complete the online form\n" +
        "3. Upload your documents in the secure portal\n" +
        "4. Submit the file for processing\n\n" +
        "The fastest option is to start online.",
      next_actions: [
        "Open a file",
        "Which documents do I need?",
        "Difference between T1, self-employed, and T2",
      ],
    },

    pricing: {
      tags: ["pricing", "payment"],
      content:
        "Fees vary depending on the file type and complexity.\n\n" +
        "A deposit may be required to open the file, and the final amount depends on the work involved.\n\n" +
        "Tell me your file type for more precise guidance.",
      next_actions: [
        "T1 (personal return)",
        "Self-employed",
        "T2 (incorporated company)",
        "Open a file",
      ],
    },

    deadline: {
      tags: ["deadlines", "due dates"],
      content:
        "Deadlines vary depending on the type of return and whether your question is about filing or paying a balance.\n\n" +
        "Please specify your file type and whether your question is about filing or payment.",
      next_actions: [
        "T1",
        "Self-employed",
        "T2",
        "Filing the return",
        "Paying a balance",
      ],
    },

    portal: {
      tags: ["secure portal", "client area"],
      content:
        "The secure portal is used to open your file and send documents in a simple and secure way.\n\n" +
        "Do not send sensitive information in the chat. To begin, use the client portal.",
      next_actions: ["Open a file", "Which documents do I need?"],
    },

    contact: {
      tags: ["contact", "guidance"],
      content:
        "To move faster, it is recommended to start by opening your file online.\n\n" +
        "The secure portal allows you to send the required information and documents.",
      next_actions: [
        "Open a file",
        "Which documents do I need?",
        "Difference between T1, self-employed, and T2",
      ],
    },

    unknown: {
      tags: ["help", "guidance"],
      content:
        "Hello 👋\n\n" +
        "I can help with:\n" +
        "• required documents\n" +
        "• the difference between T1, self-employed, and T2\n" +
        "• how the service works\n" +
        "• fees and deposits\n" +
        "• general deadlines\n\n" +
        "For the fastest service, the best option is to open your file online.",
      next_actions: [
        "Open a file",
        "Which documents do I need?",
        "Difference between T1, self-employed, and T2",
        "How does the service work?",
      ],
    },
  },

  es: {
    docs: {
      tags: ["documentos", "justificantes"],
      content:
        "Los documentos requeridos dependen de su situación.\n\n" +
        "En general, debe preparar sus comprobantes de ingresos, documentos justificativos y cualquier documento relacionado con su expediente.\n\n" +
        "Para orientarle rápidamente, elija su tipo de expediente. Para enviar documentos, use siempre el portal seguro.",
      next_actions: [
        "T1 (declaración personal)",
        "Trabajador autónomo",
        "T2 (empresa incorporada)",
        "Abrir expediente",
      ],
    },

    t1_ta_t2: {
      tags: ["T1", "autónomo", "T2"],
      content:
        "Aquí está la diferencia, en resumen:\n\n" +
        "• T1: declaración personal\n" +
        "• Trabajador autónomo: declaración personal con ingresos y gastos de un negocio no incorporado\n" +
        "• T2: declaración de una empresa incorporada\n\n" +
        "Si me dice su situación, puedo orientarle hacia el tipo de expediente correcto.",
      next_actions: [
        "Soy empleado(a), estudiante o jubilado(a)",
        "Soy trabajador autónomo",
        "Tengo una empresa incorporada",
        "Abrir expediente",
      ],
    },

    process: {
      tags: ["proceso", "pasos", "portal"],
      content:
        "El proceso es simple:\n\n" +
        "1. Elegir su tipo de expediente\n" +
        "2. Completar el formulario en línea\n" +
        "3. Subir sus documentos al portal seguro\n" +
        "4. Enviar el expediente para su tratamiento\n\n" +
        "La opción más rápida es comenzar en línea.",
      next_actions: [
        "Abrir expediente",
        "¿Qué documentos necesito?",
        "Diferencia entre T1, autónomo y T2",
      ],
    },

    pricing: {
      tags: ["precios", "pago"],
      content:
        "Los honorarios varían según el tipo de expediente y su complejidad.\n\n" +
        "Puede requerirse un depósito al abrir el expediente, y el monto final depende del trabajo realizado.\n\n" +
        "Indique su tipo de expediente para orientarle mejor.",
      next_actions: [
        "T1 (declaración personal)",
        "Trabajador autónomo",
        "T2 (empresa incorporada)",
        "Abrir expediente",
      ],
    },

    deadline: {
      tags: ["fechas límite", "vencimientos"],
      content:
        "Las fechas límite varían según el tipo de declaración y según si su pregunta es sobre presentar la declaración o pagar un saldo.\n\n" +
        "Indique su tipo de expediente y si su pregunta es sobre presentación o pago.",
      next_actions: [
        "T1",
        "Trabajador autónomo",
        "T2",
        "Presentar la declaración",
        "Pagar un saldo",
      ],
    },

    portal: {
      tags: ["portal seguro", "espacio cliente"],
      content:
        "El portal seguro sirve para abrir su expediente y enviar documentos de forma simple y segura.\n\n" +
        "No envíe información sensible en el chat. Para comenzar, use el portal del cliente.",
      next_actions: [
        "Abrir expediente",
        "¿Qué documentos necesito?",
      ],
    },

    contact: {
      tags: ["contacto", "orientación"],
      content:
        "Para avanzar más rápido, se recomienda comenzar abriendo su expediente en línea.\n\n" +
        "El portal seguro permite enviar la información y los documentos necesarios.",
      next_actions: [
        "Abrir expediente",
        "¿Qué documentos necesito?",
        "Diferencia entre T1, autónomo y T2",
      ],
    },

    unknown: {
      tags: ["ayuda", "orientación"],
      content:
        "Hola 👋\n\n" +
        "Puedo ayudarle con:\n" +
        "• documentos requeridos\n" +
        "• la diferencia entre T1, autónomo y T2\n" +
        "• cómo funciona el servicio\n" +
        "• tarifas y depósitos\n" +
        "• fechas límite generales\n\n" +
        "Para un tratamiento más rápido, lo mejor es abrir su expediente en línea.",
      next_actions: [
        "Abrir expediente",
        "¿Qué documentos necesito?",
        "Diferencia entre T1, autónomo y T2",
        "¿Cómo funciona el servicio?",
      ],
    },
  },
};

function normalizeLang(lang?: string): Lang {
  if (lang === "en") return "en";
  if (lang === "es") return "es";
  return "fr";
}

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();

  if (/(document|documents|documento|documentos|pi[eè]ce|facture|factura|justificatif|justificante|proof|receipt|relev[ée]|slip)/.test(t)) {
    return "docs";
  }

  if (/(t1|t2|travailleur autonome|autonome|self-employed|incorpor|company|corporation|compagnie|sociedad|empresa)/.test(t)) {
    return "t1_ta_t2";
  }

  if (/(comment|how|como|proc[eé]dure|procedure|steps?|pasos?|[eé]tape|d[eé]poser|upload|envoyer|submit|send|dossier|file|portal|portail|funciona|fonctionne)/.test(t)) {
    return "process";
  }

  if (/(prix|tarif|co[uû]t|pricing|price|cost|acompte|deposit|payer|paiement|payment|pago)/.test(t)) {
    return "pricing";
  }

  if (/(date limite|[eé]ch[eé]ance|deadline|due date|retard|late|penalit[eé]|penalty|fecha l[ií]mite|vencimiento)/.test(t)) {
    return "deadline";
  }

  if (/(portail|portal|espace client|client area|portal seguro)/.test(t)) {
    return "portal";
  }

  if (/(contact|appeler|t[eé]l[eé]phone|phone|email|courriel|correo|parler|speak|hablar)/.test(t)) {
    return "contact";
  }

  return "unknown";
}

function safeDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function askAssistantMock(
  userMessage: string,
  lang?: string
): Promise<AIResponse> {
  await safeDelay(300);

  const currentLang = normalizeLang(lang);
  const intent = detectIntent(userMessage);

  return COPY[currentLang][intent] ?? COPY[currentLang].unknown;
}
