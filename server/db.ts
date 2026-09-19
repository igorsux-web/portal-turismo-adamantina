import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  attendance,
  auditLogs,
  categories,
  events,
  invitations,
  itineraryItems,
  itineraries,
  media,
  qrCodes,
  places,
  reviews,
  comments,
  submissions,
  tenants,
  users,
  visitorProfiles,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.tenantId !== undefined) {
    values.tenantId = user.tenantId;
    updateSet.tenantId = user.tenantId;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "platform_admin";
    updateSet.role = "platform_admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getVisitorProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(visitorProfiles).where(eq(visitorProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertVisitorProfile(userId: number, input: Partial<typeof visitorProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(visitorProfiles).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getVisitorProfile(userId);
}

export async function getTenantBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(and(eq(tenants.slug, slug), eq(tenants.status, "active"))).limit(1);
  return result[0];
}

export async function getDefaultTenant() {
  return getTenantBySlug("adamantina");
}

export async function listPublishedPlaces(tenantId: number, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(places.tenantId, tenantId), eq(places.status, "approved")];
  if (categoryId) filters.push(eq(places.categoryId, categoryId));
  return db.select().from(places).where(and(...filters)).orderBy(asc(places.name));
}

export async function getPublishedPlace(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(places).where(and(eq(places.id, id), eq(places.tenantId, tenantId), eq(places.status, "approved"))).limit(1);
  return result[0];
}

export async function getPublishedEvent(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(and(eq(events.id, id), eq(events.tenantId, tenantId), eq(events.status, "approved"))).limit(1);
  return result[0];
}

export async function listPublicMedia(entityType: "place" | "event", entityId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: media.id, url: media.url, altText: media.altText, mimeType: media.mimeType }).from(media).where(and(eq(media.entityType, entityType), eq(media.entityId, entityId), eq(media.tenantId, tenantId))).orderBy(asc(media.createdAt));
}

export async function listMapPoints(tenantId: number) {
  const db = await getDb();
  if (!db) return { places: [], events: [] };
  const [placePoints, eventPoints] = await Promise.all([
    db.select({ id: places.id, name: places.name, type: places.type, latitude: places.latitude, longitude: places.longitude }).from(places).where(and(eq(places.tenantId, tenantId), eq(places.status, "approved"), sql`${places.latitude} IS NOT NULL`, sql`${places.longitude} IS NOT NULL`)).orderBy(asc(places.name)),
    db.select({ id: events.id, title: events.title, startsAt: events.startsAt, latitude: events.latitude, longitude: events.longitude }).from(events).where(and(eq(events.tenantId, tenantId), eq(events.status, "approved"), gte(events.startsAt, new Date()), sql`${events.latitude} IS NOT NULL`, sql`${events.longitude} IS NOT NULL`)).orderBy(asc(events.startsAt)),
  ]);
  return { places: placePoints, events: eventPoints };
}

export async function listCategories(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.tenantId, tenantId)).orderBy(asc(categories.name));
}

export async function listUpcomingEvents(tenantId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(and(eq(events.tenantId, tenantId), eq(events.status, "approved"), gte(events.startsAt, new Date()))).orderBy(asc(events.startsAt)).limit(limit);
}

export async function getDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) return { places: 0, events: 0, attendance: 0, pending: 0 };
  const [placeRows, eventRows, attendanceRows, pendingRows] = await Promise.all([
    db.select({ value: count() }).from(places).where(and(eq(places.tenantId, tenantId), eq(places.status, "approved"))),
    db.select({ value: count() }).from(events).where(and(eq(events.tenantId, tenantId), eq(events.status, "approved"))),
    db.select({ value: count() }).from(attendance).where(eq(attendance.tenantId, tenantId)),
    db.select({ value: count() }).from(submissions).where(and(eq(submissions.tenantId, tenantId), eq(submissions.status, "pending"))),
  ]);
  return { places: placeRows[0]?.value ?? 0, events: eventRows[0]?.value ?? 0, attendance: attendanceRows[0]?.value ?? 0, pending: pendingRows[0]?.value ?? 0 };
}

export async function listPendingSubmissions(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(and(eq(submissions.tenantId, tenantId), eq(submissions.status, "pending"))).orderBy(desc(submissions.createdAt)).limit(50);
}

