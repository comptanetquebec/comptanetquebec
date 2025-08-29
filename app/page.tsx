import Image from "next/image";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <Image 
        src="/logo-cq.png" 
        alt="Logo ComptaNet Québec" 
        width={200} 
        height={200} 
      />
      <h1>Bienvenue sur ComptaNet Québec</h1>
      <p>
        Votre partenaire de confiance pour la fiscalité et la comptabilité.
      </p>
    </main>
  );
}
