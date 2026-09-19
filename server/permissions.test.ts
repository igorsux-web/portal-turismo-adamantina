import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertCanPublishContent } from "./routers";

describe("content publication permissions", () => {
  it("rejects direct publication by moderators", () => {
    expect(() => assertCanPublishContent("moderator", "approved")).toThrowError(TRPCError);
  });

  it("allows moderators to save non-published content", () => {
    expect(() => assertCanPublishContent("moderator", "draft")).not.toThrow();
    expect(() => assertCanPublishContent("moderator", "pending")).not.toThrow();
  });

  it("allows municipal administrators to publish", () => {
    expect(() => assertCanPublishContent("municipal_admin", "approved")).not.toThrow();
    expect(() => assertCanPublishContent("platform_admin", "approved")).not.toThrow();
  });
});