export async function createSubmission(input: { tenantId: number; submittedBy: number; entityType: "place" | "event" | "review" | "comment" | "photo"; entityId?: number; payload: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(submissions).values({ ...input, status: "pending" });
  return result;
}

export async function createReview(input: { tenantId: number; placeId: number; authorId: number; rating: number; body?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(reviews).values({ ...input, body: input.body ?? null, status: "pending" });
  return Number(result[0].insertId);
}

export async function createComment(input: { tenantId: number; entityType: "place" | "event"; entityId: number; authorId: number; body: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(comments).values({ ...input, status: "pending" });
  return Number(result[0].insertId);
}

export async function listPublicReviews(placeId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: reviews.id, rating: reviews.rating, body: reviews.body, createdAt: reviews.createdAt, authorName: users.name }).from(reviews).leftJoin(users, eq(users.id, reviews.authorId)).where(and(eq(reviews.placeId, placeId), eq(reviews.tenantId, tenantId), eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt)).limit(50);
}

export async function listPublicComments(entityType: "place" | "event", entityId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: comments.id, body: comments.body, createdAt: comments.createdAt, authorName: users.name }).from(comments).leftJoin(users, eq(users.id, comments.authorId)).where(and(eq(comments.entityType, entityType), eq(comments.entityId, entityId), eq(comments.tenantId, tenantId), eq(comments.status, "approved"))).orderBy(desc(comments.createdAt)).limit(50);
}

export async function reviewSubmission(input: { id: number; tenantId: number; reviewerId: number; status: "approved" | "rejected" | "needs_changes"; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const submission = await db.select().from(submissions).where(and(eq(submissions.id, input.id), eq(submissions.tenantId, input.tenantId))).limit(1);
  if (!submission[0]) throw new Error("Submission not found");
  await db.update(submissions).set({ status: input.status, reviewedBy: input.reviewerId, reviewedAt: new Date(), reviewNote: input.note ?? null }).where(and(eq(submissions.id, input.id), eq(submissions.tenantId, input.tenantId)));
  if (input.status === "approved" && !submission[0].entityId && (submission[0].entityType === "place" || submission[0].entityType === "event")) {
    const payload = JSON.parse(submission[0].payload) as Record<string, unknown>;
    if (submission[0].entityType === "place") {
      const created = await db.insert(places).values({ tenantId: input.tenantId, submittedBy: submission[0].submittedBy, name: String(payload.name ?? "Novo local"), slug: String(payload.slug ?? `contribuicao-${submission[0].id}`), type: payload.type ? String(payload.type) : null, description: payload.description ? String(payload.description) : null, city: "Adamantina", state: "SP", status: "approved" });
      await db.update(submissions).set({ entityId: Number(created[0].insertId) }).where(eq(submissions.id, input.id));
    } else {
      const created = await db.insert(events).values({ tenantId: input.tenantId, submittedBy: submission[0].submittedBy, title: String(payload.title ?? "Novo evento"), slug: String(payload.slug ?? `contribuicao-${submission[0].id}`), description: payload.description ? String(payload.description) : null, startsAt: payload.startsAt ? new Date(String(payload.startsAt)) : new Date(), status: "approved" });
      await db.update(submissions).set({ entityId: Number(created[0].insertId) }).where(eq(submissions.id, input.id));
    }
  }
  if (submission[0].entityId && (input.status === "approved" || input.status === "rejected")) {
    const nextStatus = input.status === "approved" ? "approved" : "rejected";
    if (submission[0].entityType === "review") await db.update(reviews).set({ status: nextStatus }).where(and(eq(reviews.id, submission[0].entityId), eq(reviews.tenantId, input.tenantId)));
    if (submission[0].entityType === "comment") await db.update(comments).set({ status: nextStatus }).where(and(eq(comments.id, submission[0].entityId), eq(comments.tenantId, input.tenantId)));
  }
  await db.insert(auditLogs).values({ tenantId: input.tenantId, actorId: input.reviewerId, action: `submission.${input.status}`, entityType: "submission", entityId: input.id, metadata: input.note ?? null });
}

export async function recordAttendance(input: { tenantId: number; eventId: number; visitorHash: string; residenceCity?: string; residenceState?: string; residenceCountry?: string; source: "portal" | "qr_code" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const recent = await db.select({ id: attendance.id }).from(attendance).where(and(eq(attendance.eventId, input.eventId), eq(attendance.visitorHash, input.visitorHash), gte(attendance.createdAt, sql`DATE_SUB(NOW(), INTERVAL 12 HOUR)`))).limit(1);
  if (recent.length > 0) return { accepted: false, duplicate: true };
  await db.insert(attendance).values(input);
  return { accepted: true, duplicate: false };
}

export async function listAdminPlaces(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(places).where(eq(places.tenantId, tenantId)).orderBy(desc(places.updatedAt)).limit(200);
}

export async function listAdminEvents(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.tenantId, tenantId)).orderBy(desc(events.startsAt)).limit(200);
}

