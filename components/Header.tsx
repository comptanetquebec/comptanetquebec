"use client";

import Link from "next/link";
import AdminLink from "@/components/AdminLink";

export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo / Home */}
        <Link href="/" className="font-semibold text-lg">
          ComptaNet Québec
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/espace-client" className="hover:underline">
            Espace client
          </Link>

          {/* 🔐 Visible seulement si admin */}
          <AdminLink />
        </nav>
      </div>
    </header>
  );
}
