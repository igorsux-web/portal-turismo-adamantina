import type { NextFunction, Request, Response } from "express";
import { ENV } from "./_core/env";
import { checkRateLimit, getRequestIp } from "./rateLimit";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const API_LIMIT = 240;
const API_WINDOW_MS = 60_000;

function configuredOrigins() {
  return new Set([ENV.publicAppUrl, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean).map((origin) => origin.replace(/\/$/, "")));
}

function requestOrigin(req: Request) {
  const origin = req.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const referer = req.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function requestProtection(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/trpc")) return next();

  const ip = getRequestIp(req);
  const limit = checkRateLimit({ key: `http:${ip}`, limit: API_LIMIT, windowMs: API_WINDOW_MS });
  res.setHeader("X-RateLimit-Limit", API_LIMIT);
  res.setHeader("X-RateLimit-Remaining", limit.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(limit.resetAt / 1000));
  if (!limit.allowed) return res.status(429).json({ error: "Muitas requisições. Tente novamente mais tarde." });

  if (MUTATION_METHODS.has(req.method)) {
    const origin = requestOrigin(req);
    const allowed = configuredOrigins();
    if (!origin || !allowed.has(origin)) {
      return res.status(403).json({ error: "Origem da requisição não autorizada." });
    }
  }

  return next();
}
