export default function EspaceClient() {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Espace client</h1>
      <p>Connectez-vous pour déposer vos documents et suivre votre dossier.</p>

      {/* Ici on ajoutera l'intégration avec Supabase Auth */}
      <div style={{ marginTop: 20, padding: 20, border: "1px solid #eee", borderRadius: 8 }}>
        <p>⚡ La connexion sécurisée sera activée prochainement.</p>
      </div>
    </main>
  );
}

