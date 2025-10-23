export default function Loading() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="flex items-center gap-3 text-gray-600">
        <span className="animate-spin inline-block h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-500" />
        <span>Chargement…</span>
      </div>
    </main>
  );
}
