import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, decodeOAuthState, encodeOAuthState, OAUTH_STATE_COOKIE } from "@shared/const";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const LOCAL_STATE_COOKIE = "oauth_state";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

type GoogleClaims = { sub: string; email?: string; email_verified?: boolean; name?: string };

function isSecureRequest(req: Request) {
  const forwarded = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return req.protocol === "https" || protocol?.trim().toLowerCase() === "https";
}

function redirectUri(req: Request) {
  return ENV.googleRedirectUri || `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;
}

function stateCookieName(req: Request) {
  return isSecureRequest(req) ? OAUTH_STATE_COOKIE : LOCAL_STATE_COOKIE;
}

function setStateCookie(req: Request, res: Response, nonce: string) {
  res.cookie(stateCookieName(req), nonce, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
}

function clearStateCookies(req: Request, res: Response) {
  const options = { httpOnly: true, secure: isSecureRequest(req), sameSite: "lax" as const, path: "/" };
  res.clearCookie(OAUTH_STATE_COOKIE, options);
  res.clearCookie(LOCAL_STATE_COOKIE, options);
}

function requireGoogleConfig() {
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    throw new Error("Google OAuth não está configurado: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são obrigatórios.");
  }
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/oauth/google/start", (req, res) => {
    try {
      requireGoogleConfig();
      const nonce = randomUUID();
      const uri = redirectUri(req);
      const state = encodeOAuthState({ redirectUri: uri, nonce });
      setStateCookie(req, res, nonce);
      const url = new URL(GOOGLE_AUTH_URL);
      url.searchParams.set("client_id", ENV.googleClientId);
      url.searchParams.set("redirect_uri", uri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("prompt", "select_account");
      res.redirect(302, url.toString());
    } catch (error) {
      console.error("[Google OAuth] Start failed", error);
      res.status(503).send("Login Google ainda não está configurado.");
    }
  });

  app.get("/api/oauth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    if (!code || !state) {
      res.status(400).send("Código e state são obrigatórios.");
      return;
    }

    const decoded = decodeOAuthState(state);
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const expectedNonce = cookies[stateCookieName(req)] ?? cookies[OAUTH_STATE_COOKIE] ?? cookies[LOCAL_STATE_COOKIE];
    clearStateCookies(req, res);
    if (!decoded.nonce || decoded.nonce !== expectedNonce || decoded.redirectUri !== redirectUri(req)) {
      res.status(403).send("Sessão OAuth inválida ou expirada.");
      return;
    }

    try {
      requireGoogleConfig();
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: decoded.redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
      const tokenPayload = (await tokenResponse.json()) as { id_token?: string };
      if (!tokenPayload.id_token) throw new Error("Google não retornou id_token");

      const { payload } = await jwtVerify(tokenPayload.id_token, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: ENV.googleClientId,
      });
      const claims = payload as GoogleClaims;
      if (!claims.sub || !claims.email || claims.email_verified !== true) {
        throw new Error("Conta Google sem e-mail verificado");
      }

      await db.upsertUser({
        openId: `google:${claims.sub}`,
        name: claims.name ?? claims.email,
        email: claims.email.toLowerCase(),
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(`google:${claims.sub}`, {
        name: claims.name ?? claims.email,
        expiresInMs: SESSION_MAX_AGE_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: SESSION_MAX_AGE_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).send("Não foi possível concluir o login Google.");
    }
  });
}
