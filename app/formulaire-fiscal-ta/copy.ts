// app/formulaire-fiscal-ta/copy.ts

export const COPY = {
  fr: {
    brand: "ComptaNet Québec",
    formName: "Formulaire fiscal — Travailleur autonome (TA)",
    disconnect: "Se déconnecter",
    intro:
      "Merci de remplir ce formulaire après avoir créé votre compte. Nous utilisons ces informations pour préparer vos déclarations d’impôt au Canada (fédéral) et, si applicable, au Québec.",

    // messages / CTA
    fixBeforeContinue: "À corriger avant de continuer",
    missingRequired:
      "❌ Certaines informations obligatoires manquent. Corrigez la liste ci-dessous.",
    preparing: "⏳ Préparation du dossier…",
    redirecting: "✅ Redirection…",
    continue: "Continuer →",
    nextStepDocs: "Étape suivante : dépôt des documents.",
    completeToContinue: "Complétez les champs obligatoires pour continuer.",

    // documents (état)
    docs: {
      loading: "Chargement des documents…",
      already: (n: number) => `${n} document(s) déjà au dossier.`,
      title: "Documents au dossier",
      open: (name: string) => `Ouvrir — ${name}`,
    },

    // ✅ TA = 4 étapes
    steps: {
      s1: "Informations",
      s2: "Revenus & dépenses",
      s3: "Pièces justificatives",
      s4: "Validation",
    },

    sections: {
      clientTitle: "Informations du client",
      clientDesc: "Informations essentielles pour l’ouverture du dossier.",
      spouseTitle: "Conjoint",
      spouseDesc: "À remplir seulement si applicable.",
      dependantsTitle: "Personnes à charge",
      dependantsDesc: "Ajoutez vos enfants / personnes à charge.",

      questionsTitle: "Informations fiscales additionnelles",
      questionsDesc: "Questions générales pour compléter correctement le dossier.",

      // TA (étape 2)
      taTitle: "Travailleur autonome (TA)",
      taDesc: "Informations sur vos activités, revenus et dépenses.",

      // Docs (étape 3)
      supportingDocsTitle: "Pièces justificatives",
      supportingDocsDesc: "Déposez vos documents (T4A, relevés, reçus, etc.).",

      // Confirms (étape 4)
      confirmsTitle: "Confirmations obligatoires",
      confirmsDesc: "Sans ces confirmations, le dossier ne peut pas continuer.",
    },

    fields: {
      firstName: "Prénom",
      lastName: "Nom",
      sin: "Numéro d’assurance sociale (NAS)",
      sinPh: "123-456-789",
      dob: "Date de naissance (JJ/MM/AAAA)",
      dobPh: "01/01/1990",
      marital: "État civil",
      maritalChanged: "Mon état civil a changé durant l'année",
      prevMarital: "Ancien état civil",
      prevMaritalPh: "ex.: Célibataire",
      changeDate: "Date du changement (JJ/MM/AAAA)",
      changeDatePh: "15/07/2024",
      phone: "Téléphone",
      mobile: "Cellulaire",
      email: "Courriel",
      address: "Adresse (rue)",
      apt: "App.",
      aptPh: "#201",
      city: "Ville",
      province: "Province",
      postal: "Code postal",
      postalPh: "G1V 0A6",
    },

    spouse: {
      hasSpouse: "J'ai un conjoint / conjointe",
      includeSpouse: "Traiter aussi la déclaration du conjoint",
      spouseNetIncome: "Revenu net approximatif du conjoint ($)",
      spouseNetIncomePh: "ex.: 42 000",
      spouseFirstName: "Prénom (conjoint)",
      spouseLastName: "Nom (conjoint)",
      spouseSin: "NAS (conjoint)",
      spouseDob: "Date de naissance (JJ/MM/AAAA)",
      spousePhone: "Téléphone (conjoint)",
      spouseMobile: "Cellulaire (conjoint)",
      spouseEmail: "Courriel (conjoint)",
      sameAddress: "L'adresse du conjoint est identique à la mienne",
      spouseAddress: "Adresse (rue) - conjoint",
    },

    dependants: {
      none: "Aucune personne à charge ajoutée.",
      titleN: (n: number) => `Personne à charge #${n}`,
      remove: "Supprimer",
      add: "+ Ajouter une personne à charge",
      sinIfAny: "NAS (si attribué)",
      sex: "Sexe",
      sexM: "M",
      sexF: "F",
      sexX: "Autre / préfère ne pas dire",
    },

    questions: {
      taxYear: "Année d’imposition (ex.: 2025)",
      taxYearPh: "ex.: 2025",
      livedAlone: "Avez-vous habité seul(e) toute l'année (sans personne à charge) ?",
      peopleCount: "Au 31/12, combien de personnes vivaient avec vous ?",
      peopleCountPh: "ex.: 1",
      foreignAssets: "Avez-vous plus de 100 000 $ de biens à l'étranger ?",
      citizen: "Êtes-vous citoyen(ne) canadien(ne) ?",
      nonResident: "Êtes-vous non-résident(e) du Canada aux fins fiscales ?",
      homeTx: "Avez-vous acheté une première habitation ou vendu votre résidence principale cette année ?",
      techCall: "Souhaitez-vous qu'un technicien vous appelle ?",
      copy: "Comment voulez-vous recevoir votre copie d'impôt ?",
      copyPortal: "Espace client",
      copyEmail: "Courriel",
    },

    ta: {
      activityTitle: "Activité principale",
      activityDesc: "Décrivez brièvement votre travail autonome.",
      businessName: "Nom d’entreprise (si applicable)",
      businessNamePh: "ex.: Services ABC",
      businessNumber: "Numéro d’entreprise (NEQ/BN) (si applicable)",
      businessNumberPh: "ex.: 123456789",
      industry: "Secteur / industrie",
      industryPh: "ex.: Construction, coiffure, consultation…",
      gstqst: "Inscrit(e) TPS/TVQ ?",
      incomeTotal: "Revenus totaux (approx.)",
      incomeTotalPh: "ex.: 75 000",
      expensesTotal: "Dépenses totales (approx.)",
      expensesTotalPh: "ex.: 18 500",
    },

    confirms: {
      exact: "Je confirme que toutes les informations fournies sont exactes.",
      complete: "Je confirme avoir fourni toutes les informations requises pour le traitement.",
      fees: "Je comprends que les frais peuvent varier selon la complexité du dossier.",
      delays: "Je comprends qu’un dossier incomplet peut retarder le traitement.",
    },
  },

  en: {
    brand: "ComptaNet Québec",
    formName: "Tax form — Self-employed (TA)",
    disconnect: "Sign out",
    intro:
      "Please complete this form after creating your account. We use this information to prepare your Canadian (federal) tax return and, if applicable, your Québec return.",

    fixBeforeContinue: "Fix before continuing",
    missingRequired:
      "❌ Some required information is missing. Please fix the list below.",
    preparing: "⏳ Preparing your file…",
    redirecting: "✅ Redirecting…",
    continue: "Continue →",
    nextStepDocs: "Next step: document upload.",
    completeToContinue: "Complete required fields to continue.",

    docs: {
      loading: "Loading documents…",
      already: (n: number) => `${n} document(s) already on file.`,
      title: "Documents on file",
      open: (name: string) => `Open — ${name}`,
    },

    steps: {
      s1: "Info",
      s2: "Income & expenses",
      s3: "Supporting documents",
      s4: "Review",
    },

    sections: {
      clientTitle: "Client information",
      clientDesc: "Essential information to open your file.",
      spouseTitle: "Spouse",
      spouseDesc: "Fill out only if applicable.",
      dependantsTitle: "Dependants",
      dependantsDesc: "Add your children / dependants.",

      questionsTitle: "Additional tax info",
      questionsDesc: "General questions to complete your file correctly.",

      taTitle: "Self-employed (TA)",
      taDesc: "Information about your activities, income and expenses.",

      supportingDocsTitle: "Supporting documents",
      supportingDocsDesc: "Upload your documents (T4A, statements, receipts, etc.).",

      confirmsTitle: "Required confirmations",
      confirmsDesc: "Without these confirmations, you cannot continue.",
    },

    fields: {
      firstName: "First name",
      lastName: "Last name",
      sin: "Social Insurance Number (SIN)",
      sinPh: "123-456-789",
      dob: "Date of birth (DD/MM/YYYY)",
      dobPh: "01/01/1990",
      marital: "Marital status",
      maritalChanged: "My marital status changed during the year",
      prevMarital: "Previous marital status",
      prevMaritalPh: "e.g., Single",
      changeDate: "Change date (DD/MM/YYYY)",
      changeDatePh: "15/07/2024",
      phone: "Phone",
      mobile: "Mobile",
      email: "Email",
      address: "Address (street)",
      apt: "Apt.",
      aptPh: "#201",
      city: "City",
      province: "Province",
      postal: "Postal code",
      postalPh: "G1V 0A6",
    },

    spouse: {
      hasSpouse: "I have a spouse / partner",
      includeSpouse: "Include spouse tax return as well",
      spouseNetIncome: "Spouse approximate net income ($)",
      spouseNetIncomePh: "e.g., 42,000",
      spouseFirstName: "Spouse first name",
      spouseLastName: "Spouse last name",
      spouseSin: "Spouse SIN",
      spouseDob: "Spouse date of birth (DD/MM/YYYY)",
      spousePhone: "Spouse phone",
      spouseMobile: "Spouse mobile",
      spouseEmail: "Spouse email",
      sameAddress: "Spouse address is the same as mine",
      spouseAddress: "Spouse address (street)",
    },

    dependants: {
      none: "No dependant added.",
      titleN: (n: number) => `Dependant #${n}`,
      remove: "Remove",
      add: "+ Add a dependant",
      sinIfAny: "SIN (if assigned)",
      sex: "Sex",
      sexM: "M",
      sexF: "F",
      sexX: "Other / prefer not to say",
    },

    questions: {
      taxYear: "Tax year (e.g., 2025)",
      taxYearPh: "e.g., 2025",
      livedAlone: "Did you live alone all year (no dependants)?",
      peopleCount: "On 12/31, how many people lived with you?",
      peopleCountPh: "e.g., 1",
      foreignAssets: "Do you have more than $100,000 in foreign assets?",
      citizen: "Are you a Canadian citizen?",
      nonResident: "Are you a non-resident of Canada for tax purposes?",
      homeTx: "Did you buy a first home or sell your principal residence this year?",
      techCall: "Do you want a technician to call you?",
      copy: "How would you like to receive your tax copy?",
      copyPortal: "Client portal",
      copyEmail: "Email",
    },

    ta: {
      activityTitle: "Main activity",
      activityDesc: "Briefly describe your self-employed work.",
      businessName: "Business name (if applicable)",
      businessNamePh: "e.g., ABC Services",
      businessNumber: "Business number (NEQ/BN) (if applicable)",
      businessNumberPh: "e.g., 123456789",
      industry: "Industry / sector",
      industryPh: "e.g., Construction, hair salon, consulting…",
      gstqst: "Registered for GST/QST?",
      incomeTotal: "Total income (approx.)",
      incomeTotalPh: "e.g., 75,000",
      expensesTotal: "Total expenses (approx.)",
      expensesTotalPh: "e.g., 18,500",
    },

    confirms: {
      exact: "I confirm that all information provided is accurate.",
      complete: "I confirm that I provided all required information.",
      fees: "I understand fees may vary depending on file complexity.",
      delays: "I understand an incomplete file can delay processing.",
    },
  },

  es: {
    brand: "ComptaNet Québec",
    formName: "Formulario fiscal — Autónomo (TA)",
    disconnect: "Cerrar sesión",
    intro:
      "Complete este formulario después de crear su cuenta. Usamos esta información para preparar su declaración de impuestos de Canadá (federal) y, si corresponde, la de Québec.",

    fixBeforeContinue: "Corrija antes de continuar",
    missingRequired:
      "❌ Faltan datos obligatorios. Corrija la lista a continuación.",
    preparing: "⏳ Preparando su expediente…",
    redirecting: "✅ Redirigiendo…",
    continue: "Continuar →",
    nextStepDocs: "Siguiente paso: carga de documentos.",
    completeToContinue: "Complete los campos obligatorios para continuar.",

    docs: {
      loading: "Cargando documentos…",
      already: (n: number) => `${n} documento(s) ya en el expediente.`,
      title: "Documentos en el expediente",
      open: (name: string) => `Abrir — ${name}`,
    },

    steps: {
      s1: "Información",
      s2: "Ingresos y gastos",
      s3: "Documentos",
      s4: "Revisión",
    },

    sections: {
      clientTitle: "Información del cliente",
      clientDesc: "Información esencial para abrir el expediente.",
      spouseTitle: "Cónyuge",
      spouseDesc: "Complete solo si corresponde.",
      dependantsTitle: "Dependientes",
      dependantsDesc: "Agregue sus hijos / dependientes.",

      questionsTitle: "Información fiscal adicional",
      questionsDesc: "Preguntas generales para completar correctamente el expediente.",

      taTitle: "Autónomo (TA)",
      taDesc: "Información sobre sus actividades, ingresos y gastos.",

      supportingDocsTitle: "Documentos",
      supportingDocsDesc: "Suba sus documentos (T4A, extractos, recibos, etc.).",

      confirmsTitle: "Confirmaciones obligatorias",
      confirmsDesc: "Sin estas confirmaciones, no puede continuar.",
    },

    fields: {
      firstName: "Nombre",
      lastName: "Apellido",
      sin: "Número de seguro social (SIN/NAS)",
      sinPh: "123-456-789",
      dob: "Fecha de nacimiento (DD/MM/AAAA)",
      dobPh: "01/01/1990",
      marital: "Estado civil",
      maritalChanged: "Mi estado civil cambió durante el año",
      prevMarital: "Estado civil anterior",
      prevMaritalPh: "p. ej., Soltero(a)",
      changeDate: "Fecha del cambio (DD/MM/AAAA)",
      changeDatePh: "15/07/2024",
      phone: "Teléfono",
      mobile: "Móvil",
      email: "Correo electrónico",
      address: "Dirección (calle)",
      apt: "Apto.",
      aptPh: "#201",
      city: "Ciudad",
      province: "Provincia",
      postal: "Código postal",
      postalPh: "G1V 0A6",
    },

    spouse: {
      hasSpouse: "Tengo cónyuge / pareja",
      includeSpouse: "Incluir también la declaración del cónyuge",
      spouseNetIncome: "Ingreso neto aproximado del cónyuge ($)",
      spouseNetIncomePh: "p. ej., 42 000",
      spouseFirstName: "Nombre (cónyuge)",
      spouseLastName: "Apellido (cónyuge)",
      spouseSin: "NAS/SIN (cónyuge)",
      spouseDob: "Fecha de nacimiento (DD/MM/AAAA)",
      spousePhone: "Teléfono (cónyuge)",
      spouseMobile: "Móvil (cónyuge)",
      spouseEmail: "Correo (cónyuge)",
      sameAddress: "La dirección del cónyuge es la misma que la mía",
      spouseAddress: "Dirección (calle) - cónyuge",
    },

    dependants: {
      none: "No hay dependientes agregados.",
      titleN: (n: number) => `Dependiente #${n}`,
      remove: "Eliminar",
      add: "+ Agregar un dependiente",
      sinIfAny: "NAS/SIN (si existe)",
      sex: "Sexo",
      sexM: "M",
      sexF: "F",
      sexX: "Otro / prefiero no decir",
    },

    questions: {
      taxYear: "Año fiscal (p. ej., 2025)",
      taxYearPh: "p. ej., 2025",
      livedAlone: "¿Vivió solo(a) todo el año (sin dependientes)?",
      peopleCount: "Al 31/12, ¿cuántas personas vivían con usted?",
      peopleCountPh: "p. ej., 1",
      foreignAssets: "¿Tiene más de $100,000 en bienes en el extranjero?",
      citizen: "¿Es ciudadano(a) canadiense?",
      nonResident: "¿Es no residente de Canadá para fines fiscales?",
      homeTx: "¿Compró una primera vivienda o vendió su residencia principal este año?",
      techCall: "¿Desea que un técnico le llame?",
      copy: "¿Cómo desea recibir su copia de impuestos?",
      copyPortal: "Portal del cliente",
      copyEmail: "Correo electrónico",
    },

    ta: {
      activityTitle: "Actividad principal",
      activityDesc: "Describa brevemente su trabajo autónomo.",
      businessName: "Nombre comercial (si corresponde)",
      businessNamePh: "p. ej., Servicios ABC",
      businessNumber: "Número de empresa (NEQ/BN) (si corresponde)",
      businessNumberPh: "p. ej., 123456789",
      industry: "Sector / industria",
      industryPh: "p. ej., Construcción, peluquería, consultoría…",
      gstqst: "¿Inscrito(a) en TPS/TVQ?",
      incomeTotal: "Ingresos totales (aprox.)",
      incomeTotalPh: "p. ej., 75 000",
      expensesTotal: "Gastos totales (aprox.)",
      expensesTotalPh: "p. ej., 18 500",
    },

    confirms: {
      exact: "Confirmo que toda la información proporcionada es exacta.",
      complete: "Confirmo que proporcioné toda la información requerida.",
      fees: "Entiendo que pueden aplicarse cargos adicionales según la complejidad.",
      delays: "Entiendo que un expediente incompleto puede retrasar el procesamiento.",
    },
  },
} as const;

export type CopyLang = keyof typeof COPY;
export type CopyPack = (typeof COPY)[CopyLang];

export function pickCopy(lang: string | null | undefined): CopyLang {
  const x = (lang || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as CopyLang) : "fr";
}
