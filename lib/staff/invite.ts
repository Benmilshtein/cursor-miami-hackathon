import { randomBytes } from "crypto";

const INVITE_TOKEN_BYTES = 32;
const INVITE_EXPIRY_DAYS = 7;

export const STAFF_INVITE_EXPIRY_DAYS = INVITE_EXPIRY_DAYS;

export function generateStaffInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}

export function getStaffInviteExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d;
}
