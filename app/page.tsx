export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif" }}>
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "500px",
          overflow: "hidden",
        }}
      >
        {/* Image de fond */}
        <img
          src="/banniere.png"
          alt="Famille heureuse - ComptaNet Québec"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Bloc texte */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "40px 30px",
            borderRadius: "15px",
            maxWidth: "700px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#2E2E2E" }}>
            Déclarez vos revenus en ligne facilement et rapidement avec{" "}
            <span style={{ color: "#004aad" }}>ComptaNet Québec</span>
          </h1>

          <p style={{ fontSize: "16px", color: "#555", margin: "20px 0" }}>
            Votre solution complète pour faire vos impôts en ligne sans stress,
            gérée par des experts. Maximisez vos remboursements d’impôt tout en
            simplifiant votre fiscalité grâce à notre expertise.
          </p>

          {/* Bouton CTA en bleu */}
          <a
            href="#tarifs"
            style={{
              display: "inline-block",
              backgroundColor: "#004aad",
              color: "white",
              padding: "12px 25px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "16px",
              transition: "0.3s",
            }}
          >
            Commencez dès aujourd’hui
          </a>
        </div>
      </section>
    </main>
  );
}
