import { beforeEach, describe, expect, it } from "vitest";
import { requestProtection } from "./requestProtection";
import { clearRateLimitBuckets } from "./rateLimit";

function responseMock() {
  const headers = new Map<string, string | number>();
  return {
    headers,
    setHeader(name: string, value: string | number) { headers.set(name, value); },
    status(code: number) { return { json: (body: unknown) => ({ code, body }) }; },
    json(body: unknown) { return body; },
  };
}

describe("request protection", () => {
  beforeEach(() => clearRateLimitBuckets());

  it("rejects API mutations without an official origin", () => {
    const response = responseMock();
    let continued = false;
    const result = requestProtection({ path: "/api/trpc/admin.updatePlace", method: "POST", ip: "127.0.0.1", get: () => undefined } as never, response as never, () => { continued = true; });

    expect(result).toMatchObject({ code: 403 });
    expect(continued).toBe(false);
  });

  it("allows API mutations from localhost", () => {
    const response = responseMock();
    let continued = false;
    const result = requestProtection({ path: "/api/trpc/admin.updatePlace", method: "POST", ip: "127.0.0.1", get: (name: string) => name === "origin" ? "http://localhost:3000" : undefined } as never, response as never, () => { continued = true; });

    expect(result).toBeUndefined();
    expect(continued).toBe(true);
  });
});

