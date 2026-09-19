import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createEvent,
  createMedia,
  createPlace,
  createQrCode,
  createSubmission,
  acceptInvitation,
  addItineraryItem,
  createInvitation,
  createItinerary,
  getDefaultTenant,
  getDashboardStats,
  getItinerary,
  getInvitationByToken,
  getQrCode,
  getReportSummary,
  getComparativeReport,
  getTenantBySlug,
  listAdminEvents,
  listAdminPlaces,
  listCategories,
  listPendingSubmissions,
  listPublishedPlaces,
  listQrCodes,
  listItineraries,
  listActiveTenants,
  listTenantInvitations,
  listTenantUsers,
  listUpcomingEvents,
  recordAttendance,
  reviewSubmission,
  updateTenantUser,
  updateItineraryItemPositions,
  updateEvent,
  updatePlace,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { sendInvitationEmail } from "./email";
import { ENV } from "./_core/env";

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

const municipalOwnerProcedure = adminProcedure.use(({ ctx, next }) => {
  if (!["platform_admin", "municipal_admin"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Somente administradores podem gerir usuários municipais." });
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

  itineraries: router({
    official: publicProcedure.input(defaultTenantInput).query(async ({ input }) => { const tenant = await resolveTenant(input.slug); return listItineraries(tenant.id); }),
    get: publicProcedure.input(defaultTenantInput.extend({ id: z.number().int().positive() })).query(async ({ input }) => { const tenant = await resolveTenant(input.slug); const route = await getItinerary(input.id, tenant.id); if (!route || (route.status !== "published")) throw new TRPCError({ code: "NOT_FOUND", message: "Roteiro não encontrado." }); return route; }),
    mine: protectedProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await resolveTenant(input.slug); return listItineraries(tenant.id, ctx.user.id); }),
    create: protectedProcedure.input(defaultTenantInput.extend({ title: z.string().min(2).max(180), description: z.string().max(5000).optional(), status: z.enum(["draft", "published"]).default("draft"), durationMinutes: z.number().int().nonnegative().optional(), distanceKm: z.number().nonnegative().optional(), items: z.array(z.object({ placeId: z.number().int().positive().optional(), eventId: z.number().int().positive().optional(), position: z.number().int().nonnegative(), note: z.string().max(500).optional() })).max(100).default([]) })).mutation(async ({ ctx, input }) => { const tenant = await resolveTenant(input.slug); const routeId = await createItinerary({ tenantId: tenant.id, ownerId: ctx.user.id, title: input.title, slug: `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, description: input.description, status: input.status, durationMinutes: input.durationMinutes, distanceKm: input.distanceKm?.toString() }); for (const item of input.items) await addItineraryItem({ itineraryId: routeId, placeId: item.placeId, eventId: item.eventId, position: item.position, note: item.note }); return { success: true } as const; }),
    optimize: protectedProcedure.input(defaultTenantInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const tenant = await resolveTenant(input.slug); const route = await getItinerary(input.id, tenant.id); if (!route || (route.ownerId !== ctx.user.id && !["platform_admin", "municipal_admin"].includes(ctx.user.role))) throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode alterar este roteiro." }); const remaining = route.items.filter((item) => item.latitude !== null && item.longitude !== null); const ordered: typeof remaining = []; let current = remaining.shift(); while (current) { ordered.push(current); if (!remaining.length) break; const nextIndex = remaining.reduce((best, item, index) => { const distance = Math.hypot(Number(item.latitude) - Number(current?.latitude), Number(item.longitude) - Number(current?.longitude)); const bestDistance = Math.hypot(Number(remaining[best]?.latitude) - Number(current?.latitude), Number(remaining[best]?.longitude) - Number(current?.longitude)); return distance < bestDistance ? index : best; }, 0); current = remaining.splice(nextIndex, 1)[0]; } await updateItineraryItemPositions(ordered.map((item, position) => ({ id: item.id, position })), route.id); return { success: true, orderedIds: ordered.map((item) => item.id) } as const; }),
  }),

  submissions: router({
    create: protectedProcedure.input(z.object({ slug: z.string().default("adamantina"), entityType: z.enum(["place", "event", "review", "comment", "photo"]), payload: z.string().min(2).max(50000) })).mutation(async ({ ctx, input }) => { const tenant = await resolveTenant(input.slug); await createSubmission({ tenantId: tenant.id, submittedBy: ctx.user.id, entityType: input.entityType, payload: input.payload }); return { success: true } as const; }),
  }),

  invitations: router({
    get: publicProcedure.input(z.object({ token: z.string().min(20).max(96) })).query(async ({ input }) => { const invitation = await getInvitationByToken(input.token); if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido ou expirado." }); return { email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt }; }),
    accept: protectedProcedure.input(z.object({ token: z.string().min(20).max(96) })).mutation(async ({ ctx, input }) => { const invitation = await getInvitationByToken(input.token); if (!invitation || invitation.email.toLowerCase() !== (ctx.user.email ?? "").toLowerCase()) throw new TRPCError({ code: "FORBIDDEN", message: "O convite não corresponde ao e-mail autenticado." }); try { await acceptInvitation(input.token, ctx.user.id); return { success: true } as const; } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Convite inválido ou expirado." }); } }),
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
    officialItineraries: municipalAdminProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listItineraries(tenant.id); }),
    createOfficialItinerary: municipalAdminProcedure.input(defaultTenantInput.extend({ title: z.string().min(2).max(180), description: z.string().max(5000).optional(), durationMinutes: z.number().int().nonnegative().optional(), distanceKm: z.number().nonnegative().optional(), items: z.array(z.object({ placeId: z.number().int().positive().optional(), eventId: z.number().int().positive().optional(), position: z.number().int().nonnegative(), note: z.string().max(500).optional() })).max(100).default([]) })).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const routeId = await createItinerary({ tenantId: tenant.id, title: input.title, slug: `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, description: input.description, status: "published", durationMinutes: input.durationMinutes, distanceKm: input.distanceKm?.toString() }); for (const item of input.items) await addItineraryItem({ itineraryId: routeId, placeId: item.placeId, eventId: item.eventId, position: item.position, note: item.note }); return { success: true } as const; }),
    users: municipalOwnerProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listTenantUsers(tenant.id); }),
    updateUser: municipalOwnerProcedure.input(defaultTenantInput.extend({ id: z.number().int().positive(), role: z.enum(["municipal_admin", "moderator", "analyst", "partner"]).optional(), status: z.enum(["active", "invited", "suspended"]).optional() })).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); await updateTenantUser(input.id, tenant.id, { role: input.role, status: input.status }); return { success: true } as const; }),
    inviteUser: municipalOwnerProcedure.input(defaultTenantInput.extend({ email: z.string().email(), role: z.enum(["municipal_admin", "moderator", "analyst", "partner"]) })).mutation(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); const token = nanoid(48); const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); await createInvitation({ tenantId: tenant.id, email: input.email, role: input.role, token, invitedBy: ctx.user.id, expiresAt }); const path = `/convites/${token}`; const url = `${ENV.publicAppUrl}${path}`; const emailStatus = await sendInvitationEmail({ to: input.email, role: input.role, inviteUrl: url || path, expiresAt }); return { token, url: url || path, expiresAt, emailStatus }; }),
    invitations: municipalOwnerProcedure.input(defaultTenantInput).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); return listTenantInvitations(tenant.id); }),
    report: adminProcedure.input(defaultTenantInput.extend({ start: z.coerce.date(), end: z.coerce.date() })).query(async ({ ctx, input }) => { const tenant = await ensureTenantAccess(ctx.user, input.slug); if (input.end < input.start) throw new TRPCError({ code: "BAD_REQUEST", message: "O período final deve ser posterior ao inicial." }); return { tenant, range: { start: input.start, end: input.end }, summary: await getReportSummary(tenant.id, input.start, input.end) }; }),
    comparison: adminProcedure.input(z.object({ slug: z.string().default("adamantina"), start: z.coerce.date(), end: z.coerce.date(), tenantIds: z.array(z.number().int().positive()).optional() })).query(async ({ ctx, input }) => { if (input.end < input.start) throw new TRPCError({ code: "BAD_REQUEST", message: "O período final deve ser posterior ao inicial." }); const baseTenant = await ensureTenantAccess(ctx.user, input.slug); const allowedIds = ctx.user.role === "platform_admin" ? (input.tenantIds ?? (await listActiveTenants()).map((tenant) => tenant.id)) : [baseTenant.id]; return { range: { start: input.start, end: input.end }, data: await getComparativeReport(allowedIds, input.start, input.end) }; }),
  }),
});

export type AppRouter = typeof appRouter;
