import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("dashboard access control", () => {
  it("rejects unauthenticated dashboard access", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats({ slug: "adamantina" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
