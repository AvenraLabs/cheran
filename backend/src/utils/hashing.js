import crypto from "crypto";

/**
 * Calculates SHA-256 hash of a Buffer or string.
 */
export function calculateSha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}
