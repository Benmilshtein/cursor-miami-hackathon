# Team Management Architecture

## Overview

The platform now treats team membership as a first-class domain:

- `team` remains the main participation unit.
- `team_member` is the source of truth for active membership and captaincy.
- `team_invite` stores active and historical join codes.
- `user.teamId` and `user.isTeamLead` stay as denormalized compatibility fields and are kept in sync by the service layer.
- `user.role` supports `participant`, `moderator`, `reviewer`, and `super_admin`.
- `user.twoFactorEnabled` plus `two_factor` support Better Auth 2FA for super admins.

## Schema

### `team`

- `id`
- `name`
- `description`
- `status` (`active` | `archived`)
- `joinCode`
- `memberCount`
- `maxMembers`
- `createdByUserId`
- `archivedAt`
- timestamps

Important DB constraints:

- `memberCount >= 0`
- `memberCount <= maxMembers`
- `maxMembers <= 5`
- `joinCode` is unique

### `team_member`

- `id`
- `teamId`
- `userId`
- `role` (`lead` | `member`)
- `joinedAt`
- `leftAt`
- `removedByUserId`
- timestamps

Important DB constraints:

- one active team membership per user via partial unique index on `userId where leftAt is null`
- one active captain per team via partial unique index on `teamId where role = 'lead' and leftAt is null`

### `team_invite`

- `id`
- `teamId`
- `code`
- `createdByUserId`
- `expiresAt`
- `maxUses`
- `usedCount`
- `revokedAt`
- timestamps

This enables:

- current invite code lookup
- invite rotation
- invite expiry
- invite history for audit/admin needs

## Service layer

Core domain logic lives in `lib/teams/service.ts`.

Implemented operations:

- create team
- join team by invite code
- leave current team
- remove member from current team
- transfer current team lead
- update current team profile and rotate invite
- list current user team
- list current team members
- admin list teams
- admin view team details
- admin force membership updates

Concurrency protections:

- critical membership changes run inside DB transactions
- joins and membership changes lock the target `team` row with `FOR UPDATE`
- DB partial unique indexes prevent duplicate active memberships and duplicate active leads

## API surface

Participant routes:

- `POST /api/teams/create`
- `POST /api/teams/join`
- `POST /api/teams/leave`
- `GET /api/teams/current`
- `PATCH /api/teams/current`
- `GET /api/teams/current/members`
- `POST /api/teams/current/remove-member`
- `POST /api/teams/current/transfer-lead`

Admin routes:

- `GET /api/admin/teams` — list teams (query: `limit`, `offset`, `search`, `status`)
- `GET /api/admin/teams/:teamId` — team details (members, invite, etc.)
- `PATCH /api/admin/teams/:teamId` — update team `name`, `description`
- `POST /api/admin/teams/:teamId/membership` — force membership (assign, remove, transfer lead)
- `GET /api/admin/users` — list users (query: `limit`, `offset`, `search`, `role`)
- `GET /api/admin/users/:userId` — user details
- `PATCH /api/admin/users/:userId` — update user `role`

Admin security route:

- `GET /api/admin/security/2fa`
- `POST /api/admin/security/2fa`
- `DELETE /api/admin/security/2fa`

Super admin UI:

- **`/admin/dashboard`** — Super admin dashboard. Super admins use only this area (they are not participants). Requires 2FA: if not enabled, user is sent to Enable 2FA and linked to `/admin/2fa-setup`; if enabled but not recently verified, an inline step-up form (TOTP code) is shown on the same dashboard; after verification the dashboard content is shown. Sections: Overview, Teams (list, search, filter; click team to edit name/description and manage membership), Users (list, search, filter by role; inline role change). Sidebar: Overview, Teams, Users, Sign out. The 2FA verification cookie lasts 15 minutes.

`POST /api/admin/teams/:teamId/membership` supports:

- `assign-member`
- `remove-member`
- `transfer-lead`

## Super admin and 2FA

Better Auth setup includes:

- `emailAndPassword.enabled = true`
- `emailAndPassword.disableSignUp = false` — sign-up is allowed only for emails listed in `SUPER_ADMIN_EMAILS` (enforced in `user.create.before` hook)
- `twoFactor()` plugin

Super admin bootstrap:

1. Set `SUPER_ADMIN_EMAILS` in `.env` to a comma-separated list of allowed emails (e.g. `SUPER_ADMIN_EMAILS=admin@example.com`).
2. Open **`/admin/login`** and use **Sign up** with one of those emails and a password (min 8 characters). Only emails in `SUPER_ADMIN_EMAILS` can complete sign-up; others get "Sign-up is restricted."
3. Existing super admins use **Sign in** on the same page with email and password.
4. On first authenticated request, any user whose email is in `SUPER_ADMIN_EMAILS` is promoted to `super_admin` (see `syncConfiguredSuperAdmin` in `lib/auth/session.ts`).

Admin access protection:

1. Super admin must have `twoFactorEnabled = true`.
2. Super admin must complete a recent step-up verification through `POST /api/admin/security/2fa`.
3. Admin routes require the signed admin 2FA cookie produced by that verification.

This keeps admin routes protected; the super admin uses email/password at `/admin/login` and can manage teams, users, and processes via the admin API.

## Better Auth onboarding for super admins

The repo exposes the Better Auth password and 2FA endpoints through `/api/auth/*`.

Expected super admin setup flow:

1. Create the super admin account at **`/admin/login`** (Sign up) using an email in `SUPER_ADMIN_EMAILS` and a password.
2. Sign in at `/admin/login` if needed.
3. Set a credential password via Better Auth `setPassword` if not already set (e.g. from sign-up).
4. Enable TOTP via Better Auth `enableTwoFactor`.
5. Verify TOTP via Better Auth.
6. Call `POST /api/admin/security/2fa` with a current code to obtain admin step-up access, or use the inline step-up form on **`/admin/dashboard`** when the verification cookie has expired.

## Future extensions

This model is prepared for:

- hackathon applications
- project submissions
- judging/scoring
- partner credit distribution at team and participant levels
- admin dashboards
- moderation/reviewer roles

Recommended next UI work:

- add create/join team UX on `/profile`
- add invite rotation controls for team leads
- add a super admin security screen for password + TOTP setup
- gate application/submission flows on active team membership

## Migration note

The old schema stored membership only on `user.teamId` and `user.isTeamLead`.

When generating and finalizing the migration:

- backfill active `team_member` rows from existing users with non-null `teamId`
- set captain role from `isTeamLead`
- initialize `team.memberCount`
- create `team_invite` rows from existing `team.joinCode`

Without that backfill, legacy data would authenticate correctly but would not appear in the new membership source of truth.
