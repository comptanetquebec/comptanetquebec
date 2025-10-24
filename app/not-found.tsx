// /app/not-found.tsx
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">Page non trouvée</h1>
      <p className="text-gray-600 mb-6">
        La page demandée n’existe pas ou a été déplacée.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition"
      >
        Retour à l’accueil
      </a>
    </main>
  );
}
