// lib/emails/adminNotify.ts
import { getResend, getContactFrom, getAdminNotifyEmail } from "@/lib/resend";

type ResendSendResult =
  | { id?: string }
  | { data?: { id?: string } }
  | { error?: { message?: string } };

function hasError(x: unknown): x is { error: { message?: string } } {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as Record<string, unknown>).error === "object" &&
    (x as Record<string, unknown>).error !== null
  );
}

export async function sendAdminNotifyEmail(opts: {
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const resend = getResend();

  const raw: unknown = await resend.emails.send({
    from: getContactFrom(),
    to: [getAdminNotifyEmail()],
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  });

  if (hasError(raw)) {
    throw new Error(raw.error.message ?? "Resend error");
  }

  return raw as ResendSendResult;
}
