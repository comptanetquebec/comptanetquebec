// lib/emails/adminNotify.ts
import {
  getResend,
  getContactFrom,
  getAdminNotifyEmail,
} from "@/lib/resend";

export async function sendAdminNotifyEmail(opts: {
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const resend = getResend();

  const res = await resend.emails.send({
    from: getContactFrom(),
    to: [getAdminNotifyEmail()],
    subject: opts.subject,
    text: opts.text,
    reply_to: opts.replyTo ? [opts.replyTo] : undefined,
  });

  // compat Resend
  // @ts-ignore
  if (res?.error) {
    // @ts-ignore
    throw new Error(res.error?.message || "Resend error");
  }

  return res;
}
