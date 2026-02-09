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
  | "unknown";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();

  if (/(document|pi[eè]ce|relev[ée]|facture|justificatif|preuve)/.test(t)) return "docs";
  if (/(t1|t2|travailleur autonome|autonome|incorpor|soci[eé]t[eé])/.test(t)) return "t1_ta_t2";
  if (/(comment|proc[eé]dure|[eé]tape|d[eé]poser|upload|envoyer|dossier)/.test(t)) return "process";
  if (/(prix|tarif|co[uû]t|acompte|payer|paiement)/.test(t)) return "pricing";
  if (/(date limite|[eé]ch[eé]ance|deadline|retard|p[eé]nalit[eé])/.test(t)) return "deadline";

  return "unknown";
}

function safeDelay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function askAssistantMock(userMessage: string): Promise<AIResponse> {
  // petit délai “humain”
  await safeDelay(450);

  const intent = detectIntent(userMessage);

  switch (intent) {
    case "docs":
      return {
        tags: ["documents", "justificatifs", "dépenses"],
        content:
          "Les documents varient selon votre situation (salarié, travailleur autonome, société). En général, on demande :\n" +
          "- Relevés de revenus (ex. feuillets, états de compte)\n" +
          "- Pièces justificatives des dépenses (factures, relevés, contrats)\n" +
          "- Informations personnelles de base (adresse, NAS/NE, etc.)\n\n" +
          "Si vous me dites votre type de dossier (T1 / Travailleur autonome / T2), je peux donner une liste indicative plus ciblée.",
        next_actions: [
          "Me dire votre type de dossier (T1, Travailleur autonome, T2)",
          "Consulter la section “Déposer les documents” si vous êtes prêt(e)",
        ],
      };

    case "t1_ta_t2":
      return {
        tags: ["T1", "travailleur autonome", "T2"],
        content:
          "En simplifiant :\n" +
          "- **T1** : déclaration personnelle (salarié, revenus personnels, etc.)\n" +
          "- **Travailleur autonome** : déclaration personnelle + revenus/dépenses d’entreprise non incorporée\n" +
          "- **T2** : déclaration d’une **société incorporée** (compagnie)\n\n" +
          "Si vous me dites si vous êtes incorporé(e) ou non, et si vous avez des revenus d’entreprise, je peux vous orienter vers le bon type de dossier.",
        next_actions: [
          "Confirmer si vous êtes incorporé(e) (oui/non)",
          "Choisir le bon type de dossier sur la page d’accueil",
        ],
      };

    case "process":
      return {
        tags: ["processus", "dossier", "étapes"],
        content:
          "Le processus est généralement :\n" +
          "1) Remplir le formulaire (informations de base)\n" +
          "2) Ajouter revenus & dépenses (si applicable)\n" +
          "3) Déposer les documents (preuves)\n" +
          "4) Envoyer le dossier pour traitement\n\n" +
          "Je peux vous expliquer une étape en particulier si vous me dites où vous êtes rendu(e).",
        next_actions: [
          "Me dire à quelle étape vous êtes (1 à 4)",
          "Préparer vos documents avant le dépôt (PDF/JPG, lisibles)",
        ],
      };

    case "pricing":
      return {
        tags: ["prix", "tarifs", "paiement"],
        content:
          "Pour les tarifs, ça dépend du type de dossier et de la complexité. Souvent, un **acompte** sert à ouvrir le dossier, puis le solde est ajusté selon le travail réel.\n\n" +
          "Si vous me dites votre type de dossier (T1 / Travailleur autonome / T2), je peux vous indiquer la logique la plus courante et où voir l’information sur le site.",
        next_actions: ["Me dire votre type de dossier", "Consulter la section Tarifs/Coûts sur le site"],
      };

    case "deadline":
      return {
        tags: ["échéances", "dates limites"],
        content:
          "Les dates limites et règles de pénalités varient selon le type de déclaration (personnelle, autonome, société) et selon la situation. Je peux vous donner une explication générale si vous me dites :\n" +
          "- votre type (T1 / Travailleur autonome / T2)\n" +
          "- et si c’est pour produire la déclaration ou payer un solde.",
        next_actions: ["Me dire votre type de dossier", "Préciser : production ou paiement"],
      };

    default:
      return {
        tags: ["aide", "orientation"],
        content:
          "Je peux vous aider à vous orienter. Dites-moi ce que vous cherchez :\n" +
          "- documents à fournir\n" +
          "- différence T1 / Travailleur autonome / T2\n" +
          "- étapes du processus\n" +
          "- paiement / acompte\n\n" +
          "Si vous me copiez votre question avec un peu de contexte (sans données sensibles), je réponds plus précisément.",
        next_actions: ["Préciser votre type de dossier (T1, Travailleur autonome, T2)"],
      };
  }
}
