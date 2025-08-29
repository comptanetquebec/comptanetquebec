export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Section Hero */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "500px",
          overflow: "hidden",
        }}
      >
        {/* Image bannière */}
        <img
          src="/banniere.png"
          alt="Famille heureuse - ComptaNet Québec"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Bloc de texte par-dessus */}
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "15px",
            maxWidth: "700px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "26px", color: "#2E2E2E", marginBottom: "15px" }}>
            Déclarez vos revenus en ligne facilement et rapidement avec{" "}
            <span style={{ color: "#004aad", fontWeight: "bold" }}>ComptaNet Québec</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#555" }}>
            Votre solution complète pour faire vos impôts en ligne sans stress, gérée par des experts.
            Maximisez vos remboursements d’impôt tout en simplifiant votre fiscalité grâce à notre expertise.
          </p>
        </div>
      </section>
    </main>
  );
}
