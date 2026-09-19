import { describe, expect, it } from "vitest";
import { getPlatformAdminEmails } from "./_core/env";

describe("platform admin email allowlist", () => {
  it("normalizes whitespace and case", () => {
    expect(getPlatformAdminEmails(" Igor.Sux@gmail.com,  ADMIN@EXAMPLE.COM ")).toEqual(["igor.sux@gmail.com", "admin@example.com"]);
  });

  it("ignores empty entries", () => {
    expect(getPlatformAdminEmails(" , ,igor.sux@gmail.com,, ")).toEqual(["igor.sux@gmail.com"]);
  });
});
