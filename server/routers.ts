import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createEvent,
  createMedia,
  createPlace,
  createQrCode,
  createSubmission,
  getDefaultTenant,
  getDashboardStats,
  getQrCode,
  getTenantBySlug,
  listAdminEvents,
  listAdminPlaces,
  listCategories,
  listPendingSubmissions,
  listPublishedPlaces,
  listQrCodes,
  listUpcomingEvents,
  recordAttendance,
  reviewSubmission,
  updateEvent,
  updatePlace,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const defaultTenantInput = z.object({ slug: z.string().min(2).max(80).default("adamantina") });
const statusInput = z.enum(["draft", "pending", "approved", "rejected", "archived"]);

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

const ensureTenantAccess = async (user: { role: string; tenantId: number | null }, slug?: string) => {
  const tenant = await resolveTenant(slug ?? "adamantina");
  if (user.role !== "platform_admin" && user.tenantId !== tenant.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui acesso a este município." });
  }
  return tenant;
};

const placeInput = z.object({
  name: z.string().min(2).max(180), slug: z.string().min(2).max(180), categoryId: z.number().int().positive().optional(), type: z.string().max(120).optional(), description: z.string().max(10000).optional(), address: z.string().max(500).optional(), neighborhood: z.string().max(120).optional(), city: z.string().max(120).default("Adamantina"), state: z.string().length(2).default("SP"), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), phone: z.string().max(40).optional(), email: z.string().email().max(320).optional(), website: z.string().url().max(500).optional(), openingHours: z.string().max(5000).optional(), accessibility: z.string().max(5000).optional(), priceRange: z.string().max(30).optional(), capacity: z.number().int().nonnegative().optional(), cadasturNumber: z.string().max(80).optional(), status: statusInput.default("draft") });
