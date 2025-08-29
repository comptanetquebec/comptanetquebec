export default function Home() {
  return (
    <section>
      <div
        style={{
          padding: "36px 22px",
          borderRadius: 12,
          background: "#e8f0ff", // bleu très pâle
          border: "1px solid #d6e4ff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, color: "#0b1b3b" }}>
          Bienvenue sur ComptaNet Québec
        </h1>
        <p style={{ marginTop: 10, lineHeight: 1.6 }}>
          Votre partenaire de confiance pour la fiscalité et la comptabilité au Québec.
          Bientôt, vous pourrez tout faire en ligne, de l’envoi des documents jusqu’à la
          signature.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <a
            href="#tarifs"
            style={{
              background: "#0b1b3b",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Voir les tarifs
          </a>
          <a
            href="#contact"
            style={{
              background: "#ffffff",
              color: "#0b1b3b",
              padding: "10px 14px",
              borderRadius: 8,
              textDecoration: "none",
              border: "1px solid #cbd5e1",
              fontWeight: 600,
            }}
          >
            Nous joindre
          </a>
        </div>
      </div>

      <div id="services" style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Services</h2>
        <ul style={{ marginTop: 6, lineHeight: 1.8 }}>
          <li>Déclarations de revenus (particuliers & travailleurs autonomes)</li>
          <li>Organisation et tri de documents</li>
          <li>Support à distance — simple et rapide</li>
        </ul>
      </div>

      <div id="tarifs" style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Tarifs</h2>
        <p>Exemples : Revenu simple dès 79 $, travail autonome dès 149 $.</p>
      </div>
    </section>
  );
}