export async function createPlace(input: typeof places.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(places).values(input);
  return result;
}

export async function updatePlace(id: number, tenantId: number, input: Partial<typeof places.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(places).set(input).where(and(eq(places.id, id), eq(places.tenantId, tenantId)));
}

export async function createEvent(input: typeof events.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(events).values(input);
}

export async function updateEvent(id: number, tenantId: number, input: Partial<typeof events.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(events).set(input).where(and(eq(events.id, id), eq(events.tenantId, tenantId)));
}

export async function createMedia(input: typeof media.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(media).values(input);
  return input;
}

export async function createQrCode(input: typeof qrCodes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(qrCodes).values(input);
  return input;
}

export async function listQrCodes(eventId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(qrCodes).where(and(eq(qrCodes.eventId, eventId), eq(qrCodes.tenantId, tenantId))).orderBy(desc(qrCodes.createdAt));
}

export async function getQrCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(qrCodes).where(and(eq(qrCodes.code, code), eq(qrCodes.active, 1))).limit(1);
  return result[0];
}

export async function listItineraries(tenantId: number, ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const filters = ownerId ? and(eq(itineraries.tenantId, tenantId), eq(itineraries.ownerId, ownerId)) : and(eq(itineraries.tenantId, tenantId), eq(itineraries.status, "published"));
  return db.select().from(itineraries).where(filters).orderBy(desc(itineraries.updatedAt));
}

export async function getItinerary(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const route = await db.select().from(itineraries).where(and(eq(itineraries.id, id), eq(itineraries.tenantId, tenantId))).limit(1);
  if (!route[0]) return undefined;
  const items = await db.select().from(itineraryItems).where(eq(itineraryItems.itineraryId, id)).orderBy(asc(itineraryItems.position));
  const enrichedItems = await Promise.all(items.map(async (item) => {
    const place = item.placeId ? await db.select({ name: places.name, latitude: places.latitude, longitude: places.longitude }).from(places).where(eq(places.id, item.placeId)).limit(1) : [];
    const event = item.eventId ? await db.select({ title: events.title, latitude: events.latitude, longitude: events.longitude }).from(events).where(eq(events.id, item.eventId)).limit(1) : [];
    const source = place[0] ?? event[0];
    return { ...item, label: place[0]?.name ?? event[0]?.title ?? item.note ?? `Parada ${item.position + 1}`, latitude: source?.latitude ?? null, longitude: source?.longitude ?? null };
  }));
  return { ...route[0], items: enrichedItems };
}

export async function createItinerary(input: typeof itineraries.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(itineraries).values(input);
  return Number(result[0].insertId);
}

export async function updateItinerary(id: number, tenantId: number, ownerId: number, input: Partial<typeof itineraries.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(itineraries).set(input).where(and(eq(itineraries.id, id), eq(itineraries.tenantId, tenantId), eq(itineraries.ownerId, ownerId)));
}

export async function deleteItinerary(id: number, tenantId: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(itineraryItems).where(eq(itineraryItems.itineraryId, id));
  await db.delete(itineraries).where(and(eq(itineraries.id, id), eq(itineraries.tenantId, tenantId), eq(itineraries.ownerId, ownerId)));
}

export async function addItineraryItem(input: typeof itineraryItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(itineraryItems).values(input);
}

export async function deleteItineraryItem(id: number, itineraryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(itineraryItems).where(and(eq(itineraryItems.id, id), eq(itineraryItems.itineraryId, itineraryId)));
}

