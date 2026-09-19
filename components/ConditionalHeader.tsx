"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();

  // La page d'accueil possède déjà son propre en-tête
  if (pathname === "/") {
    return null;
  }

  // Partie privée de la tenue de livres
  const isPrivateBookkeeping =
    pathname === "/tenue-de-livres" ||
    (pathname.startsWith("/tenue-de-livres/") &&
      pathname !== "/tenue-de-livres/info");

  if (isPrivateBookkeeping) {
    return null;
  }

  return <Header />;
}
