import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDefaultTenant, getDashboardStats, getTenantBySlug, listCategories, listPendingSubmissions, listPublishedPlaces, listUpcomingEvents, createSubmission, recordAttendance, reviewSubmission } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const defaultTenantInput = z.object({ slug: z.string().min(2).max(80).default("adamantina") });

const resolveTenant = async (slug: string) => {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Município não encontrado ou inativo." });
  return tenant;
};

const municipalAdminProcedure = adminProcedure.use(({ ctx, next }) => {
  if (!["platform_admin", "municipal_admin", "moderator"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não possui permissão para esta ação." });
  }
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  catalog: router({
    list: publicProcedure.input(defaultTenantInput.extend({ categoryId: z.number().int().positive().optional() })).query(async ({ input }) => {
      const tenant = await resolveTenant(input.slug);
      return { tenant, categories: await listCategories(tenant.id), places: await listPublishedPlaces(tenant.id, input.categoryId) };
    }),
    events: publicProcedure.input(defaultTenantInput.extend({ limit: z.number().int().min(1).max(100).optional() })).query(async ({ input }) => {
      const tenant = await resolveTenant(input.slug);
      return { tenant, events: await listUpcomingEvents(tenant.id, input.limit ?? 20) };
    }),
  }),

  submissions: router({
    create: protectedProcedure.input(z.object({ slug: z.string().default("adamantina"), entityType: z.enum(["place", "event", "review", "comment", "photo"]), payload: z.string().min(2).max(50000) })).mutation(async ({ ctx, input }) => {
      const tenant = await resolveTenant(input.slug);
      await createSubmission({ tenantId: tenant.id, submittedBy: ctx.user.id, entityType: input.entityType, payload: input.payload });
      return { success: true } as const;
    }),
  }),

  attendance: router({
    record: protectedProcedure.input(z.object({ slug: z.string().default("adamantina"), eventId: z.number().int().positive(), visitorHash: z.string().min(16).max(128), residenceCity: z.string().max(120).optional(), residenceState: z.string().max(80).optional(), residenceCountry: z.string().max(80).optional(), source: z.enum(["portal", "qr_code"]) })).mutation(async ({ input }) => {
      const tenant = await resolveTenant(input.slug);
      return recordAttendance({ tenantId: tenant.id, ...input });
    }),
  }),

  dashboard: router({
    stats: adminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "platform_admin" && ctx.user.tenantId == null) throw new TRPCError({ code: "FORBIDDEN", message: "Usuário administrativo sem município vinculado." });
      const tenant = await resolveTenant(input.slug);
      if (ctx.user.role !== "platform_admin" && ctx.user.tenantId !== tenant.id) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este município." });
      return { tenant, stats: await getDashboardStats(tenant.id) };
    }),
    pending: municipalAdminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => {
      const tenant = await resolveTenant(input.slug);
      if (ctx.user.role !== "platform_admin" && ctx.user.tenantId !== tenant.id) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este município." });
      return listPendingSubmissions(tenant.id);
    }),
    review: municipalAdminProcedure.input(z.object({ slug: z.string().default("adamantina"), id: z.number().int().positive(), status: z.enum(["approved", "rejected", "needs_changes"]), note: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const tenant = await resolveTenant(input.slug);
      if (ctx.user.role !== "platform_admin" && ctx.user.tenantId !== tenant.id) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este município." });
      await reviewSubmission({ id: input.id, tenantId: tenant.id, reviewerId: ctx.user.id, status: input.status, note: input.note });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
