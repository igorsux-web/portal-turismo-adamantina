import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, index } from "drizzle-orm/mysql-core";

export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  state: varchar("state", { length: 2 }).notNull().default("SP"),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  tenantId: int("tenantId"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "platform_admin", "municipal_admin", "moderator", "analyst", "partner"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "invited", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({ tenantIdx: index("users_tenant_idx").on(table.tenantId) }));

export const visitorProfiles = mysqlTable("visitorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 160 }),
  bio: text("bio"),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 80 }),
  country: varchar("country", { length: 80 }).default("Brasil"),
  interests: text("interests"),
  profileVisibility: mysqlEnum("profileVisibility", ["private", "public"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const places = mysqlTable("places", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 120 }),
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 120 }),
  city: varchar("city", { length: 120 }).notNull().default("Adamantina"),
  state: varchar("state", { length: 2 }).notNull().default("SP"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  website: text("website"),
  socialLinks: text("socialLinks"),
  openingHours: text("openingHours"),
  accessibility: text("accessibility"),
  priceRange: varchar("priceRange", { length: 30 }),
  capacity: int("capacity"),
  cadasturNumber: varchar("cadasturNumber", { length: 80 }),
  cadasturStatus: mysqlEnum("cadasturStatus", ["not_informed", "pending", "validated", "rejected"]).default("not_informed").notNull(),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "archived"]).default("draft").notNull(),
  submittedBy: int("submittedBy"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ tenantStatusIdx: index("places_tenant_status_idx").on(table.tenantId, table.status) }));

export const placeProfiles = mysqlTable("placeProfiles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  placeId: int("placeId").notNull().unique(),
  serviceTags: text("serviceTags"),
  accommodationRooms: int("accommodationRooms"),
  accommodationBeds: int("accommodationBeds"),
  restaurantSeats: int("restaurantSeats"),
  cuisineType: varchar("cuisineType", { length: 160 }),
  attractionDurationMinutes: int("attractionDurationMinutes"),
  bookingUrl: text("bookingUrl"),
  reservationPhone: varchar("reservationPhone", { length: 40 }),
  acceptsPets: int("acceptsPets").default(0).notNull(),
  hasParking: int("hasParking").default(0).notNull(),
  accessibilityFeatures: text("accessibilityFeatures"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ tenantPlaceIdx: index("place_profiles_tenant_place_idx").on(table.tenantId, table.placeId) }));

export const placeResponsibles = mysqlTable("placeResponsibles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  placeId: int("placeId").notNull().unique(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  cpfCiphertext: text("cpfCiphertext"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  licenseType: varchar("licenseType", { length: 120 }),
  licenseNumber: varchar("licenseNumber", { length: 120 }),
  consentAt: timestamp("consentAt"),
  createdBy: int("createdBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ tenantPlaceIdx: index("place_responsibles_tenant_place_idx").on(table.tenantId, table.placeId) }));

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  description: text("description"),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  venueName: varchar("venueName", { length: 180 }),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  organizer: varchar("organizer", { length: 180 }),
  capacity: int("capacity"),
  price: varchar("price", { length: 80 }),
  accessibility: text("accessibility"),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "archived"]).default("draft").notNull(),
  submittedBy: int("submittedBy"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ tenantStartIdx: index("events_tenant_start_idx").on(table.tenantId, table.startsAt) }));

export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  submittedBy: int("submittedBy").notNull(),
  entityType: mysqlEnum("entityType", ["place", "event", "review", "comment", "photo"]).notNull(),
  entityId: int("entityId"),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "needs_changes"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ tenantStatusIdx: index("submissions_tenant_status_idx").on(table.tenantId, table.status) }));

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  placeId: int("placeId").notNull(),
  authorId: int("authorId").notNull(),
  rating: int("rating").notNull(),
  body: text("body"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  entityType: mysqlEnum("entityType", ["place", "event"]).notNull(),
  entityId: int("entityId").notNull(),
  authorId: int("authorId").notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  eventId: int("eventId").notNull(),
  visitorHash: varchar("visitorHash", { length: 128 }).notNull(),
  residenceCity: varchar("residenceCity", { length: 120 }),
  residenceState: varchar("residenceState", { length: 80 }),
  residenceCountry: varchar("residenceCountry", { length: 80 }).default("Brasil"),
  source: mysqlEnum("source", ["portal", "qr_code"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ tenantEventIdx: index("attendance_tenant_event_idx").on(table.tenantId, table.eventId) }));

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  actorId: int("actorId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 80 }),
  entityId: int("entityId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ tenantCreatedIdx: index("audit_tenant_created_idx").on(table.tenantId, table.createdAt) }));

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  entityType: mysqlEnum("entityType", ["place", "event"]).notNull(),
  entityId: int("entityId").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  altText: varchar("altText", { length: 240 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ entityIdx: index("media_entity_idx").on(table.tenantId, table.entityType, table.entityId) }));

export const qrCodes = mysqlTable("qrCodes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  eventId: int("eventId").notNull(),
  code: varchar("code", { length: 96 }).notNull().unique(),
  label: varchar("label", { length: 120 }),
  active: int("active").notNull().default(1),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ eventIdx: index("qr_codes_event_idx").on(table.tenantId, table.eventId) }));

export const itineraries = mysqlTable("itineraries", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  ownerId: int("ownerId"),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes"),
  distanceKm: decimal("distanceKm", { precision: 8, scale: 2 }),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ tenantStatusIdx: index("itineraries_tenant_status_idx").on(table.tenantId, table.status) }));

export const itineraryItems = mysqlTable("itineraryItems", {
  id: int("id").autoincrement().primaryKey(),
  itineraryId: int("itineraryId").notNull(),
  placeId: int("placeId"),
  eventId: int("eventId"),
  position: int("position").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ itineraryIdx: index("itinerary_items_itinerary_idx").on(table.itineraryId, table.position) }));

export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["municipal_admin", "moderator", "analyst", "partner"]).notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ tenantEmailIdx: index("invitations_tenant_email_idx").on(table.tenantId, table.email) }));

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type VisitorProfile = typeof visitorProfiles.$inferSelect;
export type Place = typeof places.$inferSelect;
export type PlaceProfile = typeof placeProfiles.$inferSelect;
export type PlaceResponsible = typeof placeResponsibles.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Media = typeof media.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type Itinerary = typeof itineraries.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