const eventInput = z.object({
  title: z.string().min(2).max(180), slug: z.string().min(2).max(180), description: z.string().max(10000).optional(), startsAt: z.coerce.date(), endsAt: z.coerce.date().optional(), venueName: z.string().max(180).optional(), address: z.string().max(500).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), organizer: z.string().max(180).optional(), capacity: z.number().int().nonnegative().optional(), price: z.string().max(80).optional(), accessibility: z.string().max(5000).optional(), status: statusInput.default("draft") });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),

  catalog: router({
    list: publicProcedure.input(defaultTenantInput.extend({ categoryId: z.number().int().positive().optional() })).query(async ({ input }) => { const tenant = await resolveTenant(input.slug); return { tenant, categories: await listCategories(tenant.id), places: await listPublishedPlaces(tenant.id, input.categoryId) }; }),
    events: publicProcedure.input(defaultTenantInput.extend({ limit: z.number().int().min(1).max(100).optional() })).query(async ({ input }) => { const tenant = await resolveTenant(input.slug); return { tenant, events: await listUpcomingEvents(tenant.id, input.limit ?? 20) }; }),
  }),

  submissions: router({
    create: protectedProcedure.input(z.object({ slug: z.string().default("adamantina"), entityType: z.enum(["place", "event", "review", "comment", "photo"]), payload: z.string().min(2).max(50000) })).mutation(async ({ ctx, input }) => { const tenant = await resolveTenant(input.slug); await createSubmission({ tenantId: tenant.id, submittedBy: ctx.user.id, entityType: input.entityType, payload: input.payload }); return { success: true } as const; }),
  }),

  attendance: router({
    record: protectedProcedure.input(z.object({ slug: z.string().default("adamantina"), eventId: z.number().int().positive(), visitorHash: z.string().min(16).max(128), residenceCity: z.string().max(120).optional(), residenceState: z.string().max(80).optional(), residenceCountry: z.string().max(80).optional(), source: z.enum(["portal", "qr_code"]) })).mutation(async ({ input }) => { const tenant = await resolveTenant(input.slug); return recordAttendance({ tenantId: tenant.id, ...input }); }),
    byQr: publicProcedure.input(z.object({ code: z.string().min(12).max(96) })).query(async ({ input }) => { const qr = await getQrCode(input.code); if (!qr) throw new TRPCError({ code: "NOT_FOUND", message: "QR Code inativo ou expirado." }); return { eventId: qr.eventId, tenantId: qr.tenantId }; }),
  }),

  dashboard: router({
    stats: adminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return { tenant, stats: await getDashboardStats(tenant.id) }; }),
    pending: municipalAdminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listPendingSubmissions(tenant.id); }),
    review: municipalAdminProcedure.input(z.object({ slug: z.string().default("adamantina"), id: z.number().int().positive(), status: z.enum(["approved", "rejected", "needs_changes"]), note: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); await reviewSubmission({ id: input.id, tenantId: tenant.id, reviewerId: ctx.user.id, status: input.status, note: input.note }); return { success: true } as const; }),
  }),

  admin: router({
    places: municipalAdminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listAdminPlaces(tenant.id); }),
    createPlace: municipalAdminProcedure.input(defaultTenantInput.merge(placeInput)).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const { slug: _slug, ...payload } = input; await createPlace({ ...payload, latitude: payload.latitude?.toString(), longitude: payload.longitude?.toString(), slug: _slug, tenantId: tenant.id, submittedBy: ctx.user.id }); return { success: true } as const; }),
    updatePlace: municipalAdminProcedure.input(defaultTenantInput.extend({ id: z.number().int().positive() }).merge(placeInput.partial())).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const { id, slug: _slug, ...payload } = input; await updatePlace(id, tenant.id, { ...payload, latitude: payload.latitude?.toString(), longitude: payload.longitude?.toString(), ...( _slug ? { slug: _slug } : {}) }); return { success: true } as const; }),
    events: municipalAdminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listAdminEvents(tenant.id); }),
    createEvent: municipalAdminProcedure.input(defaultTenantInput.merge(eventInput)).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const { slug: _slug, ...payload } = input; await createEvent({ ...payload, latitude: payload.latitude?.toString(), longitude: payload.longitude?.toString(), slug: _slug, tenantId: tenant.id, submittedBy: ctx.user.id }); return { success: true } as const; }),
    updateEvent: municipalAdminProcedure.input(defaultTenantInput.extend({ id: z.number().int().positive() }).merge(eventInput.partial())).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const { id, slug: _slug, ...payload } = input; await updateEvent(id, tenant.id, { ...payload, latitude: payload.latitude?.toString(), longitude: payload.longitude?.toString(), ...( _slug ? { slug: _slug } : {}) }); return { success: true } as const; }),
    uploadMedia: municipalAdminProcedure.input(z.object({ slug: z.string().default("adamantina"), entityType: z.enum(["place", "event"]), entityId: z.number().int().positive(), fileName: z.string().regex(/^[\w .-]+$/).max(180), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(100) })).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const raw = input.base64.replace(/^data:[^;]+;base64,/, ""); const buffer = Buffer.from(raw, "base64"); if (buffer.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "A imagem deve ter no máximo 5 MB." }); const upload = await storagePut(`${tenant.slug}/${input.entityType}/${input.entityId}/${nanoid(10)}-${input.fileName}`, buffer, input.mimeType); await createMedia({ tenantId: tenant.id, entityType: input.entityType, entityId: input.entityId, fileKey: upload.key, url: upload.url, mimeType: input.mimeType, createdBy: ctx.user.id }); return upload; }),
    createQrCode: municipalAdminProcedure.input(defaultTenantInput.extend({ eventId: z.number().int().positive(), label: z.string().max(120).optional(), expiresAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const code = nanoid(32); await createQrCode({ tenantId: tenant.id, eventId: input.eventId, code, label: input.label, expiresAt: input.expiresAt, createdBy: ctx.user.id }); return { code, url: `/presenca/${code}` }; }),
    qrCodes: municipalAdminProcedure.input(defaultTenantInput.extend({ eventId: z.number().int().positive() })).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listQrCodes(input.eventId, tenant.id); }),
  }),
});

export type AppRouter = typeof appRouter;
