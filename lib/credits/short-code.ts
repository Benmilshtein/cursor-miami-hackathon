import { randomInt } from "crypto";

/**
 * Alphabet for short codes: lowercase letters and digits, excluding ambiguous (0, 1, l, o).
 * Produces readable, copy-friendly codes (e.g. a3b2k9x7).
 */
const CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const LENGTH = 8;

export function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    code += CHARS[randomInt(0, CHARS.length)];
  }
  return code;
}

/**
 * Generate a unique short code by trying until one is available.
 * Caller must pass a function that returns true if the code is already taken.
 */
export async function generateUniqueShortCode(
  isTaken: (code: string) => Promise<boolean>
): Promise<string> {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateShortCode();
    if (!(await isTaken(code))) return code;
  }
  throw new Error("Could not generate unique short code after max attempts.");
}
