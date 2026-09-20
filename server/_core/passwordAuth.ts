import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import * as db from "../db";
import { ENV } from "./env";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { checkRateLimit, getRequestIp } from "../rateLimit";
import { createRawToken, hashPassword, hashToken, normalizeEmail, validatePasswordShape, verifyPassword } from "../auth/password";
import { sendAuthEmail } from "../email";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Scope = "user" | "admin";

function baseUrl(req: Request) {
  return ENV.publicAppUrl || `${req.protocol}://${req.get("host")}`;
}

function setSession(req: Request, res: Response, openId: string, name: string) {
  return sdk.createSessionToken(openId, { name, expiresInMs: 12 * 60 * 60 * 1000 }).then((token) => {
    res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: 12 * 60 * 60 * 1000 });
  });
}

function rejectRateLimit(req: Request, res: Response) {
  const result = checkRateLimit({ key: `password-auth:${getRequestIp(req)}`, limit: 12, windowMs: 15 * 60 * 1000 });
  if (!result.allowed) {
    res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
    return true;
  }
  return false;
}

function sendVerificationEmail(req: Request, email: string, token: string) {
  const url = `${baseUrl(req)}/verificar-email?token=${encodeURIComponent(token)}`;
  return sendAuthEmail({
    to: email,
    subject: "Confirme seu e-mail — Portal de Turismo",
    text: `Confirme seu e-mail acessando: ${url}. Este link expira em 24 horas.`,
    html: `<p>Confirme seu e-mail para ativar sua conta no Portal de Turismo.</p><p><a href="${url}">Confirmar e-mail</a></p><p>O link expira em 24 horas.</p>`,
  });
}

function sendResetEmail(req: Request, email: string, token: string) {
  const url = `${baseUrl(req)}/redefinir-senha?token=${encodeURIComponent(token)}`;
  return sendAuthEmail({
    to: email,
    subject: "Redefinição de senha — Portal de Turismo",
    text: `Redefina sua senha acessando: ${url}. Este link expira em 30 minutos.`,
    html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${url}">Redefinir senha</a></p><p>O link expira em 30 minutos.</p>`,
  });
}

export function registerPasswordAuthRoutes(app: Express) {
  app.post("/api/auth/password/register", async (req, res) => {
    if (rejectRateLimit(req, res)) return;
    const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !email.includes("@") || name.length < 2 || name.length > 160 || !validatePasswordShape(password)) {
      res.status(400).json({ error: "Informe nome, e-mail válido e senha com pelo menos 10 caracteres." });
      return;
    }
    const existing = await db.getUserByEmail(email);
    if (existing) {
      res.status(202).json({ message: "Se o cadastro puder ser concluído, enviaremos instruções para o e-mail informado." });
      return;
    }
    const user = await db.createUserWithPassword({
      openId: `email:${randomUUID()}`,
      name,
      email,
      passwordHash: await hashPassword(password),
      loginMethod: "password",
      role: ENV.platformAdminEmails.includes(email) ? "platform_admin" : "user",
      status: "active",
    });
    const rawToken = createRawToken();
    await db.createAuthToken({ userId: user.id, type: "email_verification", tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) });
    const emailStatus = await sendVerificationEmail(req, email, rawToken);
    res.status(201).json({ message: "Cadastro criado. Verifique seu e-mail antes de entrar.", emailDelivery: emailStatus === "sent" ? "sent" : "pending_configuration" });
  });

  app.post("/api/auth/password/login", async (req, res) => {
    if (rejectRateLimit(req, res)) return;
    const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const scope: Scope = req.body?.scope === "admin" ? "admin" : "user";
    const user = email ? await db.getUserByEmail(email) : undefined;
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "E-mail ou senha inválidos." });
      return;
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      res.status(423).json({ error: "Conta temporariamente bloqueada. Tente novamente mais tarde." });
      return;
    }
    if (user.status === "suspended") {
      res.status(403).json({ error: "Esta conta está suspensa." });
      return;
    }
    if (scope === "admin" && !["platform_admin", "municipal_admin", "moderator", "analyst", "partner"].includes(user.role)) {
      res.status(403).json({ error: "Este e-mail não está autorizado para a área da Secretaria." });
      return;
    }
    if (!user.emailVerifiedAt) {
      res.status(403).json({ error: "Confirme seu e-mail antes de entrar." });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      await db.updateUserAuthState(user.id, { failedLoginAttempts: attempts, lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null });
      res.status(401).json({ error: "E-mail ou senha inválidos." });
      return;
    }
    await db.updateUserAuthState(user.id, { failedLoginAttempts: 0, lockedUntil: null, lastSignedIn: new Date() });
    await setSession(req, res, user.openId, user.name ?? user.email ?? "Usuário");
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.post("/api/auth/password/forgot", async (req, res) => {
    if (rejectRateLimit(req, res)) return;
    const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
    const user = email ? await db.getUserByEmail(email) : undefined;
    if (user?.passwordHash) {
      const rawToken = createRawToken();
      await db.createAuthToken({ userId: user.id, type: "password_reset", tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) });
      await sendResetEmail(req, email, rawToken);
    }
    res.status(202).json({ message: "Se existir uma conta para este e-mail, enviaremos instruções de recuperação." });
  });

  app.post("/api/auth/password/verify-email", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const authToken = token ? await db.getValidAuthToken(hashToken(token), "email_verification") : undefined;
    if (!authToken) {
      res.status(400).json({ error: "Link de verificação inválido ou expirado." });
      return;
    }
    await db.updateUserAuthState(authToken.userId, { emailVerifiedAt: new Date(), status: "active" });
    await db.consumeAuthToken(authToken.id);
    res.json({ success: true, message: "E-mail confirmado. Você já pode entrar." });
  });

  app.post("/api/auth/password/reset", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!validatePasswordShape(password)) {
      res.status(400).json({ error: "A senha deve ter entre 10 e 128 caracteres." });
      return;
    }
    const authToken = token ? await db.getValidAuthToken(hashToken(token), "password_reset") : undefined;
    if (!authToken) {
      res.status(400).json({ error: "Link de recuperação inválido ou expirado." });
      return;
    }
    await db.updateUserAuthState(authToken.userId, { passwordHash: await hashPassword(password), failedLoginAttempts: 0, lockedUntil: null });
    await db.consumeAuthToken(authToken.id);
    res.json({ success: true, message: "Senha redefinida. Você já pode entrar." });
  });
}
