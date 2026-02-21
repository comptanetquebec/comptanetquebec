import type { Periode } from "./types";

export function updatePeriode(list: Periode[], idx: number, patch: Partial<Periode>) {
  return list.map((p, i) => (i === idx ? { ...p, ...patch } : p));
}

export function normalizeNAS(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}
export function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
export function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}

export function firstNonEmpty(...vals: string[]) {
  for (const v of vals) if ((v || "").trim()) return v;
  return "";
}
