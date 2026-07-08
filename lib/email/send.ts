/**
 * Send transactional email. Uses Resend when RESEND_API_KEY is set;
 * otherwise logs the payload (dev) or no-ops.
 *
 * Local testing with Resend: use RESEND_API_KEY and do NOT set EMAIL_FROM.
 * Then "from" will be onboarding@resend.dev (no domain verification needed).
 * For production: verify your domain at resend.com/domains and set EMAIL_FROM.
 */

const RESEND_API = "https://api.resend.com/emails";

/** Resend's test sender - works without domain verification (for local dev). */
const RESEND_DEV_FROM = "48H <onboarding@resend.dev>";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    params.from ?? process.env.EMAIL_FROM ?? RESEND_DEV_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
    }
    if (process.env.NODE_ENV === "development") {
      // Dev-only: omit recipient address from logs (copy link from htmlPreview if needed)
      console.info("[email] (no RESEND_API_KEY) would send:", {
        subject: params.subject,
        htmlPreview: params.html.slice(0, 200) + "...",
      });
    }
    return { ok: true };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || `HTTP ${res.status}` };
  }

  return { ok: true };
}
