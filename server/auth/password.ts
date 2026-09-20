import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function deriveKey(password: string, salt: string, length: number, options: { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validatePasswordShape(password: string) {
  return password.length >= 10 && password.length <= 128;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await deriveKey(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, n, r, p, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !salt || !expectedHex) return false;
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const derived = await deriveKey(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function createRawToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
