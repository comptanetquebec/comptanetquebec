// lib/emails/adminNotify.ts
import {
  getResend,
  getContactFrom,
  getAdminNotifyEmail,
} from "@/lib/resend";

type ResendErrorShape = {
  error?: {
    message?: string;
  };
};

export async function sendAdminNotifyEmail(opts: {
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const resend = getResend();

  const res = (await resend.emails.send({
    from: getContactFrom(),
    to: [getAdminNotifyEmail()],
    subject: opts.subject,
    text: opts.text,
    reply_to: opts.replyTo ? [opts.replyTo] : undefined,
  })) as ResendErrorShape;

  if (res?.error) {
    throw new Error(res.error.message ?? "Resend error");
  }

  return res;
}
