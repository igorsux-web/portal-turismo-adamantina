import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { createContext } from "../server/_core/context";
import { securityHeaders } from "../server/security";
import { requestProtection } from "../server/requestProtection";
import { healthHandler } from "../server/health";
import { appRouter } from "../server/routers";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", false);
app.use(securityHeaders);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ limit: "8mb", extended: true }));
app.get("/healthz", healthHandler);
registerStorageProxy(app);
registerOAuthRoutes(app);
app.use(requestProtection);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default app;
