import "../formulaire-fiscal/formulaire-fiscal-presentiel.css";
import { requireAdmin } from "@/app/_admin/requireAdmin";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // 🔐 protection admin
  return <>{children}</>;
}
