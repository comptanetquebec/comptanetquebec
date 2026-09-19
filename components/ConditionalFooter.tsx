"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  const isPrivateBookkeeping =
    pathname === "/tenue-de-livres" ||
    (
      pathname.startsWith("/tenue-de-livres/") &&
      pathname !== "/tenue-de-livres/info"
    );

  if (isPrivateBookkeeping) {
    return null;
  }

  return <Footer />;
}
