/**
 * Branded HTML wrapper for every email the platform sends.
 *
 * Table-based layout with inline styles - the only thing that renders
 * consistently across Gmail, Outlook, and Apple Mail. Mirrors the site's dark
 * neon palette from app/globals.css.
 *
 * The Supabase Auth templates in docs/email-templates/ use the same markup;
 * update both when the design changes.
 */

import { getSiteUrl, siteConfig } from "@/lib/site";

const COLORS = {
  page: "#07070c",
  card: "#0c0c14",
  border: "#1e1e2a",
  heading: "#f4f5fa",
  body: "#b9bdcc",
  muted: "#8a90a3",
  accent: "#ff2d92",
} as const;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type RenderEmailParams = {
  /** Inbox preview line. Keep it under ~90 characters. */
  preheader: string;
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  heading: string;
  /** Paragraphs, rendered in order. Pre-escape any user-supplied values. */
  body: string[];
  button?: { label: string; url: string };
  /** Shown below the button for clients that strip links. */
  fallbackUrl?: string;
  /** Small closing note, e.g. "If you didn't expect this, ignore it." */
  footnote?: string;
};

export function renderEmail(params: RenderEmailParams): string {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/logo-dark.png`;

  const eyebrow = params.eyebrow
    ? `<p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.accent};">${params.eyebrow}</p>`
    : "";

  const body = params.body
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${COLORS.body};">${paragraph}</p>`,
    )
    .join("");

  const button = params.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
            <tr>
              <td style="border-radius:10px;background-color:${COLORS.accent};">
                <a href="${params.button.url}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${params.button.label}</a>
              </td>
            </tr>
          </table>`
    : "";

  const fallback = params.fallbackUrl
    ? `<p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:20px;color:${COLORS.muted};">Or paste this link into your browser:<br />
            <a href="${params.fallbackUrl}" style="color:${COLORS.accent};word-break:break-all;">${params.fallbackUrl}</a></p>`
    : "";

  const footnote = params.footnote
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${COLORS.border};font-family:${FONT};font-size:12px;line-height:20px;color:${COLORS.muted};">${params.footnote}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(siteConfig.name)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${params.preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.page};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding-bottom:24px;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${logoUrl}" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border-radius:8px;border:0;" />
                  <span style="display:inline-block;vertical-align:middle;padding-left:12px;font-family:${FONT};font-size:16px;font-weight:700;color:${COLORS.heading};">${escapeHtml(siteConfig.shortName)}</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;padding:32px;">
                ${eyebrow}
                <h1 style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:700;color:${COLORS.heading};">${params.heading}</h1>
                ${body}
                ${button}
                ${fallback}
                ${footnote}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;text-align:center;">
                <p style="margin:0;font-family:${FONT};font-size:12px;line-height:20px;color:${COLORS.muted};">${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.location)}<br />
                  <a href="${siteUrl}" style="color:${COLORS.muted};">${siteUrl.replace(/^https?:\/\//, "")}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
