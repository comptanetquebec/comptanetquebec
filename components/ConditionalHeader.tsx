"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();

  const isPrivateBookkeeping =
    pathname === "/tenue-de-livres" ||
    (pathname.startsWith("/tenue-de-livres/") &&
      pathname !== "/tenue-de-livres/info");

  if (isPrivateBookkeeping) {
    return null;
  }

  return <Header />;
}
