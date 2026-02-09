// lib/resend.ts
import { Resend } from "resend";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export function getContactFrom() {
  const from = process.env.CONTACT_FROM;
  if (!from) throw new Error("Missing CONTACT_FROM");
  return from;
}

export function getAdminNotifyEmail() {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) throw new Error("Missing ADMIN_NOTIFY_EMAIL");
  return to;
}
