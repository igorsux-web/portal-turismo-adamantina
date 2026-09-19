import { describe, expect, it } from "vitest";
import { hashInvitationToken } from "./db";

describe("invitation token protection", () => {
  it("stores a deterministic SHA-256 digest instead of the raw token", () => {
    const token = "invite-token-that-must-never-be-stored";
    const digest = hashInvitationToken(token);

    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]+$/);
    expect(digest).not.toContain(token);
    expect(hashInvitationToken(token)).toBe(digest);
  });

  it("produces different digests for different tokens", () => {
    expect(hashInvitationToken("token-a")).not.toBe(hashInvitationToken("token-b"));
  });
});

