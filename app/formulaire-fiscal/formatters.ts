// app/formulaire-fiscal/formatters.ts
export function formatNASInput(v: string) {
  const d = (v || "").replace(/\D+/g, "").slice(0, 9);
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 9);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

export function formatDateInput(v: string) {
  const d = (v || "").replace(/\D+/g, "").slice(0, 8);
  const dd = d.slice(0, 2), mm = d.slice(2, 4), yyyy = d.slice(4, 8);
  if (d.length <= 2) return dd;
  if (d.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

export function formatPhoneInput(v: string) {
  const d = (v || "").replace(/\D+/g, "").slice(0, 10);
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${a}`;
  if (d.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

export function formatPostalInput(v: string) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)}`;
}
