/**
 * Generates the Supabase Auth email templates into docs/email-templates/.
 *
 * Supabase Auth emails are rendered by Supabase (not by our code), even when
 * they are delivered through Resend SMTP, so their HTML has to be pasted into
 * the dashboard under Authentication -> Emails. Run this script after changing
 * the brand, then paste the regenerated files.
 *
 * The layout here mirrors lib/email/template.ts - keep the two in sync.
 *
 *   node scripts/render-auth-emails.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://app.cursormiami.com";
const SITE_NAME = "Cursor Miami: Ship Night";
const SHORT_NAME = "Ship Night";
const LOCATION = "Miami";

const COLORS = {
  page: "#07070c",
  card: "#0c0c14",
  border: "#1e1e2a",
  heading: "#f4f5fa",
  body: "#b9bdcc",
  muted: "#8a90a3",
  accent: "#ff2d92",
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function renderEmail({
  preheader,
  eyebrow,
  heading,
  body,
  button,
  fallbackUrl,
  token,
  footnote,
}) {
  const eyebrowHtml = eyebrow
    ? `<p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.accent};">${eyebrow}</p>`
    : "";

  const bodyHtml = body
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${COLORS.body};">${paragraph}</p>`,
    )
    .join("\n                ");

  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
                  <tr>
                    <td style="border-radius:10px;background-color:${COLORS.accent};">
                      <a href="${button.url}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${button.label}</a>
                    </td>
                  </tr>
                </table>`
    : "";

  const tokenHtml = token
    ? `<div style="margin:8px 0 4px;padding:20px;background-color:#12121c;border:1px solid ${COLORS.border};border-radius:12px;text-align:center;font-family:${MONO};font-size:28px;letter-spacing:8px;font-weight:700;color:${COLORS.heading};">${token}</div>`
    : "";

  const fallbackHtml = fallbackUrl
    ? `<p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:20px;color:${COLORS.muted};">Or paste this link into your browser:<br />
                  <a href="${fallbackUrl}" style="color:${COLORS.accent};word-break:break-all;">${fallbackUrl}</a></p>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${COLORS.border};font-family:${FONT};font-size:12px;line-height:20px;color:${COLORS.muted};">${footnote}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${SITE_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.page};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding-bottom:24px;">
                <a href="${SITE_URL}" style="text-decoration:none;">
                  <img src="${SITE_URL}/logo-dark.png" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border-radius:8px;border:0;" />
                  <span style="display:inline-block;vertical-align:middle;padding-left:12px;font-family:${FONT};font-size:16px;font-weight:700;color:${COLORS.heading};">${SHORT_NAME}</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;padding:32px;">
                ${eyebrowHtml}
                <h1 style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:700;color:${COLORS.heading};">${heading}</h1>
                ${bodyHtml}
                ${buttonHtml}${tokenHtml}
                ${fallbackHtml}
                ${footnoteHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;text-align:center;">
                <p style="margin:0;font-family:${FONT};font-size:12px;line-height:20px;color:${COLORS.muted};">${SITE_NAME} · ${LOCATION}<br />
                  <a href="${SITE_URL}" style="color:${COLORS.muted};">${SITE_URL.replace(/^https?:\/\//, "")}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

const IGNORE_NOTE =
  "If you didn't request this, you can safely ignore this email.";

/** Keys match the template names in Supabase -> Authentication -> Emails. */
const templates = {
  "confirm-signup": renderEmail({
    preheader: "Confirm your email to finish creating your Ship Night account.",
    eyebrow: "Confirm your email",
    heading: "You're almost in",
    body: [
      `Welcome to <strong style="color:${COLORS.heading};">${SITE_NAME}</strong>. Confirm your email address to finish creating your account and start building.`,
    ],
    button: { label: "Confirm my email", url: "{{ .ConfirmationURL }}" },
    fallbackUrl: "{{ .ConfirmationURL }}",
    footnote: IGNORE_NOTE,
  }),

  "invite-user": renderEmail({
    preheader: "You've been invited to Cursor Miami: Ship Night.",
    eyebrow: "Invitation",
    heading: "You're invited to Ship Night",
    body: [
      `You've been invited to join <strong style="color:${COLORS.heading};">${SITE_NAME}</strong>. Accept the invitation to set up your account.`,
    ],
    button: { label: "Accept invitation", url: "{{ .ConfirmationURL }}" },
    fallbackUrl: "{{ .ConfirmationURL }}",
    footnote: "If you weren't expecting this invitation, you can ignore this email.",
  }),

  "magic-link": renderEmail({
    preheader: "Your sign-in link for Ship Night.",
    eyebrow: "Sign in",
    heading: "Your sign-in link",
    body: [
      "Use the link below to sign in. It works once and expires shortly, so use it soon.",
    ],
    button: { label: "Sign in", url: "{{ .ConfirmationURL }}" },
    fallbackUrl: "{{ .ConfirmationURL }}",
    footnote: IGNORE_NOTE,
  }),

  "change-email": renderEmail({
    preheader: "Confirm your new email address for Ship Night.",
    eyebrow: "Email change",
    heading: "Confirm your new email",
    body: [
      `You asked to change your Ship Night email from <strong style="color:${COLORS.heading};">{{ .Email }}</strong> to <strong style="color:${COLORS.heading};">{{ .NewEmail }}</strong>.`,
      "Confirm the change to start using your new address to sign in.",
    ],
    button: { label: "Confirm the change", url: "{{ .ConfirmationURL }}" },
    fallbackUrl: "{{ .ConfirmationURL }}",
    footnote:
      "If you didn't request this change, ignore this email and your address stays the same.",
  }),

  "reset-password": renderEmail({
    preheader: "Reset your Ship Night password.",
    eyebrow: "Password reset",
    heading: "Reset your password",
    body: [
      "Choose a new password for your Ship Night account. This link works once and expires shortly.",
    ],
    button: { label: "Reset my password", url: "{{ .ConfirmationURL }}" },
    fallbackUrl: "{{ .ConfirmationURL }}",
    footnote:
      "If you didn't request a reset, ignore this email and your password stays the same.",
  }),

  reauthentication: renderEmail({
    preheader: "Your Ship Night verification code.",
    eyebrow: "Verification code",
    heading: "Confirm it's you",
    body: ["Enter this code to confirm the action you just started."],
    token: "{{ .Token }}",
    footnote: `This code expires shortly. ${IGNORE_NOTE}`,
  }),
};

const outDir = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  "docs",
  "email-templates",
);

await mkdir(outDir, { recursive: true });
for (const [name, html] of Object.entries(templates)) {
  await writeFile(join(outDir, `${name}.html`), html, "utf8");
  console.log(`wrote docs/email-templates/${name}.html`);
}
