import type { RequestHandler } from "express";

/**
 * Baseline de hardening HTTP. CSP fica deliberadamente restritiva para
 * framing e tipos; scripts e estilos continuam sob controle do bundle/Vite.
 */
export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  // The Manus preview is rendered in a controlled iframe. Allow only the
  // current origin and Manus preview hosts; unknown origins remain blocked.
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://*.manus.computer https://*.manus.ai; object-src 'none'; base-uri 'self'");

  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.protocol === "https" || (typeof forwardedProto === "string" && forwardedProto.split(",").some((item) => item.trim() === "https"));
  if (isHttps) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
};
