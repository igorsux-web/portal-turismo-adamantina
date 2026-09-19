import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkRateLimit, getRequestIp } from "../rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const rate = checkRateLimit({
    key: `trpc:${getRequestIp(ctx.req)}:${ctx.user.id}:${ctx.user.tenantId ?? "platform"}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas requisições. Tente novamente mais tarde." });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const administrativeRoles = ['platform_admin', 'municipal_admin', 'moderator', 'analyst'] as const;
    if (!ctx.user || !administrativeRoles.includes(ctx.user.role as typeof administrativeRoles[number])) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
