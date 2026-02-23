export type Lang = "fr" | "en" | "es";

export type GoogleReviewItem = {
  name: string;
  rating: 5 | 4 | 3 | 2 | 1;
  text?: string;
};

export const GOOGLE_REVIEWS: Record<Lang, GoogleReviewItem[]> = {
  fr: [
    // Exemple (mets tes vrais avis)
    { name: "Client", rating: 5, text: "Service rapide et professionnel." },
  ],
  en: [
    { name: "Client", rating: 5, text: "Fast and professional service." },
  ],
  es: [
    { name: "Cliente", rating: 5, text: "Servicio rápido y profesional." },
  ],
};
