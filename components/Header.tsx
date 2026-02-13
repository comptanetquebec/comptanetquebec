"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        
        {/* Logo → retourne toujours à l'accueil */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-80 transition"
        >
          ComptaNet Québec
        </Link>

        {/* Navigation principale */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/#services" className="hover:text-blue-700 transition">
            Services
          </Link>
          <Link href="/#tarifs" className="hover:text-blue-700 transition">
            Tarifs
          </Link>
          <Link href="/#faq" className="hover:text-blue-700 transition">
            FAQ
          </Link>

          {/* CTA plus visible */}
          <Link
            href="/espace-client"
            className="rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 transition"
          >
            Espace client
          </Link>
        </nav>
      </div>
    </header>
  );
}
