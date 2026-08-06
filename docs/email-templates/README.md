# Auth email templates

Supabase renders its own Auth emails (signup confirmation, password reset, magic
link, …) even when they are delivered through Resend SMTP. The HTML lives in the
Supabase dashboard, not in this repo, so the files here are paste-ready copies.

The files are generated — edit `scripts/render-auth-emails.mjs`, then run:

```bash
npm run email:templates
```

Transactional emails our own code sends (staff invites) use
`lib/email/template.ts` instead and need no manual step. Keep the two layouts in
sync when the brand changes.

## Pasting into Supabase

Go to **Authentication → Emails** (Email Templates), pick a template, paste the
matching file into the message body, and set the subject:

| Supabase template     | File                     | Subject                                              |
| --------------------- | ------------------------ | ---------------------------------------------------- |
| Confirm signup        | `confirm-signup.html`    | Confirm your email – Cursor Miami: Ship Night        |
| Invite user           | `invite-user.html`       | You're invited to Cursor Miami: Ship Night           |
| Magic Link            | `magic-link.html`        | Your sign-in link – Cursor Miami: Ship Night         |
| Change Email Address  | `change-email.html`      | Confirm your new email – Cursor Miami: Ship Night    |
| Reset Password        | `reset-password.html`    | Reset your password – Cursor Miami: Ship Night       |
| Reauthentication      | `reauthentication.html`  | Your verification code – Cursor Miami: Ship Night    |

Save each template individually — the dashboard does not save them as a group.

## Sender identity

The templates only control the body. The name recipients see comes from
**Project Settings → Authentication → SMTP Settings**:

- Sender email: `no-reply@cursormiami.com` (must be a verified Resend domain)
- Sender name: `Cursor Miami: Ship Night`

Set the same address in `EMAIL_FROM` so app-sent emails match:

```
EMAIL_FROM=Cursor Miami: Ship Night <no-reply@cursormiami.com>
```

## Notes

- `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, and `{{ .NewEmail }}`
  are Supabase variables. Leave them exactly as written.
- The layout is table-based with inline styles because Gmail and Outlook strip
  `<style>` blocks and flex/grid layout.
- The logo is loaded from `https://app.cursormiami.com/logo-dark.png`. It has an
  empty `alt` so a blocked image leaves no broken placeholder.
