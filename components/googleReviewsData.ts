export type Lang = "fr" | "en" | "es";

export type GoogleReviewItem = {
  name: string;
  rating: 5 | 4 | 3 | 2 | 1;
  text?: string;
};

export const GOOGLE_REVIEWS: Record<Lang, GoogleReviewItem[]> = {
  fr: [
    {
      name: "Rebecca Huot",
      rating: 5,
      text: "",
    },
    {
      name: "Charles Moreau",
      rating: 5,
      text: "Un excellent service, je recommande sans hésiter!",
    },
    {
      name: "Kevin Mandeville",
      rating: 5,
      text: "Site internet très intuitif et facile à comprendre. C'est un réel avantage de pouvoir effectuer toutes les démarches entièrement à distance. Je recommande !",
    },
  ],

  en: [
    {
      name: "Rebecca Huot",
      rating: 5,
      text: "",
    },
    {
      name: "Charles Moreau",
      rating: 5,
      text: "Excellent service, I highly recommend it!",
    },
    {
      name: "Kevin Mandeville",
      rating: 5,
      text: "Very intuitive and easy-to-understand website. Being able to complete everything entirely online is a real advantage. I recommend it!",
    },
  ],

  es: [
    {
      name: "Rebecca Huot",
      rating: 5,
      text: "",
    },
    {
      name: "Charles Moreau",
      rating: 5,
      text: "Excelente servicio, lo recomiendo sin dudarlo!",
    },
    {
      name: "Kevin Mandeville",
      rating: 5,
      text: "Sitio web muy intuitivo y fácil de entender. Poder realizar todos los trámites completamente en línea es una gran ventaja. ¡Lo recomiendo!",
    },
  ],
};
