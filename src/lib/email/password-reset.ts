import { getSiteUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";

export function buildPasswordResetEmail(input: {
  resetUrl: string;
  recipientEmail: string;
}) {
  const appName = "Paycheck Planner";
  const { resetUrl, recipientEmail } = input;

  const text = [
    `Reset your ${appName} password`,
    "",
    `We received a request to reset the password for ${recipientEmail}.`,
    "Open this link to choose a new password (expires in 1 hour):",
    resetUrl,
    "",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset your password</title>
  </head>
  <body style="margin:0;padding:0;background:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px 28px;">
            <tr>
              <td style="color:#f8fafc;font-size:20px;font-weight:600;padding-bottom:8px;">
                Reset your password
              </td>
            </tr>
            <tr>
              <td style="color:#94a3b8;font-size:14px;line-height:1.6;padding-bottom:24px;">
                We received a request to reset the password for <strong style="color:#e2e8f0;">${escapeHtml(recipientEmail)}</strong>.
                Click the button below to choose a new password. This link expires in 1 hour.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:linear-gradient(90deg,#0ea5e9,#10b981);color:#0b1220;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:12px;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:12px;line-height:1.6;padding-bottom:16px;">
                Or copy and paste this link into your browser:<br />
                <a href="${escapeHtml(resetUrl)}" style="color:#38bdf8;word-break:break-all;">${escapeHtml(resetUrl)}</a>
              </td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:12px;line-height:1.5;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
                If you didn't request a password reset, you can safely ignore this email.
                <br /><br />
                — ${escapeHtml(appName)} · ${escapeHtml(getSiteUrl())}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: `Reset your ${appName} password`,
    html,
    text,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  const content = buildPasswordResetEmail({
    resetUrl: input.resetUrl,
    recipientEmail: input.to,
  });

  return sendEmail({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
