import { Resend } from "resend";
import { getResendFromAddress, hasResend } from "@/lib/email/config";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!hasResend) return null;
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY!);
  }
  return client;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, message: "Email is not configured (RESEND_API_KEY missing)." };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error("[email] Resend error:", error.message);
      return { ok: false, message: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("[email] send failed:", message);
    return { ok: false, message };
  }
}
