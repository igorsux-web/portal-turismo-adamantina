import { describe, expect, it } from "vitest";
import { sendInvitationEmail } from "./email";

describe("invitation email configuration", () => {
  it("keeps sending disabled when Resend credentials are not configured", async () => {
    const status = await sendInvitationEmail({ to: "servidor@example.com", role: "moderator", inviteUrl: "/convites/teste", expiresAt: new Date() });
    expect(status).toBe("not_configured");
  });
});
