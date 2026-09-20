import { describe, expect, it } from "vitest";
import { createRawToken, hashPassword, hashToken, normalizeEmail, validatePasswordShape, verifyPassword } from "./auth/password";

describe("password authentication", () => {
  it("normalizes email and enforces password length", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
    expect(validatePasswordShape("short")).toBe(false);
    expect(validatePasswordShape("uma-senha-segura")).toBe(true);
  });

  it("hashes passwords and rejects incorrect credentials", async () => {
    const hash = await hashPassword("uma-senha-segura");
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await verifyPassword("uma-senha-segura", hash)).toBe(true);
    expect(await verifyPassword("senha-incorreta", hash)).toBe(false);
  });

  it("generates one-way token hashes", () => {
    const token = createRawToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).not.toBe(token);
  });
});
