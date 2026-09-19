import { describe, expect, it } from "vitest";
import { decryptPrivate, encryptPrivate } from "./privateData";

describe("private data encryption", () => {
  it("encrypts CPF without storing the clear value", () => {
    const cpf = "12345678909";
    const encrypted = encryptPrivate(cpf);
    expect(encrypted).not.toContain(cpf);
    expect(decryptPrivate(encrypted)).toBe(cpf);
  });

  it("uses a fresh nonce for each value", () => {
    const first = encryptPrivate("12345678909");
    const second = encryptPrivate("12345678909");
    expect(first).not.toBe(second);
  });
});