export async function updateItineraryItemPositions(items: Array<{ id: number; position: number }>, itineraryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  for (const item of items) await db.update(itineraryItems).set({ position: item.position }).where(and(eq(itineraryItems.id, item.id), eq(itineraryItems.itineraryId, itineraryId)));
}

export async function listTenantUsers(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.tenantId, tenantId)).orderBy(desc(users.createdAt));
}

export async function updateTenantUser(id: number, tenantId: number, input: { role?: "municipal_admin" | "moderator" | "analyst" | "partner"; status?: "active" | "invited" | "suspended" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set(input).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
}

export async function createInvitation(input: typeof invitations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(invitations).values(input);
}

export async function listTenantInvitations(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.tenantId, tenantId)).orderBy(desc(invitations.createdAt));
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  return result[0];
}

export async function acceptInvitation(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const invitation = await getInvitationByToken(token);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) throw new Error("Invitation invalid or expired");
  await db.update(users).set({ tenantId: invitation.tenantId, role: invitation.role, status: "active" }).where(eq(users.id, userId));
  await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id));
  return invitation;
}

export async function getReportSummary(tenantId: number, start: Date, end: Date) {
  const db = await getDb();
  if (!db) return { places: 0, events: 0, attendance: 0, pending: 0, origin: [] as Array<{ label: string; value: number }> };
  const [placesRows, eventRows, attendanceRows, pendingRows, originRows] = await Promise.all([
    db.select({ value: count() }).from(places).where(and(eq(places.tenantId, tenantId), gte(places.createdAt, start), sql`${places.createdAt} <= ${end}`)),
    db.select({ value: count() }).from(events).where(and(eq(events.tenantId, tenantId), gte(events.startsAt, start), sql`${events.startsAt} <= ${end}`)),
    db.select({ value: count() }).from(attendance).where(and(eq(attendance.tenantId, tenantId), gte(attendance.createdAt, start), sql`${attendance.createdAt} <= ${end}`)),
    db.select({ value: count() }).from(submissions).where(and(eq(submissions.tenantId, tenantId), eq(submissions.status, "pending"))),
    db.select({ label: sql<string>`COALESCE(${attendance.residenceState}, 'Não informado')`, value: count() }).from(attendance).where(and(eq(attendance.tenantId, tenantId), gte(attendance.createdAt, start), sql`${attendance.createdAt} <= ${end}`)).groupBy(attendance.residenceState).orderBy(desc(count())),
  ]);
  return { places: placesRows[0]?.value ?? 0, events: eventRows[0]?.value ?? 0, attendance: attendanceRows[0]?.value ?? 0, pending: pendingRows[0]?.value ?? 0, origin: originRows };
}

export async function listActiveTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: tenants.id, name: tenants.name, slug: tenants.slug }).from(tenants).where(eq(tenants.status, "active")).orderBy(asc(tenants.name));
}

export async function getComparativeReport(tenantIds: number[], start: Date, end: Date) {
  const db = await getDb();
  if (!db) return { municipalities: [], events: [], seasonality: [] };
  const municipalities = [];
  for (const tenantId of tenantIds) {
    const tenant = await db.select({ id: tenants.id, name: tenants.name, slug: tenants.slug }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (tenant[0]) municipalities.push({ ...tenant[0], ...(await getReportSummary(tenantId, start, end)) });
  }
  const eventRows = await db.select({ tenantId: events.tenantId, eventId: events.id, title: events.title, attendance: count(attendance.id) }).from(events).leftJoin(attendance, eq(attendance.eventId, events.id)).where(and(gte(events.startsAt, start), sql`${events.startsAt} <= ${end}`)).groupBy(events.tenantId, events.id, events.title).orderBy(desc(count(attendance.id))).limit(100);
  const seasonalityRows = await db.select({ month: sql<number>`MONTH(${attendance.createdAt})`, attendance: count() }).from(attendance).where(and(gte(attendance.createdAt, start), sql`${attendance.createdAt} <= ${end}`)).groupBy(sql`MONTH(${attendance.createdAt})`).orderBy(sql`MONTH(${attendance.createdAt})`);
  return { municipalities, events: eventRows.filter((row) => tenantIds.includes(row.tenantId)), seasonality: seasonalityRows };
}
