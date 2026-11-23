import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compare the bearer token with CRON_SECRET in constant time.
 * Both values are hashed first, so the buffers always have the same length.
 */
export function isAuthorizedCronCall(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if the secret is not configured, no caller is authorized.
  if (!secret || !authHeader) return false;
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const actual = createHash("sha256").update(authHeader).digest();
  return timingSafeEqual(expected, actual);
}
