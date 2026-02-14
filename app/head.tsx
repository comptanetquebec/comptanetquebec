export default function Head() {
  const base = "https://www.comptanetquebec.com";
  return (
    <>
      <title>Déclaration d’impôt au Québec en ligne | ComptaNet Québec</title>
      <meta
        name="description"
        content="Service de déclaration d’impôt au Québec. Particulier, travailleur autonome et compagnie incorporée. Portail sécurisé, paiement Stripe, accréditation TED."
      />
      <link rel="canonical" href={`${base}/`} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="fr-CA" href={`${base}/?lang=fr`} />
      <link rel="alternate" hrefLang="en-CA" href={`${base}/?lang=en`} />
      <link rel="alternate" hrefLang="es" href={`${base}/?lang=es`} />
      <link rel="alternate" hrefLang="x-default" href={`${base}/?lang=fr`} />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${base}/`} />
      <meta
        property="og:title"
        content="Déclaration d’impôt au Québec en ligne | ComptaNet Québec"
      />
      <meta
        property="og:description"
        content="Ouvrez votre dossier, téléversez vos documents, et votre déclaration est préparée de façon simple et sécurisée."
      />
    </>
  );
}
