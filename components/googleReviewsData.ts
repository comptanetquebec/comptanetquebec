export type Lang = "fr" | "en" | "es";

export type GoogleReviewText = {
  fr?: string;
  en?: string;
  es?: string;
};

export type GoogleReviewItem = {
  name: string;
  rating: 5 | 4 | 3 | 2 | 1;
  text?: GoogleReviewText;
};

export const GOOGLE_REVIEWS: Record<Lang, GoogleReviewItem[]> = {
  fr: [
    {
      name: "Rebecca Huot",
      rating: 5,
      text: { fr: "", en: "", es: "" },
    },
    {
      name: "Charles Moreau",
      rating: 5,
      text: {
        fr: "Un excellent service, je recommande sans hésiter!",
        en: "Excellent service, I highly recommend it!",
        es: "Excelente servicio, lo recomiendo sin dudarlo!",
      },
    },
    {
      name: "Kevin Mandeville",
      rating: 5,
      text: {
        fr: "Site internet très intuitif et facile à comprendre. C'est un réel avantage de pouvoir effectuer toutes les démarches entièrement à distance. Je recommande !",
        en: "Very intuitive and easy-to-understand website. Being able to complete everything entirely online is a real advantage. I recommend it!",
        es: "Sitio web muy intuitivo y fácil de entender. Poder realizar todos los trámites completamente en línea es una gran ventaja. ¡Lo recomiendo!",
      },
    },
  ],

  en: [
    {
      name: "Rebecca Huot",
      rating: 5,
      text: { fr: "", en: "", es: "" },
    },
    {
      name: "Charles Moreau",
      rating: 5,
      text: {
        fr: "Un excellent service, je recommande sans hésiter!",
        en: "Excellent service, I highly recommend it!",
        es: "Excelente servicio, lo recomiendo sin dudarlo!",
      },
    },
    {
      name: "Kevin Mandeville",
      rating: 5,
      text: {
        fr: "Site internet très intuitif et facile à comprendre. C'est un réel avantage de pouvoir effectuer toutes les démarches entièrement à distance. Je recommande !",
        en: "Very intuitive and easy-to-understand website. Being able to complete everything entirely online is a real advantage. I recommend it!",
        es: "Sitio web muy intuitivo y fácil de entender. Poder realizar todos los trámites completamente en línea es una gran ventaja. ¡Lo recomiendo!",
      },
    },
  ],

  es: [
    {
      name: "Rebecca Huot",
      rating: 5,
      text: { fr: "", en: "", es: "" },
    },
    {
      name: "Charles Moreau",
      rating: 5,
      text: {
        fr: "Un excellent service, je recommande sans hésiter!",
        en: "Excellent service, I highly recommend it!",
        es: "Excelente servicio, lo recomiendo sin dudarlo!",
      },
    },
    {
      name: "Kevin Mandeville",
      rating: 5,
      text: {
        fr: "Site internet très intuitif et facile à comprendre. C'est un réel avantage de pouvoir effectuer toutes les démarches entièrement à distance. Je recommande !",
        en: "Very intuitive and easy-to-understand website. Being able to complete everything entirely online is a real advantage. I recommend it!",
        es: "Sitio web muy intuitivo y fácil de entender. Poder realizar todos los trámites completamente en línea es una gran ventaja. ¡Lo recomiendo!",
      },
    },
  ],
};
